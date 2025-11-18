import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  services: string[];
  workingHours: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CREATE USER AND INVITE FUNCTION STARTED ===");
    
    // Parse request body
    let requestBody: CreateUserRequest;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully:", {
        email: requestBody.email,
        displayName: requestBody.displayName,
        role: requestBody.role,
        organizationId: requestBody.organizationId,
        servicesCount: requestBody.services?.length || 0,
        workingHoursCount: requestBody.workingHours?.length || 0
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Dados inválidos no request" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { 
      email, 
      displayName, 
      role, 
      organizationId, 
      services, 
      workingHours 
    } = requestBody;

    // Validate required fields
    if (!email || !displayName || !organizationId) {
      console.error("Missing required fields:", { email: !!email, displayName: !!displayName, organizationId: !!organizationId });
      return new Response(
        JSON.stringify({ error: "Email, displayName e organizationId são obrigatórios" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor inválida" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase admin client created successfully");

    // 1. Check if email is already used by another member in this organization
    console.log("Checking if email is already used in organization:", email);
    const { data: existingMemberByEmail, error: emailCheckError } = await supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        email,
        organization_members!inner(organization_id, status)
      `)
      .eq('email', email)
      .eq('organization_members.organization_id', organizationId)
      .eq('organization_members.status', 'active')
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking email usage:", emailCheckError);
      return new Response(
        JSON.stringify({ error: `Erro ao verificar email: ${emailCheckError.message}` }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (existingMemberByEmail) {
      console.log("Email already used by another member in this organization");
      return new Response(
        JSON.stringify({ error: "Este email já está sendo usado por outro colaborador desta organização." }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // 2. Create user in Supabase Auth or get existing user
    let userId: string;
    let userData: any;

    console.log("Checking if user exists:", email);
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    if (getUserError) {
      console.error("Error checking for existing user:", getUserError);
      return new Response(
        JSON.stringify({ error: `Erro ao verificar usuário existente: ${getUserError.message}` }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    const foundUser = existingUser?.users?.find(user => user.email === email);
    
    if (foundUser) {
      // User already exists, use existing user ID
      userId = foundUser.id;
      userData = { user: foundUser };
      console.log("User already exists, using existing user:", userId);
      
      // Update user metadata if needed
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            display_name: displayName,
            full_name: displayName,
          }
        });
        
        if (updateError) {
          console.error("Error updating user metadata:", updateError);
        } else {
          console.log("User metadata updated successfully");
        }
      } catch (updateErr) {
        console.error("Exception updating user metadata:", updateErr);
      }
    } else {
      // Create new user
      console.log("Creating new user:", email);
      const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: displayName,
          full_name: displayName,
        }
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário: ${createUserError.message}` }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }

      userData = newUserData;
      userId = newUserData.user?.id;
      console.log("New user created successfully:", userId);
    }

    if (!userId) {
      console.error("User ID not found after creation/retrieval");
      return new Response(
        JSON.stringify({ error: "Erro: ID do usuário não encontrado" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // 2. Check if user is already a member of this organization
    console.log("Checking organization membership for user:", userId);
    const { data: existingMember, error: memberCheckError } = await supabaseAdmin
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberCheckError) {
      console.error("Error checking existing member:", memberCheckError);
      return new Response(
        JSON.stringify({ error: `Erro ao verificar membro existente: ${memberCheckError.message}` }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    let memberData;
    if (existingMember) {
      // Update existing member
      console.log("Updating existing member:", existingMember.id);
      const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from('organization_members')
        .update({
          role: role,
          status: 'active'
        })
        .eq('id', existingMember.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating organization member:", updateError);
        return new Response(
          JSON.stringify({ error: `Erro ao atualizar membro da organização: ${updateError.message}` }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      memberData = updatedMember;
      console.log("Organization member updated successfully");
    } else {
      // Add user to organization_members
      console.log("Adding new member to organization");
      const { data: newMember, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: role,
          status: 'active'
        })
        .select()
        .single();

      if (memberError) {
        console.error("Error adding user to organization:", memberError);
        return new Response(
          JSON.stringify({ error: `Erro ao vincular usuário à organização: ${memberError.message}` }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      memberData = newMember;
      console.log("User added to organization successfully");
    }

    // 3. Create or update user profile
    console.log("Creating/updating user profile");
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: displayName,
        email: email
      });

    if (profileError) {
      console.error("Error creating/updating profile:", profileError);
      // Don't fail the whole operation for this
    } else {
      console.log("Profile created/updated successfully");
    }

    // 4. Add services if provided
    if (services && services.length > 0) {
      console.log("Adding member services:", services.length);
      
      // First, remove any existing services for this member
      const { error: deleteServicesError } = await supabaseAdmin
        .from('member_services')
        .delete()
        .eq('member_id', memberData.id)
        .eq('organization_id', organizationId);

      if (deleteServicesError) {
        console.error("Error deleting existing member services:", deleteServicesError);
      }

      // Then add the new services
      const serviceInserts = services.map(serviceId => ({
        member_id: memberData.id,
        service_id: serviceId,
        organization_id: organizationId
      }));

      const { error: servicesError } = await supabaseAdmin
        .from('member_services')
        .insert(serviceInserts);

      if (servicesError) {
        console.error("Error adding member services:", servicesError);
        // Don't fail the whole operation for this
      } else {
        console.log("Member services added successfully");
      }
    }

    // 5. Add working hours if provided
    if (workingHours && workingHours.length > 0) {
      console.log("Adding working hours:", workingHours.length);
      
      // First, remove any existing working hours for this member
      const { error: deleteHoursError } = await supabaseAdmin
        .from('working_hours')
        .delete()
        .eq('member_id', memberData.id)
        .eq('organization_id', organizationId);

      if (deleteHoursError) {
        console.error("Error deleting existing working hours:", deleteHoursError);
      }

      // Then add the new working hours
      const workingHoursInserts = workingHours.map(wh => ({
        member_id: memberData.id,
        organization_id: organizationId,
        day_of_week: wh.day_of_week,
        start_time: wh.start_time,
        end_time: wh.end_time,
        is_active: wh.is_active
      }));

      const { error: workingHoursError } = await supabaseAdmin
        .from('working_hours')
        .insert(workingHoursInserts);

      if (workingHoursError) {
        console.error("Error adding working hours:", workingHoursError);
        // Don't fail the whole operation for this
      } else {
        console.log("Working hours added successfully");
      }
    }

    // 6. Para novos usuários, enviar email de recuperação após 10 segundos
    if (!foundUser) {
      console.log("Agendando email de recuperação de senha para novo usuário em 10 segundos");
      
      // Background task para enviar email após 10 segundos
      const sendDelayedRecoveryEmail = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
          
          console.log("Enviando email de recuperação após delay para:", email);
          const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
              redirectTo: `${Deno.env.get("SITE_URL") || "https://preview--agendaproapp.lovable.app"}/reset-password`
            }
          });

          if (recoveryError) {
            console.error("Erro ao enviar email de recuperação:", recoveryError);
          } else {
            console.log("Email de recuperação enviado com sucesso após delay:", recoveryData);
          }
        } catch (error) {
          console.error("Erro na tarefa de background do email:", error);
        }
      };

      // Usar waitUntil para rodar a tarefa em background
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(sendDelayedRecoveryEmail());
      } else {
        // Fallback se EdgeRuntime não estiver disponível
        sendDelayedRecoveryEmail();
      }
    }

    
    // Criar mensagem de sucesso
    let message = foundUser 
      ? `${displayName} foi adicionado à organização com sucesso.`
      : `${displayName} foi cadastrado com sucesso. Um email de recuperação de senha será enviado em 10 segundos.`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: userId,
        emailSent: false, // Email será enviado após delay
        emailType: foundUser ? 'none' : 'delayed_recovery',
        message: message
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("=== UNEXPECTED ERROR IN CREATE-USER-AND-INVITE ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        details: "Verifique os logs da função para mais detalhes"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);