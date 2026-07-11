import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getDashboardChartData, getRecentInvoices } from '../api/endpoints';



export const useDashboardSummary = () => {
    return useQuery({
        queryKey: ['dashboardSummary'],
        queryFn: getDashboardSummary,
        staleTime: 30 * 1000,
    });
};

export const useDashboardChart = (type: string) => {
    return useQuery({
        queryKey: ['dashboardChart', type],
        queryFn: () => getDashboardChartData(type),
        staleTime: 30 * 1000,
    });
};

export const useRecentInvoices = (limit: number) => {
    return useQuery({
        queryKey: ['recentInvoices', limit],
        queryFn: () => getRecentInvoices(limit),
        staleTime: 30 * 1000,
    });
};
