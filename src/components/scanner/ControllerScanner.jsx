import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { startTransition } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, LogOut, History, RefreshCcw } from 'lucide-react'
import { Button, Badge } from '../ui'
import { STATUTS_SCAN, STATUTS_PAIEMENT } from '../../lib/constants'
import toast from 'react-hot-toast'
import logger from '../../lib/logger'
import ControllerLogin from './ControllerLogin'
import { useBreakpoint } from '../../hooks/useBreakpoint'

// Précharger ControllerHistory pour éviter pages blanches
let ControllerHistoryPreloaded = false
const preloadControllerHistory = () => {
  if (ControllerHistoryPreloaded) return
  ControllerHistoryPreloaded = true
  import('../../pages/ControllerHistory').catch(() => {
    ControllerHistoryPreloaded = false
  })
}

export default function ControllerScanner() {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const [controller, setController] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerRef = useRef(null)
  const controllerRef = useRef(null)

  // Vérifier si un contrôleur est déjà connecté
  useEffect(() => {
    const loadSession = () => {
      const stored = sessionStorage.getItem('controller_session')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.controller_session) {
            setController(parsed.controller_session)
            return
          }
        } catch (e) {
          logger.error('Error parsing controller session', e)
        }
      }
      setController(null)
    }

    loadSession()

    const handleStorage = (event) => {
      if (event.key === 'controller_session') {
        loadSession()
      }
    }

    const handleCustomEvent = (event) => {
      if (event?.detail?.controller) {
        setController(event.detail.controller)
      } else if (event?.detail?.controller === null) {
        setController(null)
      } else {
        loadSession()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('controller-session-changed', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('controller-session-changed', handleCustomEvent)
    }
  }, [])

  useEffect(() => {
    controllerRef.current = controller
  }, [controller])

  // Vibration helper
  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleLoginSuccess = (controllerData) => {
    setController(controllerData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('controller_session')
    window.dispatchEvent(new CustomEvent('controller-session-changed', { detail: { controller: null } }))
    setController(null)
    stopScanning()
    toast.success('Déconnexion réussie')
  }

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleScan = useCallback(async (qrData) => {
    if (!controller || !controllerRef.current) {
      logger.warn('Scan attempt without active controller')
      return
    }

    try {
      // Décoder le QR code (peut être JSON ou token brut)
      let qrToken = qrData
      
      // Si c'est un JSON, extraire le token
      try {
        const parsed = JSON.parse(qrData)
        if (parsed.token) {
          qrToken = parsed.token
        } else if (parsed.studentId) {
          // Si seulement studentId, chercher par ID
          const { data: studentById } = await supabase
            .from('students')
            .select('qr_code_token')
            .eq('id', parsed.studentId)
            .single()
          
          if (studentById?.qr_code_token) {
            qrToken = studentById.qr_code_token
          }
        }
      } catch {
        // Si ce n'est pas du JSON, utiliser le texte brut comme token
        qrToken = qrData
      }

      // 1. Rechercher l'étudiant par QR code token (optimisé : seulement les champs nécessaires)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          nom,
          prenom,
          classe,
          statut_paiement,
          months_ledger,
          ligne_id,
          qr_code_status,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .eq('qr_code_token', qrToken)
        .eq('qr_code_status', 'active')
        .maybeSingle() // Utiliser maybeSingle pour éviter erreur si non trouvé

      if (studentError || !student) {
        setScanResult({
          success: false,
          statut: 'error',
          message: '❌ QR Code invalide ou révoqué',
          bgColor: 'bg-red-500',
        })
        vibrate([100, 50, 100])
        
        // Redémarrer le scanner après 3 secondes
        setTimeout(() => {
          if (controllerRef.current && !scanning) {
            setScanning(true)
          }
        }, 3000)
        return
      }

      // 2. VÉRIFICATION DOUBLONS (PRIORITÉ)
      // Vérifier si ce même étudiant a été scanné par CE MÊME contrôleur dans la dernière heure
      // IMPORTANT : Chercher le PREMIER scan (plus ancien) pour afficher l'heure du premier scan
      // NOTE : On vérifie tous les scans enregistrés (approved, expired) pour éviter les doublons
      // Les scans avec ligne incorrecte ne sont pas enregistrés donc n'apparaissent pas ici
      // IMPORTANT : On vérifie seulement les scans du MÊME contrôleur pour éviter les conflits entre contrôleurs
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentScans, error: recentScansError } = await supabase
        .from('scan_logs')
        .select(`
          scanned_at,
          statut,
          controllers:controller_id (
            id,
            nom,
            code
          )
        `)
        .eq('student_id', student.id)
        .eq('controller_id', controller.id) // Seulement les scans de CE contrôleur
        .gte('scanned_at', oneHourAgo)
        .order('scanned_at', { ascending: true }) // Ordre ascendant pour avoir le premier scan
        .limit(1)

      if (recentScansError) {
        logger.error('Error checking duplicate scans', recentScansError)
        // Continue le processus même en cas d'erreur (ne pas bloquer le scan)
      }

      if (recentScans && recentScans.length > 0) {
        const firstScan = new Date(recentScans[0].scanned_at) // Premier scan (le plus ancien)
        const minutesAgo = Math.floor((Date.now() - firstScan.getTime()) / 60000)
        const nextScanIn = 60 - minutesAgo
        
        // Formater l'heure du premier scan avec date complète
        const firstScanTime = new Intl.DateTimeFormat('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }).format(firstScan)

        // Récupérer le nom du contrôleur qui a scanné
        const controllerName = recentScans[0].controllers?.nom || controller.name || 'Contrôleur'

        setScanResult({
          success: false,
          statut: STATUTS_SCAN.DUPLICATE,
          message: `🚫 Déjà scanné par ${controllerName} le ${firstScanTime} (il y a ${minutesAgo} min). Prochain scan dans ${nextScanIn} min.`,
          student,
          bgColor: 'bg-orange-500',
        })
        vibrate([100, 50, 100])
        
        // IMPORTANT : Enregistrer TOUS les scans, y compris les doublons, avec statut DUPLICATE
        // Cela permet à la fonction de réinitialisation de supprimer ces scans et de permettre un nouveau scan
        try {
          await supabase.from('scan_logs').insert([
            {
              student_id: student.id,
              controller_id: controller.id,
              statut: STATUTS_SCAN.DUPLICATE,
              statut_paiement: student.statut_paiement,
            },
          ])
        } catch (insertError) {
          logger.debug('Erreur enregistrement scan doublon (non bloquant)', insertError)
        }
        
        // Redémarrer le scanner après 3 secondes
        setTimeout(() => {
          if (controllerRef.current && !scanning) {
            setScanning(true)
          }
        }, 3000)
        return
      }

      // 3. Vérification ligne
      if (student.ligne_id !== controller.line_id) {
        const studentLine = student.lines?.nom || 'Inconnue'
        const controllerLine = controller.line_name || 'Inconnue'

        // IMPORTANT : Ne PAS enregistrer dans scan_logs pour les lignes incorrectes
        // (comme pour les doublons, cela évite de polluer les logs avec des erreurs de ligne)

        setScanResult({
          success: false,
          statut: STATUTS_SCAN.WRONG_LINE,
          message: `❌ Ligne incorrecte. Étudiant: ${studentLine}, Votre ligne: ${controllerLine}`,
          student,
          bgColor: 'bg-red-500',
        })
        vibrate([100, 50, 100])
        
        // Redémarrer le scanner après 3 secondes
        setTimeout(() => {
          if (controllerRef.current && !scanning) {
            setScanning(true)
          }
        }, 3000)
        return
      }

      // 4. Vérification statut paiement
      const statutPaiement = student.statut_paiement

      let scanStatus = STATUTS_SCAN.APPROVED
      let message = ''
      let bgColor = ''
      let shouldVibrate = false
      let vibrationPattern = []

      switch (statutPaiement) {
        case STATUTS_PAIEMENT.ACTIF:
          scanStatus = STATUTS_SCAN.APPROVED
          message = `✅ Accès autorisé - ${student.nom} ${student.prenom || ''}`
          bgColor = 'bg-green-500'
          shouldVibrate = true
          vibrationPattern = [200]
          break

        case STATUTS_PAIEMENT.EN_RETARD:
          scanStatus = STATUTS_SCAN.APPROVED
          message = `⚠️ Accès autorisé - Paiement en retard`
          bgColor = 'bg-yellow-500'
          shouldVibrate = false
          break

        case STATUTS_PAIEMENT.EXPIRE:
          scanStatus = STATUTS_SCAN.EXPIRED
          message = `❌ Accès refusé - Paiement expiré`
          bgColor = 'bg-red-500'
          shouldVibrate = true
          vibrationPattern = [100, 50, 100]
          break

        case STATUTS_PAIEMENT.HORS_SERVICE:
          scanStatus = STATUTS_SCAN.APPROVED
          message = `ℹ️ Accès autorisé - Hors service`
          bgColor = 'bg-gray-500'
          shouldVibrate = false
          break

        default:
          scanStatus = STATUTS_SCAN.EXPIRED
          message = `❌ Statut inconnu`
          bgColor = 'bg-red-500'
          shouldVibrate = true
          vibrationPattern = [100, 50, 100]
      }

      // Enregistrer dans scan_logs
      const { error: insertError } = await supabase.from('scan_logs').insert([
        {
          student_id: student.id,
          controller_id: controller.id,
          statut: scanStatus,
          statut_paiement: student.statut_paiement,
          raison: scanStatus !== STATUTS_SCAN.APPROVED ? message : null,
        },
      ])

      if (insertError) {
        logger.error('Error inserting scan log', insertError)
        // Continue même si l'enregistrement échoue (ne pas bloquer l'affichage)
        toast.error('Erreur lors de l\'enregistrement du scan')
      } else {
        // Logger dans activity_logs pour traçabilité complète
        try {
          const { error: activityError } = await supabase.from('activity_logs').insert([
            {
              action: 'scan_qr_code',
              entity_type: 'student',
              entity_id: student.id,
              details: {
                controller_id: controller.id,
                controller_name: controller.name,
                controller_code: controller.code,
                student_name: `${student.nom} ${student.prenom || ''}`,
                student_contact: student.contact,
                statut: scanStatus,
                statut_paiement: student.statut_paiement,
                message,
                ligne_id: controller.ligne_id,
                ligne_name: controller.line_name,
              },
            },
          ])

          if (activityError) {
            logger.debug('Error logging scan activity', activityError)
            // Non bloquant
          }
        } catch (logError) {
          logger.debug('Error logging scan activity', logError)
          // Non bloquant
        }
      }

      setScanResult({
        success: scanStatus === STATUTS_SCAN.APPROVED,
        statut: scanStatus,
        message,
        student,
        bgColor,
      })

      if (shouldVibrate) {
        vibrate(vibrationPattern)
      }

      // Redémarrer le scanner après 5 secondes (plus de temps pour voir le résultat)
      setTimeout(() => {
        setScanResult(null)
        // Redémarrer le scanner après avoir effacé le résultat si le contrôleur est toujours actif
        if (controllerRef.current && !scanning) {
          // Petit délai avant de redémarrer pour s'assurer que l'état est propre
          setTimeout(() => {
            if (controllerRef.current && !scanning) {
              setScanning(true)
            }
          }, 200)
        }
      }, 5000)
    } catch (error) {
      logger.error('Scan error', error)
      setScanResult({
        success: false,
        statut: 'error',
        message: 'Erreur lors du traitement du scan. Veuillez réessayer.',
        bgColor: 'bg-red-500',
      })
      vibrate([100, 50, 100])
      
      // Redémarrer le scanner après 3 secondes même en cas d'erreur
      setTimeout(() => {
        if (controllerRef.current && !scanning) {
          setScanning(true)
        }
      }, 3000)
    }
  }, [controller, scanning])

  const initializeScanner = useCallback(async () => {
    if (!controller || !scanning) return

    try {
      // Attendre que l'élément soit rendu dans le DOM
      let attempts = 0
      let qrReaderElement = null
      
      while (!qrReaderElement && attempts < 20) {
        qrReaderElement = document.getElementById('qr-reader')
        if (!qrReaderElement) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++
        }
      }

      if (!qrReaderElement) {
        throw new Error('Élément QR scanner introuvable. Veuillez actualiser la page.')
      }

      // Nettoyer le scanner précédent s'il existe
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          await html5QrCodeRef.current.clear()
          html5QrCodeRef.current = null
        } catch (e) {
          // Ignore les erreurs mais les logger quand même
          logger.debug('Error cleaning up previous scanner', e)
        }
      }

      // Petite pause pour s'assurer que l'élément est prêt
      await new Promise((resolve) => setTimeout(resolve, 200))

      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      // Configuration du scanner - Responsive pour mobile
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const qrboxSize = isMobile 
        ? Math.min(Math.min(viewportWidth * 0.8, viewportHeight * 0.5), 280) // Max 80% de largeur ou 50% hauteur sur mobile, max 280px
        : 300 // Desktop : 300px
      
      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        disableFlip: false,
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Arrêter temporairement le scanner pendant le traitement
          if (!controllerRef.current) return
          
          try {
            await html5QrCode.stop()
            setScanning(false)
          } catch (e) {
            logger.debug('Error stopping scanner during scan', e)
          }
          
          // Traiter le scan
          await handleScan(decodedText)
          
          // Redémarrer automatiquement le scanner après traitement
          // Le scanner sera redémarré via le timeout dans handleScan
        },
        (errorMessage) => {
          // Ignore les erreurs de scan continu (normal lors du scanning)
          // Ne logger que les erreurs critiques
          if (errorMessage && 
              !errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('NotAllowedError') &&
              !errorMessage.includes('NotFoundError') &&
              !errorMessage.includes('No MultiFormat Readers')) {
            logger.debug('Scanner warning', { message: errorMessage })
          }
        }
      )
    } catch (error) {
      logger.error('Error starting scanner', error)
      
      // Message d'erreur plus explicite
      let errorMessage = 'Erreur lors du démarrage du scanner'
      if (error.message.includes('NotAllowedError') || error.message.includes('Permission')) {
        errorMessage = 'Permission caméra refusée. Veuillez autoriser l\'accès à la caméra.'
      } else if (error.message.includes('NotFoundError') || error.message.includes('No camera')) {
        errorMessage = 'Aucune caméra trouvée. Vérifiez que votre appareil a une caméra.'
      } else if (error.message.includes('NotReadableError')) {
        errorMessage = 'La caméra est déjà utilisée par une autre application.'
      } else {
        errorMessage = error.message || errorMessage
      }
      
      toast.error(errorMessage)
      setScanning(false)
    }
  }, [controller, scanning, handleScan])

  const startScanning = () => {
    if (!controllerRef.current || scanning) return
    setScanResult(null)
    setScanning(true)
  }

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current
        // Vérifier si le scanner est en cours d'exécution avant d'essayer de l'arrêter
        try {
          const state = scanner.getState ? scanner.getState() : null
          if (state === Html5QrcodeScannerState.SCANNING) {
            await scanner.stop()
          }
        } catch (e) {
          // Si getState n'existe pas ou si erreur, essayer quand même d'arrêter
          try {
            await scanner.stop()
          } catch (stopError) {
            logger.debug('Error stopping scanner', stopError)
          }
        }
        await scanner.clear()
        html5QrCodeRef.current = null
      } catch (error) {
        // Ignore les erreurs d'arrêt (le scanner peut déjà être arrêté)
        logger.debug('Error stopping scanner (may already be stopped)', error)
        // Réinitialiser quand même la référence
        html5QrCodeRef.current = null
      }
    }
    setScanning(false)
  }, [])

  // Fonction de réinitialisation des scans - Supprime les scans de la dernière heure pour CE contrôleur uniquement
  // Permet à ce contrôleur de rescanner tous les étudiants qu'il a déjà scannés dans l'heure sans avoir de doublons
  // Chaque contrôleur peut réinitialiser ses propres scans indépendamment des autres contrôleurs
  const resetTodayScans = async () => {
    if (!controller?.id || !controller?.line_id) {
      toast.error('Contrôleur non connecté ou ligne non assignée')
      return
    }

    // Calculer la date d'il y a 1 heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Compter TOUS les scans de CE contrôleur dans la dernière heure (peu importe la ligne de l'étudiant)
    // Cela inclut les scans approuvés, expirés, doublons, et ligne incorrecte
    const { count: scansCount } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true })
      .eq('controller_id', controller.id) // Seulement les scans de CE contrôleur
      .gte('scanned_at', oneHourAgo) // Dans la dernière heure

    if (!confirm(`Réinitialiser vos scans de la dernière heure ?\n\n${scansCount || 0} scan(s) que VOUS avez effectués dans la dernière heure seront supprimés.\n\nVous pourrez rescanner immédiatement tous les étudiants que vous avez déjà scannés.`)) {
      return
    }

    try {
      // IMPORTANT : Supprimer TOUS les scans de CE contrôleur dans la dernière heure
      // Peu importe la ligne de l'étudiant ou le statut du scan (approved, duplicate, expired, wrong_line)
      // Cela permet à ce contrôleur de rescanner immédiatement les étudiants qu'il a déjà scannés
      // Les autres contrôleurs ne sont pas affectés
      const { error } = await supabase
        .from('scan_logs')
        .delete()
        .eq('controller_id', controller.id) // Seulement les scans de CE contrôleur
        .gte('scanned_at', oneHourAgo) // Dans la dernière heure

      if (error) {
        logger.error('Erreur réinitialisation scans ligne', error)
        throw error
      }

      // Logger dans activity_logs pour traçabilité
      try {
        const { error: activityError } = await supabase.from('activity_logs').insert([
          {
            action: 'reset_scans_hour',
            entity_type: 'controller',
            entity_id: controller.id,
            details: {
              controller_id: controller.id,
              controller_name: controller.name,
              controller_code: controller.code,
              ligne_id: controller.line_id,
              ligne_name: controller.line_name,
              scans_deleted: scansCount || 0,
              reset_scope: 'controller_only', // Réinitialisation uniquement pour ce contrôleur
            },
          },
        ])

        if (activityError) {
          logger.debug('Error logging reset scans activity', activityError)
          // Non bloquant
        }
      } catch (logError) {
        logger.debug('Error logging reset scans activity', logError)
        // Non bloquant
      }

      toast.success(`Vos scans de la dernière heure ont été réinitialisés. ${scansCount || 0} scan(s) supprimé(s). Vous pouvez maintenant rescanner immédiatement tous les étudiants que vous avez déjà scannés.`, {
        duration: 5000
      })
      
      logger.info('Réinitialisation scans contrôleur (dernière heure)', {
        controller_id: controller.id,
        controller_name: controller.name,
        controller_code: controller.code,
        ligne_id: controller.line_id,
        ligne_name: controller.line_name,
        one_hour_ago: oneHourAgo,
        scans_deleted: scansCount || 0,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Erreur réinitialisation scans ligne', error)
      toast.error('Erreur lors de la réinitialisation : ' + (error.message || 'Erreur inconnue'))
    }
  }

  // Initialiser le scanner quand scanning devient true
  useEffect(() => {
    if (scanning && controller && !html5QrCodeRef.current) {
      initializeScanner()
    }
  }, [scanning, controller, initializeScanner])

  // Nettoyer si le scanner change d'état ou si le contrôleur change
  useEffect(() => {
    if (!scanning && html5QrCodeRef.current) {
      stopScanning()
    }
    if (!controller && html5QrCodeRef.current) {
      stopScanning()
    }
  }, [scanning, controller, stopScanning])

  // Nettoyer le scanner au démontage
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  // Écran 1 : Authentification
  if (!controller) {
    return (
      <div className="min-h-screen">
        <ControllerLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // Écran 2 : Scanner actif
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* En-tête avec infos contrôleur - Responsive mobile */}
      <div className="bg-emsp-green text-white shadow-md p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Mobile : Layout vertical */}
          {isMobile ? (
            <div className="space-y-3">
              {/* Ligne 1 : Nom et avatar */}
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0"
                >
                  {getInitials(controller.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base md:text-xl font-bold truncate">{controller.name}</h1>
                  {controller.line_name && (
                    <Badge
                      className="mt-1 bg-white/20 text-white border-white/30 text-xs"
                      style={{
                        backgroundColor: controller.line_color || '#7CB342',
                      }}
                    >
                      {controller.line_name}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Ligne 2 : Boutons */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={resetTodayScans}
                  className="p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-lg transition-colors touch-manipulation flex-shrink-0"
                  style={{ 
                    minWidth: '44px',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                  title="Réinitialiser vos scans de la dernière heure (vous pourrez rescanner immédiatement)"
                  aria-label="Réinitialiser scans"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      preloadControllerHistory()
                      startTransition(() => {
                        navigate('/scanner/historique')
                      })
                    }}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border-white text-sm px-3 py-2 flex-shrink-0"
                    style={{ 
                      touchAction: 'manipulation',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
                  >
                    <History size={16} className="md:mr-2" />
                    <span className="hidden sm:inline">Historique</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border-white text-sm px-3 py-2 flex-shrink-0"
                    style={{ 
                      touchAction: 'manipulation',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
                  >
                    <LogOut size={16} className="md:mr-2" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop : Layout horizontal */
            <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar avec initiales */}
            <div
                  className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            >
              {getInitials(controller.name)}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-bold">{controller.name}</h1>
                {controller.line_name && (
                  <Badge
                    className="mt-1 bg-white/20 text-white border-white/30"
                    style={{
                      backgroundColor: controller.line_color || '#7CB342',
                    }}
                  >
                    {controller.line_name}
                  </Badge>
                )}
              </div>
              <button
                onClick={resetTodayScans}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex-shrink-0"
                    style={{ 
                      touchAction: 'manipulation',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
                    title="Réinitialiser vos scans de la dernière heure (vous pourrez rescanner immédiatement)"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                preloadControllerHistory()
                startTransition(() => {
                  navigate('/scanner/historique')
                })
              }}
              onMouseEnter={preloadControllerHistory}
              className="bg-white/20 hover:bg-white/30 text-white border-white"
                  style={{ 
                    touchAction: 'manipulation',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
            >
              <History size={18} className="mr-2" />
              Mon historique
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white border-white"
                  style={{ 
                    touchAction: 'manipulation',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
            >
              <LogOut size={18} className="mr-2" />
              Déconnexion
            </Button>
          </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-3 md:space-y-4 overflow-x-hidden">
        {/* Contrôles */}
        <div className="flex justify-center">
          {!scanning ? (
            <Button
              onClick={startScanning}
              className="bg-emsp-green hover:bg-green-800 active:bg-green-900 text-white w-full sm:w-auto"
              style={{ 
                touchAction: 'manipulation',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <CheckCircle size={20} className="mr-2" />
              Démarrer le scan
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="danger"
              className="w-full sm:w-auto"
              style={{ 
                touchAction: 'manipulation',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <XCircle size={20} className="mr-2" />
              Arrêter le scan
            </Button>
          )}
        </div>

        {/* Zone de scan - Responsive */}
        {scanning && (
          <div className="bg-white rounded-lg p-2 md:p-4 shadow-md overflow-hidden">
            <div 
              id="qr-reader" 
              className="w-full" 
              ref={scannerRef} 
              style={{ 
                minHeight: isMobile ? '250px' : '300px',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            ></div>
          </div>
        )}

        {/* Résultat du scan - Responsive */}
        {scanResult && (
          <div
            className={`p-4 md:p-6 rounded-lg text-white text-center overflow-hidden ${
              scanResult.bgColor || (scanResult.success ? 'bg-green-500' : 'bg-red-500')
            }`}
          >
            <p className="text-lg md:text-2xl font-bold mb-2 break-words">{scanResult.message}</p>
            {scanResult.student && (
              <p className="text-base md:text-lg opacity-90 break-words">
                {scanResult.student.nom} {scanResult.student.prenom || ''}
              </p>
            )}
          </div>
        )}

        {/* Instructions - Responsive */}
        {!scanning && !scanResult && (
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-md text-center">
            <AlertCircle size={isMobile ? 36 : 48} className="mx-auto text-gray-400 mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-600 px-2">
                Cliquez sur &quot;Démarrer le scan&quot; pour commencer à scanner les QR codes
              </p>
          </div>
        )}
      </div>
    </div>
  )
}
