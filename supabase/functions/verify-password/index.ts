// Edge Function pour vérifier un mot de passe avec bcrypt
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    const { password, hash } = requestData

    // Validation
    if (!password || !hash) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe et hash requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Vérifier le mot de passe avec bcryptjs (version compatible Deno)
    try {
      // Utiliser bcryptjs via esm.sh avec import spécifique pour Deno
      const bcryptModule = await import('https://esm.sh/bcryptjs@2.4.3?target=deno&no-check')
      
      // Accéder au module bcryptjs
      let bcrypt
      if (bcryptModule.default) {
        bcrypt = bcryptModule.default
      } else if (bcryptModule.compareSync) {
        bcrypt = bcryptModule
      } else {
        bcrypt = bcryptModule
      }
      
      // Vérifier que les fonctions existent
      const compareFn = bcrypt?.compareSync || bcryptModule?.compareSync
      
      if (!compareFn) {
        console.error('Bcrypt module keys:', Object.keys(bcryptModule))
        console.error('Bcrypt object keys:', bcrypt ? Object.keys(bcrypt) : 'bcrypt is null')
        throw new Error('Fonction compareSync non disponible. Module: ' + JSON.stringify(Object.keys(bcryptModule || {})))
      }
      
      const isValid = compareFn(password, hash)

      return new Response(
        JSON.stringify({ valid: isValid }),
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
        JSON.stringify({ error: 'Erreur lors de la vérification du mot de passe: ' + bcryptError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in verify-password function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors du traitement de la requête' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
