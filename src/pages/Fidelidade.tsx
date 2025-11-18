import { useAuth } from "@/contexts/AuthContext";
import OrganizationSetup from "@/components/OrganizationSetup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { Gift, TrendingUp, Users, Settings, Package, Percent, Star, Search, Minus, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoyaltyConfiguration } from "@/components/LoyaltyConfiguration";
import { LoyaltyLegend } from "@/components/LoyaltyLegend";

interface ClientLoyalty {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
  lifetimePoints: number;
}

interface LoyaltySettings {
  points_per_real: number;
  points_per_visit: number;
  is_active: boolean;
  bronze_threshold?: number;
  silver_threshold?: number;
  gold_threshold?: number;
  vip_threshold?: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  is_active: boolean;
  image_url: string | null;
  terms_conditions: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
}

interface LoyaltyRedemption {
  id: string;
  client_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
  clients: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  loyalty_rewards: {
    name: string;
    description: string | null;
    reward_type: string;
  };
}

const Fidelidade = () => {
  const { organization } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientLoyalty | null>(null);

  // Buscar configurações de fidelidade
  const { data: loyaltySettings } = useQuery({
    queryKey: ['loyalty-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
        
      if (error) throw error;
      return data as LoyaltySettings | null;
    },
    enabled: !!organization?.id
  });

  // Buscar recompensas configuradas
  const { data: loyaltyRewards } = useQuery({
    queryKey: ['loyalty-rewards', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
        
      if (error) throw error;
      return data as LoyaltyReward[];
    },
    enabled: !!organization?.id
  });

  // Buscar solicitações de resgate
  const { data: loyaltyRedemptions } = useQuery({
    queryKey: ['loyalty-redemptions', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .select(`
          *,
          clients (name, email, phone),
          loyalty_rewards (name, description, reward_type)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: loyaltyData, isLoading } = useQuery({
    queryKey: ['client-loyalty', organization?.id, selectedPeriod],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Buscar pontos de fidelidade reais da tabela client_loyalty_points
      const { data: loyaltyPoints, error: loyaltyError } = await supabase
        .from('client_loyalty_points')
        .select(`
          client_id,
          current_points,
          lifetime_points
        `)
        .eq('organization_id', organization.id)
        .order('current_points', { ascending: false });

      console.log('Pontos de fidelidade:', loyaltyPoints);
      console.log('Erro pontos:', loyaltyError);

      if (loyaltyError) {
        console.error('Erro ao buscar pontos:', loyaltyError);
        return [];
      }

      if (!loyaltyPoints || loyaltyPoints.length === 0) {
        console.log('Nenhum ponto de fidelidade encontrado');
        return [];
      }

      // Buscar dados dos clientes separadamente
      const clientIds = loyaltyPoints.map(lp => lp.client_id);
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .in('id', clientIds);

      console.log('Clientes encontrados:', clients);
      console.log('Erro clientes:', clientsError);

      if (clientsError || !clients) {
        console.error('Erro ao buscar clientes:', clientsError);
        return [];
      }
      const { data: serviceHistory } = await supabase
        .from('service_history')
        .select('client_id, price, performed_at')
        .eq('organization_id', organization.id)
        .order('performed_at', { ascending: false });

      // Criar mapa de estatísticas por cliente
      const clientStats = new Map<string, { totalVisits: number; totalSpent: number; lastVisit: string }>();
      
      serviceHistory?.forEach((service: any) => {
        const clientId = service.client_id;
        const existing = clientStats.get(clientId);

        if (existing) {
          existing.totalVisits += 1;
          existing.totalSpent += Number(service.price || 0);
          if (new Date(service.performed_at) > new Date(existing.lastVisit)) {
            existing.lastVisit = service.performed_at;
          }
        } else {
          clientStats.set(clientId, {
            totalVisits: 1,
            totalSpent: Number(service.price || 0),
            lastVisit: service.performed_at
          });
        }
      });

      // Combinar dados de pontos com estatísticas
      const clientsMap = new Map(clients.map(c => [c.id, c]));
      
      const clientsWithLoyalty: ClientLoyalty[] = loyaltyPoints.map((loyaltyData: any) => {
        const client = clientsMap.get(loyaltyData.client_id);
        if (!client) {
          console.warn(`Cliente não encontrado: ${loyaltyData.client_id}`);
          return null;
        }

        const stats = clientStats.get(loyaltyData.client_id) || {
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: new Date().toISOString()
        };

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalVisits: stats.totalVisits,
          totalSpent: stats.totalSpent,
          lastVisit: stats.lastVisit,
          loyaltyPoints: loyaltyData.current_points, // Pontos atuais
          lifetimePoints: loyaltyData.lifetime_points // Pontos totais (para ranking)
        };
      }).filter(Boolean) as ClientLoyalty[];

      console.log('Clientes finais com fidelidade:', clientsWithLoyalty);

      return clientsWithLoyalty.sort((a, b) => b.lifetimePoints - a.lifetimePoints);
    },
    enabled: !!organization?.id
  });

  const getRewardTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      product: Package,
      service: Star,
      discount: Percent,
      freebie: Gift,
    };
    return iconMap[type] || Gift;
  };

  const getRewardTypeLabel = (type: string) => {
    const labelMap: { [key: string]: string } = {
      product: 'Produto',
      service: 'Serviço',
      discount: 'Desconto',
      freebie: 'Brinde',
    };
    return labelMap[type] || type;
  };

  const totalClients = loyaltyData?.length || 0;
  const totalPoints = loyaltyData?.reduce((sum, client) => sum + client.loyaltyPoints, 0) || 0;
  const avgVisits = totalClients > 0 ? (loyaltyData?.reduce((sum, client) => sum + client.totalVisits, 0) || 0) / totalClients : 0;
  
  // Filtrar clientes pela busca
  const filteredLoyaltyData = loyaltyData?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  if (showConfiguration) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-primary">Configuração do Sistema de Fidelidade</h1>
          <Button 
            variant="outline" 
            onClick={() => setShowConfiguration(false)}
          >
            Voltar ao Dashboard
          </Button>
        </div>
        <LoyaltyConfiguration />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Fidelidade" icon={Gift} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Programa de Fidelidade</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowConfiguration(true)}
            className="w-full sm:w-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Configurar</span>
            <span className="sm:hidden">Configurações</span>
          </Button>
          <div className="flex gap-2">
            <Button 
              variant={selectedPeriod === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedPeriod('all')}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Todos os tempos</span>
              <span className="sm:hidden">Todos</span>
            </Button>
            <Button 
              variant={selectedPeriod === '30' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedPeriod('30')}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Últimos 30 dias</span>
              <span className="sm:hidden">30 dias</span>
            </Button>
          </div>
        </div>
      </div>

      {!organization ? (
        <OrganizationSetup />
      ) : !loyaltySettings || !loyaltyRewards?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Sistema de Fidelidade
            </CardTitle>
            <CardDescription>
              Configure seu sistema de fidelidade personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-text-secondary mb-4">
                Configure primeiro as regras do seu programa de fidelidade e crie recompensas para seus clientes.
              </p>
              <Button onClick={() => setShowConfiguration(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Cards de estatísticas */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{totalClients}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Pontos</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{totalPoints.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Média de Visitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{avgVisits.toFixed(1)}</div>
              </CardContent>
            </Card>
            
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Recompensas</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{loyaltyRewards.length}</div>
                <div className="text-xs text-muted-foreground">
                  {loyaltySettings.points_per_real} pts/R$ • {loyaltySettings.points_per_visit} pts/visita
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legenda dos níveis de fidelidade */}
          <LoyaltyLegend 
            bronzeThreshold={loyaltySettings.bronze_threshold || 0}
            silverThreshold={loyaltySettings.silver_threshold || 100}
            goldThreshold={loyaltySettings.gold_threshold || 200}
            vipThreshold={loyaltySettings.vip_threshold || 500}
          />

          <Tabs defaultValue="ranking" className="w-full">
            <div className="w-full overflow-x-auto">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                <TabsTrigger value="ranking" className="text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">Ranking de Fidelidade</span>
                  <span className="sm:hidden">Ranking</span>
                </TabsTrigger>
                <TabsTrigger value="recompensas" className="text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">Recompensas Disponíveis</span>
                  <span className="sm:hidden">Recompensas</span>
                </TabsTrigger>
                <TabsTrigger value="solicitacoes" className="text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">Solicitações de Resgate</span>
                  <span className="sm:hidden">Solicitações</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="ranking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Clientes Fiéis</CardTitle>
                  <CardDescription>
                    Baseado nas suas configurações: {loyaltySettings.points_per_real} pontos por real gasto + {loyaltySettings.points_per_visit} pontos por visita
                  </CardDescription>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar cliente por nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                   ) : filteredLoyaltyData && filteredLoyaltyData.length > 0 ? (
                     <div className="space-y-3">
                       {filteredLoyaltyData.slice(0, 20).map((client, index) => (
                         <div key={client.id} className="flex flex-col gap-3 p-3 border rounded-lg">
                           <div className="flex items-center gap-3">
                             <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold flex-shrink-0">
                               {index + 1}
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className="font-medium truncate">{client.name}</p>
                               <p className="text-sm text-muted-foreground truncate">
                                 {client.email || client.phone || 'Sem contato'}
                               </p>
                             </div>
                           </div>
                           
                           <div className="flex flex-col gap-3">
                             <div className="grid grid-cols-2 gap-2 text-sm">
                               <div>
                                 <p className="font-medium">{client.loyaltyPoints} pontos</p>
                                 <p className="text-xs text-muted-foreground">Atuais</p>
                               </div>
                               <div>
                                 <p className="font-medium">{client.lifetimePoints} pontos</p>
                                 <p className="text-xs text-muted-foreground">Totais</p>
                               </div>
                               <div>
                                 <p className="font-medium">{client.totalVisits}</p>
                                 <p className="text-xs text-muted-foreground">Visitas</p>
                               </div>
                               <div>
                                 <p className="font-medium">R$ {client.totalSpent.toFixed(2)}</p>
                                 <p className="text-xs text-muted-foreground">Gasto</p>
                               </div>
                             </div>
                             
                             <div className="flex items-center justify-between gap-2">
                               <Badge variant="outline" className="text-xs">
                                 {client.lifetimePoints >= 500 ? '🏆 VIP' : 
                                  client.lifetimePoints >= 200 ? '⭐ Gold' : 
                                  client.lifetimePoints >= 100 ? '🥈 Silver' : '🥉 Bronze'}
                               </Badge>
                               
                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     onClick={() => setSelectedClient(client)}
                                     disabled={client.loyaltyPoints === 0}
                                     className="text-xs"
                                   >
                                     <Minus className="w-3 h-3 mr-1" />
                                     <span className="hidden sm:inline">Resgatar</span>
                                     <span className="sm:hidden">-</span>
                                   </Button>
                                 </DialogTrigger>
                                 <DialogContent className="w-full max-w-md sm:max-w-2xl mx-4 bg-background">
                                   <DialogHeader>
                                     <DialogTitle>Resgatar Pontos</DialogTitle>
                                     <DialogDescription className="break-words">
                                       Cliente: {client.name} - {client.loyaltyPoints} pontos disponíveis
                                     </DialogDescription>
                                   </DialogHeader>
                                   <div className="max-h-96 overflow-y-auto">
                                     <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                       {loyaltyRewards?.map(reward => {
                                         const IconComponent = getRewardTypeIcon(reward.reward_type);
                                         const canRedeem = client.loyaltyPoints >= reward.points_cost;
                                         const isLimited = reward.max_redemptions !== null;
                                         const remaining = isLimited ? (reward.max_redemptions! - reward.current_redemptions) : null;
                                         const isAvailable = !isLimited || remaining! > 0;
                                         
                                         return (
                                           <Card key={reward.id} className={`bg-muted/10 border border-border/30 transition-all duration-200 ${!canRedeem || !isAvailable ? 'opacity-50' : 'cursor-pointer hover:shadow-md hover:bg-muted/20 hover:border-border/60'}`}>
                                             <CardHeader className="text-center pb-2">
                                               <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                                 <IconComponent className="w-6 h-6 text-primary" />
                                               </div>
                                               <CardTitle className="text-base">{reward.name}</CardTitle>
                                               <Badge variant="outline">
                                                 {getRewardTypeLabel(reward.reward_type)}
                                               </Badge>
                                             </CardHeader>
                                             <CardContent className="text-center space-y-3">
                                               <div className="text-xl font-bold text-primary">
                                                 {reward.points_cost} pontos
                                               </div>
                                               
                                               {reward.description && (
                                                 <p className="text-sm text-muted-foreground">
                                                   {reward.description}
                                                 </p>
                                               )}
                                               
                                               {isLimited && (
                                                 <p className="text-xs text-muted-foreground">
                                                   {remaining} disponíveis
                                                 </p>
                                               )}
                                               
                                               <Button 
                                                 className="w-full" 
                                                 size="sm"
                                                 disabled={!canRedeem || !isAvailable}
                                                 onClick={() => {
                                                   // Criar resgate da recompensa
                                                   const redeemReward = async () => {
                                                     try {
                                                       // Verificar pontos novamente
                                                       if (client.loyaltyPoints < reward.points_cost) {
                                                         throw new Error('Pontos insuficientes');
                                                       }

                                                       // Verificar limite de resgates
                                                       if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
                                                         throw new Error('Limite de resgates atingido');
                                                       }

                                                       // Criar resgate
                                                       const { error: redemptionError } = await supabase
                                                         .from('loyalty_redemptions')
                                                         .insert({
                                                           organization_id: organization!.id,
                                                           client_id: client.id,
                                                           reward_id: reward.id,
                                                           points_spent: reward.points_cost,
                                                           status: 'completed'
                                                         });

                                                       if (redemptionError) throw redemptionError;

                                                       // Deduzir pontos do cliente
                                                       const { error: updateError } = await supabase
                                                         .from('client_loyalty_points')
                                                         .update({ 
                                                           current_points: client.loyaltyPoints - reward.points_cost 
                                                         })
                                                         .eq('organization_id', organization!.id)
                                                         .eq('client_id', client.id);

                                                       if (updateError) throw updateError;

                                                       // Registrar transação de pontos
                                                       const { error: transactionError } = await supabase
                                                         .from('loyalty_point_transactions')
                                                         .insert({
                                                           organization_id: organization!.id,
                                                           client_id: client.id,
                                                           transaction_type: 'redeemed',
                                                           points: -reward.points_cost,
                                                           description: `Resgate da recompensa: ${reward.name}`
                                                         });

                                                       if (transactionError) throw transactionError;

                                                       // Atualizar contador de resgates
                                                       const { error: rewardUpdateError } = await supabase
                                                         .from('loyalty_rewards')
                                                         .update({ 
                                                           current_redemptions: reward.current_redemptions + 1 
                                                         })
                                                         .eq('id', reward.id);

                                                       if (rewardUpdateError) throw rewardUpdateError;

                                                        // Invalidar queries e fechar modal
                                                        queryClient.invalidateQueries({ queryKey: ['client-loyalty'] });
                                                        queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
                                                        queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
                                                        setSelectedClient(null);
                                                        toast({ 
                                                          title: "Resgate realizado!", 
                                                          description: `${reward.name} resgatado com sucesso para ${client.name}` 
                                                        });
                                                     } catch (error: any) {
                                                       toast({
                                                         title: "Erro ao resgatar",
                                                         description: error.message,
                                                         variant: "destructive"
                                                       });
                                                     }
                                                   };
                                                   redeemReward();
                                                 }}
                                               >
                                                 {!canRedeem ? 'Pontos insuficientes' : 
                                                  !isAvailable ? 'Indisponível' : 'Resgatar'}
                                               </Button>
                                             </CardContent>
                                           </Card>
                                         );
                                       })}
                                     </div>
                                     
                                     {!loyaltyRewards?.length && (
                                       <div className="text-center py-8">
                                         <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                         <p className="text-muted-foreground">
                                           Nenhuma recompensa configurada ainda.
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                 </DialogContent>
                               </Dialog>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : searchTerm ? (
                    <div className="text-center py-8">
                      <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-text-secondary">
                        Nenhum cliente encontrado para "{searchTerm}".
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-text-secondary">
                        Nenhum cliente com histórico de serviços encontrado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            
            <TabsContent value="recompensas" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loyaltyRewards?.map(reward => {
                  const IconComponent = getRewardTypeIcon(reward.reward_type);
                  const isLimited = reward.max_redemptions !== null;
                  const remaining = isLimited ? (reward.max_redemptions! - reward.current_redemptions) : null;
                  
                  return (
                    <Card key={reward.id}>
                      <CardHeader className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <CardDescription>
                          {getRewardTypeLabel(reward.reward_type)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-2">
                        <div className="text-2xl font-bold text-primary">
                          {reward.points_cost} pontos
                        </div>
                        
                        {reward.description && (
                          <p className="text-sm text-muted-foreground">
                            {reward.description}
                          </p>
                        )}
                        
                        {isLimited && (
                          <p className="text-xs text-muted-foreground">
                            {remaining} disponíveis
                          </p>
                        )}
                        
                        {reward.terms_conditions && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer">Termos e condições</summary>
                            <p className="mt-2 text-left">{reward.terms_conditions}</p>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {!loyaltyRewards?.length && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Nenhuma recompensa disponível ainda.
                    </p>
                    <Button onClick={() => setShowConfiguration(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar Recompensas
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="solicitacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Resgate</CardTitle>
                  <CardDescription>
                    Gerencie as solicitações de resgate de recompensas dos seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loyaltyRedemptions && loyaltyRedemptions.length > 0 ? (
                    <div className="space-y-4">
                      {loyaltyRedemptions.map((redemption: any) => {
                        const IconComponent = getRewardTypeIcon(redemption.loyalty_rewards?.reward_type || 'product');
                        const getStatusIcon = (status: string) => {
                          switch (status) {
                            case 'pending': return Clock;
                            case 'completed': return CheckCircle;
                            case 'cancelled': return XCircle;
                            default: return Clock;
                          }
                        };
                        const getStatusLabel = (status: string) => {
                          switch (status) {
                            case 'pending': return 'Pendente';
                            case 'completed': return 'Concluído';
                            case 'cancelled': return 'Cancelado';
                            default: return status;
                          }
                        };
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'pending': return 'bg-yellow-100 text-yellow-800';
                            case 'completed': return 'bg-green-100 text-green-800';
                            case 'cancelled': return 'bg-red-100 text-red-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };
                        
                        const StatusIcon = getStatusIcon(redemption.status);
                        
                        return (
                          <div key={redemption.id} className="p-3 border rounded-lg space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-6 h-6 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <p className="font-medium truncate">{redemption.loyalty_rewards?.name}</p>
                                    <Badge className={`${getStatusColor(redemption.status)} text-xs w-fit`}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {getStatusLabel(redemption.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    Cliente: {redemption.clients?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {redemption.points_spent} pontos • {new Date(redemption.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  {redemption.loyalty_rewards?.description && (
                                    <p className="text-xs text-muted-foreground break-words">
                                      {redemption.loyalty_rewards.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {redemption.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('loyalty_redemptions')
                                        .update({ 
                                          status: 'completed',
                                          completed_at: new Date().toISOString()
                                        })
                                        .eq('id', redemption.id);
                                      
                                      if (error) throw error;
                                      
                                      queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
                                       toast({
                                         title: "Resgate concluído!",
                                         description: `Resgate de ${redemption.loyalty_rewards?.name} foi marcado como concluído.`,
                                         variant: "default",
                                       });
                                    } catch (error: any) {
                                      toast({
                                        title: "Erro",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="flex-1 sm:flex-none"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Concluir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      // Primeiro, devolver os pontos ao cliente
                                      const { data: currentPoints, error: fetchError } = await supabase
                                        .from('client_loyalty_points')
                                        .select('current_points')
                                        .eq('organization_id', organization!.id)
                                        .eq('client_id', redemption.client_id)
                                        .single();
                                      
                                      if (fetchError) throw fetchError;
                                      
                                      const { error: updateError } = await supabase
                                        .from('client_loyalty_points')
                                        .update({ 
                                          current_points: currentPoints.current_points + redemption.points_spent 
                                        })
                                        .eq('organization_id', organization!.id)
                                        .eq('client_id', redemption.client_id);
                                      
                                      if (updateError) throw updateError;
                                      
                                      // Marcar resgate como cancelado
                                      const { error: cancelError } = await supabase
                                        .from('loyalty_redemptions')
                                        .update({ status: 'cancelled' })
                                        .eq('id', redemption.id);
                                      
                                      if (cancelError) throw cancelError;
                                      
                                      // Registrar transação de devolução de pontos
                                      await supabase
                                        .from('loyalty_point_transactions')
                                        .insert({
                                          organization_id: organization!.id,
                                          client_id: redemption.client_id,
                                          transaction_type: 'refunded',
                                          points: redemption.points_spent,
                                          description: `Devolução por cancelamento: ${redemption.loyalty_rewards?.name}`
                                        });
                                      
                                      // Atualizar contador de resgates da recompensa
                                      const { data: rewardData, error: rewardError } = await supabase
                                        .from('loyalty_rewards')
                                        .select('current_redemptions')
                                        .eq('id', redemption.reward_id)
                                        .single();
                                      
                                      if (!rewardError && rewardData) {
                                        await supabase
                                          .from('loyalty_rewards')
                                          .update({ 
                                            current_redemptions: Math.max(0, rewardData.current_redemptions - 1)
                                          })
                                          .eq('id', redemption.reward_id);
                                      }
                                      
                                      queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
                                      queryClient.invalidateQueries({ queryKey: ['client-loyalty'] });
                                      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
                                      
                                       toast({
                                         title: "Resgate cancelado!",
                                         description: `Resgate cancelado e pontos devolvidos ao cliente.`,
                                         variant: "default",
                                       });
                                    } catch (error: any) {
                                      toast({
                                        title: "Erro",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="flex-1 sm:flex-none"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            )}
                            
                            {redemption.status === 'completed' && redemption.completed_at && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                  Concluído em: {new Date(redemption.completed_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-text-secondary">
                        Nenhuma solicitação de resgate encontrada.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Fidelidade;