/**
 * Patch global console methods en production pour éviter l'exposition
 * accidentelle de données sensibles tout en conservant un accès aux
 * implémentations originales pour le logger centralisé.
 */

const isBrowser = typeof window !== 'undefined'

if (isBrowser) {
  const globalConsole = window.console

  if (!window.__ORIGINAL_CONSOLE__) {
    window.__ORIGINAL_CONSOLE__ = {
      log: globalConsole.log?.bind(globalConsole),
      info: globalConsole.info?.bind(globalConsole),
      warn: globalConsole.warn?.bind(globalConsole),
      error: globalConsole.error?.bind(globalConsole),
      debug: globalConsole.debug?.bind(globalConsole),
    }
  }

  if (import.meta.env.PROD) {
    const noop = () => {}
    const suppressedMethods = ['log', 'info', 'debug']

    suppressedMethods.forEach((method) => {
      if (globalConsole[method]) {
        globalConsole[method] = noop
      }
    })

    // Préserver les avertissements en les taggant clairement
    if (globalConsole.warn) {
      globalConsole.warn = (...args) => {
        window.__ORIGINAL_CONSOLE__?.warn?.('[WARN - filtré]', ...args)
      }
    }
  }
}


