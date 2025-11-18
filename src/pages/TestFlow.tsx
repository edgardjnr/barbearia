import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Building2, Users, Database } from "lucide-react";

const TestFlow = () => {
  const { 
    user, 
    userProfile, 
    organization, 
    userRole, 
    organizationMembers, 
    loading,
    refreshUserData
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Database className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-text-secondary">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-text-primary">Teste do Fluxo de Autenticação</h1>
          <Button onClick={refreshUserData} variant="outline">
            Atualizar Dados
          </Button>
        </div>

        {/* Status do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Status do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Autenticado:</label>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? "Sim" : "Não"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Email:</label>
                <p className="text-sm text-muted-foreground">{user?.email || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Profile ID:</label>
                <p className="text-sm text-muted-foreground">{userProfile?.id || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Display Name:</label>
                <p className="text-sm text-muted-foreground">{userProfile?.display_name || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status da Organização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Status da Organização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tem Organização:</label>
                <Badge variant={organization ? "default" : "secondary"}>
                  {organization ? "Sim" : "Não"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Nome:</label>
                <p className="text-sm text-muted-foreground">{organization?.name || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Role do Usuário:</label>
                <Badge variant={userRole ? "default" : "secondary"}>
                  {userRole || "N/A"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Organization ID:</label>
                <p className="text-sm text-muted-foreground">{organization?.id || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membros da Organização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros da Organização ({organizationMembers.length})
            </CardTitle>
            <CardDescription>
              Lista de membros carregados da organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizationMembers.length > 0 ? (
              <div className="space-y-2">
                {organizationMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{member.profiles?.display_name || member.profiles?.email || "Nome não disponível"}</p>
                      <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum membro carregado</p>
            )}
          </CardContent>
        </Card>

        {/* Dados Raw para Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Raw (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">User Object:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Organization Object:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(organization, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestFlow;