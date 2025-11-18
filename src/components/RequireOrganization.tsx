import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

interface RequireOrganizationProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const RequireOrganization = ({ children, redirectTo = "/setup" }: RequireOrganizationProps) => {
  const { user, organization, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    
    // Se usuário está logado mas não tem organização, redirecionar automaticamente para setup de empresa
    if (!loading && user && !organization && window.location.pathname !== "/setup") {
      navigate("/setup");
    }
  }, [user, organization, loading, navigate]);

  if (loading) {
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

  if (!user) {
    return null;
  }

  if (!organization) {
    // Se usuário está logado mas não tem empresa, redirecionar para configurações
    if (window.location.pathname !== redirectTo) {
      navigate(redirectTo);
      return null;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default RequireOrganization;