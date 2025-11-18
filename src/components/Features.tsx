import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Building2, 
  Smartphone,
  Shield,
  Clock
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamento Inteligente",
      description: "Agenda visual completa com controle de horários, encaixes e fila de espera. Seus clientes podem agendar online 24/7."
    },
    {
      icon: Users,
      title: "CRM Completo",
      description: "Gestão completa de clientes com histórico, preferências, aniversários e programas de fidelidade automatizados."
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira",
      description: "Controle de comissões, relatórios financeiros e cobrança automática. Tenha total visibilidade da sua receita."
    },
    {
      icon: BarChart3,
      title: "Relatórios e BI",
      description: "Dashboards interativos e relatórios detalhados para tomar decisões baseadas em dados reais do seu negócio."
    },
    {
      icon: Building2,
      title: "Multi-empresa",
      description: "Gerencie múltiplos salões em uma única plataforma, com dados isolados e personalizações por unidade."
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Acesse tudo pelo celular. Interface responsiva e integração com WhatsApp para comunicação com clientes."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Isolamento de dados, autenticação forte e conformidade com LGPD. Seus dados sempre protegidos."
    },
    {
      icon: Clock,
      title: "Suporte 24/7",
      description: "Help desk especializado e suporte técnico para garantir que seu salão funcione sem interrupções."
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Tudo que seu salão precisa em um só lugar
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Uma plataforma completa e integrada para revolucionar a gestão do seu salão de beleza
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg text-text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-text-secondary text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;