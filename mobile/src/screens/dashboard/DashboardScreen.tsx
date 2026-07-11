import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { useDashboardSummary, useDashboardChart, useRecentInvoices } from '../../hooks/useDashboards';
import { BarChart } from 'react-native-chart-kit';

interface Invoice {
  id: string;
  number: string;
  total: number;
}

interface SummaryCardProps {
  title: string;
  value: number;
  accent: 'success' | 'danger' | 'primary';
}

export default function DashboardScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const summaryQuery = useDashboardSummary();
  const chartQuery = useDashboardChart('monthly');
  const recentInvoicesQuery = useRecentInvoices(5);
  const { width: screenWidth } = useWindowDimensions();
  // scroll p-4 (32) + card p-4 (32); refined by onLayout
  const [chartWidth, setChartWidth] = React.useState(Math.max(screenWidth - 64, 200));
  const primary = useCSSVariable('--color-primary') as string;
  const card = useCSSVariable('--color-card') as string;
  const muted = useCSSVariable('--color-muted') as string;
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

  if (summaryQuery.isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg p-6"
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
          Error loading dashboard summary: {summaryQuery.error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View>
          <Text className="text-2xl font-bold text-ink">Dashboard</Text>
          <Text className="mt-1 text-sm text-muted">
            Overview of your business performance
          </Text>
        </View>

        <View className="flex-row gap-2">
          <SummaryCard title="Sales" value={summaryQuery.data?.sales ?? 0} accent="success" />
          <SummaryCard title="Expenses" value={summaryQuery.data?.expenses ?? 0} accent="danger" />
          <SummaryCard title="Profit" value={summaryQuery.data?.profit ?? 0} accent="primary" />
        </View>

        <View className="overflow-hidden rounded-lg border border-border bg-card p-4">
          <Text className="mb-3 font-semibold text-ink">Overview</Text>
          {chartQuery.data?.labels?.length ? (
            <View
              className="overflow-hidden"
              onLayout={(e) => {
                const w = Math.floor(e.nativeEvent.layout.width);
                if (w > 0 && w !== chartWidth) setChartWidth(w);
              }}
            >
              <BarChart
                data={chartQuery.data}
                width={chartWidth}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                withInnerLines
                showValuesOnTopOfBars={false}
                chartConfig={{
                  backgroundGradientFrom: card,
                  backgroundGradientTo: card,
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  fillShadowGradientFrom: primary,
                  fillShadowGradientTo: primary,
                  color: () => primary,
                  labelColor: () => muted,
                  barPercentage: 0.45,
                  decimalPlaces: 0,
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: muted,
                    strokeOpacity: 0.15,
                  },
                  formatYLabel: (v) => {
                    const n = Number(v);
                    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
                    return `$${n}`;
                  },
                }}
                style={{
                  marginLeft: -8,
                  borderRadius: 8,
                }}
              />
            </View>
          ) : (
            <Text className="py-2 text-center text-sm text-muted">No chart data yet</Text>
          )}
        </View>

        <View className="rounded-lg border border-border bg-card p-4">
          <Text className="mb-3 font-semibold text-ink">Recent invoices</Text>
          {recentInvoicesQuery.data?.length ? (
            recentInvoicesQuery.data.map((inv: Invoice) => (
              <View
                key={inv.id}
                className="flex-row items-center justify-between border-b border-border py-3"
              >
                <Text className="flex-1 text-ink" numberOfLines={1}>
                  {inv.number || '—'}
                </Text>
                <Text className="ml-3 font-medium text-ink">
                  ${Number(inv.total).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="py-2 text-center text-sm text-muted">No invoices yet</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ title, value, accent }: SummaryCardProps): React.ReactElement {
  const accentText =
    accent === 'success'
      ? 'text-success'
      : accent === 'danger'
        ? 'text-danger'
        : 'text-primary';

  return (
    <View className="flex-1 rounded-lg border border-border bg-card p-3">
      <Text className="mb-1 text-xs text-muted">{title}</Text>
      <Text className={`text-base font-bold ${accentText}`}>
        ${Number(value ?? 0).toFixed(2)}
      </Text>
    </View>
  );
}
