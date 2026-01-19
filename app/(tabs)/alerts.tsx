import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../axiosinstance';

const alerts = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [toastOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchNotifications();
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

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/notifications/');
      const transformedNotifications = response.map(notification => ({
        id: notification.id,
        type: getNotificationType(notification.notification_type),
        title: getNotificationTitle(notification.notification_type),
        message: notification.message,
        time: 'Just now',
        read: notification.is_read,
        action: getNotificationAction(notification.message),
        actionType: 'link'
      }));
      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationType = (apiType) => {
    switch (apiType) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'warning';
      case 'INFO':
        return 'info';
      default:
        return 'info';
    }
  };

  const getNotificationTitle = (apiType) => {
    switch (apiType) {
      case 'SUCCESS':
        return 'Success';
      case 'WARNING':
        return 'Warning';
      case 'ERROR':
        return 'Alert';
      case 'INFO':
        return 'Information';
      default:
        return 'Notification';
    }
  };

  const getNotificationAction = (message) => {
    if (message.toLowerCase().includes('income') || message.toLowerCase().includes('added')) {
      return 'View Account';
    // } else if (message.toLowerCase().includes('allocated')) {
    //   return 'View Envelopes';
    } else if (message.toLowerCase().includes('paid')) {
      return 'View Transaction';
    }
    return null;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return { icon: '⚠️', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' };
      case 'success':
        return { icon: '✓', bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case 'info':
        return { icon: 'ℹ️', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case 'expiring':
        return { icon: '⏰', bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
      default:
        return { icon: 'ℹ️', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));

      await axiosInstance.patch(`/notifications/${id}/`, {
        is_read: true
      });

      showToast('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: false } : n
      ));
      
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleDismiss = async (id) => {
    try {
      const previousNotifications = [...notifications];
      setNotifications(notifications.filter(n => n.id !== id));

      const response = await axiosInstance.delete(`/notifications/${id}/delete/`);
      
      if (response.status === 204 || !response.data) {
        showToast('Notification deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleAction = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.action === 'Add Funds' || notification.action === 'View Envelope') {
      router.push('/envelopes');
    } else if (notification.action === 'View Account') {
      router.push('/accounts');
    } else if (notification.action === 'View Transaction') {
      router.push('/transactions');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const allCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;

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
        <View className="flex-row items-center gap-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-lg"
          >
            <Text className="text-gray-700 text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Notifications</Text>
        </View>

        {/* Tab Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-lg ${
              activeTab === 'all' ? 'bg-blue-600' : 'bg-gray-100'
            }`}
          >
            <Text className={`font-medium text-center ${
              activeTab === 'all' ? 'text-white' : 'text-gray-600'
            }`}>
              All ({allCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('unread')}
            className={`flex-1 px-4 py-2 rounded-lg ${
              activeTab === 'unread' ? 'bg-blue-600' : 'bg-gray-100'
            }`}
          >
            <Text className={`font-medium text-center ${
              activeTab === 'unread' ? 'text-white' : 'text-gray-600'
            }`}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
          <Text className="text-red-600 text-lg">⚠️</Text>
          <View className="flex-1">
            <Text className="text-sm text-red-800">{error}</Text>
            <TouchableOpacity onPress={fetchNotifications} className="mt-2">
              <Text className="text-sm text-red-600 font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}

      {/* Notifications List */}
      {!loading && (
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {filteredNotifications.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">ℹ️</Text>
                <Text className="text-gray-600">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notification) => {
                const { icon, bgColor, textColor } = getIcon(notification.type);
                
                return (
                  <TouchableOpacity
                    key={notification.id}
                    onPress={() => handleNotificationClick(notification)}
                    className={`bg-white rounded-2xl p-4 border ${
                      notification.read 
                        ? 'border-gray-100 opacity-75' 
                        : 'border-blue-200'
                    }`}
                  >
                    <View className="flex-row items-start gap-3">
                      {/* Icon */}
                      <View className={`w-10 h-10 ${bgColor} rounded-full items-center justify-center`}>
                        <Text className={`text-xl ${textColor}`}>{icon}</Text>
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-1">
                          <Text className="font-semibold text-gray-900 flex-1">
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1.5" />
                          )}
                        </View>
                        <Text className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-500">{notification.time}</Text>
                          <View className="flex-row items-center gap-2">
                            {!notification.read && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <Text className="text-xs text-blue-600 font-medium">
                                  Mark as read
                                </Text>
                              </TouchableOpacity>
                            )}
                            {notification.action && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleAction(notification);
                                }}
                              >
                                <Text className="text-xs text-blue-600 font-medium">
                                  {notification.action}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Dismiss Button */}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="p-1"
                      >
                        <Text className="text-gray-400 text-xl">✕</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default alerts;