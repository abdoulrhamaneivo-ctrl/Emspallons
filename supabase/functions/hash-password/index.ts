// Edge Function pour hasher un mot de passe avec bcrypt
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

    const { password } = requestData

    // Validation
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe est requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Hash le mot de passe avec bcryptjs (version compatible Deno)
    try {
      // Utiliser bcryptjs via esm.sh avec import spécifique pour Deno
      const bcryptModule = await import('https://esm.sh/bcryptjs@2.4.3?target=deno&no-check')
      
      // Accéder au module bcryptjs
      // esm.sh peut exporter de différentes manières
      let bcrypt
      if (bcryptModule.default) {
        // Export par défaut
        bcrypt = bcryptModule.default
      } else if (bcryptModule.genSaltSync) {
        // Exports nommés directement
        bcrypt = bcryptModule
      } else {
        // Essayer d'accéder directement
        bcrypt = bcryptModule
      }
      
      // Vérifier que les fonctions existent
      const genSaltFn = bcrypt?.genSaltSync || bcryptModule?.genSaltSync
      const hashFn = bcrypt?.hashSync || bcryptModule?.hashSync
      
      if (!genSaltFn || !hashFn) {
        console.error('Bcrypt module keys:', Object.keys(bcryptModule))
        console.error('Bcrypt object keys:', bcrypt ? Object.keys(bcrypt) : 'bcrypt is null')
        throw new Error('Fonctions bcrypt non disponibles. Module: ' + JSON.stringify(Object.keys(bcryptModule || {})))
      }
      
      const salt = genSaltFn(10)
      const hash = hashFn(password, salt)

      return new Response(
        JSON.stringify({ hash }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (bcryptError) {
      console.error('Bcrypt error details:', {
        message: bcryptError.message,
        stack: bcryptError.stack,
        name: bcryptError.name,
      })
      return new Response(
        JSON.stringify({ error: 'Erreur lors du hash du mot de passe: ' + bcryptError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in hash-password function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors du traitement de la requête' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
