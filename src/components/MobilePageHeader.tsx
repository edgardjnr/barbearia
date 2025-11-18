import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import MobileSidebar from "./MobileSidebar";

interface MobilePageHeaderProps {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const MobilePageHeader = ({ title, icon: Icon }: MobilePageHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 w-full">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
      </div>
      
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-80"
        >
          <MobileSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobilePageHeader;