// app/(admin)/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Read from user object — already has is_superadmin from login response
        const userData = await AsyncStorage.getItem('user');
        console.log('Raw user data:', userData);

        if (!userData) {
          console.log('No user data found');
          setIsSuperAdmin(false);
          return;
        }

        const user = JSON.parse(userData);
        console.log('Parsed user:', user);
        console.log('is_superadmin:', user.is_superadmin);

        setIsSuperAdmin(user.is_superadmin === true);
      } catch (err) {
        console.log('Error:', err);
        setIsSuperAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  if (isSuperAdmin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (!isSuperAdmin) return <Redirect href="/(tabs)/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
  
}