/**
 * Service de données - Abstraction du backend pour les requêtes de données
 */

import { apiClient } from '../apiClient'
import logger from '../../logger'

class DataService {
  constructor() {
    this.supabase = apiClient.getSupabaseClient()
  }

  /**
   * Requête générique avec retry
   */
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

      // Appliquer les filtres
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

      // Trier
      if (orderBy) {
        const { column, ascending = true } = orderBy
        query = query.order(column, { ascending })
      }

      // Limiter
      if (limit) {
        query = query.limit(limit)
      }

      // Exécuter avec retry
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

  /**
   * Insérer des données
   */
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

  /**
   * Mettre à jour des données
   */
  async update(table, filters, data, options = {}) {
    const { timeout = 30000 } = options

    try {
      let query = this.supabase.from(table).update(data)

      // Appliquer les filtres
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

  /**
   * Supprimer des données
   */
  async delete(table, filters, options = {}) {
    const { timeout = 30000 } = options

    try {
      let query = this.supabase.from(table).delete()

      // Appliquer les filtres
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

  /**
   * S'abonner aux changements en temps réel
   */
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

export const dataService = new DataService()
export default dataService

