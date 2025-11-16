/**
 * Système de logging centralisé pour EMSP Transport
 * - En développement : Log dans la console avec couleurs
 * - En production : Log erreurs critiques + envoie à Sentry (optionnel)
 */

// Configuration
const isDev = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Conserver une référence vers la console d'origine (avant patch)
const globalConsole = (() => {
  if (typeof window !== 'undefined') {
    return window.__ORIGINAL_CONSOLE__ || window.console
  }
  return console
})()

const originalConsole = {
  log: globalConsole?.log ? globalConsole.log.bind(globalConsole) : () => {},
  info: globalConsole?.info ? globalConsole.info.bind(globalConsole) : () => {},
  warn: globalConsole?.warn ? globalConsole.warn.bind(globalConsole) : () => {},
  error: globalConsole?.error ? globalConsole.error.bind(globalConsole) : () => {},
}

// Niveaux de log
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}

// Couleurs pour la console (dev uniquement)
const colors = {
  debug: 'color: #6B7280',
  info: 'color: #3B82F6',
  warn: 'color: #F59E0B',
  error: 'color: #EF4444'
}

class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 100 // Garder les 100 derniers logs en mémoire
  }

  /**
   * Format un message de log
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    return {
      timestamp,
      level,
      message,
      data: data || null,
      stack: level === LogLevel.ERROR ? new Error().stack : null
    }
  }

  /**
   * Stocke le log en mémoire
   */
  storeLog(logEntry) {
    this.logs.push(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Retirer le plus ancien
    }
  }

  /**
   * Log de debug (uniquement en développement)
   */
  debug(message, data) {
    const logEntry = this.formatMessage(LogLevel.DEBUG, message, data)
    this.storeLog(logEntry)

    if (isDev) {
      originalConsole.log(`%c[DEBUG] ${message}`, colors.debug, data || '')
    }
  }

  /**
   * Log d'information
   */
  info(message, data) {
    const logEntry = this.formatMessage(LogLevel.INFO, message, data)
    this.storeLog(logEntry)

    if (isDev) {
      originalConsole.log(`%c[INFO] ${message}`, colors.info, data || '')
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message, data) {
    const logEntry = this.formatMessage(LogLevel.WARN, message, data)
    this.storeLog(logEntry)

    if (isDev) {
      originalConsole.warn(`%c[WARN] ${message}`, colors.warn, data || '')
    } else {
      // En production, logger les warnings importants
      originalConsole.warn(`[WARN] ${message}`)
    }
  }

  /**
   * Log d'erreur (toujours loggé, même en production)
   */
  error(message, error, data) {
    const logEntry = this.formatMessage(LogLevel.ERROR, message, {
      error: error?.message || error,
      stack: error?.stack,
      ...data
    })
    this.storeLog(logEntry)

    // Toujours logger les erreurs
    originalConsole.error(`[ERROR] ${message}`, {
      error,
      data,
      timestamp: logEntry.timestamp
    })

    // En production, envoyer à un service externe (Sentry, etc.)
    if (isProduction) {
      this.sendToExternalService(logEntry)
    }
  }

  /**
   * Envoie les logs à un service externe (Sentry, LogRocket, etc.)
   */
  sendToExternalService(logEntry) {
    // TODO: Intégrer Sentry ou autre service
    // Exemple avec Sentry :
    // if (window.Sentry) {
    //   Sentry.captureException(new Error(logEntry.message), {
    //     level: logEntry.level,
    //     extra: logEntry.data
    //   })
    // }
  }

  /**
   * Récupère tous les logs stockés (pour debug)
   */
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return this.logs
  }

  /**
   * Exporte les logs en JSON (pour support technique)
   */
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emsp-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Nettoie tous les logs
   */
  clear() {
    this.logs = []
  }
}

// Instance singleton
const logger = new Logger()

// Exports
export default logger
export { LogLevel }
