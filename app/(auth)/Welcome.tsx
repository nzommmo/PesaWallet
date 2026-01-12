// app/(auth)/Welcome.tsx
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

const Welcome = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <View className="mb-8">
          <View className="w-20 h-20 bg-blue-600 rounded-3xl justify-center items-center">
            <View className="w-10 h-8 bg-white rounded justify-center items-center">
              <View className="w-7 h-5 bg-blue-600 rounded-sm border-2 border-white" />
            </View>
          </View>
        </View>
        
        <Text className="text-3xl font-bold text-center text-gray-900 mb-4">
          Welcome to{'\n'}SmartBudget
        </Text>
        
        <Text className="text-sm text-center text-gray-600 mb-10 leading-5">
          Manage your finances with digital envelopes{'\n'}
          and make seamless M-Pesa payments
        </Text>
        
        <TouchableOpacity 
          className="bg-blue-600 py-4 px-8 rounded-xl flex-row items-center justify-center w-full max-w-md mb-4"
          onPress={() => router.push('/(auth)/SIgnUp')}
        >
          <Text className="text-white text-base font-semibold mr-2">Get Started</Text>
          <Text className="text-white text-lg">→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/(auth)/SignIn')}>
          <Text className="text-sm text-gray-600">
            Already have an account? <Text className="font-semibold text-gray-900">Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;