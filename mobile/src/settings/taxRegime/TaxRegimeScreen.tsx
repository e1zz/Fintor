import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { updateBusinessInfo, type TaxRegimeCode } from '../../api/endpoints';
import { getApiError } from '../../api/client';
import { TAX_REGIMES } from '../../constants/taxRegimes';
import TopAppBar from '../../components/TopAppBar';
import Button from '../../components/Button';
import Toast from '../../components/Toast';
import CircleCheckIcon from '../../../assets/icons/circle-check-primary.svg';
import CircleUnselectedIcon from '../../../assets/icons/circle-unselected.svg';

export default function TaxRegimeScreen() {
  const insets = useSafeAreaInsets();
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
      <TopAppBar title="Tax Regime" />

      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
      >
        <Text className="font-sans text-sm text-muted">
          Choose the regime registered with SAT for your business.
        </Text>

        <View className="gap-3">
          {TAX_REGIMES.map((regime) => {
            const active = selected === regime.code;
            return (
              <Pressable
                key={regime.code}
                onPress={() => {
                  setSelected(regime.code);
                  setSaved(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                // 2pt selected border keeps the 16pt content inset: 14 + 2
                className={`flex-row items-center gap-3 rounded-lg bg-card ${
                  active ? 'border-2 border-primary p-[14px]' : 'border border-border p-[15px]'
                }`}
              >
                <View className="flex-1 gap-[5px]">
                  <Text className={`font-sans-semibold text-sm ${active ? 'text-primary' : 'text-ink'}`}>
                    {regime.label}
                  </Text>
                  <Text className="font-sans text-xs text-muted">{regime.description}</Text>
                </View>
                {active ? <CircleCheckIcon /> : <CircleUnselectedIcon />}
              </Pressable>
            );
          })}
        </View>

        <Text className="font-sans text-xs text-muted">
          Used for illustrative ISR estimates. This does not change your registration with SAT.
        </Text>

        <Button
          title="Save"
          onPress={handleSave}
          loading={loading}
          disabled={!dirty || !selected}
        />

        {error ? <Text className="font-sans text-sm text-danger">{error}</Text> : null}
        {saved ? <Toast message="Tax regime saved" /> : null}
      </ScrollView>
    </View>
  );
}
