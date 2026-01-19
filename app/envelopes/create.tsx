import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import axiosInstance from '../../axiosinstance';

const create = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  
  // Form data
  const [envelopeName, setEnvelopeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allowOverspending, setAllowOverspending] = useState(false);
  const [rolloverFunds, setRolloverFunds] = useState(true);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempDay, setTempDay] = useState('1');
  const [tempMonth, setTempMonth] = useState('1');
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await axiosInstance.get('/categories/');
      setCategories(response || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', 
      '#06b6d4', '#14b8a6', '#ec4899', '#6366f1', '#f97316', 
      '#84cc16', '#d946ef'
    ];
    return colors[index % colors.length];
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i.toString());
    }
    return years;
  };

  const getDays = () => {
    const daysInMonth = getDaysInMonth(parseInt(tempMonth), parseInt(tempYear));
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i.toString());
    }
    return days;
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const openDatePicker = (isStartDate) => {
    const dateToEdit = isStartDate ? startDate : endDate;
    if (dateToEdit) {
      const d = new Date(dateToEdit);
      setTempDay(d.getDate().toString());
      setTempMonth((d.getMonth() + 1).toString());
      setTempYear(d.getFullYear().toString());
    } else {
      const today = new Date();
      setTempDay(today.getDate().toString());
      setTempMonth((today.getMonth() + 1).toString());
      setTempYear(today.getFullYear().toString());
    }
    
    if (isStartDate) {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const confirmDateSelection = (isStartDate) => {
    const selectedDate = new Date(
      parseInt(tempYear),
      parseInt(tempMonth) - 1,
      parseInt(tempDay)
    );
    
    if (isStartDate) {
      setStartDate(selectedDate);
      setShowStartDatePicker(false);
    } else {
      setEndDate(selectedDate);
      setShowEndDatePicker(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Select date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDailyBudget = () => {
    if (!limitAmount || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 0;
    return (parseFloat(limitAmount) / days).toFixed(2);
  };

  const getTimelineDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const canContinueStep1 = envelopeName.trim() !== '' && selectedCategory !== '';
  const canContinueStep2 = limitAmount && parseFloat(limitAmount) > 0;

  const handleNext = () => {
    if (currentStep === 1 && canContinueStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canContinueStep2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    // Removed - using custom picker now
  };

  const handleEndDateChange = (event, selectedDate) => {
    // Removed - using custom picker now
  };

  const handleCreateEnvelope = async () => {
    setError('');
    setLoading(true);

    try {
      if (!selectedCategory) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
          setError('End date must be after start date');
          setLoading(false);
          return;
        }
      }

      const balanceValue = parseFloat(initialBalance) || 0;
      const limitValue = parseFloat(limitAmount);
      
      if (balanceValue > limitValue) {
        setError('Initial balance cannot exceed the limit amount');
        setLoading(false);
        return;
      }

      const categoryId = typeof selectedCategory === 'string' 
        ? parseInt(selectedCategory) 
        : selectedCategory;

      const envelopeData = {
        account_name: envelopeName.trim(),
        account_type: 'DIGITAL',
        category_id: categoryId,
        balance: balanceValue,
        limit_amount: limitValue,
        start_date: startDate ? formatDate(startDate) : null,
        end_date: endDate ? formatDate(endDate) : null,
        overspend_rule: allowOverspending ? 'ALLOW' : 'WARN',
        rollover_rule: rolloverFunds ? 'ROLLOVER' : 'RETURN'
      };

      const response = await axiosInstance.post('/accounts/', envelopeData);

      if (balanceValue > 0) {
        router.push({
          pathname: '/transfer', 
          params: {
            destinationAccountId: response.id,
            destinationAccountName: envelopeName,
            amount: balanceValue
          }
        });
      } else {
        router.replace('/');
      }

    } catch (err) {
      console.error('Create envelope error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create envelope. Please try again.');
      setLoading(false);
    }
  };

  const StepIndicator = ({ step, label, isActive, isCompleted }) => (
    <View className="flex-col items-center">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
          isCompleted || isActive ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        {isCompleted ? (
          <Text className="text-white text-lg">✓</Text>
        ) : (
          <Text className={`font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
            {step}
          </Text>
        )}
      </View>
      <Text className={`text-xs font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </Text>
    </View>
  );

  const DatePickerModal = ({ visible, onClose, onConfirm, title, minimumDate }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-semibold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-6">
            {/* Day Picker */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Day</Text>
              <View className="border border-gray-300 rounded-xl overflow-hidden">
                <Picker
                  selectedValue={tempDay}
                  onValueChange={setTempDay}
                >
                  {getDays().map(day => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Month Picker */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Month</Text>
              <View className="border border-gray-300 rounded-xl overflow-hidden">
                <Picker
                  selectedValue={tempMonth}
                  onValueChange={setTempMonth}
                >
                  {months.map(month => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Year Picker */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
              <View className="border border-gray-300 rounded-xl overflow-hidden">
                <Picker
                  selectedValue={tempYear}
                  onValueChange={setTempYear}
                >
                  {getYears().map(year => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 px-6 py-3 bg-blue-600 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handleBack}
              className="p-2 rounded-lg"
            >
              <Text className="text-gray-700 text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-900">Create Envelope</Text>
          </View>
        </View>

        {/* Step Progress */}
        <View className="bg-white px-6 py-6">
          <View className="flex-row items-center justify-between max-w-md mx-auto">
            <StepIndicator
              step={1}
              label="Details"
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
            />
            <View className={`flex-1 h-1 mx-2 rounded ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <StepIndicator
              step={2}
              label="Budget"
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
            />
            <View className={`flex-1 h-1 mx-2 rounded ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <StepIndicator
              step={3}
              label="Rules"
              isActive={currentStep === 3}
              isCompleted={false}
            />
          </View>
        </View>

        {/* Step 1: Details */}
        {currentStep === 1 && (
          <View className="px-6 py-6">
            {error && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
                <Text className="text-red-600 text-lg">⚠️</Text>
                <Text className="flex-1 text-sm text-red-800">{error}</Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Envelope Name
              </Text>
              <TextInput
                value={envelopeName}
                onChangeText={(text) => {
                  setEnvelopeName(text);
                  setError('');
                }}
                editable={!loading && !loadingCategories}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                placeholder="e.g., Monthly Groceries"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Category
              </Text>
              
              {loadingCategories ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#2563eb" />
                </View>
              ) : categories.length === 0 ? (
                <View className="items-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Text className="text-4xl mb-2">⚠️</Text>
                  <Text className="text-sm text-gray-600 mb-3">No categories available</Text>
                  <TouchableOpacity onPress={fetchCategories}>
                    <Text className="text-blue-600 text-sm font-medium">Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-3">
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setError('');
                      }}
                      disabled={loading}
                      className={`p-4 rounded-xl border-2 w-[48%] ${
                        selectedCategory === category.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="items-center gap-2">
                        <View 
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: getCategoryColor(index) }}
                        />
                        <Text className="text-sm font-medium text-gray-900 text-center">
                          {category.category_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                disabled={loading || loadingCategories}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={!canContinueStep1 || loading || loadingCategories}
                className={`flex-1 px-6 py-3 rounded-xl items-center ${
                  !canContinueStep1 || loading || loadingCategories ? 'bg-gray-300' : 'bg-blue-600'
                }`}
              >
                <Text className="text-white font-semibold">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Budget */}
        {currentStep === 2 && (
          <View className="px-6 py-6">
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Budget Limit (KES) <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={limitAmount}
                onChangeText={setLimitAmount}
                keyboardType="numeric"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                placeholder="2000"
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-xs text-gray-500 mt-2">
                Maximum amount you can spend from this envelope
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Initial Balance (KES) <Text className="text-gray-400">(Optional)</Text>
              </Text>
              <TextInput
                value={initialBalance}
                onChangeText={setInitialBalance}
                keyboardType="numeric"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900"
                placeholder="0"
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-xs text-gray-500 mt-2">
                Amount to allocate now (will be deducted from your primary account)
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Start Date
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
              >
                <Text className={startDate ? "text-gray-900" : "text-gray-400"}>
                  {formatDisplayDate(startDate)}
                </Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-2">
                When should this envelope start?
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                End Date
              </Text>
              <TouchableOpacity
                onPress={() => openDatePicker(false)}
                disabled={!startDate}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                  !startDate ? 'bg-gray-100' : 'bg-white'
                }`}
              >
                <Text className={endDate ? "text-gray-900" : "text-gray-400"}>
                  {formatDisplayDate(endDate)}
                </Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-2">
                When should this envelope end?
              </Text>
            </View>

            {limitAmount && startDate && endDate && parseFloat(limitAmount) > 0 && getTimelineDays() > 0 && (
              <View className="mb-6 p-4 bg-blue-50 rounded-xl">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-gray-600">Timeline Duration</Text>
                  <Text className="text-lg font-bold text-blue-600">{getTimelineDays()} days</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-600">Daily Budget Limit</Text>
                  <Text className="text-lg font-bold text-blue-600">KES {getDailyBudget()}</Text>
                </View>
              </View>
            )}

            {initialBalance && limitAmount && parseFloat(initialBalance) > parseFloat(limitAmount) && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
                <Text className="text-red-600 text-lg">⚠️</Text>
                <Text className="flex-1 text-sm text-red-800">
                  Initial balance cannot exceed the budget limit
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={!canContinueStep2}
                className={`flex-1 px-6 py-3 rounded-xl items-center ${
                  !canContinueStep2 ? 'bg-gray-300' : 'bg-blue-600'
                }`}
              >
                <Text className="text-white font-semibold">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Rules */}
        {currentStep === 3 && (
          <View className="px-6 py-6">
            {error && (
              <View className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-row items-start gap-3">
                <Text className="text-red-600 text-lg">⚠️</Text>
                <Text className="flex-1 text-sm text-red-800">{error}</Text>
              </View>
            )}

            <View className="gap-4 mb-6">
              {/* Allow Overspending */}
              <TouchableOpacity
                onPress={() => setAllowOverspending(!allowOverspending)}
                disabled={loading}
                className={`p-4 rounded-xl border-2 ${
                  allowOverspending ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      allowOverspending ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {allowOverspending && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">Allow Overspending</Text>
                    <Text className="text-sm text-gray-600">
                      Permit spending beyond the budget limit (will borrow from primary account)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Rollover Unused Funds */}
              <TouchableOpacity
                onPress={() => setRolloverFunds(!rolloverFunds)}
                disabled={loading}
                className={`p-4 rounded-xl border-2 ${
                  rolloverFunds ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      rolloverFunds ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {rolloverFunds && <Text className="text-white text-xs">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">Rollover Unused Funds</Text>
                    <Text className="text-sm text-gray-600">
                      Transfer remaining balance to next period instead of returning to primary account
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Summary Card */}
              <View className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Text className="font-semibold text-gray-900 mb-3">Summary</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Envelope Name:</Text>
                    <Text className="text-sm font-medium text-gray-900">{envelopeName}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Budget Limit:</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      KES {parseFloat(limitAmount || 0).toLocaleString()}
                    </Text>
                  </View>
                  {initialBalance && parseFloat(initialBalance) > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600">Initial Balance:</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        KES {parseFloat(initialBalance).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {startDate && endDate && (
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-gray-600">Duration:</Text>
                      <Text className="text-sm font-medium text-gray-900">{getTimelineDays()} days</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Account Expiry Warning */}
              {startDate && endDate && getTimelineDays() > 0 && (
                <View className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex-row items-start gap-3">
                  <Text className="text-yellow-600 text-lg">⚠️</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-yellow-900 mb-1">Account Expiry</Text>
                    <Text className="text-sm text-yellow-700">
                      This envelope expires after {getTimelineDays()} days ({formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}). 
                      You can extend or close it then.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateEnvelope}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
                  loading ? 'bg-gray-300' : 'bg-blue-600'
                }`}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold">Creating...</Text>
                  </>
                ) : (
                  <Text className="text-white font-semibold">Create Envelope</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onConfirm={() => confirmDateSelection(true)}
        title="Select Start Date"
      />
      
      <DatePickerModal
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onConfirm={() => confirmDateSelection(false)}
        title="Select End Date"
        minimumDate={startDate}
      />
    </SafeAreaView>
  );
};

export default create;