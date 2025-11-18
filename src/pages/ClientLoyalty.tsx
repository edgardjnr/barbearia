import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Package, Percent, Star, CheckCircle, Clock, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientPoints {
  totalPoints: number;
  totalVisits: number;
  totalSpent: number;
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
  reward_id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  completed_at: string | null;
  notes: string | null;
  loyalty_rewards: {
    name: string;
    reward_type: string;
  } | null;
}

const ClientLoyalty = () => {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar pontos do cliente
  const { data: clientPoints, isLoading: loadingPoints, refetch: refetchPoints } = useQuery({
    queryKey: ['client-points', user?.id, organization?.id],
    staleTime: 0, // Sempre buscar dados frescos
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;

      // Buscar cliente
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('email', user.email)
        .maybeSingle();

      if (!client) return null;

      // Buscar pontos de fidelidade do cliente
      const { data: loyaltyPoints } = await supabase
        .from('client_loyalty_points')
        .select('current_points, lifetime_points')
        .eq('organization_id', organization.id)
        .eq('client_id', client.id)
        .maybeSingle();

      // Buscar histórico de serviços para visitas e gastos
      const { data: serviceHistory } = await supabase
        .from('service_history')
        .select('price')
        .eq('client_id', client.id)
        .eq('organization_id', organization.id);

      const totalVisits = serviceHistory?.length || 0;
      const totalSpent = serviceHistory?.reduce((sum, service) => sum + Number(service.price || 0), 0) || 0;
      const totalPoints = loyaltyPoints?.current_points || 0;

      return { totalPoints, totalVisits, totalSpent };
    },
    enabled: !!user?.id && !!organization?.id
  });

  // Buscar recompensas disponíveis
  const { data: availableRewards } = useQuery({
    queryKey: ['available-rewards', organization?.id],
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

  // Buscar histórico de resgates
  const { data: redemptionHistory } = useQuery({
    queryKey: ['redemption-history', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];

      // Buscar cliente
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('email', user.email)
        .maybeSingle();

      if (!client) return [];

      const { data, error } = await supabase
        .from('loyalty_redemptions')
        .select(`
          *,
          loyalty_rewards (
            name,
            reward_type
          )
        `)
        .eq('client_id', client.id)
        .eq('organization_id', organization.id)
        .order('redeemed_at', { ascending: false });
        
      if (error) throw error;
      return data as any;
    },
    enabled: !!user?.id && !!organization?.id
  });

  // Mutation para resgatar recompensa
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user?.id || !organization?.id) throw new Error('Missing user or organization');

      // Buscar cliente
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('email', user.email)
        .maybeSingle();

      if (!client) throw new Error('Cliente não encontrado');

      // Buscar recompensa
      const { data: reward } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('id', rewardId)
        .maybeSingle();

      if (!reward) throw new Error('Recompensa não encontrada');

      // Buscar pontos atuais do cliente
      const { data: loyaltyPoints } = await supabase
        .from('client_loyalty_points')
        .select('current_points')
        .eq('organization_id', organization.id)
        .eq('client_id', client.id)
        .maybeSingle();

      const currentPoints = loyaltyPoints?.current_points || 0;

      // Verificar se tem pontos suficientes
      if (currentPoints < reward.points_cost) {
        throw new Error('Pontos insuficientes');
      }

      // Verificar limite de resgates
      if (reward.max_redemptions && reward.current_redemptions >= reward.max_redemptions) {
        throw new Error('Limite de resgates atingido');
      }

      // Debitar pontos do cliente PRIMEIRO
      const { error: pointsError } = await supabase
        .from('client_loyalty_points')
        .update({ 
          current_points: currentPoints - reward.points_cost 
        })
        .eq('organization_id', organization.id)
        .eq('client_id', client.id);

      if (pointsError) {
        console.error('Erro ao debitar pontos:', pointsError);
        throw new Error('Erro ao debitar pontos do cliente');
      }

      // Criar resgate
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          organization_id: organization.id,
          client_id: client.id,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          status: 'pending'
        })
        .select()
        .single();

      if (redemptionError) {
        console.error('Erro ao criar resgate:', redemptionError);
        // Se falhou ao criar o resgate, reverter os pontos
        await supabase
          .from('client_loyalty_points')
          .update({ 
            current_points: currentPoints 
          })
          .eq('organization_id', organization.id)
          .eq('client_id', client.id);
        throw new Error('Erro ao criar resgate');
      }

      // Atualizar contador de resgates
      const { error: updateError } = await supabase
        .from('loyalty_rewards')
        .update({ 
          current_redemptions: reward.current_redemptions + 1 
        })
        .eq('id', rewardId);

      if (updateError) {
        console.error('Erro ao atualizar contador:', updateError);
        // Não reverter aqui pois o resgate já foi criado
      }

      // Registrar transação de pontos
      const { error: transactionError } = await supabase
        .from('loyalty_point_transactions')
        .insert({
          organization_id: organization.id,
          client_id: client.id,
          transaction_type: 'redeemed',
          points: -reward.points_cost,
          description: `Resgate: ${reward.name}`,
          redemption_id: redemptionData.id
        });

      if (transactionError) {
        console.error('Erro ao registrar transação:', transactionError);
        // Não reverter pois o resgate já foi criado
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-points'] });
      queryClient.invalidateQueries({ queryKey: ['available-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemption-history'] });
      toast({ 
        title: "Resgate realizado!", 
        description: "Sua recompensa foi resgatada com sucesso. Entre em contato com o estabelecimento para recebê-la."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao resgatar",
        description: error.message,
        variant: "destructive"
      });
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!user || !organization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Faça login para ver seus pontos de fidelidade.</p>
      </div>
    );
  }

  if (loadingPoints) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-2">
        <Gift className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Meus Pontos de Fidelidade</h1>
      </div>

      {/* Card de pontos */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Seus Pontos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {clientPoints?.totalPoints || 0}
              </div>
              <p className="text-sm text-muted-foreground">Pontos disponíveis</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {clientPoints?.totalVisits || 0}
              </div>
              <p className="text-sm text-muted-foreground">Visitas realizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recompensas disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Recompensas Disponíveis</CardTitle>
          <CardDescription>
            Troque seus pontos por produtos, serviços e benefícios exclusivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRewards?.map(reward => {
              const IconComponent = getRewardTypeIcon(reward.reward_type);
              const canRedeem = (clientPoints?.totalPoints || 0) >= reward.points_cost;
              const isLimited = reward.max_redemptions !== null;
              const remaining = isLimited ? (reward.max_redemptions! - reward.current_redemptions) : null;
              const isAvailable = !isLimited || remaining! > 0;
              
              return (
                <Card key={reward.id} className={!canRedeem || !isAvailable ? 'opacity-50' : ''}>
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
                      disabled={!canRedeem || !isAvailable || redeemRewardMutation.isPending}
                      onClick={() => redeemRewardMutation.mutate(reward.id)}
                    >
                      {!canRedeem ? 'Pontos insuficientes' : 
                       !isAvailable ? 'Indisponível' : 
                       redeemRewardMutation.isPending ? 'Resgatando...' : 'Resgatar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {!availableRewards?.length && (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma recompensa disponível no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de resgates */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Resgates</CardTitle>
          <CardDescription>
            Acompanhe seus resgates realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {redemptionHistory?.map(redemption => (
              <div key={redemption.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(redemption.status)}
                  <div>
                    <p className="font-medium">{redemption.loyalty_rewards.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(redemption.redeemed_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">-{redemption.points_spent} pontos</p>
                  <Badge variant={
                    redemption.status === 'completed' ? 'default' :
                    redemption.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {getStatusLabel(redemption.status)}
                  </Badge>
                </div>
              </div>
            ))}
            
            {!redemptionHistory?.length && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum resgate realizado ainda.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLoyalty;