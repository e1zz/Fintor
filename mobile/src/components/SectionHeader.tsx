import React from 'react';
import { Text } from 'react-native';

export default function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="font-sans-semibold text-[12px] uppercase tracking-[1.3px] text-muted">
      {title}
    </Text>
  );
}
