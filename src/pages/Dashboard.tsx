import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import ClientAnalytics from "@/components/ClientAnalytics";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRecentAppointments } from "@/hooks/useRecentAppointments";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { 
  Calendar, 
  Users, 
  PlusCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Home
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const stats = useDashboardStats();
  const { appointments, loading: appointmentsLoading } = useRecentAppointments();
  const weeklySummary = useWeeklySummary();
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-6 ${isMobile ? 'px-4' : 'px-0'}`}>
      {isMobile && <MobilePageHeader title="Dashboard" icon={Home} />}
            {/* Quick Actions */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Visão Geral</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    Agendamentos Hoje
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stats.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-text-primary">{stats.appointmentsToday}</div>
                  )}
                  <p className="text-xs text-text-muted">
                    agendamentos confirmados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    Receita do Mês
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stats.loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold text-text-primary">
                      R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    receita do mês atual
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    Clientes Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stats.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-text-primary">{stats.activeClients}</div>
                  )}
                  <p className="text-xs text-text-muted">
                    clientes ativos (30 dias)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    Taxa de Ocupação
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stats.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-text-primary">{stats.occupancyRate}%</div>
                  )}
                  <p className="text-xs text-text-muted">
                    taxa de ocupação estimada
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-text-primary">Próximos Agendamentos</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Seus próximos compromissos de hoje
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appointmentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-bg-soft rounded-lg">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-text-primary">
                            {appointment.scheduled_time} - {appointment.client_name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {appointment.service_name}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-text-secondary">
                        Nenhum agendamento para hoje
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-text-primary">Resumo Semanal</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Performance da última semana
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklySummary.loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Agendamentos</span>
                          <span className="text-sm font-medium text-text-primary">{weeklySummary.appointments}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min((weeklySummary.appointments / 50) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Receita</span>
                          <span className="text-sm font-medium text-text-primary">
                            R$ {weeklySummary.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min((weeklySummary.revenue / 5000) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Novos Clientes</span>
                          <span className="text-sm font-medium text-text-primary">{weeklySummary.newClients}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min((weeklySummary.newClients / 20) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Seção de Análise de Clientes */}
            <ClientAnalytics />
    </div>
  );
};

export default Dashboard;