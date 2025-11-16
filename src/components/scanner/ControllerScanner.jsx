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
  const [controller, setController] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerRef = useRef(null)
  const controllerRef = useRef(null)

  // Vérifier si un contrôleur est déjà connecté
  useEffect(() => {
    const stored = sessionStorage.getItem('controller_session')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.controller_session) {
          setController(parsed.controller_session)
        }
      } catch (e) {
        logger.error('Error parsing controller session', e)
        sessionStorage.removeItem('controller_session')
      }
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
    window.dispatchEvent(new Event('controller-session-changed'))
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
      // Vérifier si ce même étudiant a été scanné par ce contrôleur dans la dernière heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentScans, error: recentScansError } = await supabase
        .from('scan_logs')
        .select('scanned_at, statut')
        .eq('student_id', student.id)
        .eq('controller_id', controller.id)
        .gte('scanned_at', oneHourAgo)
        .order('scanned_at', { ascending: false })
        .limit(1)

      if (recentScansError) {
        logger.error('Error checking duplicate scans', recentScansError)
        // Continue le processus même en cas d'erreur (ne pas bloquer le scan)
      }

      if (recentScans && recentScans.length > 0) {
        const lastScan = new Date(recentScans[0].scanned_at)
        const minutesAgo = Math.floor((Date.now() - lastScan.getTime()) / 60000)
        const nextScanIn = 60 - minutesAgo

        setScanResult({
          success: false,
          statut: STATUTS_SCAN.DUPLICATE,
          message: `🚫 Déjà scanné il y a ${minutesAgo} min. Prochain scan dans ${nextScanIn} min.`,
          student,
          bgColor: 'bg-orange-500',
        })
        vibrate([100, 50, 100])
        
        // IMPORTANT : Ne PAS enregistrer dans scan_logs pour les doublons
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

        // Enregistrer dans scan_logs pour traçabilité
        const { error: insertError } = await supabase.from('scan_logs').insert([
          {
            student_id: student.id,
            controller_id: controller.id,
            statut: STATUTS_SCAN.WRONG_LINE,
            statut_paiement: student.statut_paiement,
            raison: `Ligne incorrecte. Étudiant: ${studentLine}, Contrôleur: ${controllerLine}`,
          },
        ])

        if (insertError) {
          logger.error('Error inserting wrong line scan log', insertError)
        }

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

      // Configuration du scanner
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
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

  // Fonction de réinitialisation des scans d'aujourd'hui
  const resetTodayScans = async () => {
    if (!controller?.id) {
      toast.error('Contrôleur non connecté')
      return
    }

    if (!confirm('Réinitialiser les scans d\'aujourd\'hui ? Les doublons seront effacés.')) {
      return
    }

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Supprimer les scans du jour pour ce contrôleur
      const { error } = await supabase
        .from('scan_logs')
        .delete()
        .eq('controller_id', controller.id)
        .gte('scanned_at', today.toISOString())

      if (error) {
        logger.error('Erreur réinitialisation scans', error)
        throw error
      }

      toast.success('Scans d\'aujourd\'hui réinitialisés')
      logger.info('Réinitialisation scans contrôleur', {
        controller_id: controller.id,
        date: today
      })

    } catch (error) {
      logger.error('Erreur réinitialisation scans', error)
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
    <div className="min-h-screen bg-gray-100">
      {/* En-tête avec infos contrôleur */}
      <div className="bg-emsp-green text-white shadow-md p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar avec initiales */}
            <div
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg"
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
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                title="Réinitialiser les scans d&apos;aujourd&apos;hui"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            >
              <History size={18} className="mr-2" />
              Mon historique
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white border-white"
            >
              <LogOut size={18} className="mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Contrôles */}
        <div className="flex justify-center space-x-4">
          {!scanning ? (
            <Button
              onClick={startScanning}
              className="bg-emsp-green hover:bg-green-800 text-white"
            >
              <CheckCircle size={20} className="mr-2" />
              Démarrer le scan
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="danger"
            >
              <XCircle size={20} className="mr-2" />
              Arrêter le scan
            </Button>
          )}
        </div>

        {/* Zone de scan */}
        {scanning && (
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div id="qr-reader" className="w-full" ref={scannerRef} style={{ minHeight: '300px' }}></div>
          </div>
        )}

        {/* Résultat du scan */}
        {scanResult && (
          <div
            className={`p-6 rounded-lg text-white text-center ${
              scanResult.bgColor || (scanResult.success ? 'bg-green-500' : 'bg-red-500')
            }`}
          >
            <p className="text-2xl font-bold mb-2">{scanResult.message}</p>
            {scanResult.student && (
              <p className="text-lg opacity-90">
                {scanResult.student.nom} {scanResult.student.prenom || ''}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        {!scanning && !scanResult && (
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                Cliquez sur &quot;Démarrer le scan&quot; pour commencer à scanner les QR codes
              </p>
          </div>
        )}
      </div>
    </div>
  )
}
