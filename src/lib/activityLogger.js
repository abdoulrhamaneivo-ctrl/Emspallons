import { supabase } from './supabase'

/**
 * Service de logging des activités
 * Enregistre toutes les actions importantes sur la plateforme
 */

/**
 * Log une activité dans activity_logs
 * @param {Object} params - Paramètres du log
 * @param {string} params.action - Action effectuée (ex: 'create_student', 'update_payment')
 * @param {string} params.entityType - Type d'entité (ex: 'student', 'payment', 'controller')
 * @param {string} params.entityId - ID de l'entité concernée
 * @param {Object} params.details - Détails supplémentaires (JSON)
 * @param {string} params.userId - ID de l'utilisateur (optionnel, récupéré automatiquement)
 */
export const logActivity = async ({
  action,
  entityType = null,
  entityId = null,
  details = {},
  userId = null,
}) => {
  try {
    // Récupérer l'utilisateur actuel si non fourni
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id || null
    }

    // Récupérer les infos de l'utilisateur pour les détails
    if (currentUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nom, email, role')
        .eq('id', currentUserId)
        .single()

      if (profile) {
        details.user_name = profile.nom
        details.user_email = profile.email
        details.user_role = profile.role
      }
    }

    // Récupérer IP et User Agent (si disponible côté client)
    const ipAddress = details.ip_address || null
    const userAgent = navigator?.userAgent || null

    // Insérer le log
    const { error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: currentUserId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ])

    if (error) {
      console.error('Erreur lors du logging:', error)
      // Ne pas bloquer l'application si le logging échoue
    }
  } catch (error) {
    console.error('Erreur lors du logging d\'activité:', error)
    // Ne pas bloquer l'application si le logging échoue
  }
}

/**
 * Actions prédéfinies pour la cohérence
 */
export const ACTIONS = {
  // Étudiants
  CREATE_STUDENT: 'create_student',
  UPDATE_STUDENT: 'update_student',
  DELETE_STUDENT: 'delete_student',
  REGENERATE_QR_STUDENT: 'regenerate_qr_student',
  REVOKE_QR_STUDENT: 'revoke_qr_student',
  
  // Paiements
  CREATE_PAYMENT: 'create_payment',
  UPDATE_PAYMENT: 'update_payment',
  DELETE_PAYMENT: 'delete_payment',
  GENERATE_RECEIPT: 'generate_receipt',
  
  // Contrôleurs
  CREATE_CONTROLLER: 'create_controller',
  UPDATE_CONTROLLER: 'update_controller',
  DELETE_CONTROLLER: 'delete_controller',
  RESET_CONTROLLER_PASSWORD: 'reset_controller_password',
  
  // Utilisateurs
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  PROMOTE_TO_ADMIN: 'promote_to_admin',
  RESET_USER_PASSWORD: 'reset_user_password',
  
  // Classes
  CREATE_CLASS: 'create_class',
  UPDATE_CLASS: 'update_class',
  DELETE_CLASS: 'delete_class',
  
  // Niveaux
  CREATE_NIVEAU: 'create_niveau',
  UPDATE_NIVEAU: 'update_niveau',
  DELETE_NIVEAU: 'delete_niveau',
  
  // Lignes
  CREATE_LINE: 'create_line',
  UPDATE_LINE: 'update_line',
  DELETE_LINE: 'delete_line',
  
  // Prix
  UPDATE_DEFAULT_PRICE: 'update_default_price',
  UPDATE_LINE_PRICE: 'update_line_price',
  UPDATE_NIVEAU_PRICE: 'update_niveau_price',
  
  // Scans
  SCAN_QR_CODE: 'scan_qr_code',
  RESET_SCANS_HOUR: 'reset_scans_hour',
  
  // Authentification
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  CONTROLLER_LOGIN: 'controller_login',
  
  // Import/Export
  IMPORT_STUDENTS: 'import_students',
  EXPORT_STUDENTS: 'export_students',
  EXPORT_PAYMENTS: 'export_payments',
  EXPORT_SCANS: 'export_scans',
}

