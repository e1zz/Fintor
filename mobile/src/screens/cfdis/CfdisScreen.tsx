import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCfdis } from '../../hooks/useCFDi';
import type { Cfdi } from '../../api/endpoints';
import { Ionicons } from '@expo/vector-icons';

type Filter = 'all' | 'issued' | 'received';

const CHIPS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'issued', label: 'Issued' },
  { key: 'received', label: 'Received' },
];

const REVIEW_COLORS: Record<string, string> = {
  none: 'bg-gray-400',
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-500',
};

export default function CfdisScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading, isError, error, refetch, isRefetching } = useCfdis();

  const list = useMemo(() => {
    const rows = data ?? [];
    const filtered = filter === 'all' ? rows : rows.filter((f) => f.document_type === filter);
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter(
      (f) =>
        f.sender_name?.toLowerCase().includes(q) ||
        f.receiver_name?.toLowerCase().includes(q) ||
        f.sender_rfc?.toLowerCase().includes(q) ||
        f.receiver_rfc?.toLowerCase().includes(q),
    );
  }, [data, filter, searchQuery]);

  const totalAmount = useMemo(() => list.reduce((sum, f) => sum + Number(f.total), 0), [list]);
  const currency = list[0]?.currency || 'MXN';

  if (isLoading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6" style={{ paddingTop: insets.top }}>
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
              onPress={() => { setFilter(chip.key); setExpandedId(null); }}
              className={`rounded-full px-4 py-2 ${active ? 'bg-primary' : 'border border-border bg-card'}`}
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <>
            <View className="mb-3 flex-row items-center rounded-lg border border-border bg-card px-3 py-2.5">
              <Ionicons name="search" size={18} color="#9aa0a6" />
              <TextInput
                className="ml-2 flex-1 text-base text-ink"
                placeholder="Search by name or RFC..."
                placeholderTextColor="#9aa0a6"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#9aa0a6" />
                </Pressable>
              ) : null}
            </View>

            <View className="mb-1 flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <Text className="text-sm text-muted">
                {list.length} doc{list.length === 1 ? '' : 's'}
              </Text>
              <Text className="text-sm font-semibold text-ink">
                ${Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text className="py-8 text-center text-muted">
            {searchQuery ? 'No CFDIs match your search' : 'No CFDIs yet'}
          </Text>
        }
        renderItem={({ item }) => (
          <CfdiRow
            cfdi={item}
            isExpanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          />
        )}
      />
    </View>
  );
}

function CfdiRow({
  cfdi,
  isExpanded,
  onToggle,
}: {
  cfdi: Cfdi;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isIssued = cfdi.document_type === 'issued';
  const name = isIssued ? cfdi.receiver_name : cfdi.sender_name;
  const rfc = isIssued ? cfdi.receiver_rfc : cfdi.sender_rfc;
  const dateLabel = cfdi.issue_date
    ? new Date(cfdi.issue_date).toLocaleDateString()
    : '—';

  return (
    <Pressable
      onPress={onToggle}
      className="rounded-lg border border-border bg-card p-3 active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <View className="flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${REVIEW_COLORS[cfdi.review_status || 'none']}`} />
            <Text className="font-medium text-ink" numberOfLines={1}>
              {name || '—'}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs text-muted">{rfc || '—'}</Text>
          <Text className="mt-0.5 text-xs text-muted">
            {isIssued ? 'Issued' : 'Received'} · {dateLabel}
          </Text>
        </View>
        <Text className={`font-bold ${isIssued ? 'text-success' : 'text-danger'}`}>
          ${Number(cfdi.total).toFixed(2)}
        </Text>
      </View>

      {isExpanded && (
        <View className="mt-3 border-t border-border pt-3">
          <DetailRow label="Subtotal" value={`$${Number(cfdi.subtotal).toFixed(2)}`} />
          <DetailRow label="IVA" value={cfdi.iva_withholding ? `$${Number(cfdi.iva_withholding).toFixed(2)}` : '—'} />
          <DetailRow label="ISR" value={cfdi.isr_withholding ? `$${Number(cfdi.isr_withholding).toFixed(2)}` : '—'} />
          <DetailRow label="UUID" value={cfdi.uuid} />
          {cfdi.status ? <DetailRow label="Status" value={cfdi.status.charAt(0).toUpperCase() + cfdi.status.slice(1)} /> : null}
        </View>
      )}
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-1 flex-row items-center justify-between">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="max-w-[200px] text-xs text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
