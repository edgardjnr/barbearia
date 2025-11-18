import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  price?: number;
  duration_minutes: number;
}

interface Member {
  id: string;
  profiles: {
    display_name: string;
  };
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  selectedDate: Date;
}

export const CreateAppointmentDialog = ({
  open,
  onOpenChange,
  onSuccess,
  selectedDate,
}: CreateAppointmentDialogProps) => {
  const { organization } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Form state
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  
  // New client form state
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    phone: "",
    email: "",
    birth_date: "",
  });
  const [creatingClient, setCreatingClient] = useState(false);
  
  // Options data
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Load data when dialog opens
  useEffect(() => {
    if (open && organization) {
      loadData();
    }
  }, [open, organization]);

  // Update duration when service changes
  useEffect(() => {
    if (serviceId) {
      const selectedService = services.find(s => s.id === serviceId);
      if (selectedService) {
        console.log('🗓️ [CREATE] Serviço selecionado:', selectedService);
        console.log('🗓️ [CREATE] Definindo duração para:', selectedService.duration_minutes, 'minutos');
        setDurationMinutes(selectedService.duration_minutes);
      }
    }
  }, [serviceId, services]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setClientId("");
    setServiceId("");
    setMemberId("");
    setScheduledTime("");
    setDurationMinutes(30);
    setNotes("");
    setShowNewClientForm(false);
    setNewClientData({ name: "", phone: "", email: "", birth_date: "" });
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Load clients, services, and members in parallel
      const [clientsResponse, servicesResponse, membersResponse] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, phone, email')
          .eq('organization_id', organization!.id)
          .order('name'),
        
        supabase
          .from('services')
          .select('id, name, price, duration_minutes')
          .eq('organization_id', organization!.id)
          .eq('is_active', true)
          .order('name'),
        
        supabase
          .from('organization_members')
          .select(`
            id,
            profiles (display_name)
          `)
          .eq('organization_id', organization!.id)
          .eq('status', 'active')
          .order('profiles(display_name)')
      ]);

      if (clientsResponse.error) {
        console.error('Error loading clients:', clientsResponse.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes.",
          variant: "destructive",
        });
      } else {
        setClients(clientsResponse.data || []);
      }

      if (servicesResponse.error) {
        console.error('Error loading services:', servicesResponse.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar serviços.",
          variant: "destructive",
        });
      } else {
        setServices(servicesResponse.data || []);
      }

      if (membersResponse.error) {
        console.error('Error loading members:', membersResponse.error);
        toast({
          title: "Erro",
          description: "Erro ao carregar profissionais.",
          variant: "destructive",
        });
      } else {
        setMembers(membersResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!newClientData.phone.trim() && !newClientData.email.trim()) {
      toast({
        title: "Erro",
        description: "Telefone ou email é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setCreatingClient(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          organization_id: organization!.id,
          name: newClientData.name.trim(),
          phone: newClientData.phone.trim() || null,
          email: newClientData.email.trim() || null,
          birth_date: newClientData.birth_date || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar cliente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cliente criado com sucesso!",
        });
        
        // Add new client to the list and select it
        const newClient = data as Client;
        setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
        setClientId(newClient.id);
        
        // Hide new client form
        setShowNewClientForm(false);
        setNewClientData({ name: "", phone: "", email: "", birth_date: "" });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar cliente.",
        variant: "destructive",
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !serviceId || !scheduledTime) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        organization_id: organization!.id,
        client_id: clientId,
        service_id: serviceId,
        member_id: memberId || null,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        status: 'pending' as const,
        notes: notes || null,
      };

      console.log('🗓️ [CREATE] Enviando dados do agendamento:', appointmentData);

      // Use the edge function to create appointment with conflict validation
      const { data, error } = await supabase.functions.invoke('create-appointment', {
        body: appointmentData
      });

      if (error) {
        console.error('Error from create-appointment function:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar agendamento.",
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        // Handle conflict errors specifically
        if (data.conflict_type) {
          toast({
            title: "Conflito de Horário",
            description: data.error || "Este horário já está ocupado.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: data.error || "Erro ao criar agendamento.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Criar agendamento para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">Cliente *</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                >
                  {showNewClientForm ? 'Cancelar' : 'Cadastrar novo'}
                </Button>
              </div>
              
              {showNewClientForm ? (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="newClientName">Nome do Cliente *</Label>
                    <Input
                      id="newClientName"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newClientPhone">Telefone</Label>
                    <Input
                      id="newClientPhone"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newClientEmail">Email</Label>
                    <Input
                      id="newClientEmail"
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newClientBirthDate">Data de Nascimento</Label>
                    <Input
                      id="newClientBirthDate"
                      type="date"
                      value={newClientData.birth_date}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewClientForm(false);
                        setNewClientData({ name: "", phone: "", email: "", birth_date: "" });
                      }}
                      disabled={creatingClient}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateClient}
                      disabled={creatingClient}
                    >
                      {creatingClient && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar Cliente
                    </Button>
                  </div>
                </div>
              ) : (
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.phone && ` - ${client.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member">Profissional</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um profissional (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.profiles.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o agendamento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Agendamento
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};