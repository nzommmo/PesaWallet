import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

const create = () => {
  const { id } = useLocalSearchParams(); // For edit mode
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [toastOpacity] = useState(new Animated.Value(0));

  // Form state
  const [sourceName, setSourceName] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const frequencyOptions = [
    { value: '', label: 'Select frequency' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'FORTNIGHT', label: 'Fortnight' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'ONE_OFF', label: 'One Off' }
  ];

  useEffect(() => {
    fetchAccounts();
    if (id) {
      fetchIncomeDetails();
    }
  }, [id]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2700),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast({ show: false, message: '', type: '' });
      });
    }
  }, [toast.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/accounts/');
      setAccounts(response || []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeDetails = async () => {
    try {
      const response = await axiosInstance.get(`/incomes/${id}/`);
      setSourceName(response.source_name || '');
      setSelectedAccount(response.account.toString());
      setAmount(response.amount.toString());
      setFrequency(response.frequency || '');
      setDescription(response.description || '');
    } catch (err) {
      console.error('Failed to fetch income details:', err);
      setError('Failed to load income details.');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!sourceName.trim()) {
      errors.source_name = 'Source name is required';
    }

    if (!selectedAccount) {
      errors.account_id = 'Please select an account';
    }

    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    if (!frequency) {
      errors.frequency = 'Please select frequency';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormErrors({});

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const incomeData = {
        source_name: sourceName.trim(),
        account_id: parseInt(selectedAccount),
        amount: parseFloat(amount),
        frequency: frequency,
        description: description.trim()
      };

      if (id) {
        await axiosInstance.put(`/incomes/${id}/`, incomeData);
        showToast('Income updated successfully!');
      } else {
        await axiosInstance.post('/incomes/', incomeData);
        showToast('Income added successfully!');
      }

      setTimeout(() => {
        router.replace('/income');
      }, 1500);
    } catch (err) {
      console.error('Failed to save income:', err);
      
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ 
          general: err.message || `Failed to ${id ? 'update' : 'add'} income. Please try again.` 
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <Animated.View 
          style={{ opacity: toastOpacity }}
          className="absolute top-4 left-6 right-6 z-50"
        >
          <View className={`px-6 py-3 rounded-xl shadow-lg flex-row items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <Text className="text-white text-lg">
              {toast.type === 'success' ? '✓' : '⚠️'}
            </Text>
            <Text className="text-white font-medium flex-1">{toast.message}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={submitting}
            className="p-2 rounded-lg"
          >
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">
            {id ? 'Edit Income' : 'Add Income'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}

        {/* Error Message */}
        {error && !loading && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
            <Text className="text-red-600 text-lg">⚠️</Text>
            <View className="flex-1">
              <Text className="text-sm text-red-800">{error}</Text>
              <TouchableOpacity
                onPress={() => {
                  fetchAccounts();
                  if (id) fetchIncomeDetails();
                }}
                className="mt-2"
              >
                <Text className="text-sm text-red-600 font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loading && !error && (
          <View className="bg-white rounded-2xl p-6 border border-gray-100">
            {/* General Form Error */}
            {formErrors.general && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
                <Text className="text-red-600 text-lg">⚠️</Text>
                <Text className="flex-1 text-sm text-red-800">{formErrors.general}</Text>
              </View>
            )}

            <View className="gap-6">
              {/* Source Name */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Source Name <Text className="text-red-600">*</Text>
                </Text>
                <TextInput
                  value={sourceName}
                  onChangeText={(text) => {
                    setSourceName(text);
                    if (formErrors.source_name) {
                      setFormErrors({ ...formErrors, source_name: undefined });
                    }
                  }}
                  editable={!submitting}
                  className={`w-full px-4 py-3 border rounded-xl ${
                    formErrors.source_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  } text-gray-900`}
                  placeholder="e.g., Salary, Freelance, Bonus"
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.source_name && (
                  <Text className="text-xs text-red-600 mt-1">{formErrors.source_name}</Text>
                )}
              </View>

              {/* Account Selection */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Account <Text className="text-red-600">*</Text>
                </Text>
                <View className={`border rounded-xl overflow-hidden ${
                  formErrors.account_id ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}>
                  <Picker
                    selectedValue={selectedAccount}
                    onValueChange={(value) => {
                      setSelectedAccount(value);
                      if (formErrors.account_id) {
                        setFormErrors({ ...formErrors, account_id: undefined });
                      }
                    }}
                    enabled={!submitting}
                  >
                    <Picker.Item label="Select an account" value="" />
                    {accounts.map((account) => (
                      <Picker.Item
                        key={account.id}
                        label={`${account.name} (KES ${parseFloat(account.balance || 0).toLocaleString()})`}
                        value={account.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
                {formErrors.account_id && (
                  <Text className="text-xs text-red-600 mt-1">{formErrors.account_id}</Text>
                )}
                <Text className="text-xs text-gray-500 mt-2">
                  Choose which account will receive this income
                </Text>
              </View>

              {/* Amount */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Amount (KES) <Text className="text-red-600">*</Text>
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    if (formErrors.amount) {
                      setFormErrors({ ...formErrors, amount: undefined });
                    }
                  }}
                  editable={!submitting}
                  keyboardType="decimal-pad"
                  className={`w-full px-4 py-3 border rounded-xl ${
                    formErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  } text-gray-900`}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.amount && (
                  <Text className="text-xs text-red-600 mt-1">{formErrors.amount}</Text>
                )}
              </View>

              {/* Frequency */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Frequency <Text className="text-red-600">*</Text>
                </Text>
                <View className={`border rounded-xl overflow-hidden ${
                  formErrors.frequency ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}>
                  <Picker
                    selectedValue={frequency}
                    onValueChange={(value) => {
                      setFrequency(value);
                      if (formErrors.frequency) {
                        setFormErrors({ ...formErrors, frequency: undefined });
                      }
                    }}
                    enabled={!submitting}
                  >
                    {frequencyOptions.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
                {formErrors.frequency && (
                  <Text className="text-xs text-red-600 mt-1">{formErrors.frequency}</Text>
                )}
                <Text className="text-xs text-gray-500 mt-2">
                  How often do you receive this income?
                </Text>
              </View>

              {/* Description (Optional) */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Description <Text className="text-gray-400 text-xs">(Optional)</Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  editable={!submitting}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                  placeholder="Add any additional notes about this income..."
                  placeholderTextColor="#9ca3af"
                />
                <Text className="text-xs text-gray-500 mt-2">
                  Optional details about this income source
                </Text>
              </View>

              {/* Preview */}
              {sourceName && selectedAccount && amount && parseFloat(amount) > 0 && frequency && (
                <View className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <Text className="text-sm text-gray-600 mb-2">Summary</Text>
                  <Text className="text-lg font-semibold text-green-700 mb-1">
                    {sourceName} - {frequencyOptions.find(f => f.value === frequency)?.label}
                  </Text>
                  <Text className="text-base text-green-600">
                    KES {parseFloat(amount).toLocaleString()} will be added to{' '}
                    {accounts.find(acc => acc.id === parseInt(selectedAccount))?.name}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View className="flex-row gap-3 pt-4">
                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 px-4 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
                    submitting ? 'bg-green-400' : 'bg-green-600'
                  }`}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text className="text-white font-semibold">
                        {id ? 'Updating...' : 'Adding...'}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white font-semibold">
                      {id ? 'Update Income' : 'Add Income'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default create;