import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
    rfc: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { email, password, first_name, last_name, company_name, rfc } = form;
    if (!email || !password || !first_name || !last_name || !company_name || !rfc) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email, first_name, last_name, company_name, rfc, password);
    } catch (e: any) {
      setError(getApiError(e, 'Registration failed'));
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
        <Text className='text-4xl font-bold text-gray-900 mb-2'>Create Account</Text>
        <Text className='text-lg text-gray-600 mb-2'>Set up your business account</Text>

        {error ? <Text className='text-red-500'>{error}</Text> : null}

        <TextInput
          className='mt-4 input-field'
          placeholder="First Name"
          placeholderTextColor="#999"
          value={form.first_name}
          onChangeText={v => updateField('first_name', v)}
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="Last Name"
          placeholderTextColor="#999"
          value={form.last_name}
          onChangeText={v => updateField('last_name', v)}
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="Email"
          placeholderTextColor="#999"
          value={form.email}
          onChangeText={v => updateField('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="Company Name"
          placeholderTextColor="#999"
          value={form.company_name}
          onChangeText={v => updateField('company_name', v)}
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="RFC"
          placeholderTextColor="#999"
          value={form.rfc}
          onChangeText={v => updateField('rfc', v)}
          autoCapitalize="characters"
        />
        <TextInput
          className='mt-4 input-field'
          placeholder="Password"
          placeholderTextColor="#999"
          value={form.password}
          onChangeText={v => updateField('password', v)}
          secureTextEntry
        />

          <Pressable
            className='mt-5 bg-primary py-4 px-12 rounded-full'
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className='text-white font-semibold'>Create Account</Text>
            )}
          </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text className='text-blue-500 underline mt-4'>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

