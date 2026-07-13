import React from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getSatCredentials, type SatCredential } from '../../api/endpoints';

export default function SettingsSatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['sat-credentials'],
    queryFn: getSatCredentials,
  });

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color="#5f6368" />
        </Pressable>
        <Text className="ml-3 text-lg font-semibold text-ink">SAT Credentials</Text>
      </View>

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-primary" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-danger">
            {error?.message || 'Failed to load credentials'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 p-4"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <Text className="text-sm text-muted">
            CSD certificates used to download CFDIs and stamp invoices
          </Text>

          {data?.length ? (
            data.map((cred) => <CredentialCard key={cred.id} cred={cred} />)
          ) : (
            <View className="rounded-lg border border-border bg-card p-6">
              <Text className="text-center text-sm text-muted">
                No SAT credentials yet
              </Text>
            </View>
          )}

          <Pressable
            disabled
            className="h-12 w-full items-center justify-center rounded-lg border border-border bg-card opacity-50"
          >
            <Text className="text-sm font-medium text-muted">
              + Add credential (coming soon)
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function CredentialCard({ cred }: { cred: SatCredential }) {
  const validLabel = cred.valid_until
    ? new Date(cred.valid_until).toLocaleDateString()
    : '—';
  const expired =
    cred.valid_until != null && new Date(cred.valid_until) < new Date();

  return (
    <View className="rounded-lg border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-medium text-ink">{cred.rfc}</Text>
        <View
          className={`rounded-full px-2 py-0.5 ${
            cred.is_active && !expired ? 'bg-success/15' : 'bg-danger/15'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              cred.is_active && !expired ? 'text-success' : 'text-danger'
            }`}
          >
            {expired ? 'Expired' : cred.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-muted">Valid until {validLabel}</Text>
    </View>
  );
}
