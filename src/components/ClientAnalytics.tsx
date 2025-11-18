import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, Users, Calendar, Crown } from "lucide-react";
import { useClientAnalytics } from "@/hooks/useClientAnalytics";

// Hook para debounce de resize
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para detectar mudanças de tamanho da tela com debounce
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useDebounce(windowSize, 150); // 150ms de debounce
};

const ClientAnalytics = () => {
  const { monthlyClients, servicePreferences, topClients, ageGroups, loading, error } = useClientAnalytics();
  const windowSize = useWindowSize();

  // Memoizar configurações dos gráficos para evitar re-renderizações desnecessárias
  const chartConfig = useMemo(() => ({
    novos: {
      label: "Novos Clientes",
      color: "hsl(var(--primary))",
    },
    retornos: {
      label: "Clientes Retorno", 
      color: "hsl(var(--primary) / 0.6)",
    },
    clientes: {
      label: "Clientes",
      color: "hsl(var(--primary))",
    },
  }), []);

  // Memoizar dados processados para evitar recálculos desnecessários
  const memoizedData = useMemo(() => ({
    monthlyClients,
    servicePreferences,
    topClients,
    ageGroups
  }), [monthlyClients, servicePreferences, topClients, ageGroups]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-text-primary">Análise de Clientes</h3>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Gráfico de Clientes Mensais */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Users className="w-4 h-4" />
              <span>Clientes por Mês</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {loading ? (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : memoizedData.monthlyClients.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={memoizedData.monthlyClients} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="novos" fill="var(--color-novos)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="retornos" fill="var(--color-retornos)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-text-secondary">Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Faixa Etária */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4" />
              <span>Distribuição por Idade</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {loading ? (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : memoizedData.ageGroups.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={memoizedData.ageGroups}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius="60%"
                      fill="#8884d8"
                      dataKey="value"
                      fontSize={10}
                    >
                      {memoizedData.ageGroups.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-text-secondary">Nenhum cliente com data de nascimento</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Serviços Preferidos */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4" />
              <span>Serviços Mais Procurados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {loading ? (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : memoizedData.servicePreferences.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart 
                    data={memoizedData.servicePreferences}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <XAxis 
                      dataKey="service" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      height={40}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />} 
                      labelFormatter={(value) => `Serviço: ${value}`}
                      formatter={(value) => [`${value}`, 'Clientes']}
                    />
                    <Bar 
                      dataKey="clientes" 
                      fill="var(--color-clientes)" 
                      radius={[4, 4, 0, 0]}
                      minPointSize={5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-text-secondary">Nenhum serviço registrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking dos Melhores Clientes */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Crown className="w-4 h-4" />
              <span>Ranking dos Melhores Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {loading ? (
              <div className="space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[250px] overflow-y-auto pr-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-bg-soft rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12 ml-2" />
                  </div>
                ))}
              </div>
            ) : memoizedData.topClients.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[250px] overflow-y-auto pr-1">
                {memoizedData.topClients.slice(0, 6).map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-bg-soft rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full text-xs sm:text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary text-xs sm:text-sm truncate">{client.name}</p>
                        <p className="text-xs text-text-secondary">
                          {client.visitas} visitas
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold text-xs sm:text-sm text-primary">
                        R$ {(client.valor / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-text-secondary">Nenhum cliente com histórico</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientAnalytics;