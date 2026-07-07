import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getDashboardChartData, getRecentInvoices } from '../api/endpoints';



export const  useDashboardSummary = () => {
    return useQuery({
        queryKey: ['dashboardSummary'],
        queryFn: getDashboardSummary,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

export const useDashboardChart = (type: string) => {
    return useQuery({
        queryKey: ['dashboardChart', type],
        queryFn: () => getDashboardChartData(type),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useRecentInvoices = (limit: number) => {
    return useQuery({
        queryKey: ['recentInvoices', limit],
        queryFn: () => getRecentInvoices(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}
