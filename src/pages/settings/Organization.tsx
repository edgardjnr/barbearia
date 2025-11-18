import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Building2 } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import OrganizationSetup from "@/components/OrganizationSetup";

const Organization = () => {
  const { user, organization, canManageUsers } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-text-secondary">Acesso negado</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Organização</h1>
          <p className="text-text-secondary">Configure sua empresa</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Criar Organização
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Primeiro você precisa criar sua empresa para começar a usar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSetup />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Organização</h1>
        <p className="text-text-secondary">Gerencie sua empresa e colaboradores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Dados da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-text-primary">Nome da Empresa</h3>
            <p className="text-text-secondary">{organization.name}</p>
          </div>
          {organization.description && (
            <div>
              <h3 className="font-medium text-text-primary">Descrição</h3>
              <p className="text-text-secondary">{organization.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canManageUsers() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">Gerenciamento de Colaboradores</CardTitle>
            <CardDescription className="text-text-secondary">
              Gerencie os colaboradores da sua organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Organization;