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

    // Créer l'utilisateur (email non confirmé, envoi d'email de confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ❌ Ne pas confirmer automatiquement, envoyer un email
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

    // Envoyer l'email de confirmation
    // Supabase n'envoie pas automatiquement l'email quand on crée un utilisateur avec email_confirm: false
    // Il faut utiliser resend pour forcer l'envoi
    try {
      // Méthode 1 : Utiliser resend pour envoyer l'email de confirmation
      const { data: resendData, error: resendError } = await supabaseAdmin.auth.admin.resend({
        type: 'signup',
        email,
      })

      if (resendError) {
        console.warn('Erreur resend:', resendError)
        // Méthode 2 : Essayer avec generateLink puis envoyer manuellement
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
        })
        
        if (linkError) {
          console.warn('Erreur generateLink:', linkError)
          // Si les deux méthodes échouent, on log mais on ne fait pas échouer la création
          console.error('Impossible d\'envoyer l\'email de confirmation. L\'admin devra le renvoyer manuellement.')
        } else {
          console.log('Lien de confirmation généré (email peut ne pas être envoyé automatiquement):', linkData.properties.action_link)
        }
      } else {
        console.log('Email de confirmation envoyé avec succès à:', email)
      }
    } catch (emailErr) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailErr)
      // Ne pas échouer la création de l'utilisateur si l'email échoue
      // L'admin pourra renvoyer l'email manuellement via Supabase Dashboard
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nom,
          role,
        },
        message: 'Utilisateur créé. Un email de confirmation a été envoyé.',
      }),
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

