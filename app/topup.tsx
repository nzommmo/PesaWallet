import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, CheckCircle, Plus, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosinstance';

const topup = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [primaryAccount, setPrimaryAccount] = useState(null);

  useEffect(() => {
    fetchPrimaryAccount();
  }, []);

  const fetchPrimaryAccount = async () => {
    setLoadingAccount(true);
    try {
      const response = await axiosInstance.get('/accounts/');
      const primary = response.find(acc => acc.account_type === 'PRIMARY');
      
      if (primary) {
        setPrimaryAccount({
          ...primary,
          balance: parseFloat(primary.balance) || 0
        });
      } else {
        setError('Primary account not found. Please contact support.');
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load account information. Please try again.');
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleTopUp = async () => {
    setError('');
    setSuccess(false);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!primaryAccount) {
      setError('Primary account not found');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/top-up/', {
        account_id: primaryAccount.id,
        amount: parseFloat(amount),
        description: description.trim() || undefined
      });

      setSuccess(true);
      
      setPrimaryAccount({
        ...primaryAccount,
        balance: parseFloat(primaryAccount.balance) + parseFloat(amount)
      });

      setAmount('');
      setDescription('');

      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (err) {
      console.error('Top up error:', err);
      setError(err.message || 'Failed to Top Up Account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            className="p-2 rounded-lg"
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Top Up Account</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Loading State */}
          {loadingAccount && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex-row items-start gap-3">
              <CheckCircle size={20} color="#16a34a" />
              <Text className="flex-1 text-sm text-green-800 font-medium">
                Account Topped Up successfully! Redirecting...
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
              <AlertCircle size={20} color="#dc2626" />
              <Text className="flex-1 text-sm text-red-800">{error}</Text>
            </View>
          )}

          {!loadingAccount && primaryAccount && (
            <>
              {/* Primary Account Card */}
              <View className="bg-green-500 rounded-2xl p-6 mb-6 shadow-lg">
                <View className="flex-row items-center gap-2 mb-2">
                  <TrendingUp size={20} color="#dcfce7" />
                  <Text className="text-sm text-green-100">Primary Account</Text>
                </View>
                <Text className="text-3xl font-bold text-white mb-2">
                  KES {Math.round(primaryAccount.balance).toLocaleString()}
                </Text>
                <Text className="text-green-100 text-sm">Current Balance</Text>
              </View>

              {/* Amount Input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setError('');
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 text-lg"
                />
                {amount && parseFloat(amount) > 0 && (
                  <View className="mt-3 p-3 bg-green-50 rounded-xl">
                    <Text className="text-sm text-gray-600">New balance will be:</Text>
                    <Text className="text-lg font-bold text-green-600">
                      KES {Math.round(primaryAccount.balance + parseFloat(amount)).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Amount Buttons */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Quick Amounts
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {quickAmounts.map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      onPress={() => setAmount(quickAmount.toString())}
                      disabled={loading}
                      className="w-[48%] px-4 py-3 border-2 border-gray-200 rounded-xl bg-white"
                    >
                      <Text className="font-medium text-gray-900 text-center">
                        KES {quickAmount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description (Optional) */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Monthly Salary, Freelance Payment"
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                />
              </View>

              {/* Top Up Button */}
              <TouchableOpacity
                onPress={handleTopUp}
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                  loading || !amount || parseFloat(amount) <= 0
                    ? 'bg-gray-300'
                    : 'bg-green-600'
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold">Topping Up...</Text>
                  </>
                ) : (
                  <>
                    <Plus size={20} color="#fff" />
                    <Text className="text-white font-semibold">Top Up</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Card */}
              <View className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <View className="flex-row items-start gap-3">
                  <AlertCircle size={20} color="#2563eb" />
                  <View className="flex-1">
                    <Text className="font-semibold text-blue-900 text-sm mb-1">
                      About Top Up
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Topping Up will increase your Primary Account balance. You can then allocate 
                      funds to your digital envelopes using the Transfer feature.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {!loadingAccount && !primaryAccount && !error && (
            <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
              <AlertCircle size={48} color="#9ca3af" />
              <Text className="text-gray-600 mt-3 mb-4">No primary account found</Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text className="text-blue-600 font-medium">Go to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default topup;