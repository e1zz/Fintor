import React, { useState } from 'react';
import { Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types/navigation';
import { resetPassword } from '../../api/endpoints';
import { getApiError } from '../../api/client';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import Toast from '../../components/Toast';
import ChevronLeftIcon from '../../../assets/icons/chevron-left-20.svg';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email, password);
      setDone(true);
    } catch (e: any) {
      setError(getApiError(e, 'Reset failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-bg'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName='flex-grow gap-3 px-4'
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
        keyboardShouldPersistTaps='handled'
      >
        <Pressable
          className='flex-row items-center gap-1.5 self-start py-3 active:opacity-60'
          onPress={() => navigation.navigate('Login')}
        >
          <ChevronLeftIcon />
          <Text className='font-sans text-sm text-primary'>Back to sign in</Text>
        </Pressable>

        <View className='gap-6 pt-13.5'>
          <View className='gap-2'>
            <Text className='font-sans-bold text-2xl text-ink'>Reset password</Text>
            <Text className='font-sans text-sm text-muted'>Enter your email and a new password</Text>
          </View>

          {done ? <Toast message="Password updated. You can sign in." /> : null}

          <View className='gap-3.5'>
            {error ? <Text className='font-sans text-sm text-danger'>{error}</Text> : null}

            <TextField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button title="Update Password" onPress={handleReset} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
