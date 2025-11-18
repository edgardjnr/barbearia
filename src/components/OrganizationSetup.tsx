import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

const OrganizationSetup = () => {
  const { user, organization, createOrganization, updateOrganization } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    description: organization?.description || "",
    address: organization?.address || "",
    phone: organization?.phone || "",
    email: organization?.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      
      if (organization) {
        // Update existing organization
        result = await updateOrganization(formData);
      } else {
        // Create new organization
        result = await createOrganization(formData);
      }
      
      if (result.error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar empresa.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: organization 
            ? "Empresa atualizada com sucesso!" 
            : "Empresa criada com sucesso!",
          variant: "success",
        });
        
        // Se foi criação de uma nova empresa, redirecionar para o dashboard
        if (!organization) {
          setTimeout(() => {
            // Fazer reload da página para garantir que os dados da organização sejam carregados
            window.location.href = "/dashboard";
          }, 1500); // Aguardar 1.5 segundos para mostrar o toast
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Aplicar máscara para telefone
    if (field === 'phone') {
      value = applyPhoneMask(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applyPhoneMask = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara baseada na quantidade de dígitos
    if (limitedNumbers.length <= 10) {
      // Formato: (XX)XXXX-XXXX para números com até 10 dígitos
      return limitedNumbers
        .replace(/(\d{2})(\d)/, '($1)$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Formato: (XX)X XXXX-XXXX para números com 11 dígitos
      return limitedNumbers
        .replace(/(\d{2})(\d)/, '($1)$2')
        .replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3');
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary">Acesso negado</CardTitle>
          <CardDescription className="text-text-secondary">
            Você precisa estar logado para acessar esta página.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {organization ? "Configurações da Empresa" : "Criar Empresa"}
        </CardTitle>
        <CardDescription className="text-text-secondary">
          {organization 
            ? "Gerencie as informações da sua empresa"
            : "Configure sua empresa para começar a usar o sistema"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do seu salão"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 9 1234-5678"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva sua empresa..."
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Endereço completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@salao.com"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting 
              ? "Salvando..." 
              : organization 
                ? "Atualizar Empresa" 
                : "Criar Empresa"
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrganizationSetup;