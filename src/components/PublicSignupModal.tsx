import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Star, Percent, X, UserPlus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/phoneUtils";

interface PublicSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueWithoutSignup: () => void;
  organizationName: string;
}

export const PublicSignupModal = ({ 
  isOpen, 
  onClose, 
  onContinueWithoutSignup, 
  organizationName 
}: PublicSignupModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Validação para login
      if (!formData.email || !formData.password) {
        toast({
          title: "Campos obrigatórios",
          description: "Email e senha são obrigatórios",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Validação completa para cadastro
      if (!formData.name || !formData.email || !formData.phone || !formData.birthDate || !formData.password) {
        toast({
          title: "Todos os campos são obrigatórios",
          description: "Por favor, preencha todos os campos para continuar",
          variant: "destructive"
        });
        return;
      }

      // Validar idade mínima (exemplo: 16 anos)
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 16) {
        toast({
          title: "Idade mínima",
          description: "É necessário ter pelo menos 16 anos para se cadastrar",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta! Agora você pode agendar com desconto.",
        });
      } else {
        // Signup
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
              phone: unformatPhoneNumber(formData.phone),
              birth_date: formData.birthDate,
              user_type: 'client'
            }
          }
        });

        if (error) {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Cadastro realizado!",
          description: "Bem-vindo! Agora você pode agendar com desconto.",
        });
      }

      onClose();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] overflow-y-auto p-6 sm:p-8 py-8 sm:py-10 rounded-xl sm:w-full sm:max-h-[calc(100vh-64px)] mt-4 mb-8">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Gift className="h-12 w-12 text-primary" />
              <Star className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          
          <DialogTitle className="text-xl font-bold">
            {organizationName}
          </DialogTitle>
          
          {!showForm && (
            <DialogDescription className="text-center">
              Cadastre-se e ganhe benefícios exclusivos
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            // Tela inicial com opções
            <>
              {/* Benefícios */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Percent className="h-5 w-5 text-primary" />
                  <span className="font-medium">Descontos exclusivos em serviços</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-medium">Programa de fidelidade com pontos</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsLogin(true);
                    setShowForm(true);
                  }}
                  className="w-full"
                  variant="default"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Fazer Login
                </Button>

                <Button
                  onClick={() => {
                    setIsLogin(false);
                    setShowForm(true);
                  }}
                  className="w-full"
                  variant="secondary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Fazer Cadastro
                </Button>

                <Button
                  variant="outline"
                  onClick={onContinueWithoutSignup}
                  className="w-full text-muted-foreground"
                >
                  Continuar sem cadastro
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  (Você perderá os benefícios exclusivos)
                </p>
              </div>
            </>
          ) : (
            // Formulário de login/cadastro
            <>
              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthDate">Data de nascimento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                        required
                        max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar e Ganhar Benefícios')}
                </Button>
              </form>

              {/* Voltar */}
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowForm(false)}
                  className="text-sm"
                >
                  ← Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};