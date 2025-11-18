import { useAuth } from "@/contexts/AuthContext";
import OrganizationSetup from "@/components/OrganizationSetup";
import ServiceManagement from "@/components/ServiceManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { Settings } from "lucide-react";

const Configuracoes = () => {
  const { organization } = useAuth();
  const isMobile = useIsMobile();

  // Se não tem organização, mostrar apenas o setup com instruções
  if (!organization) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        {isMobile && <MobilePageHeader title="Configurações" icon={Settings} />}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Configure sua empresa
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Antes de utilizar o sistema, você precisa configurar os dados da sua empresa. 
            Isso permitirá que você gerencie seus serviços, clientes e agendamentos.
          </p>
        </div>
        <OrganizationSetup />
      </div>
    );
  }

  // Se tem organização, mostrar configurações completas
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Configurações" icon={Settings} />}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">Configurações</h1>
      </div>

      <OrganizationSetup />
    </div>
  );
};

export default Configuracoes;