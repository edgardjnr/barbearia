import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const Notifications = () => {
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    appointment_reminders: true,
    marketing_emails: false,
  });

  const { toast } = useToast();

  const saveNotificationSettings = async () => {
    setSaving(true);
    try {
      // Here you would save to a notification_settings table
      toast({
        title: "Notificações atualizadas",
        description: "Suas preferências de notificação foram salvas.",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de notificação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Notificações</h1>
        <p className="text-text-secondary">Configure suas preferências de notificação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Escolha como e quando você quer receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-text-primary">
                  Notificações por email
                </Label>
                <p className="text-sm text-text-secondary">
                  Receba notificações importantes por email
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_notifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-text-primary">
                  Notificações por SMS
                </Label>
                <p className="text-sm text-text-secondary">
                  Receba notificações urgentes por SMS
                </p>
              </div>
              <Switch
                checked={notificationSettings.sms_notifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, sms_notifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-text-primary">
                  Lembretes de agendamento
                </Label>
                <p className="text-sm text-text-secondary">
                  Receba lembretes sobre seus próximos agendamentos
                </p>
              </div>
              <Switch
                checked={notificationSettings.appointment_reminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, appointment_reminders: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-base font-medium text-text-primary">
                  Emails promocionais
                </Label>
                <p className="text-sm text-text-secondary">
                  Receba ofertas especiais e novidades por email
                </p>
              </div>
              <Switch
                checked={notificationSettings.marketing_emails}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, marketing_emails: checked })
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={saveNotificationSettings} 
              disabled={saving}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar preferências"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;