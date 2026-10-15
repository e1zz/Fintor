import React from 'react';
import { Text, View } from 'react-native';

/** Title block for the main tab screens */
export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-1 px-4 pb-4 pt-2.5">
      <Text className="font-sans-bold text-2xl text-ink" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text className="font-sans text-sm text-muted">{subtitle}</Text> : null}
    </View>
  );
}
