import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AppointmentRequest {
  organization_id: string;
  client_id: string;
  service_id: string;
  member_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  status: string;
}

interface OrganizationData {
  name: string;
  whatsapp_instance_name: string;
  whatsapp_base_url: string;
  phone: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Create Appointment Function iniciada');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const appointmentData: AppointmentRequest = await req.json();
    console.log('📋 Dados recebidos:', appointmentData);

    // Validação dos dados obrigatórios
    if (!appointmentData.organization_id || !appointmentData.client_id || 
        !appointmentData.service_id || !appointmentData.scheduled_date || 
        !appointmentData.scheduled_time) {
      throw new Error('Dados obrigatórios faltando');
    }

    // 🔒 VERIFICAÇÃO CRÍTICA DE CONFLITOS
    console.log('🔍 Verificando conflitos para:', {
      organization_id: appointmentData.organization_id,
      member_id: appointmentData.member_id,
      scheduled_date: appointmentData.scheduled_date,
      scheduled_time: appointmentData.scheduled_time
    });

    // Verificar se já existe agendamento neste horário para este profissional
    const { data: existingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id, member_id, scheduled_time, client_id')
      .eq('organization_id', appointmentData.organization_id)
      .eq('scheduled_date', appointmentData.scheduled_date)
      .eq('scheduled_time', appointmentData.scheduled_time)
      .in('status', ['confirmed', 'pending']);

    if (conflictError) {
      console.error('❌ Erro ao verificar conflitos:', conflictError);
      throw new Error('Erro interno ao verificar conflitos');
    }

    console.log('📊 Agendamentos existentes encontrados:', existingAppointments);

    // Se há member_id especificado, verificar conflito para este profissional específico
    if (appointmentData.member_id) {
      const memberConflicts = existingAppointments?.filter(apt => 
        apt.member_id === appointmentData.member_id
      ) || [];
      
      if (memberConflicts.length > 0) {
        console.log('❌ CONFLITO DETECTADO para profissional específico:', memberConflicts);
        return new Response(
          JSON.stringify({ 
            error: 'Este horário já está ocupado para o profissional selecionado. Por favor, escolha outro horário.',
            conflict_type: 'member_busy',
            existing_appointments: memberConflicts
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Verificar se há conflitos gerais (para casos sem preferência de profissional)
    if (existingAppointments && existingAppointments.length > 0) {
      console.log('⚠️ Agendamentos existentes no horário:', existingAppointments);
      
      // Se não há member_id especificado, ainda assim pode ser problemático
      // dependendo de quantos profissionais estão disponíveis
      if (!appointmentData.member_id) {
        console.log('🔍 Verificando disponibilidade geral (sem preferência de profissional)');
        // Aqui poderíamos implementar lógica adicional se necessário
      }
    }

    // 🏢 BUSCAR DADOS DA ORGANIZAÇÃO
    console.log('🏢 Buscando dados da organização...');
    const { data: organizationData, error: orgError } = await supabase
      .from('organizations')
      .select('name, whatsapp_instance_name, whatsapp_base_url, phone')
      .eq('id', appointmentData.organization_id)
      .single();

    if (orgError || !organizationData) {
      console.error('❌ Erro ao buscar dados da organização:', orgError);
      throw new Error('Erro interno ao buscar dados da organização');
    }

    console.log('📋 Dados da organização encontrados:', organizationData);

    // 🟢 CRIAR O AGENDAMENTO
    console.log('✅ Nenhum conflito detectado, criando agendamento...');
    
    // Preparar dados do agendamento com informações da organização
    const appointmentToInsert = {
      ...appointmentData,
      establishment_name: organizationData.name,
      instance: organizationData.whatsapp_instance_name,
      base: organizationData.whatsapp_base_url,
      company_phone: organizationData.phone
    };
    
    const { data: newAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentToInsert)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir agendamento:', insertError);
      
      // Verificar se é erro de conflito único (caso exista constraint)
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'Conflito detectado: já existe um agendamento neste horário.',
            conflict_type: 'unique_violation'
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`Erro ao criar agendamento: ${insertError.message}`);
    }

    console.log('🎉 Agendamento criado com sucesso:', newAppointment);

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointment: newAppointment,
        message: 'Agendamento criado com sucesso!'
      }),
      { 
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Erro na função:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});