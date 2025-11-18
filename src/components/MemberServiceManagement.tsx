import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration_minutes: number;
  is_active: boolean;
}

interface MemberService {
  id: string;
  member_id: string;
  service_id: string;
  services: Service;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    display_name?: string;
    avatar_url?: string;
  };
}

const MemberServiceManagement = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [memberServices, setMemberServices] = useState<MemberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const { organization } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [organization]);

  const fetchData = async () => {
    if (!organization?.id) return;

    try {
      // Buscar membros da organização
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('id, user_id, role')
        .eq('organization_id', organization.id)
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Buscar perfis dos membros
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados dos membros com perfis
      const membersWithProfiles = membersData?.map(member => ({
        ...member,
        profiles: profilesData?.find(p => p.user_id === member.user_id)
      })) || [];

      // Buscar serviços da organização
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      // Buscar relações membro-serviço
      const { data: memberServicesData, error: memberServicesError } = await supabase
        .from('member_services')
        .select('id, member_id, service_id')
        .eq('organization_id', organization.id);

      if (memberServicesError) throw memberServicesError;

      // Combinar dados de member_services com services
      const memberServicesWithServices = memberServicesData?.map(ms => {
        const service = servicesData?.find(s => s.id === ms.service_id);
        return {
          ...ms,
          services: service || { id: '', name: '', duration_minutes: 0, is_active: false }
        };
      }) || [];

      setMembers(membersWithProfiles);
      setServices(servicesData || []);
      setMemberServices(memberServicesWithServices);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMemberServices = (memberId: string): MemberService[] => {
    return memberServices.filter(ms => ms.member_id === memberId);
  };

  const handleOpenServiceDialog = (member: Member) => {
    setSelectedMember(member);
    const currentServices = getMemberServices(member.id).map(ms => ms.service_id);
    setSelectedServiceIds(currentServices);
    setDialogOpen(true);
  };

  const handleSaveServices = async () => {
    if (!selectedMember || !organization?.id) return;

    try {
      const currentServices = getMemberServices(selectedMember.id).map(ms => ms.service_id);
      const servicesToAdd = selectedServiceIds.filter(id => !currentServices.includes(id));
      const servicesToRemove = currentServices.filter(id => !selectedServiceIds.includes(id));

      // Remover serviços desmarcados
      if (servicesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('member_services')
          .delete()
          .eq('organization_id', organization.id)
          .eq('member_id', selectedMember.id)
          .in('service_id', servicesToRemove);

        if (removeError) throw removeError;
      }

      // Adicionar novos serviços
      if (servicesToAdd.length > 0) {
        const servicesToInsert = servicesToAdd.map(serviceId => ({
          organization_id: organization.id,
          member_id: selectedMember.id,
          service_id: serviceId,
        }));

        const { error: insertError } = await supabase
          .from('member_services')
          .insert(servicesToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Serviços do colaborador atualizados com sucesso!",
        variant: "success",
      });

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar serviços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os serviços.",
        variant: "destructive",
      });
    }
  };

  const removeServiceFromMember = async (memberId: string, serviceId: string) => {
    if (!organization?.id) return;

    try {
      const { error } = await supabase
        .from('member_services')
        .delete()
        .eq('organization_id', organization.id)
        .eq('member_id', memberId)
        .eq('service_id', serviceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Serviço removido do colaborador.",
        variant: "success",
      });

      fetchData();
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o serviço.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Serviços por Colaborador
        </CardTitle>
        <CardDescription>
          Gerencie quais serviços cada colaborador pode oferecer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const memberServicesList = getMemberServices(member.id);
            
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profiles?.avatar_url} />
                    <AvatarFallback>
                      {member.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {member.profiles?.display_name || 'Colaborador sem nome'}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {memberServicesList.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Nenhum serviço atribuído
                        </span>
                      ) : (
                        memberServicesList.map((ms) => (
                          <Badge
                            key={ms.id}
                            variant="secondary"
                            className="text-xs flex items-center gap-1"
                          >
                            {ms.services.name}
                            <button
                              onClick={() => removeServiceFromMember(member.id, ms.service_id)}
                              className="hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenServiceDialog(member)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gerenciar Serviços
                </Button>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum colaborador encontrado.
              </p>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Gerenciar Serviços - {selectedMember?.profiles?.display_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServiceIds(prev => [...prev, service.id]);
                        } else {
                          setSelectedServiceIds(prev => prev.filter(id => id !== service.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={service.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.name}
                      </label>
                      {service.description && (
                        <p className="text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {service.price && <span>R$ {service.price.toFixed(2)}</span>}
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {services.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum serviço cadastrado. Cadastre serviços em Configurações primeiro.
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveServices}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MemberServiceManagement;