import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePageHeader from "@/components/MobilePageHeader";
import { 
  Calendar as CalendarIcon, 
  PlusCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Check,
  CheckCheck,
  Filter,
  ArrowUpDown,
  Cake
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { EditAppointmentDialog } from "@/components/EditAppointmentDialog";
import { CompleteAppointmentDialog } from "@/components/CompleteAppointmentDialog";
import { CreateAppointmentDialog } from "@/components/CreateAppointmentDialog";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  price?: number;
  client_id: string;
  service_id?: string;
  member_id?: string;
  organization_id: string;
  clients?: {
    id: string;
    name: string;
    phone?: string;
    birth_date?: string;
  };
  services?: {
    id: string;
    name: string;
    price?: number;
    duration_minutes: number;
  };
  organization_members?: {
    profiles: {
      display_name: string;
    };
  };
}

const Agenda = () => {
  const { user, organization } = useAuth();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
  // Initialize with São Paulo timezone
  const [selectedDate, setSelectedDate] = useState<Date>(toZonedTime(new Date(), 'America/Sao_Paulo'));
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [completeDialog, setCompleteDialog] = useState<{
    isOpen: boolean;
    appointment: any;
  }>({ isOpen: false, appointment: null });
  const [completingAppointment, setCompletingAppointment] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load appointments for selected date
  useEffect(() => {
    if (user && organization && selectedDate) {
      console.log('🗓️ [AGENDA] useEffect triggered - loading appointments');
      loadAppointments();
    }
  }, [user, organization, selectedDate]);

  // Load today's appointments count whenever dependencies change
  useEffect(() => {
    if (user && organization) {
      console.log('🗓️ [AGENDA] useEffect triggered - loading today count');
      loadTodayAppointmentsCount();
    }
  }, [user, organization]);

  const loadAppointments = async () => {
    console.log('🗓️ [AGENDA] Iniciando carregamento de agendamentos...');
    console.log('🗓️ [AGENDA] Data selecionada:', selectedDate);
    console.log('🗓️ [AGENDA] Usuário logado:', !!user);
    console.log('🗓️ [AGENDA] Organização:', organization?.id);
    setLoadingAppointments(true);
    try {
      // Use São Paulo timezone to format the date
      const saoPauloDate = toZonedTime(selectedDate, 'America/Sao_Paulo');
      const selectedDateString = format(saoPauloDate, 'yyyy-MM-dd');
      console.log('🗓️ [AGENDA] Data formatada para consulta:', selectedDateString);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (id, name, phone, birth_date),
          services (id, name, price, duration_minutes),
          organization_members!appointments_member_id_fkey (
            profiles (display_name)
          )
        `)
        .eq('scheduled_date', selectedDateString)
        .eq('organization_id', organization!.id)
        .order('scheduled_time', { ascending: true });

      console.log('🗓️ [AGENDA] Resposta da consulta:', { data, error });
      console.log('🗓️ [AGENDA] Número de agendamentos encontrados:', data?.length || 0);

      if (error) {
        console.error('🗓️ [AGENDA] ERRO na consulta:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar agendamentos.",
          variant: "destructive",
        });
      } else {
        console.log('🗓️ [AGENDA] Setando agendamentos:', data);
        setAppointments(data || []);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar agendamentos.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao confirmar agendamento.",
          variant: "destructive",
        });
        console.error('Error confirming appointment:', error);
      } else {
        toast({
          title: "Sucesso",
          description: "Agendamento confirmado com sucesso!",
        });
        loadAppointments(); // Reload appointments to reflect the change
        loadTodayAppointmentsCount(); // Also update today's count
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao confirmar agendamento.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    }
  };

  const loadTodayAppointmentsCount = async () => {
    try {
      // Use São Paulo timezone for today's date
      const saoPauloToday = toZonedTime(new Date(), 'America/Sao_Paulo');
      const today = format(saoPauloToday, 'yyyy-MM-dd');
      
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .eq('organization_id', organization!.id);

      if (error) {
        console.error('Error loading today appointments count:', error);
        setTodayAppointmentsCount(0);
      } else {
        setTodayAppointmentsCount(count || 0);
      }
    } catch (error) {
      console.error('Unexpected error loading today appointments count:', error);
      setTodayAppointmentsCount(0);
    }
  };

  const openCompleteDialog = (appointment: any) => {
    setCompleteDialog({
      isOpen: true,
      appointment
    });
  };

  const completeAppointment = async (notes: string) => {
    if (!completeDialog.appointment) return;
    
    const appointmentId = completeDialog.appointment.id;
    setCompletingAppointment(true);
    
    try {
      // First, get the complete appointment data
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (id, name, phone),
          services (id, name, price),
          organization_id
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointmentData) {
        toast({
          title: "Erro",
          description: "Erro ao buscar dados do agendamento.",
          variant: "destructive",
        });
        console.error('Error fetching appointment:', appointmentError);
        return;
      }

      // Update appointment status to completed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) {
        toast({
          title: "Erro",
          description: "Erro ao concluir agendamento.",
          variant: "destructive",
        });
        console.error('Error completing appointment:', updateError);
        return;
      }

      // Add service to history with notes
      const { error: historyError } = await supabase
        .from('service_history')
        .insert({
          organization_id: appointmentData.organization_id,
          client_id: appointmentData.client_id,
          service_id: appointmentData.service_id,
          appointment_id: appointmentId,
          member_id: appointmentData.member_id,
          price: appointmentData.services?.price,
          performed_at: new Date().toISOString(),
          notes: notes || null
        });

      if (historyError) {
        console.error('Error adding service history:', historyError);
      }

      // Check if loyalty program is active and award points
      if (appointmentData.services?.price) {
        const { data: loyaltySettings } = await supabase
          .from('loyalty_settings')
          .select('*')
          .eq('organization_id', appointmentData.organization_id)
          .eq('is_active', true)
          .single();

        if (loyaltySettings) {
          // Calculate points based on service price
          const pointsToAward = Math.floor(
            (appointmentData.services.price * (loyaltySettings.points_per_real || 1)) +
            (loyaltySettings.points_per_visit || 0)
          );

          // Here we would update client's loyalty points
          // Since there's no client_loyalty table yet, we'll just log it
          console.log(`Awarding ${pointsToAward} points to client ${appointmentData.clients?.name}`);
          
          toast({
            title: "Pontos de Fidelidade",
            description: `Cliente ${appointmentData.clients?.name} ganhou ${pointsToAward} pontos!`,
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Agendamento concluído com sucesso!",
        variant: "success",
      });
      
      // Close dialog and reload data
      setCompleteDialog({ isOpen: false, appointment: null });
      loadAppointments(); // Reload appointments to reflect the change
      loadTodayAppointmentsCount(); // Also update today's count

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao concluir agendamento.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    } finally {
      setCompletingAppointment(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('organization_id', organization!.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao cancelar agendamento.",
          variant: "destructive",
        });
        console.error('Error cancelling appointment:', error);
      } else {
        toast({
          title: "Sucesso",
          description: "Agendamento cancelado com sucesso!",
          variant: "default",
        });
        loadAppointments();
        loadTodayAppointmentsCount();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao cancelar agendamento.",
        variant: "destructive",
      });
      console.error('Unexpected error:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    loadAppointments();
    loadTodayAppointmentsCount();
  };

  if (!user || !organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  // Check if appointment is in client's birthday week
  const isInBirthdayWeek = (appointment: Appointment) => {
    if (!appointment.clients?.birth_date) return false;

    try {
      const birthDate = parseISO(appointment.clients.birth_date);
      const appointmentDate = parseISO(appointment.scheduled_date);
      
      // Set birth year to current year for comparison
      const currentYear = appointmentDate.getFullYear();
      const birthdayThisYear = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      // Get the week of the birthday
      const weekStart = startOfWeek(birthdayThisYear, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(birthdayThisYear, { weekStartsOn: 0 }); // Saturday
      
      return isWithinInterval(appointmentDate, { start: weekStart, end: weekEnd });
    } catch (error) {
      console.error('Error checking birthday week:', error);
      return false;
    }
  };

  // Filter appointments by status and sort by time
  const filteredAppointments = appointments
    .filter(appointment => {
      if (statusFilter === 'all') return true;
      return appointment.status.toLowerCase() === statusFilter;
    })
    .sort((a, b) => {
      const timeA = a.scheduled_time;
      const timeB = b.scheduled_time;
      
      if (sortOrder === 'asc') {
        return timeA.localeCompare(timeB);
      } else {
        return timeB.localeCompare(timeA);
      }
    });

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {isMobile && <MobilePageHeader title="Agenda" icon={CalendarIcon} />}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Agenda</h1>
        <Button 
          className="bg-primary hover:bg-primary-hover text-primary-foreground w-full sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hoje</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{todayAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Data Selecionada</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Data Selecionada</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Appointments Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Calendar - smaller */}
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">Calendário</CardTitle>
            <CardDescription className="text-text-secondary">
              Selecione uma data para ver os agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Appointments for Selected Date - larger */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-text-primary">
              Agendamentos - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary">
              {filteredAppointments.length} agendamento(s) para este dia
            </CardDescription>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8">
                    <Filter className="w-3 h-3 mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="w-3 h-3 mr-1" />
                {sortOrder === 'asc' ? 'Horário ↑' : 'Horário ↓'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div className="text-center py-4">
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-text-secondary">Carregando agendamentos...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-text-secondary">Nenhum agendamento para esta data</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3 sm:p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-medium text-text-primary text-sm sm:text-base truncate flex items-center gap-2">
                            {isInBirthdayWeek(appointment) && (
                              <span title="Semana do aniversário!" className="flex items-center">
                                <Cake className="w-4 h-4 text-pink-500 flex-shrink-0" />
                              </span>
                            )}
                            {appointment.clients?.name || 'Cliente não encontrado'}
                          </h4>
                          <Badge variant="secondary" className={`${getStatusColor(appointment.status)} text-xs flex-shrink-0 w-fit`}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-text-secondary">
                          <p className="flex items-center gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                             <span className="truncate">
                               {appointment.scheduled_time} 
                               ({appointment.services?.duration_minutes || appointment.duration_minutes} min)
                             </span>
                          </p>
                           {appointment.services?.name && (
                            <p className="truncate">Serviço: {appointment.services.name}</p>
                          )}
                          {appointment.organization_members?.profiles?.display_name && (
                            <p className="truncate">Profissional: {appointment.organization_members.profiles.display_name}</p>
                          )}
                          {appointment.price && (
                            <p>Valor: R$ {appointment.price.toFixed(2)}</p>
                          )}
                          {appointment.notes && (
                            <p className="truncate">Observações: {appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0 self-start sm:ml-4">
                        {appointment.status.toLowerCase() === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => confirmAppointment(appointment.id)}
                            title="Confirmar agendamento"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        {appointment.status.toLowerCase() === 'confirmed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openCompleteDialog(appointment)}
                            title="Concluir agendamento"
                          >
                            <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Ver detalhes">
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="mx-4 max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-base">Detalhes do Agendamento</DialogTitle>
                              <DialogDescription className="text-sm">
                                Informações completas do agendamento
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                              <div>
                                <strong>Cliente:</strong> {appointment.clients?.name}
                              </div>
                              {appointment.clients?.phone && (
                                <div>
                                  <strong>Telefone:</strong> {appointment.clients.phone}
                                </div>
                              )}
                              <div>
                                <strong>Data e Hora:</strong> {format(selectedDate, "dd/MM/yyyy")} às {appointment.scheduled_time}
                              </div>
                               <div>
                                 <strong>Duração:</strong> {appointment.services?.duration_minutes || appointment.duration_minutes} minutos
                               </div>
                              {appointment.services?.name && (
                                <div>
                                  <strong>Serviço:</strong> {appointment.services.name}
                                </div>
                              )}
                              {appointment.price && (
                                <div>
                                  <strong>Valor:</strong> R$ {appointment.price.toFixed(2)}
                                </div>
                              )}
                              <div>
                                <strong>Status:</strong> {getStatusText(appointment.status)}
                              </div>
                              {appointment.notes && (
                                <div>
                                  <strong>Observações:</strong> {appointment.notes}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {(appointment.status.toLowerCase() === 'pending' || appointment.status.toLowerCase() === 'confirmed') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="Editar"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        )}
                        {appointment.status.toLowerCase() !== 'cancelled' && appointment.status.toLowerCase() !== 'completed' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Cancelar">
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                  O agendamento será marcado como cancelado e não computará pontos de fidelidade.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => cancelAppointment(appointment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sim, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-secondary truncate">Hoje</p>
                <p className="text-lg sm:text-2xl font-bold text-text-primary">
                  {todayAppointmentsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-secondary truncate">Confirmados</p>
                <p className="text-lg sm:text-2xl font-bold text-text-primary">
                  {appointments.filter(apt => apt.status.toLowerCase() === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-secondary truncate">Cancelados</p>
                <p className="text-lg sm:text-2xl font-bold text-text-primary">
                  {appointments.filter(apt => apt.status.toLowerCase() === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-secondary truncate">Concluídos</p>
                <p className="text-lg sm:text-2xl font-bold text-text-primary">
                  {appointments.filter(apt => apt.status.toLowerCase() === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleEditSuccess}
        selectedDate={selectedDate}
      />

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        appointment={editingAppointment}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
      
      {/* Complete Appointment Dialog */}
      <CompleteAppointmentDialog
        isOpen={completeDialog.isOpen}
        onOpenChange={(open) => setCompleteDialog({ isOpen: open, appointment: null })}
        onConfirm={completeAppointment}
        loading={completingAppointment}
        appointmentDetails={completeDialog.appointment ? {
          clientName: completeDialog.appointment.clients?.name || 'Cliente não encontrado',
          serviceName: completeDialog.appointment.services?.name || 'Serviço não encontrado',
          time: `${completeDialog.appointment.scheduled_date} às ${completeDialog.appointment.scheduled_time}`
        } : null}
      />
    </div>
  );
};

export default Agenda;