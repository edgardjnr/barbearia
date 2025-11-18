import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, CheckCircle, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/phoneUtils";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
}

const PublicAvaliacao = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { user, isClient } = useAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientBirthDate: '',
    serviceId: '',
    rating: 0,
    comment: ''
  });

  // Função para normalizar slug (mesma lógica da página Links)
  const normalizeSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!slug) return;
      
      try {
        // Buscar organização pelo slug usando função segura
        const { data: orgData } = await supabase
          .rpc('get_safe_organization_info', { org_slug: slug });

        // Usar primeiro resultado (se houver)
        const matchingOrg = orgData && orgData.length > 0 ? orgData[0] : null;

        if (matchingOrg) {
          setOrganization(matchingOrg);
          
          // Buscar serviços da organização usando função RPC segura
          const { data: servicesData } = await supabase
            .rpc('get_public_services', { org_id: matchingOrg.id });
          setServices(servicesData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, [slug]);

  // Pré-preencher dados do cliente quando logado
  useEffect(() => {
    const loadClientData = async () => {
      console.log('Loading client data...', { user: !!user, organization: !!organization });
      
      if (user && organization) {
        try {
          // Primeiro tentar buscar dados do cliente na organização atual
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('name, email, phone, birth_date')
            .eq('organization_id', organization.id)
            .eq('email', user.email)
            .single();

          console.log('Client data from DB:', clientData);
          
          if (clientData) {
            // Usar dados da tabela clients
            const newFormData = {
              ...formData,
              clientName: clientData.name || '',
              clientPhone: clientData.phone ? formatPhoneNumber(clientData.phone) : '',
              clientEmail: clientData.email || '',
              clientBirthDate: clientData.birth_date || ''
            };
            
            console.log('Setting form data from clients table:', newFormData);
            setFormData(newFormData);
          } else {
            // Fallback para dados do perfil se não encontrar na tabela clients
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name, email, phone, birth_date')
              .eq('user_id', user.id)
              .single();

            console.log('Profile data from DB:', profileData);

            const newFormData = {
              ...formData,
              clientName: profileData?.display_name || user.user_metadata?.name || user.user_metadata?.display_name || '',
              clientPhone: profileData?.phone ? formatPhoneNumber(profileData.phone) : (user.user_metadata?.phone ? formatPhoneNumber(user.user_metadata.phone) : ''),
              clientEmail: profileData?.email || user.email || '',
              clientBirthDate: profileData?.birth_date || ''
            };
            
            console.log('Setting form data from profile:', newFormData);
            setFormData(newFormData);
          }
        } catch (error) {
          console.error('Error loading client data:', error);
          
          // Fallback para dados básicos do usuário
          const newFormData = {
            ...formData,
            clientName: user.user_metadata?.name || user.user_metadata?.display_name || '',
            clientPhone: user.user_metadata?.phone ? formatPhoneNumber(user.user_metadata.phone) : '',
            clientEmail: user.email || '',
            clientBirthDate: ''
          };
          
          console.log('Setting fallback form data:', newFormData);
          setFormData(newFormData);
        }
      }
    };
    
    loadClientData();
  }, [user, organization?.id]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || formData.rating === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios e selecione uma avaliação.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Criar ou atualizar cliente usando função segura
      let clientId: string;
      
      const cleanPhone = unformatPhoneNumber(formData.clientPhone);
      
      // Validar dados obrigatórios
      if (!formData.clientName || (!formData.clientEmail && !cleanPhone)) {
        throw new Error('Nome e email ou telefone são obrigatórios');
      }

      // Usar função RPC segura para criar/atualizar cliente
      const { data: clientResult, error: clientError } = await supabase
        .rpc('create_or_update_client_safe', {
          org_id: organization.id,
          client_name: formData.clientName,
          client_email: formData.clientEmail || null,
          client_phone: cleanPhone || null,
          client_birth_date: formData.clientBirthDate || null
        });

      if (clientError) throw clientError;
      
      if (!clientResult || clientResult.length === 0) {
        throw new Error('Erro ao criar ou atualizar cliente');
      }

      clientId = clientResult[0].client_id;

      // Criar avaliação usando função RPC segura com validação
      const { data: reviewResult, error: reviewError } = await supabase
        .rpc('create_review_with_validation', {
          org_id: organization.id,
          client_email: formData.clientEmail,
          service_id_param: formData.serviceId,
          member_id_param: null, // Permitir null para avaliações gerais
          rating_param: formData.rating,
          comment_param: formData.comment || null
        });

      if (reviewError) throw reviewError;
      
      if (!reviewResult || reviewResult.length === 0 || !reviewResult[0].success) {
        throw new Error(reviewResult?.[0]?.message || 'Erro ao criar avaliação');
      }

      setSuccess(true);
      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback! Sua avaliação é muito importante para nós.",
      });

    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-8 h-8 cursor-pointer transition-colors ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-muted-foreground hover:text-yellow-300'
        }`}
        onClick={() => handleStarClick(index + 1)}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold mb-2">Empresa não encontrada</h1>
            <p className="text-muted-foreground">
              A empresa que você está procurando não foi encontrada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Avaliação Enviada!</h1>
            <p className="text-muted-foreground mb-4">
              Obrigado por avaliar {organization.name}! Seu feedback é muito importante para nós.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${
                      index < formData.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm">
                <strong>Avaliação:</strong> {formData.rating} estrela{formData.rating !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PublicPageWrapper>
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header da empresa */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
              {organization.description && (
                <p className="text-muted-foreground mb-4">{organization.description}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
                {organization.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {organization.phone}
                  </div>
                )}
                {organization.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {organization.email}
                  </div>
                )}
                {organization.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {organization.address}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Avalie nosso serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do cliente */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome completo *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', formatPhoneNumber(e.target.value))}
                    placeholder="(00)0 0000-0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientBirthDate">Data de nascimento</Label>
                  <Input
                    id="clientBirthDate"
                    type="date"
                    value={formData.clientBirthDate}
                    onChange={(e) => handleInputChange('clientBirthDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <Label htmlFor="service">Serviço utilizado *</Label>
                <Select value={formData.serviceId} onValueChange={(value) => handleInputChange('serviceId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço que você utilizou" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Avaliação por estrelas */}
              <div className="space-y-3">
                <Label>Avaliação *</Label>
                <div className="flex items-center gap-1">
                  {renderStars(formData.rating)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.rating === 0 && "Clique nas estrelas para avaliar"}
                  {formData.rating === 1 && "Muito insatisfeito"}
                  {formData.rating === 2 && "Insatisfeito"}
                  {formData.rating === 3 && "Neutro"}
                  {formData.rating === 4 && "Satisfeito"}
                  {formData.rating === 5 && "Muito satisfeito"}
                </p>
              </div>

              {/* Comentário */}
              <div className="space-y-2">
                <Label htmlFor="comment">Comentário (opcional)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  placeholder="Conte-nos sobre sua experiência..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting || formData.rating === 0}
              >
                {submitting ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </PublicPageWrapper>
  );
};

export default PublicAvaliacao;