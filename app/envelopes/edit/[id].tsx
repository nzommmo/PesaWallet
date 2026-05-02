import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../../axiosinstance';
const { id } = useLocalSearchParams();

interface Account {
  id: number;
  account_name: string;
  account_type: string;
  balance: number;
  limit_amount: number;
  category: string | null;
  category_id?: number;
  overspend_rule: string;
  rollover_rule: string;
  health_percentage: number;
}

interface Category {
  id: number;
  category_name: string;
}

export default function EditEnvelope() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [account, setAccount] = useState<Account | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [accountName, setAccountName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [limitAmount, setLimitAmount] = useState('');
  const [overspendRule, setOverspendRule] = useState('BLOCK');
  const [rolloverRule, setRolloverRule] = useState('ROLLOVER');

  // Track which fields changed
  const [nameChanged, setNameChanged] = useState(false);
  const [categoryChanged, setCategoryChanged] = useState(false);
  const [limitChanged, setLimitChanged] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [accountRes, categoriesRes] = await Promise.all([
        axiosInstance.get(`/accounts/${id}/`),
        axiosInstance.get('/categories/'),
      ]);

      const acc: Account = accountRes;
      setAccount(acc);
      setAccountName(acc.account_name);
      setLimitAmount(String(acc.limit_amount));
      setOverspendRule(acc.overspend_rule);
      setRolloverRule(acc.rollover_rule);

      const cats: Category[] = Array.isArray(categoriesRes) ? categoriesRes : [];
      setCategories(cats);

      // Find current category id by name
      if (acc.category) {
        const match = cats.find((c) => c.category_name === acc.category);
        if (match) setSelectedCategoryId(match.id);
      }
    } catch (err) {
      console.error('Failed to fetch account:', err);
      Alert.alert('Error', 'Failed to load account. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!accountName.trim()) {
      errors.account_name = 'Account name is required';
    }

    const limit = parseFloat(limitAmount);
    if (isNaN(limit) || limit < 0) {
      errors.limit_amount = 'Enter a valid limit amount';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !account) return;

    const payload: Record<string, any> = {};

    // Only send changed fields
    if (accountName.trim() !== account.account_name) {
      payload.account_name = accountName.trim();
    }

    if (account.account_type !== 'PRIMARY') {
      if (categoryChanged && selectedCategoryId !== null) {
        payload.category_id = selectedCategoryId;
      }

      const newLimit = parseFloat(limitAmount);
      if (newLimit !== parseFloat(String(account.limit_amount))) {
        payload.limit_amount = newLimit;
      }

      if (overspendRule !== account.overspend_rule) {
        payload.overspend_rule = overspendRule;
      }

      if (rolloverRule !== account.rollover_rule) {
        payload.rollover_rule = rolloverRule;
      }
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('No changes', 'Nothing has been changed.');
      return;
    }

    // Warn about limit change — it moves real funds
    if ('limit_amount' in payload) {
      const diff = parseFloat(limitAmount) - parseFloat(String(account.limit_amount));
      const direction = diff > 0 ? `deduct KES ${diff.toLocaleString()} from` : `return KES ${Math.abs(diff).toLocaleString()} to`;
      Alert.alert(
        'Confirm Limit Change',
        `This will ${direction} your Primary Account. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => submitSave(payload) },
        ],
      );
    } else {
      submitSave(payload);
    }
  };

  const submitSave = async (payload: Record<string, any>) => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/accounts/${id}/`, payload);
      Alert.alert('Saved', 'Account updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg =
        err?.limit_amount?.[0] ||
        err?.account_name?.[0] ||
        err?.category_id?.[0] ||
        err?.message ||
        err?.detail ||
        'Failed to save changes.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-500 mt-3">Loading account...</Text>
      </SafeAreaView>
    );
  }

  if (!account) return null;

  const isPrimary = account.account_type === 'PRIMARY';
  const currentLimit = parseFloat(String(account.limit_amount));
  const newLimit = parseFloat(limitAmount) || 0;
  const limitDiff = newLimit - currentLimit;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View className="bg-gray-900 rounded-b-3xl pb-8">
            <View className="px-6 pt-6">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-row items-center mb-6 self-start bg-white/10 px-4 py-2 rounded-full"
              >
                <Text className="text-white text-sm font-medium">← Back</Text>
              </TouchableOpacity>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white text-2xl font-bold">Edit Account</Text>
                  <Text className="text-gray-400 text-sm mt-1">{account.account_name}</Text>
                </View>
                <View className="w-14 h-14 bg-blue-500/20 rounded-2xl items-center justify-center">
                  <Text className="text-3xl">{isPrimary ? '👛' : '✏️'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="px-6 mt-6 gap-5 mb-10">

            {/* ── Account Name ── */}
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <Text className="text-gray-900 font-bold text-sm mb-4">Account Name</Text>
              <Text className="text-gray-600 text-xs mb-2">
                Rename this account — visible everywhere it appears.
              </Text>
              <TextInput
                value={accountName}
                onChangeText={(v) => {
                  setAccountName(v);
                  setNameChanged(true);
                  setFieldErrors((e) => ({ ...e, account_name: '' }));
                }}
                placeholder="e.g. Groceries"
                placeholderTextColor="#9ca3af"
                className={`border rounded-xl px-4 py-3 text-gray-900 text-sm ${
                  fieldErrors.account_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {fieldErrors.account_name ? (
                <Text className="text-red-600 text-xs mt-1">{fieldErrors.account_name}</Text>
              ) : null}
            </View>

            {/* ── Category (non-primary only) ── */}
            {!isPrimary && (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <Text className="text-gray-900 font-bold text-sm mb-1">Category</Text>
                <Text className="text-gray-400 text-xs mb-4">
                  Current: {account.category ?? 'Uncategorized'}
                </Text>

                {categories.length === 0 ? (
                  <View className="py-4 items-center">
                    <Text className="text-gray-400 text-sm">No categories found.</Text>
                    <TouchableOpacity onPress={() => router.push('/categories')} className="mt-2">
                      <Text className="text-blue-600 text-sm font-medium">+ Create a category</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {/* Uncategorized option */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCategoryId(null);
                        setCategoryChanged(true);
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        selectedCategoryId === null && categoryChanged
                          ? 'bg-gray-900 border-gray-900'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${
                        selectedCategoryId === null && categoryChanged ? 'text-white' : 'text-gray-600'
                      }`}>
                        Uncategorized
                      </Text>
                    </TouchableOpacity>

                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setCategoryChanged(true);
                        }}
                        className={`px-3 py-2 rounded-xl border ${
                          selectedCategoryId === cat.id
                            ? 'bg-blue-600 border-blue-600'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${
                          selectedCategoryId === cat.id ? 'text-white' : 'text-gray-600'
                        }`}>
                          {cat.category_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Limit Amount (non-primary only) ── */}
            {!isPrimary && (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <Text className="text-gray-900 font-bold text-sm mb-1">Limit Amount</Text>
                <Text className="text-gray-400 text-xs mb-4">
                  Current: KES {currentLimit.toLocaleString()} — changes will move funds to/from your Primary Account.
                </Text>
                <TextInput
                  value={limitAmount}
                  onChangeText={(v) => {
                    setLimitAmount(v);
                    setLimitChanged(true);
                    setFieldErrors((e) => ({ ...e, limit_amount: '' }));
                  }}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  className={`border rounded-xl px-4 py-3 text-gray-900 text-sm ${
                    fieldErrors.limit_amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {fieldErrors.limit_amount ? (
                  <Text className="text-red-600 text-xs mt-1">{fieldErrors.limit_amount}</Text>
                ) : null}

                {/* Live diff preview */}
                {limitChanged && !isNaN(newLimit) && newLimit !== currentLimit && (
                  <View className={`mt-3 px-3 py-2 rounded-xl ${limitDiff > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                    <Text className={`text-xs font-medium ${limitDiff > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                      {limitDiff > 0
                        ? `⚠️ KES ${limitDiff.toLocaleString()} will be deducted from Primary`
                        : `✅ KES ${Math.abs(limitDiff).toLocaleString()} will be returned to Primary`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Rules (non-primary only) ── */}
            {!isPrimary && (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <Text className="text-gray-900 font-bold text-sm mb-4">Account Rules</Text>

                {/* Overspend Rule */}
                <Text className="text-gray-600 text-xs mb-2">Overspend Rule</Text>
                <View className="flex-row gap-2 mb-4">
                  {['BLOCK', 'WARN', 'ALLOW'].map((rule) => (
                    <TouchableOpacity
                      key={rule}
                      onPress={() => setOverspendRule(rule)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        overspendRule === rule ? 'bg-gray-900 border-gray-900' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${overspendRule === rule ? 'text-white' : 'text-gray-600'}`}>
                        {rule}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Rollover Rule */}
                <Text className="text-gray-600 text-xs mb-2">Rollover Rule</Text>
                <View className="flex-row gap-2">
                  {['ROLLOVER', 'RETURN', 'REALLOCATE'].map((rule) => (
                    <TouchableOpacity
                      key={rule}
                      onPress={() => setRolloverRule(rule)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        rolloverRule === rule ? 'bg-gray-900 border-gray-900' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${rolloverRule === rule ? 'text-white' : 'text-gray-600'}`}>
                        {rule === 'ROLLOVER' ? 'Roll' : rule === 'REALLOCATE' ? 'Reallocate' : rule}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── Primary account — name only note ── */}
            {isPrimary && (
              <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex-row gap-3">
                <Text className="text-lg">ℹ️</Text>
                <Text className="text-blue-700 text-sm flex-1">
                  Primary accounts can only be renamed. Category and limit settings are not applicable.
                </Text>
              </View>
            )}

            {/* ── Save Button ── */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className={`py-4 rounded-2xl items-center justify-center flex-row gap-2 ${
                saving ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : null}
              <Text className="text-white font-semibold text-base">
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}