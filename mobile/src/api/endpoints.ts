import { AxiosInstance } from './client';
import * as SecureStore from 'expo-secure-store';


export const login = async (email: string, password: string) => {
    const response = await AxiosInstance.post('auth/login/', { email, password });
    return response.data;
};

export const register = async (email: string, first_name: string, last_name: string, company_name: string, rfc: string, password: string) => {
    const response = await AxiosInstance.post('auth/register/', { email, first_name, last_name, company_name, rfc, password });
    return response.data;
};

export const resetPassword = async (email: string, password: string) => {
    const response = await AxiosInstance.post('auth/reset-password/', { email, password });
    return response.data;
};

export const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const response = await AxiosInstance.post('auth/logout/', { refresh: refreshToken });
    return response.data;
};

export const getAuthMe = async () => {
    const response = await AxiosInstance.get('auth/me/');
    return response.data;
}

export const getDashboardSummary = async () => {
    const response = await AxiosInstance.get('dashboard/summary/');
    return response.data;
};

export const getDashboardChartData = async (type: string) => {
    const response = await AxiosInstance.get('dashboard/chart-data/', { params: { type } });
    return response.data;
};

export const getRecentInvoices = async (limit: number) => {
    const response = await AxiosInstance.get('dashboard/recent-invoices/', { params: { limit } });
    return response.data;
};


export type Cfdi = {
    id: number;
    uuid: string;
    document_type: 'issued' | 'received';
    sender_name: string;
    receiver_name: string;
    total: string | number;
    issue_date: string | null;
};

export const getCfdis = async (): Promise<Cfdi[]> => {
    const response = await AxiosInstance.get('sat/cfdis/');
    return response.data;
};
