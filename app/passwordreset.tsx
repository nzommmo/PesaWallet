import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosinstance';

const PasswordReset = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // Plain state for progress bar (0–100%) — avoids the native animated 'width' restriction
  const [progressPct, setProgressPct] = useState(0);

  const mountedRef = useRef(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startLogoutCountdown = () => {
    let secs = 5;
    setCountdown(secs);
    setProgressPct(0);

    countdownRef.current = setInterval(() => {
      secs -= 1;
      if (!mountedRef.current) {
        clearInterval(countdownRef.current!);
        return;
      }
      if (secs <= 0) {
        clearInterval(countdownRef.current!);
        setProgressPct(100);
        performLogout();
      } else {
        setCountdown(secs);
        // 5→4→3→2→1 maps progress to 20→40→60→80→(100 on exit)
        setProgressPct(((5 - secs) / 5) * 100);
      }
    }, 1000);
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['Access_Token', 'Refresh_Token', 'user']);
    } catch (err) {
      console.warn('Storage clear failed on logout:', err);
    }
    router.replace('/(auth)/SignIn');
  };

  /* ── Validation ── */
  const validate = (): string | null => {
    if (!oldPassword.trim()) return 'Please enter your current password.';
    if (newPassword.length < 6) return 'New password must be at least 6 characters.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    if (newPassword === oldPassword) return 'New password must differ from the current one.';
    return null;
  };

  /* ── Strength meter ── */
  const getStrength = () => {
    if (!newPassword) return { level: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-red-400' };
    if (score === 2) return { level: score, label: 'Fair', color: 'bg-yellow-400' };
    if (score === 3) return { level: score, label: 'Good', color: 'bg-blue-400' };
    return { level: score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  /* ── Submit ── */
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Check your input', err);
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.patch('/users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (!mountedRef.current) return;
      startLogoutCountdown();
    } catch (error: any) {
      if (!mountedRef.current) return;
      const msg =
        error?.response?.data?.old_password?.[0] ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Could not update password', msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  /* ── EyeIcon ── */
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Text className="text-gray-400 text-base">{visible ? '🙈' : '👁️'}</Text>
  );

  const isLocked = countdown !== null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      {/* ── Success / Countdown Banner ── */}
      {isLocked && (
        <View className="mx-4 mt-3 bg-green-600 rounded-2xl px-5 py-4 shadow-lg">
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">✅</Text>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Password updated!</Text>
              <Text className="text-green-100 text-xs mt-0.5">
                You'll be logged out for security.
              </Text>
            </View>
            {/* Plain Text re-renders on state change — no Animated needed */}
            <Text className="text-white font-black text-4xl w-12 text-center">
              {countdown}
            </Text>
          </View>

          {/* Progress bar — plain View with inline style width%, no Animated */}
          <View className="mt-3 h-2 bg-green-500/40 rounded-full overflow-hidden">
            <View
              style={{ width: `${progressPct}%` }}
              className="h-full bg-white/80 rounded-full"
            />
          </View>
          <Text className="text-green-200 text-xs text-center mt-1.5">
            Logging out in {countdown} second{countdown !== 1 ? 's' : ''}…
          </Text>
        </View>
      )}

      {/* ── Hero Header ── */}
      <View className="bg-blue-600 rounded-b-3xl pb-8">
        {/* Top nav */}
        <View className="flex-row items-center justify-between px-6 pt-5 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLocked}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Text className="text-white text-lg">←</Text>
          </TouchableOpacity>

          <Text className="text-white/80 text-xs tracking-widest uppercase font-medium">
            Security
          </Text>

          <View className="w-10" />
        </View>

        {/* Icon + title */}
        <View className="items-center px-6">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4 border-4 border-white/30">
            <Text className="text-4xl">🔒</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">Change Password</Text>
          <Text className="text-blue-100 text-sm text-center">
            Update your security credentials below
          </Text>
        </View>
      </View>

      {/* ── Form ── */}
      <View className="px-6 mt-6 flex-1">

        {/* Current password */}
        <View className="mb-4">
          <Text className="text-gray-500 text-xs uppercase tracking-widest mb-2 ml-1">
            Current Password
          </Text>
          <View className="bg-white border border-gray-200 rounded-2xl flex-row items-center px-4 py-3.5">
            <Text className="text-lg mr-3">🔑</Text>
            <TextInput
              className="flex-1 text-gray-900 font-medium text-sm"
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showOld}
              value={oldPassword}
              onChangeText={setOldPassword}
              editable={!isLocked}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowOld((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <EyeIcon visible={showOld} />
            </TouchableOpacity>
          </View>
        </View>

        {/* New password */}
        <View className="mb-2">
          <Text className="text-gray-500 text-xs uppercase tracking-widest mb-2 ml-1">
            New Password
          </Text>
          <View className="bg-white border border-gray-200 rounded-2xl flex-row items-center px-4 py-3.5">
            <Text className="text-lg mr-3">🔐</Text>
            <TextInput
              className="flex-1 text-gray-900 font-medium text-sm"
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!isLocked}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNew((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <EyeIcon visible={showNew} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Strength meter */}
        {newPassword.length > 0 && (
          <View className="mb-4 px-1">
            <View className="flex-row gap-1 mb-1">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    i <= strength.level ? strength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </View>
            <Text className="text-gray-400 text-xs ml-0.5">
              Strength:{' '}
              <Text className="font-semibold text-gray-600">{strength.label}</Text>
            </Text>
          </View>
        )}

        {/* Confirm password */}
        <View className="mb-6">
          <Text className="text-gray-500 text-xs uppercase tracking-widest mb-2 ml-1">
            Confirm New Password
          </Text>
          <View
            className={`bg-white border rounded-2xl flex-row items-center px-4 py-3.5 ${
              confirmPassword && confirmPassword !== newPassword
                ? 'border-red-300'
                : 'border-gray-200'
            }`}
          >
            <Text className="text-lg mr-3">✅</Text>
            <TextInput
              className="flex-1 text-gray-900 font-medium text-sm"
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLocked}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <EyeIcon visible={showConfirm} />
            </TouchableOpacity>
          </View>
          {confirmPassword !== '' && confirmPassword !== newPassword && (
            <Text className="text-red-400 text-xs mt-1.5 ml-1">Passwords don't match</Text>
          )}
        </View>

        {/* Tips */}
        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <Text className="text-blue-700 text-xs font-semibold mb-2">💡 Password Tips</Text>
          {[
            'At least 8 characters long',
            'Mix uppercase & lowercase letters',
            'Include numbers and symbols',
          ].map((tip) => (
            <View key={tip} className="flex-row items-center gap-2 mb-1">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <Text className="text-blue-600 text-xs">{tip}</Text>
            </View>
          ))}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || isLocked}
          className={`rounded-2xl py-4 items-center justify-center mb-4 ${
            loading || isLocked ? 'bg-blue-300' : 'bg-blue-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : isLocked ? (
            <Text className="text-white font-bold text-base">Logging out…</Text>
          ) : (
            <Text className="text-white font-bold text-base">Update Password</Text>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        {!isLocked && (
          <TouchableOpacity onPress={() => router.back()} className="items-center py-3">
            <Text className="text-gray-400 text-sm">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PasswordReset;