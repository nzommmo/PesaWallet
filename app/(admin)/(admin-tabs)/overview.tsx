import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../../axiosinstance';

interface OverviewStats {
  total_users: number;
  total_accounts: number;
  total_transactions: number;
  total_success_volume: number;
  last_24hr_volume: number;
  payment_breakdown: { method: string; count: number; volume: number }[];
}

export default function Overview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    loadAdminName();
    fetchStats();
  }, []);

  const loadAdminName = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setAdminName(user.full_name || 'Admin');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/internal/overview/');
      // API returns an array — grab first item
      const data = Array.isArray(response) ? response[0] : response;
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-gray-900 rounded-b-3xl pb-8 ">
          <View className="px-6 pt-6">
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/')}
              className="flex-row items-center gap-2 mb-6 self-start bg-white/10 px-4 py-2 rounded-full"
            >
              <Text className="text-white text-sm">←</Text>
              <Text className="text-white text-sm font-medium">Back to My Account</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-gray-400 text-sm">Signed in as</Text>
                <Text className="text-white text-2xl font-bold">{adminName}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="w-2 h-2 bg-red-500 rounded-full" />
                  <Text className="text-red-400 text-xs font-semibold">ADMIN MODE</Text>
                </View>
              </View>
              <View className="w-14 h-14 bg-red-500/20 rounded-2xl items-center justify-center">
                <Text className="text-3xl">🛡️</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">System Overview</Text>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#e74c3c" />
              <Text className="text-gray-500 mt-3">Loading stats...</Text>
            </View>
          ) : (
            <View className="gap-4">

              {/* Row 1 — Users & Accounts */}
              <View className="flex-row gap-4">
                <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
                  <Text className="text-2xl mb-2">👥</Text>
                  <Text className="text-gray-500 text-xs">Total Users</Text>
                  <Text className="text-gray-900 text-2xl font-bold mt-1">
                    {stats?.total_users ?? '—'}
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
                  <Text className="text-2xl mb-2">🏦</Text>
                  <Text className="text-gray-500 text-xs">Total Accounts</Text>
                  <Text className="text-blue-600 text-2xl font-bold mt-1">
                    {stats?.total_accounts ?? '—'}
                  </Text>
                </View>
              </View>

              {/* Row 2 — Transactions & 24hr Volume */}
              <View className="flex-row gap-4">
                <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
                  <Text className="text-2xl mb-2">💸</Text>
                  <Text className="text-gray-500 text-xs">Total Transactions</Text>
                  <Text className="text-green-600 text-2xl font-bold mt-1">
                    {stats?.total_transactions ?? '—'}
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
                  <Text className="text-2xl mb-2">🕐</Text>
                  <Text className="text-gray-500 text-xs">Last 24hr Volume</Text>
                  <Text className="text-orange-500 text-2xl font-bold mt-1">
                    {stats?.last_24hr_volume ?? '—'}
                  </Text>
                </View>
              </View>

              {/* Total Success Volume — full width */}
              <View className="bg-gray-900 rounded-2xl p-5">
                <Text className="text-gray-400 text-sm mb-1">
                  Total Success Volume
                </Text>
                <Text className="text-white text-3xl font-bold">
                  KES {stats?.total_success_volume?.toLocaleString() ?? '0'}
                </Text>
              </View>

              {/* Payment Breakdown */}
              {stats?.payment_breakdown && stats.payment_breakdown.length > 0 ? (
                <View className="bg-white rounded-2xl border border-gray-100 p-4">
                  <Text className="text-gray-900 font-semibold mb-3">
                    Payment Breakdown
                  </Text>
                  {stats.payment_breakdown.map((item, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between py-2 border-b border-gray-50"
                    >
                      <Text className="text-gray-700 font-medium capitalize">
                        {item.method}
                      </Text>
                      <View className="items-end">
                        <Text className="text-gray-900 font-semibold">
                          KES {item.volume?.toLocaleString()}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {item.count} transactions
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-2xl border border-gray-100 p-5 items-center">
                  <Text className="text-2xl mb-2">📊</Text>
                  <Text className="text-gray-500 text-sm">No payment data yet</Text>
                </View>
              )}

            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6 mb-10">
          <Text className="text-gray-900 font-bold text-lg mb-4">Quick Actions</Text>

          <View className="bg-white rounded-2xl border border-gray-100">
            <TouchableOpacity
              onPress={() => router.push('/(admin)/(admin-tabs)/users')}
              className="p-4 flex-row items-center justify-between border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center">
                  <Text className="text-lg">👥</Text>
                </View>
                <View>
                  <Text className="text-gray-900 font-medium">Manage Users</Text>
                  <Text className="text-gray-500 text-xs">View, suspend or promote users</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(admin)/(admin-tabs)/transactions')}
              className="p-4 flex-row items-center justify-between border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-50 rounded-lg items-center justify-center">
                  <Text className="text-lg">💸</Text>
                </View>
                <View>
                  <Text className="text-gray-900 font-medium">Transactions</Text>
                  <Text className="text-gray-500 text-xs">Monitor all transactions</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(admin)/(admin-tabs)/settings')}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-50 rounded-lg items-center justify-center">
                  <Text className="text-lg">⚙️</Text>
                </View>
                <View>
                  <Text className="text-gray-900 font-medium">System Settings</Text>
                  <Text className="text-gray-500 text-xs">Configure platform settings</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}