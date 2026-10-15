import React from 'react';
import { Text, View } from 'react-native';
import CircleCheckIcon from '../../assets/icons/circle-check-success.svg';

/** Inline success confirmation */
export default function Toast({ message }: { message: string }) {
  return (
    <View
      className="flex-row items-center gap-2.5 rounded-md bg-success-tint p-3.5"
      accessibilityLiveRegion="polite"
    >
      <CircleCheckIcon />
      <Text className="flex-1 font-sans-medium text-sm text-success">{message}</Text>
    </View>
  );
}
