import React from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboardSummary, useDashboardChart, useRecentInvoices } from '../../hooks/useDashboards';
import type { RecentInvoice } from '../../api/endpoints';
import { formatCompactMoney, formatMoney, formatUuid } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Divider from '../../components/Divider';

const dashedGrid = require('../../../assets/images/dashed-grid.png');

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

export default function DashboardScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const summaryQuery = useDashboardSummary();
  const chartQuery = useDashboardChart('monthly');
  const recentInvoicesQuery = useRecentInvoices(5);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      summaryQuery.refetch(),
      chartQuery.refetch(),
      recentInvoicesQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const chart: ChartData | undefined = chartQuery.data;
  const chartValues = chart?.datasets?.[0]?.data ?? [];
  const hasChartData = !!chart?.labels?.length && chartValues.some((v) => v > 0);
  const invoices: RecentInvoice[] = recentInvoicesQuery.data ?? [];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <PageHeader title="Dashboard" subtitle="Overview of your business performance" />

      {summaryQuery.isLoading ? (
        <View className="flex-1 items-center justify-center gap-3 px-4 pb-7">
          <ActivityIndicator colorClassName="accent-primary" />
          <Text className="font-sans text-xs text-muted">Loading your overview…</Text>
        </View>
      ) : summaryQuery.isError ? (
        <View className="flex-1 items-center justify-center px-4 pb-7">
          <Text className="text-center font-sans text-sm text-danger">
            Error loading dashboard summary: {summaryQuery.error.message}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
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
          <View className="flex-row gap-2">
            <StatCard title="Sales" value={formatMoney(summaryQuery.data?.sales)} tone="income" />
            <StatCard title="Expenses" value={formatMoney(summaryQuery.data?.expenses)} tone="expense" />
            <StatCard title="Profit" value={formatMoney(summaryQuery.data?.profit)} tone="profit" />
          </View>

          <View className="card gap-2">
            <Text className="font-sans-semibold text-base text-ink">Overview</Text>
            <View className="flex-row justify-between">
              <Text className="font-sans text-xs text-muted">Sales · MXN</Text>
              {chart?.labels?.length ? (
                <Text className="font-sans text-xs text-muted">
                  {chart.labels[0]} – {chart.labels[chart.labels.length - 1]} {new Date().getFullYear()}
                </Text>
              ) : null}
            </View>
            {hasChartData && chart ? (
              <SalesChart labels={chart.labels} values={chartValues} />
            ) : (
              <EmptyState title="No chart data yet" description="Your sales trend will appear here." />
            )}
          </View>

          <View className="card">
            <Text className="font-sans-semibold text-base text-ink">Recent invoices</Text>
            {invoices.length ? (
              invoices.map((inv, i) => (
                <View key={inv.id}>
                  {i > 0 ? <Divider /> : null}
                  <View className="h-9.5 flex-row items-center justify-between gap-3">
                    <View className="shrink gap-px">
                      <Text className="font-sans-medium text-xs text-ink" numberOfLines={1}>
                        {formatUuid(inv.uuid)}
                      </Text>
                      <Text className="font-sans text-2xs text-muted" numberOfLines={1}>
                        {inv.name ?? inv.number}
                      </Text>
                    </View>
                    <Text className="font-sans-semibold text-[13px] leading-[1.4] text-ink">
                      {formatMoney(inv.total)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState title="No invoices yet" description="Sync your CFDIs to get started." />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Bars rise from y=127 to the top grid line (y=11) of the 154pt chart
const BAR_MAX_HEIGHT = 116;
const GRID_LINES = [
  { top: 4, fraction: 1 },
  { top: 61, fraction: 0.5 },
  { top: 118, fraction: 0 },
];

/** 9,140 → 10,000; 52,000 → 60,000 */
function niceCeiling(max: number): number {
  if (max <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / magnitude) * magnitude;
}

function SalesChart({ labels, values }: { labels: string[]; values: number[] }) {
  const axisMax = niceCeiling(Math.max(...values));
  const summary = labels.map((label, i) => `${label} ${formatMoney(values[i])}`).join(', ');

  return (
    <View className="h-[154px]" accessible accessibilityLabel={`Monthly sales: ${summary}`}>
      {GRID_LINES.map((line) => (
        <View
          key={line.top}
          className="absolute left-0 right-0 flex-row items-center gap-[9px]"
          style={{ top: line.top }}
        >
          <Text className="w-8 font-sans text-2xs text-placeholder">
            {formatCompactMoney(axisMax * line.fraction)}
          </Text>
          <Image source={dashedGrid} resizeMode="repeat" className="h-px flex-1" />
        </View>
      ))}

      <View className="absolute bottom-[5px] left-[46px] right-2.5 flex-row items-end justify-between">
        {labels.map((label, i) => (
          <View key={`${label}-${i}`} className="w-10 items-center gap-2">
            <View
              className="w-[18px] rounded-t-[3px] bg-primary"
              style={{ height: (Math.max(values[i] ?? 0, 0) / axisMax) * BAR_MAX_HEIGHT }}
            />
            <Text className="font-sans text-2xs text-muted">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
