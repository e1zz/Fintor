import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useDashboardSummary, useDashboardChart, useRecentInvoices } from '../../hooks/useDashboards';
import { BarChart } from 'react-native-chart-kit';

interface DashboardSummary {
  sales: number;
  expenses: number;
  profit: number;
}

interface Invoice {
  id: string;
  number: string;
  total: number;
}

interface SummaryCardProps {
  title: string;
  value: number;
}

export default function DashboardScreen(): React.ReactElement {
    const summaryQuery = useDashboardSummary();
    const chartQuery = useDashboardChart('monthly');
    const recentInvoicesQuery = useRecentInvoices(5);
    const [refreshing, setRefreshing] = React.useState<boolean>(false);

    const handleRefresh = async (): Promise<void> => {
        setRefreshing(true);
        await Promise.all([
            summaryQuery.refetch(),
            chartQuery.refetch(),
            recentInvoicesQuery.refetch()
        ]);
        setRefreshing(false);
    };
    if (summaryQuery.isLoading) { return <ActivityIndicator />; }

    if (summaryQuery.isError) { return <Text>Error: {summaryQuery.error.message}</Text>}

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <View style={{ flexDirection: 'row' }}>
        <SummaryCard title="Sales" value={summaryQuery.data.sales} />
        <SummaryCard title="Expenses" value={summaryQuery.data.expenses} />
        <SummaryCard title="Profit" value={summaryQuery.data.profit} />
      </View>

      {chartQuery.data && (
        <BarChart
          data={chartQuery.data}
          width={350}
          height={250}
          yAxisLabel="$"
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            strokeWidth: 2,
            barPercentage: 0.5,
          }}
        />
      )}
      <Text>Recent Invoices</Text>
      {recentInvoicesQuery.data?.map((inv: Invoice) => <Text key={inv.id}>{inv.number} - ${inv.total.toFixed(2)}</Text>)}
    </ScrollView>
  );
}

function SummaryCard({ title, value }: SummaryCardProps): React.ReactElement {
    return (
        <View style={{ flex: 1, padding: 10, margin: 5, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' }}>
            <Text>{title}</Text>
            <Text>${value?.toFixed(2)}</Text>
        </View>
    );  
}



