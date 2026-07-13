import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsTaxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-2xl font-bold text-ink">Tax</Text>
      <Text className="mt-1 text-sm text-muted">Tax management</Text>
    </View>
  );
}

