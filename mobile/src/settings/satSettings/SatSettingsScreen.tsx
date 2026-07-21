import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  createSatDownload,
  deleteSatCredential,
  getSatCredentials,
  uploadSatCredential,
  type SatCredential,
  type SatDownloadType,
  type SatFilePick,
} from '../../api/endpoints';
import { getApiError } from '../../api/client';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { date_from: isoDate(from), date_to: isoDate(to) };
}

export default function SettingsSatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['sat-credentials'],
    queryFn: getSatCredentials,
  });

  const [showForm, setShowForm] = useState(false);
  const [cer, setCer] = useState<SatFilePick | null>(null);
  const [key, setKey] = useState<SatFilePick | null>(null);
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!cer || !key || !password) throw new Error('Missing files or password');
      return uploadSatCredential(cer, key, password);
    },
    onSuccess: async () => {
      setCer(null);
      setKey(null);
      setPassword('');
      setFormError('');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['sat-credentials'] });
    },
    onError: (e: any) => setFormError(getApiError(e, 'Upload failed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSatCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sat-credentials'] }),
    onError: (e: any) => Alert.alert('Delete failed', getApiError(e)),
  });

  const pickFile = async (kind: 'cer' | 'key') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.name || '';
    const ext = kind === 'cer' ? '.cer' : '.key';
    if (!name.toLowerCase().endsWith(ext)) {
      setFormError(`Pick a ${ext} file`);
      return;
    }
    setFormError('');
    const file: SatFilePick = {
      uri: asset.uri,
      name,
      type: asset.mimeType || 'application/octet-stream',
    };
    if (kind === 'cer') setCer(file);
    else setKey(file);
  };

  const confirmDelete = (cred: SatCredential) => {
    Alert.alert(
      'Delete credential',
      `Remove CSD for ${cred.rfc}? Files are deleted from storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(cred.id),
        },
      ],
    );
  };

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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <Text className="text-sm text-muted">
            CSD certificates used to download CFDIs and stamp invoices. Keep .key
            private — never share it.
          </Text>

          {data?.length ? (
            data.map((cred) => (
              <CredentialCard
                key={cred.id}
                cred={cred}
                deleting={deleteMutation.isPending && deleteMutation.variables === cred.id}
                onDelete={() => confirmDelete(cred)}
              />
            ))
          ) : (
            <View className="rounded-lg border border-border bg-card p-6">
              <Text className="text-center text-sm text-muted">
                No SAT credentials yet
              </Text>
            </View>
          )}

          {showForm ? (
            <View className="gap-3 rounded-lg border border-border bg-card p-4">
              <Text className="font-medium text-ink">Add CSD</Text>
              <Text className="text-xs text-muted">
                RFC is read from the .cer. Password never leaves the server encrypted.
              </Text>

              <FileRow
                label=".cer certificate"
                file={cer}
                onPick={() => pickFile('cer')}
              />
              <FileRow
                label=".key private key"
                file={key}
                onPick={() => pickFile('key')}
              />

              <TextInput
                className="h-12 rounded-lg border border-border bg-bg px-3 text-ink"
                placeholder="Key password"
                placeholderTextColor="#9aa0a6"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {formError ? (
                <Text className="text-center text-sm text-danger">{formError}</Text>
              ) : null}

              <Pressable
                onPress={() => uploadMutation.mutate()}
                disabled={!cer || !key || !password || uploadMutation.isPending}
                className={`h-12 items-center justify-center rounded-lg bg-primary ${
                  !cer || !key || !password || uploadMutation.isPending
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {uploadMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Upload</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowForm(false);
                  setFormError('');
                }}
                className="h-10 items-center justify-center"
              >
                <Text className="text-sm text-muted">Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowForm(true)}
              className="h-12 w-full items-center justify-center rounded-lg border border-border bg-card"
            >
              <Text className="text-sm font-medium text-primary">+ Add credential</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function FileRow({
  label,
  file,
  onPick,
}: {
  label: string;
  file: SatFilePick | null;
  onPick: () => void;
}) {
  return (
    <Pressable
      onPress={onPick}
      className="flex-row items-center rounded-lg border border-border bg-bg px-3 py-3"
    >
      <Ionicons
        name={file ? 'document-attach' : 'document-outline'}
        size={20}
        color={file ? '#1a73e8' : '#9aa0a6'}
      />
      <View className="ml-3 flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm text-ink" numberOfLines={1}>
          {file?.name || 'Tap to pick file'}
        </Text>
      </View>
    </Pressable>
  );
}

function CredentialCard({
  cred,
  deleting,
  onDelete,
}: {
  cred: SatCredential;
  deleting: boolean;
  onDelete: () => void;
}) {
  const range = defaultRange();
  const [showSync, setShowSync] = useState(false);
  const [downloadType, setDownloadType] = useState<SatDownloadType>('received');
  const [dateFrom, setDateFrom] = useState(range.date_from);
  const [dateTo, setDateTo] = useState(range.date_to);
  const [syncMsg, setSyncMsg] = useState('');

  const syncMutation = useMutation({
    mutationFn: () =>
      createSatDownload({
        credential_id: cred.id,
        download_type: downloadType,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    onSuccess: (r) => {
      setSyncMsg(`Queued #${r.id} (${r.status}). CFDIs appear when job finishes.`);
    },
    onError: (e: any) => setSyncMsg(getApiError(e, 'Sync failed')),
  });

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

      <View className="mt-3 flex-row items-center gap-4">
        <Pressable
          onPress={() => {
            setShowSync((v) => !v);
            setSyncMsg('');
          }}
          className="flex-row items-center"
        >
          <Ionicons name="cloud-download-outline" size={16} color="#1a73e8" />
          <Text className="ml-1 text-sm text-primary">Sync CFDIs</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="flex-row items-center"
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#d93025" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color="#d93025" />
              <Text className="ml-1 text-sm text-danger">Delete</Text>
            </>
          )}
        </Pressable>
      </View>

      {showSync ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <View className="flex-row gap-2">
            {([
              ['received', 'Recibidas'],
              ['issued', 'Emitidas'],
            ] as const).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setDownloadType(value)}
                className={`rounded-full px-3 py-1.5 ${
                  downloadType === value ? 'bg-primary' : 'bg-bg border border-border'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    downloadType === value ? 'text-white' : 'text-ink'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-2">
            <TextInput
              className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-ink"
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
            />
            <TextInput
              className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-ink"
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
            />
          </View>
          {syncMsg ? (
            <Text className="text-xs text-muted">{syncMsg}</Text>
          ) : null}
          <Pressable
            onPress={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !dateFrom || !dateTo}
            className={`h-10 items-center justify-center rounded-lg bg-primary ${
              syncMutation.isPending ? 'opacity-50' : ''
            }`}
          >
            {syncMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-sm font-semibold text-white">Start download</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
