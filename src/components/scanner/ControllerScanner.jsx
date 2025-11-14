import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, RotateCcw, LogOut } from 'lucide-react'
import { Button, Badge, Card } from '../ui'
import { STATUTS_SCAN, STATUTS_PAIEMENT } from '../../lib/constants'
import toast from 'react-hot-toast'
import { formatDateTime } from '../../lib/utils'

export default function ControllerScanner() {
  const [controller, setController] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const html5QrCodeRef = useRef(null)
  const scannerRef = useRef(null)

  // Vérifier si un contrôleur est déjà connecté
  useEffect(() => {
    const storedController = sessionStorage.getItem('controller')
    if (storedController) {
      try {
        const parsed = JSON.parse(storedController)
        setController(parsed)
      } catch (e) {
        sessionStorage.removeItem('controller')
      }
    }
  }, [])

  // Vibration helper
  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Rechercher le contrôleur par code
      const { data, error } = await supabase
        .from('controllers')
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .eq('code', code.trim().toUpperCase())
        .eq('active', true)
        .single()

      if (error || !data) {
        throw new Error('Code contrôleur invalide ou inactif')
      }

      if (!data.ligne_id || !data.lines) {
        throw new Error('Aucune ligne assignée à ce contrôleur')
      }

      // Stocker dans sessionStorage
      sessionStorage.setItem('controller', JSON.stringify(data))
      setController(data)
      toast.success(`Connecté en tant que ${data.nom}`)
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('controller')
    setController(null)
    setCode('')
    stopScanning()
    toast.success('Déconnexion réussie')
  }

  const startScanning = async () => {
    if (!controller || scanning) return

    try {
      // Nettoyer le scanner précédent s'il existe
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          html5QrCodeRef.current.clear()
        } catch (e) {
          // Ignore les erreurs
        }
      }

      setScanning(true)
      setScanResult(null)

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
            // Ignore les erreurs d'arrêt
          }
          await handleScan(decodedText)
          // Redémarrer le scanner après 2 secondes
          setTimeout(() => {
            if (controller) {
              startScanning()
            }
          }, 2000)
        },
        (errorMessage) => {
          // Ignore les erreurs de scan continu
        }
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      toast.error('Erreur lors du démarrage du scanner')
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  const handleScan = async (qrData) => {
    try {
      setScanResult({ loading: true, message: 'Traitement en cours...' })

      // 1. Décodage QR - Vérifier si c'est un JSON valide
      let qrContent
      try {
        qrContent = JSON.parse(qrData)
        if (!qrContent.studentId || !qrContent.token) {
          throw new Error('Format QR invalide')
        }
      } catch (e) {
        setScanResult({
          success: false,
          statut: 'invalid',
          message: 'QR Code invalide',
        })
        vibrate([100, 50, 100])
        return
      }

      // 2. Récupération étudiant
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
        .eq('id', qrContent.studentId)
        .eq('qr_code_token', qrContent.token)
        .eq('qr_code_status', 'active')
        .single()

      if (studentError || !student) {
        setScanResult({
          success: false,
          statut: 'invalid',
          message: 'Étudiant introuvable ou QR Code révoqué',
        })
        vibrate([100, 50, 100])
        return
      }

      // 3. VÉRIFICATION DOUBLONS (PRIORITÉ)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentScans } = await supabase
        .from('scan_logs')
        .select('scanned_at')
        .eq('student_id', student.id)
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

      // 4. Vérification ligne
      if (student.ligne_id !== controller.ligne_id) {
        const studentLine = student.lines?.nom || 'Inconnue'
        const controllerLine = controller.lines?.nom || 'Inconnue'

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

      // 5. Vérification statut paiement
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

      // 6. Enregistrement dans scan_logs
      await supabase.from('scan_logs').insert([
        {
          student_id: student.id,
          controller_id: controller.id,
          statut: scanStatus,
          statut_paiement: statutPaiement,
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

      // Auto-reset après 3 secondes
      setTimeout(() => {
        setScanResult(null)
      }, 3000)
    } catch (error) {
      console.error('Scan error:', error)
      setScanResult({
        success: false,
        statut: 'error',
        message: 'Erreur lors du traitement du scan',
      })
      vibrate([100, 50, 100])
    }
  }

  // Nettoyer le scanner au démontage
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  // Écran 1 : Authentification
  if (!controller) {
    return (
      <div className="min-h-screen bg-emsp-yellow flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-emsp-green mb-2">
              Connexion Contrôleur
            </h1>
            <p className="text-gray-600">Entrez votre code contrôleur</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Code contrôleur</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^0-9A-Z-]/g, '')
                    .replace(/(.{4})(?=.)/g, '$1-')
                    .slice(0, 9)
                  setCode(value)
                }}
                placeholder="XXXX-XXXX"
                className="input bg-emsp-green-light/20 border-emsp-green focus:ring-emsp-green"
                required
                pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emsp-green hover:bg-green-800"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // Écran 2 : Scanner actif
  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <div className="bg-emsp-green text-white shadow-md p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{controller.nom}</h1>
            {controller.lines && (
              <Badge
                className="mt-1 bg-emsp-green-light text-white"
                style={{
                  backgroundColor: controller.lines.couleur || '#7CB342',
                }}
              >
                {controller.lines.nom}
              </Badge>
            )}
          </div>
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

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Instructions */}
        <Card className="text-center">
          <p className="text-lg font-semibold text-emsp-green">
            Positionnez le QR code dans le cadre
          </p>
        </Card>

        {/* Scanner */}
        <Card className="p-4">
          <div id="qr-reader" ref={scannerRef} className="w-full"></div>
          {!scanning && (
            <div className="text-center mt-4">
              <Button onClick={startScanning} className="bg-emsp-yellow text-emsp-green">
                Démarrer le scan
              </Button>
            </div>
          )}
          {scanning && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={stopScanning}
                className="flex items-center space-x-2 mx-auto"
              >
                <RotateCcw size={18} />
                <span>Arrêter</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Résultat du scan */}
        {scanResult && (
          <Card
            className={`${
              scanResult.bgColor || 'bg-white'
            } text-white transition-all duration-300 animate-pulse`}
          >
            <div className="flex items-center space-x-4">
              {scanResult.success ? (
                <CheckCircle size={48} />
              ) : scanResult.statut === STATUTS_SCAN.DUPLICATE ? (
                <AlertCircle size={48} />
              ) : (
                <XCircle size={48} />
              )}
              <div className="flex-1">
                <p className="text-xl font-bold">{scanResult.message}</p>
                {scanResult.student && (
                  <div className="mt-2 text-sm opacity-90">
                    <p>
                      {scanResult.student.nom} {scanResult.student.prenom || ''}
                    </p>
                    <p>Classe: {scanResult.student.classe}</p>
                    {scanResult.student.statut_paiement && (
                      <p>Statut: {scanResult.student.statut_paiement}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

