// Edge Function pour mettre à jour un utilisateur
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
    const { userId, nom, password, role } = await req.json()

    // Validation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId est requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (nom) updateData.user_metadata = { nom }
    if (password) updateData.password = password

    // Mettre à jour l'utilisateur dans auth.users
    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
      if (authError) throw authError
    }

    // Mettre à jour le profil dans la table profiles
    const profileUpdate: any = {}
    if (nom) profileUpdate.nom = nom
    if (role) profileUpdate.role = role

    if (Object.keys(profileUpdate).length > 0) {
      profileUpdate.updated_at = new Date().toISOString()
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)

      if (profileError) throw profileError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error updating user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la mise à jour de l\'utilisateur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})


