import React, { useState } from 'react';
import { Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import FintorMark from '../../components/FintorMark';
import TextField from '../../components/TextField';

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
      <ScrollView
        contentContainerClassName='flex-grow gap-3 px-4'
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
        keyboardShouldPersistTaps='handled'
      >
        <View className='gap-2.5 pb-2 pt-3'>
          <FintorMark />
          <Text className='font-sans-bold text-2xl text-ink'>Create Account</Text>
          <Text className='font-sans text-sm text-muted'>Set up your business account</Text>
        </View>

        <View className='gap-2.5'>
          {error ? <Text className='font-sans text-sm text-danger'>{error}</Text> : null}

          <TextField
            size="compact"
            placeholder="Company Name"
            value={form.company_name}
            onChangeText={v => updateField('company_name', v)}
          />
          <TextField
            size="compact"
            placeholder="First Name"
            value={form.first_name}
            onChangeText={v => updateField('first_name', v)}
          />
          <TextField
            size="compact"
            placeholder="Last Name"
            value={form.last_name}
            onChangeText={v => updateField('last_name', v)}
          />
          <TextField
            size="compact"
            placeholder="Email"
            value={form.email}
            onChangeText={v => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            size="compact"
            placeholder="RFC"
            value={form.rfc}
            onChangeText={v => updateField('rfc', v)}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            size="compact"
            placeholder="Password"
            value={form.password}
            onChangeText={v => updateField('password', v)}
            secureTextEntry
          />
        </View>

        <Button title="Create Account" onPress={handleRegister} loading={loading} />

        <Pressable className='self-center' onPress={() => navigation.goBack()}>
          <Text className='font-sans text-sm text-primary'>Already have an account? Sign in</Text>
        </Pressable>

        <Text className='text-center font-sans text-xs text-muted'>For your Mexican small business.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
