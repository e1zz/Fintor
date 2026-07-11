import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation';
import { resetPassword } from '../../api/endpoints';
import { getApiError } from '../../api/client';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
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
      <ScrollView contentContainerClassName='flex-grow items-center justify-start p-6 pt-20' keyboardShouldPersistTaps='handled'>
        <Text className='text-2xl font-bold text-gray-900 mb-2'>Reset password</Text>
        <Text className='text-lg text-gray-600 mb-2'>Enter your email and a new password</Text>

        {error ? <Text className='text-red-500'>{error}</Text> : null}
        {done ? <Text className='text-green-500'>Password updated. You can sign in.</Text> : null}

        <TextInput
          className='mt-4 input-field'
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="New password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

          <Pressable
            className='mt-5 bg-primary py-4 px-12 rounded-full'
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className='text-white font-semibold'>Update Password</Text>
            )}
          </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text className='text-blue-500 underline mt-4'>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
