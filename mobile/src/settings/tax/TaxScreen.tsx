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
import { useAuthStore } from '../../stores/authStore';
import { useDashboardSummary } from '../../hooks/useDashboards';
import { useCfdis } from '../../hooks/useCFDi';
import type { TaxRegimeCode } from '../../api/endpoints';

const REGIME_LABELS: Record<string, string> = {
  resico_pf: 'RESICO Individual',
  pfae: 'Individual Business Activity',
  professional_fees: 'Professional Fees',
  resico_pm: 'RESICO Corporate',
};

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

function money(n: number) {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TaxScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
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

  const { unreviewed, deductionScore, deductibleTotal } = useMemo(() => {
    const rows = cfdisQuery.data ?? [];
    const received = rows.filter((c) => c.document_type === 'received');
    const unreviewedCount = rows.filter(
      (c) => !c.review_status || c.review_status === 'none' || c.review_status === 'pending',
    ).length;
    const confirmed = received.filter((c) => c.review_status === 'confirmed');
    const score =
      received.length === 0
        ? 0
        : Math.round((confirmed.length / received.length) * 100);
    const deductible = confirmed.reduce((s, c) => s + Number(c.total), 0);
    return {
      unreviewed: unreviewedCount,
      deductionScore: score,
      deductibleTotal: deductible,
    };
  }, [cfdisQuery.data]);

  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), cfdisQuery.refetch()]);
    setRefreshing(false);
  };

  if (summaryQuery.isLoading && !summaryQuery.data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
    );
  }

  if (summaryQuery.isError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg p-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-danger">
          {summaryQuery.error?.message || 'Failed to load tax data'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerClassName="gap-4 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View>
          <Text className="text-2xl font-bold text-ink">Tax</Text>
          <Text className="mt-1 text-sm text-muted">
            Estimated liabilities this period
          </Text>
        </View>

        {!regime ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Settings', { screen: 'SettingsTaxRegime' })
            }
            className="rounded-lg border border-border bg-card p-4"
          >
            <Text className="font-medium text-ink">Set your tax regime</Text>
            <Text className="mt-1 text-sm text-muted">
              Choose RESICO or another regime in Settings to unlock ISR estimates
            </Text>
            <Text className="mt-2 text-sm font-semibold text-primary">
              Open Tax Regime →
            </Text>
          </Pressable>
        ) : (
          <View className="rounded-lg border border-border bg-card px-4 py-3">
            <Text className="text-xs text-muted">Active regime</Text>
            <Text className="mt-0.5 font-medium text-ink">
              {REGIME_LABELS[regime] ?? regime}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <StatCard title="Income" value={money(income)} accent="success" />
          <StatCard title="Expenses" value={money(expenses)} accent="danger" />
          <StatCard title="Profit" value={money(profit)} accent="primary" />
        </View>

        <View className="rounded-lg border border-border bg-card p-4">
          <Text className="mb-3 font-semibold text-ink">Estimated taxes</Text>
          <Row
            label="Est. ISR"
            value={regime ? money(estIsr) : '—'}
            hint={
              regime === 'resico_pf'
                ? '2.5% of income'
                : regime === 'resico_pm'
                  ? '30% of profit'
                  : regime
                    ? '15% of profit'
                    : 'Set regime first'
            }
          />
          <Row label="Est. IVA" value={money(estIva)} hint="16% of income" />
          <View className="mt-3 border-t border-border pt-3">
            <Row
              label="Est. total due"
              value={regime ? money(estIsr + estIva) : money(estIva)}
              bold
            />
          </View>
        </View>

        <View className="rounded-lg border border-border bg-card p-4">
          <Text className="mb-2 font-semibold text-ink">Deduction score</Text>
          <Text className="mb-2 text-sm text-muted">
            {deductionScore}% of received CFDIs confirmed · {money(deductibleTotal)}{' '}
            confirmed
          </Text>
          <View className="h-2 overflow-hidden rounded-full bg-border">
            <View
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(deductionScore, 100)}%` }}
            />
          </View>
        </View>

        {unreviewed > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('CFDIs')}
            className="rounded-lg border border-border bg-card p-4"
          >
            <Text className="font-medium text-ink">
              {unreviewed} CFDI{unreviewed === 1 ? '' : 's'} need review
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Confirm categories on CFDIs to improve your deduction score
            </Text>
            <Text className="mt-2 text-sm font-semibold text-primary">
              Open CFDIs →
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: 'success' | 'danger' | 'primary';
}) {
  const color =
    accent === 'success'
      ? 'text-success'
      : accent === 'danger'
        ? 'text-danger'
        : 'text-primary';
  return (
    <View className="flex-1 rounded-lg border border-border bg-card p-3">
      <Text className="mb-1 text-xs text-muted">{title}</Text>
      <Text className={`text-sm font-bold ${color}`}>{value}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  hint,
  bold,
}: {
  label: string;
  value: string;
  hint?: string;
  bold?: boolean;
}) {
  return (
    <View className="mb-2 flex-row items-start justify-between">
      <View className="mr-3 flex-1">
        <Text className={`text-sm ${bold ? 'font-semibold text-ink' : 'text-muted'}`}>
          {label}
        </Text>
        {hint ? <Text className="mt-0.5 text-xs text-muted">{hint}</Text> : null}
      </View>
      <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
        {value}
      </Text>
    </View>
  );
}
