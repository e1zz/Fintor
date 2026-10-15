import React from 'react';
import { View } from 'react-native';

/** value: 0–100 */
export default function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(value, 100));

  return (
    <View
      className="h-2 flex-row overflow-hidden rounded-full bg-border"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
