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
import type { SvgProps } from 'react-native-svg';
import { useCfdis } from '../../hooks/useCFDi';
import type { Cfdi } from '../../api/endpoints';
import { formatDate, formatMoney, formatUuid } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import Divider from '../../components/Divider';
import DetailRow from '../../components/DetailRow';
import SearchIcon from '../../../assets/icons/search.svg';
import ClearIcon from '../../../assets/icons/clear.svg';
import ChevronDownIcon from '../../../assets/icons/chevron-down.svg';
import ChevronUpIcon from '../../../assets/icons/chevron-up.svg';
import ReviewConfirmedIcon from '../../../assets/icons/review-confirmed.svg';
import ReviewPendingIcon from '../../../assets/icons/review-pending.svg';
import ReviewNoneIcon from '../../../assets/icons/review-none.svg';

type Filter = 'all' | 'issued' | 'received';

const CHIPS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'issued', label: 'Issued' },
  { key: 'received', label: 'Received' },
];

type ReviewStatus = NonNullable<Cfdi['review_status']>;

const REVIEW: Record<ReviewStatus, { Icon: React.FC<SvgProps>; label: string; className: string }> = {
  none: { Icon: ReviewNoneIcon, label: 'Unreviewed', className: 'text-muted' },
  pending: { Icon: ReviewPendingIcon, label: 'Pending', className: 'text-muted' },
  confirmed: { Icon: ReviewConfirmedIcon, label: 'Confirmed', className: 'text-success' },
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

  const header = (
    <PageHeader
      title="CFDIs"
      subtitle={`${list.length} document${list.length === 1 ? '' : 's'}`}
    />
  );

  if (isLoading && !data) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-1 items-center justify-center pb-7">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-1 items-center justify-center px-4 pb-7">
          <Text className="text-center font-sans text-sm text-danger">
            {error?.message || 'Failed to load CFDIs'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {header}

      <FlatList
        className="flex-1"
        data={list}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="grow gap-3 px-4 pb-7"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColorClassName="accent-primary"
            colorsClassName="accent-primary"
          />
        }
        ListHeaderComponent={
          <View className="gap-3">
            <View className="flex-row gap-2">
              {CHIPS.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  selected={filter === chip.key}
                  onPress={() => { setFilter(chip.key); setExpandedId(null); }}
                />
              ))}
            </View>

            <View className="h-11.5 flex-row items-center gap-2.5 rounded-md border border-border bg-card px-[11px]">
              <SearchIcon />
              <TextInput
                className="h-full flex-1 py-0 font-sans text-[14px] text-ink"
                placeholder="Search by name or RFC..."
                placeholderTextColorClassName="accent-placeholder"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  className="size-[18px]"
                >
                  <View className="absolute -left-[0.85px] -top-[0.85px]">
                    <ClearIcon />
                  </View>
                </Pressable>
              ) : null}
            </View>

            <View className="flex-row justify-between">
              <Text className="font-sans text-xs text-muted">
                {list.length} doc{list.length === 1 ? '' : 's'}
              </Text>
              <Text className="font-sans-semibold text-[13px] leading-[1.4] text-ink">
                {formatMoney(totalAmount)} {currency}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          searchQuery ? (
            <EmptyState fill title="No CFDIs match your search" description="Try another business name or RFC." />
          ) : (
            <EmptyState fill title="No CFDIs yet" description="Connect your SAT credentials to sync documents." />
          )
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
  const review = REVIEW[cfdi.review_status || 'none'];
  const ivaWithheld = Number(cfdi.iva_withholding ?? 0);
  const isrWithheld = Number(cfdi.isr_withholding ?? 0);
  // total = subtotal + IVA − withholdings
  const iva = Number(cfdi.total) - Number(cfdi.subtotal) + ivaWithheld + isrWithheld;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      className={`card active:opacity-80 ${isExpanded ? 'gap-3' : ''}`}
    >
      <View className="flex-row items-start gap-2.5">
        <review.Icon />
        <View className="flex-1 gap-[5px]">
          <Text className="font-sans-semibold text-sm text-ink" numberOfLines={1}>
            {name || '—'}
          </Text>
          <Text className="font-sans text-xs text-muted">{rfc || '—'}</Text>
          <Text className="font-sans text-[11px] leading-[1.4] text-muted">
            {isIssued ? 'Issued' : 'Received'} · {formatDate(cfdi.issue_date)}
          </Text>
        </View>
        <View className="items-end gap-4">
          <Text className={`font-sans-semibold text-sm ${isIssued ? 'text-success' : 'text-danger'}`}>
            {formatMoney(cfdi.total)}
          </Text>
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </View>
      </View>

      {isExpanded && (
        <>
          <Divider />
          <DetailRow label="Subtotal" value={formatMoney(cfdi.subtotal)} />
          <DetailRow label="IVA · 16%" value={formatMoney(iva)} />
          <DetailRow label="ISR retained" value={formatMoney(isrWithheld)} />
          <DetailRow label="UUID" value={formatUuid(cfdi.uuid)} />
          <DetailRow label="Status" value={review.label} valueClassName={review.className} />
        </>
      )}
    </Pressable>
  );
}
