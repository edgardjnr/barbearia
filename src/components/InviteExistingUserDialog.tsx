import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Users } from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";

interface InviteExistingUserDialogProps {
  trigger?: React.ReactNode;
}

export const InviteExistingUserDialog = ({ trigger }: InviteExistingUserDialogProps) => {
  const { organization, userRole } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("employee");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !email.trim()) return;

    setLoading(true);
    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim())
        .single();

      if (profileError || !profile) {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar um usuário com este email. O usuário precisa estar cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already a member of this organization
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', organization.id)
        .eq('user_id', profile.user_id)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }

      if (existingMember) {
        if (existingMember.status === 'active') {
          toast({
            title: "Usuário já é membro",
            description: "Este usuário já é membro desta organização.",
            variant: "destructive",
          });
          return;
        } else {
          // Reactivate inactive member
          const { error: updateError } = await supabase
            .from('organization_members')
            .update({ status: 'active', role, updated_at: new Date().toISOString() })
            .eq('id', existingMember.id);

          if (updateError) throw updateError;

          toast({
            title: "Usuário reativado",
            description: "O usuário foi reativado na organização com sucesso.",
          });
        }
      } else {
        // Add user to organization
        const { error: insertError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: profile.user_id,
            role,
            status: 'active'
          });

        if (insertError) throw insertError;

        toast({
          title: "Usuário adicionado",
          description: "O usuário foi adicionado à organização com sucesso.",
        });
      }

      // Reset form
      setEmail("");
      setRole("employee");
      setOpen(false);

      // Refresh page to show updated members
      window.location.reload();

    } catch (error) {
      console.error('Error adding user to organization:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar usuário à organização.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canInvite = userRole === 'owner' || userRole === 'admin';

  if (!canInvite) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Adicionar usuário existente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Adicionar Usuário Existente
          </DialogTitle>
          <DialogDescription>
            Adicione um usuário que já está cadastrado no sistema à sua organização.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do usuário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              O usuário deve já estar cadastrado no sistema
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                {userRole === 'owner' && (
                  <SelectItem value="admin">Administrador</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1"
            >
              {loading ? "Adicionando..." : "Adicionar usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};