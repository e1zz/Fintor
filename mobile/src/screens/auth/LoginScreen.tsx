import React, { useState } from 'react';
import { Text, View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import FintorMark from '../../components/FintorMark';
import TextField from '../../components/TextField';
import LockKeyholeIcon from '../../../assets/icons/lock-keyhole-14.svg';


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
      <ScrollView
        contentContainerClassName='flex-grow gap-3 px-4'
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
        keyboardShouldPersistTaps='handled'
      >
        <View className='flex-1 justify-center gap-7'>
          <View className='items-center gap-3.5'>
            <FintorMark />
            <Text className='font-sans-bold text-4xl text-ink'>Fintor</Text>
            <Text className='font-sans text-lg text-muted'>Sign in to your account</Text>
          </View>

          <View className='gap-3.5'>
            {error ? <Text className='font-sans text-sm text-danger'>{error}</Text> : null}

            <TextField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />

            <TextField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />

            <Button title="Sign In" onPress={handleLogin} loading={loading} />
          </View>

          <Pressable className='self-center' onPress={() => navigation.navigate('ResetPassword')}>
            <Text className='font-sans text-[14px] text-primary underline'>Forgot password?</Text>
          </Pressable>

          <Pressable className='self-center' onPress={() => navigation.navigate('Register')}>
            <Text className='font-sans text-sm text-primary'>Don't have an account? Sign up</Text>
          </Pressable>
        </View>

        <View className='flex-row items-center justify-center gap-1.5'>
          <LockKeyholeIcon />
          <Text className='font-sans text-xs text-muted'>Your business, securely in view.</Text>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}
