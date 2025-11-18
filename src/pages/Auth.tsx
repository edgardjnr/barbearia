import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, EyeOff, Loader2, Users, Building2 } from "lucide-react";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/phoneUtils";

type UserType = 'professional' | 'client';

const Auth = () => {
  const [userType, setUserType] = useState<UserType>('professional');
  const [isLogin, setIsLogin] = useState(true);
  
  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Client-specific fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  // Check if accessing from booking link and store it
  useEffect(() => {
    const referrer = document.referrer;
    const searchParams = new URLSearchParams(window.location.search);
    const fromBooking = searchParams.get('from');
    
    // Check if coming from a booking page or has booking parameter
    if (fromBooking && fromBooking.startsWith('/agendamento/')) {
      localStorage.setItem('pendingBookingLink', fromBooking);
    } else if (referrer && referrer.includes('/agendamento/')) {
      // Extract booking path from referrer
      const url = new URL(referrer);
      if (url.pathname.startsWith('/agendamento/')) {
        localStorage.setItem('pendingBookingLink', url.pathname);
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validação específica para cadastro de clientes
    if (!isLogin && userType === 'client') {
      if (!name || !phone || !birthDate) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Erro no login",
            description: error.message === "Invalid login credentials" 
              ? "Email ou senha incorretos." 
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso!",
            description: "Login realizado com sucesso.",
            variant: "success",
          });
          navigate("/");
        }
      } else {
        // Preparar metadata para o cadastro
        const metadata: any = {
          user_type: userType
        };

        if (userType === 'client') {
          metadata.name = name;
          metadata.phone = unformatPhoneNumber(phone);
          metadata.birth_date = birthDate;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: metadata
          }
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Usuário já existe",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro no cadastro",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu email antes de solicitar a redefinição.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique seu email para redefinir sua senha.",
          variant: "success" as const,
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 force-light-mode">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-text-primary">SalãoTech</span>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Entrar" : "Criar Conta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Entre com seu email e senha para acessar sua conta" 
                : "Crie sua conta para começar a usar o SalãoTech"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Type Selection (only for signup) */}
            {!isLogin && (
              <div className="space-y-3 mb-6">
                <Label className="text-base font-semibold">Tipo de Usuário</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={userType === 'professional' ? 'default' : 'outline'}
                    onClick={() => setUserType('professional')}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Building2 className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">Profissional</div>
                      <div className="text-xs opacity-80">Empresa ou Colaborador</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'client' ? 'default' : 'outline'}
                    onClick={() => setUserType('client')}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Users className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium">Cliente</div>
                      <div className="text-xs opacity-80">Agendar serviços</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Client-specific fields */}
              {!isLogin && userType === 'client' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 9 1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Aniversário *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-text-secondary hover:text-primary p-0 h-auto"
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Entrando..." : "Criando conta..."}
                  </>
                ) : (
                  isLogin ? "Entrar" : "Criar Conta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setPhone("");
                  setBirthDate("");
                  setUserType('professional');
                }}
                className="text-sm text-text-secondary hover:text-primary"
              >
                {isLogin 
                  ? "Não tem uma conta? Criar conta" 
                  : "Já tem uma conta? Entrar"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm text-text-secondary hover:text-primary"
          >
            ← Voltar ao início
          </Button>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite seu email para receber um link de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;