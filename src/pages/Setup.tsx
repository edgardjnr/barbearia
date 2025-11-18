import { useAuth } from "@/contexts/AuthContext";
import OrganizationSetup from "@/components/OrganizationSetup";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Setup = () => {
  const { user, organization, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se não está logado, redirecionar para auth
    if (!loading && !user) {
      navigate("/auth");
    }
    
    // Se já tem organização, redirecionar para dashboard
    if (!loading && user && organization) {
      navigate("/dashboard");
    }
  }, [user, organization, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-5 h-5 bg-primary-foreground rounded-full animate-pulse" />
          </div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (organization) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Configure sua empresa
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Antes de utilizar o sistema, você precisa configurar os dados da sua empresa. 
          Isso permitirá que você gerencie seus serviços, clientes e agendamentos.
        </p>
        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary font-medium">
            🎉 Última etapa! Configure sua empresa e comece a usar o SalãoTech
          </p>
        </div>
      </div>
      <OrganizationSetup />
    </div>
  );
};

export default Setup;