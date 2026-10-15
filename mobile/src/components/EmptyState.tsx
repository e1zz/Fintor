import React from 'react';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Fill the remaining space instead of the default 210pt block */
  fill?: boolean;
};

export default function EmptyState({ title, description, fill = false }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center p-4 ${fill ? 'flex-1' : 'h-[210px]'}`}>
      <Text className="text-center font-sans-semibold text-[16px] text-ink">{title}</Text>
      {description ? (
        <Text className="text-center font-sans text-[13px] text-muted">{description}</Text>
      ) : null}
    </View>
  );
}
