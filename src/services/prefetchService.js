import { supabase } from '../lib/supabase'
import logger from '../lib/logger'
import { CACHE_KEYS, setCache } from '../lib/dataCache'

const STUDENT_FIELDS = `
  id,
  nom,
  prenom,
  classe,
  niveau,
  contact,
  statut_paiement,
  months_ledger,
  ligne_id,
  qr_code_token,
  qr_code_status,
  created_at,
  lines:ligne_id (
    id,
    nom,
    couleur
  )
`

const PAYMENT_FIELDS = `
  id,
  student_id,
  montant_total,
  montant_mensuel,
  nombre_mois,
  date_debut,
  date_fin,
  created_at,
  students:student_id (
    id,
    nom,
    prenom
  )
`

export async function prefetchCriticalData() {
  try {
    const [studentsRes, paymentsRes] = await Promise.all([
      supabase
        .from('students')
        .select(STUDENT_FIELDS)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('payments')
        .select(PAYMENT_FIELDS)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (studentsRes.data) {
      setCache(CACHE_KEYS.STUDENTS, studentsRes.data)
    }

    if (paymentsRes.data) {
      setCache(CACHE_KEYS.PAYMENTS, paymentsRes.data)
    }
  } catch (error) {
    logger.warn('Prefetch critical data failed', { error: error?.message })
  }
}


