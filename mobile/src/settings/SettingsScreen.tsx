import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../types/navigation';


export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>>();
  const user = useAuthStore(s => s.user);
  type RouteName = keyof SettingsStackParamList;
  type Row = { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; screen: RouteName; value?: string | null };
  type Section = { title: string; rows: Row[] };

  const sections: Section[] = [
    {
      title: 'PROFILE', rows: [
        { icon: 'person-outline', label: 'Profile', value: user?.tenant?.company_name || '-', screen: 'SettingsProfile' },
        { icon: 'receipt-outline', label: 'RFC', value: user?.tenant?.rfc || '-', screen: 'SettingsProfile' },
      ]
    },

    {
      title: 'TAX', rows: [
        { icon: 'stats-chart-outline', label: 'Tax Regime', value: user?.tenant?.tax_regime || 'Not set', screen: 'SettingsTaxRegime' },
      ]
    },
    {
      title: 'SAT', rows: [
        { icon: 'lock-closed-outline', label: 'SAT Credentials', screen: 'SettingsSatCredentials' },
      ]
    },

    {
      title: 'Storage', rows: [
        { icon: 'archive-outline', label: 'Storage', screen: 'SettingsStorageScreen' }
      ]
    },
    {
      title: 'APP', rows: [
        { icon: 'information-circle-outline', label: 'App Info', screen: 'SettingsAppInfo' },

      ]
    },
  ]


  return (
    <View className='flex-1 bg-bg' style={{paddingTop:insets.top}}>
      <ScrollView contentContainerClassName='gap-6 p-4'>
        <View>
          <Text className='text-2xl font-bold text-ink'>Settings</Text>
          
          {sections.map(section => (
            <View key={section.title}>
            <Text className='mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted'>
              {section.title}
            </Text>   
            <View className='overflow-hidden rounded-lg border border-border bg-card'>
              {section.rows.map((row, i) => (
                <Pressable
                  key={row.label}
                  onPress={() => navigation.navigate(row.screen)}
                  className={`flex-row items-center px-4 py-3.5 ${i < section.rows.length-1 ? 'border-b border-border': ''}`}
                >
                  <Ionicons name={row.icon} size={20} color="#5f6368"/>
                    <View className='ml-3 flex-1'>
                      <Text className="text-sm text-ink">{row.label}</Text>
                      {row.value ? <Text className='text-xs text-muted'>{row.value}</Text> : null}
                    </View>
                    <Ionicons name='chevron-forward' size={18} color="#9aa0a6"/>
                </Pressable>
              ))}
            </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

