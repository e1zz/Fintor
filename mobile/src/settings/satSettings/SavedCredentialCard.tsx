import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { SatCredential } from '../../api/endpoints';
import { useAuthStore } from '../../stores/authStore';
import { formatIsoDate } from '../../utils/format';
import Divider from '../../components/Divider';
import DetailRow from '../../components/DetailRow';
import ShieldCheckIcon from '../../../assets/icons/shield-check.svg';

type SavedCredentialCardProps = {
  cred: SatCredential;
  deleting: boolean;
  onDelete: () => void;
  /** Opens SAT Sync for this credential */
  onPress?: () => void;
};

export default function SavedCredentialCard({ cred, deleting, onDelete, onPress }: SavedCredentialCardProps) {
  const companyName = useAuthStore((s) => s.user?.tenant?.company_name);
  const expired = cred.valid_until != null && new Date(cred.valid_until) < new Date();
  const ok = cred.is_active && !expired;
  const statusLabel = expired ? 'Expired' : cred.is_active ? 'Active' : 'Inactive';

  const content = (
    <>
      <Text className="font-sans-semibold text-base text-ink">Saved credential</Text>
      <View className="flex-row items-center gap-2.5">
        <ShieldCheckIcon />
        <View className="flex-1 gap-[3px]">
          <Text className="font-sans-semibold text-sm text-ink" numberOfLines={1}>
            {companyName || cred.rfc}
          </Text>
          <Text className="font-sans text-xs text-muted">{cred.rfc} · RFC from certificate</Text>
        </View>
      </View>
      <Divider />
      <DetailRow label="Valid until" value={formatIsoDate(cred.valid_until)} />
      <View className="flex-row items-center justify-between">
        <Text className={`font-sans text-xs ${ok ? 'text-success' : 'text-danger'}`}>
          ● {statusLabel} · CSD
        </Text>
        <Pressable onPress={onDelete} disabled={deleting} hitSlop={8} accessibilityRole="button">
          {deleting ? (
            <ActivityIndicator size="small" colorClassName="accent-danger" />
          ) : (
            <Text className="font-sans-medium text-[13px] leading-[1.4] text-danger">Delete</Text>
          )}
        </Pressable>
      </View>
    </>
  );

  if (!onPress) return <View className="card gap-2.5">{content}</View>;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="card gap-2.5 active:opacity-80">
      {content}
    </Pressable>
  );
}
