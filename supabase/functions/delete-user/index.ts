// Edge Function pour supprimer un utilisateur
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

    const { userId } = requestData

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

    // Vérifier que l'utilisateur existe et n'est pas un admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError) {
      // Si le profil n'existe pas, on peut quand même essayer de supprimer l'utilisateur auth
      console.warn('Profile not found, attempting to delete auth user:', profileError)
    } else if (profile?.role === 'admin') {
      return new Response(
        JSON.stringify({ error: 'Impossible de supprimer un administrateur' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Vérifier que l'utilisateur existe dans auth.users
    const { data: userData, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userCheckError) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur introuvable' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Supprimer l'utilisateur (le profil sera supprimé automatiquement via CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      throw deleteError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Utilisateur supprimé avec succès',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la suppression de l\'utilisateur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

