import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCfdis } from '../../hooks/useCFDi';
import type { Cfdi } from '../../api/endpoints';

type Filter = 'all' | 'issued' | 'received';

const CHIPS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'issued', label: 'Issued' },
  { key: 'received', label: 'Received' },
];

export default function CfdisScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, isError, error, refetch, isRefetching } = useCfdis();

  const list = useMemo(() => {
    const rows = data ?? [];
    if (filter === 'all') return rows;
    return rows.filter((c) => c.document_type === filter);
  }, [data, filter]);

  if (isLoading && !data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg p-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-danger">
          {error?.message || 'Failed to load CFDIs'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-ink">CFDIs</Text>
        <Text className="mt-1 text-sm text-muted">
          {list.length} document{list.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View className="mb-2 flex-row gap-2 px-4">
        {CHIPS.map((chip) => {
          const active = filter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => setFilter(chip.key)}
              className={`rounded-full px-4 py-2 ${
                active ? 'bg-primary' : 'border border-border bg-card'
              }`}
            >
              <Text className={active ? 'font-medium text-white' : 'text-ink'}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        className="flex-1"
        data={list}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3 p-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <Text className="py-8 text-center text-muted">No CFDIs yet</Text>
        }
        renderItem={({ item }) => <CfdiRow cfdi={item} />}
      />
    </View>
  );
}

function CfdiRow({ cfdi }: { cfdi: Cfdi }) {
  const isIssued = cfdi.document_type === 'issued';
  const name = isIssued ? cfdi.receiver_name : cfdi.sender_name;
  const dateLabel = cfdi.issue_date
    ? new Date(cfdi.issue_date).toLocaleDateString()
    : '—';

  return (
    <View className="rounded-lg border border-border bg-card p-3">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="font-medium text-ink" numberOfLines={1}>
            {name || '—'}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {isIssued ? 'Issued' : 'Received'} · {dateLabel}
          </Text>
        </View>
        <Text className={`font-bold ${isIssued ? 'text-success' : 'text-danger'}`}>
          ${Number(cfdi.total).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}
