import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SageAIScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-2xl font-bold text-ink">Sage</Text>
      <Text className="mt-1 text-sm text-muted">AI assistant</Text>
    </View>
  );
}

