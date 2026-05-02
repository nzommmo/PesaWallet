import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  direction: 'IN' | 'OUT';
  source: string;
  destination: string;
  status: string;
  created_at: string;
}

interface AccountDetail {
  account: string;
  balance: number;
  transactions: Transaction[];
}

const AccountDetail = () => {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AccountDetail | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  // FIX: Track mount state to prevent setState calls after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/accounts/${id}/transactions/`);

      // FIX: Safely unwrap — axiosInstance may or may not auto-unwrap .data
      const raw = response?.data ?? response ?? {};

      // FIX: Normalise the shape so downstream code never crashes on undefined
      const normalised: AccountDetail = {
        account: raw.account ?? 'Account',
        balance: parseFloat(raw.balance ?? '0') || 0,
        // FIX: Guard against non-array transactions and sanitise each item
        transactions: Array.isArray(raw.transactions)
          ? raw.transactions.map((tx: any) => ({
              id: tx.id,
              type: tx.type ?? 'UNKNOWN',
              // FIX: Guard against NaN amounts
              amount: isNaN(parseFloat(tx.amount)) ? 0 : parseFloat(tx.amount),
              direction: tx.direction === 'IN' ? 'IN' : 'OUT',
              source: tx.source ?? '',
              destination: tx.destination ?? '',
              status: tx.status ?? '',
              created_at: tx.created_at ?? '',
            }))
          : [],
      };

      if (!mountedRef.current) return;
      setData(normalised);
    } catch (err) {
      console.error('Failed to fetch account details:', err);
      if (mountedRef.current) {
        setError('Failed to load account details. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: '💸' };
      case 'ALLOCATION':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: '📥' };
      case 'TRANSFER':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔄' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '💳' };
    }
  };

  const formatDate = (iso: string) => {
    // FIX: Guard against missing or invalid date strings
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      // FIX: Guard against invalid dates before grouping
      if (!tx.created_at) return;
      const date = new Date(tx.created_at);
      if (isNaN(date.getTime())) return;
      const label = date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return groups;
  };

  // FIX: Safe reduce helpers — avoids crashes if transactions is somehow stale
  const totalIn = data?.transactions
    .filter((t) => t.direction === 'IN')
    .reduce((s, t) => s + (isNaN(t.amount) ? 0 : t.amount), 0) ?? 0;

  const totalOut = data?.transactions
    .filter((t) => t.direction === 'OUT')
    .reduce((s, t) => s + (isNaN(t.amount) ? 0 : t.amount), 0) ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-lg">
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-semibold text-gray-900">
              {data?.account ?? 'Account Details'}
            </Text>
            <Text className="text-sm text-gray-500">Transaction History</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)} className="p-2 rounded-lg">
            <Text className="text-xl">{showBalance ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View className="px-6 py-6">
          <View className="p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
            <Text className="text-red-600 text-lg">⚠️</Text>
            <View className="flex-1">
              <Text className="text-sm text-red-800">{error}</Text>
              <TouchableOpacity onPress={fetchData} className="mt-2">
                <Text className="text-sm text-red-600 font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View className="px-6 py-4">
            <View className="bg-blue-600 rounded-2xl p-5">
              <Text className="text-blue-100 text-sm mb-1">Current Balance</Text>
              <Text className="text-3xl font-bold text-white">
                {showBalance
                  ? `KES ${data.balance.toLocaleString()}`
                  : 'KES ••••••'}
              </Text>
              <Text className="text-blue-200 text-sm mt-2">
                {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="px-6 mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3">
                <Text className="text-xs text-green-600 mb-1">Total In</Text>
                <Text className="text-base font-bold text-green-700">
                  {showBalance ? `KES ${totalIn.toLocaleString()}` : '••••••'}
                </Text>
              </View>
              <View className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3">
                <Text className="text-xs text-red-600 mb-1">Total Out</Text>
                <Text className="text-base font-bold text-red-700">
                  {showBalance ? `KES ${totalOut.toLocaleString()}` : '••••••'}
                </Text>
              </View>
            </View>
          </View>

          {/* Transactions grouped by date */}
          <View className="px-6 pb-10">
            <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              Transactions
            </Text>

            {data.transactions.length === 0 ? (
              <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
                <Text className="text-4xl mb-3">📭</Text>
                <Text className="font-semibold text-gray-900">No transactions yet</Text>
              </View>
            ) : (
              Object.entries(groupByDate(data.transactions)).map(([date, txs]) => (
                <View key={date} className="mb-4">
                  <Text className="text-xs text-gray-400 font-medium mb-2">{date}</Text>
                  <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {txs.map((tx, index) => {
                      const style = getTypeStyle(tx.type);
                      const isLast = index === txs.length - 1;
                      // FIX: Safely capitalise type — guards against empty string crash
                      const displayType = tx.type
                        ? tx.type.charAt(0) + tx.type.slice(1).toLowerCase()
                        : 'Unknown';
                      return (
                        <View
                          key={tx.id}
                          className={`flex-row items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}
                        >
                          {/* Icon */}
                          <View className={`w-10 h-10 ${style.bg} rounded-xl items-center justify-center`}>
                            <Text className="text-lg">{style.icon}</Text>
                          </View>

                          {/* Info */}
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 flex-wrap">
                              
                              <View className={`px-1.5 py-0.5 rounded-full ${style.bg}`}>
                                <Text className={`text-xs ${style.text}`}>{tx.type}</Text>
                              </View>
                            </View>
                            <Text className="text-xs text-gray-500 mt-0.5">
                              {tx.direction === 'OUT'
                                ? `To: ${tx.destination || '—'}`
                                : `From: ${tx.source || '—'}`}
                            </Text>
                            <Text className="text-xs text-gray-400">
                              {formatDate(tx.created_at)}
                            </Text>
                          </View>

                          {/* Amount */}
                          <Text
                            className={`text-sm font-bold ${
                              tx.direction === 'IN' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.direction === 'IN' ? '+' : '-'}
                            {showBalance ? `KES ${tx.amount.toLocaleString()}` : '••••••'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default AccountDetail;