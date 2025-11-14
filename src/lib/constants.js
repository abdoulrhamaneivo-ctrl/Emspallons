// Constantes de prix
export const PRIX_MENSUEL = 12500 // FCFA

// Période de grâce en jours
export const PERIODE_GRACE = 5 // jours

// Statuts de paiement (doivent correspondre au schéma SQL)
export const STATUTS_PAIEMENT = {
  ACTIF: 'ACTIF',
  EN_RETARD: 'EN_RETARD',
  EXPIRE: 'EXPIRE',
  HORS_SERVICE: 'HORS_SERVICE',
}

// Lignes de bus
export const LIGNES_BUS = {
  YOPOUGON: 'Yopougon',
  ANGRE_BINGERVILLE: 'Angré/Bingerville',
  ABOBO: 'Abobo',
}

// Liste des lignes pour les selects
export const LIGNES_BUS_LIST = [
  LIGNES_BUS.YOPOUGON,
  LIGNES_BUS.ANGRE_BINGERVILLE,
  LIGNES_BUS.ABOBO,
]

// Rôles utilisateurs
export const ROLES = {
  ADMIN: 'admin',
  EDUCATOR: 'educator',
  CONTROLLER: 'controller',
}

// Liste des rôles
export const ROLES_LIST = [
  { value: ROLES.ADMIN, label: 'Administrateur' },
  { value: ROLES.EDUCATOR, label: 'Éducateur' },
  { value: ROLES.CONTROLLER, label: 'Contrôleur' },
]

// Statuts de scan
export const STATUTS_SCAN = {
  APPROVED: 'approved',
  DUPLICATE: 'duplicate',
  EXPIRED: 'expired',
  WRONG_LINE: 'wrong_line',
}

// Statuts QR Code
export const STATUTS_QR_CODE = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
}

// Statuts étudiants
export const STATUTS_ETUDIANT = {
  ACTIF: 'actif',
  INACTIF: 'inactif',
  SUSPENDU: 'suspendu',
}

// Statuts de présence
export const STATUTS_PRESENCE = {
  PRESENT: 'present',
  ABSENT: 'absent',
  RETARD: 'retard',
}

// Messages d'erreur
export const ERROR_MESSAGES = {
  GENERIC: 'Une erreur est survenue. Veuillez réessayer.',
  NETWORK: 'Erreur de connexion. Vérifiez votre connexion internet.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  NOT_FOUND: 'Ressource non trouvée.',
  VALIDATION: 'Les données fournies ne sont pas valides.',
}

// Messages de succès
export const SUCCESS_MESSAGES = {
  CREATED: 'Créé avec succès.',
  UPDATED: 'Mis à jour avec succès.',
  DELETED: 'Supprimé avec succès.',
  SAVED: 'Enregistré avec succès.',
}

