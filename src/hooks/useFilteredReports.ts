import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReportFilters } from "@/components/ReportsFilters";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface FilteredReportsData {
  appointments: number;
  revenue: number;
  newClients: number;
  loading: boolean;
  error: string | null;
}

export const useFilteredReports = (filters: ReportFilters): FilteredReportsData => {
  const [data, setData] = useState<FilteredReportsData>({
    appointments: 0,
    revenue: 0,
    newClients: 0,
    loading: true,
    error: null,
  });

  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchFilteredData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        console.log('🔍 Filtros aplicados:', filters);

        // Query base para agendamentos
        let appointmentsQuery = supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);

        // Aplicar filtros de data para agendamentos
        if (filters.startDate) {
          const startDateStr = format(filters.startDate, 'yyyy-MM-dd');
          appointmentsQuery = appointmentsQuery.gte('scheduled_date', startDateStr);
          console.log('📅 Filtro data início aplicado:', startDateStr);
        }
        if (filters.endDate) {
          const endDateStr = format(filters.endDate, 'yyyy-MM-dd');
          appointmentsQuery = appointmentsQuery.lte('scheduled_date', endDateStr);
          console.log('📅 Filtro data fim aplicado:', endDateStr);
        }

        // Aplicar filtro de colaborador
        if (filters.selectedEmployee && filters.selectedEmployee !== "all") {
          appointmentsQuery = appointmentsQuery.eq('member_id', filters.selectedEmployee);
          console.log('👤 Filtro colaborador aplicado:', filters.selectedEmployee);
        }

        // Aplicar filtro de cliente
        if (filters.selectedClient && filters.selectedClient !== "all") {
          appointmentsQuery = appointmentsQuery.eq('client_id', filters.selectedClient);
          console.log('👥 Filtro cliente aplicado:', filters.selectedClient);
        }

        const { count: appointmentsCount, error: appointmentsError } = await appointmentsQuery;
        
        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
        } else {
          console.log('📊 Agendamentos encontrados:', appointmentsCount);
        }

        // Query para receita (service_history)
        let revenueQuery = supabase
          .from('service_history')
          .select('price, member_id')
          .eq('organization_id', organization.id);

        // Aplicar filtros de data na receita
        if (filters.startDate) {
          const startDateTime = new Date(filters.startDate);
          startDateTime.setHours(0, 0, 0, 0);
          revenueQuery = revenueQuery.gte('performed_at', startDateTime.toISOString());
        }
        if (filters.endDate) {
          const endDateTime = new Date(filters.endDate);
          endDateTime.setHours(23, 59, 59, 999);
          revenueQuery = revenueQuery.lte('performed_at', endDateTime.toISOString());
        }

        // Aplicar filtro de colaborador na receita
        if (filters.selectedEmployee && filters.selectedEmployee !== "all") {
          // Para colaborador específico, buscar apenas registros com esse member_id (não incluir nulls)
          revenueQuery = revenueQuery.eq('member_id', filters.selectedEmployee);
          console.log('👤 Filtro colaborador na receita aplicado:', filters.selectedEmployee);
        }

        // Aplicar filtro de cliente na receita
        if (filters.selectedClient && filters.selectedClient !== "all") {
          revenueQuery = revenueQuery.eq('client_id', filters.selectedClient);
        }

        const { data: revenueData, error: revenueError } = await revenueQuery;
        const revenue = revenueData?.reduce((sum, service) => 
          sum + (Number(service.price) || 0), 0) || 0;

        if (revenueError) {
          console.error('Erro ao buscar receita:', revenueError);
        } else {
          console.log('💰 Receita calculada:', revenue);
        }

        // Query para novos clientes
        let clientsQuery = supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);

        // Aplicar filtros de data para novos clientes
        if (filters.startDate) {
          const startDateTime = new Date(filters.startDate);
          startDateTime.setHours(0, 0, 0, 0);
          clientsQuery = clientsQuery.gte('created_at', startDateTime.toISOString());
        }
        if (filters.endDate) {
          const endDateTime = new Date(filters.endDate);
          endDateTime.setHours(23, 59, 59, 999);
          clientsQuery = clientsQuery.lte('created_at', endDateTime.toISOString());
        }

        // Aplicar filtro específico de cliente
        if (filters.selectedClient && filters.selectedClient !== "all") {
          clientsQuery = clientsQuery.eq('id', filters.selectedClient);
        }

        const { count: newClientsCount, error: clientsError } = await clientsQuery;

        if (clientsError) {
          console.error('Erro ao buscar clientes:', clientsError);
        } else {
          console.log('👥 Novos clientes encontrados:', newClientsCount);
        }

        const finalData = {
          appointments: appointmentsCount || 0,
          revenue,
          newClients: newClientsCount || 0,
          loading: false,
          error: null,
        };

        console.log('✅ Dados finais dos relatórios filtrados:', finalData);
        setData(finalData);

      } catch (error) {
        console.error('Error fetching filtered reports:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar dados filtrados',
        }));
      }
    };

    fetchFilteredData();
  }, [organization?.id, filters]);

  return data;
};