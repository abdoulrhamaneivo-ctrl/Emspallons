import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, RotateCcw, LogOut, History, RefreshCcw } from 'lucide-react'
import { Button, Badge } from '../ui'
import { STATUTS_SCAN, STATUTS_PAIEMENT } from '../../lib/constants'
import toast from 'react-hot-toast'
import { formatDateTime } from '../../lib/utils'
import logger from '../../lib/logger'
import ControllerLogin from './ControllerLogin'

export default function ControllerScanner() {
  const navigate = useNavigate()
  const [controller, setController] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerRef = useRef(null)

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
    if (!controller) return

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

      // 1. Rechercher l'étudiant par QR code token
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .eq('qr_code_token', qrToken)
        .eq('qr_code_status', 'active')
        .single()

      if (studentError || !student) {
        setScanResult({
          success: false,
          statut: 'error',
          message: '❌ QR Code invalide ou révoqué',
        })
        vibrate([100, 50, 100])
        return
      }

      // 2. VÉRIFICATION DOUBLONS (PRIORITÉ)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentScans } = await supabase
        .from('scan_logs')
        .select('scanned_at')
        .eq('student_id', student.id)
        .eq('controller_id', controller.id)
        .gte('scanned_at', oneHourAgo)
        .order('scanned_at', { ascending: false })
        .limit(1)

      if (recentScans && recentScans.length > 0) {
        const lastScan = new Date(recentScans[0].scanned_at)
        const minutesAgo = Math.floor((Date.now() - lastScan.getTime()) / 60000)
        const nextScanIn = 60 - minutesAgo

        setScanResult({
          success: false,
          statut: STATUTS_SCAN.DUPLICATE,
          message: `🚫 Déjà scanné il y a ${minutesAgo} min. Prochain scan dans ${nextScanIn} min.`,
          student,
        })
        vibrate([100, 50, 100])
        // IMPORTANT : Ne PAS enregistrer dans scan_logs
        return
      }

      // 3. Vérification ligne
      if (student.ligne_id !== controller.line_id) {
        const studentLine = student.lines?.nom || 'Inconnue'
        const controllerLine = controller.line_name || 'Inconnue'

        // Enregistrer dans scan_logs pour traçabilité
        await supabase.from('scan_logs').insert([
          {
            student_id: student.id,
            controller_id: controller.id,
            statut: STATUTS_SCAN.WRONG_LINE,
            statut_paiement: student.statut_paiement,
            raison: `Ligne incorrecte. Étudiant: ${studentLine}, Contrôleur: ${controllerLine}`,
          },
        ])

        setScanResult({
          success: false,
          statut: STATUTS_SCAN.WRONG_LINE,
          message: `❌ Ligne incorrecte. Étudiant: ${studentLine}, Votre ligne: ${controllerLine}`,
          student,
        })
        vibrate([100, 50, 100])
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
      await supabase.from('scan_logs').insert([
        {
          student_id: student.id,
          controller_id: controller.id,
          statut: scanStatus,
          statut_paiement: student.statut_paiement,
          raison: scanStatus !== STATUTS_SCAN.APPROVED ? message : null,
        },
      ])

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

      // Effacer le résultat après 3 secondes
      setTimeout(() => {
        setScanResult(null)
      }, 3000)
    } catch (error) {
      logger.error('Scan error', error)
      setScanResult({
        success: false,
        statut: 'error',
        message: 'Erreur lors du traitement du scan',
      })
      vibrate([100, 50, 100])
    }
  }, [controller])

  const initializeScanner = useCallback(async () => {
    if (!controller || !scanning) return

    try {
      // Attendre que l'élément soit rendu dans le DOM
      let attempts = 0
      let qrReaderElement = null
      
      while (!qrReaderElement && attempts < 10) {
        qrReaderElement = document.getElementById('qr-reader')
        if (!qrReaderElement) {
          await new Promise((resolve) => setTimeout(resolve, 50))
          attempts++
        }
      }

      if (!qrReaderElement) {
        throw new Error('HTML Element with id=qr-reader not found after multiple attempts')
      }

      // Nettoyer le scanner précédent s'il existe
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          html5QrCodeRef.current.clear()
        } catch (e) {
          // Ignore les erreurs mais les logger quand même
          logger.debug('Error cleaning up previous scanner', e)
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Arrêter temporairement le scanner pendant le traitement
          try {
            await html5QrCode.stop()
            setScanning(false)
          } catch (e) {
            // Ignore les erreurs d'arrêt mais les logger
            logger.debug('Error stopping scanner during scan', e)
          }
          await handleScan(decodedText)
          // Redémarrer le scanner après 2 secondes
          setTimeout(() => {
            if (controller) {
              setScanning(true)
            }
          }, 2000)
        },
        (errorMessage) => {
          // Ignore les erreurs de scan continu
        }
      )
    } catch (error) {
      logger.error('Error starting scanner', error)
      toast.error('Erreur lors du démarrage du scanner: ' + error.message)
      setScanning(false)
    }
  }, [controller, scanning, handleScan])

  const startScanning = () => {
    if (!controller || scanning) return
    setScanning(true)
    setScanResult(null)
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      } catch (error) {
        logger.error('Error stopping scanner', error)
      }
    }
    setScanning(false)
  }

  // Fonction de réinitialisation des scans d'aujourd'hui
  const resetTodayScans = async () => {
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

      if (error) throw error

      toast.success('Scans d\'aujourd\'hui réinitialisés')
      logger.info('Réinitialisation scans contrôleur', {
        controller_id: controller.id,
        date: today
      })

    } catch (error) {
      logger.error('Erreur réinitialisation scans', error)
      toast.error('Erreur lors de la réinitialisation')
    }
  }

  // Initialiser le scanner quand scanning devient true
  useEffect(() => {
    if (scanning && controller) {
      initializeScanner()
    }
  }, [scanning, controller, initializeScanner])

  // Nettoyer le scanner au démontage
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

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
                title="Réinitialiser les scans d'aujourd'hui"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/scanner/historique')}
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
              Cliquez sur "Démarrer le scan" pour commencer à scanner les QR codes
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
