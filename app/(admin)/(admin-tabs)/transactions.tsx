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

interface Transaction {
  id: number;
  user: string;
  type: 'PAYMENT' | 'TRANSFER' | 'INCOME' | string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  created_at: string;
}

type FilterType = 'ALL' | 'PAYMENT' | 'TRANSFER' | 'INCOME' | 'FAILED';

const FILTERS: FilterType[] = ['ALL', 'PAYMENT', 'TRANSFER', 'INCOME', 'FAILED'];

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  PAYMENT:  { icon: '💳', color: 'text-blue-600',   bg: 'bg-blue-50'   },
  TRANSFER: { icon: '↔️', color: 'text-purple-600', bg: 'bg-purple-50' },
  INCOME:   { icon: '📈', color: 'text-green-600',  bg: 'bg-green-50'  },
  DEFAULT:  { icon: '💸', color: 'text-gray-600',   bg: 'bg-gray-50'   },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  SUCCESS: { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' },
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  FAILED:  { color: 'text-red-700',   bg: 'bg-red-100',   dot: 'bg-red-500'   },
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    fetchTransactions(activeFilter);
  }, [activeFilter]);

  const fetchTransactions = async (filter: FilterType) => {
    try {
      const url =
        filter === 'ALL'
          ? '/internal/transactions/'
          : `/internal/transactions/?type=${filter}`;
      const response = await axiosInstance.get(url);
      setTransactions(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(activeFilter);
  };

  // Summary counts
  const summary = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === 'SUCCESS').length,
    pending: transactions.filter((t) => t.status === 'PENDING').length,
    failed: transactions.filter((t) => t.status === 'FAILED').length,
    volume: transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0),
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

            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-white text-2xl font-bold">Transactions</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {summary.total} total records
                </Text>
              </View>
              <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center">
                <Text className="text-3xl">💸</Text>
              </View>
            </View>

            {/* Summary Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Success</Text>
                <Text className="text-green-400 font-bold text-lg">{summary.success}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Pending</Text>
                <Text className="text-yellow-400 font-bold text-lg">{summary.pending}</Text>
              </View>
              <View className="flex-1 bg-white/10 rounded-2xl p-3">
                <Text className="text-gray-400 text-xs">Failed</Text>
                <Text className="text-red-400 font-bold text-lg">{summary.failed}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total Volume */}
        <View className="mx-6 mt-4 bg-gray-900 rounded-2xl p-4 flex-row items-center justify-between">
          <Text className="text-gray-400 text-sm">Success Volume</Text>
          <Text className="text-white font-bold text-lg">
            KES {summary.volume.toLocaleString()}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View className="px-6 mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => {
                    setLoading(true);
                    setActiveFilter(filter);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    activeFilter === filter
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activeFilter === filter ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Transaction List */}
        <View className="px-6 mt-4 mb-10">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#1f2937" />
              <Text className="text-gray-500 mt-3">Loading transactions...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-gray-500 font-medium">No transactions found</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Try a different filter
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {transactions.map((tx) => {
                const typeConfig = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.DEFAULT;
                const statusConfig = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDING;

                return (
                  <View
                    key={tx.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4"
                  >
                    {/* Top Row */}
                    <View className="flex-row items-center gap-3 mb-3">
                      {/* Type Icon */}
                      <View
                        className={`w-11 h-11 ${typeConfig.bg} rounded-xl items-center justify-center`}
                      >
                        <Text className="text-xl">{typeConfig.icon}</Text>
                      </View>

                      {/* User + Type */}
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                          {tx.user}
                        </Text>
                        <Text className={`text-xs font-medium ${typeConfig.color}`}>
                          {tx.type}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text className="text-gray-900 font-bold text-base">
                        KES {tx.amount.toLocaleString()}
                      </Text>
                    </View>

                    {/* Bottom Row */}
                    <View className="flex-row items-center justify-between">
                      {/* Status Badge */}
                      <View
                        className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg}`}
                      >
                        <View className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <Text className={`text-xs font-semibold ${statusConfig.color}`}>
                          {tx.status}
                        </Text>
                      </View>

                      {/* Date */}
                      <Text className="text-gray-400 text-xs">
                        {formatDate(tx.created_at)}
                      </Text>

                      {/* TX ID */}
                      <Text className="text-gray-300 text-xs">#{tx.id}</Text>
                    </View>
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