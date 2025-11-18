import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, MapPin, Gift, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ClientLoyaltyData {
  organization_id: string;
  organization_name: string;
  current_points: number;
  lifetime_points: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  is_active: boolean;
  current_redemptions: number;
  max_redemptions: number | null;
}

const ClientBookingRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar pontos de fidelidade do cliente em todas as organizações
  const { data: clientLoyaltyData, isLoading } = useQuery({
    queryKey: ['client-loyalty-organizations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      try {
        // Primeira estratégia: buscar pontos de fidelidade com organizações separadamente
        const { data: loyaltyData, error: loyaltyError } = await supabase
          .from('client_loyalty_points')
          .select(`
            organization_id,
            client_id,
            current_points,
            lifetime_points
          `)
          .gt('current_points', 0);

        if (loyaltyError) {
          console.error('Error fetching loyalty data:', loyaltyError);
          return [];
        }

        if (!loyaltyData?.length) return [];

        // Buscar organizações separadamente
        const orgIds = loyaltyData.map(item => item.organization_id);
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        if (orgsError) {
          console.error('Error fetching organizations:', orgsError);
          return [];
        }

        // Combinar os dados
        return loyaltyData.map(item => {
          const org = orgsData?.find(o => o.id === item.organization_id);
          return {
            organization_id: item.organization_id,
            organization_name: org?.name || 'Organização',
            current_points: item.current_points,
            lifetime_points: item.lifetime_points,
          };
        });
      } catch (error) {
        console.error('Error in loyalty query:', error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // Buscar recompensas disponíveis para cada organização
  const { data: availableRewards } = useQuery({
    queryKey: ['client-available-rewards', clientLoyaltyData?.map(org => org.organization_id)],
    queryFn: async () => {
      if (!clientLoyaltyData?.length) return {};

      const orgIds = clientLoyaltyData.map(org => org.organization_id);
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .in('organization_id', orgIds)
        .eq('is_active', true)
        .order('points_cost');

      if (error) {
        console.error('Error fetching rewards:', error);
        return {};
      }

      // Agrupar recompensas por organização
      const rewardsByOrg = data?.reduce((acc, reward) => {
        if (!acc[reward.organization_id]) {
          acc[reward.organization_id] = [];
        }
        acc[reward.organization_id].push(reward);
        return acc;
      }, {} as Record<string, LoyaltyReward[]>) || {};

      return rewardsByOrg;
    },
    enabled: !!clientLoyaltyData?.length,
  });

  // Mutation para resgatar recompensa
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, organizationId, pointsCost }: { 
      rewardId: string; 
      organizationId: string; 
      pointsCost: number; 
    }) => {
      // Primeiro, buscar o client_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user?.email)
        .eq('organization_id', organizationId)
        .single();

      if (clientError || !clientData) {
        throw new Error('Cliente não encontrado');
      }

      // Verificar se o cliente tem pontos suficientes
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('client_loyalty_points')
        .select('current_points')
        .eq('organization_id', organizationId)
        .eq('client_id', clientData.id)
        .single();

      if (loyaltyError || !loyaltyData || loyaltyData.current_points < pointsCost) {
        throw new Error('Pontos insuficientes');
      }

      // Criar o resgate
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          organization_id: organizationId,
          client_id: clientData.id,
          reward_id: rewardId,
          points_spent: pointsCost,
          status: 'pending'
        })
        .select()
        .single();

      if (redemptionError) {
        throw new Error('Erro ao processar resgate');
      }

      // Debitar os pontos
      const { error: debitError } = await supabase
        .from('client_loyalty_points')
        .update({
          current_points: loyaltyData.current_points - pointsCost
        })
        .eq('organization_id', organizationId)
        .eq('client_id', clientData.id);

      if (debitError) {
        throw new Error('Erro ao debitar pontos');
      }

      // Registrar transação
      await supabase
        .from('loyalty_point_transactions')
        .insert({
          organization_id: organizationId,
          client_id: clientData.id,
          transaction_type: 'redeemed',
          points: -pointsCost,
          description: 'Pontos resgatados por recompensa',
          redemption_id: redemptionData.id
        });

      return redemptionData;
    },
    onSuccess: () => {
      toast({
        title: "Resgate realizado!",
        description: "Sua recompensa foi resgatada com sucesso. Entre em contato com o estabelecimento para recebê-la.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['client-loyalty-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['client-available-rewards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no resgate",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Erro no logout",
          description: "Ocorreu um erro ao fazer logout. Tentando novamente...",
          variant: "destructive",
        });
      }
      // Navegar para home independentemente do erro, para garantir que o usuário saia
      navigate("/");
    } catch (error) {
      console.error('Logout exception:', error);
      // Mesmo com erro, navegar para home
      navigate("/");
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return '💰';
      case 'service': return '✨';
      case 'product': return '🎁';
      default: return '🏆';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-text-primary">SalãoTech</span>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              Área do Cliente
            </CardTitle>
            <CardDescription>
              Acesse suas informações de fidelidade ou obtenha link de reserva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="booking" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="booking">Reserva</TabsTrigger>
                <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="booking" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-text-primary">Como obter o link?</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Entre em contato com o estabelecimento onde deseja agendar. 
                        Eles fornecerão um link personalizado para reservas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-text-primary">Formato do link</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        O link terá o formato: salaotec.app/agendamento/nome-do-estabelecimento
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="loyalty" className="space-y-4">
                {isLoading ? (
                  <div className="text-center p-4">
                    <p className="text-text-secondary">Carregando pontos de fidelidade...</p>
                  </div>
                ) : clientLoyaltyData && clientLoyaltyData.length > 0 ? (
                  <div className="space-y-4">
                     {clientLoyaltyData.map((org) => {
                       const orgRewards = availableRewards?.[org.organization_id] || [];

                       return (
                         <Card key={org.organization_id} className="border-l-4 border-l-primary">
                           <CardHeader className="pb-3">
                             <div className="flex items-center justify-between">
                               <CardTitle className="text-lg">{org.organization_name}</CardTitle>
                               <Badge variant="secondary" className="flex items-center gap-1">
                                 <Star className="w-3 h-3" />
                                 {org.current_points} pontos
                               </Badge>
                             </div>
                           </CardHeader>
                           
                           {orgRewards.length > 0 ? (
                             <CardContent className="pt-0">
                               <div className="space-y-2">
                                 <h4 className="font-medium text-sm flex items-center gap-1">
                                   <Gift className="w-4 h-4" />
                                   Recompensas disponíveis:
                                 </h4>
                                 <div className="space-y-2 max-h-64 overflow-y-auto">
                                   {orgRewards.map((reward) => {
                                     const canRedeem = reward.points_cost <= org.current_points && 
                                       (reward.max_redemptions === null || reward.current_redemptions < reward.max_redemptions);
                                     const isAvailable = reward.max_redemptions === null || reward.current_redemptions < reward.max_redemptions;
                                     
                                     return (
                                       <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                         <div className="flex items-center gap-3 flex-1">
                                           <span className="text-lg">{getRewardTypeIcon(reward.reward_type)}</span>
                                           <div className="flex-1">
                                             <p className="text-sm font-medium">{reward.name}</p>
                                             {reward.description && (
                                               <p className="text-xs text-text-secondary">{reward.description}</p>
                                             )}
                                             <p className="text-xs text-primary font-medium">{reward.points_cost} pontos</p>
                                             {!isAvailable && (
                                               <p className="text-xs text-red-500">Esgotado</p>
                                             )}
                                           </div>
                                         </div>
                                         {canRedeem ? (
                                           <Button
                                             size="sm"
                                             onClick={() => redeemRewardMutation.mutate({
                                               rewardId: reward.id,
                                               organizationId: org.organization_id,
                                               pointsCost: reward.points_cost
                                             })}
                                             disabled={redeemRewardMutation.isPending}
                                             className="ml-2"
                                           >
                                             {redeemRewardMutation.isPending ? 'Resgatando...' : 'Resgatar'}
                                           </Button>
                                         ) : (
                                           <Badge variant="outline" className="ml-2 text-xs">
                                             {!isAvailable ? 'Esgotado' : `Faltam ${reward.points_cost - org.current_points} pontos`}
                                           </Badge>
                                         )}
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                             </CardContent>
                           ) : (
                             <CardContent className="pt-0">
                               <div className="text-center p-4 bg-muted/20 rounded-lg">
                                 <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                 <p className="text-sm text-text-secondary">
                                   Nenhuma recompensa disponível neste estabelecimento.
                                 </p>
                               </div>
                             </CardContent>
                           )}
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-text-primary mb-2">Nenhum ponto de fidelidade</h3>
                    <p className="text-sm text-text-secondary">
                      Você ainda não possui pontos em nenhum programa de fidelidade.
                      Faça um agendamento para começar a acumular!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="text-center space-y-3">
              <p className="text-sm text-text-secondary">
                Você está logado como: <strong>{user?.email}</strong>
              </p>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full"
              >
                Fazer Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientBookingRequest;