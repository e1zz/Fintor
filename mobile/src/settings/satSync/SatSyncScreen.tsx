import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSatDownload,
  deleteSatCredential,
  getSatCredentials,
  getSatDownloads,
  type SatDownloadType,
} from '../../api/endpoints';
import { getApiError } from '../../api/client';
import type { AppStackParamList } from '../../types/navigation';
import { formatIsoDate, formatRelativeDateTime } from '../../utils/format';
import TopAppBar from '../../components/TopAppBar';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import TextField from '../../components/TextField';
import DetailRow from '../../components/DetailRow';
import Toast from '../../components/Toast';
import SavedCredentialCard from '../satSettings/SavedCredentialCard';

const DIRECTIONS: { key: SatDownloadType; label: string }[] = [
  { key: 'issued', label: 'Issued' },
  { key: 'received', label: 'Received' },
];

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatIsoDate(from), to: formatIsoDate(to) };
}

export default function SatSyncScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { credentialId } = useRoute<RouteProp<AppStackParamList, 'SettingsSatSync'>>().params;
  const queryClient = useQueryClient();

  const credentialsQuery = useQuery({ queryKey: ['sat-credentials'], queryFn: getSatCredentials });
  const downloadsQuery = useQuery({ queryKey: ['sat-downloads'], queryFn: getSatDownloads });
  const cred = credentialsQuery.data?.find((c) => c.id === credentialId);
  // Downloads come back newest first
  const lastSync = downloadsQuery.data?.find((d) => d.sat_credential === credentialId);

  const range = defaultRange();
  const [directions, setDirections] = useState<SatDownloadType[]>(['issued', 'received']);
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);
  const [syncError, setSyncError] = useState('');
  const [queued, setQueued] = useState(false);

  const toggleDirection = (key: SatDownloadType) => {
    setQueued(false);
    setDirections((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  };

  const syncMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        directions.map((download_type) =>
          createSatDownload({ credential_id: credentialId, download_type, date_from: dateFrom, date_to: dateTo }),
        ),
      ),
    onMutate: () => {
      setSyncError('');
      setQueued(false);
    },
    onSuccess: async () => {
      setQueued(true);
      await queryClient.invalidateQueries({ queryKey: ['sat-downloads'] });
    },
    onError: (e: any) => setSyncError(getApiError(e, 'Sync failed')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSatCredential(credentialId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sat-credentials'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Delete failed', getApiError(e)),
  });

  const confirmDelete = () => {
    if (!cred) return;
    Alert.alert('Delete credential', `Remove CSD for ${cred.rfc}? Files are deleted from storage.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TopAppBar title="SAT Sync" />

      {credentialsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      ) : !cred ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center font-sans text-sm text-danger">
            {credentialsQuery.error?.message || 'Credential not found'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="font-sans text-sm text-muted">Sync issued and received CFDIs from SAT.</Text>

          <SavedCredentialCard cred={cred} deleting={deleteMutation.isPending} onDelete={confirmDelete} />

          <View className="card gap-4">
            <Text className="font-sans-semibold text-base text-ink">Sync documents</Text>
            <Text className="font-sans text-xs text-muted">Document directions</Text>
            <View className="flex-row gap-2">
              {DIRECTIONS.map((d) => (
                <Chip
                  key={d.key}
                  label={d.label}
                  selected={directions.includes(d.key)}
                  onPress={() => toggleDirection(d.key)}
                />
              ))}
            </View>
            <View className="flex-row gap-3">
              <TextField
                size="compact"
                containerClassName="flex-1"
                label="From"
                placeholder="YYYY-MM-DD"
                value={dateFrom}
                onChangeText={setDateFrom}
                autoCapitalize="none"
              />
              <TextField
                size="compact"
                containerClassName="flex-1"
                label="To"
                placeholder="YYYY-MM-DD"
                value={dateTo}
                onChangeText={setDateTo}
                autoCapitalize="none"
              />
            </View>
            <DetailRow
              label="Last sync"
              value={lastSync ? formatRelativeDateTime(lastSync.created_at) : 'Never'}
            />
            <Button
              title="Sync CFDIs"
              onPress={() => syncMutation.mutate()}
              loading={syncMutation.isPending}
              disabled={!directions.length || !dateFrom || !dateTo}
            />
            {syncError ? <Text className="font-sans text-sm text-danger">{syncError}</Text> : null}
            {queued ? <Toast message="Sync queued. CFDIs appear when the job finishes." /> : null}
          </View>

          <Text className="font-sans text-xs text-muted">
            Existing UUIDs are skipped to avoid duplicates. SAT availability may affect sync times.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
