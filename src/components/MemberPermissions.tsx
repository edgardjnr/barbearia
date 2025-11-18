import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  Users, 
  Crown, 
  Shield, 
  Settings as SettingsIcon, 
  UserCheck,
  Eye,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface MemberPermissionsProps {
  member: {
    id: string;
    user_id: string;
    role: UserRole;
    profiles?: {
      display_name?: string;
    };
  };
  organizationId: string;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  onUpdateRole?: (userId: string, newRole: UserRole) => Promise<{error?: any}>;
}

interface Permission {
  id: string;
  module: string;
  operation: string;
  granted: boolean;
}

const moduleNames = {
  'dashboard': 'Dashboard',
  'agenda': 'Agenda',
  'clients': 'Clientes',
  'services': 'Serviços',
  'reports': 'Relatórios',
  'loyalty': 'Fidelidade',
  'reviews': 'Avaliações',
  'users': 'Usuários',
  'settings': 'Configurações',
  'messages': 'Mensagens'
};

const operationNames = {
  'create': 'Criar',
  'read': 'Visualizar',
  'update': 'Editar',
  'delete': 'Excluir'
};

const operationIcons = {
  'create': Plus,
  'read': Eye,
  'update': Edit,
  'delete': Trash2
};

export function MemberPermissions({ 
  member, 
  organizationId, 
  dialogOpen, 
  onDialogOpenChange,
  onUpdateRole
}: MemberPermissionsProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  // Use external control if provided, otherwise use internal state
  const isOpen = dialogOpen !== undefined ? dialogOpen : internalDialogOpen;
  const setIsOpen = onDialogOpenChange || setInternalDialogOpen;

  const isOwner = userRole === 'owner';

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_permissions')
        .select('*')
        .eq('member_id', member.id)
        .eq('organization_id', organizationId)
        .order('module')
        .order('operation');

      if (error) {
        console.error('Erro ao buscar permissões:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar permissões do colaborador.",
          variant: "destructive",
        });
        return;
      }

      setPermissions(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar permissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (permissionId: string, granted: boolean) => {
    try {
      const { error } = await supabase
        .from('member_permissions')
        .update({ granted })
        .eq('id', permissionId);

      if (error) {
        console.error('Erro ao atualizar permissão:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar permissão.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar estado local
      setPermissions(perms => 
        perms.map(p => p.id === permissionId ? { ...p, granted } : p)
      );

      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso!",
        variant: "success",
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar permissão.",
        variant: "destructive",
      });
    }
  };

  const handleRoleUpdate = async (newRole: UserRole) => {
    if (!onUpdateRole) return;
    
    const result = await onUpdateRole(member.user_id, newRole);
    if (!result.error) {
      // Recarregar permissões após mudança de papel
      fetchPermissions();
    }
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

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'employee':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'manager':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'employee':
        return <UserCheck className="w-3 h-3" />;
      case 'manager':
        return <SettingsIcon className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  // Agrupar permissões por módulo
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen]);

  // Não renderizar para owners ou se o usuário atual não é owner
  if (member.role === 'owner' || !isOwner) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only render trigger if not externally controlled */}
      {dialogOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Permissões
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Permissões - {member.profiles?.display_name || 'Colaborador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Papéis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Papel do Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span>Papel atual:</span>
                <Badge className={`${getRoleColor(member.role)} flex items-center gap-1`}>
                  {getRoleIcon(member.role)}
                  {getRoleName(member.role)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  variant={member.role === 'employee' ? 'default' : 'outline'}
                  onClick={() => handleRoleUpdate('employee')}
                  disabled={member.role === 'employee'}
                  className="justify-start"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Tornar funcionário
                </Button>
                <Button
                  variant={member.role === 'manager' ? 'default' : 'outline'}
                  onClick={() => handleRoleUpdate('manager')}
                  disabled={member.role === 'manager'}
                  className="justify-start"
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Tornar gerente
                </Button>
                <Button
                  variant={member.role === 'admin' ? 'default' : 'outline'}
                  onClick={() => handleRoleUpdate('admin')}
                  disabled={member.role === 'admin'}
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Tornar administrador
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Seção de Permissões Granulares */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Permissões Detalhadas (CRUD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Carregando permissões...</p>
                </div>
              ) : Object.keys(permissionsByModule).length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma permissão encontrada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                    <div key={moduleName} className="space-y-3">
                      <h4 className="font-medium text-sm uppercase text-muted-foreground">
                        {moduleNames[moduleName as keyof typeof moduleNames] || moduleName}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {modulePermissions.map((permission) => {
                          const OperationIcon = operationIcons[permission.operation as keyof typeof operationIcons];
                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <OperationIcon className="h-4 w-4 text-muted-foreground" />
                                <Label 
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {operationNames[permission.operation as keyof typeof operationNames] || permission.operation}
                                </Label>
                              </div>
                              <Switch
                                id={`permission-${permission.id}`}
                                checked={permission.granted}
                                onCheckedChange={(granted) => 
                                  updatePermission(permission.id, granted)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}