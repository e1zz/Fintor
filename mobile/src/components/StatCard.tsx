import React from 'react';
import { Text, View } from 'react-native';

// Green = income, red = expense, blue = profit
export type StatTone = 'income' | 'expense' | 'profit';

const TONE_TEXT: Record<StatTone, string> = {
  income: 'text-success',
  expense: 'text-danger',
  profit: 'text-primary',
};

type StatCardProps = {
  title: string;
  value: string;
  tone: StatTone;
};

export default function StatCard({ title, value, tone }: StatCardProps) {
  return (
    <View className="flex-1 gap-2 overflow-hidden rounded-lg border border-border bg-card px-[7px] py-[13px]">
      <Text className="font-sans text-xs text-muted" numberOfLines={1}>
        {title}
      </Text>
      <Text
        className={`font-sans-bold text-sm ${TONE_TEXT[tone]}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}
