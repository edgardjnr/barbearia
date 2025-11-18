import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { UserRole, OrganizationMember } from "@/contexts/AuthContext";

interface EditCollaboratorDialogProps {
  member: OrganizationMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCollaboratorDialog = ({
  member,
  open,
  onOpenChange,
}: EditCollaboratorDialogProps) => {
  const { toast } = useToast();
  const { updateUserRole, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    role: member.role as UserRole,
  });

  useEffect(() => {
    if (open && member) {
      setFormData({
        displayName: member.profiles?.display_name || '',
        phone: member.profiles?.phone || '',
        role: member.role,
      });
    }
  }, [open, member]);

  const handleSave = async () => {
    if (!member?.user_id) return;

    setLoading(true);
    try {
      // Atualizar informações do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          phone: formData.phone,
        })
        .eq('user_id', member.user_id);

      if (profileError) {
        throw profileError;
      }

      // Atualizar role se foi alterado e se tem permissão
      if (formData.role !== member.role && canUpdateRole(member.role)) {
        const { error: roleError } = await updateUserRole(member.user_id, formData.role);
        if (roleError) {
          throw roleError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Colaborador atualizado com sucesso!",
      });

      onOpenChange(false);
      
      // Recarregar dados (poderá ser melhorado com um refresh da lista)
      window.location.reload();
      
    } catch (error: any) {
      console.error('Erro ao atualizar colaborador:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar colaborador",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canUpdateRole = (targetRole: UserRole): boolean => {
    if (userRole === 'owner') return true;
    if (userRole === 'admin' && targetRole !== 'owner') return true;
    return false;
  };

  const getRoleName = (role: UserRole): string => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'employee':
        return 'Funcionário';
      case 'manager':
        return 'Gerente';
      default:
        return role;
    }
  };

  const availableRoles: UserRole[] = 
    userRole === 'owner' 
      ? ['owner', 'admin', 'manager', 'employee']
      : ['admin', 'manager', 'employee'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
          <DialogDescription>
            Edite as informações do colaborador.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Nome para exibição"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              disabled={!canUpdateRole(member.role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};