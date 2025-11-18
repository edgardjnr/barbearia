import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogIn, UserPlus, CalendarDays, Briefcase, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PublicSignupModal } from "@/components/PublicSignupModal";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/phoneUtils";

interface ClientData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface StepProps {
  onNext: () => void;
  onPrevious?: () => void;
}

interface ClientStepProps extends StepProps {
  clientData: ClientData;
  onClientDataChange: (data: ClientData) => void;
  isLoggedIn: boolean;
}

interface DateStepProps extends StepProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

interface ServiceStepProps extends StepProps {
  services: Service[];
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
}

interface ProfessionalStepProps extends StepProps {
  members: Member[];
  selectedProfessional: string;
  onProfessionalChange: (memberId: string) => void;
  selectedDate: string;
  selectedService: string;
  availableMembers: Member[];
  hasAvailableMembers: boolean;
}

interface TimeSlotData {
  available: string[];
  all: Array<{time: string, available: boolean}>;
}

interface TimeStepProps extends StepProps {
  availableSlots: string[] | TimeSlotData;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

// Step 1: Dados do Cliente
const ClientStep = ({ clientData, onClientDataChange, onNext, isLoggedIn }: ClientStepProps) => {
  const { user } = useAuth();
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleInputChange = (field: keyof ClientData, value: string) => {
    let processedValue = value;
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    onClientDataChange({ ...clientData, [field]: processedValue });
  };

  const isFormValid = () => {
    return clientData.name.trim() && 
           clientData.email.trim() && 
           clientData.phone.trim();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dados Pessoais
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Etapa 1 de 5 - Informe seus dados ou faça login
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {isLoggedIn && user && (
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <User className="h-4 w-4" />
              <span className="font-medium">Logado como: {user.email}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              value={clientData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={clientData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={clientData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={clientData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={onNext} 
            disabled={!isFormValid()}
            className="min-w-32"
          >
            Próximo
          </Button>
        </div>

        <PublicSignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onContinueWithoutSignup={() => setShowSignupModal(false)}
          organizationName="Estabelecimento"
        />
      </CardContent>
    </Card>
  );
};

// Step 2: Data do Serviço
const DateStep = ({ selectedDate, onDateChange, onNext, onPrevious }: DateStepProps) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Data do Agendamento
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Etapa 2 de 5 - Escolha a data desejada
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="date">Selecione a data *</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={today}
            className="w-full"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedDate}
            className="min-w-32"
          >
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 3: Serviço
const ServiceStep = ({ services, selectedService, onServiceChange, onNext, onPrevious }: ServiceStepProps) => {
  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Escolha o Serviço
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Etapa 3 de 5 - Selecione o serviço desejado
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedService === service.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onServiceChange(service.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.duration_minutes} min
                    </span>
                    {service.price && (
                      <span className="font-medium text-foreground">
                        {formatPrice(service.price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedService === service.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedService}
            className="min-w-32"
          >
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 4: Profissional
const ProfessionalStep = ({ 
  members, 
  selectedProfessional, 
  onProfessionalChange, 
  onNext, 
  onPrevious,
  selectedDate,
  selectedService,
  availableMembers,
  hasAvailableMembers
}: ProfessionalStepProps) => {
  
  // Se não há membros disponíveis, mostrar mensagem de erro
  if (!hasAvailableMembers) {
    return (
      <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Escolha o Profissional
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Etapa 4 de 5 - Selecione o profissional disponível
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-destructive/5 border-destructive/20">
            <div className="text-center">
              <h3 className="font-medium text-destructive mb-2">
                Nenhum profissional disponível
              </h3>
              <p className="text-sm text-muted-foreground">
                Não há mais horários disponíveis para este serviço na data selecionada. 
                Por favor, volte e tente outra data ou serviço.
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrevious}>
              Voltar
            </Button>
            <Button disabled className="min-w-32">
              Próximo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se há apenas um profissional disponível, não mostrar opção "sem preferência"
  const showNoPreference = availableMembers.length > 1;

  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Escolha o Profissional
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Etapa 4 de 5 - Selecione o profissional disponível
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {showNoPreference && (
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedProfessional === 'no-preference'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onProfessionalChange('no-preference')}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Sem preferência</h3>
                  <p className="text-sm text-muted-foreground">
                    Qualquer profissional disponível
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedProfessional === 'no-preference'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`} />
              </div>
            </div>
          )}

          {availableMembers.map((member) => (
            <div
              key={member.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedProfessional === member.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onProfessionalChange(member.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={member.profiles?.avatar_url} 
                      alt={member.profiles?.display_name || 'Profissional'}
                    />
                    <AvatarFallback className="text-sm">
                      {member.profiles?.display_name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {member.profiles?.display_name || 'Profissional'}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role === 'employee' ? 'Funcionário' : 
                       member.role === 'manager' ? 'Gerente' : 
                       member.role === 'owner' ? 'Proprietário' : 
                       member.role}
                    </p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedProfessional === member.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!selectedProfessional}
            className="min-w-32"
          >
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 5: Horário e Observações
const TimeStep = ({ 
  availableSlots, 
  selectedTime, 
  onTimeChange, 
  notes, 
  onNotesChange,
  onNext, 
  onPrevious,
  onSubmit,
  submitting 
}: TimeStepProps) => {
  // Separar horários disponíveis e indisponíveis
  const availableTimeSlots = Array.isArray(availableSlots) 
    ? availableSlots.filter((slot: any) => typeof slot === 'string')
    : (availableSlots as TimeSlotData)?.available || [];
  
  const allTimeSlots = Array.isArray(availableSlots) 
    ? []
    : (availableSlots as TimeSlotData)?.all || [];
  return (
    <Card className="w-full max-w-2xl mx-auto" style={{ backgroundColor: '#f0f2f5' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horário e Observações
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Etapa 5 de 5 - Escolha o horário e adicione observações
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Horários disponíveis *</Label>
          {(allTimeSlots.length === 0 && availableTimeSlots.length === 0) ? (
            <p className="text-sm text-muted-foreground p-4 border rounded-lg">
              Nenhum horário disponível para a data e profissional selecionados.
              Volte e tente outra combinação.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(allTimeSlots.length > 0 ? allTimeSlots : availableTimeSlots).map((slot: any) => {
                const timeString = typeof slot === 'string' ? slot : slot.time;
                const isAvailable = typeof slot === 'string' ? true : slot.available;
                
                return (
                  <Button
                    key={timeString}
                    variant={selectedTime === timeString ? "default" : "outline"}
                    size="sm"
                    onClick={() => isAvailable ? onTimeChange(timeString) : null}
                    disabled={!isAvailable}
                    className={`h-10 relative ${
                      !isAvailable 
                        ? 'opacity-50 cursor-not-allowed line-through text-muted-foreground' 
                        : ''
                    }`}
                  >
                    {timeString}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-muted-foreground/50" />
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Alguma observação especial para o atendimento..."
            rows={3}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Voltar
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={!selectedTime || submitting || availableTimeSlots.length === 0}
            className="min-w-32"
          >
            {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export {
  ClientStep,
  DateStep,
  ServiceStep,
  ProfessionalStep,
  TimeStep
};

export type {
  ClientData,
  StepProps,
  ClientStepProps,
  DateStepProps,
  ServiceStepProps,
  ProfessionalStepProps,
  TimeStepProps
};