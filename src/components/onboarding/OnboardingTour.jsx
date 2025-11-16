import { useState, useEffect, useCallback } from 'react'
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride'
import { useLocation, useNavigate, startTransition } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TOUR_STORAGE_KEY = 'emsp_onboarding_completed'

export default function OnboardingTour() {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [waitingForNavigation, setWaitingForNavigation] = useState(false)

  // Vérifier si le tour a déjà été complété
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!completed && (role === 'admin' || role === 'educator')) {
      // Attendre un peu pour que la page se charge
      setTimeout(() => {
        setRun(true)
        setStepIndex(0)
      }, 1500)
    }
  }, [role, location.pathname])

  // Précharger les pages nécessaires
  useEffect(() => {
    if (!run || !(role === 'admin' || role === 'educator')) return
    
    // Précharger les pages qui seront visitées dans le guide
    setTimeout(() => {
      import('../../pages/Students').catch(() => {})
      import('../../pages/Payments').catch(() => {})
    }, 1000)
  }, [run, role])

  // Étapes du tour selon le rôle
  const getSteps = useCallback(() => {
    if (role === 'admin' || role === 'educator') {
      const steps = [
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Bienvenue sur EMSP Transport ! 🎓
              </h3>
              <p className="text-gray-700 mb-2">
                Ce guide complet vous explique comment utiliser toutes les fonctionnalités de la plateforme.
              </p>
              <p className="text-sm text-gray-600">
                Cliquez sur "Suivant" pour commencer.
              </p>
            </div>
          ),
          placement: 'center',
          disableBeacon: true,
          disableOverlayClose: false,
        },
        {
          target: '[data-tour="dashboard-stats"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">📊 Tableau de bord</h3>
              <p className="mb-2">Voici vos statistiques en temps réel :</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li>Nombre d'étudiants</li>
                <li>Paiements mensuels</li>
                <li>Statut des paiements</li>
                <li>Présences du jour</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">Ces statistiques se mettent à jour automatiquement.</p>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="quick-actions"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">⚡ Actions rapides</h3>
              <p className="mb-2">Accédez rapidement aux actions les plus courantes :</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li><strong>Ajouter un étudiant</strong> : Créer un nouveau profil</li>
                <li><strong>Enregistrer un paiement</strong> : Enregistrer un paiement mensuel</li>
                <li><strong>Générer un rapport</strong> : Exporter les données</li>
              </ul>
            </div>
          ),
          placement: 'top',
        },
        {
          target: '[data-tour="nav-sidebar"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">🧭 Navigation</h3>
              <p className="mb-2">Utilisez le menu latéral pour accéder à toutes les sections :</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li><strong>Étudiants</strong> : Gérer les profils</li>
                <li><strong>Paiements</strong> : Voir l'historique des paiements</li>
                <li><strong>Rapports</strong> : Consulter les rapports</li>
                <li><strong>Administration</strong> : Configurer la plateforme</li>
              </ul>
            </div>
          ),
          placement: 'right',
          disableScrolling: false,
        },
      ]

      // Étapes conditionnelles selon la page actuelle
      if (location.pathname === '/dashboard') {
        // Étapes sur le dashboard
        steps.push(
          {
            target: '[data-tour="nav-students"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">👥 Gestion des étudiants</h3>
                <p className="mb-2">Cliquez sur "Étudiants" dans le menu pour :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Voir la liste complète des étudiants</li>
                  <li>Ajouter, modifier ou supprimer un étudiant</li>
                  <li>Générer les QR codes</li>
                  <li>Voir le statut de paiement de chaque étudiant</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">Le guide continuera sur la page des étudiants...</p>
              </div>
            ),
            placement: 'right',
          }
        )
        
        // Indiquer qu'on doit naviguer vers /students
        steps[steps.length - 1].nextStep = 'navigate:/students'
      }

      // Étapes sur la page Students
      if (location.pathname === '/students' || location.pathname.startsWith('/students')) {
        steps.push(
          {
            target: '[data-tour="student-list"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">📋 Liste des étudiants</h3>
                <p className="mb-2">Voici tous vos étudiants avec :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Nom, prénom et photo</li>
                  <li>Classe et ligne de car</li>
                  <li>Statut de paiement (coloré)</li>
                  <li>Actions rapides (Modifier, Payer, QR Code)</li>
                </ul>
              </div>
            ),
            placement: 'top',
          },
          {
            target: '[data-tour="add-student-btn"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">➕ Ajouter un étudiant</h3>
                <p className="mb-2">Cliquez sur ce bouton pour créer un nouvel étudiant. Vous devrez renseigner :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Nom et prénom</li>
                  <li>Contact (téléphone)</li>
                  <li>Ligne de car</li>
                  <li>Classe et niveau</li>
                </ul>
                <p className="text-sm text-emsp-green mt-2">Un QR code sera généré automatiquement !</p>
              </div>
            ),
            placement: 'bottom',
          },
          {
            target: '[data-tour="student-search"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">🔍 Recherche et filtres</h3>
                <p className="mb-2">Utilisez la barre de recherche pour trouver un étudiant par :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Nom ou prénom</li>
                  <li>Numéro de téléphone</li>
                </ul>
                <p className="mb-2 mt-2">Les filtres permettent de trier par :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Ligne de car</li>
                  <li>Statut de paiement</li>
                  <li>Classe</li>
                </ul>
              </div>
            ),
            placement: 'bottom',
          }
        )
      }

      // Retour au dashboard pour continuer
      if (location.pathname === '/students') {
        steps.push({
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                📝 Étudiants - Étape suivante
              </h3>
              <p className="text-gray-700 mb-2">
                Maintenant, découvrons la gestion des paiements. Le guide va vous rediriger vers la page des paiements...
              </p>
            </div>
          ),
          placement: 'center',
          nextStep: 'navigate:/payments',
        })
      }

      // Étapes sur la page Payments
      if (location.pathname === '/payments' || location.pathname.startsWith('/payments')) {
        steps.push(
          {
            target: '[data-tour="payment-list"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">💰 Historique des paiements</h3>
                <p className="mb-2">Ici vous voyez tous les paiements enregistrés avec :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Étudiant et date de paiement</li>
                  <li>Nombre de mois payés</li>
                  <li>Montant total</li>
                  <li>Actions : Voir/Imprimer le reçu</li>
                </ul>
              </div>
            ),
            placement: 'top',
          },
          {
            target: '[data-tour="add-payment-btn"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">💳 Enregistrer un paiement</h3>
                <p className="mb-2">Cliquez sur ce bouton pour enregistrer un nouveau paiement :</p>
                <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                  <li>Sélectionner l'étudiant</li>
                  <li>Choisir le nombre de mois (1 à 12)</li>
                  <li>Le montant est calculé automatiquement</li>
                  <li>Un reçu PDF est généré automatiquement</li>
                </ol>
              </div>
            ),
            placement: 'bottom',
          }
        )
      }

      // Retour au dashboard pour finaliser
      if (location.pathname === '/payments') {
        steps.push({
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                📊 Continuons...
              </h3>
              <p className="text-gray-700 mb-2">
                Retournons au tableau de bord pour découvrir les autres fonctionnalités...
              </p>
            </div>
          ),
          placement: 'center',
          nextStep: 'navigate:/dashboard',
        })
      }

      // Étapes finales sur le dashboard
      if (location.pathname === '/dashboard') {
        steps.push(
          {
            target: '[data-tour="nav-reports"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">📈 Rapports et Bilans</h3>
                <p className="mb-2">Dans le menu, vous trouverez :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li><strong>Rapports</strong> : Statistiques détaillées</li>
                  <li><strong>Bilan mensuel</strong> : Analyse financière mensuelle</li>
                  <li><strong>Export Excel</strong> : Télécharger les données</li>
                </ul>
              </div>
            ),
            placement: 'right',
          },
          {
            target: '[data-tour="nav-admin"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">⚙️ Administration</h3>
                <p className="mb-2">Les administrateurs peuvent accéder à :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Gestion des utilisateurs (admins, éducateurs)</li>
                  <li>Gestion des contrôleurs</li>
                  <li>Configuration des prix par ligne</li>
                  <li>Historique des scans QR</li>
                  <li>Configuration des classes et niveaux</li>
                </ul>
              </div>
            ),
            placement: 'right',
          },
          {
            target: '[data-tour="nav-scan-history"]',
            content: (
              <div>
                <h3 className="font-bold text-emsp-green mb-2">📱 Scanner QR Code</h3>
                <p className="mb-2">Pour les contrôleurs de bus :</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                  <li>Accès via le bouton "Accès Contrôleur" sur la page de login</li>
                  <li>Scan des QR codes des étudiants</li>
                  <li>Vérification automatique du statut de paiement</li>
                  <li>Historique des scans</li>
                </ul>
              </div>
            ),
            placement: 'right',
          },
          {
            target: 'body',
            content: (
              <div>
                <h3 className="text-xl font-bold text-emsp-green mb-2">
                  🎉 Guide terminé !
                </h3>
                <p className="text-gray-700 mb-3">
                  Vous connaissez maintenant toutes les fonctionnalités principales de la plateforme EMSP Transport.
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✅ Gestion des étudiants</p>
                  <p>✅ Enregistrement des paiements</p>
                  <p>✅ Génération de QR codes</p>
                  <p>✅ Scanner pour contrôleurs</p>
                  <p>✅ Rapports et bilans</p>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Vous pouvez relancer ce guide à tout moment depuis le menu "Guide" dans la sidebar.
                </p>
              </div>
            ),
            placement: 'center',
          }
        )
      }

      return steps
    } else if (role === 'controller') {
      return [
        {
          target: 'body',
          content: (
            <div>
              <h3 className="text-xl font-bold text-emsp-green mb-2">
                Bienvenue, Contrôleur ! 🎓
              </h3>
              <p className="text-gray-700 mb-2">
                Ce guide vous explique comment utiliser le scanner QR pour vérifier les étudiants.
              </p>
            </div>
          ),
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '[data-tour="scanner-area"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">📷 Scanner QR Code</h3>
              <p className="mb-2">Pour scanner un QR code :</p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
                <li>Cliquez sur "Démarrer le scan"</li>
                <li>Autorisez l'accès à la caméra</li>
                <li>Pointez la caméra vers le QR code de l'étudiant</li>
                <li>Le statut s'affichera automatiquement</li>
              </ol>
            </div>
          ),
          placement: 'bottom',
        },
        {
          target: '[data-tour="scan-result"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">✅ Résultats du scan</h3>
              <p className="mb-2">Après un scan, vous verrez :</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li><span className="text-green-600">🟢 Vert</span> : Paiement actif - Accès autorisé</li>
                <li><span className="text-orange-600">🟠 Orange</span> : En retard - Accès autorisé</li>
                <li><span className="text-red-600">🔴 Rouge</span> : Expiré - Accès refusé</li>
                <li><span className="text-gray-600">⚫ Gris</span> : Hors service</li>
              </ul>
            </div>
          ),
          placement: 'top',
        },
        {
          target: '[data-tour="nav-history"]',
          content: (
            <div>
              <h3 className="font-bold text-emsp-green mb-2">📋 Mon historique</h3>
              <p className="mb-2">Cliquez ici pour voir :</p>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li>Tous vos scans de la journée</li>
                <li>Les scans de la semaine</li>
                <li>Le taux de réussite</li>
                <li>Les statistiques détaillées</li>
              </ul>
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
                Vous êtes prêt à utiliser le scanner. Bon travail !
              </p>
            </div>
          ),
          placement: 'center',
        },
      ]
    }
    return []
  }, [role, location.pathname])

  const handleJoyrideCallback = (data) => {
    const { status, type, action, index } = data
    const steps = getSteps()

    // Terminer le guide si terminé ou ignoré
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
      setStepIndex(0)
      setWaitingForNavigation(false)
      return
    }

    // Gérer la fermeture manuelle
    if (action === ACTIONS.CLOSE) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
      setStepIndex(0)
      setWaitingForNavigation(false)
      return
    }

    // Gérer la navigation entre les étapes
    if (type === EVENTS.STEP_AFTER) {
      const currentStep = steps[index]
      
      // Vérifier si cette étape nécessite une navigation
      if (currentStep?.nextStep?.startsWith('navigate:')) {
        const targetPath = currentStep.nextStep.replace('navigate:', '')
        setWaitingForNavigation(true)
        setRun(false) // Pauser le guide pendant la navigation
        
        // Naviguer vers la page
        startTransition(() => {
          navigate(targetPath)
        })
        
        // Reprendre le guide après la navigation
        setTimeout(() => {
          setWaitingForNavigation(false)
          setStepIndex(index + 1)
          setRun(true)
        }, 800)
        return
      }

      // Navigation normale
      if (action === ACTIONS.NEXT) {
        const nextIndex = index + 1
        
        // Vérifier si on est à la dernière étape
        if (nextIndex >= steps.length) {
          // C'est la dernière étape
          return
        }

        // Passer à l'étape suivante
        setStepIndex(nextIndex)
      } else if (action === ACTIONS.PREV) {
        // Navigation précédente
        if (index > 0) {
          const prevStep = steps[index - 1]
          
          // Si l'étape précédente était sur une autre page, naviguer en arrière
          if (prevStep?.nextStep?.startsWith('navigate:')) {
            const targetPath = prevStep.nextStep.replace('navigate:', '')
            setWaitingForNavigation(true)
            setRun(false)
            
            startTransition(() => {
              navigate(targetPath)
            })
            
            setTimeout(() => {
              setWaitingForNavigation(false)
              setStepIndex(index - 1)
              setRun(true)
            }, 800)
            return
          }
          
          setStepIndex(index - 1)
        }
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Si la cible n'est pas trouvée, passer à l'étape suivante après un délai
      if (action === ACTIONS.NEXT) {
        setTimeout(() => {
          const nextIndex = index + 1
          if (nextIndex < steps.length) {
            setStepIndex(nextIndex)
          }
        }, 500)
      }
    }
  }

  const handleStartTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    setStepIndex(0)
    setWaitingForNavigation(false)
    
    // S'assurer qu'on commence sur le dashboard
    if (location.pathname !== '/dashboard' && (role === 'admin' || role === 'educator')) {
      startTransition(() => {
        navigate('/dashboard')
      })
      setTimeout(() => {
        setRun(true)
      }, 800)
    } else {
      setRun(true)
    }
  }

  // Exposer la fonction pour le bouton dans le header
  useEffect(() => {
    window.startOnboardingTour = handleStartTour
    return () => {
      delete window.startOnboardingTour
    }
  }, [location.pathname, role])

  if (!run || waitingForNavigation || !(role === 'admin' || role === 'educator' || role === 'controller')) {
    return null
  }

  const steps = getSteps()

  if (steps.length === 0) {
    return null
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      disableOverlayClose={false}
      disableScrolling={false}
      spotlightClicks={false}
      hideCloseButton={false}
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
          fontSize: '14px',
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
          border: 'none',
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
    />
  )
}

