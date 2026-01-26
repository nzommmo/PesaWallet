import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, RefreshCw, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState('');
  const [primaryAccount, setPrimaryAccount] = useState(null);
  const [pendingReference, setPendingReference] = useState(null);

  useEffect(() => {
    fetchPrimaryAccount();

    // Listen for deep link when returning from Paystack
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = ({ url }) => {
    console.log('Deep link received:', url);

    // Parse the URL: pesawallet://payment/verify?reference=xxx
    try {
      const urlParts = url.split('?');
      const queryString = urlParts[1];
      
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const reference = params.get('reference');
        
        if (reference) {
          console.log('Reference found from deep link:', reference);
          setPendingReference(null); // Clear pending reference
          verifyPayment(reference);
        }
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
  };

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

  const verifyPayment = async (reference) => {
    setVerifying(true);
    setError('');
    
    try {
      console.log('Verifying payment with reference:', reference);
      
      // Use fetch instead of axiosInstance because verify endpoint is public (no auth needed)
      const response = await fetch(
        `http://192.168.0.101:8000/api/top-up/verify/?reference=${reference}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.status === 'success' || data.status === 'already_processed') {
        setSuccess(true);
        setPendingReference(null);
        
        // Refresh balance immediately
        await fetchPrimaryAccount();
        
        Alert.alert(
          'Success!',
          `Payment verified! Your account has been topped up with KES ${data.amount}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount('');
                setSuccess(false);
              },
            },
          ]
        );
      } else {
        setError(`Payment verification failed: ${data.message || 'Unknown error'}. Please contact support if you were charged.`);
        Alert.alert('Error', 'Payment verification failed. Please contact support if you were charged.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment. Please contact support if you were charged.');
      Alert.alert('Error', 'Failed to verify payment. Please contact support if you were charged.');
    } finally {
      setVerifying(false);
    }
  };

  const handleTopUp = async () => {
    setError('');
    setSuccess(false);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 100) {
      setError('Minimum top-up amount is KES 100');
      return;
    }

    if (!primaryAccount) {
      setError('Primary account not found');
      return;
    }

    setLoading(true);

    try {
      console.log('Initiating top-up with amount:', amount);
      
      const data = await axiosInstance.post('/top-up/', {
        amount: parseFloat(amount),
        platform: 'mobile' // Specify mobile platform
      });

      console.log('Top-up response:', data);

      // Check if we got the authorization URL from Paystack
      if (data && data.authorization_url) {
        console.log('Opening Paystack:', data.authorization_url);
        console.log('Payment reference:', data.reference);
        
        // Store the reference for manual verification
        setPendingReference(data.reference);
        
        // Open Paystack in browser
        const result = await WebBrowser.openBrowserAsync(data.authorization_url);
        
        console.log('Browser closed with type:', result.type);
        
        // When browser closes, ask user if they completed payment
        setTimeout(() => {
          Alert.alert(
            'Payment Status',
            'Did you complete the payment successfully?',
            [
              {
                text: 'No, Cancel',
                style: 'cancel',
                onPress: () => {
                  setPendingReference(null);
                }
              },
              {
                text: 'Yes, Verify Now',
                onPress: () => {
                  if (data.reference) {
                    console.log('User confirmed payment, verifying:', data.reference);
                    verifyPayment(data.reference);
                  }
                }
              }
            ]
          );
        }, 500); // Small delay to ensure browser is fully closed
        
      } else {
        console.error('No authorization_url in response:', data);
        setError('Failed to initialize payment. Please try again.');
      }
    } catch (err) {
      console.error('Top up error:', err);
      
      const errorMessage = err.error || 
                          err.message || 
                          'Failed to initialize payment. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  if (verifying) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="mt-4 text-base text-gray-600">Verifying payment...</Text>
          <Text className="mt-2 text-sm text-gray-500">Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Pending Payment Notice */}
          {pendingReference && (
            <View className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <View className="flex-row items-start gap-3 mb-3">
                <AlertCircle size={20} color="#f59e0b" />
                <View className="flex-1">
                  <Text className="text-sm text-yellow-800 font-medium">
                    Pending Payment
                  </Text>
                  <Text className="text-xs text-yellow-700 mt-1">
                    You have a pending payment. Tap below to verify and update your balance.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => verifyPayment(pendingReference)}
                className="bg-yellow-600 py-2 px-4 rounded-lg flex-row items-center justify-center gap-2"
              >
                <RefreshCw size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm">Verify Payment Now</Text>
              </TouchableOpacity>
            </View>
          )}

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
              <View className="flex-1">
                <Text className="text-sm text-green-800 font-medium">
                  Payment verified successfully!
                </Text>
                <Text className="text-xs text-green-700 mt-1">
                  Your account has been topped up
                </Text>
              </View>
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
                  placeholder="Enter amount (min. 100)"
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
                    <Text className="text-white font-semibold">Processing...</Text>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} color="#fff" />
                    <Text className="text-white font-semibold">Pay with Paystack</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Card */}
              <View className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <View className="flex-row items-start gap-3">
                  <AlertCircle size={20} color="#2563eb" />
                  <View className="flex-1">
                    <Text className="font-semibold text-blue-900 text-sm mb-1">
                      Secure Payment with Paystack
                    </Text>
                    <Text className="text-xs text-blue-700">
                      You'll be redirected to Paystack to complete your payment securely. 
                      After completing payment, click "Yes, Verify Now" when prompted to update your balance.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods */}
              <View className="mt-4 p-4 bg-white border border-gray-200 rounded-xl mb-6">
                <Text className="font-semibold text-gray-900 text-sm mb-3">
                  Accepted Payment Methods
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <View className="px-3 py-1 bg-gray-100 rounded-lg">
                    <Text className="text-gray-700 text-xs">Card</Text>
                  </View>
                  <View className="px-3 py-1 bg-gray-100 rounded-lg">
                    <Text className="text-gray-700 text-xs">Bank Transfer</Text>
                  </View>
                  <View className="px-3 py-1 bg-gray-100 rounded-lg">
                    <Text className="text-gray-700 text-xs">USSD</Text>
                  </View>
                  <View className="px-3 py-1 bg-gray-100 rounded-lg">
                    <Text className="text-gray-700 text-xs">Mobile Money</Text>
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