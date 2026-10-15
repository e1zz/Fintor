import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../../api/endpoints';
import { formatMediumDate, formatMoney } from '../../utils/format';
import TopAppBar from '../../components/TopAppBar';
import Divider from '../../components/Divider';
import EmptyState from '../../components/EmptyState';
import ImageIcon from '../../../assets/icons/image.svg';

export default function SettingsStorage() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
  });
  const tickets = data ?? [];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TopAppBar title="Ticket Storage" />

      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColorClassName="accent-primary"
            colorsClassName="accent-primary"
          />
        }
      >
        <Text className="font-sans text-sm text-muted">Keep your business receipts in one place.</Text>

        {/* Storage usage card from the design needs file sizes/quota the tickets API doesn't return */}
        <View className="card">
          <Text className="font-sans-semibold text-base text-ink">Stored tickets</Text>
          {isLoading ? (
            <View className="h-[210px] items-center justify-center">
              <ActivityIndicator colorClassName="accent-primary" />
            </View>
          ) : isError ? (
            <EmptyState title="Couldn't load tickets" description={error?.message} />
          ) : tickets.length ? (
            tickets.map((ticket, i) => (
              <View key={ticket.id}>
                {i > 0 ? <Divider /> : null}
                <View className="h-17 flex-row items-center gap-3">
                  <ImageIcon />
                  <View className="flex-1 gap-1">
                    <Text className="font-sans-medium text-[13px] leading-[1.4] text-ink" numberOfLines={1}>
                      {ticket.sender_name || `Ticket #${ticket.id}`}
                    </Text>
                    <Text className="font-sans text-xs text-muted">
                      {formatMediumDate(ticket.ticket_date ?? ticket.created_at)} · {formatMoney(ticket.total)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <EmptyState title="No tickets yet" description="Receipts you upload will appear here." />
          )}
        </View>

        {tickets.length ? (
          <Text className="font-sans text-xs text-muted">
            {tickets.length} ticket{tickets.length === 1 ? '' : 's'} stored
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
