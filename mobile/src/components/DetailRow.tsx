import React from 'react';
import { Text, View } from 'react-native';

type DetailRowProps = {
  label: string;
  value: string;
  /** Text color class for the value, e.g. text-success */
  valueClassName?: string;
  /** Totals: semibold label, bold value */
  emphasis?: boolean;
};

export default function DetailRow({
  label,
  value,
  valueClassName = 'text-ink',
  emphasis = false,
}: DetailRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className={emphasis ? 'font-sans-semibold text-sm text-ink' : 'font-sans text-sm text-muted'}>
        {label}
      </Text>
      <Text
        className={`shrink text-right text-sm ${
          emphasis ? 'font-sans-bold text-ink' : `font-sans-medium ${valueClassName}`
        }`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
