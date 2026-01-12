import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
                className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-base text-gray-900"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Phone Number</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-base text-gray-900"
                placeholder="0712345678"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Email */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Email</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-base text-gray-900"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
            
            {/* Password */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-900 mb-2">Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg">
                <TextInput
                  className="flex-1 py-3 px-4 text-base text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
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
            </View>
            
            {/* Continue Button */}
            <TouchableOpacity className="bg-blue-600 py-4 rounded-xl items-center mb-3">
              <Text className="text-white text-base font-semibold">Continue</Text>
            </TouchableOpacity>
            
            {/* Back Button */}
            <TouchableOpacity className="py-4 items-center" onPress={() => router.push('/(auth)/Welcome')}>
              <Text className="text-gray-900 text-base font-semibold">Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;