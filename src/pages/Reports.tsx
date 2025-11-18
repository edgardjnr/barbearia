import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  UserPlus
} from "lucide-react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useFilteredReports } from "@/hooks/useFilteredReports";
import ClientAnalytics from "@/components/ClientAnalytics";
import FinancialReport from "@/components/FinancialReport";
import ReportsFilters, { ReportFilters } from "@/components/ReportsFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Reports = () => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: null,
    endDate: null,
    selectedEmployee: null,
    selectedClient: null
  });
  
  const weeklyData = useWeeklySummary();
  const dashboardStats = useDashboardStats();
  const filteredData = useFilteredReports(filters);

  // Determinar qual dados usar baseado nos filtros ativos
  const hasActiveFilters = filters.startDate || filters.endDate || 
    (filters.selectedEmployee && filters.selectedEmployee !== "all") ||
    (filters.selectedClient && filters.selectedClient !== "all");
  
  const displayData = hasActiveFilters ? filteredData : weeklyData;

  const handleFiltersChange = useCallback((newFilters: ReportFilters) => {
    setFilters(newFilters);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Relatórios" icon={BarChart3} />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu negócio com dados em tempo real
          </p>
        </div>
        <Badge variant="secondary" className="text-sm text-center leading-tight py-2">
          <div className="flex flex-col items-center">
            <div>{format(new Date(), "dd")}</div>
            <div>{format(new Date(), "MMMM", { locale: ptBR })}</div>
            <div>{format(new Date(), "yyyy")}</div>
          </div>
        </Badge>
      </div>

      {/* Filtros */}
      <ReportsFilters onFiltersChange={handleFiltersChange} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Resumo Semanal */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumo da Semana
              {(filters.startDate || filters.endDate) && (
                <Badge variant="outline" className="ml-2">
                  Período personalizado
                </Badge>
              )}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Agendamentos
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayData.loading ? "..." : displayData.appointments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? "Período filtrado" : "Últimos 7 dias"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayData.loading ? "..." : formatCurrency(displayData.revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? "Período filtrado" : "Últimos 7 dias"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Novos Clientes
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {displayData.loading ? "..." : displayData.newClients}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? "Período filtrado" : "Últimos 7 dias"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Estatísticas do Dashboard */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Indicadores do Mês
              {filters.selectedEmployee && filters.selectedEmployee !== "all" && (
                <Badge variant="outline" className="ml-2">
                  Colaborador específico
                </Badge>
              )}
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Agendamentos Hoje
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats.loading ? "..." : dashboardStats.appointmentsToday}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receita Mensal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats.loading ? "..." : formatCurrency(dashboardStats.monthlyRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Clientes Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats.loading ? "..." : dashboardStats.activeClients}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Ocupação
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats.loading ? "..." : `${dashboardStats.occupancyRate}%`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Analytics de Clientes
              {filters.selectedClient && filters.selectedClient !== "all" && (
                <Badge variant="outline" className="ml-2">
                  Cliente específico
                </Badge>
              )}
            </h2>
            <ClientAnalytics />
          </div>
        </TabsContent>


        <TabsContent value="financial" className="space-y-6">
          <FinancialReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;