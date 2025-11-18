import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  organization_id: string;
  expires_at: string;
  status: string;
  invited_by: string;
  configuration?: any;
  organizations?: {
    name: string;
    description?: string;
  };
}

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      // First get the invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError) {
        console.error('Error loading invitation:', inviteError);
        toast({
          title: "Erro",
          description: "Convite não encontrado ou expirado.",
          variant: "destructive",
        });
        return;
      }

      // Then get the organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name, description')
        .eq('id', inviteData.organization_id)
        .single();

      if (orgError) {
        console.error('Error loading organization:', orgError);
      }

      // Check if invitation is expired
      const expiresAt = new Date(inviteData.expires_at);
      if (expiresAt < new Date()) {
        toast({
          title: "Convite Expirado",
          description: "Este convite já expirou.",
          variant: "destructive",
        });
        return;
      }

      const invitation: InvitationData = {
        id: inviteData.id,
        email: inviteData.email,
        role: inviteData.role as 'owner' | 'admin' | 'manager' | 'employee',
        organization_id: inviteData.organization_id,
        expires_at: inviteData.expires_at,
        status: inviteData.status,
        invited_by: inviteData.invited_by,
        configuration: inviteData.configuration,
        organizations: orgData ? {
          name: orgData.name,
          description: orgData.description
        } : undefined
      };

      setInvitation(invitation);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invitation) return;

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

    if (!displayName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu nome.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      let userId: string;
      let isNewUser = false;

      // Primeiro, tenta criar um novo usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });

      if (signUpError && signUpError.message.includes('already registered')) {
        // Usuário já existe, faz login e atualiza a senha
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: password,
        });

        if (signInError) {
          // Se não conseguir fazer login com a senha fornecida, 
          // vamos resetar a senha do usuário
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            invitation.email,
            {
              redirectTo: `${window.location.origin}/reset-password?invitation=${token}`,
            }
          );

          if (resetError) {
            console.error('Error resetting password:', resetError);
            toast({
              title: "Erro",
              description: "Não foi possível fazer login. Verifique sua senha ou entre em contato com o administrador.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Email de redefinição enviado",
            description: "Foi enviado um email para redefinir sua senha. Após redefinir, você poderá aceitar o convite novamente.",
          });
          return;
        }

        if (!signInData.user) {
          toast({
            title: "Erro",
            description: "Erro ao fazer login.",
            variant: "destructive",
          });
          return;
        }

        userId = signInData.user.id;
        
        // Atualiza o perfil do usuário com o nome fornecido
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            display_name: displayName,
            email: invitation.email,
          });

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }

      } else if (signUpError) {
        console.error('Auth error:', signUpError);
        toast({
          title: "Erro",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      } else {
        // Novo usuário criado com sucesso
        if (!signUpData.user) {
          toast({
            title: "Erro",
            description: "Erro ao criar usuário.",
            variant: "destructive",
          });
          return;
        }
        userId = signUpData.user.id;
        isNewUser = true;
      }

      // Verificar se o usuário já é membro da organização
      console.log('Checking if user is already member:', { userId, organizationId: invitation.organization_id });
      const { data: existingMember, error: checkError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', invitation.organization_id)
        .eq('user_id', userId)
        .single();

      console.log('Existing member check result:', { existingMember, checkError });

      if (!existingMember) {
        console.log('Adding user to organization...');
        // Add user to organization
        const { data: insertedMember, error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: invitation.organization_id,
            user_id: userId,
            role: invitation.role,
            status: 'active'
          })
          .select()
          .single();

        console.log('Insert member result:', { insertedMember, memberError });

        if (memberError) {
          console.error('Error adding user to organization:', memberError);
          toast({
            title: "Erro",
            description: `Erro ao adicionar usuário à organização: ${memberError.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log('User successfully added to organization:', insertedMember);
      } else {
        console.log('User is already a member of the organization');
      }

      // Add services if configured
      if (invitation.configuration?.services?.length) {
        // Buscar o member_id correto da tabela organization_members
        const { data: memberData, error: memberFetchError } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', invitation.organization_id)
          .eq('user_id', userId)
          .single();

        if (memberFetchError || !memberData) {
          console.error('Error fetching member ID:', memberFetchError);
        } else {
          const serviceInserts = invitation.configuration.services.map(serviceId => ({
            member_id: memberData.id, // Usar o ID correto da tabela organization_members
            service_id: serviceId,
            organization_id: invitation.organization_id
          }));

          console.log('Adding member services:', serviceInserts);
          const { error: servicesError } = await supabase
            .from('member_services')
            .insert(serviceInserts);

          if (servicesError) {
            console.error('Error adding member services:', servicesError);
          } else {
            console.log('Member services added successfully');
          }
        }
      }

      // Add working hours if configured
      if (invitation.configuration?.workingHours?.length) {
        // Buscar o member_id correto da tabela organization_members
        const { data: memberData, error: memberFetchError } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', invitation.organization_id)
          .eq('user_id', userId)
          .single();

        if (memberFetchError || !memberData) {
          console.error('Error fetching member ID for working hours:', memberFetchError);
        } else {
          const workingHoursInserts = invitation.configuration.workingHours.map(wh => ({
            member_id: memberData.id, // Usar o ID correto da tabela organization_members
            organization_id: invitation.organization_id,
            day_of_week: wh.day_of_week,
            start_time: wh.start_time,
            end_time: wh.end_time,
            is_active: wh.is_active
          }));

          console.log('Adding working hours:', workingHoursInserts);
          const { error: workingHoursError } = await supabase
            .from('working_hours')
            .insert(workingHoursInserts);

          if (workingHoursError) {
            console.error('Error adding working hours:', workingHoursError);
          } else {
            console.log('Working hours added successfully');
          }
        }
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
      }

      toast({
        title: "Sucesso!",
        description: "Convite aceito com sucesso! Você será redirecionado para o dashboard.",
        variant: "success",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao aceitar convite.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'employee': return 'Funcionário';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>
              Este convite não foi encontrado ou já expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Voltar à Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Você foi convidado para se juntar à{' '}
            <strong>{invitation.organizations?.name}</strong> como{' '}
            <strong>{getRoleName(invitation.role)}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes do Convite:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>Email:</strong> {invitation.email}</li>
              <li><strong>Empresa:</strong> {invitation.organizations?.name}</li>
              <li><strong>Função:</strong> {getRoleName(invitation.role)}</li>
              <li><strong>Convidado por:</strong> {invitation.invited_by}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Nome Completo</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Digite seu nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleAcceptInvite}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Aceitar Convite'
            )}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;