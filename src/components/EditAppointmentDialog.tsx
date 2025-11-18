import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes?: string;
  price?: number;
  client_id: string;
  service_id?: string;
  member_id?: string;
  clients?: {
    name: string;
  };
  services?: {
    name: string;
    price?: number;
  };
  organization_members?: {
    profiles: {
      display_name: string;
    };
  };
}

interface Member {
  id: string;
  profiles: {
    display_name: string;
  };
}

interface EditAppointmentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditAppointmentDialog = ({ 
  appointment, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditAppointmentDialogProps) => {
  const [formData, setFormData] = useState({
    scheduled_time: '',
    duration_minutes: 30,
    notes: '',
    price: '',
    member_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const { organization } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (appointment) {
      setFormData({
        scheduled_time: appointment.scheduled_time,
        duration_minutes: appointment.duration_minutes,
        notes: appointment.notes || '',
        price: appointment.price ? appointment.price.toString() : '',
        member_id: appointment.member_id || ""
      });
    }
  }, [appointment]);

  useEffect(() => {
    if (organization) {
      loadMembers();
    }
  }, [organization]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          profiles (display_name)
        `)
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .neq('role', 'owner');

      if (error) {
        console.error('Error loading members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Unexpected error loading members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !organization) return;

    setLoading(true);
    try {
      const updateData: any = {
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || null,
        member_id: formData.member_id || null,
      };

      // Only update price if it's provided
      if (formData.price) {
        updateData.price = parseFloat(formData.price);
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Error updating appointment:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar agendamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso!",
        variant: "success",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Cliente: {appointment.clients?.name}
            <br />
            Serviço: {appointment.services?.name}
            {appointment.organization_members?.profiles?.display_name && (
              <>
                <br />
                Profissional: {appointment.organization_members.profiles.display_name}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_time">Horário</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration_minutes">Duração (min)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                max="480"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="member_id">Profissional</Label>
            <Select
              value={formData.member_id || "unassigned"}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                member_id: value === "unassigned" ? "" : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Não atribuído</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.profiles?.display_name || 'Nome não disponível'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Valor (R$)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações do agendamento..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};