import React from 'react';
import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`rounded-full border px-[17px] py-[7px] ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      <Text className={`font-sans-medium text-sm ${selected ? 'text-on-primary' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
