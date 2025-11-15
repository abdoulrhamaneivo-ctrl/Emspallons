// Edge Function pour réinitialiser le mot de passe d'un utilisateur
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!

    // Créer le client Supabase avec SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Récupérer les données de la requête
    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Données JSON invalides' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { userId, newPassword, sendEmail } = requestData

    // Validation
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId et newPassword sont requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Vérifier que l'utilisateur existe
    const { data: userData, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userCheckError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur introuvable' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Mettre à jour le mot de passe
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw updateError
    }

    // Si sendEmail est true, envoyer un email (optionnel, à implémenter si nécessaire)
    if (sendEmail) {
      // TODO: Implémenter l'envoi d'email avec le nouveau mot de passe
      // Pour l'instant, on log juste
      console.log('Email sending requested for password reset to:', userData.user.email)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
        user: {
          id: updateData.user.id,
          email: updateData.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la réinitialisation du mot de passe' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})


