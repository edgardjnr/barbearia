import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgendaBadge } from "@/hooks/useAgendaBadge";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  Home,
  BarChart3,
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  User2,
  Building2,
  Bell,
  Shield,
  Gift,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Send,
  Settings2,
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
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";

interface SubmenuItem {
  title: string;
  href: string;
  active: boolean;
}

interface MenuItemBase {
  title: string;
  icon: React.ComponentType<any>;
  module: string;
  active: boolean;
}

interface SimpleMenuItem extends MenuItemBase {
  href: string;
}

interface SubmenuMenuItem extends MenuItemBase {
  submenu: SubmenuItem[];
  open: boolean;
}

type MenuItem = SimpleMenuItem | SubmenuMenuItem;

const isSubmenuItem = (item: MenuItem): item is SubmenuMenuItem => {
  return 'submenu' in item;
};

interface ModernSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

const ModernSidebar = ({ collapsed, onToggle, onNavigate }: ModernSidebarProps) => {
  const { user, userProfile, organization } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { count: agendaBadgeCount } = useAgendaBadge();
  const { isMobile } = useSidebar();
  const { canAccessModule, loading: permissionsLoading } = usePermissions();
  
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's theme preference from profile
  useEffect(() => {
    if (userProfile?.theme_preference && mounted) {
      setTheme(userProfile.theme_preference);
    }
  }, [userProfile?.theme_preference, setTheme, mounted]);

  const handleThemeChange = async (newTheme: string) => {
    if (!user) return;
    
    setTheme(newTheme);
    
    // Save theme preference to database
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

  const allPagesItems = [
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

  // Show all pages (permission check will be done on route level)
  const pagesItems = allPagesItems;

  const allSettingsItems = [
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

  // Criar item de menu Whatsapp
  const whatsappMenuItem = {
    title: "Whatsapp",
    icon: MessageCircle,
    href: "/configuracoes/whatsapp",
    module: "settings" as const,
    active: location.pathname === "/configuracoes/whatsapp"
  };

  // Adicionar Whatsapp aos itens de configuração
  const settingsItemsWithMaster = [...allSettingsItems, whatsappMenuItem];

  // Show all settings items (permission check will be done on route level)
  const settingsItems = settingsItemsWithMaster;

  const isSettingsActive = location.pathname.startsWith('/configuracoes');

  const renderMenuItem = (item: any, isSubmenu = false) => (
    <div key={`${item.href || item.title}-${isSubmenu ? 'sub' : 'main'}`} className={`${isSubmenu ? 'ml-6' : ''}`}>
      {item.hasSubmenu ? (
        <Collapsible open={item.open} onOpenChange={item.onToggle}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-between h-9 px-3 text-sm font-normal hover:bg-accent/50 ${
                collapsed ? 'px-2' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!collapsed && (
                <ChevronDown className={`w-4 h-4 transition-transform ${item.open ? 'rotate-180' : ''}`} />
              )}
            </Button>
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent className="space-y-1">
              <div className="ml-4 border-l border-border/50 pl-4 space-y-1">
                {item.submenu?.map((subItem: any) => (
                  <Button
                    key={subItem.href}
                    variant="ghost"
                    className="w-full justify-start h-8 px-3 text-sm font-normal text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    onClick={() => navigate(subItem.href)}
                  >
                    {subItem.title}
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      ) : (
        <Button
          variant="ghost"
          className={`w-full justify-start h-9 px-3 text-sm font-normal hover:bg-accent/50 ${
            item.active ? 'bg-primary/10 text-primary' : ''
          } ${collapsed ? 'px-2' : ''}`}
          onClick={() => navigate(item.href)}
        >
          <div className="flex items-center gap-3 w-full">
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </div>
        </Button>
      )}
    </div>
  );

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <SidebarGroup>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar 
                className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => {
                  navigate('/configuracoes/perfil');
                  onNavigate?.();
                }}
              >
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-medium truncate">
                  {userProfile?.display_name || 'Usuário'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {organization?.name || 'Organização'}
                </div>
              </div>
            </div>
          </div>
        </SidebarGroup>

        {/* Pages */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {pagesItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.active}
                    className="h-10"
                  >
                    <button onClick={() => {
                      navigate(item.href);
                      onNavigate?.();
                    }}>
                      <item.icon className="w-4 h-4" />
                      <span>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="ml-auto bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-10">
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                      <ChevronDown className="ml-auto transition-transform ui-open:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-2 border-l border-border/50 pl-2 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild 
                          isActive={location.pathname === '/configuracoes'}
                          size="sm"
                        >
                          <button onClick={() => {
                            navigate('/configuracoes');
                            onNavigate?.();
                          }}>
                            <Building2 className="w-3 h-3" />
                            <span>Empresa</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {settingsItems.map((subItem: any) => (
                        <SidebarMenuItem key={subItem.href || subItem.title}>
                          {isSubmenuItem(subItem) ? (
                            <Collapsible open={subItem.open} onOpenChange={() => setWhatsappMenuOpen(!whatsappMenuOpen)}>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton size="sm">
                                  <subItem.icon className="w-3 h-3" />
                                  <span>{subItem.title}</span>
                                  <ChevronDown className="ml-auto w-3 h-3 transition-transform ui-open:rotate-180" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenu className="ml-2 border-l border-border/50 pl-2 space-y-1">
                                  {subItem.submenu.map((nestedItem: any) => (
                                    <SidebarMenuItem key={nestedItem.href}>
                                      <SidebarMenuButton 
                                        asChild 
                                        isActive={nestedItem.active}
                                        size="sm"
                                      >
                                        <button onClick={() => {
                                          navigate(nestedItem.href);
                                          onNavigate?.();
                                        }}>
                                          <span>{nestedItem.title}</span>
                                        </button>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  ))}
                                </SidebarMenu>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <SidebarMenuButton 
                              asChild 
                              isActive={subItem.active}
                              size="sm"
                            >
                              <button onClick={() => {
                                navigate(subItem.href);
                                onNavigate?.();
                              }}>
                                <subItem.icon className="w-3 h-3" />
                                <span>
                                  {subItem.title}
                                </span>
                              </button>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {/* Organization Switcher */}
        <OrganizationSwitcher variant="sidebar" />

        <div className="group-data-[collapsible=icon]:hidden">
          {mounted && (
            <div className={`flex items-center ${isMobile ? 'justify-center gap-1' : 'justify-between'}`}>
              {/* Theme Toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant={theme === "light" ? "default" : "ghost"}
                  size="sm"
                  className={`${isMobile ? 'h-6 w-6 p-0' : 'h-7 px-2'} text-xs`}
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 mr-1'}`} />
                  {!isMobile && "Light"}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "ghost"}
                  size="sm"
                  className={`${isMobile ? 'h-6 w-6 p-0' : 'h-7 px-2'} text-xs`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 mr-1'}`} />
                  {!isMobile && "Dark"}
                </Button>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className={`${isMobile ? 'h-6 w-6 p-0' : 'h-7 px-2'} text-xs`}
                onClick={handleLogout}
              >
                <LogOut className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3 mr-1'}`} />
                {!isMobile && "Sair"}
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ModernSidebar;
