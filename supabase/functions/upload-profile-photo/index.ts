import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('No user found')

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }

    // Get current profile to check for existing avatar
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single()

    // Delete old avatar if it exists
    if (profile?.avatar_url) {
      try {
        // Extract the path from the URL
        const urlParts = profile.avatar_url.split('/photo-perfil/')
        if (urlParts.length > 1) {
          const oldPath = urlParts[1]
          await supabaseClient.storage
            .from('photo-perfil')
            .remove([oldPath])
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error)
        // Continue with upload even if delete fails
      }
    }

    // Generate unique filename with user folder structure
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `avatars/${user.id}/${fileName}`

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('photo-perfil')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('photo-perfil')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', user.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatar_url: urlData.publicUrl,
        message: 'Photo uploaded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})