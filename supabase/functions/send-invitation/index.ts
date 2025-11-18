import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  inviterName: string;
  selectedServices: string[];
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      email, 
      role, 
      organizationId, 
      organizationName, 
      inviterName,
      selectedServices,
      workingHours 
    }: InviteRequest = await req.json();

    console.log('Processing invitation for:', email, 'to organization:', organizationName);

    // Generate invite token
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Store invitation in database first
    const { error: insertError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        organization_id: organizationId,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        invited_by: inviterName,
        configuration: {
          services: selectedServices,
          workingHours: workingHours
        }
      });

    if (insertError) {
      console.error('Error storing invitation:', insertError);
      throw new Error('Failed to store invitation');
    }

    console.log('Invitation stored successfully with token:', inviteToken);

    // Use Supabase Auth to invite user
    // This will send an email using Supabase's built-in email service
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${req.headers.get('origin')}/convite/${inviteToken}`,
        data: {
          organization_id: organizationId,
          organization_name: organizationName,
          role: role,
          inviter_name: inviterName,
          invite_token: inviteToken
        }
      }
    );

    if (authError) {
      console.error('Error sending auth invitation:', authError);
      
      // If auth invitation fails, we can still create a manual invitation process
      // The user can access the system via the stored invitation token
      console.log('Auth invitation failed, but invitation is stored in database');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Convite criado com sucesso! O usuário pode acessar através do link de convite.',
        inviteToken,
        warning: 'Email automático não pôde ser enviado, mas o convite está ativo.'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("Invitation sent successfully via Supabase Auth:", authData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Convite enviado com sucesso!',
      inviteToken,
      authInvitation: authData
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro interno do servidor ao processar convite'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);