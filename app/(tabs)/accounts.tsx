import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

const accounts = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [weeklySpending, setWeeklySpending] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netChange: 0,
    transactionCount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ============================================
  // API & DATA FETCHING
  // ============================================

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.get('/reports/');
      
      const processedTransactions = processTransactions(response.transactions_last_month || []);
      const digitalAccounts = (response.accounts || []).filter(acc => acc.account_type === 'DIGITAL');
      
      setTransactions(processedTransactions);
      calculateSummary(processedTransactions);
      generateInsights(digitalAccounts, processedTransactions);
      generateWeeklySpending(processedTransactions);
      generateCategorySpending(digitalAccounts);
      
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DATA PROCESSING
  // ============================================

  const processTransactions = (txnData) => {
    return txnData.map(txn => {
      const isIncome = txn.transaction_type === 'INCOME' || txn.transaction_type === 'ALLOCATION';
      return {
        id: txn.id,
        name: getTransactionName(txn.transaction_type, txn),
        category: txn.account_name || 'Unknown',
        amount: isIncome ? parseFloat(txn.amount) : -parseFloat(txn.amount),
        date: txn.created_at,
        formattedDate: formatDate(txn.created_at),
        tag: getTransactionTag(txn.transaction_type),
        type: getTransactionType(txn.transaction_type),
        status: txn.status || 'SUCCESS'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateSummary = (txns) => {
    const summary = txns.reduce((acc, txn) => {
      if (txn.amount > 0) {
        acc.totalIncome += txn.amount;
      } else {
        acc.totalExpense += Math.abs(txn.amount);
      }
      acc.transactionCount++;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, transactionCount: 0 });

    summary.netChange = summary.totalIncome - summary.totalExpense;
    setSummary(summary);
  };

  const generateInsights = (accounts, txns) => {
    const categoryTotals = {};
    const expenseTransactions = txns.filter(txn => txn.amount < 0);
    
    expenseTransactions.forEach(txn => {
      const category = txn.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(txn.amount);
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];
    
    const midMonth = new Date();
    midMonth.setDate(15);
    const firstHalf = expenseTransactions
      .filter(txn => new Date(txn.date) < midMonth)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    const secondHalf = expenseTransactions
      .filter(txn => new Date(txn.date) >= midMonth)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    
    const trendDirection = secondHalf > firstHalf ? 'increasing' : 'decreasing';
    const trendPercentage = firstHalf > 0 ? Math.abs(((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1) : 0;

    const envelopesOnTrack = accounts.filter(acc => {
      const balance = parseFloat(acc.balance || 0);
      const limit = parseFloat(acc.limit_amount || 0);
      return limit > 0 && (balance / limit) > 0.2;
    }).length;

    setInsights({
      topCategory: {
        name: topCategory ? topCategory[0] : 'N/A',
        amount: topCategory ? topCategory[1] : 0,
        percentage: topCategory && summary.totalExpense > 0 
          ? ((topCategory[1] / summary.totalExpense) * 100).toFixed(1) 
          : 0
      },
      spendingTrend: {
        direction: trendDirection,
        percentage: trendPercentage,
        description: `Your spending is ${trendDirection} by ${trendPercentage}% this month`
      },
      budgetPerformance: {
        envelopesOnTrack,
        totalEnvelopes: accounts.length,
        description: accounts.length > 0 
          ? `${envelopesOnTrack} of ${accounts.length} envelopes are on track` 
          : "Create envelopes to track budget"
      },
      savingsSuggestion: {
        amount: Math.round(summary.totalExpense * 0.15),
        from: topCategory ? topCategory[0] : 'expenses',
        to: 'Savings'
      }
    });
  };

  const generateWeeklySpending = (txns) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    const weekData = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      
      const dayTotal = txns
        .filter(txn => {
          const txnDate = new Date(txn.date);
          return txnDate.toDateString() === date.toDateString() && txn.amount < 0;
        })
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      
      return { day, amount: dayTotal };
    });
    
    setWeeklySpending(weekData);
  };

  const generateCategorySpending = (accounts) => {
    const spending = accounts
      .map(acc => {
        const balance = parseFloat(acc.balance || 0);
        const limit = parseFloat(acc.limit_amount || 0);
        const spent = Math.max(0, limit - balance);
        
        return {
          name: acc.account_name,
          category: acc.category || 'Other',
          spent,
          budget: limit,
          remaining: balance,
          percentage: limit > 0 ? ((spent / limit) * 100).toFixed(1) : 0,
          color: getCategoryColor(acc.category)
        };
      })
      .filter(cat => cat.budget > 0)
      .sort((a, b) => b.spent - a.spent);

    setCategorySpending(spending);
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#10b981',
      'Transport': '#3b82f6',
      'Housing': '#a855f7',
      'Entertainment': '#f59e0b',
      'Healthcare': '#ef4444',
      'Education': '#06b6d4',
      'Savings': '#14b8a6',
      'Other': '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const getTransactionName = (type) => {
    const names = { 
      INCOME: 'Income Added', 
      ALLOCATION: 'Funds Allocated', 
      TRANSFER: 'Transfer',
      PAYMENT: 'Payment Made' 
    };
    return names[type] || 'Transaction';
  };

  const getTransactionTag = (type) => {
    const tags = { 
      INCOME: 'Income', 
      ALLOCATION: 'Allocation', 
      TRANSFER: 'Transfer',
      PAYMENT: 'Payment' 
    };
    return tags[type] || 'Other';
  };

  const getTransactionType = (type) => {
    const types = { 
      INCOME: 'income', 
      ALLOCATION: 'income', 
      TRANSFER: 'transfer',
      PAYMENT: 'expense' 
    };
    return types[type] || 'other';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPercentage = (spent, budget) => {
    return budget === 0 ? 0 : Math.min(100, Math.round((spent / budget) * 100));
  };

  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    return t.type === transactionFilter;
  });

  const maxAmount = Math.max(...weeklySpending.map(d => d.amount), 1);

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-lg">
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-semibold text-gray-900">Account Monitoring</Text>
            <Text className="text-xs text-gray-500">Last 30 days</Text>
          </View>
          <TouchableOpacity onPress={fetchData} className="p-2 rounded-lg">
            <Text className="text-gray-700 text-xl">🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2">
          {['transactions', 'analytics', 'insights'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg ${
                activeTab === tab ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50'
              }`}
            >
              <Text className={`font-medium text-center capitalize ${
                activeTab === tab ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
        {!loading && !error && insights && (
          <>
            {/* Summary Cards */}
            <View className="px-6 py-4 flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center">
                    <Text className="text-green-600 text-lg">📈</Text>
                  </View>
                  <Text className="text-xs text-gray-500">Income</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  KES {summary.totalIncome.toLocaleString()}
                </Text>
              </View>
              
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center">
                    <Text className="text-red-600 text-lg">📉</Text>
                  </View>
                  <Text className="text-xs text-gray-500">Expenses</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  KES {summary.totalExpense.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <View className="px-6 py-4 gap-4">
                <View className="bg-blue-600 rounded-2xl p-6">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-sm text-blue-100 mb-2">Top Spending Category</Text>
                      <Text className="text-2xl font-bold text-white mb-1">{insights.topCategory.name}</Text>
                      <Text className="text-blue-100">KES {Math.round(insights.topCategory.amount).toLocaleString()}</Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-sm font-semibold text-white">{insights.topCategory.percentage}%</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-blue-100">of total spending this month</Text>
                </View>

                {/* Spending Trend */}
                <View className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-start gap-3">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    insights.spendingTrend.direction === 'increasing' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Text className="text-xl">
                      {insights.spendingTrend.direction === 'increasing' ? '📈' : '📉'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">Spending Trend</Text>
                    <Text className="text-sm text-gray-600">{insights.spendingTrend.description}</Text>
                  </View>
                </View>

                {/* Budget Performance */}
                <View className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-start gap-3">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                    <Text className="text-xl">💰</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">Budget Performance</Text>
                    <Text className="text-sm text-gray-600">{insights.budgetPerformance.description}</Text>
                  </View>
                </View>
                
                {/* Savings Suggestion */}
                {insights.savingsSuggestion.amount > 0 && (
                  <View className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-start gap-3">
                    <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                      <Text className="text-xl">💡</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">Savings Suggestion</Text>
                      <Text className="text-sm text-gray-600">
                        You could save KES {insights.savingsSuggestion.amount.toLocaleString()} by reducing {insights.savingsSuggestion.from} spending
                      </Text>
                    </View>
                  </View>
                )}

                {/* Net Change Card */}
                <View className={`rounded-2xl p-6 ${
                  summary.netChange >= 0 ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  <Text className="text-sm text-white/90 mb-2">Net Change This Month</Text>
                  <Text className="text-3xl font-bold text-white">
                    {summary.netChange >= 0 ? '+' : ''}KES {summary.netChange.toLocaleString()}
                  </Text>
                  <Text className="text-sm text-white/90 mt-2">
                    {summary.transactionCount} transactions
                  </Text>
                </View>
              </View>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <View className="px-6 py-4 gap-6">
                {/* Weekly Spending Chart */}
                <View className="bg-white rounded-2xl p-5 border border-gray-100">
                  <Text className="font-semibold text-gray-900 mb-4">Weekly Spending Breakdown</Text>
                  <View className="flex-row items-end justify-between h-48 gap-2">
                    {weeklySpending.map((data, index) => {
                      const heightPercentage = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                      return (
                        <View key={index} className="flex-1 items-center">
                          <View className="w-full items-center justify-end" style={{ height: 160 }}>
                            {data.amount > 0 && (
                              <View
                                className="bg-blue-600 rounded-t-lg w-full"
                                style={{ height: `${heightPercentage}%`, minHeight: 8 }}
                              />
                            )}
                          </View>
                          <Text className="text-xs text-gray-600 font-medium mt-2">{data.day}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-sm text-gray-600">
                      Total: <Text className="font-semibold text-gray-900">
                        KES {weeklySpending.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Spending by Category */}
                <View className="bg-white rounded-2xl p-5 border border-gray-100">
                  <Text className="font-semibold text-gray-900 mb-4">Envelope Spending Overview</Text>
                  {categorySpending.length === 0 ? (
                    <View className="items-center py-8">
                      <Text className="text-4xl mb-3">⚠️</Text>
                      <Text className="text-gray-600 text-sm">No envelope spending data available</Text>
                    </View>
                  ) : (
                    <View className="gap-4">
                      {categorySpending.map((category, index) => (
                        <View key={index}>
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center gap-2 flex-1">
                              <View 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                                  {category.name}
                                </Text>
                                <Text className="text-xs text-gray-500">{category.category}</Text>
                              </View>
                            </View>
                            <View className="items-end ml-2">
                              <Text className="text-sm font-semibold text-gray-900">
                                KES {Math.round(category.spent).toLocaleString()}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                / {Math.round(category.budget).toLocaleString()}
                              </Text>
                            </View>
                          </View>
                          <View className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <View
                              className="h-2 rounded-full"
                              style={{ 
                                width: `${getPercentage(category.spent, category.budget)}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">{category.percentage}% used</Text>
                            <Text className="text-xs text-gray-500">
                              KES {Math.round(category.remaining).toLocaleString()} left
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <View className="px-6 py-4">
                {/* Filter Buttons */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {['all', 'income', 'expense', 'transfer'].map(filter => (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setTransactionFilter(filter)}
                        className={`px-4 py-2 rounded-lg ${
                          transactionFilter === filter
                            ? 'bg-blue-600'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <Text className={`font-medium capitalize ${
                          transactionFilter === filter ? 'text-white' : 'text-gray-600'
                        }`}>
                          {filter} ({filter === 'all' ? transactions.length : transactions.filter(t => t.type === filter).length})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Transaction List */}
                <View className="gap-3">
                  {filteredTransactions.length === 0 ? (
                    <View className="items-center py-12 bg-white rounded-2xl border border-gray-100">
                      <Text className="text-4xl mb-3">⚠️</Text>
                      <Text className="text-gray-600 font-medium mb-1">No transactions found</Text>
                      <Text className="text-sm text-gray-500">Transactions will appear here</Text>
                    </View>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <View key={transaction.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center gap-3">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${
                          transaction.type === 'transfer' ? 'bg-blue-100' : 
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Text className="text-xl">
                            {transaction.type === 'transfer' ? '→' : 
                             transaction.type === 'income' ? '↙' : '↗'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-900" numberOfLines={1}>
                            {transaction.name}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-xs text-gray-500" numberOfLines={1}>
                              {transaction.category}
                            </Text>
                            <Text className="text-xs text-gray-500">•</Text>
                            <Text className="text-xs text-gray-500" numberOfLines={1}>
                              {transaction.formattedDate}
                            </Text>
                          </View>
                          <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${
                            transaction.type === 'income' ? 'bg-green-100' :
                            transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <Text className={`text-xs ${
                              transaction.type === 'income' ? 'text-green-700' :
                              transaction.type === 'expense' ? 'text-red-700' : 'text-blue-700'
                            }`}>
                              {transaction.tag}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className={`font-bold text-lg ${
                            transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.amount < 0 ? '-' : '+'}KES {Math.abs(transaction.amount).toLocaleString()}
                          </Text>
                          <View className={`px-2 py-0.5 rounded-full ${
                            transaction.status === 'SUCCESS' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Text className={`text-xs ${
                              transaction.status === 'SUCCESS' ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {transaction.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default accounts;