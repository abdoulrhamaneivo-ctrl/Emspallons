// Edge Function pour créer un utilisateur avec envoi d'email de confirmation
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
    const { email, nom, password, role } = await req.json()

    // Validation
    if (!email || !nom || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis (email, nom, password, role)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Vérifier que l'email n'existe pas déjà
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser.users.some((u) => u.email === email)

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Cet email est déjà utilisé' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Créer l'utilisateur avec email confirmé automatiquement (pas de vérification email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ✅ Confirmer automatiquement l'email (pas de vérification nécessaire)
      user_metadata: {
        nom,
      },
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Erreur lors de la création de l\'utilisateur')
    }

    // Créer le profil dans la table profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          nom,
          role,
        },
      ])

    if (profileError) {
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    // Préparer la réponse
    const responseData: any = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        nom,
        role,
      },
      message: 'Utilisateur créé avec succès. Email confirmé automatiquement.',
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la création de l\'utilisateur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

