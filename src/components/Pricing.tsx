import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Básico",
      price: "R$ 97",
      description: "Ideal para salões pequenos que estão começando",
      features: [
        "Até 2 profissionais",
        "500 clientes",
        "200 agendamentos/mês",
        "Agenda e dashboard básico",
        "Gestão de clientes e serviços",
        "Páginas públicas de agendamento",
        "Relatórios básicos (30 dias)",
        "1 unidade",
        "Suporte por email (48h)"
      ],
      popular: false
    },
    {
      name: "Profissional",
      price: "R$ 197",
      description: "Perfeito para salões em crescimento",
      features: [
        "Até 10 profissionais",
        "2.000 clientes",
        "1.000 agendamentos/mês",
        "Integração WhatsApp completa",
        "Sistema de fidelidade",
        "Avaliações públicas",
        "Relatórios avançados (ilimitado)",
        "Analytics detalhado de clientes",
        "Gestão de usuários e convites",
        "Links personalizados",
        "Até 3 unidades",
        "Suporte prioritário (24h)"
      ],
      popular: true
    },
    {
      name: "Diamond",
      price: "R$ 397",
      description: "Para redes de salões que buscam crescimento acelerado",
      features: [
        "Profissionais ilimitados",
        "Clientes ilimitados",
        "Agendamentos ilimitados",
        "Gestão multi-empresa completa",
        "BI e dashboards avançados",
        "API personalizada",
        "Relatórios customizáveis",
        "Backup automático",
        "Unidades ilimitadas",
        "Suporte 24/7 + Treinamento",
        "Gerente de sucesso dedicado"
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-bg-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Planos que crescem com seu negócio
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Escolha o plano ideal para o seu salão. Comece com 14 dias grátis, sem compromisso.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative border-2 transition-all duration-300 hover:scale-105 ${
              plan.popular 
                ? 'border-primary shadow-xl' 
                : 'border-border hover:border-primary/50'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-text-primary">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-text-muted">/mês</span>
                </div>
                <CardDescription className="text-text-secondary mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary-hover text-primary-foreground' 
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                  size="lg"
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Falar com Especialista
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;