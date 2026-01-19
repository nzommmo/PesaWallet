import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosinstance';

const transfer = () => {
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState([]);

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await axiosInstance.get('/accounts/');
      // Ensure balance is a number
      const accountsWithNumbers = response.map(acc => ({
        ...acc,
        balance: parseFloat(acc.balance) || 0
      }));
      setAccounts(accountsWithNumbers);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleTransfer = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!fromAccount) {
      setError('Please select a source account');
      return;
    }
    if (!toAccount) {
      setError('Please select a destination account');
      return;
    }
    if (fromAccount === toAccount) {
      setError('Source and destination accounts cannot be the same');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if source account has sufficient balance
    const sourceAcc = accounts.find(acc => acc.id === parseInt(fromAccount));
    if (sourceAcc && parseFloat(amount) > sourceAcc.balance) {
      setError(`Insufficient balance. Available: KES ${sourceAcc.balance.toLocaleString()}`);
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/allocate/', {
        source_account: parseInt(fromAccount),
        destination_account: parseInt(toAccount),
        amount: parseFloat(amount)
      });

      setSuccess(true);
      
      // Show success message and redirect after 2 seconds
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message || 'Failed to transfer funds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedFromAccount = accounts.find(acc => acc.id === parseInt(fromAccount));
  const selectedToAccount = accounts.find(acc => acc.id === parseInt(toAccount));

  // Get available accounts for "To" dropdown (exclude selected From account)
  const availableToAccounts = accounts.filter(acc => acc.id !== parseInt(fromAccount));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              className="p-2 rounded-lg"
            >
              <Text className="text-gray-700 text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-900">Transfer Funds</Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Loading State */}
          {loadingAccounts && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex-row items-start gap-3">
              <Text className="text-green-600 text-lg">✓</Text>
              <View className="flex-1">
                <Text className="text-sm text-green-800 font-medium">
                  Transfer successful! Redirecting...
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
              <Text className="text-red-600 text-lg">⚠️</Text>
              <Text className="flex-1 text-sm text-red-800">{error}</Text>
            </View>
          )}

          {!loadingAccounts && accounts.length === 0 && (
            <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
              <Text className="text-4xl text-gray-400 mb-3">⚠️</Text>
              <Text className="text-gray-600 mb-4">No accounts found</Text>
              <TouchableOpacity onPress={() => router.push('/envelopes/create')}>
                <Text className="text-blue-600 font-medium">
                  Create your first envelope
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingAccounts && accounts.length > 0 && (
            <>
              {/* From Account */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  From Account
                </Text>
                <View className="border border-gray-300 rounded-xl bg-white overflow-hidden">
                  <Picker
                    selectedValue={fromAccount}
                    onValueChange={(value) => {
                      setFromAccount(value);
                      setError('');
                    }}
                    enabled={!loading}
                  >
                    <Picker.Item label="Select account" value="" />
                    {accounts.map((account) => (
                      <Picker.Item
                        key={account.id}
                        label={`${account.account_name} - KES ${Math.round(account.balance).toLocaleString()}`}
                        value={account.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
                {selectedFromAccount && (
                  <Text className="text-xs text-gray-500 mt-2">
                    Available balance: KES {Math.round(selectedFromAccount.balance).toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Arrow Icon */}
              <View className="items-center mb-6">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                  <Text className="text-blue-600 text-2xl">↓</Text>
                </View>
              </View>

              {/* To Account */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  To Account
                </Text>
                <View className={`border border-gray-300 rounded-xl overflow-hidden ${
                  loading || !fromAccount ? 'bg-gray-100' : 'bg-white'
                }`}>
                  <Picker
                    selectedValue={toAccount}
                    onValueChange={(value) => {
                      setToAccount(value);
                      setError('');
                    }}
                    enabled={!loading && !!fromAccount}
                  >
                    <Picker.Item label="Select account" value="" />
                    {availableToAccounts.map((account) => (
                      <Picker.Item
                        key={account.id}
                        label={`${account.account_name} - KES ${Math.round(account.balance).toLocaleString()}`}
                        value={account.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
                {selectedToAccount && (
                  <Text className="text-xs text-gray-500 mt-2">
                    Current balance: KES {Math.round(selectedToAccount.balance).toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Amount */}
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
                  editable={!loading}
                  keyboardType="numeric"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
                {selectedFromAccount && selectedToAccount && amount && parseFloat(amount) > 0 && (
                  <View className="mt-3 p-3 bg-blue-50 rounded-xl">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm text-gray-600">
                        From: {selectedFromAccount.account_name}
                      </Text>
                      <Text className="text-sm font-medium text-gray-900">
                        KES {Math.round(selectedFromAccount.balance - parseFloat(amount)).toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600">
                        To: {selectedToAccount.account_name}
                      </Text>
                      <Text className="text-sm font-medium text-gray-900">
                        KES {Math.round(selectedToAccount.balance + parseFloat(amount)).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Transfer Button */}
              <TouchableOpacity
                onPress={handleTransfer}
                disabled={loading || !fromAccount || !toAccount || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 rounded-xl items-center flex-row justify-center gap-2 ${
                  loading || !fromAccount || !toAccount || !amount || parseFloat(amount) <= 0
                    ? 'bg-gray-300'
                    : 'bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold">Processing Transfer...</Text>
                  </>
                ) : (
                  <Text className="text-white font-semibold">Transfer Funds</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default transfer;