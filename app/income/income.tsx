import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

const income = () => {
  const [incomeSources, setIncomeSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [toastOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2700),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast({ show: false, message: '', type: '' });
      });
    }
  }, [toast.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const incomeResponse = await axiosInstance.get('/incomes/');
      setIncomeSources(incomeResponse || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load income data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalIncome = () => {
    return incomeSources.reduce((total, source) => total + parseFloat(source.amount || 0), 0);
  };

  const getSourceCount = () => {
    return incomeSources.length;
  };

  const getActiveSourceCount = () => {
    return incomeSources.filter(source => source.is_active).length;
  };

  const handleEdit = (id) => {
    router.push(`/income/edit/${id}`);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Income Source',
      'Are you sure you want to delete this income source?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/incomes/${id}/`);
              showToast('Income deleted successfully');
              fetchData();
            } catch (err) {
              console.error('Failed to delete income:', err);
              showToast('Failed to delete income', 'error');
            }
          }
        }
      ]
    );
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'FORTNIGHT': 'Fortnightly',
      'MONTHLY': 'Monthly',
      'ONE_OFF': 'One-time'
    };
    return labels[frequency] || frequency;
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      'DAILY': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'WEEKLY': { bg: 'bg-purple-100', text: 'text-purple-700' },
      'FORTNIGHT': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      'MONTHLY': { bg: 'bg-green-100', text: 'text-green-700' },
      'ONE_OFF': { bg: 'bg-gray-100', text: 'text-gray-700' }
    };
    return colors[frequency] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysUntilNext = (nextRunDate) => {
    if (!nextRunDate) return null;
    const today = new Date();
    const next = new Date(nextRunDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <Animated.View 
          style={{ opacity: toastOpacity }}
          className="absolute top-4 left-6 right-6 z-50"
        >
          <View className={`px-6 py-3 rounded-xl shadow-lg flex-row items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <Text className="text-white text-lg">
              {toast.type === 'success' ? '✓' : '⚠️'}
            </Text>
            <Text className="text-white font-medium flex-1">{toast.message}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg"
          >
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Income Management</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
            <Text className="text-red-600 text-lg">⚠️</Text>
            <View className="flex-1">
              <Text className="text-sm text-red-800">{error}</Text>
              <TouchableOpacity onPress={fetchData} className="mt-2">
                <Text className="text-sm text-red-600 font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Total Income Card */}
            <View className="bg-green-600 rounded-2xl p-6 mb-6">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-white text-lg">📈</Text>
                <Text className="text-sm text-green-100">Total Income</Text>
              </View>
              <Text className="text-4xl font-bold text-white mb-2">
                KES {getTotalIncome().toLocaleString()}
              </Text>
              <Text className="text-green-100 text-sm">
                {getActiveSourceCount()} active {getActiveSourceCount() === 1 ? 'source' : 'sources'} • {getSourceCount()} total
              </Text>
            </View>

            {/* Income Sources Section */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Income Sources</Text>
              <TouchableOpacity
                onPress={() => router.push('/income/create')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-blue-600 font-medium text-sm">+ Add Income</Text>
              </TouchableOpacity>
            </View>

            {/* Income Source Cards */}
            <View className="gap-4">
              {incomeSources.length === 0 ? (
                <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Text className="text-4xl mb-3">📈</Text>
                  <Text className="text-gray-600 mb-4">No income sources yet</Text>
                  <TouchableOpacity onPress={() => router.push('/income/create')}>
                    <Text className="text-blue-600 font-medium">Add your first income source</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                incomeSources.map((source) => {
                  const daysUntilNext = getDaysUntilNext(source.next_run_date);
                  const colors = getFrequencyColor(source.frequency);
                  return (
                    <View
                      key={source.id}
                      className={`bg-white rounded-2xl p-5 border ${
                        source.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                            <Text className="font-semibold text-gray-900">
                              {source.source_name}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-full ${colors.bg}`}>
                              <Text className={`text-xs ${colors.text}`}>
                                {getFrequencyLabel(source.frequency)}
                              </Text>
                            </View>
                            {!source.is_active && (
                              <View className="px-2 py-0.5 rounded-full bg-red-100">
                                <Text className="text-xs text-red-700">Inactive</Text>
                              </View>
                            )}
                          </View>
                          {source.description && (
                            <Text className="text-sm text-gray-500 mb-2">
                              {source.description}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => handleEdit(source.id)}
                            className="p-2 rounded-lg"
                          >
                            <Text className="text-blue-600 text-lg">✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(source.id)}
                            className="p-2 rounded-lg"
                          >
                            <Text className="text-red-600 text-lg">✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Amount */}
                      <View className="mb-4">
                        <Text className="text-xs text-gray-500 mb-1">Amount</Text>
                        <Text className="font-bold text-gray-900 text-2xl">
                          KES {parseFloat(source.amount).toLocaleString()}
                        </Text>
                      </View>

                      {/* Dates Grid */}
                      <View className="flex-row gap-4 pt-4 border-t border-gray-100">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Text className="text-gray-400 text-base">🔄</Text>
                            <Text className="text-xs text-gray-500">Last Applied</Text>
                          </View>
                          <Text className="text-sm font-medium text-gray-700">
                            {formatDate(source.last_applied)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <Text className="text-gray-400 text-base">📅</Text>
                            <Text className="text-xs text-gray-500">Next Payment</Text>
                          </View>
                          <Text className="text-sm font-medium text-gray-700">
                            {formatDate(source.next_run_date)}
                            {daysUntilNext !== null && daysUntilNext >= 0 && (
                              <Text className="text-xs text-gray-500">
                                {' '}({daysUntilNext} {daysUntilNext === 1 ? 'day' : 'days'})
                              </Text>
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* Next payment alert */}
                      {source.is_active && daysUntilNext !== null && daysUntilNext <= 3 && daysUntilNext >= 0 && (
                        <View className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <Text className="text-xs text-green-700">
                            💰 Next payment coming {daysUntilNext === 0 ? 'today' : `in ${daysUntilNext} ${daysUntilNext === 1 ? 'day' : 'days'}`}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Add Income Button (Bottom) */}
            {incomeSources.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/income/add')}
                className="w-full mt-6 bg-green-600 py-4 rounded-xl items-center flex-row justify-center gap-2"
              >
                <Text className="text-white text-lg">+</Text>
                <Text className="text-white font-semibold">Add Income Source</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default income;