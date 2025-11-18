import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const useAgendaBadge = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchTodayAppointments = async () => {
      try {
        // Use São Paulo timezone
        const now = new Date();
        const saoPauloDate = toZonedTime(now, 'America/Sao_Paulo');
        const today = format(saoPauloDate, 'yyyy-MM-dd');

        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('scheduled_date', today)
          .eq('status', 'pending');

        setCount(appointmentsCount || 0);
      } catch (error) {
        console.error('Error fetching appointments count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchTodayAppointments, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [organization?.id]);

  return { count, loading };
};