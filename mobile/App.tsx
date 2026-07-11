import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/authStore';
import type { AuthStackParamList, MainTabParamList } from './src/types/navigation';

import SageAIScreen from './src/screens/SageAI/SageAIScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import CfdisScreen from './src/screens/cfdis/CfdisScreen';
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
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  CFDIs: 'document-text-outline',
  Sage: 'sparkles-outline',
  Quotations: 'receipt-outline',
  Tickets: 'camera-outline',
};

function SageTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      className="-mt-5 items-center justify-center"
    >
      <View
        className={`h-16 w-16 items-center justify-center rounded-full shadow-lg ${
          focused ? 'bg-primary' : 'bg-primary/90'
        }`}
      >
        <Ionicons name="sparkles" size={28} color="#ffffff" />
      </View>
    </Pressable>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#5f6368',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e8eaed',
          height: 72,
          paddingTop: 1,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="CFDIs" component={CfdisScreen} />
      <Tab.Screen
        name="Sage"
        component={SageAIScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <SageTabButton {...props} />,
        }}
      />
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
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {isAuthenticated ? <MainTabs /> : <AuthStack />}
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
