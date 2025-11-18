import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-text-primary">SalãoTech</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-text-secondary hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-text-secondary hover:text-primary transition-colors">
              Planos
            </a>
            <a href="#contact" className="text-text-secondary hover:text-primary transition-colors">
              Contato
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-primary"
              onClick={() => window.location.href = '/auth'}
            >
              Entrar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
              onClick={() => window.location.href = '/auth'}
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;