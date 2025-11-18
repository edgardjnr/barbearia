import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MonthlyClientData {
  month: string;
  novos: number;
  retornos: number;
}

interface ServiceData {
  service: string;
  clientes: number;
}

interface TopClient {
  name: string;
  valor: number;
  visitas: number;
  ultimaVisita: string;
}

interface AgeGroupData {
  name: string;
  value: number;
  fill: string;
}

interface ClientAnalyticsData {
  monthlyClients: MonthlyClientData[];
  servicePreferences: ServiceData[];
  topClients: TopClient[];
  ageGroups: AgeGroupData[];
  loading: boolean;
  error: string | null;
}

export const useClientAnalytics = (): ClientAnalyticsData => {
  const [data, setData] = useState<ClientAnalyticsData>({
    monthlyClients: [],
    servicePreferences: [],
    topClients: [],
    ageGroups: [],
    loading: true,
    error: null,
  });

  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.id) return;

    const fetchAnalytics = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        console.log('🔍 Iniciando busca de analytics para organização:', organization.id);

        // Dados dos últimos 6 meses
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          // Definir o dia como 1 para evitar problemas de rollover
          date.setDate(1);
          date.setMonth(date.getMonth() - i);
          months.push(date);
        }

        // Dados mensais de clientes novos
        const monthlyPromises = months.map(async (month) => {
          const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
          const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          
          const { count: novos } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization.id)
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfMonth.toISOString());

          // Para retornos, vamos considerar clientes que fizeram mais de um serviço no mês
          const { data: serviceHistory } = await supabase
            .from('service_history')
            .select('client_id')
            .eq('organization_id', organization.id)
            .gte('performed_at', startOfMonth.toISOString())
            .lte('performed_at', endOfMonth.toISOString());

          const clientVisits = serviceHistory?.reduce((acc, service) => {
            acc[service.client_id] = (acc[service.client_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};

          const retornos = Object.values(clientVisits).filter(visits => visits > 1).length;

          return {
            month: month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
            novos: novos || 0,
            retornos,
          };
        });

        const monthlyClients = await Promise.all(monthlyPromises);

        // Serviços mais procurados - abordagem mais robusta
        console.log('📊 Buscando histórico de serviços...');
        
        let servicePreferences: ServiceData[] = [];
        
        // Buscar histórico de serviços primeiro
        const { data: serviceHistory, error: serviceHistoryError } = await supabase
          .from('service_history')
          .select('service_id')
          .eq('organization_id', organization.id);

        console.log('📊 Service History:', serviceHistory);
        console.log('📊 Service History erro:', serviceHistoryError);

        if (!serviceHistory || serviceHistory.length === 0) {
          console.log('📊 Nenhum histórico de serviços encontrado');
        } else {
          // Contar ocorrências por service_id
          const serviceCounts = serviceHistory.reduce((acc, record) => {
            const serviceId = record.service_id;
            acc[serviceId] = (acc[serviceId] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Buscar nomes dos serviços
          const serviceIds = Object.keys(serviceCounts);
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('id, name')
            .in('id', serviceIds);

          console.log('📊 Services Data:', servicesData);
          console.log('📊 Services erro:', servicesError);

          if (servicesData) {
            servicePreferences = servicesData
              .map(service => ({
                service: service.name,
                clientes: serviceCounts[service.id] || 0
              }))
              .sort((a, b) => b.clientes - a.clientes)
              .slice(0, 5);
          }
        }

        console.log('📊 Service preferences final:', servicePreferences);

        // Distribuição por idade - dados reais
        console.log('👥 Buscando distribuição etária...');
        
        const { data: clientsWithAge, error: ageError } = await supabase
          .from('clients')
          .select('birth_date')
          .eq('organization_id', organization.id)
          .not('birth_date', 'is', null);

        console.log('👥 Clients with age:', clientsWithAge);
        console.log('👥 Age error:', ageError);

        let ageGroups: AgeGroupData[] = [];

        if (clientsWithAge && clientsWithAge.length > 0) {
          const ageCounts = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '55+': 0
          };

          clientsWithAge.forEach(client => {
            if (client.birth_date) {
              const today = new Date();
              const birthDate = new Date(client.birth_date);
              const age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              
              const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
                ? age - 1 
                : age;

              if (actualAge >= 18 && actualAge <= 25) ageCounts['18-25']++;
              else if (actualAge >= 26 && actualAge <= 35) ageCounts['26-35']++;
              else if (actualAge >= 36 && actualAge <= 45) ageCounts['36-45']++;
              else if (actualAge >= 46 && actualAge <= 55) ageCounts['46-55']++;
              else if (actualAge > 55) ageCounts['55+']++;
            }
          });

          ageGroups = [
            { name: "18-25", value: ageCounts['18-25'], fill: "hsl(var(--primary))" },
            { name: "26-35", value: ageCounts['26-35'], fill: "hsl(var(--primary) / 0.8)" },
            { name: "36-45", value: ageCounts['36-45'], fill: "hsl(var(--primary) / 0.6)" },
            { name: "46-55", value: ageCounts['46-55'], fill: "hsl(var(--primary) / 0.4)" },
            { name: "55+", value: ageCounts['55+'], fill: "hsl(var(--primary) / 0.2)" },
          ].filter(group => group.value > 0); // Remove grupos sem dados
        }

        console.log('👥 Age groups final:', ageGroups);

        // Top clientes - abordagem simplificada
        console.log('👑 Buscando top clientes...');
        
        // Primeiro buscar histórico de serviços
        const { data: serviceHistoryData, error: clientHistoryError } = await supabase
          .from('service_history')
          .select('client_id, price, performed_at')
          .eq('organization_id', organization.id);

        console.log('👑 Service History Data:', serviceHistoryData);
        console.log('👑 Service History Error:', clientHistoryError);

        if (!serviceHistoryData || serviceHistoryData.length === 0) {
          console.log('👑 Nenhum histórico de serviços encontrado');
          setData({
            monthlyClients,
            servicePreferences,
            topClients: [],
            ageGroups,
            loading: false,
            error: null,
          });
          return;
        }

        // Buscar dados dos clientes separadamente
        const clientIds = [...new Set(serviceHistoryData.map(s => s.client_id))];
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        console.log('👑 Clients Data:', clientsData);
        console.log('👑 Clients Error:', clientsError);

        // Criar mapa de clientes para facilitar lookup
        const clientsMap = clientsData?.reduce((acc, client) => {
          acc[client.id] = client.name;
          return acc;
        }, {} as Record<string, string>) || {};

        const clientStats = serviceHistoryData.reduce((acc, record) => {
          const clientId = record.client_id;
          const clientName = clientsMap[clientId] || 'Cliente não encontrado';
          
          console.log('👑 Processando cliente:', { clientId, clientName, price: record.price });
          
          if (!acc[clientId]) {
            acc[clientId] = {
              name: clientName,
              valor: 0,
              visitas: 0,
              ultimaVisita: record.performed_at,
            };
          }

          acc[clientId].valor += Number(record.price) || 0;
          acc[clientId].visitas += 1;
          
          if (new Date(record.performed_at) > new Date(acc[clientId].ultimaVisita)) {
            acc[clientId].ultimaVisita = record.performed_at;
          }

          return acc;
        }, {} as Record<string, TopClient>);

        console.log('👑 Client Stats:', clientStats);

        const topClients = Object.values(clientStats)
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 8)
          .map(client => ({
            ...client,
            ultimaVisita: new Date(client.ultimaVisita).toLocaleDateString('pt-BR'),
          }));

        console.log('👑 Top Clients final:', topClients);

        console.log('✅ Dados finais do analytics:', {
          monthlyClients,
          servicePreferences,
          topClients,
          ageGroups
        });

        setData({
          monthlyClients,
          servicePreferences,
          topClients,
          ageGroups,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching client analytics:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar analytics de clientes',
        }));
      }
    };

    fetchAnalytics();
  }, [organization?.id]);

  return data;
};