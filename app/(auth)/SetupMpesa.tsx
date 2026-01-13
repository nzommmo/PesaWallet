import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import axiosInstance from '../../axiosinstance';

const SetupMpesa = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [signupData, setSignupData] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Check if user is already logged in (update mode)
      const userDataStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userDataStr && token) {
        // User is logged in - this is an update operation
        const user = JSON.parse(userDataStr);
        setCurrentUser(user);
        setIsUpdateMode(true);
        setPhoneNumber(user.default_mpesa_number || user.phone_number || '');
        setInitializing(false);
        console.log('Update mode - existing user:', user);
        return;
      }

      // Not logged in - check for signup data (new user flow)
      const storedData = await AsyncStorage.getItem('signupData');
      
      console.log('Stored signup data:', storedData);
      
      if (!storedData) {
        // No signup data and not logged in - redirect to signup
        console.log('No signup data found, redirecting to signup');
        router.replace('/(auth)/SignUp');
        return;
      }
      
      const data = JSON.parse(storedData);
      console.log('Parsed signup data:', data);
      setSignupData(data);
      setIsUpdateMode(false);
      
      // Pre-fill with phone number from signup
      setPhoneNumber(data.phone_number || '');
      setInitializing(false);
    } catch (err) {
      console.error('Error initializing screen:', err);
      router.replace('/(auth)/SignUp');
    }
  };

  const validatePhoneNumber = () => {
    if (!phoneNumber.trim()) {
      setFieldError('M-Pesa number is required');
      return false;
    }
    
    if (!/^(07|01)\d{8}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      setFieldError('Invalid phone number format (e.g., 0712345678)');
      return false;
    }
    
    setFieldError('');
    return true;
  };

  const handleCompleteSetup = async () => {
    setError('');
    setFieldError('');
    
    if (!validatePhoneNumber()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isUpdateMode) {
        // Update existing user's M-Pesa number
        console.log('Updating M-Pesa number for existing user');
        
        const response = await axiosInstance.patch('/profile/', {
          default_mpesa_number: phoneNumber.replace(/\s+/g, '')
        });
        
        console.log('Update response:', response);
        
        // Update user data in AsyncStorage
        if (response.user || response) {
          const updatedUser = response.user || response;
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Navigate back to profile
        router.replace('/(tabs)/profile');
        
      } else {
        // New user registration
        if (!signupData) {
          setError('Signup data not found. Please start again.');
          return;
        }
        
        const userData = {
          ...signupData,
          default_mpesa_number: phoneNumber.replace(/\s+/g, '')
        };
        
        console.log('Submitting registration data:', userData);
        
        const response = await axiosInstance.post('/register/', userData);
        
        console.log('Registration response:', response);
        
        // Clear signup data from AsyncStorage
        await AsyncStorage.removeItem('signupData');
        
        // Show success message
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/SignIn')
            }
          ]
        );
        
        // Navigate to login page
        router.replace('/(auth)/SignIn');
      }
      
    } catch (err) {
      console.error('Error:', err);
      
      // Handle field-specific errors from backend
      if (err.errors) {
        if (err.errors.default_mpesa_number) {
          setFieldError(err.errors.default_mpesa_number);
        } else if (!isUpdateMode) {
          // If other field errors during signup, they relate to signup data
          setError('There was an issue with your signup information. Please try again.');
          setTimeout(() => router.replace('/(auth)/SignUp'), 2000);
        } else {
          setError('Failed to update M-Pesa number. Please try again.');
        }
      } else if (err.message) {
        setError(err.message);
      } else if (err.detail) {
        setError(err.detail);
      } else {
        setError(isUpdateMode ? 'Failed to update M-Pesa number. Please try again.' : 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    
    if (isUpdateMode) {
      // In update mode, skip just goes back to profile
      router.replace('/(tabs)/profile');
      return;
    }
    
    if (!signupData) {
      setError('Signup data not found. Please start again.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Use phone number from signup as default M-Pesa number
      const userData = {
        ...signupData,
        default_mpesa_number: signupData.phone_number
      };
      
      console.log('Submitting registration data (skip):', userData);
      
      const response = await axiosInstance.post('/register/', userData);
      
      console.log('Registration response:', response);
      
      // Clear signup data from AsyncStorage
      await AsyncStorage.removeItem('signupData');
      
      // Show success message
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully. Please login to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/SignIn')
          }
        ]
      );
      
      // Navigate to login page
      router.replace('/(auth)/SignIn');
      
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.message) {
        setError(err.message);
      } else if (err.detail) {
        setError(err.detail);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  // If no signup data and not logged in after initialization, show nothing (will redirect)
  if (!signupData && !isUpdateMode) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center p-6">
          <View className="bg-white rounded-3xl p-8 max-w-md w-full self-center">
            {/* Back button for update mode */}
            {isUpdateMode && (
              <TouchableOpacity
                onPress={() => router.replace('/profile')}
                disabled={loading}
                className="mb-4 self-start"
              >
                <Text className="text-gray-700 text-base font-medium">← Back</Text>
              </TouchableOpacity>
            )}

            {/* Success Icon */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                <Text className="text-5xl text-green-600">✓</Text>
              </View>
            </View>

            {/* Title and Description */}
            <View className="items-center mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-3">
                {isUpdateMode ? 'Update M-Pesa Number' : 'Setup M-Pesa'}
              </Text>
              <Text className="text-gray-600 text-center leading-relaxed">
                {isUpdateMode 
                  ? 'Update your default M-Pesa number for payments'
                  : 'Configure your default M-Pesa number for payments'
                }
              </Text>
            </View>

            {/* General Error Message */}
            {error && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start">
                <Text className="text-red-600 mr-2">⚠️</Text>
                <Text className="text-sm text-red-800 flex-1">{error}</Text>
              </View>
            )}

            {/* Phone Number Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setFieldError('');
                }}
                className={`w-full px-4 py-3 border rounded-xl text-base ${
                  fieldError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0712345678"
                keyboardType="phone-pad"
                editable={!loading}
              />
              {fieldError && (
                <Text className="text-xs text-red-600 mt-1">{fieldError}</Text>
              )}
              <Text className="text-xs text-gray-500 mt-2">
                This number will be used for all M-Pesa transactions
              </Text>
            </View>

            {/* Complete Setup Button */}
            <TouchableOpacity
              onPress={handleCompleteSetup}
              disabled={loading}
              className={`w-full py-4 rounded-2xl mb-4 items-center justify-center ${
                loading ? 'bg-green-400' : 'bg-green-600'
              }`}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">
                    {isUpdateMode ? 'Updating...' : 'Creating Account...'}
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-base">
                  {isUpdateMode ? 'Update M-Pesa Number' : 'Complete Setup'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Skip Button - only show for new users */}
            {!isUpdateMode && (
              <TouchableOpacity
                onPress={handleSkip}
                disabled={loading}
                className="w-full py-4 items-center"
              >
                <Text className={`font-medium text-base ${
                  loading ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SetupMpesa;