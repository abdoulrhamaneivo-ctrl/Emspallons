/**
 * Point d'entrée principal pour l'API
 * Exporte tous les services et le client API
 */

export { apiClient, default as ApiClient } from './apiClient'
export { authService, default as AuthService } from './services/authService'
export { dataService, default as DataService } from './services/dataService'

// Export par défaut pour faciliter l'import
export default {
  client: apiClient,
  auth: authService,
  data: dataService
}

