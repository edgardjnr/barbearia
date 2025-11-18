import { useState } from "react";
import { ChevronDown, Building2, Check, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface OrganizationSwitcherProps {
  variant?: "sidebar" | "mobile";
  className?: string;
}

export const OrganizationSwitcher = ({ variant = "sidebar", className = "" }: OrganizationSwitcherProps) => {
  const { organization, userOrganizations, userProfile, switchOrganization } = useAuth();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  // Don't render if user has only one organization and is not a master user
  if (!userProfile?.is_master && (!userOrganizations || userOrganizations.length <= 1)) {
    return null;
  }

  const handleSwitchOrganization = async (organizationId: string) => {
    if (organizationId === organization?.id || switching) return;

    setSwitching(true);
    try {
      const { error } = await switchOrganization(organizationId);
      
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao trocar de empresa.",
          variant: "destructive",
        });
      } else {
        const selectedOrg = userOrganizations.find(org => org.organization_id === organizationId);
        toast({
          title: "Empresa alterada",
          description: `Agora você está trabalhando na ${selectedOrg?.organization_name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao trocar de empresa.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (variant === "mobile") {
    return (
      <div className={`px-4 py-2 border-b border-border ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-3"
              disabled={switching}
            >
              <div className="flex items-center gap-3 text-left">
                <Building2 className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {organization?.name || "Selecione uma empresa"}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-background border shadow-lg z-50">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">TROCAR EMPRESA</p>
            </div>
            <DropdownMenuSeparator />
            {userOrganizations.map((org) => (
              <DropdownMenuItem 
                key={org.organization_id}
                onClick={() => handleSwitchOrganization(org.organization_id)}
                className="cursor-pointer px-3 py-2"
              >
                  <div className="flex items-center gap-3 w-full">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{org.organization_name}</p>
                    </div>
                    {organization?.id === org.organization_id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className={`px-3 py-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-auto p-2 hover:bg-muted/50"
            disabled={switching}
          >
            <div className="flex items-center gap-2 text-left min-w-0 flex-1">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {organization?.name || "Empresa"}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-background border shadow-lg z-50 max-w-[calc(100vw-2rem)]" align="start">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">TROCAR EMPRESA</p>
          </div>
          <DropdownMenuSeparator />
          {userOrganizations.map((org) => (
            <DropdownMenuItem 
              key={org.organization_id}
              onClick={() => handleSwitchOrganization(org.organization_id)}
              className="cursor-pointer"
            >
               <div className="flex items-center gap-2 w-full">
                 <Building2 className="w-4 h-4 text-muted-foreground" />
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-sm truncate">{org.organization_name}</p>
                 </div>
                 {organization?.id === org.organization_id && (
                   <Check className="w-4 h-4 text-primary" />
                 )}
               </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};