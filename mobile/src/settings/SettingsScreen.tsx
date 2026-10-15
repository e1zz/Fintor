import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import { useAuthStore } from '../stores/authStore';
import type { AppStackParamList } from '../types/navigation';
import { REGIME_LABELS } from '../constants/taxRegimes';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import SettingsRow from '../components/SettingsRow';
import Divider from '../components/Divider';
import UserRoundIcon from '../../assets/icons/user-round.svg';
import BadgeIcon from '../../assets/icons/badge.svg';
import ReceiptTextIcon from '../../assets/icons/receipt-text.svg';
import LockKeyholeIcon from '../../assets/icons/lock-keyhole.svg';
import ArchiveIcon from '../../assets/icons/archive.svg';
import InfoIcon from '../../assets/icons/info.svg';


export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore(s => s.user);
  const regime = user?.tenant?.tax_regime as string | null | undefined;
  type Row = { icon: React.FC<SvgProps>; label: string; onPress: () => void; value?: string | null };
  type Section = { title: string; rows: Row[] };

  const sections: Section[] = [
    {
      title: 'PROFILE', rows: [
        { icon: UserRoundIcon, label: 'Profile', value: user?.tenant?.company_name || '-', onPress: () => navigation.navigate('SettingsProfile') },
        { icon: BadgeIcon, label: 'RFC', value: user?.tenant?.rfc || '-', onPress: () => navigation.navigate('SettingsProfile') },
      ]
    },
    {
      title: 'TAX', rows: [
        { icon: ReceiptTextIcon, label: 'Tax Regime', value: regime ? REGIME_LABELS[regime] ?? regime : 'Not set', onPress: () => navigation.navigate('SettingsTaxRegime') },
      ]
    },
    {
      title: 'SAT', rows: [
        { icon: LockKeyholeIcon, label: 'SAT Credentials', onPress: () => navigation.navigate('SettingsSatCredentials') },
      ]
    },
    {
      title: 'STORAGE', rows: [
        { icon: ArchiveIcon, label: 'Storage', onPress: () => navigation.navigate('SettingsStorageScreen') },
      ]
    },
    {
      title: 'APP', rows: [
        { icon: InfoIcon, label: 'App Info', onPress: () => navigation.navigate('SettingsAppInfo') },
      ]
    },
  ];

  return (
    <View className='flex-1 bg-bg' style={{ paddingTop: insets.top }}>
      <PageHeader title='Settings' />
      <ScrollView contentContainerClassName='gap-4 px-4 pb-7'>
        {sections.map(section => (
          <View key={section.title} className='gap-2'>
            <SectionHeader title={section.title} />
            <View className='card'>
              {section.rows.map((row, i) => (
                <React.Fragment key={row.label}>
                  {i > 0 ? <Divider /> : null}
                  <SettingsRow icon={row.icon} label={row.label} value={row.value} onPress={row.onPress} />
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
