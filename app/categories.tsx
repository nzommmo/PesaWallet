import { router } from 'expo-router';
import React, { Component } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosinstance';

type Category = {
  id: number;
  category_name: string;
  description?: string;
};

type State = {
  name: string;
  description: string;
  loading: boolean;
  error: string;
  success: boolean;
  categories: Category[];
  loadingCategories: boolean;
  deleteModal: { show: boolean; category: Category | null };
  deleting: boolean;
};

export class Categories extends Component<{}, State> {
  state: State = {
    name: '',
    description: '',
    loading: false,
    error: '',
    success: false,
    categories: [],
    loadingCategories: true,
    deleteModal: { show: false, category: null },
    deleting: false,
  };

  componentDidMount() {
    this.fetchCategories();
  }

  fetchCategories = async () => {
    this.setState({ loadingCategories: true });
    try {
      const data = await axiosInstance.get('/categories/');
      this.setState({ categories: data });
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      this.setState({ loadingCategories: false });
    }
  };

  handleSubmit = async () => {
    const { name, description } = this.state;

    this.setState({ error: '', success: false });

    if (!name.trim()) {
      this.setState({ error: 'Category name is required' });
      return;
    }
    if (name.trim().length < 2) {
      this.setState({ error: 'Category name must be at least 2 characters' });
      return;
    }

    this.setState({ loading: true });

    try {
      const newCategory = await axiosInstance.post('/categories/', {
        category_name: name.trim(),
        description: description.trim(),
      });

      this.setState((prev) => ({
        success: true,
        name: '',
        description: '',
        categories: [newCategory, ...prev.categories],
      }));

      setTimeout(() => this.setState({ success: false }), 3000);
    } catch (err: any) {
      console.error('Category creation error:', err);
      this.setState({
        error: err?.category_name?.[0] || err?.name?.[0] || err?.message || 'Failed to create category. Please try again.',
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDeleteClick = (category: Category) => {
    this.setState({ deleteModal: { show: true, category } });
  };

  handleDeleteConfirm = async () => {
    const { category } = this.state.deleteModal;
    if (!category) return;

    this.setState({ deleting: true });
    try {
      await axiosInstance.delete(`/categories/${category.id}/`);
      this.setState((prev) => ({
        categories: prev.categories.filter((c) => c.id !== category.id),
        deleteModal: { show: false, category: null },
      }));
    } catch (err) {
      console.error('Failed to delete category:', err);
      Alert.alert('Error', 'Failed to delete category. Please try again.');
    } finally {
      this.setState({ deleting: false });
    }
  };

  handleDeleteCancel = () => {
    this.setState({ deleteModal: { show: false, category: null } });
  };

  render() {
    const {
      name, description,
      loading, error, success,
      categories, loadingCategories,
      deleteModal, deleting,
    } = this.state;

    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          {/* Header */}
          <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading} style={{ padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 18, color: '#374151' }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#111827' }}>Categories</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>

              {/* Success Banner */}
              {success && (
                <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#166534' }}>Category created successfully!</Text>
                  <Text style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Your new category is ready to use</Text>
                </View>
              )}

              {/* Error Banner */}
              {!!error && (
                <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, color: '#dc2626' }}>{error}</Text>
                </View>
              )}

              {/* Form Card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>New Category</Text>

                {/* Name */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                    Name <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={(text) => this.setState({ name: text, error: '' })}
                    placeholder="e.g. Food & Dining"
                    placeholderTextColor="#9ca3af"
                    editable={!loading}
                    maxLength={50}
                    style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' }}
                  />
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                    Description <Text style={{ color: '#9ca3af' }}>(optional)</Text>
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={(text) => this.setState({ description: text })}
                    placeholder="Describe this category..."
                    placeholderTextColor="#9ca3af"
                    editable={!loading}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    textAlignVertical="top"
                    style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb', minHeight: 80 }}
                  />
                  <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>{description.length}/200</Text>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={this.handleSubmit}
                  disabled={loading || !name.trim()}
                  style={{ backgroundColor: loading || !name.trim() ? '#d1d5db' : '#16a34a', paddingVertical: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Creating...</Text>
                    </>
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>+ Create Category</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Categories List */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Your Categories</Text>
                {loadingCategories && <ActivityIndicator size="small" color="#2563eb" />}
              </View>

              {/* Empty State */}
              {!loadingCategories && categories.length === 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Text style={{ fontSize: 36, marginBottom: 12 }}>🗂️</Text>
                  <Text style={{ fontWeight: '600', color: '#111827', marginBottom: 6 }}>No categories yet</Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Create your first category using the form above</Text>
                </View>
              )}

              {/* List */}
              <View style={{ gap: 12, marginBottom: 32 }}>
                {categories.map((category) => (
                  <View
                    key={category.id}
                    style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontWeight: '600', color: '#111827', fontSize: 15 }}>{category.category_name}</Text>
                      {!!category.description && (
                        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>{category.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => this.handleDeleteClick(category)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: '#fef2f2' }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Delete Modal */}
        <Modal
          visible={deleteModal.show}
          transparent={true}
          animationType="fade"
          onRequestClose={this.handleDeleteCancel}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <View style={{ width: 48, height: 48, backgroundColor: '#fef2f2', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>🗑️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Delete Category?</Text>
                  <Text style={{ fontSize: 13, color: '#6b7280' }}>
                    Are you sure you want to delete "{deleteModal.category?.category_name}"? This action cannot be undone.
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={this.handleDeleteCancel}
                  disabled={deleting}
                  style={{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#374151', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={this.handleDeleteConfirm}
                  disabled={deleting}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: '#dc2626', borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  {deleting ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '500' }}>Deleting...</Text>
                    </>
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '500' }}>Delete</Text>
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

export default Categories;