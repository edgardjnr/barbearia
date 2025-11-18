import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/hero-salon.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-bg-subtle to-bg-soft">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                Transforme seu
                <span className="block text-primary">Salão de Beleza</span>
                em uma operação digital
              </h1>
              <p className="text-xl text-text-secondary leading-relaxed max-w-lg">
                Plataforma completa para gestão de agendamentos, clientes, financeiro e equipe. 
                Tudo que você precisa para fazer seu salão crescer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground text-lg px-8 py-4">
                Começar Teste Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Play className="mr-2 w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-text-muted">Salões Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50k+</div>
                <div className="text-sm text-text-muted">Agendamentos/mês</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-text-muted">Uptime</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={heroImage} 
                alt="Sistema de gestão para salões" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 bg-card p-4 rounded-xl shadow-lg border">
              <div className="text-sm font-medium text-card-foreground">Agendamento Hoje</div>
              <div className="text-2xl font-bold text-primary">47</div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-xl shadow-lg border">
              <div className="text-sm font-medium text-card-foreground">Receita Mensal</div>
              <div className="text-2xl font-bold text-primary">R$ 45.2k</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;