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
    sender_rfc: string;
    sender_name: string;
    receiver_rfc: string;
    receiver_name: string;
    subtotal: string | number;
    total: string | number;
    iva_withholding: string | number | null;
    isr_withholding: string | number | null;
    currency: string;
    issue_date: string | null;
    status: string | null;
    review_status: 'none' | 'pending' | 'confirmed' | null;
    category: number | null;
};

export const getCfdis = async (): Promise<Cfdi[]> => {
    const response = await AxiosInstance.get('sat/cfdis/');
    return response.data;
};

export type SatCredential = {
    id: number;
    rfc: string;
    cer_path: string;
    key_path: string;
    valid_until: string | null;
    is_active: boolean;
};

export const getSatCredentials = async (): Promise<SatCredential[]> => {
    const response = await AxiosInstance.get('sat/credentials/');
    return response.data;
};

export type TaxRegimeCode = 'resico_pf' | 'pfae' | 'professional_fees' | 'resico_pm';

export const updateBusinessInfo = async (data: {
    business_type?: string;
    business_description?: string;
    tax_regime?: TaxRegimeCode | string;
}) => {
    const response = await AxiosInstance.post('tenants/business-info/', data);
    return response.data;
};
