import { SidebarProvider } from "@/components/ui/sidebar";
import ModernSidebar from "./ModernSidebar";
import RequireOrganization from "./RequireOrganization";
import OrganizationSetupLayout from "./OrganizationSetupLayout";
import { WhatsappExpandableChat } from "./WhatsappExpandableChat";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout = ({ children }: ModernLayoutProps) => {
  const { user, organization, loading } = useAuth();
  const isMobile = useIsMobile();

  // Se não tem organização, usar layout específico para setup
  if (!loading && user && !organization) {
    return (
      <OrganizationSetupLayout>
        {children}
      </OrganizationSetupLayout>
    );
  }

  return (
    <RequireOrganization>
      <SidebarProvider>
        {isMobile ? (
          // Layout para Mobile - Sem menu fixo, controlado pelos componentes individuais
          <div className="min-h-screen w-full bg-background">
            <main className="min-h-screen w-full">
              {children}
            </main>
            <WhatsappExpandableChat />
          </div>
        ) : (
          // Layout para Desktop
          <div className="min-h-screen flex w-full">
            <ModernSidebar collapsed={false} onToggle={() => {}} />
            
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                {children}
              </div>
            </main>
            <WhatsappExpandableChat />
          </div>
        )}
      </SidebarProvider>
    </RequireOrganization>
  );
};

export default ModernLayout;