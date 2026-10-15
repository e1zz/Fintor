import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import ChevronRightIcon from '../../assets/icons/chevron-right.svg';

type SettingsRowProps = {
  icon: React.FC<SvgProps>;
  label: string;
  value?: string | null;
  onPress?: () => void;
};

export default function SettingsRow({ icon: Icon, label, value, onPress }: SettingsRowProps) {
  const content = (
    <View className="h-11 flex-row items-center gap-3">
      <Icon />
      <Text className="font-sans-medium text-sm text-ink">{label}</Text>
      <View className="flex-1 flex-row items-center justify-end gap-2">
        {value ? (
          <Text className="shrink font-sans text-xs text-muted" numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        <ChevronRightIcon />
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:opacity-80">
      {content}
    </Pressable>
  );
}
