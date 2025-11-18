import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReportFilters } from "@/components/ReportsFilters";

interface ServiceFinancialData {
  service_id: string;
  service_name: string;
  total_value: number;
  total_count: number;
  average_value: number;
}

interface FinancialReportData {
  services: ServiceFinancialData[];
  totalRevenue: number;
  loading: boolean;
  error: string | null;
}

export const useFinancialReport = (filters: ReportFilters): FinancialReportData => {
  const [data, setData] = useState<FinancialReportData>({
    services: [],
    totalRevenue: 0,
    loading: true,
    error: null,
  });

  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchFinancialData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Query para service_history com join manual para services
        let serviceHistoryQuery = supabase
          .from('service_history')
          .select(`
            id,
            price,
            performed_at,
            service_id,
            member_id,
            client_id
          `)
          .eq('organization_id', organization.id);

        // Aplicar filtros de data
        if (filters.startDate) {
          const startDateTime = new Date(filters.startDate);
          startDateTime.setHours(0, 0, 0, 0);
          serviceHistoryQuery = serviceHistoryQuery.gte('performed_at', startDateTime.toISOString());
        }
        if (filters.endDate) {
          const endDateTime = new Date(filters.endDate);
          endDateTime.setHours(23, 59, 59, 999);
          serviceHistoryQuery = serviceHistoryQuery.lte('performed_at', endDateTime.toISOString());
        }

        // Aplicar filtro de colaborador
        if (filters.selectedEmployee && filters.selectedEmployee !== "all") {
          serviceHistoryQuery = serviceHistoryQuery.eq('member_id', filters.selectedEmployee);
        }

        // Aplicar filtro de cliente
        if (filters.selectedClient && filters.selectedClient !== "all") {
          serviceHistoryQuery = serviceHistoryQuery.eq('client_id', filters.selectedClient);
        }

        const { data: serviceHistoryData, error: serviceHistoryError } = await serviceHistoryQuery;

        if (serviceHistoryError) {
          throw serviceHistoryError;
        }

        // Buscar informações dos serviços separadamente
        const serviceIds = [...new Set(serviceHistoryData?.map(item => item.service_id) || [])];
        
        let servicesData = [];
        if (serviceIds.length > 0) {
          const { data: servicesResponse, error: servicesError } = await supabase
            .from('services')
            .select('id, name')
            .in('id', serviceIds);

          if (servicesError) {
            throw servicesError;
          }
          servicesData = servicesResponse || [];
        }

        // Processar dados financeiros agrupados por serviço
        const serviceMap = new Map<string, ServiceFinancialData>();
        let totalRevenue = 0;

        serviceHistoryData?.forEach(item => {
          const service = servicesData.find(s => s.id === item.service_id);
          const serviceName = service?.name || 'Serviço não encontrado';
          const price = Number(item.price) || 0;
          
          totalRevenue += price;

          if (serviceMap.has(item.service_id)) {
            const existing = serviceMap.get(item.service_id)!;
            existing.total_value += price;
            existing.total_count += 1;
            existing.average_value = existing.total_value / existing.total_count;
          } else {
            serviceMap.set(item.service_id, {
              service_id: item.service_id,
              service_name: serviceName,
              total_value: price,
              total_count: 1,
              average_value: price,
            });
          }
        });

        const services = Array.from(serviceMap.values())
          .sort((a, b) => b.total_value - a.total_value);

        setData({
          services,
          totalRevenue,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching financial report:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar relatório financeiro',
        }));
      }
    };

    fetchFinancialData();
  }, [organization?.id, filters]);

  return data;
};