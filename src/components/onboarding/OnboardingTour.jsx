import { useState, useEffect } from 'react'
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TOUR_STORAGE_KEY = 'emsp_onboarding_completed'

export default function OnboardingTour() {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Vérifier si le tour a déjà été complété
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed && (role === 'admin' || role === 'educator')) {
      // Attendre un peu pour que la page se charge
      setTimeout(() => {
        setRun(true)
      }, 1000)
    }
  }, [role])

  // Étapes du tour selon le rôle
  const getSteps = () => {
    if (role === 'admin' || role === 'educator') {
      return [
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Bienvenue sur EMSP Transport ! 🎓
              </h3>
              <p className="text-gray-700">
                Ce guide rapide vous aidera à découvrir les fonctionnalités principales de la plateforme.
              </p>
            </div>
          ),
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="dashboard-stats"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Tableau de bord</h3>
              <p>Voici vos statistiques en temps réel : nombre d'étudiants, paiements, présences...</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="nav-students"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Gestion des étudiants</h3>
              <p>Cliquez ici pour accéder à la liste de tous vos étudiants et gérer leurs informations.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="add-student-btn"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Créer un étudiant</h3>
              <p>Utilisez ce bouton pour ajouter un nouvel étudiant au système.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="student-list"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Liste des étudiants</h3>
              <p>Vos étudiants apparaissent ici avec leur statut de paiement, classe, ligne de car...</p>
            </div>
          ),
          placement: 'top',
        },
        {
          target: '[data-tour="payment-btn"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Enregistrer un paiement</h3>
              <p>Cliquez ici pour enregistrer un paiement et générer automatiquement un reçu.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="nav-history"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Historique</h3>
              <p>Consultez l'historique complet des scans, paiements et activités sur la plateforme.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Fin du guide ! 🎉
              </h3>
              <p className="text-gray-700 mb-4">
                Vous êtes maintenant prêt à utiliser la plateforme EMSP Transport.
              </p>
              <p className="text-sm text-gray-600">
                Vous pouvez relancer ce guide à tout moment depuis le menu d'aide.
              </p>
            </div>
          ),
          placement: 'center',
        },
      ]
    } else if (role === 'controller') {
      return [
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Bienvenue, Contrôleur ! 🎓
              </h3>
              <p className="text-gray-700">
                Ce guide vous explique comment utiliser le scanner QR pour vérifier les étudiants.
              </p>
            </div>
          ),
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="nav-scan"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Scanner QR</h3>
              <p>Accédez au scanner pour vérifier les codes QR des étudiants à l'embarquement.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="nav-history"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">Mon historique</h3>
              <p>Consultez l'historique de tous vos scans avec statistiques et filtres.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Guide terminé ! ✓
              </h3>
              <p className="text-gray-700">
                Vous êtes prêt à utiliser le scanner.
              </p>
            </div>
          ),
          placement: 'center',
        },
      ]
    }
    return []
  }

  const handleJoyrideCallback = (data) => {
    const { status, type, action, index } = data

    // Terminer le guide si terminé ou ignoré
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
      setStepIndex(0)
      return
    }

    // Gérer la navigation entre les étapes
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        const nextIndex = index + 1
        const steps = getSteps()
        
        // Vérifier si on est à la dernière étape
        if (nextIndex >= steps.length) {
          // C'est la dernière étape, ne rien faire, Joyride terminera
          return
        }

        // Navigation automatique vers /students si nécessaire (étape 3 dans le tableau = index 2)
        if (index === 2 && location.pathname !== '/students') {
          navigate('/students')
          // Attendre que la navigation soit complète avant de passer à l'étape suivante
          setTimeout(() => {
            setStepIndex(3)
          }, 600)
          return
        }
        
        // Mettre à jour l'index normalement pour passer à l'étape suivante
        setStepIndex(nextIndex)
      } else if (action === ACTIONS.PREV) {
        // Navigation précédente
        if (index > 0) {
          const prevIndex = index - 1
          // Si on revient depuis /students vers le dashboard (étape 3 → étape 2)
          if (index === 3 && location.pathname === '/students') {
            navigate('/dashboard')
            setTimeout(() => {
              setStepIndex(2)
            }, 600)
            return
          }
          setStepIndex(prevIndex)
        }
      } else if (action === ACTIONS.CLOSE) {
        // L'utilisateur ferme le guide
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
        setRun(false)
        setStepIndex(0)
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Si la cible n'est pas trouvée, passer à l'étape suivante
      if (action === ACTIONS.NEXT) {
        const nextIndex = index + 1
        const steps = getSteps()
        if (nextIndex < steps.length) {
          setStepIndex(nextIndex)
        }
      }
    }
  }

  const handleStartTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    setStepIndex(0)
    setRun(true)
  }

  // Exposer la fonction pour le bouton dans le header
  useEffect(() => {
    window.startOnboardingTour = handleStartTour
    return () => {
      delete window.startOnboardingTour
    }
  }, [])

  if (!run || !(role === 'admin' || role === 'educator' || role === 'controller')) {
    return null
  }

  const steps = getSteps()

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={false}
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      disableOverlayClose={false}
      disableScrolling={false}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        open: 'Ouvrir',
        skip: 'Passer',
      }}
      styles={{
        options: {
          primaryColor: '#2D5016',
          textColor: '#1F2937',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#2D5016',
          backgroundColor: '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#2D5016',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#2D5016',
          marginRight: '10px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: '14px',
        },
      }}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        open: 'Ouvrir',
        skip: 'Passer',
      }}
    />
  )
}



