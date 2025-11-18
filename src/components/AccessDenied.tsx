import { ShieldX } from "lucide-react";

interface AccessDeniedProps {
  module: string;
}

export const AccessDenied = ({ module }: AccessDeniedProps) => {
  const getModuleDisplayName = (moduleName: string) => {
    const moduleNames: Record<string, string> = {
      dashboard: "dashboard",
      agenda: "agenda", 
      clients: "clientes",
      services: "serviços",
      reports: "relatórios",
      loyalty: "fidelidade",
      reviews: "avaliações",
      users: "colaboradores",
      settings: "configurações",
      messages: "mensagens"
    };
    return moduleNames[moduleName] || moduleName;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-destructive" />
      </div>
      
      <h1 className="text-xl font-semibold text-foreground mb-3">
        Acesso Negado
      </h1>
      
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Você não tem permissão para gerenciar {getModuleDisplayName(module)}. Entre em contato com o administrador da organização.
      </p>
    </div>
  );
};