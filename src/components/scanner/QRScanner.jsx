import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, CheckCircle, XCircle } from 'lucide-react'
import { Card, Badge } from '../ui'
import toast from 'react-hot-toast'

export default function QRScanner({ onScanSuccess, onScanError }) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setScanning(true)
      setResult(null)

      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText)
          html5QrCode.stop()
          setScanning(false)
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
        html5QrCodeRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  const handleScanSuccess = (decodedText) => {
    setResult({ success: true, data: decodedText })
    if (onScanSuccess) {
      onScanSuccess(decodedText)
    }
    toast.success('QR Code scanné avec succès')
  }

  const handleManualInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      handleScanSuccess(e.target.value.trim())
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emsp-green">
            Scanner QR Code
          </h3>
          {scanning ? (
            <button
              onClick={stopScanning}
              className="btn-secondary"
            >
              Arrêter
            </button>
          ) : (
            <button
              onClick={startScanning}
              className="btn-primary flex items-center space-x-2"
            >
              <QrCode size={20} />
              <span>Démarrer le scan</span>
            </button>
          )}
        </div>

        {scanning && (
          <div id="qr-reader" className="w-full mb-4"></div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            Ou entrez le code manuellement :
          </p>
          <input
            type="text"
            onKeyPress={handleManualInput}
            placeholder="Entrez le code QR ou l'ID étudiant..."
            className="input"
            disabled={scanning}
          />
        </div>
      </Card>

      {result && (
        <Card>
          <div
            className={`flex items-center space-x-4 ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {result.success ? (
              <CheckCircle size={48} />
            ) : (
              <XCircle size={48} />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {result.success ? 'Scan réussi' : 'Erreur de scan'}
              </p>
              {result.data && (
                <p className="text-sm text-gray-600 mt-1">{result.data}</p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

