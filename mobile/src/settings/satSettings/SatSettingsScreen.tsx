import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import {
  createSatDownload,
  deleteSatCredential,
  getSatCredentials,
  uploadSatCredential,
  type SatCredential,
  type SatFilePick,
} from '../../api/endpoints';
import { getApiError } from '../../api/client';
import type { AppStackParamList } from '../../types/navigation';
import { formatIsoDate } from '../../utils/format';
import TopAppBar from '../../components/TopAppBar';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import EmptyState from '../../components/EmptyState';
import SavedCredentialCard from './SavedCredentialCard';
import LockKeyholeIcon from '../../../assets/icons/lock-keyhole-15.svg';
import UploadIcon from '../../../assets/icons/upload.svg';

function defaultFromDate() {
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return formatIsoDate(from);
}

export default function SettingsSatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['sat-credentials'],
    queryFn: getSatCredentials,
  });

  const [showForm, setShowForm] = useState(false);
  const [cer, setCer] = useState<SatFilePick | null>(null);
  const [key, setKey] = useState<SatFilePick | null>(null);
  const [password, setPassword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [formError, setFormError] = useState('');

  const closeForm = () => {
    setShowForm(false);
    setCer(null);
    setKey(null);
    setPassword('');
    setDateFrom('');
    setFormError('');
  };

  // Upload the CSD, then queue issued + received downloads from the chosen date
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!cer || !key || !password || !dateFrom) throw new Error('Missing files, password or date');
      const cred = await uploadSatCredential(cer, key, password);
      const dateTo = formatIsoDate(new Date());
      await Promise.all(
        (['issued', 'received'] as const).map((download_type) =>
          createSatDownload({ credential_id: cred.id, download_type, date_from: dateFrom, date_to: dateTo }),
        ),
      );
      return cred;
    },
    onSuccess: async () => {
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['sat-credentials'] });
      await queryClient.invalidateQueries({ queryKey: ['sat-downloads'] });
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

  const openForm = () => {
    setShowForm(true);
    if (!dateFrom) setDateFrom(defaultFromDate());
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TopAppBar title="SAT Credentials" />

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center font-sans text-sm text-danger">
            {error?.message || 'Failed to load credentials'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColorClassName="accent-primary"
              colorsClassName="accent-primary"
            />
          }
        >
          <View className="flex-row items-center gap-3">
            <Pressable className="flex-1" onPress={openForm}>
              <Text className="font-sans-semibold text-sm text-primary">+ Add credential</Text>
            </Pressable>
            <Button title="Add CSD" onPress={openForm} />
          </View>

          {showForm ? (
            <View className="card gap-3">
              <Text className="font-sans-semibold text-base text-ink">Download from SAT</Text>
              <View className="flex-row items-center gap-[7px]">
                <LockKeyholeIcon />
                <Text className="font-sans text-xs text-muted">Your private key stays protected.</Text>
              </View>

              <View className="flex-row gap-3">
                <UploadControl label="Certificate (.cer)" cta="Choose .cer" file={cer} onPick={() => pickFile('cer')} />
                <UploadControl label="Private key (.key)" cta="Choose .key" file={key} onPick={() => pickFile('key')} />
              </View>

              <TextField
                size="compact"
                label="Key password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextField
                size="compact"
                label="Download from date"
                placeholder="YYYY-MM-DD"
                value={dateFrom}
                onChangeText={setDateFrom}
                autoCapitalize="none"
              />

              {formError ? <Text className="font-sans text-sm text-danger">{formError}</Text> : null}

              <View className="flex-row gap-2.5">
                <Button title="Cancel" variant="outline" onPress={closeForm} />
                <Button
                  title="Start download"
                  className="flex-1"
                  onPress={() => uploadMutation.mutate()}
                  loading={uploadMutation.isPending}
                  disabled={!cer || !key || !password || !dateFrom}
                />
              </View>
            </View>
          ) : null}

          {data?.length ? (
            data.map((cred) => (
              <SavedCredentialCard
                key={cred.id}
                cred={cred}
                deleting={deleteMutation.isPending && deleteMutation.variables === cred.id}
                onDelete={() => confirmDelete(cred)}
                onPress={() => navigation.navigate('SettingsSatSync', { credentialId: cred.id })}
              />
            ))
          ) : !showForm ? (
            <EmptyState title="No SAT credentials yet" description="Add your CSD to download CFDIs from SAT." />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function UploadControl({
  label,
  cta,
  file,
  onPick,
}: {
  label: string;
  cta: string;
  file: SatFilePick | null;
  onPick: () => void;
}) {
  return (
    <View className="flex-1 gap-[7px]">
      <Text className="font-sans text-xs text-muted">{label}</Text>
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${file?.name ?? cta}`}
        className="h-11.5 flex-row items-center justify-center gap-2 rounded-md border border-border bg-card px-3 active:bg-primary-tint"
      >
        <UploadIcon />
        <Text className="shrink font-sans text-[13px] leading-[1.4] text-primary" numberOfLines={1}>
          {file?.name ?? cta}
        </Text>
      </Pressable>
    </View>
  );
}
