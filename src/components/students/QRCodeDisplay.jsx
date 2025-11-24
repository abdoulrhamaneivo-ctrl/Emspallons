import { useState, useRef, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Download, Printer, RotateCcw, Ban, MessageCircle, Send } from 'lucide-react'
import { Button } from '../ui'
import { useStudents } from '../../hooks/useStudents'
import toast from 'react-hot-toast'
import { STATUTS_QR_CODE } from '../../lib/constants'
import { sendQRCodeWhatsApp } from '../../services/whatsappAutoService'
import { formatMonthFrench, formatMonthsListFrench } from '../../lib/utils'
import logger from '../../lib/logger'

export default function QRCodeDisplay({ student, onClose, onRegenerate }) {
  const { revokeQRCode } = useStudents()
  const [loading, setLoading] = useState(false)
  const qrRef = useRef(null)

  // IMPORTANT : Mémoriser le qrData pour éviter la régénération à chaque render
  // Le QR code ne sera recalculé que si student.qr_code_token, student.id ou student.created_at change
  const qrData = useMemo(() => {
    if (!student?.qr_code_token) return null

    const qrDataObj = {
      studentId: student.id,
      token: student.qr_code_token,
      generatedAt: student.created_at || new Date().toISOString(),
    }

    return JSON.stringify(qrDataObj)
  }, [student?.qr_code_token, student?.id, student?.created_at])

  const handleDownload = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Taille haute résolution pour un QR code net (2048x2048px)
      // Cela permet un scan facile même sur de petits écrans ou après impression
      const targetSize = 2048
      canvas.width = targetSize
      canvas.height = targetSize
      
      // Activer le lissage pour une meilleure qualité
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Dessiner l'image SVG redimensionnée sur le canvas haute résolution
      ctx.drawImage(img, 0, 0, targetSize, targetSize)
      
      // Générer le PNG avec la meilleure qualité possible
      const pngFile = canvas.toDataURL('image/png', 1.0)

      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${student.nom}-${student.prenom || 'student'}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRevoke = async () => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir révoquer ce QR Code ? Il ne pourra plus être utilisé pour les scans.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const result = await revokeQRCode(student.id)
      if (result.error) throw result.error
      toast.success('QR Code révoqué avec succès')
    } catch (error) {
      toast.error('Erreur lors de la révocation')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        'Un nouveau QR Code sera généré. L\'ancien sera automatiquement révoqué.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const result = await onRegenerate(student.id)
      if (result.error) throw result.error
      toast.success('QR Code régénéré avec succès')
    } catch (error) {
      toast.error('Erreur lors de la régénération')
    } finally {
      setLoading(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!student.contact) {
      toast.error('Contact de l\'étudiant non disponible')
      return
    }

    if (!qrRef.current) {
      toast.error('QR Code non disponible')
      return
    }

    setLoading(true)
    try {
      // Calculer période de validité
      const lastMonth = student.months_ledger?.[student.months_ledger.length - 1]
      const expirationText = lastMonth ? formatMonthFrench(lastMonth) : 'Non défini'

      // Créer le message WhatsApp
      const message = `Bonjour ${student.prenom || ''} ${student.nom},

🎫 Votre QR Code de transport EMSP

Présentez ce code au contrôleur lors de l'embarquement.

📅 Valide jusqu'au : ${expirationText}

⚠️ En cas de perte, contactez l'administration.

École EMSP`

      // Nettoyer le numéro de téléphone
      const cleanPhone = student.contact.replace(/\D/g, '')
      
      if (!cleanPhone) {
        toast.error('Numéro de téléphone invalide')
        return
      }

      const encodedMessage = encodeURIComponent(message)
      
      // Ouvrir WhatsApp automatiquement avec le numéro et le message
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
      
      toast.success('WhatsApp ouvert avec le numéro de l\'étudiant')
      
      // Essayer d'envoyer via l'API si disponible (en arrière-plan, non bloquant)
      sendQRCodeWhatsApp(student.id).catch(err => {
        logger.debug('Envoi WhatsApp API non disponible, utilisation manuelle', err)
      })
    } catch (error) {
      logger.error('Erreur lors de l\'ouverture de WhatsApp', error)
      toast.error('Erreur lors de l\'ouverture de WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  if (!qrData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Aucun QR Code disponible pour cet étudiant
            </p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full modal max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="modal-header border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-emsp-green">QR Code</h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.nom} {student.prenom || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu */}
        <div className="modal-body p-6 space-y-6 overflow-auto">
          {/* QR Code - Taille augmentée pour meilleure lisibilité */}
          <div className="flex justify-center">
            <div
              ref={qrRef}
              className="p-6 bg-white border-2 border-gray-200 rounded-lg"
            >
              <QRCodeSVG
                value={qrData}
                size={280}
                level="H"
                includeMargin={true}
                fgColor="#2D5016"
                bgColor="#FFFFFF"
              />
            </div>
          </div>

          {/* Statut */}
          <div className="text-center">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                student.qr_code_status === STATUTS_QR_CODE.ACTIVE
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {student.qr_code_status === STATUTS_QR_CODE.ACTIVE
                ? 'Actif'
                : 'Révoqué'}
            </span>
          </div>

          {/* Informations */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Token:</span>
              <span className="font-mono text-xs break-all">
                {student.qr_code_token?.substring(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID Étudiant:</span>
              <span className="font-mono text-xs">
                {student.id?.substring(0, 8)}...
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center justify-center space-x-2"
            >
              <Download size={18} />
              <span>Télécharger</span>
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center justify-center space-x-2"
            >
              <Printer size={18} />
              <span>Imprimer</span>
            </Button>
            {student.qr_code_status === STATUTS_QR_CODE.ACTIVE && (
              <>
                <Button
                  onClick={handleSendWhatsApp}
                  disabled={loading || !student.contact}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle size={18} />
                  <span>Envoyer par WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRevoke}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <Ban size={18} />
                  <span>Révoquer</span>
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2"
                >
                  <RotateCcw size={18} />
                  <span>Régénérer</span>
                </Button>
              </>
            )}
          </div>

          {student.qr_code_status === STATUTS_QR_CODE.REVOKED && (
            <Button
              onClick={handleRegenerate}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2"
            >
              <RotateCcw size={18} />
              <span>Régénérer un nouveau QR Code</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

