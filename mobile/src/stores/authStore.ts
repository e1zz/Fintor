import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login as loginApi, register as registerApi, logout as logoutApi, getAuthMe } from '../api/endpoints';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, first_name: string, last_name: string, company_name: string, rfc: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    loadUser: async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (!token){
                set({ isLoading: false });
                return;
            }
            
            set({ token });
            const user = await getAuthMe();
            set({ user, isAuthenticated: true, isLoading: false }); 
            
        
        } catch (error) {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },


    login: async (email, password) => {
        try {
            const data = await loginApi(email, password);
            await SecureStore.setItemAsync('access_token', data.token);
            await SecureStore.setItemAsync('refresh_token', data.refresh);
            set({ user: data.user, token: data.token, isAuthenticated: true });
        } catch (error) {
            throw error;
        }
    },

    register: async (email, first_name, last_name, company_name, rfc, password) => {
        try {
            const data = await registerApi(email, first_name, last_name, company_name, rfc, password);
            await SecureStore.setItemAsync('access_token', data.token);
            await SecureStore.setItemAsync('refresh_token', data.refresh);
            set({ user: data.user, token: data.token, isAuthenticated: true }); 
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            await logoutApi();
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            set({ user: null, token: null, isAuthenticated: false });
        } catch (error) {
            throw error;
        }
    },

}));