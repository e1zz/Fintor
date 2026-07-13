import React from 'react';
import { View, Text, ScrollView, Pressable, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { SettingsStackParamList } from '../../types/navigation';


export default function SettingsProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();


    return (
        <View className='flex-1 bg-bg' style={{ paddingTop: insets.top }}>
            <View className='flex-row items-center px-4 py-2'>
                <Pressable hitSlop={8} onPress={() => navigation.goBack()}>
                    <Ionicons name='chevron-back-outline' size={24} color={'#5f6368'} />
                </Pressable>
                <Text className='ml-3 text-lg font-semibold text-ink'>Profile</Text>    
            </View>
            <ScrollView contentContainerClassName='gap-6 p-4'>

            </ScrollView>
        </View>
    )

    
}