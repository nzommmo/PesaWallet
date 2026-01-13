import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!fullName.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!phoneNumber.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^(07|01)\d{8}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      errors.phone_number = 'Invalid phone number format (e.g., 0712345678)';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    // Clear previous errors
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      console.log('Validation failed:', fieldErrors);
      return;
    }
    
    try {
      // Store user data to pass to M-Pesa setup page
      const userData = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.replace(/\s+/g, ''),
        email: email.trim().toLowerCase(),
        password: password
      };
      
      console.log('Storing signup data:', userData);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('signupData', JSON.stringify(userData));
      
      // Verify it was stored
      const stored = await AsyncStorage.getItem('signupData');
      console.log('Verified stored data:', stored);
      
      // Navigate to M-Pesa setup page
      console.log('Navigating to setup-mpesa');
      router.push('/(auth)/SetupMpesa');
    } catch (error) {
      console.error('Error storing signup data:', error);
      Alert.alert('Error', 'Failed to save signup data. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center p-5">
          <View className="bg-white rounded-2xl p-6 max-w-md w-full self-center">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-sm text-gray-600 mb-6">Sign up to start managing your budget</Text>
            
            {/* Full Name */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Full Name</Text>
              <TextInput
                className={`border rounded-lg py-3 px-4 text-base text-gray-900 ${
                  fieldErrors.full_name ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'
                }`}
                placeholder="John Doe"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (fieldErrors.full_name) {
                    setFieldErrors({...fieldErrors, full_name: undefined});
                  }
                }}
                placeholderTextColor="#999"
              />
              {fieldErrors.full_name && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.full_name}</Text>
              )}
            </View>
            
            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Phone Number</Text>
              <TextInput
                className={`border rounded-lg py-3 px-4 text-base text-gray-900 ${
                  fieldErrors.phone_number ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'
                }`}
                placeholder="0712345678"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (fieldErrors.phone_number) {
                    setFieldErrors({...fieldErrors, phone_number: undefined});
                  }
                }}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              {fieldErrors.phone_number && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.phone_number}</Text>
              )}
            </View>
            
            {/* Email */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Email</Text>
              <TextInput
                className={`border rounded-lg py-3 px-4 text-base text-gray-900 ${
                  fieldErrors.email ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'
                }`}
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (fieldErrors.email) {
                    setFieldErrors({...fieldErrors, email: undefined});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              {fieldErrors.email && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.email}</Text>
              )}
            </View>
            
            {/* Password */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Password</Text>
              <View className={`flex-row items-center border rounded-lg ${
                fieldErrors.password ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'
              }`}>
                <TextInput
                  className="flex-1 py-3 px-4 text-base text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (fieldErrors.password) {
                      setFieldErrors({...fieldErrors, password: undefined});
                    }
                  }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-3"
                >
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.password}</Text>
              )}
            </View>
            
            {/* Continue Button */}
            <TouchableOpacity 
              className="bg-blue-600 py-4 rounded-xl items-center mb-3"
              onPress={handleContinue}
            >
              <Text className="text-white text-base font-semibold">Continue</Text>
            </TouchableOpacity>
            
            {/* Back Button */}
            <TouchableOpacity 
              className="py-4 items-center" 
              onPress={() => router.push('/(auth)/Welcome')}
            >
              <Text className="text-gray-900 text-base font-semibold">Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;