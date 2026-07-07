import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/authStore';
import type { AuthStackParamList, MainTabParamList } from './src/types/navigation';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import CfdisScreen from './src/screens/cfdis/CfdisScreen';
import CustomersScreen from './src/screens/customers/CustomersScreen';
import QuotationsScreen from './src/screens/quotations/QuotationsScreen';
import TicketsScreen from './src/screens/tickets/TicketsScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const queryClient = new QueryClient();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="CFDIs" component={CfdisScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Quotations" component={QuotationsScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const isLoading = useAuthStore(s => s.isLoading);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const loadUser = useAuthStore(s => s.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
