import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import TopAppBar from '../../components/TopAppBar';
import FintorMark from '../../components/FintorMark';
import DetailRow from '../../components/DetailRow';
import Divider from '../../components/Divider';
import SettingsRow from '../../components/SettingsRow';
import ShieldIcon from '../../../assets/icons/shield.svg';
import FileTextIcon from '../../../assets/icons/file-text.svg';
import CircleHelpIcon from '../../../assets/icons/circle-help.svg';

export default function SettingsAppInfoScreen() {
  const insets = useSafeAreaInsets();
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TopAppBar title="App Info" />

      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="items-center gap-2.5 py-6">
          <FintorMark size="lg" />
          <Text className="font-sans-bold text-2xl text-ink">Fintor</Text>
          <Text className="font-sans text-sm text-muted">Business clarity, every day.</Text>
        </View>

        <View className="card gap-4">
          <Text className="font-sans-semibold text-base text-ink">About this app</Text>
          <DetailRow label="Version" value={version} />
          <Divider />
          <DetailRow label="Market" value="Mexico" />
          <DetailRow label="Currency" value="MXN" />
          <DetailRow label="Language" value="English" />
        </View>

        {/* No policy/support URLs exist yet; rows are not pressable until they do */}
        <View className="card">
          <SettingsRow icon={ShieldIcon} label="Privacy Policy" />
          <Divider />
          <SettingsRow icon={FileTextIcon} label="Terms of Service" />
          <Divider />
          <SettingsRow icon={CircleHelpIcon} label="Support" />
        </View>

        <Text className="text-center font-sans text-xs text-muted">
          Fintor is not affiliated with SAT.
        </Text>
      </ScrollView>
    </View>
  );
}
