import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface WeeklySummary {
  appointments: number;
  revenue: number;
  newClients: number;
  loading: boolean;
  error: string | null;
}

export const useWeeklySummary = (): WeeklySummary => {
  const [summary, setSummary] = useState<WeeklySummary>({
    appointments: 0,
    revenue: 0,
    newClients: 0,
    loading: true,
    error: null,
  });

  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchWeeklySummary = async () => {
      try {
        setSummary(prev => ({ ...prev, loading: true, error: null }));

        // Últimos 7 dias usando fuso horário de São Paulo
        const saoPauloNow = toZonedTime(new Date(), 'America/Sao_Paulo');
        const saoPauloWeekAgo = subDays(saoPauloNow, 7);
        const weekAgoStr = format(saoPauloWeekAgo, 'yyyy-MM-dd');
        const today = format(saoPauloNow, 'yyyy-MM-dd');

        // Agendamentos da semana
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('scheduled_date', weekAgoStr)
          .lte('scheduled_date', today);

        // Receita da semana
        const { data: weeklyServices } = await supabase
          .from('service_history')
          .select('price')
          .eq('organization_id', organization.id)
          .gte('performed_at', saoPauloWeekAgo.toISOString())
          .lte('performed_at', saoPauloNow.toISOString());

        const revenue = weeklyServices?.reduce((sum, service) => 
          sum + (Number(service.price) || 0), 0) || 0;

        // Novos clientes da semana
        const { count: newClientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', saoPauloWeekAgo.toISOString());

        setSummary({
          appointments: appointmentsCount || 0,
          revenue,
          newClients: newClientsCount || 0,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching weekly summary:', error);
        setSummary(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar resumo semanal',
        }));
      }
    };

    fetchWeeklySummary();
  }, [organization?.id]);

  return summary;
};