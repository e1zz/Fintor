import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ChevronLeftIcon from '../../assets/icons/chevron-left-24.svg';

/** Back-navigation bar for stack screens (Settings detail pages) */
export default function TopAppBar({ title }: { title: string }) {
  const navigation = useNavigation();

  return (
    <View className="h-[58px] px-4 pb-2.5">
      <Text
        className="absolute left-12 right-12 top-[13px] text-center font-sans-bold text-2xl leading-[22px] tracking-[-0.43px] text-ink"
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="size-6 active:opacity-60"
      >
        <ChevronLeftIcon />
      </Pressable>
    </View>
  );
}
