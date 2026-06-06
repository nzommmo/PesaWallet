import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosinstance';

interface Account {
  id: number;
  account_name: string;
  account_type: string;
  balance: string | number;
  category?: string;
  overspend_rule?: string;
  rollover_rule?: string;
}

const AccountManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBalances, setShowBalances] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; account: Account | null }>({
    show: false,
    account: null,
  });
  const [deleting, setDeleting] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedFilter, searchQuery, accounts]);

  const fetchData = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/accounts/');
      const raw = response?.data ?? response;
      const accountsData: Account[] = Array.isArray(raw) ? raw : [];

      if (!mountedRef.current) return;
      setAccounts(accountsData);

      const uniqueCategories = [
        ...new Set(
          accountsData
            .filter((acc) => acc.category && typeof acc.category === 'string')
            .map((acc) => acc.category as string)
        ),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      if (mountedRef.current) {
        setError('Failed to load accounts. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    if (selectedFilter === 'PRIMARY') {
      filtered = filtered.filter((acc) => acc.account_type === 'PRIMARY');
    } else if (selectedFilter === 'DIGITAL') {
      filtered = filtered.filter((acc) => acc.account_type === 'DIGITAL');
    } else if (selectedFilter !== 'ALL') {
      filtered = filtered.filter((acc) => acc.category === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((acc) => {
        const nameMatch = acc.account_name
          ? acc.account_name.toLowerCase().includes(q)
          : false;
        const categoryMatch = acc.category
          ? acc.category.toLowerCase().includes(q)
          : false;
        return nameMatch || categoryMatch;
      });
    }

    setFilteredAccounts(filtered);
  };

  // Same endpoint pattern as Envelopes' onDeleteEnvelope
  const handleDeleteConfirm = async () => {
    if (!deleteModal.account) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/accounts/${deleteModal.account.id}/`);
      setDeleteModal({ show: false, account: null });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeleteModal({ show: false, account: null });
    } finally {
      if (mountedRef.current) {
        setDeleting(false);
      }
    }
  };

  const getAccountColor = (accountType: string, category?: string) => {
    if (accountType === 'PRIMARY') {
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    }

    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      Food:          { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      Transport:     { bg: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-200' },
      Housing:       { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200' },
      Entertainment: { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200' },
      Healthcare:    { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
      Education:     { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200' },
      Savings:       { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200' },
      Uncategorized: { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200' },
      Other:         { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-200' },
    };

    return (
      (category && categoryColors[category]) ||
      { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    );
  };

  const getTotalBalance = () => {
    return filteredAccounts.reduce((sum, acc) => {
      const parsed = parseFloat(String(acc.balance ?? '0'));
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

  const filterOptions = [
    { value: 'ALL',     label: 'All Accounts', icon: '💳' },
    { value: 'PRIMARY', label: 'Primary',       icon: '👛' },
    { value: 'DIGITAL', label: 'Digital',       icon: '💳' },
    ...categories.map((cat) => ({ value: cat, label: cat, icon: '🏷️' })),
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-lg">
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-semibold text-gray-900">Accounts</Text>
            <Text className="text-sm text-gray-600">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowBalances(!showBalances)}
            className="p-2 rounded-lg"
          >
            <Text className="text-xl">{showBalances ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center px-4 py-2.5 border border-gray-300 rounded-xl bg-white">
            <Text className="text-gray-400 text-lg mr-2">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search accounts..."
              placeholderTextColor="#9ca3af"
              className="flex-1 text-gray-900"
            />
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
          <View className="flex-row gap-2">
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedFilter(option.value)}
                className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${
                  selectedFilter === option.value ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <Text className="text-base">{option.icon}</Text>
                <Text className={`text-sm font-medium ${
                  selectedFilter === option.value ? 'text-white' : 'text-gray-700'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Loading State */}
      {loading && (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}

      {/* Error State */}
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
      {!loading && !error && (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View className="px-6 py-4">
            <View className="bg-blue-600 rounded-2xl p-5">
              <Text className="text-blue-100 text-sm mb-1">
                {selectedFilter === 'ALL' ? 'Total Balance' : `${selectedFilter} Balance`}
              </Text>
              <Text className="text-3xl font-bold text-white">
                {showBalances ? `KES ${getTotalBalance().toLocaleString()}` : 'KES ••••••'}
              </Text>
            </View>
          </View>

          {/* Accounts List */}
          <View className="px-6 pb-6">
            {filteredAccounts.length === 0 ? (
              <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
                <Text className="text-4xl mb-3">🏷️</Text>
                <Text className="font-semibold text-gray-900 mb-2">No accounts found</Text>
                <Text className="text-gray-600 text-sm text-center mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'No accounts match this filter'}
                </Text>
                {selectedFilter !== 'ALL' && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFilter('ALL');
                      setSearchQuery('');
                    }}
                  >
                    <Text className="text-blue-600 font-medium text-sm">Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="gap-3">
                {filteredAccounts.map((account) => {
                  const colors = getAccountColor(account.account_type, account.category);
                  const balance = parseFloat(String(account.balance ?? '0'));
                  const displayBalance = isNaN(balance) ? 0 : balance;

                  return (
                    <View
                      key={account.id}
                      className={`bg-white rounded-2xl p-4 border ${colors.border}`}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                            <Text className="font-semibold text-gray-900">
                              {account.account_name ?? '—'}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-full ${colors.bg}`}>
                              <Text className={`text-xs ${colors.text}`}>
                                {account.account_type === 'PRIMARY'
                                  ? 'Primary'
                                  : account.category || 'Uncategorized'}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-2xl font-bold text-gray-900">
                            {showBalances
                              ? `KES ${displayBalance.toLocaleString()}`
                              : 'KES ••••••'}
                          </Text>
                        </View>
                        {/* Delete icon in header, same position as Envelopes 🗑️ */}
                        <View className="flex-row items-center gap-1">
                          <View className={`w-12 h-12 ${colors.bg} rounded-xl items-center justify-center`}>
                            <Text className="text-2xl">
                              {account.account_type === 'PRIMARY' ? '👛' : '💳'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setDeleteModal({ show: true, account })}
                            className="p-2 rounded-lg"
                          >
                            <Text className="text-red-600">🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Account Details */}
                      <View className="flex-row gap-3 mb-3 pt-3 border-t border-gray-100">
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 mb-1">Overspend</Text>
                          <Text className="text-sm font-medium text-gray-900">
                            {account.overspend_rule === 'ALLOW' ? 'Allowed' : 'Blocked'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 mb-1">Rollover</Text>
                          <Text className="text-sm font-medium text-gray-900">
                            {account.rollover_rule === 'ROLLOVER' ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: '/accounts/[id]',
                              params: { id: account.id },
                            })
                          }
                          className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
                        >
                          <Text className="text-blue-600 font-medium text-sm">View Details</Text>
                        </TouchableOpacity>
                        {account.account_type === 'DIGITAL' && (
                          <TouchableOpacity
                            onPress={() =>
                              router.push({
                                pathname: '/envelopes/edit/[id]',
                                params: { id: account.id },
                              })
                            }
                            className="px-4 bg-gray-100 py-2 rounded-lg items-center"
                          >
                            <Text className="text-xl">✏️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View className="h-20" />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {!loading && !error && (
        <TouchableOpacity
          onPress={() => router.push('/envelopes/create')}
          className="absolute bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Text className="text-white text-3xl">+</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModal.show}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModal({ show: false, account: null })}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <View className="flex-row items-start gap-4 mb-4">
              <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
                <Text className="text-2xl">🗑️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">Delete Account?</Text>
                <Text className="text-sm text-gray-600">
                  Are you sure you want to delete "{deleteModal.account?.account_name}"? This action cannot be undone.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteModal({ show: false, account: null })}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 rounded-xl items-center flex-row justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-medium">Deleting...</Text>
                  </>
                ) : (
                  <Text className="text-white font-medium">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountManagement;