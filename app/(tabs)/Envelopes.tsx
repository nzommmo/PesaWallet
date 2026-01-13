import { router } from 'expo-router';
import React, { Component } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export class Envelopes extends Component {
  state = {
    deleteModal: { show: false, envelope: null },
    deleting: false
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

  getHealthColor = (healthPercentage) => {
    if (healthPercentage >= 70) return '#059669';
    if (healthPercentage >= 40) return '#d97706';
    return '#dc2626';
  };

  getSpendingPercent = (spent, budget) => {
    if (budget === 0) return 0;
    return Math.min(100, Math.round((spent / budget) * 100));
  };

  handleViewTransactions = (envelopeId) => {
    router.push(`/envelope/${envelopeId}/transactions`);
  };

  handleDeleteClick = (envelope) => {
    this.setState({ deleteModal: { show: true, envelope } });
  };

  handleDeleteConfirm = async () => {
    const { envelope } = this.state.deleteModal;
    if (!envelope) return;
    
    this.setState({ deleting: true });
    try {
      await this.props.onDeleteEnvelope(envelope.id);
      this.setState({ deleteModal: { show: false, envelope: null } });
      if (this.props.onRefresh) {
        await this.props.onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete envelope:', err);
      Alert.alert('Error', 'Failed to delete envelope. Please try again.');
    } finally {
      this.setState({ deleting: false });
    }
  };

  handleDeleteCancel = () => {
    this.setState({ deleteModal: { show: false, envelope: null } });
  };

  render() {
    const { envelopes, onCreateEnvelope } = this.props;
    const { deleteModal, deleting } = this.state;

    return (
      <>
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Digital Envelopes</Text>
            <TouchableOpacity
              onPress={onCreateEnvelope}
              className="flex-row items-center gap-1"
            >
              <Text className="text-blue-600 font-semibold">+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          {envelopes.length === 0 && (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Text className="text-4xl text-blue-600">+</Text>
              </View>
              <Text className="font-semibold text-gray-900 mb-2">No envelopes yet</Text>
              <Text className="text-gray-600 text-sm text-center mb-4">
                Create your first envelope to start managing your budget
              </Text>
              <TouchableOpacity
                onPress={onCreateEnvelope}
                className="bg-blue-600 px-6 py-2 rounded-xl"
              >
                <Text className="text-white font-semibold">Create Envelope</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Envelope Cards */}
          <View className="gap-4">
            {envelopes.map((envelope) => {
              const spendingPercent = this.getSpendingPercent(envelope.spent, envelope.budget);
              const healthPercentage = envelope.healthPercentage || 0;
              const healthColor = this.getHealthColor(healthPercentage);
              const isOverspent = envelope.spent > envelope.budget;
              const categoryColor = this.getCategoryColor(envelope.category);
              
              return (
                <View
                  key={envelope.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-semibold text-gray-900">{envelope.name}</Text>
                        <View 
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <Text className="text-xs" style={{ color: categoryColor }}>
                            {envelope.category}
                          </Text>
                        </View>
                        {isOverspent && (
                          <Text className="text-red-500">⚠️</Text>
                        )}
                      </View>
                      <Text className="text-sm text-gray-600">
                        KES {envelope.balance.toLocaleString()} available
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => this.handleViewTransactions(envelope.id)}
                        className="p-2 rounded-lg"
                      >
                        <Text className="text-blue-600">👁️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => this.handleDeleteClick(envelope)}
                        className="p-2 rounded-lg"
                      >
                        <Text className="text-red-600">🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Spending Progress */}
                  {envelope.budget > 0 && (
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs text-gray-600">
                          Spent: KES {envelope.spent.toLocaleString()} / {envelope.budget.toLocaleString()}
                        </Text>
                        <Text 
                          className={`text-xs ${isOverspent ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
                        >
                          {spendingPercent}%
                        </Text>
                      </View>
                      <View className="w-full bg-gray-200 rounded-full h-2">
                        <View
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${spendingPercent}%`,
                            backgroundColor: isOverspent ? '#dc2626' : categoryColor
                          }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Health Indicator */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-gray-600">Envelope Health</Text>
                      <Text className="text-xs font-semibold" style={{ color: healthColor }}>
                        {healthPercentage.toFixed(0)}%
                      </Text>
                    </View>
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${healthPercentage}%`,
                          backgroundColor: healthColor
                        }}
                      />
                    </View>
                  </View>

                  {/* Timeline Progress */}
                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-gray-600">Timeline ({envelope.timeline})</Text>
                      <Text className="text-xs text-gray-600">{envelope.timelinePercent}%</Text>
                    </View>
                    <View className="w-full bg-gray-200 rounded-full h-2">
                      <View
                        className="h-2 rounded-full bg-gray-400"
                        style={{ width: `${envelope.timelinePercent}%` }}
                      />
                    </View>
                  </View>

                  {/* Rules Info */}
                  <View className="flex-row items-center gap-3 mb-4">
                    <Text className="text-xs text-gray-500">
                      <Text className="font-medium">Overspend:</Text> {
                        envelope.overspendRule === 'WARN' ? 'Warn' : 
                        envelope.overspendRule === 'BLOCK' ? 'Block' : 'Allow'
                      }
                    </Text>
                    {envelope.rolloverRule && (
                      <Text className="text-xs text-gray-500">
                        <Text className="font-medium">Rollover:</Text> {
                          envelope.rolloverRule === 'ROLLOVER' ? 'Yes' : 'No'
                        }
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => router.push('/payments')}
                      className="flex-1 py-2 rounded-lg items-center"
                    >
                      <Text className="text-blue-600 font-medium text-sm">Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/transfer')}
                      className="flex-1 py-2 rounded-lg items-center"
                    >
                      <Text className="text-gray-700 font-medium text-sm">Transfer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModal.show}
          transparent={true}
          animationType="fade"
          onRequestClose={this.handleDeleteCancel}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <View className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <View className="flex-row items-start gap-4 mb-4">
                <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
                  <Text className="text-2xl">🗑️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">Delete Envelope?</Text>
                  <Text className="text-sm text-gray-600">
                    Are you sure you want to delete "{deleteModal.envelope?.name}"? This action cannot be undone.
                  </Text>
                </View>
              </View>
              
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={this.handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={this.handleDeleteConfirm}
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
      </>
    );
  }
}

export default Envelopes;