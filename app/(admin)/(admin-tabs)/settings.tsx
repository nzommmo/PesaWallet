import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../../axiosinstance';

interface AdminUser {
  user_id: number;
  email: string;
  phone: string;
  accounts_count: number;
  total_balance: number;
  is_active: boolean;
}

export default function Settings() {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // tracks which user_ids are mid-request
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/internal/users/');
      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleActive = (user: AdminUser) => {
    const action = user.is_active ? 'deactivate' : 'reactivate';
    Alert.alert(
      `${user.is_active ? 'Deactivate' : 'Reactivate'} User`,
      `Are you sure you want to ${action} ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.is_active ? 'Deactivate' : 'Reactivate',
          style: user.is_active ? 'destructive' : 'default',
          onPress: () => toggleActive(user),
        },
      ],
    );
  };

  const toggleActive = async (user: AdminUser) => {
    setToggling((prev) => new Set(prev).add(user.user_id));
    try {
      await axiosInstance.patch(`/internal/users/${user.user_id}/`, {
        is_active: !user.is_active,
      });
      // optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      Alert.alert('Error', 'Failed to update user status. Please try again.');
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(user.user_id);
        return next;
      });
    }
  };

  const active   = users.filter((u) => u.is_active).length;
  const inactive = users.filter((u) => !u.is_active).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
      >
        {/* Header */}
        <View className="bg-gray-900 rounded-b-3xl pb-8">
          <View className="px-6 pt-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center mb-6 self-start bg-white/10 px-4 py-2 rounded-full"
            >
              <Text className="text-white text-sm font-medium">← Back</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-white text-2xl font-bold">Users</Text>
                <Text className="text-gray-400 text-sm mt-1">{users.length} total accounts</Text>
              </View>
              <View className="w-14 h-14 bg-blue-500/20 rounded-2xl items-center justify-center">
                <Text className="text-3xl">👥</Text>
              </View>
            </View>

            {/* Summary */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Total</Text>
                <Text className="text-white font-bold text-lg">{users.length}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Active</Text>
                <Text className="text-green-400 font-bold text-lg">{active}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Inactive</Text>
                <Text className="text-red-400 font-bold text-lg">{inactive}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User List */}
        <View className="px-6 mt-4 mb-10">
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#1f2937" />
              <Text className="text-gray-500 mt-3">Loading users...</Text>
            </View>
          ) : users.length === 0 ? (
            <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
              <Text className="text-4xl mb-3">👤</Text>
              <Text className="text-gray-500 font-medium">No users found</Text>
            </View>
          ) : (
            <View className="gap-3">
              {users.map((user) => {
                const isToggling = toggling.has(user.user_id);
                return (
                  <View
                    key={user.user_id}
                    className={`bg-white rounded-2xl border p-4 ${
                      user.is_active ? 'border-gray-100' : 'border-red-100 bg-red-50/30'
                    }`}
                  >
                    {/* Top row */}
                    <View className="flex-row items-center gap-3 mb-3">
                      {/* Avatar */}
                      <View className={`w-11 h-11 rounded-xl items-center justify-center ${
                        user.is_active ? 'bg-blue-50' : 'bg-gray-100'
                      }`}>
                        <Text className="text-xl">👤</Text>
                      </View>

                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                          {user.email}
                        </Text>
                        <Text className="text-gray-400 text-xs">{user.phone}</Text>
                      </View>

                      {/* Status badge */}
                      <View className={`px-2.5 py-1 rounded-full ${
                        user.is_active ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          user.is_active ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Stats row */}
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1 bg-gray-50 rounded-xl p-2.5">
                        <Text className="text-gray-400 text-xs">Accounts</Text>
                        <Text className="text-gray-900 font-bold text-sm">{user.accounts_count}</Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-xl p-2.5">
                        <Text className="text-gray-400 text-xs">Balance</Text>
                        <Text className="text-gray-900 font-bold text-sm">
                          KES {user.total_balance.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-xl p-2.5">
                        <Text className="text-gray-400 text-xs">ID</Text>
                        <Text className="text-gray-900 font-bold text-sm">#{user.user_id}</Text>
                      </View>
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                      onPress={() => handleToggleActive(user)}
                      disabled={isToggling}
                      className={`py-2.5 rounded-xl items-center justify-center flex-row gap-2 ${
                        user.is_active
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-green-50 border border-green-200'
                      } ${isToggling ? 'opacity-50' : ''}`}
                    >
                      {isToggling ? (
                        <ActivityIndicator size="small" color={user.is_active ? '#dc2626' : '#16a34a'} />
                      ) : (
                        <Text className={`text-sm font-semibold ${
                          user.is_active ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {user.is_active ? '🚫 Deactivate User' : '✅ Reactivate User'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}