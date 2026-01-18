import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import axiosInstance from '../../axiosinstance';
import Envelopes from '../envelopes/envelopes';

export class index extends Component {
  state = {
    showBalance: true,
    user: null,
    loading: true,
    refreshing: false,
    error: '',
    balance: 0,
    envelopes: [],
    alerts: [],
    allAccounts: [],
    selectedAccountIndex: 0
  };

  componentDidMount() {
    this.loadUserData();
    this.fetchDashboardData();
  }

  loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        this.setState({ user: JSON.parse(userData) });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  fetchDashboardData = async () => {
    this.setState({ loading: true, error: '' });
    
    try {
      const accountsResponse = await axiosInstance.get('/accounts/');
      
      const accountsData = Array.isArray(accountsResponse) ? accountsResponse : [];
      const formattedAccounts = accountsData.map(acc => ({
        id: acc.id,
        name: acc.account_name,
        type: acc.account_type,
        balance: parseFloat(acc.balance || 0),
        category: acc.category,
        color: this.getAccountColor(acc.account_type, acc.category)
      }));
      
      const totalBalance = formattedAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      
      const digitalAccounts = accountsData
        .filter(acc => acc.account_type === 'DIGITAL')
        .map(acc => {
          let timelinePercent = 50;
          let timelineText = '15/30 days';
          
          if (acc.start_date && acc.end_date) {
            const start = new Date(acc.start_date);
            const end = new Date(acc.end_date);
            const now = new Date();
            const total = end - start;
            const elapsed = now - start;
            timelinePercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
            
            const totalDays = Math.ceil(total / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.ceil(elapsed / (1000 * 60 * 60 * 24));
            timelineText = `${Math.max(0, elapsedDays)}/${totalDays} days`;
          }
          
          const balance = parseFloat(acc.balance || 0);
          const limitAmount = parseFloat(acc.limit_amount || 0);
          const healthPercentage = parseFloat(acc.health_percentage || 0);
          const spent = Math.max(0, limitAmount - balance);

          return {
            id: acc.id,
            name: acc.account_name,
            category: acc.category || 'Uncategorized',
            spent: spent,
            budget: limitAmount,
            timeline: timelineText,
            timelinePercent: timelinePercent,
            color: this.getCategoryColor(acc.category || 'Uncategorized'),
            balance: balance,
            healthPercentage: healthPercentage
          };
        });
      
      this.setState({
        allAccounts: formattedAccounts,
        balance: totalBalance,
        envelopes: digitalAccounts
      });
      
      this.generateAlerts(digitalAccounts);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      this.setState({ error: 'Failed to load dashboard data. Please try again.' });
    } finally {
      this.setState({ loading: false, refreshing: false });
    }
  };

  onRefresh = () => {
    this.setState({ refreshing: true });
    this.fetchDashboardData();
  };

  generateAlerts = (accounts) => {
    const newAlerts = [];
    
    accounts.forEach(acc => {
      if (acc.balance < 100 && acc.balance > 0) {
        newAlerts.push({
          type: 'warning',
          title: 'Low Balance Alert',
          message: `${acc.name} envelope is running low (KES ${acc.balance.toFixed(2)})`,
          color: 'yellow'
        });
      }
      
      if (acc.balance === 0) {
        newAlerts.push({
          type: 'warning',
          title: 'Empty Envelope',
          message: `${acc.name} has no funds available`,
          color: 'yellow'
        });
      }
    });
    
    this.setState({ alerts: newAlerts });
  };

  getAccountColor = (accountType, category) => {
    if (accountType === 'PRIMARY') {
      return { bg: '#2563eb', text: '#ffffff' };
    }
    
    const categoryColors = {
      'Food': { bg: '#059669', text: '#ffffff' },
      'Transport': { bg: '#0891b2', text: '#ffffff' },
      'Housing': { bg: '#7c3aed', text: '#ffffff' },
      'Entertainment': { bg: '#d97706', text: '#ffffff' },
      'Healthcare': { bg: '#dc2626', text: '#ffffff' },
      'Education': { bg: '#0284c7', text: '#ffffff' },
      'Savings': { bg: '#0d9488', text: '#ffffff' },
      'Uncategorized': { bg: '#475569', text: '#ffffff' },
      'Other': { bg: '#6b7280', text: '#ffffff' }
    };
    
    return categoryColors[category] || { bg: '#6b7280', text: '#ffffff' };
  };

  getCategoryColor = (categoryName) => {
    const colors = {
      'Food': '#059669',
      'Transport': '#0891b2',
      'Housing': '#7c3aed',
      'Entertainment': '#d97706',
      'Healthcare': '#dc2626',
      'Education': '#0284c7',
      'Savings': '#0d9488',
      'Uncategorized': '#475569',
      'Other': '#6b7280'
    };
    return colors[categoryName] || '#6b7280';
  };

  handleNextAccount = () => {
    this.setState(prevState => ({
      selectedAccountIndex: (prevState.selectedAccountIndex + 1) % prevState.allAccounts.length
    }));
  };

  handlePrevAccount = () => {
    this.setState(prevState => ({
      selectedAccountIndex: (prevState.selectedAccountIndex - 1 + prevState.allAccounts.length) % prevState.allAccounts.length
    }));
  };

  handleDeleteEnvelope = async (envelopeId) => {
    try {
      await axiosInstance.delete(`/accounts/${envelopeId}/`);
      await this.fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete envelope:', err);
      Alert.alert('Error', 'Failed to delete envelope');
    }
  };

  handleCreateEnvelope = () => {
    router.push('/envelope');
  };

  render() {
    const { 
      showBalance, user, loading, refreshing, error, 
      balance, envelopes, alerts, allAccounts, selectedAccountIndex 
    } = this.state;

    const currentAccount = allAccounts[selectedAccountIndex];

    if (loading && !refreshing) {
      return (
        <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
          <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
          <ActivityIndicator size="large" color="#2563eb" />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={currentAccount ? currentAccount.color.bg : '#2563eb'} 
        />
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />
          }
        >
          {/* Error State */}
          {error && (
            <View className="px-6 py-6">
              <View className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <Text className="text-sm text-red-800 mb-2">{error}</Text>
                <TouchableOpacity onPress={this.fetchDashboardData}>
                  <Text className="text-sm text-red-600 font-medium">Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Header Section */}
          <View 
            className="rounded-b-3xl pb-8 shadow-lg"
            style={{ 
              backgroundColor: currentAccount ? currentAccount.color.bg : '#2563eb',
              paddingTop: StatusBar.currentHeight || 44,
              paddingHorizontal: 24
            }}
          >
            {/* Welcome Header */}
            <View className="flex-row items-center justify-between mt-4 mb-6">
              <View>
                <Text className="text-blue-100 text-sm mb-1">Welcome back,</Text>
                <Text className="text-white text-2xl font-bold">
                  {user?.full_name || 'John Doe'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
              >
                <Text className="text-white font-semibold text-lg">
                  {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <View className="bg-white/10 rounded-2xl p-4 mb-4">
              {allAccounts.length > 0 && currentAccount ? (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-sm font-medium">{currentAccount.name}</Text>
                      {currentAccount.type === 'DIGITAL' && currentAccount.category && (
                        <View className="px-2 py-0.5 rounded-full bg-white/20">
                          <Text className="text-xs text-white">{currentAccount.category}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => this.setState({ showBalance: !showBalance })}>
                      <Text className="text-white text-lg">{showBalance ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text className="text-white text-3xl font-bold mb-4">
                    {showBalance ? `KES ${currentAccount.balance.toLocaleString()}` : 'KES ••••••'}
                  </Text>

                  {/* Account Navigation */}
                  {allAccounts.length > 1 && (
                    <View className="flex-row items-center justify-center gap-2 mb-4">
                      <TouchableOpacity onPress={this.handlePrevAccount}>
                        <Text className="text-white/70 text-2xl">‹</Text>
                      </TouchableOpacity>
                      
                      <View className="flex-row items-center gap-1.5">
                        {allAccounts.map((_, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => this.setState({ selectedAccountIndex: index })}
                          >
                            <View
                              className={`h-1.5 rounded-full ${
                                index === selectedAccountIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <TouchableOpacity onPress={this.handleNextAccount}>
                        <Text className="text-white/70 text-2xl">›</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-blue-100 text-sm">Total Balance</Text>
                    <TouchableOpacity onPress={() => this.setState({ showBalance: !showBalance })}>
                      <Text className="text-white text-lg">{showBalance ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-white text-3xl font-bold mb-4">
                    {showBalance ? `KES ${balance.toLocaleString()}` : 'KES ••••••'}
                  </Text>
                </>
              )}
              
              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/transfer')}
                  className="flex-1 bg-white/90 py-3 rounded-xl items-center"
                >
                  <Text className="text-gray-900 font-semibold">💸 Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/payments')}
                  className="flex-1 bg-green-100/90 py-3 rounded-xl items-center"
                >
                  <Text className="text-gray-900 font-semibold">💳 Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/top-up')}
                  className="flex-1 bg-white/20 py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">➕ Top Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <View className="px-6 mt-6 gap-3">
              {alerts.map((alert, index) => (
                <View
                  key={index}
                  className={`${
                    alert.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                  } border rounded-2xl p-4 flex-row items-start gap-3`}
                >
                  <Text className="text-xl">⚠️</Text>
                  <View className="flex-1">
                    <Text className={`font-semibold mb-1 ${
                      alert.color === 'yellow' ? 'text-yellow-900' : 'text-green-900'
                    }`}>
                      {alert.title}
                    </Text>
                    <Text className={`text-sm ${
                      alert.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {alert.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Envelopes Component */}
          <Envelopes 
            envelopes={envelopes}
            onCreateEnvelope={this.handleCreateEnvelope}
            onDeleteEnvelope={this.handleDeleteEnvelope}
            onRefresh={this.fetchDashboardData}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default index;