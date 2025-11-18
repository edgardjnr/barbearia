import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { CheckCircle, ArrowLeft, Phone, Mail, MapPin, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhoneNumber, unformatPhoneNumber } from "@/utils/phoneUtils";
import { useAuth } from "@/contexts/AuthContext";
import { PublicPageWrapper } from "@/components/PublicPageWrapper";
import { 
  ClientStep, 
  DateStep, 
  ServiceStep, 
  ProfessionalStep, 
  TimeStep,
  type ClientData 
} from "@/components/PublicBookingSteps";
import { PublicSignupModal } from "@/components/PublicSignupModal";

// Interface definitions
interface TimeSlotData {
  available: string[];
  all: Array<{time: string, available: boolean}>;
}

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

interface MemberService {
  member_id: string;
  service_id: string;
}

const PublicAgendamento = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  
  // Estados principais
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberServices, setMemberServices] = useState<MemberService[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlotData>({ available: [], all: [] });
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [hasAvailableMembers, setHasAvailableMembers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedData, setConfirmedData] = useState<any>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  
  // Estado do stepper
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Estados dos formulários
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    email: '',
    phone: '',
    birthDate: ''
  });
  
  // Carregar dados do usuário logado automaticamente
  useEffect(() => {
    const loadClientData = async () => {
      if (user && organization?.id) {
        console.log('🔍 Debug loadClientData:', { user: !!user, isClient, organizationId: organization?.id });
        
        try {
          // Primeiro, verificar se é um cliente existente na organização
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('name, email, phone, birth_date')
            .eq('email', user.email)
            .eq('organization_id', organization.id)
            .single();
          
          console.log('👤 Client data from clients table:', { clientData, clientError });
          
          if (clientData) {
            // Se encontrou como cliente, usar esses dados (que têm birth_date preenchido)
            const formattedData = {
              name: clientData.name || '',
              email: clientData.email || '',
              phone: clientData.phone ? formatPhoneNumber(clientData.phone) : '',
              birthDate: clientData.birth_date || ''
            };
            console.log('✅ Using client data:', formattedData);
            setClientData(formattedData);
          } else {
            // Se não é cliente, buscar dados do perfil do usuário
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('display_name, phone, birth_date')
              .eq('user_id', user.id)
              .single();
            
            console.log('📋 Profile data:', { profile, error });
            
            if (profile) {
              const newClientData = {
                name: profile.display_name || '',
                email: user.email || '',
                phone: profile.phone ? formatPhoneNumber(profile.phone) : '',
                birthDate: profile.birth_date || ''
              };
              console.log('✅ Using profile data:', newClientData);
              setClientData(newClientData);
            } else {
              // Se não houver perfil, usar apenas email do auth
              setClientData({
                name: user.user_metadata?.display_name || user.user_metadata?.name || '',
                email: user.email || '',
                phone: user.user_metadata?.phone ? formatPhoneNumber(user.user_metadata.phone) : '',
                birthDate: user.user_metadata?.birth_date || ''
              });
            }
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados do cliente:', error);
          // Em caso de erro, usar dados do auth
          setClientData({
            name: user.user_metadata?.display_name || user.user_metadata?.name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone ? formatPhoneNumber(user.user_metadata.phone) : '',
            birthDate: user.user_metadata?.birth_date || ''
          });
        }
      }
    };
    
    loadClientData();
  }, [user, isClient, organization?.id]);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  // Função para normalizar slug
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

  // Carregar dados da organização
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        // Buscar organização pelo slug usando função segura
        const { data: orgData, error: orgError } = await supabase
          .rpc('get_safe_organization_info', { org_slug: slug });

        const matchingOrg = orgData && orgData.length > 0 ? orgData[0] : null;

        if (matchingOrg) {
          setOrganization(matchingOrg);
          
          // Buscar serviços usando função RPC segura
          const { data: servicesData } = await supabase
            .rpc('get_public_services', { org_id: matchingOrg.id });
          setServices(servicesData || []);
          
          // Buscar membros usando função RPC segura
          const { data: profilesData } = await supabase
            .rpc('get_public_member_profiles', { org_id: matchingOrg.id });

          // Buscar dados dos membros usando função RPC segura
          const { data: membersData } = await supabase
            .rpc('get_public_organization_members', { org_id: matchingOrg.id });

          // Combinar dados dos membros com profiles seguros
          const combinedMembers = membersData?.map(member => ({
            ...member,
            profiles: profilesData?.find(profile => profile.user_id === member.user_id) || null
          })).filter(member => member.profiles) || [];

          setMembers(combinedMembers);
          
          // Buscar horários de trabalho usando função RPC segura
          const { data: workingHoursData } = await supabase
            .rpc('get_public_working_hours', { org_id: matchingOrg.id });
          setWorkingHours(workingHoursData || []);

          // Buscar serviços dos membros usando função RPC segura
          const { data: memberServicesData } = await supabase
            .rpc('get_public_member_services', { org_id: matchingOrg.id });
          setMemberServices(memberServicesData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationData();
  }, [slug]);

  // Filtrar membros que têm o serviço selecionado e estão disponíveis na data
  const getFilteredMembersForDateAndService = async () => {
    if (!selectedService || !selectedDate || !organization) {
      return [];
    }
    
    // Primeiro verificar se há serviços associados a membros
    const hasAnyMemberService = memberServices.length > 0;
    
    let serviceMembers;
    if (hasAnyMemberService) {
      // Filtrar membros que oferecem o serviço selecionado
      serviceMembers = members.filter(member => {
        const hasService = memberServices.some(ms => 
          ms.member_id === member.id && ms.service_id === selectedService
        );
        return hasService;
      });
      
      // Se nenhum membro específico oferece o serviço, retornar array vazio
      // (não considerar todos os membros quando há configuração específica)
      if (serviceMembers.length === 0) {
        return [];
      }
    } else {
      // Se não há configuração de serviços por membro, todos podem fazer todos os serviços
      serviceMembers = members;
    }
    
    // Verificar quais membros têm disponibilidade na data selecionada
    const availableMembers = [];
    
    for (const member of serviceMembers) {
      const hasAvailability = await checkMemberAvailabilityForDate(member.id);
      if (hasAvailability) {
        availableMembers.push(member);
      }
    }
    
    return availableMembers;
  };

  // Verificar se um membro tem disponibilidade na data selecionada
  const checkMemberAvailabilityForDate = async (memberId: string) => {
    if (!selectedDate || !organization) return false;

    try {
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();

      // Verificar se o membro tem horário de trabalho neste dia usando função RPC segura
      const { data: allWorkingHours } = await supabase
        .rpc('get_public_working_hours', { org_id: organization.id });
      
      const workingHours = allWorkingHours?.filter(wh => 
        wh.member_id === memberId && wh.day_of_week === dayOfWeek
      );

      if (!workingHours || workingHours.length === 0) {
        return false;
      }

      // Verificar se não está bloqueado o dia todo usando função RPC segura
      const { data: allBlocks } = await supabase
        .rpc('get_public_schedule_blocks', { 
          org_id: organization.id,
          start_date: selectedDate,
          end_date: selectedDate
        });
      
      const blocks = allBlocks?.filter(block => 
        block.member_id === memberId && block.is_all_day
      );

      if (blocks && blocks.length > 0) {
        return false;
      }

      // Calcular se há pelo menos um slot disponível
      const service = services.find(s => s.id === selectedService);
      const serviceDuration = service?.duration_minutes || 30;

      for (const workingHour of workingHours) {
        const [startHour, startMinute] = workingHour.start_time.split(':').map(Number);
        const [endHour, endMinute] = workingHour.end_time.split(':').map(Number);
        
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        // Verificar se há pelo menos um slot de 30 minutos disponível
        for (let minutes = startTimeInMinutes; minutes < endTimeInMinutes; minutes += 30) {
          if (minutes + serviceDuration > endTimeInMinutes) {
            continue;
          }

          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Verificar conflitos com agendamentos
          const { data: appointments } = await supabase
            .from('appointments')
            .select('scheduled_time, duration_minutes, services(duration_minutes)')
            .eq('organization_id', organization.id)
            .eq('member_id', memberId)
            .eq('scheduled_date', selectedDate)
            .in('status', ['confirmed', 'pending']);

          let hasConflict = false;
          if (appointments) {
            for (const appointment of appointments) {
              const [aptHour, aptMinute] = appointment.scheduled_time.split(':').map(Number);
              const aptStartMinutes = aptHour * 60 + aptMinute;
              const aptDuration = appointment.services?.duration_minutes || appointment.duration_minutes || 30;
              const aptEndMinutes = aptStartMinutes + aptDuration;

              const newStartMinutes = minutes;
              const newEndMinutes = minutes + serviceDuration;

              const hasOverlap = (newStartMinutes < aptEndMinutes) && (newEndMinutes > aptStartMinutes);
              if (hasOverlap) {
                hasConflict = true;
                break;
              }
            }
          }

          // Verificar bloqueios parciais
          if (!hasConflict) {
            const { data: allPartialBlocks } = await supabase
              .rpc('get_public_schedule_blocks', { 
                org_id: organization.id,
                start_date: selectedDate,
                end_date: selectedDate
              });
            
            const partialBlocks = allPartialBlocks?.filter(block => 
              block.member_id === memberId && !block.is_all_day
            );

            if (partialBlocks) {
              for (const block of partialBlocks) {
                if (block.start_time && block.end_time) {
                  const [blockStartHour, blockStartMinute] = block.start_time.split(':').map(Number);
                  const [blockEndHour, blockEndMinute] = block.end_time.split(':').map(Number);
                  
                  const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
                  const blockEndMinutes = blockEndHour * 60 + blockEndMinute;
                  
                  const newStartMinutes = minutes;
                  const newEndMinutes = minutes + serviceDuration;
                  
                  const hasBlockOverlap = (newStartMinutes < blockEndMinutes) && (newEndMinutes > blockStartMinutes);
                  if (hasBlockOverlap) {
                    hasConflict = true;
                    break;
                  }
                }
              }
            }
          }

          // Se encontrou pelo menos um slot disponível, retorna true
          if (!hasConflict) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  };

  // Filtrar membros simples (mantido para compatibilidade)
  const getFilteredMembers = () => {
    if (!selectedService) {
      return members;
    }
    
    const filteredMembers = members.filter(member => {
      const hasService = memberServices.some(ms => 
        ms.member_id === member.id && ms.service_id === selectedService
      );
      return hasService;
    });
    
    if (filteredMembers.length === 0) {
      return members;
    }
    
    return filteredMembers;
  };

  // Calcular horários disponíveis e indisponíveis
  const calculateAvailableTimeSlots = async () => {
    if (!selectedDate || !selectedProfessional || !organization) {
      setAvailableTimeSlots({ available: [], all: [] });
      return;
    }

    try {
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();

      // Buscar horários de trabalho usando função RPC segura
      const { data: allWorkingHours } = await supabase
        .rpc('get_public_working_hours', { org_id: organization.id });

      let todayWorkingHours;
      if (selectedProfessional !== 'no-preference') {
        todayWorkingHours = allWorkingHours?.filter(wh => 
          wh.day_of_week === dayOfWeek && wh.member_id === selectedProfessional
        );
      } else {
        // Para 'no-preference', buscar todos os horários disponíveis
        const memberIds = (await getFilteredMembersForDateAndService()).map(m => m.id);
        todayWorkingHours = allWorkingHours?.filter(wh => 
          wh.day_of_week === dayOfWeek && memberIds.includes(wh.member_id)
        );
      }

      if (!todayWorkingHours || todayWorkingHours.length === 0) {
        setAvailableTimeSlots({ available: [], all: [] });
        return;
      }

      // Buscar agendamentos existentes usando função RPC segura
      console.log('🔍 Buscando agendamentos para:', {
        organization_id: organization.id,
        scheduled_date: selectedDate,
        selectedProfessional,
        selectedService
      });

      const memberFilter = selectedProfessional !== 'no-preference' ? selectedProfessional : null;
      
      const { data: todayAppointments } = await supabase
        .rpc('get_public_appointments', {
          org_id: organization.id,
          target_date: selectedDate,
          member_id_filter: memberFilter
        });
      
      console.log('📅 Agendamentos encontrados:', todayAppointments);

      // Buscar bloqueios usando função RPC segura
      const { data: allTodayBlocks } = await supabase
        .rpc('get_public_schedule_blocks', { 
          org_id: organization.id,
          start_date: selectedDate,
          end_date: selectedDate
        });

      let todayBlocks;
      if (selectedProfessional !== 'no-preference') {
        todayBlocks = allTodayBlocks?.filter(block => 
          block.member_id === selectedProfessional
        );
      } else {
        todayBlocks = allTodayBlocks;
      }

      // Obter duração do serviço
      const service = services.find(s => s.id === selectedService);
      const serviceDuration = service?.duration_minutes || 30;

      // Processar todos os horários possíveis
      const allTimeSlots: Array<{time: string, available: boolean}> = [];
      const availableSlots = new Set<string>();

      for (const workingHour of todayWorkingHours) {
        const [startHour, startMinute] = workingHour.start_time.split(':').map(Number);
        const [endHour, endMinute] = workingHour.end_time.split(':').map(Number);

        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        // Gerar slots de 30 em 30 minutos
        for (let minutes = startTimeInMinutes; minutes < endTimeInMinutes; minutes += 30) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Verificar se o serviço cabe no horário de trabalho
          if (minutes + serviceDuration > endTimeInMinutes) {
            continue;
          }

          // Verificar conflitos com agendamentos
          let hasConflict = false;
          if (todayAppointments) {
            for (const appointment of todayAppointments) {
              // Se é profissional específico, só verificar conflitos para esse profissional
              if (selectedProfessional !== 'no-preference') {
                if (appointment.member_id !== selectedProfessional) {
                  continue;
                }
              } else {
                // Se é "sem preferência", verificar conflitos para o profissional atual do horário de trabalho
                if (appointment.member_id !== workingHour.member_id) {
                  continue;
                }
              }

              const [aptHour, aptMinute] = appointment.scheduled_time.split(':').map(Number);
              const aptStartMinutes = aptHour * 60 + aptMinute;
              const aptDuration = appointment.duration_minutes || 30;
              const aptEndMinutes = aptStartMinutes + aptDuration;

              const newStartMinutes = minutes;
              const newEndMinutes = minutes + serviceDuration;

              const hasOverlap = (newStartMinutes < aptEndMinutes) && (newEndMinutes > aptStartMinutes);
              if (hasOverlap) {
                hasConflict = true;
                break;
              }
            }
          }

          // Verificar bloqueios
          let isBlocked = false;
          if (todayBlocks) {
            for (const block of todayBlocks) {
              // Se é profissional específico, só verificar bloqueios para esse profissional
              if (selectedProfessional !== 'no-preference') {
                if (block.member_id !== selectedProfessional) {
                  continue;
                }
              } else {
                // Se é "sem preferência", verificar bloqueios para o profissional atual do horário de trabalho
                if (block.member_id !== workingHour.member_id) {
                  continue;
                }
              }

              if (block.is_all_day) {
                isBlocked = true;
                break;
              } else if (block.start_time && block.end_time) {
                const [blockStartHour, blockStartMinute] = block.start_time.split(':').map(Number);
                const [blockEndHour, blockEndMinute] = block.end_time.split(':').map(Number);
                
                const blockStartMinutes = blockStartHour * 60 + blockStartMinute;
                const blockEndMinutes = blockEndHour * 60 + blockEndMinute;
                
                const newStartMinutes = minutes;
                const newEndMinutes = minutes + serviceDuration;
                
                const hasBlockOverlap = (newStartMinutes < blockEndMinutes) && (newEndMinutes > blockStartMinutes);
                if (hasBlockOverlap) {
                  isBlocked = true;
                  break;
                }
              }
            }
          }

          const isAvailable = !hasConflict && !isBlocked;
          
          console.log('✅ Resultado final para', timeString, ':', {
            hasConflict,
            isBlocked,
            isAvailable,
            workingHourMemberId: workingHour.member_id
          });
          
          // Evitar duplicatas de horários
          if (!allTimeSlots.some(slot => slot.time === timeString)) {
            allTimeSlots.push({ time: timeString, available: isAvailable });
          }

          if (isAvailable) {
            availableSlots.add(timeString);
          }
        }
      }

      // Ordenar horários
      allTimeSlots.sort((a, b) => a.time.localeCompare(b.time));
      
      // Atualizar estado com novo formato que inclui todos os horários
      setAvailableTimeSlots({
        available: Array.from(availableSlots).sort(),
        all: allTimeSlots
      });

    } catch (error) {
      console.error('Erro ao calcular horários:', error);
      setAvailableTimeSlots({ available: [], all: [] });
    }
  };

  // Resetar horário selecionado quando mudar data, profissional ou serviço
  useEffect(() => {
    setSelectedTime('');
    setAvailableTimeSlots({ available: [], all: [] });
  }, [selectedDate, selectedProfessional, selectedService]);

  // Pré-preencher dados se o usuário estiver logado
  useEffect(() => {
    const loadClientData = async () => {
      console.log('🔍 Debug loadClientData:', { user: !!user, isClient, organizationId: organization?.id });
      if (user && organization?.id) {
        // Pré-preencher apenas com dados básicos do usuário (sem acessar tabela clients)
        setClientData({
          name: user.user_metadata?.name || user.user_metadata?.display_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone ? formatPhoneNumber(user.user_metadata.phone) : '',
          birthDate: '' // Não há como acessar dados históricos sem comprometer segurança
        });
      }
    };
    
    loadClientData();
  }, [user, isClient, organization?.id]);

  // Recalcular membros disponíveis quando data ou serviço mudarem
  useEffect(() => {
    const updateAvailableMembers = async () => {
      if (selectedDate && selectedService) {
        const availableMembers = await getFilteredMembersForDateAndService();
        setAvailableMembers(availableMembers);
        setHasAvailableMembers(availableMembers.length > 0);
        
        // Se o profissional selecionado não está mais disponível, resetar
        if (selectedProfessional && selectedProfessional !== 'no-preference') {
          const isStillAvailable = availableMembers.some(m => m.id === selectedProfessional);
          if (!isStillAvailable) {
            setSelectedProfessional('');
          }
        }
        
        // Se há apenas um profissional disponível e nenhum está selecionado, selecionar automaticamente
        if (availableMembers.length === 1 && !selectedProfessional) {
          setSelectedProfessional(availableMembers[0].id);
        }
      } else {
        setAvailableMembers([]);
        setHasAvailableMembers(true);
      }
    };
    
    updateAvailableMembers();
  }, [selectedDate, selectedService, members, memberServices, organization]);

  // Recalcular horários quando necessário
  useEffect(() => {
    calculateAvailableTimeSlots();
  }, [selectedProfessional, selectedDate, workingHours, members, selectedService]);

  // Mostrar modal de signup
  useEffect(() => {
    if (!user && !hasShownModal && organization && !loading) {
      setShowSignupModal(true);
      setHasShownModal(true);
    }
  }, [user, hasShownModal, organization, loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Navegação entre steps
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit do formulário
  const handleSubmit = async () => {
    if (!organization) return;

    setSubmitting(true);
    
    try {
      // Criar ou atualizar cliente usando função segura
      let clientId: string;
      
      const cleanPhone = unformatPhoneNumber(clientData.phone);
      
      // Validar dados obrigatórios
      if (!clientData.name || (!clientData.email && !cleanPhone)) {
        throw new Error('Nome e email ou telefone são obrigatórios para criar o agendamento');
      }

      // Usar função RPC segura para criar/atualizar cliente
      const { data: clientResult, error: clientError } = await supabase
        .rpc('create_or_update_client_safe', {
          org_id: organization.id,
          client_name: clientData.name,
          client_email: clientData.email || null,
          client_phone: cleanPhone || null,
          client_birth_date: clientData.birthDate || null
        });

      if (clientError) {
        console.error('Erro ao processar cliente:', clientError);
        throw clientError;
      }

      if (!clientResult || clientResult.length === 0) {
        throw new Error('Erro ao criar ou atualizar cliente');
      }

      clientId = clientResult[0].client_id;

      // Preparar dados do agendamento
      const appointmentData: any = {
        organization_id: organization.id,
        client_id: clientId,
        service_id: selectedService,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: notes,
        status: 'confirmed',
        member_id: null
      };

      // Atribuir profissional
      if (selectedProfessional && selectedProfessional !== 'no-preference') {
        appointmentData.member_id = selectedProfessional;
      } else if (selectedProfessional === 'no-preference') {
        // Buscar profissional com menos agendamentos
        const { data: allAppointments } = await supabase
          .from('appointments')
          .select('member_id')
          .eq('organization_id', organization.id)
          .eq('scheduled_date', selectedDate)
          .in('status', ['confirmed', 'pending']);

        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const dayOfWeek = selectedDateObj.getDay();
        
        const availableMembers = members.filter(member => {
          return workingHours.some(wh => 
            wh.member_id === member.id && wh.day_of_week === dayOfWeek
          );
        });

        if (availableMembers.length > 0) {
          const appointmentCounts = availableMembers.map(member => {
            const memberAppointments = allAppointments?.filter(apt => apt.member_id === member.id) || [];
            return {
              member,
              appointmentCount: memberAppointments.length
            };
          });

          const memberWithLeastAppointments = appointmentCounts.reduce((min, current) => 
            current.appointmentCount < min.appointmentCount ? current : min
          );

          appointmentData.member_id = memberWithLeastAppointments.member.id;
        }
      }

      // Criar agendamento via Edge Function
      const { data: appointmentResult, error: functionError } = await supabase.functions.invoke('create-appointment', {
        body: appointmentData
      });

      if (functionError) {
        if (functionError.context?.res?.status === 409) {
          setTimeout(() => {
            calculateAvailableTimeSlots();
          }, 100);
          throw new Error('Este horário já foi ocupado. Por favor, selecione outro horário.');
        }
        throw new Error(functionError.message || 'Erro ao processar agendamento');
      }

      if (!appointmentResult?.success) {
        if (appointmentResult?.conflict_type) {
          setTimeout(() => {
            calculateAvailableTimeSlots();
          }, 100);
          throw new Error(appointmentResult.error || 'Este horário já foi ocupado. Por favor, selecione outro horário.');
        }
        throw new Error(appointmentResult?.error || 'Erro ao criar agendamento');
      }
      
      // Salvar dados confirmados
      const selectedServiceObj = services.find(s => s.id === selectedService);
      const selectedMemberObj = members.find(m => m.id === selectedProfessional);
      
      setConfirmedData({
        clientData,
        selectedDate,
        selectedTime,
        selectedService: selectedServiceObj,
        selectedMember: selectedMemberObj,
        notes
      });
      
      setSuccess(true);
      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi criado com sucesso. Entraremos em contato em breve.",
        variant: "success",
      });

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      
      toast({
        title: "Erro",
        description: error.message || "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h1>
            <p className="text-muted-foreground mb-4">
              Seu agendamento foi criado com sucesso. {organization.name} entrará em contato em breve para confirmar.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Detalhes do agendamento:</h3>
              <p><strong>Serviço:</strong> {confirmedData?.selectedService?.name}</p>
              <p><strong>Data:</strong> {confirmedData?.selectedDate ? format(parseISO(confirmedData.selectedDate), "dd/MM/yyyy", { locale: ptBR }) : ''}</p>
              <p><strong>Horário:</strong> {confirmedData?.selectedTime}</p>
              <p><strong>Cliente:</strong> {confirmedData?.clientData?.name}</p>
              {confirmedData?.selectedMember ? (
                <p><strong>Profissional:</strong> {confirmedData.selectedMember.profiles?.display_name || 'Colaborador'}</p>
              ) : (
                <p><strong>Profissional:</strong> A definir automaticamente</p>
              )}
            </div>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full mt-4"
            >
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PublicPageWrapper>
      <div className="min-h-screen px-4 py-4 bg-bg-subtle">
        <div className="max-w-4xl mx-auto">
          {/* Header da empresa */}
          <Card className="mb-6 bg-bg-soft">
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">{organization.name}</h1>
                {organization.description && (
                  <p className="text-muted-foreground mb-4">{organization.description}</p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-muted-foreground">
                  {organization.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {organization.address}
                    </div>
                  )}
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
                </div>
                
                {/* Botão de login para usuários não logados */}
                {!user && (
                  <div className="mt-6 flex justify-center">
                    <MovingBorderButton
                      onClick={() => navigate("/auth")}
                      borderRadius="1.75rem"
                      className="flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Fazer Login
                    </MovingBorderButton>
                  </div>
                )}
                
                {/* Info do usuário logado */}
                {user && isClient && (
                  <div className="mt-4 p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-green-700">
                        Logado como: <strong>{user.email}</strong>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        Sair
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          <div className="mb-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                      i + 1 === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : i + 1 < currentStep
                        ? 'bg-primary/80 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={`w-4 h-1 mx-1 ${
                        i + 1 < currentStep ? 'bg-primary/80' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="min-h-[500px] flex items-start justify-center">
            {currentStep === 1 && (
              <ClientStep
                clientData={clientData}
                onClientDataChange={setClientData}
                onNext={nextStep}
                isLoggedIn={!!user}
              />
            )}

            {currentStep === 2 && (
              <DateStep
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onNext={nextStep}
                onPrevious={prevStep}
              />
            )}

            {currentStep === 3 && (
              <ServiceStep
                services={services}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
                onNext={nextStep}
                onPrevious={prevStep}
              />
            )}

            {currentStep === 4 && (
              <ProfessionalStep
                members={getFilteredMembers()}
                selectedProfessional={selectedProfessional}
                onProfessionalChange={setSelectedProfessional}
                selectedDate={selectedDate}
                selectedService={selectedService}
                availableMembers={availableMembers}
                hasAvailableMembers={hasAvailableMembers}
                onNext={nextStep}
                onPrevious={prevStep}
              />
            )}

            {currentStep === 5 && (
              <TimeStep
                availableSlots={availableTimeSlots}
                selectedTime={selectedTime}
                onTimeChange={setSelectedTime}
                notes={notes}
                onNotesChange={setNotes}
                onNext={nextStep}
                onPrevious={prevStep}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </div>

          {/* Modal de Signup */}
          <PublicSignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            onContinueWithoutSignup={() => setShowSignupModal(false)}
            organizationName={organization.name}
          />
        </div>
      </div>
    </PublicPageWrapper>
  );
};

export default PublicAgendamento;