import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  CFDIs: undefined;
  Sage: undefined;
  Tax: undefined;
  Settings: undefined;
};

/** Signed-in stack: the tabs, plus Settings detail screens that cover the tab bar */
export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  SettingsProfile: undefined;
  SettingsTaxRegime: undefined;
  SettingsSatCredentials: undefined;
  SettingsSatSync: { credentialId: number };
  SettingsStorageScreen: undefined;
  SettingsAppInfo: undefined;
};
