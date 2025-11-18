
import { useAuth } from "@/contexts/AuthContext";
import UserManagement from "@/components/UserManagement";
import OrganizationSetup from "@/components/OrganizationSetup";
import { AccessDenied } from "@/components/AccessDenied";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { Building2, User2 } from "lucide-react";

const Usuarios = () => {
  const isMobile = useIsMobile();
  const { 
    user,
    organization,
    canManageUsers,
    loading: authLoading
  } = useAuth();

  // Primeiro, verificar se está carregando
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, será redirecionado automaticamente pelo AuthContext
  if (!user) {
    return null;
  }

  // Verificar permissões
  if (!canManageUsers()) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Gerenciar Colaboradores</h1>
        </div>
        
        <AccessDenied module="users" />
      </div>
    );
  }

  // Se não há organização, mostrar setup
  if (!organization) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Gerenciar Colaboradores</h1>
        </div>
        <OrganizationSetup />
      </div>
    );
  }

  // Mostrar o componente unificado de gerenciamento de colaboradores
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Colaboradores" icon={User2} />}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Gerenciar Colaboradores</h1>
      </div>
      <UserManagement />
    </div>
  );
};

export default Usuarios;
