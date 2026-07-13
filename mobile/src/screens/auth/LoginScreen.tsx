import React, { useState } from 'react';
import { Text, TextInput,ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (e: any) {
      setError(getApiError(e, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className='flex-1 bg-bg'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerClassName='flex-grow items-center justify-start p-6 pt-20' keyboardShouldPersistTaps='handled'>
          <Image source={require('../../../assets/favicon.png')} className='w-12 h-12 mb-6 mt-10' />
          <Text className='text-4xl font-bold text-ink mb-2'>Fintor</Text>
          <Text className='text-lg text-muted mb-2'>Sign in to your account</Text>

          {error ? <Text className='text-danger'>{error}</Text> : null}

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
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            className='mt-5 btn-primary'
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className='text-white font-semibold'>Sign In</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('ResetPassword')}>
            <Text className='mt-4 text-primary underline'>Forgot password?</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text className='mt-4 text-primary underline'>Don't have an account? Sign up</Text>
          </Pressable>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}
