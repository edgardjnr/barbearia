
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, Plus, X } from "lucide-react";
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

interface UnifiedMemberServiceDialogProps {
  member: Member;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function UnifiedMemberServiceDialog({ 
  member, 
  dialogOpen: externalDialogOpen, 
  onDialogOpenChange: externalOnDialogOpenChange 
}: UnifiedMemberServiceDialogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [memberServices, setMemberServices] = useState<MemberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const { organization } = useAuth();
  const { toast } = useToast();

  // Use external dialog state if provided, otherwise use internal state
  const dialogOpen = externalDialogOpen !== undefined ? externalDialogOpen : internalDialogOpen;
  const setDialogOpen = externalOnDialogOpenChange || setInternalDialogOpen;

  useEffect(() => {
    fetchData();
  }, [organization]);

  // Load selected services when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      const currentServices = memberServices.map(ms => ms.service_id);
      setSelectedServiceIds(currentServices);
    }
  }, [dialogOpen, memberServices]);

  const fetchData = async () => {
    if (!organization?.id) return;

    try {
      // Buscar serviços da organização
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      // Buscar serviços do membro
      const { data: memberServicesData, error: memberServicesError } = await supabase
        .from('member_services')
        .select('id, member_id, service_id')
        .eq('organization_id', organization.id)
        .eq('member_id', member.id);

      if (memberServicesError) throw memberServicesError;

      // Combinar dados de member_services com services
      const memberServicesWithServices = memberServicesData?.map(ms => {
        const service = servicesData?.find(s => s.id === ms.service_id);
        return {
          ...ms,
          services: service || { id: '', name: '', duration_minutes: 0, is_active: false }
        };
      }) || [];

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

  const handleOpenServiceDialog = () => {
    const currentServices = memberServices.map(ms => ms.service_id);
    setSelectedServiceIds(currentServices);
    setDialogOpen(true);
  };

  const handleSaveServices = async () => {
    if (!organization?.id) return;

    try {
      const currentServices = memberServices.map(ms => ms.service_id);
      const servicesToAdd = selectedServiceIds.filter(id => !currentServices.includes(id));
      const servicesToRemove = currentServices.filter(id => !selectedServiceIds.includes(id));

      // Remover serviços desmarcados
      if (servicesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('member_services')
          .delete()
          .eq('organization_id', organization.id)
          .eq('member_id', member.id)
          .in('service_id', servicesToRemove);

        if (removeError) throw removeError;
      }

      // Adicionar novos serviços
      if (servicesToAdd.length > 0) {
        const servicesToInsert = servicesToAdd.map(serviceId => ({
          organization_id: organization.id,
          member_id: member.id,
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

  const removeServiceFromMember = async (serviceId: string) => {
    if (!organization?.id) return;

    try {
      const { error } = await supabase
        .from('member_services')
        .delete()
        .eq('organization_id', organization.id)
        .eq('member_id', member.id)
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
    return <div className="text-sm text-muted-foreground">Carregando serviços...</div>;
  }

  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Gerenciar Serviços - {member.profiles?.display_name}
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
    </div>
  );
}
