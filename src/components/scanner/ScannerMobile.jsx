import { useEffect, useRef, startTransition } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { LogOut, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Précharger ControllerHistory pour éviter pages blanches
let ControllerHistoryPreloaded = false
const preloadControllerHistory = () => {
  if (ControllerHistoryPreloaded) return
  ControllerHistoryPreloaded = true
  import('../../pages/ControllerHistory').catch(() => {
    ControllerHistoryPreloaded = false
  })
}

/**
 * Wrapper pour améliorer le scanner sur mobile
 */
export default function ScannerMobile({ children }) {
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isMobile) return

    // Précharger ControllerHistory au montage
    preloadControllerHistory()

    // Verrouiller l'orientation en mode paysage pour le scanner
    const lockOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape')
        }
      } catch (error) {
        console.log('Orientation lock not supported:', error)
      }
    }

    // Vibration haptique pour feedback
    const vibrate = (pattern = [10]) => {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    }

    // Exposer la fonction de vibration
    window.scannerVibrate = vibrate

    // Lock orientation au montage
    lockOrientation()

    return () => {
      // Déverrouiller l'orientation au démontage
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock()
        }
      } catch (error) {
        console.log('Orientation unlock error:', error)
      }
      delete window.scannerVibrate
    }
  }, [isMobile])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div
      ref={containerRef}
      className="scanner-container fixed inset-0 bg-black z-50"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Zone de scan (plein écran) */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>

      {/* Contrôles en bas (zone safe) */}
      <div className="scanner-controls flex justify-center items-center gap-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Vibration pour feedback
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
            
            // Précharger avant navigation
            preloadControllerHistory()
            
            // Navigation avec startTransition
            startTransition(() => {
              navigate('/scanner/historique')
            })
          }}
          onMouseEnter={preloadControllerHistory}
          className="scanner-button bg-emsp-green hover:bg-emsp-lightGreen active:bg-emsp-green/90 text-white flex items-center justify-center gap-2 touch-manipulation"
          style={{ 
            minWidth: '48px', 
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            cursor: 'pointer'
          }}
          type="button"
          aria-label="Voir l'historique"
        >
          <History size={20} />
          <span className="hidden sm:inline">Historique</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Vibration pour feedback
            if ('vibrate' in navigator) {
              navigator.vibrate(10)
            }
            
            // Nettoyer la session
            sessionStorage.removeItem('controller_session')
            
            // Utiliser startTransition pour navigation fluide
            startTransition(() => {
              // Essayer d'abord de retourner en arrière dans l'historique
              if (window.history.length > 1 && document.referrer) {
                // Retourner en arrière
                window.history.back()
                
                // Fallback: si on est toujours sur la même page après 300ms, forcer la navigation
                setTimeout(() => {
                  if (window.location.pathname === '/scan' || window.location.pathname.startsWith('/scan')) {
                    // Aller à la page d'accueil ou de login
                    navigate('/login', { replace: true })
                  }
                }, 300)
              } else {
                // Pas d'historique, aller à la page de login
                navigate('/login', { replace: true })
              }
            })
          }}
          className="scanner-button bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center gap-2 touch-manipulation"
          style={{ 
            minWidth: '48px', 
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            cursor: 'pointer'
          }}
          type="button"
          aria-label="Retour en arrière"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Retour</span>
        </button>
      </div>
    </div>
  )
}


