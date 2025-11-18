import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Eye, EyeOff, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;

    // Handle auth state change for password recovery
    const handleAuthStateChange = async (event: string, session: any) => {
      console.log('Auth state change:', event, session);
      if (event === 'PASSWORD_RECOVERY' && session && mounted) {
        console.log('Setting tokens from auth state:', session.access_token, session.refresh_token);
        setAccessToken(session.access_token);
        setRefreshToken(session.refresh_token);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Function to extract tokens from URL
    const extractTokensFromUrl = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      
      console.log('Current URL:', window.location.href);
      console.log('Hash:', hash);
      console.log('Search:', search);
      
      let tokens = { access_token: "", refresh_token: "" };

      // Try to get from hash first
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        tokens.access_token = hashParams.get("access_token") || "";
        tokens.refresh_token = hashParams.get("refresh_token") || "";
        console.log('Tokens from hash:', tokens);
      }

      // Also check search params as fallback
      if (!tokens.access_token) {
        tokens.access_token = searchParams.get("access_token") || "";
        tokens.refresh_token = searchParams.get("refresh_token") || "";
        console.log('Tokens from search params:', tokens);
      }

      return tokens;
    };

    // Extract tokens immediately
    const tokens = extractTokensFromUrl();
    
    if (tokens.access_token && tokens.refresh_token && mounted) {
      console.log('Setting tokens from URL:', tokens);
      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      
      // Set the session with the tokens
      supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
        } else {
          console.log('Session set successfully');
        }
      });
    }

    // Check if there's an invitation parameter for redirect
    const invitationToken = searchParams.get("invitation");
    if (invitationToken && mounted) {
      // Store invitation token for redirect after password reset
      sessionStorage.setItem('invitation_token', invitationToken);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Try to update password directly - Supabase may handle auth internally
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        
        // If we have tokens, try setting session first
        if (accessToken && refreshToken) {
          console.log('Retrying with explicit session tokens');
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          // Try again
          const { error: retryError } = await supabase.auth.updateUser({
            password: password
          });
          
          if (retryError) {
            toast({
              title: "Erro ao redefinir senha",
              description: retryError.message,
              variant: "destructive",
            });
            return;
          }
        } else {
          toast({
            title: "Erro ao redefinir senha",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      // Success case
      toast({
        title: "Sucesso!",
        description: "Sua senha foi redefinida com sucesso.",
        variant: "success",
      });
      
      // Check if user came from invitation
      const invitationToken = sessionStorage.getItem('invitation_token');
      if (invitationToken) {
        sessionStorage.removeItem('invitation_token');
        toast({
          title: "Redirecionando...",
          description: "Redirecionando para aceitar o convite com sua nova senha.",
        });
        setTimeout(() => {
          navigate(`/convite/${invitationToken}`);
        }, 2000);
      } else {
        // Redirect to login after successful password reset
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
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
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
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

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="text-sm text-text-secondary hover:text-primary"
          >
            ← Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;