import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SettingsAppInfoScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#5f6368" />
        </Pressable>
        <Text className="ml-3 text-lg font-semibold text-ink">App Info</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4">
        <View className="overflow-hidden rounded-lg border border-border bg-card">
          <InfoRow label="App" value="Fintor" />
          <InfoRow label="Tagline" value="Personal Tax Accountant" last={false} />
          <InfoRow label="Version" value={version} last={false} />
          <InfoRow label="Stack" value="Expo · Django" last />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-ink">{value}</Text>
    </View>
  );
}
