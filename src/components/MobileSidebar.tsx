import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAgendaBadge } from "@/hooks/useAgendaBadge";
import { 
  Home,
  BarChart3,
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  User2,
  Building2,
  Gift,
  ChevronDown,
  Sun,
  Moon,
  Send,
  Star,
  Link2,
  Scissors,
  Lock,
  MessageCircle,
  Zap
} from "lucide-react";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileSidebarProps {
  onNavigate: () => void;
}

const MobileSidebar = ({ onNavigate }: MobileSidebarProps) => {
  const { user, userProfile, organization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { count: agendaBadgeCount } = useAgendaBadge();
  const { canAccessModule } = usePermissions();
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only set theme from profile on component mount, not on every change
    if (userProfile?.theme_preference && mounted && !theme) {
      setTheme(userProfile.theme_preference);
    }
  }, [userProfile?.theme_preference, setTheme, mounted]);

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return;
    
    setTheme(newTheme);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error saving theme preference:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar a preferência de tema.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao fazer logout.",
          variant: "destructive",
        });
      } else {
        navigate("/auth");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onNavigate();
  };

  const pagesItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      module: "dashboard" as const,
      active: location.pathname === "/dashboard"
    },
    {
      title: "Agenda",
      icon: Calendar,
      href: "/agenda",
      module: "agenda" as const,
      badge: agendaBadgeCount > 0 ? agendaBadgeCount.toString() : undefined,
      active: location.pathname === "/agenda"
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/clientes",
      module: "clients" as const,
      active: location.pathname === "/clientes"
    },
    {
      title: "Fidelidade",
      icon: Gift,
      href: "/fidelidade",
      module: "loyalty" as const,
      active: location.pathname === "/fidelidade"
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/relatorios",
      module: "reports" as const,
      active: location.pathname === "/relatorios"
    },
    {
      title: "Avaliações",
      icon: Star,
      href: "/avaliacoes",
      module: "reviews" as const,
      active: location.pathname === "/avaliacoes"
    },
    {
      title: "Serviços",
      icon: Scissors,
      href: "/servicos",
      module: "services" as const,
      active: location.pathname === "/servicos"
    }
  ];

  const allSettingsItems = [
    {
      title: "Empresa",
      icon: Building2,
      href: "/configuracoes",
      module: "settings" as const,
      active: location.pathname === "/configuracoes"
    },
    {
      title: "Colaboradores",
      icon: User2,
      href: "/usuarios",
      module: "users" as const,
      active: location.pathname === "/usuarios"
    },
    {
      title: "Links",
      icon: Link2,
      href: "/configuracoes/links",
      module: "settings" as const,
      active: location.pathname === "/configuracoes/links"
    }
  ];

  // Criar item de menu WhatsApp
  const whatsappMenuItem = {
    title: "Whatsapp",
    icon: MessageCircle,
    href: "/configuracoes/whatsapp",
    module: "settings" as const,
    active: location.pathname === "/configuracoes/whatsapp"
  };

  // Adicionar Whatsapp aos itens de configuração
  const settingsItemsWithMaster = [...allSettingsItems, whatsappMenuItem];

  const settingsItems = settingsItemsWithMaster;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar 
            className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => handleNavigation('/configuracoes/perfil')}
          >
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium truncate">
              {userProfile?.display_name || 'Usuário'}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {organization?.name || 'Organização'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Pages */}
        <div className="mb-6">
          <div className="space-y-1">
            {pagesItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={`w-full justify-start h-11 px-3 text-sm font-normal hover:bg-accent/50 ${
                  item.active ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => handleNavigation(item.href)}
              >
                <div className="flex items-center gap-3 w-full">
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            CONFIGURAÇÕES
          </h3>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-11 px-3 text-sm font-normal hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 shrink-0" />
                  <span>Configurações</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              <div className="ml-4 border-l border-border/50 pl-4 space-y-1">
                {settingsItems.map((subItem: any) => (
                  <Button
                    key={subItem.href}
                    variant="ghost"
                    className={`w-full justify-start h-10 px-3 text-sm font-normal hover:bg-accent/30 hover:text-foreground ${
                      subItem.active ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => handleNavigation(subItem.href)}
                  >
                    <div className="flex items-center gap-3">
                      <subItem.icon className="w-4 h-4 shrink-0" />
                      <span>{subItem.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Organization Switcher */}
        <OrganizationSwitcher variant="mobile" />

        {mounted && (
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="flex items-center gap-1 flex-1">
              <Button
                variant={theme === "light" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs flex-1"
                onClick={() => handleThemeChange("light")}
              >
                <Sun className="w-3 h-3 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs flex-1"
                onClick={() => handleThemeChange("dark")}
              >
                <Moon className="w-3 h-3 mr-1" />
                Dark
              </Button>
            </div>
            
            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-red-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="w-3 h-3 mr-1" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSidebar;