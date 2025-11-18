import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface Appointment {
  id: string;
  scheduled_time: string;
  client_name: string;
  service_name: string;
}

interface UseRecentAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

export const useRecentAppointments = (): UseRecentAppointmentsResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date in São Paulo timezone
        const saoPauloToday = toZonedTime(new Date(), 'America/Sao_Paulo');
        const today = format(saoPauloToday, 'yyyy-MM-dd');

        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_time,
            clients!inner(name),
            services!inner(name)
          `)
          .eq('organization_id', organization.id)
          .eq('scheduled_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('scheduled_time', { ascending: true })
          .limit(5);

        if (fetchError) throw fetchError;

        const formattedAppointments = data?.map(apt => ({
          id: apt.id,
          scheduled_time: apt.scheduled_time,
          client_name: (apt.clients as any)?.name || 'Cliente não encontrado',
          service_name: (apt.services as any)?.name || 'Serviço não encontrado',
        })) || [];

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Erro ao carregar agendamentos');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [organization?.id]);

  return { appointments, loading, error };
};