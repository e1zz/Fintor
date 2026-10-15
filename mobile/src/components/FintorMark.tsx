import React from 'react';
import { View } from 'react-native';
import ChartIcon from '../../assets/icons/chart-no-axes-combined-48.svg';
import ChartIconLarge from '../../assets/icons/chart-no-axes-combined-64.svg';

/** Brand mark: 48pt (auth) or 64pt (App Info) */
export default function FintorMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  if (size === 'lg') {
    return (
      <View
        className="size-16 items-center justify-center rounded-[17.92px] bg-primary"
        accessibilityRole="image"
        accessibilityLabel="Fintor"
      >
        <ChartIconLarge />
      </View>
    );
  }

  return (
    <View
      className="size-12 items-center justify-center rounded-[13.44px] bg-primary"
      accessibilityRole="image"
      accessibilityLabel="Fintor"
    >
      <ChartIcon />
    </View>
  );
}
