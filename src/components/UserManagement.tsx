
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  Plus,
  Shield,
  Mail,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  Settings as SettingsIcon,
  Briefcase,
  X,
  Clock,
  Calendar,
  ShieldCheck,
  Edit,
  MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/contexts/AuthContext";
import { CollaboratorSchedule } from "./CollaboratorSchedule";
import { InviteCollaboratorDialog } from "./InviteCollaboratorDialog";
import { UnifiedMemberServiceDialog } from "./UnifiedMemberServiceDialog";
import { MemberScheduleBlocks } from "./MemberScheduleBlocks";
import { MemberPermissions } from "./MemberPermissions";
import { EditCollaboratorDialog } from "./EditCollaboratorDialog";
import { InviteExistingUserDialog } from "./InviteExistingUserDialog";
import { MessagesPermissions } from "./MessagesPermissions";

const UserManagement = () => {
  const { 
    organizationMembers, 
    canManageUsers, 
    updateUserRole, 
    removeUser,
    userRole,
    organization
  } = useAuth();
  const { toast } = useToast();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [blocksDialogOpen, setBlocksDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [serviceDialogOpen, setServiceDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [editDialogOpen, setEditDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [messagesPermissionsDialogOpen, setMessagesPermissionsDialogOpen] = useState<{ [key: string]: boolean }>({});


  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await updateUserRole(userId, newRole);
      
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar permissão.",
          variant: "destructive",
        });
        return { error };
      } else {
        toast({
          title: "Permissão atualizada",
          description: "Permissão do colaborador foi atualizada com sucesso.",
          variant: "success",
        });
        return { error: null };
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar permissão.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userName} da empresa?`)) {
      return;
    }

    try {
      const { error } = await removeUser(userId);
      
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao remover colaborador.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Colaborador removido",
          description: `${userName} foi removido da empresa.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao remover colaborador.",
        variant: "destructive",
      });
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

  const canManageUserRole = (targetRole: UserRole): boolean => {
    if (userRole === 'owner') return true;
    if (userRole === 'admin' && targetRole !== 'owner') return true;
    return false;
  };

  if (!canManageUsers()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciamento de Colaboradores
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Você não tem permissão para gerenciar colaboradores.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-text-primary flex items-center gap-2 text-lg sm:text-xl">
                <Users className="w-5 h-5" />
                Colaboradores e Serviços
              </CardTitle>
              <CardDescription className="text-text-secondary text-sm">
                Gerencie colaboradores, suas permissões e serviços atribuídos
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button className="w-full sm:w-auto" onClick={() => setInviteDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Convidar novo colaborador
              </Button>
              <InviteExistingUserDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            
            {organizationMembers.map((member) => (
              <div
                key={member.id}
                className="border border-border rounded-lg p-4 space-y-4"
              >
                {/* Cabeçalho do colaborador */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback className="text-sm">
                        {member.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary text-base truncate">
                        {member.profiles?.display_name || 'Colaborador sem nome'}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {member.profiles?.email}
                      </p>
                      <p className="text-sm text-text-secondary">
                        Membro desde {new Date(member.joined_at || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                   <div className="flex items-center gap-2">
                     <Badge className={`${getRoleColor(member.role)} text-xs flex-shrink-0`}>
                       <div className="flex items-center gap-1">
                         {getRoleIcon(member.role)}
                         <span>{getRoleName(member.role)}</span>
                       </div>
                     </Badge>
                     
                     {/* Menu dropdown único para todas as ações */}
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                           <MoreVertical className="w-4 h-4" />
                         </Button>
                       </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-56 bg-background border shadow-md z-50">
                           {/* Editar Colaborador */}
                           <DropdownMenuItem 
                             onClick={() => setEditDialogOpen({ ...editDialogOpen, [member.id]: true })}
                             className="text-sm"
                           >
                             <Edit className="w-4 h-4 mr-2" />
                             Editar
                           </DropdownMenuItem>
                           
                           <DropdownMenuSeparator />
                           
                           {/* Ações de Gerenciamento de Agenda */}
                            <DropdownMenuItem 
                              onClick={() => setScheduleDialogOpen({ ...scheduleDialogOpen, [member.id]: true })}
                              className="text-sm"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Gerenciar horários
                            </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => setBlocksDialogOpen({ ...blocksDialogOpen, [member.id]: true })}
                             className="text-sm"
                           >
                             <X className="w-4 h-4 mr-2" />
                             Bloquear agenda
                           </DropdownMenuItem>
                           
                           {/* Gerenciamento de Serviços */}
                           <DropdownMenuItem 
                             onClick={() => setServiceDialogOpen({ ...serviceDialogOpen, [member.id]: true })}
                             className="text-sm"
                           >
                             <Briefcase className="w-4 h-4 mr-2" />
                             Serviços
                           </DropdownMenuItem>
                           
                            {/* Permissões de Mensagens - apenas para owners */}
                            {userRole === 'owner' && member.role !== 'owner' && (
                              <DropdownMenuItem 
                                onClick={() => setMessagesPermissionsDialogOpen({ ...messagesPermissionsDialogOpen, [member.id]: true })}
                                className="text-sm"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Permissões Mensagens
                              </DropdownMenuItem>
                            )}
                            
                            {/* Gerenciamento de Permissões - apenas para owners */}
                            {userRole === 'owner' && member.role !== 'owner' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setPermissionsDialogOpen({ ...permissionsDialogOpen, [member.id]: true })}
                                  className="text-sm"
                                >
                                  <ShieldCheck className="w-4 h-4 mr-2" />
                                  Todas Permissões
                                </DropdownMenuItem>
                              </>
                            )}
                           
                           {/* Ação de remoção - apenas se pode gerenciar o papel */}
                           {canManageUserRole(member.role) && member.role !== 'owner' && (
                             <DropdownMenuItem 
                               onClick={() => handleRemoveUser(
                                 member.user_id, 
                                 member.profiles?.display_name || 'Colaborador'
                               )}
                               className="text-destructive text-sm"
                             >
                               <UserX className="w-4 h-4 mr-2" />
                               Remover da empresa
                             </DropdownMenuItem>
                           )}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                </div>

                {/* Seção de serviços - removido da exibição direta */}
              </div>
            ))}
            
            {organizationMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-text-secondary">Nenhum membro encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <InviteCollaboratorDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />

      {/* Dialogs de horários e bloqueios controlados pelo estado */}
      {organizationMembers.map((member) => (
        <div key={`dialogs-${member.id}`}>
          {/* Dialog de Horários */}
          <CollaboratorSchedule 
            member={member} 
            dialogOpen={scheduleDialogOpen[member.id] || false}
            onDialogOpenChange={(open) => 
              setScheduleDialogOpen({ ...scheduleDialogOpen, [member.id]: open })
            }
          />
          
          {/* Dialog de Bloqueios */}
          {organization && (
            <MemberScheduleBlocks 
              member={member} 
              organizationId={organization.id}
              dialogOpen={blocksDialogOpen[member.id] || false}
              onDialogOpenChange={(open) => 
                setBlocksDialogOpen({ ...blocksDialogOpen, [member.id]: open })
              }
            />
          )}
          
          {/* Dialog de Serviços */}
          <UnifiedMemberServiceDialog 
            member={member}
            dialogOpen={serviceDialogOpen[member.id] || false}
            onDialogOpenChange={(open) => 
              setServiceDialogOpen({ ...serviceDialogOpen, [member.id]: open })
            }
          />
          
          {/* Dialog de Permissões */}
          {organization && userRole === 'owner' && (
            <>
              <MessagesPermissions
                member={member}
                organizationId={organization.id}
                dialogOpen={messagesPermissionsDialogOpen[member.id] || false}
                onDialogOpenChange={(open) => 
                  setMessagesPermissionsDialogOpen({ ...messagesPermissionsDialogOpen, [member.id]: open })
                }
              />
              
              <MemberPermissions
                member={member}
                organizationId={organization.id}
                dialogOpen={permissionsDialogOpen[member.id] || false}
                onDialogOpenChange={(open) => 
                  setPermissionsDialogOpen({ ...permissionsDialogOpen, [member.id]: open })
                }
                onUpdateRole={handleUpdateRole}
              />
            </>
          )}
          
          {/* Dialog de Edição */}
          <EditCollaboratorDialog
            member={member}
            open={editDialogOpen[member.id] || false}
            onOpenChange={(open) => 
              setEditDialogOpen({ ...editDialogOpen, [member.id]: open })
            }
          />
        </div>
      ))}
    </div>
  );
};

export default UserManagement;
