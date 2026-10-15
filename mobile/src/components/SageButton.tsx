import React from 'react';
import { Pressable, View } from 'react-native';
import SparklesIcon from '../../assets/icons/sparkles.svg';

const SHADOW = { boxShadow: '0px 4px 12px 0px rgba(26, 115, 232, 0.19)' };

type SageButtonProps = {
  active?: boolean;
  /** Without onPress it renders as a static badge (Sage screen intro) */
  onPress?: () => void;
};

export default function SageButton({ active = false, onPress }: SageButtonProps) {
  const className = `size-16 items-center justify-center rounded-full ${
    active ? 'border-3 border-sage-ring bg-primary-pressed' : 'border-4 border-card bg-primary'
  }`;

  if (!onPress) {
    return (
      <View className={className} style={SHADOW}>
        <SparklesIcon />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel="Sage"
      accessibilityState={{ selected: active }}
      className={className}
      style={SHADOW}
    >
      <SparklesIcon />
    </Pressable>
  );
}
