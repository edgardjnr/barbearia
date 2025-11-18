import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Link2, 
  Calendar, 
  Star, 
  Copy, 
  Check, 
  QrCode,
  Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";

const Links = () => {
  const { organization } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Função para gerar slug sem acentuação
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  };

  // URLs base (em produção, seria o domínio real)
  const baseUrl = window.location.origin;
  const organizationSlug = generateSlug(organization?.name || 'minha-empresa');
  
  const links = [
    {
      id: 'agendamento',
      title: 'Link de Agendamento',
      description: 'Permite que clientes agendem serviços online',
      icon: Calendar,
      url: `${baseUrl}/agendamento/${organizationSlug}`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      status: 'Ativo'
    },
    {
      id: 'avaliacao',
      title: 'Link de Avaliação',
      description: 'Permite que clientes deixem avaliações após o serviço',
      icon: Star,
      url: `${baseUrl}/avaliacao/${organizationSlug}`,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      status: 'Ativo'
    }
  ];

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const openPreview = (url: string) => {
    window.open(url, '_blank', 'width=800,height=600');
  };

  return (
    <div className="space-y-6 px-4 sm:px-0 max-w-full overflow-hidden">
      {isMobile && <MobilePageHeader title="Links Públicos" icon={Link2} />}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Links Públicos</h1>
        <p className="text-muted-foreground">
          Gerencie os links públicos para agendamento e avaliação dos clientes
        </p>
      </div>

      {/* Alert informativo */}
      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertDescription>
          Compartilhe estes links com seus clientes para que possam agendar serviços e deixar avaliações.
          Os links são únicos para sua empresa e funcionam em qualquer dispositivo.
        </AlertDescription>
      </Alert>

      {/* Cards dos Links */}
      <div className="grid gap-6 max-w-full">
        {links.map((link) => (
          <Card key={link.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${link.bgColor}`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {link.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor={`url-${link.id}`}>URL do Link</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id={`url-${link.id}`}
                    value={link.url}
                    readOnly
                    className="font-mono text-sm flex-1 min-w-0"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(link.url, link.id)}
                    className="shrink-0 self-start sm:self-auto"
                  >
                    {copiedLink === link.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(link.url, link.id)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Copy className="w-3 h-3" />
                  Copiar Link
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreview(link.url)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Eye className="w-3 h-3" />
                  Visualizar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={() => {
                    // TODO: Implementar geração de QR Code
                    toast({
                      title: "Em breve",
                      description: "Funcionalidade de QR Code será implementada em breve.",
                    });
                  }}
                >
                  <QrCode className="w-3 h-3" />
                  QR Code
                </Button>
              </div>

              {/* Informações adicionais */}
              <div className="bg-muted/30 p-3 rounded-lg mt-4">
                <h4 className="text-sm font-medium mb-2">Como usar este link:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {link.id === 'agendamento' ? (
                    <>
                      <li>• Compartilhe em redes sociais, WhatsApp ou email</li>
                      <li>• Adicione ao seu site ou cartão de visita digital</li>
                      <li>• Clientes podem agendar 24/7 sem precisar ligar</li>
                    </>
                  ) : (
                    <>
                      <li>• Envie após a conclusão do serviço</li>
                      <li>• Inclua em mensagens de follow-up</li>
                      <li>• Ajuda a melhorar sua reputação online</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Links;