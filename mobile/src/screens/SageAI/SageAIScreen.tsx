import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SageButton from '../../components/SageButton';
import ArrowUpIcon from '../../../assets/icons/arrow-up.svg';

export default function SageAIScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 gap-3 bg-bg px-4 pb-7" style={{ paddingTop: insets.top }}>
      <View className="flex-1 items-center justify-center gap-3">
        <SageButton />
        <Text className="font-sans-bold text-2xl text-ink">Sage</Text>
        <Text className="font-sans text-sm text-muted">AI assistant</Text>
        <Text className="w-[270px] text-center font-sans text-sm text-muted">
          A little clarity for your business. Ask about your CFDIs, income or taxes.
        </Text>
      </View>

      {/* Chat isn't wired up yet (apps/chat endpoints are incomplete), so the composer is display-only */}
      <View className="h-13.5 flex-row items-center gap-3 rounded-full border border-border bg-card pl-[17px] pr-[7px]">
        <TextInput
          className="h-full flex-1 py-0 font-sans text-[14px] text-ink"
          placeholder="Ask Sage a question…"
          placeholderTextColorClassName="accent-placeholder"
          editable={false}
        />
        <View className="size-9.5 items-center justify-center rounded-full bg-primary">
          <ArrowUpIcon />
        </View>
      </View>

      <Text className="text-center font-sans text-2xs text-muted">
        Sage can make mistakes. Verify important details.
      </Text>
    </View>
  );
}
