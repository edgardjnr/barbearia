import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  appointmentsToday: number;
  monthlyRevenue: number;
  activeClients: number;
  occupancyRate: number;
  loading: boolean;
  error: string | null;
}

export const useDashboardStats = (): DashboardStats => {
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    monthlyRevenue: 0,
    activeClients: 0,
    occupancyRate: 0,
    loading: true,
    error: null,
  });

  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Use UTC date to match server timezone
        const now = new Date();
        const utcToday = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const today = utcToday.toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // Agendamentos de hoje
        const { count: appointmentsToday } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('scheduled_date', today);

        // Receita do mês (baseada no histórico de serviços)
        const { data: monthlyServices } = await supabase
          .from('service_history')
          .select('price')
          .eq('organization_id', organization.id)
          .gte('performed_at', firstDayOfMonth)
          .lte('performed_at', lastDayOfMonth);

        const monthlyRevenue = monthlyServices?.reduce((sum, service) => 
          sum + (Number(service.price) || 0), 0) || 0;

        // Clientes ativos (clientes únicos nos últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentClients } = await supabase
          .from('service_history')
          .select('client_id')
          .eq('organization_id', organization.id)
          .gte('performed_at', thirtyDaysAgo.toISOString());

        const uniqueClients = new Set(recentClients?.map(r => r.client_id) || []);
        const activeClients = uniqueClients.size;

        // Taxa de ocupação (aproximada baseada em agendamentos vs capacidade)
        const { count: totalAppointmentsThisMonth } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('scheduled_date', firstDayOfMonth)
          .lte('scheduled_date', lastDayOfMonth);

        // Estimativa simples: 8 horas por dia útil (22 dias no mês) = 176 slots
        const estimatedCapacity = 22 * 8; // 22 dias úteis * 8 horas
        const occupancyRate = estimatedCapacity > 0 
          ? Math.min(((totalAppointmentsThisMonth || 0) / estimatedCapacity) * 100, 100)
          : 0;

        setStats({
          appointmentsToday: appointmentsToday || 0,
          monthlyRevenue,
          activeClients,
          occupancyRate: Math.round(occupancyRate),
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar estatísticas',
        }));
      }
    };

    fetchStats();
  }, [organization?.id]);

  return stats;
};