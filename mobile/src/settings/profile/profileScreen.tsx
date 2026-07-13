import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type ProfileField = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | null | undefined;
};

export default function SettingsProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const personalFields: ProfileField[] = [
    { icon: 'person-outline', label: 'First name', value: user?.first_name },
    { icon: 'person-outline', label: 'Last name', value: user?.last_name },
    { icon: 'mail-outline', label: 'Email', value: user?.email },
  ];

  const businessFields: ProfileField[] = [
    { icon: 'business-outline', label: 'Company name', value: user?.tenant?.company_name },
    { icon: 'receipt-outline', label: 'RFC', value: user?.tenant?.rfc },
    { icon: 'briefcase-outline', label: 'Business type', value: user?.tenant?.business_type },
  ];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#5f6368" />
        </Pressable>
        <Text className="ml-3 text-lg font-semibold text-ink">Profile</Text>
      </View>

      <ScrollView contentContainerClassName="gap-6 p-4">
        <FieldSection title="Personal" fields={personalFields} />
        <FieldSection title="Business" fields={businessFields} />
      </ScrollView>
    </View>
  );
}

function FieldSection({ title, fields }: { title: string; fields: ProfileField[] }) {
  return (
    <View>
      <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </Text>
      <View className="overflow-hidden rounded-lg border border-border bg-card">
        {fields.map((field, i) => (
          <View
            key={field.label}
            className={`flex-row items-center px-4 py-3.5 ${
              i < fields.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <Ionicons name={field.icon} size={20} color="#5f6368" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted">{field.label}</Text>
              <Text className="text-sm text-ink">{field.value || '—'}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
