import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, MessageSquare, Smartphone, Settings, ExternalLink, QrCode, Shield, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";

const Whatsapp = () => {
  const { organization, userProfile, updateOrganization } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Disparador states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [countdown, setCountdown] = useState(30);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // API Configuration states
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp_instance_name: "",
    whatsapp_apikey: "",
    whatsapp_base_url: "",
  });

  const isMasterUser = userProfile?.is_master === true;

  // Initialize form data
  useEffect(() => {
    if (organization) {
      setFormData({
        whatsapp_instance_name: organization.whatsapp_instance_name || "",
        whatsapp_apikey: organization.whatsapp_apikey || "",
        whatsapp_base_url: (organization as any).whatsapp_base_url || "https://api.onebots.com.br",
      });
    }
  }, [organization]);

  // Check initial connection status
  useEffect(() => {
    const checkInitialStatus = async () => {
      if (organization?.whatsapp_instance_name && organization?.whatsapp_apikey) {
        const isConnected = await checkConnectionStatus();
        setIsWhatsAppConnected(isConnected);
        
        if (!isConnected) {
          toast({
            title: "WhatsApp Desconectado", 
            description: "Sua instância foi criada mas o WhatsApp não está conectado. Use o QR Code para conectar.",
            variant: "destructive",
          });
        }
      }
    };
    
    checkInitialStatus();
  }, [organization]);

  // Normalize instance name
  const normalizeInstanceName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);
  };

  const connectWhatsApp = async () => {
    if (!organization) {
      toast({
        title: "Erro",
        description: "Organização não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const instanceName = normalizeInstanceName(organization.name);
      
      const response = await fetch(`https://api.onebots.com.br/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '1c9027389a94b37f322b3c1ba0d1478d'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.response?.message?.[0] || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      const updateData = {
        whatsapp_instance_name: data.instance.instanceName,
        whatsapp_apikey: data.hash
      };

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (error) {
        throw new Error('Erro ao salvar dados do WhatsApp');
      }

      await updateOrganization(updateData);

      toast({
        title: "Sucesso",
        description: "Conexão criada com sucesso! Use o QR Code para conectar.",
      });

    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao conectar com WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!organization?.whatsapp_instance_name || !organization?.whatsapp_apikey || !(organization as any)?.whatsapp_base_url) {
      return false;
    }

    try {
      const baseUrl = (organization as any).whatsapp_base_url;
      const instanceName = organization.whatsapp_instance_name;
      const apiKey = organization.whatsapp_apikey;

      const response = await fetch(`${baseUrl}/api/sessions/${instanceName}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const isConnected = data.status === 'WORKING';
        return isConnected;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
      return false;
    }
  };

  const handleConnectionSuccess = () => {
    stopPolling();
    setShowQRCode(false);
    setQrCodeImage("");
    setPairingCode("");
    setIsWhatsAppConnected(true);
  };

  const generateQRCode = async (startPolling = false) => {
    if (!organization?.whatsapp_instance_name || !organization?.whatsapp_apikey || !(organization as any)?.whatsapp_base_url) {
      toast({
        title: "Erro",
        description: "WhatsApp não conectado ou configuração incompleta.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQR(true);
    
    toast({
      title: "Aguarde...",
      description: "Gerando QR Code para conexão do WhatsApp.",
    });

    try {
      const baseUrl = (organization as any).whatsapp_base_url;
      const instanceName = organization.whatsapp_instance_name;
      const apiKey = organization.whatsapp_apikey;

      // Passo 1: Start da sessão
      const startResponse = await fetch(`${baseUrl}/api/sessions/${instanceName}/start`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        }
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Erro ao iniciar sessão: ${startResponse.status} - ${errorText}`);
      }

      // Passo 2: Esperar 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Passo 3: Gerar QR code
      const qrResponse = await fetch(`${baseUrl}/api/${instanceName}/auth/qr`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'X-Api-Key': apiKey
        }
      });

      if (!qrResponse.ok) {
        const errorText = await qrResponse.text();
        throw new Error(`Erro ao gerar QR Code: ${qrResponse.status} - ${errorText}`);
      }

      const data = await qrResponse.json();
      
      // Passo 4: Exibir o QR code (suporte a múltiplos formatos de resposta)
      try {
        let qrCodeDataUrl: string | null = null;
        let pairing: string = "";

        if (Array.isArray(data) && data.length > 0 && data[0].data) {
          // Formato: [{ mimetype, data }]
          const base64Data = data[0].data;
          const mimeType = data[0].mimetype || 'image/png';
          qrCodeDataUrl = `data:${mimeType};base64,${base64Data}`;
        } else if (data && typeof data === 'object' && 'data' in data) {
          // Formato: { mimetype, data }
          const base64Data = (data as any).data;
          const mimeType = (data as any).mimetype || 'image/png';
          qrCodeDataUrl = `data:${mimeType};base64,${base64Data}`;
        } else if ((data as any)?.qr || (data as any)?.code) {
          // Formato antigo: { qr: string } ou { code: string }
          const qrCode = (data as any).qr || (data as any).code;
          qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          pairing = (data as any).pairingCode || "";
        }

        if (!qrCodeDataUrl) {
          throw new Error('QR Code não encontrado na resposta da API');
        }

        setQrCodeImage(qrCodeDataUrl);
        setPairingCode(pairing);
        setShowQRCode(true);
        setCountdown(30);
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              return 30;
            }
            return prev - 1;
          });
        }, 1000);
        
        if (startPolling && !isPolling) {
          setIsPolling(true);
          startQRPolling();
        }
        
        toast({
          title: "QR Code gerado",
          description: "Escaneie o código para conectar seu WhatsApp.",
        });
      } catch (qrError) {
        throw new Error('Falha ao processar QR Code');
      }

      if (startPolling) {
        toast({
          title: "QR Code ativo",
          description: "O código será atualizado automaticamente a cada 30 segundos.",
        });
      }

    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar QR Code. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const startQRPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
    }
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current);
    }

    const pollQRCode = () => {
      if (!isPolling || !showQRCode) {
        stopPolling();
        return;
      }
      
      generateQRCode(false);
      pollingIntervalRef.current = setTimeout(pollQRCode, 30000);
    };

    connectionCheckIntervalRef.current = setInterval(async () => {
      const isConnected = await checkConnectionStatus();
      if (isConnected) {
        handleConnectionSuccess();
      }
    }, 5000);

    pollingIntervalRef.current = setTimeout(pollQRCode, 30000);
  };

  const stopPolling = () => {
    setIsPolling(false);
    
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (connectionCheckIntervalRef.current) {
      clearInterval(connectionCheckIntervalRef.current);
      connectionCheckIntervalRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const handleCloseQRCode = () => {
    stopPolling();
    setShowQRCode(false);
    setQrCodeImage("");
    setPairingCode("");
  };

  const handleGenerateQRCode = () => {
    generateQRCode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificar se já existe outra organização usando o mesmo nome de instância
      if (formData.whatsapp_instance_name.trim()) {
        const { data: existingOrgs, error: checkError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('whatsapp_instance_name', formData.whatsapp_instance_name.trim())
          .neq('id', organization?.id || '');

        if (checkError) {
          throw new Error('Erro ao verificar nome da instância');
        }

        if (existingOrgs && existingOrgs.length > 0) {
          const orgName = existingOrgs[0].name;
          toast({
            title: "Nome de instância já existe",
            description: `O nome "${formData.whatsapp_instance_name}" já está sendo usado pela organização "${orgName}". Escolha um nome diferente.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Se o nome da instância mudou, atualizar as mensagens existentes desta organização
      const instanceNameChanged = formData.whatsapp_instance_name !== organization?.whatsapp_instance_name;
      
      if (instanceNameChanged && organization?.id) {
        // Atualizar apenas as mensagens desta organização com o novo nome da instância
        const { error: updateMessagesError } = await supabase
          .from("Mensagens")
          .update({ Instancia: formData.whatsapp_instance_name })
          .eq("organization_id", organization.id);

        if (updateMessagesError) {
          console.error("Erro ao atualizar mensagens:", updateMessagesError);
        } else {
          console.log(`Mensagens da organização ${organization.id} atualizadas para instância ${formData.whatsapp_instance_name}`);
        }
      }

      const { error } = await updateOrganization({
        whatsapp_instance_name: formData.whatsapp_instance_name,
        whatsapp_apikey: formData.whatsapp_apikey,
        whatsapp_base_url: formData.whatsapp_base_url,
      } as any);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações da WhatsApp API atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="WhatsApp" icon={MessageSquare} />}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        <h1 className="text-2xl font-bold">WhatsApp</h1>
      </div>

      <p className="text-muted-foreground">
        Configure a integração do WhatsApp para comunicação com seus clientes e gerenciamento de disparos automáticos.
      </p>

      <Tabs defaultValue="disparador" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="disparador">Disparador</TabsTrigger>
          <TabsTrigger value="api" disabled={!isMasterUser}>
            {isMasterUser ? "API" : "API (Restrito)"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disparador" className="space-y-6">
          {/* WhatsApp Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      WhatsApp
                      {isWhatsAppConnected ? (
                        <Badge variant="default">Conectado</Badge>
                      ) : organization?.whatsapp_instance_name ? (
                        <Badge variant="secondary">Conexão Criada</Badge>
                      ) : (
                        <Badge variant="secondary">Desconectado</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Conecte seu WhatsApp para enviar mensagens automáticas aos seus clientes
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Funcionalidades:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Confirmação automática após agendamentos</li>
                  <li>• Lembretes de consulta com 2h de antecedência</li>
                  <li>• Avaliação de atendimento após serviço realizado</li>
                  <li>• Mensagens de aniversário</li>
                  <li>• Mensagem após 15 dias de um serviço realizado (Follow-Up)</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                {!organization?.whatsapp_instance_name ? (
                  <Button 
                    onClick={connectWhatsApp}
                    disabled={isConnecting || !organization}
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {isConnecting ? "Criando..." : "Criar Conexão"}
                  </Button>
                ) : !isWhatsAppConnected ? (
                  <Button 
                    onClick={handleGenerateQRCode}
                    variant="default"
                    disabled={isGeneratingQR}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {isGeneratingQR ? "Gerando..." : "Gerar QR Code"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerateQRCode}
                    variant="outline"
                    disabled
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    WhatsApp Conectado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          {showQRCode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Conectar WhatsApp
                  </CardTitle>
                  <Button
                    onClick={handleCloseQRCode}
                    variant="outline"
                    size="sm"
                  >
                    Fechar
                  </Button>
                </div>
                <CardDescription>
                  Escaneie o QR Code com seu WhatsApp para conectar
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {pairingCode && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Código de pareamento: <span className="font-mono">{pairingCode}</span>
                    </p>
                  </div>
                )}
                
                {qrCodeImage && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border-2 border-green-500 rounded-lg shadow-lg">
                      <img 
                        src={qrCodeImage} 
                        alt="QR Code WhatsApp" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Abra o WhatsApp → Menu → Dispositivos conectados → Conectar um dispositivo
                  </p>
                  <p className="text-green-600 font-medium">
                    QR Code atualiza automaticamente a cada 30 segundos
                  </p>
                  <p className="text-green-600 font-bold">
                    Próxima atualização em: {countdown}s
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {!isMasterUser ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-destructive" />
                </div>
                <CardTitle className="text-xl">Acesso Restrito</CardTitle>
                <CardDescription>
                  Esta seção está disponível apenas para usuários master.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Esta configuração afeta a integração com WhatsApp de toda a organização. 
                  Certifique-se de inserir as credenciais corretas da API.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Credenciais da API
                  </CardTitle>
                  <CardDescription>
                    Configure os dados de acesso à API para funcionalidades do WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_instance_name">Nome da Instância</Label>
                      <Input
                        id="whatsapp_instance_name"
                        name="whatsapp_instance_name"
                        type="text"
                        value={formData.whatsapp_instance_name}
                        onChange={handleInputChange}
                        placeholder="Ex: minha-instancia"
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        O nome da instância configurada na API.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_apikey">API Key</Label>
                      <Input
                        id="whatsapp_apikey"
                        name="whatsapp_apikey"
                        type="password"
                        value={formData.whatsapp_apikey}
                        onChange={handleInputChange}
                        placeholder="Sua API Key da Evolution"
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        A chave de API fornecida pela API WHATSAPP para autenticação.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_base_url">URL Base da API</Label>
                      <Input
                        id="whatsapp_base_url"
                        name="whatsapp_base_url"
                        type="url"
                        value={formData.whatsapp_base_url}
                        onChange={handleInputChange}
                        placeholder="https://api.onebots.com.br"
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        A URL base da API que será usada nos webhooks e chamadas da API.
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Informações de Integração
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• URL Base da API: <code className="text-xs bg-muted px-1 py-0.5 rounded">{formData.whatsapp_base_url || "https://api.onebots.com.br"}</code></p>
                      <p>• Webhook configurado automaticamente com base nos dados acima</p>
                      <p>• Certifique-se de que a instância está ativa na API WHATSAPP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Whatsapp;