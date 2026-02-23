import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

interface User {
  full_name?: string;
  email?: string;
  phone_number?: string;
  default_mpesa_number?: string;
  is_superadmin?: boolean;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [incomeStats, setIncomeStats] = useState({ count: 0, total: 0 });
  const [loadingIncome, setLoadingIncome] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchIncomeStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        console.log('is_superadmin:', parsedUser.is_superadmin);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const fetchIncomeStats = async () => {
    setLoadingIncome(true);
    try {
      const response = await axiosInstance.get('/incomes/');
      const incomes = response || [];
      const total = incomes.reduce(
        (sum: number, income: { amount?: string }) =>
          sum + parseFloat(income.amount || '0'),
        0
      );
      setIncomeStats({ count: incomes.length, total });
    } catch (err) {
      console.error('Failed to fetch income stats:', err);
    } finally {
      setLoadingIncome(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('Access_Token');
      await AsyncStorage.removeItem('Refresh_Token');
      await AsyncStorage.removeItem('user');
      router.replace('/(auth)/SignIn');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = () => {
    if (!user?.full_name) return 'JD';
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="bg-blue-600 rounded-b-3xl pb-8">
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center gap-4 mb-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className="p-2 rounded-lg"
              >
                <Text className="text-white text-2xl">←</Text>
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold">Profile</Text>

              {user?.is_superadmin && (
                <View className="ml-auto bg-red-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">SUPERADMIN</Text>
                </View>
              )}
            </View>

            {/* Avatar and Info */}
            <View className="items-center">
              <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4">
                <Text className="text-white font-bold text-3xl">
                  {getInitials()}
                </Text>
              </View>
              <Text className="text-white text-2xl font-bold mb-1">
                {user?.full_name || 'John Doe'}
              </Text>
              <Text className="text-blue-100 text-sm">
                {user?.email || 'john.doe@email.com'}
              </Text>
              {user?.is_superadmin && (
                <View className="mt-2 bg-red-500/30 px-4 py-1 rounded-full">
                  <Text className="text-white text-xs">System Administrator</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl border border-gray-100 p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-semibold text-gray-900 text-lg">
                Personal Information
              </Text>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-blue-600 text-sm font-medium">✏️ Edit</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                  <Text className="text-gray-600 text-lg">👤</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Full Name</Text>
                  <Text className="text-gray-900 font-medium">
                    {user?.full_name || 'John Doe'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                  <Text className="text-gray-600 text-lg">✉️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Email</Text>
                  <Text className="text-gray-900 font-medium">
                    {user?.email || 'john.doe@email.com'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                  <Text className="text-gray-600 text-lg">📞</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Phone Number</Text>
                  <Text className="text-gray-900 font-medium">
                    {user?.phone_number || '+254 700 000 000'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* M-Pesa Settings */}
        <View className="px-6 mt-6">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            M-Pesa Settings
          </Text>
          <TouchableOpacity className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                <Text className="text-green-600 text-lg">📱</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  Default M-Pesa Number
                </Text>
                <Text className="text-xs text-gray-600">
                  {user?.default_mpesa_number || user?.phone_number || '+254 700 000 000'}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        </View>

        {/* Income Stats */}
        <View className="px-6 mt-4 mb-6">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            Income Management
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/income/income')}
            className="bg-blue-200 rounded-2xl p-5"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-14 h-14 bg-white/20 rounded-xl items-center justify-center">
                  <Text className="text-2xl">📈</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 text-sm mb-1">Income Sources</Text>
                  {loadingIncome ? (
                    <ActivityIndicator size="small" color="#4b5563" />
                  ) : (
                    <>
                      <Text className="text-gray-900 text-xl font-semibold">
                        {incomeStats.count}{' '}
                        {incomeStats.count === 1 ? 'Source' : 'Sources'}
                      </Text>
                      <Text className="text-gray-900 text-base mt-1">
                        Total: KES {incomeStats.total.toLocaleString()}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Text className="text-white/80 text-xl">›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notification Preferences */}
        <View className="px-6 mt-6">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            Notification Preferences
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100">
            <View className="p-4 flex-row items-center justify-between border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Text className="text-gray-600 text-lg">🔔</Text>
                <Text className="text-gray-900 font-medium">Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="#ffffff"
              />
            </View>
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-gray-600 text-lg">✉️</Text>
                <Text className="text-gray-900 font-medium">Email Notifications</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="px-6 mt-6 mb-10">
          <View className="bg-white rounded-2xl border border-gray-100">
            <TouchableOpacity
              onPress={() => router.push('/accountmanagement')}
              className="p-4 flex-row items-center justify-between border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">🏦</Text>
                <Text className="text-gray-900 font-medium">Accounts Management</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/categories')}
              className="p-4 flex-row items-center justify-between border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">🗂️</Text>
                <Text className="text-gray-900 font-medium">Categories Management</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">🔒</Text>
                <Text className="text-gray-900 font-medium">Change Password</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">💬</Text>
                <Text className="text-gray-900 font-medium">Help & Support</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            {/* Admin Dashboard — superadmin only */}
            {user?.is_superadmin && (
              <TouchableOpacity
                onPress={() => router.replace('/(admin)/(admin-tabs)/overview')}
                className="p-4 flex-row items-center justify-between border-b border-gray-100 bg-red-50"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">🛡️</Text>
                  <View>
                    <Text className="text-red-600 font-semibold">Admin Dashboard</Text>
                    <Text className="text-xs text-red-400">Switch to system management</Text>
                  </View>
                </View>
                <Text className="text-red-400 text-xl">›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleLogout}
              className="p-4 flex-row items-center gap-3"
            >
              <Text className="text-red-600 text-lg">🚪</Text>
              <Text className="text-red-600 font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;