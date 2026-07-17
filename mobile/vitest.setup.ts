import { vi } from 'vitest'

vi.mock('expo-secure-store', () => ({
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
}))

vi.mock('expo-constants', () => ({
    default: {
        exportConfig:{
            version: '1.0.0',
            extra: {apiBaseUrl: 'http://localhost:8000/api/v1/' },
        },
        NativeAppVersion: '1.0.0',
    },
}))