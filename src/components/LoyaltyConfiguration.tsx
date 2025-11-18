import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Plus, Edit2, Trash2, Gift, Package, Percent, Star } from "lucide-react";

interface LoyaltySettings {
  id: string;
  points_per_real: number;
  points_per_visit: number;
  is_active: boolean;
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

const rewardTypeOptions = [
  { value: 'product', label: 'Produto', icon: Package },
  { value: 'service', label: 'Serviço', icon: Star },
  { value: 'discount', label: 'Desconto', icon: Percent },
  { value: 'freebie', label: 'Brinde', icon: Gift },
];

export const LoyaltyConfiguration = () => {
  const { organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<LoyaltyReward> | null>(null);

  // Buscar configurações
  const { data: settings, isLoading: loadingSettings } = useQuery({
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

  // Buscar recompensas
  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['loyalty-rewards', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('organization_id', organization.id)
        .order('points_cost', { ascending: true });
        
      if (error) throw error;
      return data as LoyaltyReward[];
    },
    enabled: !!organization?.id
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<LoyaltySettings>) => {
      if (!organization?.id) throw new Error('Missing organization');
      
      if (settings?.id) {
        // Atualizar configurações existentes
        const { error } = await supabase
          .from('loyalty_settings')
          .update(newSettings)
          .eq('id', settings.id);
          
        if (error) throw error;
      } else {
        // Criar novas configurações
        const { error } = await supabase
          .from('loyalty_settings')
          .insert({
            ...newSettings,
            organization_id: organization.id,
            is_active: true
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      toast({ title: "Configurações salvas com sucesso!", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para recompensas
  const rewardMutation = useMutation({
    mutationFn: async ({ action, reward }: { action: 'create' | 'update' | 'delete', reward: Partial<LoyaltyReward> }) => {
      if (!organization?.id) throw new Error('Missing organization');
      
      if (action === 'create') {
        const insertData = {
          name: reward.name!,
          description: reward.description,
          points_cost: reward.points_cost!,
          reward_type: reward.reward_type!,
          is_active: reward.is_active ?? true,
          image_url: reward.image_url,
          terms_conditions: reward.terms_conditions,
          max_redemptions: reward.max_redemptions,
          organization_id: organization.id,
        };
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert(insertData);
        if (error) throw error;
      } else if (action === 'update' && reward.id) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(reward)
          .eq('id', reward.id);
        if (error) throw error;
      } else if (action === 'delete' && reward.id) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .delete()
          .eq('id', reward.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      setIsEditingReward(false);
      setEditingReward(null);
      toast({ title: "Recompensa atualizada com sucesso!", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar recompensa",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const pointsPerReal = parseFloat(formData.get('points_per_real') as string);
    const pointsPerVisit = parseInt(formData.get('points_per_visit') as string);
    
    updateSettingsMutation.mutate({
      points_per_real: pointsPerReal,
      points_per_visit: pointsPerVisit
    });
  };

  const getRewardTypeIcon = (type: string) => {
    const typeOption = rewardTypeOptions.find(opt => opt.value === type);
    return typeOption ? typeOption.icon : Gift;
  };

  const getRewardTypeLabel = (type: string) => {
    const typeOption = rewardTypeOptions.find(opt => opt.value === type);
    return typeOption ? typeOption.label : type;
  };

  if (loadingSettings || loadingRewards) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Configuração do Sistema de Fidelidade</h2>
      </div>

      <Tabs defaultValue="pontuacao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pontuacao">Pontuação</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
        </TabsList>

        <TabsContent value="pontuacao">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Pontuação</CardTitle>
              <CardDescription>
                Defina como os clientes ganham pontos de fidelidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="points_per_real">Pontos por Real Gasto</Label>
                    <Input
                      id="points_per_real"
                      name="points_per_real"
                      type="number"
                      step="0.1"
                      min="0"
                      defaultValue={settings?.points_per_real || 0.1}
                      placeholder="0.1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 0.1 = 1 ponto a cada R$ 10 gastos
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="points_per_visit">Pontos por Visita</Label>
                    <Input
                      id="points_per_visit"
                      name="points_per_visit"
                      type="number"
                      min="0"
                      defaultValue={settings?.points_per_visit || 10}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pontos fixos dados a cada visita
                    </p>
                  </div>
                </div>
                
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recompensas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recompensas e Benefícios</CardTitle>
                <CardDescription>
                  Configure os produtos, serviços e benefícios que os clientes podem resgatar
                </CardDescription>
              </div>
              
              <Dialog open={isEditingReward} onOpenChange={setIsEditingReward}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingReward({})}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Recompensa
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingReward?.id ? 'Editar' : 'Nova'} Recompensa
                    </DialogTitle>
                    <DialogDescription>
                      Configure os detalhes da recompensa de fidelidade
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const rewardData = {
                      id: editingReward?.id,
                      name: formData.get('name') as string,
                      description: formData.get('description') as string || null,
                      points_cost: parseInt(formData.get('points_cost') as string),
                      reward_type: formData.get('reward_type') as string,
                      is_active: (formData.get('is_active') as string) === 'true',
                      image_url: formData.get('image_url') as string || null,
                      terms_conditions: formData.get('terms_conditions') as string || null,
                      max_redemptions: formData.get('max_redemptions') ? parseInt(formData.get('max_redemptions') as string) : null,
                    };
                    
                    rewardMutation.mutate({
                      action: editingReward?.id ? 'update' : 'create',
                      reward: rewardData
                    });
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome da Recompensa</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingReward?.name || ''}
                        placeholder="Ex: Desconto de 10%"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={editingReward?.description || ''}
                        placeholder="Descreva a recompensa..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="points_cost">Custo em Pontos</Label>
                        <Input
                          id="points_cost"
                          name="points_cost"
                          type="number"
                          min="1"
                          defaultValue={editingReward?.points_cost || 50}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reward_type">Tipo</Label>
                        <Select name="reward_type" defaultValue={editingReward?.reward_type || 'product'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rewardTypeOptions.map(option => {
                              const IconComponent = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="max_redemptions">Limite de Resgates (opcional)</Label>
                      <Input
                        id="max_redemptions"
                        name="max_redemptions"
                        type="number"
                        min="1"
                        defaultValue={editingReward?.max_redemptions || ''}
                        placeholder="Deixe vazio para ilimitado"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="terms_conditions">Termos e Condições (opcional)</Label>
                      <Textarea
                        id="terms_conditions"
                        name="terms_conditions"
                        defaultValue={editingReward?.terms_conditions || ''}
                        placeholder="Regras e condições para uso..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        value="true"
                        defaultChecked={editingReward?.is_active ?? true}
                        className="rounded"
                      />
                      <Label htmlFor="is_active">Recompensa ativa</Label>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={rewardMutation.isPending}>
                        {rewardMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {rewards?.map((reward) => {
                  const IconComponent = getRewardTypeIcon(reward.reward_type);
                  const isLimited = reward.max_redemptions !== null;
                  const remaining = isLimited ? (reward.max_redemptions! - reward.current_redemptions) : null;
                  
                  return (
                    <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{reward.name}</h4>
                            <Badge variant="secondary">
                              {reward.points_cost} pontos
                            </Badge>
                            <Badge variant="outline">
                              {getRewardTypeLabel(reward.reward_type)}
                            </Badge>
                            {!reward.is_active && (
                              <Badge variant="destructive">Inativa</Badge>
                            )}
                          </div>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reward.description}
                            </p>
                          )}
                          {isLimited && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {remaining} resgates restantes de {reward.max_redemptions}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingReward(reward);
                            setIsEditingReward(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
                              rewardMutation.mutate({ action: 'delete', reward });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {!rewards?.length && (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nenhuma recompensa configurada ainda.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};