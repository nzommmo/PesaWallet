// SignIn.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import axiosInstance from '../../axiosinstance';



interface SignInProps {
  onBack: () => void;
  onSignUp: () => void;
}

const SignIn: React.FC<SignInProps> = ({  onSignUp }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{phone_number?: string; password?: string}>({});

  const validateForm = () => {
    const errors: {phone_number?: string; password?: string} = {};
    
    if (!phoneNumber.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^(07|01)\d{8}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      errors.phone_number = 'Invalid phone number format (e.g., 0712345678)';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async () => {
  // Clear previous errors
  setError('');
  setFieldErrors({});
  
  // Validate form
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  
  try {
    const credentials = {
      phone_number: phoneNumber.replace(/\s+/g, ''),
      password: password
    };
    
    const response = await axiosInstance.post('/login/', credentials);
    
    // Store token and user data
    if (response.tokens) {
      await AsyncStorage.setItem('Access_Token', response.tokens.access);
      await AsyncStorage.setItem('Refresh_Token', response.tokens.refresh);
    }
    if (response.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }
    
    // Navigate to main app (tabs)
    router.replace('/(tabs)');
    
  } catch (err: any) {
    console.error('Sign in error:', err);
    
    // Handle field-specific errors from backend
    if (err.errors) {
      setFieldErrors(err.errors);
    } else if (err.message) {
      setError(err.message);
    } else if (err.detail) {
      setError(err.detail);
    } else if (err.non_field_errors) {
      setError(err.non_field_errors[0] || 'Invalid credentials');
    } else {
      setError('Failed to sign in. Please check your credentials.');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      >
        <View className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 mx-auto">
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</Text>
            <Text className="text-gray-600">Log in to your account</Text>
          </View>
          
          {/* General error message */}
          {error && (
            <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
              <AlertCircle color="#dc2626" size={20} style={{ marginTop: 2 }} />
              <Text className="text-sm text-red-800 flex-1">{error}</Text>
            </View>
          )}
          
          <View className="space-y-6">
            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (fieldErrors.phone_number) {
                    setFieldErrors({...fieldErrors, phone_number: undefined});
                  }
                  if (error) setError('');
                }}
                className={`w-full px-4 py-3 border rounded-xl ${
                  fieldErrors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0712345678"
                keyboardType="phone-pad"
                editable={!loading}
              />
              {fieldErrors.phone_number && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.phone_number}</Text>
              )}
            </View>
            
            {/* Password */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (fieldErrors.password) {
                      setFieldErrors({...fieldErrors, password: undefined});
                    }
                    if (error) setError('');
                  }}
                  className={`w-full px-4 py-3 border rounded-xl pr-12 ${
                    fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  disabled={loading}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -12 }] }}
                >
                  {showPassword ? (
                    <EyeOff color="#9ca3af" size={20} />
                  ) : (
                    <Eye color="#9ca3af" size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text className="text-xs text-red-600 mt-1">{fieldErrors.password}</Text>
              )}
            </View>
            
            {/* Log In Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold">Logging In...</Text>
                </>
              ) : (
                <Text className="text-white font-semibold">Log In</Text>
              )}
            </TouchableOpacity>
            
            

            {/* Sign Up Link */}
            <View className="items-center pt-4">
              <Text className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Text
                  onPress={() => router.push('/(auth)/SIgnUp')}
                  className={`font-medium ${loading ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;