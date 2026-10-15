import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardSummary } from '../../hooks/useDashboards';
import { useCfdis } from '../../hooks/useCFDi';
import type { TaxRegimeCode } from '../../api/endpoints';
import type { AppStackParamList } from '../../types/navigation';
import { REGIME_LABELS } from '../../constants/taxRegimes';
import { formatMoney, formatMonthYear } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DetailRow from '../../components/DetailRow';
import Divider from '../../components/Divider';
import ProgressBar from '../../components/ProgressBar';
import BadgeCheckIcon from '../../../assets/icons/badge-check.svg';

function estimateIsr(
  regime: TaxRegimeCode | string | null | undefined,
  income: number,
  expenses: number,
): number {
  const profit = Math.max(income - expenses, 0);
  switch (regime) {
    case 'resico_pf':
      return income * 0.025;
    case 'resico_pm':
      return profit * 0.3;
    case 'pfae':
    case 'professional_fees':
      return profit * 0.15;
    default:
      return 0;
  }
}

function isrHint(regime: TaxRegimeCode | null) {
  switch (regime) {
    case 'resico_pf':
      return '2.5% of income';
    case 'resico_pm':
      return '30% of profit';
    case 'pfae':
    case 'professional_fees':
      return '15% of profit';
    default:
      return 'Select a regime to calculate ISR';
  }
}

export default function TaxScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const summaryQuery = useDashboardSummary();
  const cfdisQuery = useCfdis();

  const regime = (user?.tenant?.tax_regime as TaxRegimeCode | null) ?? null;
  const income = Number(summaryQuery.data?.sales ?? 0);
  const expenses = Number(summaryQuery.data?.expenses ?? 0);
  const profit = Number(summaryQuery.data?.profit ?? income - expenses);

  const estIsr = useMemo(
    () => estimateIsr(regime, income, expenses),
    [regime, income, expenses],
  );
  const estIva = useMemo(() => income * 0.16, [income]);

  const { deductionScore, deductibleTotal } = useMemo(() => {
    const rows = cfdisQuery.data ?? [];
    const received = rows.filter((c) => c.document_type === 'received');
    const confirmed = received.filter((c) => c.review_status === 'confirmed');
    const score =
      received.length === 0
        ? 0
        : Math.round((confirmed.length / received.length) * 100);
    const deductible = confirmed.reduce((s, c) => s + Number(c.total), 0);
    return { deductionScore: score, deductibleTotal: deductible };
  }, [cfdisQuery.data]);

  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), cfdisQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <PageHeader title="Tax" subtitle="Estimated liabilities this period" />

      {summaryQuery.isLoading && !summaryQuery.data ? (
        <View className="flex-1 items-center justify-center pb-7">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      ) : summaryQuery.isError ? (
        <View className="flex-1 items-center justify-center px-4 pb-7">
          <Text className="text-center font-sans text-sm text-danger">
            {summaryQuery.error?.message || 'Failed to load tax data'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-4 pb-7"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColorClassName="accent-primary"
              colorsClassName="accent-primary"
            />
          }
        >
          {!regime ? (
            <Pressable
              onPress={() => navigation.navigate('SettingsTaxRegime')}
              className="card gap-2 active:opacity-80"
            >
              <Text className="font-sans-semibold text-base text-ink">Set your tax regime</Text>
              <Text className="font-sans text-xs text-muted">
                Choose RESICO or another regime in Settings to unlock ISR estimates
              </Text>
              <Text className="font-sans-medium text-sm text-primary">Open Tax Regime →</Text>
            </Pressable>
          ) : (
            <View className="card gap-2">
              <View className="flex-row items-center gap-2">
                <BadgeCheckIcon />
                <Text className="font-sans text-xs text-muted">Active regime</Text>
              </View>
              <Text className="font-sans-semibold text-base text-ink">
                {REGIME_LABELS[regime] ?? regime}
              </Text>
              <Text className="font-sans text-xs text-muted">
                {formatMonthYear(new Date())} · MXN
              </Text>
            </View>
          )}

          <View className="flex-row gap-2">
            <StatCard title="Income" value={formatMoney(income)} tone="income" />
            <StatCard title="Expenses" value={formatMoney(expenses)} tone="expense" />
            <StatCard title="Profit" value={formatMoney(profit)} tone="profit" />
          </View>

          <View className="card gap-2.5">
            <Text className="font-sans-semibold text-base text-ink">Estimated taxes</Text>
            <DetailRow label="Est. ISR" value={regime ? formatMoney(estIsr) : 'Not available'} />
            <Text className="font-sans text-xs text-muted">{isrHint(regime)}</Text>
            <DetailRow label="Est. IVA" value={formatMoney(estIva)} />
            <Text className="font-sans text-xs text-muted">16% of income</Text>
            <Divider />
            <DetailRow
              label={regime ? 'Est. total due' : 'Est. IVA only'}
              value={formatMoney(regime ? estIsr + estIva : estIva)}
              emphasis
            />
          </View>

          <View className="card gap-2.5">
            <Text className="font-sans-semibold text-base text-ink">Deduction score</Text>
            <ProgressBar value={deductionScore} />
            <Text className="font-sans text-xs text-muted">
              {deductionScore}% of received CFDIs confirmed · {formatMoney(deductibleTotal)} confirmed
            </Text>
          </View>

          <Text className="font-sans text-[11px] leading-[1.4] text-muted">
            Illustrative estimates, not tax advice. Confirm your obligations and deductions with a
            tax professional.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
