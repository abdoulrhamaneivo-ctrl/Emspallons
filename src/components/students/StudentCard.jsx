import { useState, useEffect, useRef } from 'react'
import { generateHighQualityQRCode, getInitials, getAvatarColor } from '../../services/studentCardService'
import Logo from '../ui/Logo'

export default function StudentCard({ student, side = 'front', onQRCodeReady }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    if (side === 'back' && student) {
      loadQRCode()
    }
  }, [side, student])

  const loadQRCode = async () => {
    if (!student) return
    
    setLoading(true)
    try {
      const qrUrl = await generateHighQualityQRCode(student)
      setQrCodeUrl(qrUrl)
      if (onQRCodeReady) {
        onQRCodeReady(qrUrl)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Non défini'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getExpiryDate = () => {
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 6)
    return expiresAt.toISOString()
  }

  // Dimensions de la carte : 8.5cm × 5.5cm (environ 321px × 208px à 96 DPI)
  const cardWidth = 321
  const cardHeight = 208

  if (side === 'front') {
    // RECTO
    const initials = getInitials(student?.nom, student?.prenom)
    const avatarColor = getAvatarColor(student?.nom || '')
    const lineColor = student?.lines?.couleur || '#7CB342'

    return (
      <div
        ref={cardRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          background: 'linear-gradient(135deg, #f0f9f0 0%, #fff9e6 100%)'
        }}
      >
        {/* Header vert */}
        <div
          className="h-16 flex items-center justify-between px-4 text-white"
          style={{ backgroundColor: '#2D5016' }}
        >
          <div className="flex items-center space-x-2">
            <Logo size="sm" showText={false} variant="transport" />
            <span className="text-xs font-semibold">EMSP</span>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="px-4 py-3 flex flex-col items-center">
          {/* Photo/Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>

          {/* Nom complet */}
          <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
            {student?.nom} {student?.prenom || ''}
          </h2>

          {/* Classe et niveau */}
          <div className="text-sm text-gray-600 text-center mb-2">
            <span className="font-semibold">{student?.classe}</span>
            {student?.niveau && (
              <span className="mx-2">•</span>
            )}
            {student?.niveau && (
              <span>{student.niveau}</span>
            )}
          </div>

          {/* Badge ligne */}
          {student?.lines?.nom && (
            <div
              className="px-3 py-1 rounded-full text-white text-xs font-semibold mb-2"
              style={{ backgroundColor: lineColor }}
            >
              {student.lines.nom}
            </div>
          )}

          {/* Numéro étudiant */}
          <div className="text-xs text-gray-500 mt-auto">
            ID: {student?.id?.substring(0, 8).toUpperCase() || 'N/A'}
          </div>
        </div>
      </div>
    )
  } else {
    // VERSO
    const expiryDate = getExpiryDate()

    return (
      <div
        ref={cardRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden flex flex-col items-center justify-center p-6"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`
        }}
      >
        {/* Texte au-dessus */}
        <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
          Présentez ce code au contrôleur
        </p>

        {/* QR Code */}
        {loading ? (
          <div className="w-40 h-40 flex items-center justify-center border-2 border-gray-200 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emsp-green"></div>
          </div>
        ) : qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="border-2 border-gray-200 rounded-lg p-2 bg-white"
            style={{ width: '160px', height: '160px' }}
          />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center border-2 border-gray-200 rounded-lg text-gray-400 text-xs">
            QR Code non disponible
          </div>
        )}

        {/* Texte en dessous */}
        <p className="text-xs text-gray-600 mt-4 text-center">
          Valide jusqu'au : <span className="font-semibold">{formatExpiryDate(expiryDate)}</span>
        </p>

        {/* Footer */}
        <div className="mt-auto text-center">
          <p className="text-xs text-gray-500">
            Contact EMSP : [Téléphone]
          </p>
          <p className="text-xs text-gray-500">
            Site web : [URL]
          </p>
        </div>
      </div>
    )
  }
}

