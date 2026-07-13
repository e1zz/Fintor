import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { updateBusinessInfo, type TaxRegimeCode } from '../../api/endpoints';
import { getApiError } from '../../api/client';

const REGIMES: {
  code: TaxRegimeCode;
  label: string;
  description: string;
}[] = [
  {
    code: 'resico_pf',
    label: 'RESICO Individual',
    description: '~1–2.5% on gross income',
  },
  {
    code: 'pfae',
    label: 'Individual Business Activity',
    description: 'Progressive rate on profit',
  },
  {
    code: 'professional_fees',
    label: 'Professional Fees',
    description: 'Progressive rate on profit',
  },
  {
    code: 'resico_pm',
    label: 'RESICO Corporate',
    description: '~30% on profit',
  },
];

export default function TaxRegimeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);

  const current = (user?.tenant?.tax_regime as TaxRegimeCode | null) ?? null;
  const [selected, setSelected] = useState<TaxRegimeCode | null>(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const dirty = selected !== current;

  const handleSave = async () => {
    if (!selected || !dirty) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      await updateBusinessInfo({ tax_regime: selected });
      await loadUser();
      setSaved(true);
    } catch (e: any) {
      setError(getApiError(e, 'Failed to save tax regime'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#5f6368" />
        </Pressable>
        <Text className="ml-3 text-lg font-semibold text-ink">Tax Regime</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text className="text-sm text-muted">
          Select your tax regime to calculate estimated ISR
        </Text>

        {error ? <Text className="text-center text-danger">{error}</Text> : null}
        {saved ? (
          <Text className="text-center text-success">Tax regime saved</Text>
        ) : null}

        <View className="overflow-hidden rounded-lg border border-border bg-card">
          {REGIMES.map((regime, i) => {
            const active = selected === regime.code;
            return (
              <Pressable
                key={regime.code}
                onPress={() => {
                  setSelected(regime.code);
                  setSaved(false);
                }}
                className={`flex-row items-center px-4 py-3.5 ${
                  i < REGIMES.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off-outline'}
                  size={22}
                  color={active ? '#1a73e8' : '#9aa0a6'}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-medium text-ink">{regime.label}</Text>
                  <Text className="mt-0.5 text-xs text-muted">{regime.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!dirty || loading || !selected}
          className={`mt-2 h-12 w-full items-center justify-center rounded-lg bg-primary ${
            !dirty || loading || !selected ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
