import AsyncStorage from '@react-native-async-storage/async-storage';
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
import axiosInstance from '../../axiosinstance';

const Payments = () => {
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [paymentType, setPaymentType] = useState('SENDMONEY');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  
  // Data State
  const [accounts, setAccounts] = useState([]);
  const [defaultMpesaNumber, setDefaultMpesaNumber] = useState('');

  const paymentTypes = [
    { id: 'SENDMONEY', name: 'Send Money', icon: '💸' },
    { id: 'PAYBILL', name: 'PayBill', icon: '📄' },
    { id: 'BUYGOOD', name: 'Buy Goods', icon: '🛍️' }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await axiosInstance.get('/accounts/');
      const accountsWithNumbers = response.map(acc => ({
        ...acc,
        balance: parseFloat(acc.balance) || 0
      }));
      setAccounts(accountsWithNumbers);
      
      // Auto-select the first account
      if (accountsWithNumbers.length > 0) {
        setSourceAccountId(accountsWithNumbers[0].id.toString());
      }
      
      // Get user data to fetch default M-Pesa number
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setDefaultMpesaNumber(user.default_mpesa_number || user.phone_number || '');
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleMakePayment = async () => {
    setError('');
    setSuccess(false);

    // Validate source account
    if (!sourceAccountId) {
      setError('Please select a source account');
      return;
    }

    // Validation based on payment type
    if (paymentType === 'SENDMONEY') {
      if (!recipientPhone.trim()) {
        setError('Please enter recipient phone number');
        return;
      }
      if (!/^(07|01)\d{8}$/.test(recipientPhone.replace(/\s+/g, ''))) {
        setError('Invalid phone number format (e.g., 0712345678)');
        return;
      }
    } else if (paymentType === 'PAYBILL') {
      if (!businessNumber.trim()) {
        setError('Please enter business number');
        return;
      }
      if (!accountNumber.trim()) {
        setError('Please enter account number');
        return;
      }
    } else if (paymentType === 'BUYGOOD') {
      if (!tillNumber.trim()) {
        setError('Please enter till number');
        return;
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if sufficient balance
    const selectedAccount = accounts.find(acc => acc.id === parseInt(sourceAccountId));
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      if (selectedAccount.overspend_rule === 'BLOCK') {
        setError(`Insufficient funds in ${selectedAccount.account_name}. Available: KES ${selectedAccount.balance.toLocaleString()}`);
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentType === 'SENDMONEY') {
        // Use the transfer endpoint for Send Money
        await axiosInstance.post('/payments/transfer/', {
          recipient_phone: recipientPhone.replace(/\s+/g, ''),
          amount: parseFloat(amount).toFixed(2),
          source_account_id: parseInt(sourceAccountId)
        });
      } else {
        // Use the existing pay endpoint for PayBill and Buy Goods
        let paymentData = {
          payment_type: paymentType,
          amount: parseFloat(amount)
        };

        if (paymentType === 'PAYBILL') {
          paymentData.to_number = businessNumber.replace(/\s+/g, '');
          paymentData.account_number = accountNumber.trim();
        } else if (paymentType === 'BUYGOOD') {
          paymentData.to_number = tillNumber.replace(/\s+/g, '');
        }

        await axiosInstance.post('/pay/', paymentData);
      }
      
      setSuccess(true);
      
      // Clear form
      setRecipientPhone('');
      setBusinessNumber('');
      setAccountNumber('');
      setTillNumber('');
      setAmount('');
      
      // Refresh accounts to show updated balance
      await fetchAccounts();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.replace('/');
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to process payment. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get selected account details
  const selectedAccount = accounts.find(acc => acc.id === parseInt(sourceAccountId));

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
            <Text className="text-xl font-semibold text-gray-900">M-Pesa Payment</Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Loading Accounts */}
          {loadingAccounts && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex-row items-start gap-3">
              <Text className="text-green-600 text-lg">✓</Text>
              <Text className="flex-1 text-sm text-green-800 font-medium">
                Payment initiated successfully! Redirecting...
              </Text>
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
                <Text className="text-green-600 font-medium">
                  Create an envelope
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!loadingAccounts && accounts.length > 0 && (
            <>
              {/* Payment Type */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Payment Type
                </Text>
                <View className="flex-row gap-3">
                  {paymentTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => {
                        setPaymentType(type.id);
                        setError('');
                      }}
                      disabled={loading}
                      className={`flex-1 p-4 rounded-xl border-2 ${
                        paymentType === type.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="items-center gap-2">
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center ${
                            paymentType === type.id ? 'bg-green-600' : 'bg-gray-100'
                          }`}
                        >
                          <Text className="text-lg">
                            {type.icon}
                          </Text>
                        </View>
                        <Text className="text-xs font-medium text-gray-900 text-center">
                          {type.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Source Account Selection */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Pay From Account
                </Text>
                <View className="border border-gray-300 rounded-xl bg-white overflow-hidden">
                  <Picker
                    selectedValue={sourceAccountId}
                    onValueChange={(value) => {
                      setSourceAccountId(value);
                      setError('');
                    }}
                    enabled={!loading}
                  >
                    {accounts.map((account) => (
                      <Picker.Item
                        key={account.id}
                        label={`${account.account_name} - KES ${parseFloat(account.balance).toLocaleString()}`}
                        value={account.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
                {selectedAccount && (
                  <View className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg">👛</Text>
                      <Text className="text-xs text-gray-600 font-medium">Available Balance</Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900">
                      KES {selectedAccount.balance.toLocaleString()}
                    </Text>
                    {selectedAccount.category && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Category: {selectedAccount.category}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* From Field - Shows M-Pesa number */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  M-Pesa Number
                </Text>
                <TextInput
                  value={defaultMpesaNumber}
                  editable={false}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700"
                />
                <Text className="text-xs text-gray-500 mt-2">
                  Payment will be made from your registered M-Pesa number
                </Text>
              </View>

              {/* Recipient Fields - Changes based on payment type */}
              {paymentType === 'SENDMONEY' && (
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Recipient Phone Number
                  </Text>
                  <TextInput
                    value={recipientPhone}
                    onChangeText={(text) => {
                      setRecipientPhone(text);
                      setError('');
                    }}
                    editable={!loading}
                    keyboardType="phone-pad"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                    placeholder="0712345678"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}

              {paymentType === 'PAYBILL' && (
                <>
                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Business Number
                    </Text>
                    <TextInput
                      value={businessNumber}
                      onChangeText={(text) => {
                        setBusinessNumber(text);
                        setError('');
                      }}
                      editable={!loading}
                      keyboardType="numeric"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                      placeholder="e.g., 400200"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </Text>
                    <TextInput
                      value={accountNumber}
                      onChangeText={(text) => {
                        setAccountNumber(text);
                        setError('');
                      }}
                      editable={!loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                      placeholder="e.g., ACC12345"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </>
              )}

              {paymentType === 'BUYGOOD' && (
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Till Number
                  </Text>
                  <TextInput
                    value={tillNumber}
                    onChangeText={(text) => {
                      setTillNumber(text);
                      setError('');
                    }}
                    editable={!loading}
                    keyboardType="numeric"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                    placeholder="e.g., 123456"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}

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
                {amount && parseFloat(amount) > 0 && (
                  <View className="mt-3 p-3 bg-green-50 rounded-xl">
                    <Text className="text-xs text-gray-600 mb-1">Amount to pay:</Text>
                    <Text className="text-lg font-bold text-green-600">
                      KES {parseFloat(amount).toLocaleString()}
                    </Text>
                    {selectedAccount && parseFloat(amount) > selectedAccount.balance && (
                      <Text className="text-xs text-orange-600 mt-2">
                        ⚠️ Amount exceeds available balance
                        {selectedAccount.overspend_rule === 'BLOCK' && ' - Transaction will be blocked'}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Make Payment Button */}
              <TouchableOpacity
                onPress={handleMakePayment}
                disabled={
                  loading || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  !sourceAccountId ||
                  (paymentType === 'SENDMONEY' && !recipientPhone) ||
                  (paymentType === 'PAYBILL' && (!businessNumber || !accountNumber)) ||
                  (paymentType === 'BUYGOOD' && !tillNumber)
                }
                className={`w-full py-4 rounded-xl items-center flex-row justify-center gap-2 ${
                  loading || !amount || parseFloat(amount) <= 0 || !sourceAccountId ||
                  (paymentType === 'SENDMONEY' && !recipientPhone) ||
                  (paymentType === 'PAYBILL' && (!businessNumber || !accountNumber)) ||
                  (paymentType === 'BUYGOOD' && !tillNumber)
                    ? 'bg-gray-300'
                    : 'bg-green-600'
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold">Processing Payment...</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-lg">💸</Text>
                    <Text className="text-white font-semibold">Make Payment</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Card */}
              <View className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <View className="flex-row items-start gap-3">
                  <Text className="text-blue-600 text-lg">ℹ️</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-blue-900 text-sm mb-1">
                      About M-Pesa Payments
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Payments will be processed through M-Pesa and deducted from the selected account. You'll receive a confirmation message once the payment is complete.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payments;