import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import TopAppBar from '../../components/TopAppBar';
import TextField from '../../components/TextField';
import Button from '../../components/Button';


export default function SettingsProfileScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    return (
        <View className='flex-1 bg-bg' style={{ paddingTop: insets.top }}>
            <TopAppBar title='Profile' />
            <ScrollView
                contentContainerClassName='gap-3 px-4 pt-3'
                contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
            >
                <Text className='font-sans text-sm text-muted'>Your business and contact details.</Text>

                {/* auth/me/ is read-only on the API, so these fields can't be saved yet */}
                <View className='gap-4'>
                    <TextField label='Company Name' value={user?.tenant?.company_name ?? ''} editable={false} />
                    <TextField label='RFC' value={user?.tenant?.rfc ?? ''} editable={false} />
                    <TextField label='First Name' value={user?.first_name ?? ''} editable={false} />
                    <TextField label='Last Name' value={user?.last_name ?? ''} editable={false} />
                    <TextField label='Email' value={user?.email ?? ''} editable={false} />
                </View>

                <Button title='Save Changes' disabled />
            </ScrollView>
        </View>
    )
}
