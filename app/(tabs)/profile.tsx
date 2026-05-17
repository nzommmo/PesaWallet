import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
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

  // FIX: Track mount state to prevent setState calls after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadUserData();
    fetchIncomeStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      // FIX: Guard setState after unmount
      if (!mountedRef.current) return;
      if (userData) setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const fetchIncomeStats = async () => {
    if (!mountedRef.current) return;
    setLoadingIncome(true);
    try {
      const response = await axiosInstance.get('/incomes/');

      // FIX: Safely unwrap — axiosInstance may or may not auto-unwrap .data
      const rawIncomes = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const total = rawIncomes.reduce(
        (sum: number, income: { amount?: string }) => {
          const parsed = parseFloat(income.amount || '0');
          // FIX: Guard against NaN from malformed amount strings
          return sum + (isNaN(parsed) ? 0 : parsed);
        },
        0
      );

      if (!mountedRef.current) return;
      setIncomeStats({ count: rawIncomes.length, total });
    } catch (err) {
      console.error('Failed to fetch income stats:', err);
      // FIX: Was silently swallowing all errors — at least log them
    } finally {
      if (mountedRef.current) {
        setLoadingIncome(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['Access_Token', 'Refresh_Token', 'user']);
          } catch (err) {
            // FIX: Wrap in try/catch — a storage failure shouldn't block the logout nav
            console.warn('Failed to clear storage on logout:', err);
          }
          router.replace('/(auth)/SignIn');
        },
      },
    ]);
  };

  const getInitials = () => {
    if (!user?.full_name) return 'JD';
    // FIX: Guard against empty name segments producing undefined[0]
    return user.full_name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.full_name || 'John Doe';
  const displayEmail = user?.email || 'john.doe@email.com';
  const displayPhone = user?.phone_number || '+254 700 000 000';
  const displayMpesa = user?.default_mpesa_number || displayPhone;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <View className="bg-blue-600 rounded-b-3xl pb-8">
          {/* Top nav */}
          <View className="flex-row items-center justify-between px-6 pt-5 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>

            <Text className="text-white/80 text-xs tracking-widest uppercase font-medium">
              Your Profile
            </Text>

            {user?.is_superadmin ? (
              <View className="bg-red-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold tracking-wide">ADMIN</Text>
              </View>
            ) : (
              <View className="w-16" />
            )}
          </View>

          {/* Avatar + identity */}
          <View className="items-center px-6">
            <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4 border-4 border-white/30">
              <Text className="text-white font-black text-3xl">
                {getInitials()}
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">{displayName}</Text>
            <Text className="text-blue-100 text-sm">{displayEmail}</Text>

            {user?.is_superadmin && (
              <View className="mt-3 flex-row items-center gap-1.5 bg-red-500/30 border border-red-400/40 px-4 py-1.5 rounded-full">
                <Text className="text-white text-xs">🛡️</Text>
                <Text className="text-white text-xs font-medium">System Administrator</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Income Stat Card ── */}
        <View className="px-6 mt-5">
          <TouchableOpacity
            onPress={() => router.push('/income/income')}
            className="bg-blue-600 rounded-2xl p-5"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-blue-100 text-xs uppercase tracking-widest mb-1">
                  Monthly Income
                </Text>
                {loadingIncome ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-2xl font-bold">
                    KES {incomeStats.total.toLocaleString()}
                  </Text>
                )}
              </View>
              <View className="items-end gap-2">
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    {loadingIncome ? '–' : incomeStats.count}{' '}
                    source{incomeStats.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text className="text-blue-200 text-xs">View all →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Account Details ── */}
        <View className="px-6 mt-6">
          <SectionLabel label="Account Details" />
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <InfoRow icon="👤" label="Full Name" value={displayName} />
            <Divider />
            <InfoRow icon="✉️" label="Email Address" value={displayEmail} />
            <Divider />
            <InfoRow icon="📞" label="Phone Number" value={displayPhone} />
          </View>
        </View>

        {/* ── M-Pesa ── */}
        <View className="px-6 mt-5">
          <SectionLabel label="M-Pesa" />
          <TouchableOpacity className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                  <Text className="text-lg">📱</Text>
                </View>
                <View>
                  <Text className="text-green-700 text-xs font-medium mb-0.5">Default Number</Text>
                  <Text className="text-gray-900 font-semibold">{displayMpesa}</Text>
                </View>
              </View>
              <View className="bg-green-100 border border-green-200 px-2.5 py-1 rounded-lg">
                <Text className="text-green-700 text-xs font-medium">Active</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Manage ── */}
        <View className="px-6 mt-5">
          <SectionLabel label="Manage" />
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <ActionRow
              icon="🏦"
              label="Accounts"
              sublabel="View & manage envelopes"
              onPress={() => router.push('/accountmanagement')}
            />
            <Divider />
            <ActionRow
              icon="🗂️"
              label="Categories"
              sublabel="Organise spending categories"
              onPress={() => router.push('/categories')}
            />
            <Divider />
            <ActionRow
              icon="🔒"
              label="Change Password"
              sublabel="Update your security credentials"
              onPress={() => router.push('/passwordreset')}
            />

            {user?.is_superadmin && (
              <>
                <Divider />
                <TouchableOpacity
                  onPress={() => router.replace('/(admin)/(admin-tabs)/overview')}
                  className="flex-row items-center justify-between px-4 py-3.5 bg-red-50"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 bg-red-100 rounded-xl items-center justify-center">
                      <Text>🛡️</Text>
                    </View>
                    <View>
                      <Text className="text-red-600 font-semibold text-sm">Admin Dashboard</Text>
                      <Text className="text-red-400 text-xs">Switch to system management</Text>
                    </View>
                  </View>
                  <Text className="text-red-400 text-lg">›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Logout ── */}
        <View className="px-6 mt-5 mb-12">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-lg">🚪</Text>
              <Text className="text-red-600 font-semibold text-base">Log Out</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-gray-400 text-xs text-center mt-3">
            You'll be asked to confirm before logging out
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Reusable sub-components ── */

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="text-gray-500 text-xs uppercase tracking-widest mb-3 ml-1">
    {label}
  </Text>
);

const Divider = () => (
  <View className="h-px bg-gray-100 mx-4" />
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View className="flex-row items-center gap-3 px-4 py-3.5">
    <View className="w-9 h-9 bg-gray-100 rounded-xl items-center justify-center">
      <Text>{icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-gray-500 text-xs mb-0.5">{label}</Text>
      <Text className="text-gray-900 font-medium text-sm">{value}</Text>
    </View>
  </View>
);

const ActionRow = ({
  icon,
  label,
  sublabel,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between px-4 py-3.5"
  >
    <View className="flex-row items-center gap-3">
      <View className="w-9 h-9 bg-gray-100 rounded-xl items-center justify-center">
        <Text>{icon}</Text>
      </View>
      <View>
        <Text className="text-gray-900 font-medium text-sm">{label}</Text>
        <Text className="text-gray-500 text-xs">{sublabel}</Text>
      </View>
    </View>
    <Text className="text-gray-400 text-lg">›</Text>
  </TouchableOpacity>
);

export default Profile;