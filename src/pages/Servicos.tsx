import ServiceManagement from "@/components/ServiceManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { Scissors } from "lucide-react";

const Servicos = () => {
  const isMobile = useIsMobile();
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Serviços" icon={Scissors} />}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Serviços</h1>
        <p className="text-text-secondary">Gerencie os serviços da sua empresa</p>
      </div>
      
      <ServiceManagement />
    </div>
  );
};

export default Servicos;