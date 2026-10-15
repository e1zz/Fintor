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

export type RecentInvoice = {
    id: string;
    uuid?: string;
    /** Counterparty name (kept for older API responses; prefer `name`) */
    number: string;
    name?: string;
    total: number;
};

export const getRecentInvoices = async (limit: number): Promise<RecentInvoice[]> => {
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
    valid_until: string | null;
    is_active: boolean;
};

export type SatFilePick = {
    uri: string;
    name: string;
    type?: string | null;
};

export const getSatCredentials = async (): Promise<SatCredential[]> => {
    const response = await AxiosInstance.get('sat/credentials/');
    return response.data;
};

export const uploadSatCredential = async (
    cer: SatFilePick,
    key: SatFilePick,
    password: string,
): Promise<SatCredential> => {
    const form = new FormData();
    form.append('cer', {
        uri: cer.uri,
        name: cer.name || 'certificate.cer',
        type: cer.type || 'application/octet-stream',
    } as any);
    form.append('key', {
        uri: key.uri,
        name: key.name || 'private.key',
        type: key.type || 'application/octet-stream',
    } as any);
    form.append('password', password);
    const response = await AxiosInstance.post('sat/credentials/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
    });
    return response.data;
};

export const deleteSatCredential = async (id: number): Promise<void> => {
    await AxiosInstance.delete(`sat/credentials/${id}/`);
};

export type SatDownloadType = 'issued' | 'received';

export type SatDownloadRequest = {
    id: number;
    sat_credential: number;
    download_type: SatDownloadType;
    status: string;
    date_from: string;
    date_to: string;
    cfdis_count: number;
    error_message: string | null;
    created_at: string;
    updated_at: string;
};

export const getSatDownloads = async (): Promise<SatDownloadRequest[]> => {
    const response = await AxiosInstance.get('sat/download/');
    return response.data;
};

export const createSatDownload = async (data: {
    credential_id: number;
    download_type: SatDownloadType;
    date_from: string;
    date_to: string;
}): Promise<SatDownloadRequest> => {
    const response = await AxiosInstance.post('sat/download/', data);
    return response.data;
};

export type Ticket = {
    id: number;
    sender_name: string;
    ticket_date: string | null;
    total: string | number;
    created_at: string;
};

export const getTickets = async (): Promise<Ticket[]> => {
    const response = await AxiosInstance.get('tickets/');
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
