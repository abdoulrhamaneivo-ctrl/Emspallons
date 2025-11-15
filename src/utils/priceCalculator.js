import { supabase } from '../lib/supabase'
import { PRIX_MENSUEL } from '../lib/constants'

/**
 * Récupère les paramètres de tarification depuis settings
 */
const getPricingSettings = async () => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return data || {
      pricing_by_niveau: false,
      pricing_by_line: false,
    }
  } catch (error) {
    console.error('Erreur récupération settings:', error)
    return {
      pricing_by_niveau: false,
      pricing_by_line: false,
    }
  }
}

/**
 * Récupère le prix d'un niveau par son nom
 */
const getNiveauPrice = async (niveauNom) => {
  if (!niveauNom) return null
  
  try {
    const { data } = await supabase
      .from('niveaux')
      .select('price')
      .eq('nom', niveauNom)
      .single()
    
    return data?.price || null
  } catch (error) {
    console.error('Erreur récupération prix niveau:', error)
    return null
  }
}

/**
 * Récupère le prix d'une ligne
 */
const getLinePrice = async (lineId) => {
  if (!lineId) return null
  
  try {
    const { data } = await supabase
      .from('lines')
      .select('price')
      .eq('id', lineId)
      .single()
    
    return data?.price || null
  } catch (error) {
    console.error('Erreur récupération prix ligne:', error)
    return null
  }
}

/**
 * Calcule le prix mensuel pour un étudiant
 * Priorité : 1. Prix par niveau, 2. Prix par ligne, 3. Prix par défaut
 * 
 * @param {Object} student - Données de l'étudiant
 * @returns {Promise<{price: number, source: string}>}
 */
export const calculatePrice = async (student) => {
  try {
    // Récupérer les paramètres de tarification
    const settings = await getPricingSettings()
    
    // 1. Vérifier si tarification par niveau activée
    if (settings.pricing_by_niveau && student.niveau) {
      const niveauPrice = await getNiveauPrice(student.niveau)
      if (niveauPrice && niveauPrice > 0) {
        return {
          price: niveauPrice,
          source: 'niveau',
        }
      }
    }
    
    // 2. Vérifier si tarification par ligne activée
    if (settings.pricing_by_line && student.ligne_id) {
      const linePrice = await getLinePrice(student.ligne_id)
      if (linePrice && linePrice > 0) {
        return {
          price: linePrice,
          source: 'line',
        }
      }
    }
    
    // 3. Utiliser le prix par défaut
    return {
      price: PRIX_MENSUEL,
      source: 'default',
    }
  } catch (error) {
    console.error('Erreur calcul prix:', error)
    // En cas d'erreur, retourner le prix par défaut
    return {
      price: PRIX_MENSUEL,
      source: 'default',
    }
  }
}

/**
 * Récupère le prix par défaut depuis settings
 */
export const getDefaultPrice = async () => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('default_monthly_fee')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return data?.default_monthly_fee || PRIX_MENSUEL
  } catch (error) {
    console.error('Erreur récupération prix par défaut:', error)
    return PRIX_MENSUEL
  }
}

