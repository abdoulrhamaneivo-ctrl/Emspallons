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
    // ⚠️ IMPORTANT : Supabase nécessite une configuration SMTP pour envoyer des emails
    // Voir GUIDE_CONFIGURATION_EMAIL_SUPABASE.md pour la configuration
    let emailSent = false
    let emailError = null
    let confirmationLink = null

    try {
      // Méthode 1 : Utiliser resend pour envoyer l'email de confirmation
      const { data: resendData, error: resendError } = await supabaseAdmin.auth.admin.resend({
        type: 'signup',
        email,
      })

      if (resendError) {
        console.warn('⚠️ Erreur resend (SMTP peut ne pas être configuré):', resendError.message)
        emailError = resendError.message
        
        // Méthode 2 : Essayer avec generateLink pour obtenir le lien
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
        })
        
        if (linkError) {
          console.warn('⚠️ Erreur generateLink:', linkError.message)
          emailError = `Resend: ${resendError.message}, GenerateLink: ${linkError.message}`
        } else {
          confirmationLink = linkData.properties.action_link
          console.log('✅ Lien de confirmation généré (email peut ne pas être envoyé automatiquement)')
          console.log('🔗 Lien:', confirmationLink)
        }
      } else {
        emailSent = true
        console.log('✅ Email de confirmation envoyé avec succès à:', email)
      }
    } catch (emailErr) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', emailErr)
      emailError = emailErr.message || 'Erreur inconnue'
    }

    // Préparer la réponse avec les informations d'email
    const responseData: any = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        nom,
        role,
      },
    }

    if (emailSent) {
      responseData.message = 'Utilisateur créé. Un email de confirmation a été envoyé.'
    } else {
      responseData.message = 'Utilisateur créé, mais l\'email de confirmation n\'a pas pu être envoyé.'
      responseData.warning = 'Configuration SMTP requise. Voir GUIDE_CONFIGURATION_EMAIL_SUPABASE.md'
      if (emailError) {
        responseData.email_error = emailError
      }
      if (confirmationLink) {
        responseData.confirmation_link = confirmationLink
        responseData.note = 'Vous pouvez utiliser ce lien pour confirmer manuellement l\'email de l\'utilisateur.'
      } else {
        responseData.note = 'Vous pouvez confirmer l\'email manuellement dans Supabase Dashboard (Auth → Users).'
      }
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

