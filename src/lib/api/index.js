/**
 * Point d'entrée principal pour l'API
 * Exporte tous les services et le client API
 */

// Importer apiClient en premier
import { apiClient } from './apiClient'
import { supabase } from '../supabase'
import { getUserProfileWithRole, invalidateProfileCache } from '../supabase'
import logger from '../logger'

// Exporter apiClient
export { apiClient, default as ApiClient } from './apiClient'

// AuthService
class AuthService {
  constructor() {
    this.supabase = apiClient.getSupabaseClient()
  }

  async getSession() {
    try {
      return await apiClient.execute(() => this.supabase.auth.getSession())
    } catch (error) {
      logger.error('Error getting session', error)
      throw error
    }
  }

  async signIn(email, password) {
    try {
      return await apiClient.execute(() => 
        this.supabase.auth.signInWithPassword({ email, password })
      )
    } catch (error) {
      logger.error('Error signing in', error)
      throw error
    }
  }

  async signOut() {
    try {
      const result = await apiClient.execute(() => this.supabase.auth.signOut())
      
      // Invalider le cache
      const { data: { session } } = await this.getSession()
      if (session?.user?.id) {
        invalidateProfileCache(session.user.id)
      }
      
      return result
    } catch (error) {
      logger.error('Error signing out', error)
      throw error
    }
  }

  async refreshSession() {
    try {
      return await apiClient.execute(() => this.supabase.auth.refreshSession())
    } catch (error) {
      logger.error('Error refreshing session', error)
      throw error
    }
  }

  async getUserProfileWithRole(userId) {
    try {
      return await getUserProfileWithRole(userId)
    } catch (error) {
      logger.error('Error getting user profile', error)
      throw error
    }
  }

  onAuthStateChange(callback) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

// DataService
class DataService {
  constructor() {
    this.supabase = apiClient.getSupabaseClient()
  }

  async query(table, options = {}) {
    const {
      select = '*',
      filters = [],
      orderBy = null,
      limit = null,
      single = false,
      timeout = 30000
    } = options

    try {
      let query = this.supabase.from(table).select(select)

      filters.forEach(filter => {
        const { column, operator, value } = filter
        if (operator === 'eq') {
          query = query.eq(column, value)
        } else if (operator === 'neq') {
          query = query.neq(column, value)
        } else if (operator === 'gt') {
          query = query.gt(column, value)
        } else if (operator === 'gte') {
          query = query.gte(column, value)
        } else if (operator === 'lt') {
          query = query.lt(column, value)
        } else if (operator === 'lte') {
          query = query.lte(column, value)
        } else if (operator === 'like') {
          query = query.like(column, value)
        } else if (operator === 'ilike') {
          query = query.ilike(column, value)
        } else if (operator === 'in') {
          query = query.in(column, value)
        } else if (operator === 'is') {
          query = query.is(column, value)
        }
      })

      if (orderBy) {
        const { column, ascending = true } = orderBy
        query = query.order(column, { ascending })
      }

      if (limit) {
        query = query.limit(limit)
      }

      const requestFn = single 
        ? () => query.single()
        : () => query

      const result = await apiClient.execute(requestFn, { timeout })
      
      if (result.error) {
        throw result.error
      }

      return result
    } catch (error) {
      logger.error(`Error querying ${table}`, error)
      throw error
    }
  }

  async insert(table, data, options = {}) {
    const { timeout = 30000 } = options

    try {
      const result = await apiClient.execute(
        () => this.supabase.from(table).insert(data),
        { timeout }
      )

      if (result.error) {
        throw result.error
      }

      return result
    } catch (error) {
      logger.error(`Error inserting into ${table}`, error)
      throw error
    }
  }

  async update(table, filters, data, options = {}) {
    const { timeout = 30000 } = options

    try {
      let query = this.supabase.from(table).update(data)

      filters.forEach(filter => {
        const { column, operator, value } = filter
        if (operator === 'eq') {
          query = query.eq(column, value)
        } else if (operator === 'in') {
          query = query.in(column, value)
        }
      })

      const result = await apiClient.execute(() => query, { timeout })

      if (result.error) {
        throw result.error
      }

      return result
    } catch (error) {
      logger.error(`Error updating ${table}`, error)
      throw error
    }
  }

  async delete(table, filters, options = {}) {
    const { timeout = 30000 } = options

    try {
      let query = this.supabase.from(table).delete()

      filters.forEach(filter => {
        const { column, operator, value } = filter
        if (operator === 'eq') {
          query = query.eq(column, value)
        } else if (operator === 'in') {
          query = query.in(column, value)
        }
      })

      const result = await apiClient.execute(() => query, { timeout })

      if (result.error) {
        throw result.error
      }

      return result
    } catch (error) {
      logger.error(`Error deleting from ${table}`, error)
      throw error
    }
  }

  subscribe(table, filters, callback) {
    const channel = this.supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()

    return {
      unsubscribe: () => {
        this.supabase.removeChannel(channel)
      }
    }
  }
}

// S'assurer que apiClient est bien chargé avant d'instancier les services
// En utilisant une fonction pour retarder l'instanciation
function createAuthService() {
  return new AuthService()
}

function createDataService() {
  return new DataService()
}

// Instancier les services
export const authService = createAuthService()
export const dataService = createDataService()

// Export par défaut
export default {
  client: apiClient,
  auth: authService,
  data: dataService
}

