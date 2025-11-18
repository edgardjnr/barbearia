import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/contexts/AuthContext";
import { Mail, User, Clock, Briefcase } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export function InviteCollaboratorDialog({ open, onOpenChange }: InviteCollaboratorDialogProps) {
  const { toast } = useToast();
  const { organization, userRole } = useAuth();
  
  // Basic info state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [isInviting, setIsInviting] = useState(false);
  
  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  
  useEffect(() => {
    if (open && organization) {
      loadServices();
      initializeWorkingHours();
    }
  }, [open, organization]);

  const loadServices = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const initializeWorkingHours = () => {
    const initialHours = DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      start_time: '09:00',
      end_time: '18:00',
      is_active: day.value >= 1 && day.value <= 5, // Mon-Fri by default
    }));
    setWorkingHours(initialHours);
  };

  const updateWorkingHour = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev => prev.map(hour => 
      hour.day_of_week === dayOfWeek ? { ...hour, [field]: value } : hour
    ));
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  const handleSubmit = async () => {
    if (!email?.trim() || !displayName?.trim() || !organization?.id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome e email na aba 'Informações Básicas'.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      // Nova lógica: criar usuário automaticamente ao invés de enviar convite
      console.log('Creating user automatically:', { email, displayName, role });
      console.log('Organization ID:', organization.id);
      console.log('About to call edge function...');
      
      // 1. Chamar edge function para criar usuário e enviar email de redefinição
      const { data: createUserResult, error: createUserError } = await supabase.functions.invoke(
        'create-user-and-invite', 
        {
          body: {
            email: email.trim(),
            displayName: displayName.trim(),
            role,
            organizationId: organization.id,
            services: selectedServices,
            workingHours: workingHours.filter(h => h.is_active)
          }
        }
      );

      console.log('Edge function completed');
      console.log('Edge function response:', { createUserResult, createUserError });

      if (createUserError) {
        console.error('Edge function error:', createUserError);
        throw createUserError;
      }

      if (createUserResult?.error) {
        console.error('Edge function returned error:', createUserResult.error);
        throw new Error(createUserResult.error);
      }

      // Show success message based on the response
      const successMessage = createUserResult?.message || `${displayName} foi cadastrado com sucesso.`;
      
      toast({
        title: "Colaborador cadastrado com sucesso!",
        description: successMessage,
        variant: "success",
      });

      // Reset form
      setEmail("");
      setDisplayName("");
      setRole("employee");
      setSelectedServices([]);
      initializeWorkingHours();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating user:', error);
      
      let errorMessage = "Erro inesperado ao cadastrar colaborador.";
      
      // Check if it's a Supabase function error
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cadastrar Novo Colaborador
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo colaborador e configure seus serviços e horários. Um email será enviado para o colaborador definir sua senha.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="schedule">Horários</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Dados do Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome Completo *</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Nome completo do colaborador"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colaborador@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Permissão *</Label>
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="employee">Funcionário</SelectItem>
                      {userRole === 'owner' && <SelectItem value="admin">Administrador</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Serviços Oferecidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum serviço cadastrado. Cadastre serviços primeiro para associá-los ao colaborador.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={(checked) => 
                            handleServiceToggle(service.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor={service.id} className="text-sm font-medium">
                            {service.name}
                          </Label>
                          {service.description && (
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            <span>{service.duration_minutes} min</span>
                            {service.price && <span>R$ {service.price.toFixed(2)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const hour = workingHours.find(h => h.day_of_week === day.value);
                  if (!hour) return null;

                  return (
                    <div key={day.value} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Switch
                          checked={hour.is_active}
                          onCheckedChange={(checked) => 
                            updateWorkingHour(day.value, 'is_active', checked)
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium">{day.label}</Label>
                      </div>
                      {hour.is_active && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">De:</Label>
                            <Input
                              type="time"
                              value={hour.start_time}
                              onChange={(e) => 
                                updateWorkingHour(day.value, 'start_time', e.target.value)
                              }
                              className="w-28"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Até:</Label>
                            <Input
                              type="time"
                              value={hour.end_time}
                              onChange={(e) => 
                                updateWorkingHour(day.value, 'end_time', e.target.value)
                              }
                              className="w-28"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isInviting}>
            {isInviting ? "Cadastrando..." : "Cadastrar Colaborador"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}