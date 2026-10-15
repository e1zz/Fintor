import "./global.css";
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Per-weight imports so only the weights in use are bundled
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useAuthStore } from './src/stores/authStore';
import type { AuthStackParamList, MainTabParamList, AppStackParamList } from './src/types/navigation';
import BottomTabBar from './src/components/BottomTabBar';

import SageAIScreen from './src/screens/SageAI/SageAIScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import CfdisScreen from './src/screens/cfdis/CfdisScreen';
import TaxScreen from './src/settings/tax/TaxScreen';
import SettingsScreen from './src/settings/SettingsScreen';
import SettingsProfileScreen from './src/settings/profile/profileScreen';
import TaxRegimeScreen from './src/settings/taxRegime/TaxRegimeScreen';
import SettingsSatScreen from './src/settings/satSettings/SatSettingsScreen';
import SatSyncScreen from './src/settings/satSync/SatSyncScreen';
import SettingsStorage from './src/settings/storage/StorageScreen';
import SettingsAppInfoScreen from './src/settings/appInfo/AppInfoScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const AppStackNav = createNativeStackNavigator<AppStackParamList>();
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

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="CFDIs" component={CfdisScreen} />
      <Tab.Screen name="Sage" component={SageAIScreen} />
      <Tab.Screen name="Tax" component={TaxScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Settings detail screens sit above the tabs so they cover the tab bar
function AppStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppStackNav.Screen name="MainTabs" component={MainTabs} />
      <AppStackNav.Screen name="SettingsProfile" component={SettingsProfileScreen} />
      <AppStackNav.Screen name="SettingsTaxRegime" component={TaxRegimeScreen} />
      <AppStackNav.Screen name="SettingsSatCredentials" component={SettingsSatScreen} />
      <AppStackNav.Screen name="SettingsSatSync" component={SatSyncScreen} />
      <AppStackNav.Screen name="SettingsStorageScreen" component={SettingsStorage} />
      <AppStackNav.Screen name="SettingsAppInfo" component={SettingsAppInfoScreen} />
    </AppStackNav.Navigator>
  );
}

export default function App() {
  const isLoading = useAuthStore(s => s.isLoading);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const loadUser = useAuthStore(s => s.loadUser);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadUser();
  }, []);

  // A font load failure falls back to the system font rather than blocking the app
  if (isLoading || (!fontsLoaded && !fontError)) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
