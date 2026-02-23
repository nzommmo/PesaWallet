import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../../axiosinstance';

interface User {
  user_id: number;
  email: string | null;
  phone: string;
  accounts_count: number;
  total_balance: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        users.filter(
          (u) =>
            u.phone.includes(q) ||
            (u.email && u.email.toLowerCase().includes(q))
        )
      );
    }
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/internal/users/');
      const data = Array.isArray(response) ? response : [];
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const getInitials = (user: User) => {
    if (user.email) return user.email[0].toUpperCase();
    return user.phone.slice(-2);
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
        <View className="bg-gray-900 rounded-b-3xl pb-8">
          <View className="px-6 pt-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center gap-2 mb-6 self-start bg-white/10 px-4 py-2 rounded-full"
            >
              <Text className="text-white text-sm">←</Text>
              <Text className="text-white text-sm font-medium">Back</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-white text-2xl font-bold">Users</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {users.length} registered users
                </Text>
              </View>
              <View className="w-14 h-14 bg-blue-500/20 rounded-2xl items-center justify-center">
                <Text className="text-3xl">👥</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex-row items-center gap-3">
            <Text className="text-gray-400 text-lg">🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by phone or email..."
              placeholderTextColor="#9ca3af"
              className="flex-1 text-gray-900"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text className="text-gray-400 text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User List */}
        <View className="px-6 mt-4 mb-10">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#1f2937" />
              <Text className="text-gray-500 mt-3">Loading users...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-gray-500">No users found</Text>
            </View>
          ) : (
            <View className="gap-3">
              {filtered.map((user) => (
                <View
                  key={user.user_id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <View className="flex-row items-center gap-4">
                    {/* Avatar */}
                    <View className="w-12 h-12 bg-gray-900 rounded-full items-center justify-center">
                      <Text className="text-white font-bold text-lg">
                        {getInitials(user)}
                      </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">
                        {user.email ?? 'No email'}
                      </Text>
                      <Text className="text-gray-500 text-sm">{user.phone}</Text>
                    </View>

                    {/* User ID badge */}
                    <View className="bg-gray-100 px-2 py-1 rounded-lg">
                      <Text className="text-gray-500 text-xs">#{user.user_id}</Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View className="flex-row gap-3 mt-4">
                    <View className="flex-1 bg-blue-50 rounded-xl p-3">
                      <Text className="text-blue-400 text-xs mb-1">Accounts</Text>
                      <Text className="text-blue-700 font-bold text-lg">
                        {user.accounts_count}
                      </Text>
                    </View>

                    <View className="flex-1 bg-green-50 rounded-xl p-3">
                      <Text className="text-green-400 text-xs mb-1">Balance</Text>
                      <Text className="text-green-700 font-bold text-lg">
                        KES {user.total_balance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}