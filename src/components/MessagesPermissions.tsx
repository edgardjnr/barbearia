import { useState, useEffect } from "react";
import { MessageCircle, Eye, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleName, Operation } from "@/hooks/usePermissions";

interface Permission {
  id: string;
  module: string;
  operation: string;
  granted: boolean;
}

interface MessagesPermissionsProps {
  member: any;
  organizationId: string;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

const operationNames = {
  'read': 'Visualizar Mensagens',
  'create': 'Enviar Mensagens',
  'delete': 'Excluir Mensagens/Conversas'
};

const operationDescriptions = {
  'read': 'Permite visualizar conversas e mensagens do WhatsApp',
  'create': 'Permite enviar mensagens e responder conversas',
  'delete': 'Permite excluir mensagens individuais e conversas completas'
};

const operationIcons = {
  'read': Eye,
  'create': Send,
  'delete': Trash2
};

export function MessagesPermissions({ 
  member, 
  organizationId, 
  dialogOpen = false, 
  onDialogOpenChange 
}: MessagesPermissionsProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const { userRole } = useAuth();

  const fetchPermissions = async () => {
    if (!member?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_permissions')
        .select('*')
        .eq('member_id', member.id)
        .eq('organization_id', organizationId)
        .eq('module', 'messages' as any);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      toast.error('Erro ao carregar permissões de mensagens');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (operation: string, granted: boolean) => {
    try {
      const { error } = await supabase
        .from('member_permissions')
        .upsert({
          organization_id: organizationId,
          member_id: member.id,
          module: 'messages' as ModuleName,
          operation: operation as Operation,
          granted
        }, {
          onConflict: 'organization_id, member_id, module, operation'
        });

      if (error) throw error;

      setPermissions(prev => {
        const existing = prev.find(p => p.operation === operation);
        if (existing) {
          return prev.map(p => 
            p.operation === operation ? { ...p, granted } : p
          );
        } else {
          return [...prev, {
            id: Math.random().toString(),
            module: 'messages',
            operation,
            granted
          }];
        }
      });

      toast.success(`Permissão ${granted ? 'concedida' : 'removida'} com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    }
  };

  useEffect(() => {
    if (dialogOpen) {
      fetchPermissions();
    }
  }, [dialogOpen, member?.id, organizationId]);

  // Não mostrar para owners ou se o usuário atual não é owner
  if (member?.role === 'owner' || userRole !== 'owner') {
    return null;
  }

  const hasPermission = (operation: string) => {
    return permissions.find(p => p.operation === operation)?.granted || false;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Permissões de Mensagens - {member?.profiles?.display_name}
          </DialogTitle>
          <DialogDescription>
            Configure as permissões específicas para o sistema de mensagens WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do colaborador */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Colaborador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {member?.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{member?.profiles?.display_name}</p>
                  <p className="text-sm text-muted-foreground">{member?.profiles?.email}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {member?.role === 'admin' ? 'Administrador' : 
                   member?.role === 'manager' ? 'Gerente' : 
                   'Funcionário'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Permissões de Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Permissões do Sistema de Mensagens
              </CardTitle>
              <CardDescription>
                Configure o que este colaborador pode fazer no sistema de mensagens WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                      </div>
                      <div className="h-5 w-9 bg-muted rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(operationNames).map(([operation, name]) => {
                    const IconComponent = operationIcons[operation as keyof typeof operationIcons];
                    const isGranted = hasPermission(operation);
                    
                    return (
                      <div
                        key={operation}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isGranted 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {operationDescriptions[operation as keyof typeof operationDescriptions]}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isGranted}
                          onCheckedChange={(checked) => updatePermission(operation, checked)}
                          disabled={loading}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo das permissões ativas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo das Permissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(operationNames).map(([operation, name]) => (
                  hasPermission(operation) && (
                    <Badge key={operation} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  )
                ))}
                {permissions.filter(p => p.granted).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma permissão concedida para mensagens
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}