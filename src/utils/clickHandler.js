/**
 * Utilitaire pour gérer les clics de manière compatible (mouse + touch)
 */

/**
 * Crée un handler de clic compatible avec mouse et touch
 * @param {Function} handler - Fonction à appeler au clic
 * @param {Object} options - Options (preventDefault, stopPropagation, etc.)
 * @returns {Function} Handler de clic compatible
 */
export const createClickHandler = (handler, options = {}) => {
  const {
    preventDefault = true,
    stopPropagation = false,
    allowDoubleClick = false,
  } = options

  let lastClickTime = 0
  const DOUBLE_CLICK_DELAY = 300 // ms

  return (e) => {
    // Prévenir le double clic sur mobile si nécessaire
    if (!allowDoubleClick) {
      const now = Date.now()
      if (now - lastClickTime < DOUBLE_CLICK_DELAY) {
        if (preventDefault) e.preventDefault()
        if (stopPropagation) e.stopPropagation()
        return
      }
      lastClickTime = now
    }

    // Prévenir les comportements par défaut
    if (preventDefault) {
      e.preventDefault()
    }
    if (stopPropagation) {
      e.stopPropagation()
    }

    // Appeler le handler
    if (handler) {
      handler(e)
    }
  }
}

/**
 * Crée un handler de touch compatible
 * @param {Function} handler - Fonction à appeler au touch
 * @param {Object} options - Options
 * @returns {Object} Handlers touch
 */
export const createTouchHandler = (handler, options = {}) => {
  const {
    preventDefault = true,
    stopPropagation = false,
  } = options

  let touchStartTime = 0
  const TAP_DELAY = 300 // ms

  const handleTouchStart = (e) => {
    touchStartTime = Date.now()
    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()
  }

  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartTime
    
    // Si le touch est trop long, c'est probablement un scroll ou un long press
    if (touchDuration > TAP_DELAY) {
      return
    }

    if (preventDefault) e.preventDefault()
    if (stopPropagation) e.stopPropagation()

    if (handler) {
      // Créer un événement compatible avec onClick
      const syntheticEvent = {
        ...e,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        currentTarget: e.currentTarget,
        target: e.target,
      }
      handler(syntheticEvent)
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * Crée un handler combiné (onClick + touch) pour une compatibilité maximale
 * @param {Function} handler - Fonction à appeler
 * @param {Object} options - Options
 * @returns {Object} Handlers combinés
 */
export const createUniversalClickHandler = (handler, options = {}) => {
  const clickHandler = createClickHandler(handler, options)
  const touchHandlers = createTouchHandler(handler, options)

  return {
    onClick: clickHandler,
    ...touchHandlers,
  }
}

