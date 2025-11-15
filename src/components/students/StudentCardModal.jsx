import { useState, useRef } from 'react'
import { X, Download, Printer, RotateCcw, Ban, MessageCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import StudentCard from './StudentCard'
import AnimatedButton from '../ui/AnimatedButton'
import { useStudents } from '../../hooks/useStudents'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import logger from '../../lib/logger'
import '../../styles/print-student-card.css'

// Fonction pour générer le lien WhatsApp (spécifique aux cartes)
const generateWhatsAppLink = (student) => {
  const message = `Carte étudiante - ${student.nom} ${student.prenom || ''}\n\n` +
    `Classe: ${student.classe}\n` +
    `Niveau: ${student.niveau || 'N/A'}\n` +
    `Ligne: ${student.lines?.nom || 'N/A'}\n\n` +
    `Merci de présenter cette carte lors du contrôle.`
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export default function StudentCardModal({ isOpen, onClose, student }) {
  const { regenerateQRCode, revokeQRCode } = useStudents()
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const frontCardRef = useRef(null)
  const backCardRef = useRef(null)

  if (!isOpen || !student) return null

  const handleDownload = async (side = 'both') => {
    setLoading(true)
    try {
      const cards = []
      
      if (side === 'front' || side === 'both') {
        if (frontCardRef.current) {
          const canvas = await html2canvas(frontCardRef.current, {
            scale: 3, // 300 DPI
            backgroundColor: '#ffffff',
            logging: false,
          })
          cards.push(canvas)
        }
      }
      
      if (side === 'back' || side === 'both') {
        if (backCardRef.current) {
          const canvas = await html2canvas(backCardRef.current, {
            scale: 3, // 300 DPI
            backgroundColor: '#ffffff',
            logging: false,
          })
          cards.push(canvas)
        }
      }

      if (cards.length === 0) {
        toast.error('Impossible de capturer la carte')
        return
      }

      // Si les deux côtés, créer une image combinée
      if (cards.length === 2) {
        const combinedCanvas = document.createElement('canvas')
        const spacing = 20
        combinedCanvas.width = cards[0].width + cards[1].width + spacing
        combinedCanvas.height = Math.max(cards[0].height, cards[1].height)
        
        const ctx = combinedCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)
        
        ctx.drawImage(cards[0], 0, 0)
        ctx.drawImage(cards[1], cards[0].width + spacing, 0)
        
        const dataUrl = combinedCanvas.toDataURL('image/png')
        downloadImage(dataUrl, `Carte_${student.nom}_${student.prenom || 'student'}.png`)
      } else {
        const dataUrl = cards[0].toDataURL('image/png')
        const sideName = side === 'front' ? 'Recto' : 'Verso'
        downloadImage(dataUrl, `Carte_${sideName}_${student.nom}_${student.prenom || 'student'}.png`)
      }

      toast.success('Carte téléchargée')
    } catch (error) {
      logger.error('Erreur lors du téléchargement de la carte', error)
      toast.error('Erreur lors du téléchargement de la carte')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = (dataUrl, filename) => {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  const handlePrint = () => {
    // Créer une fenêtre d'impression optimisée
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression Carte Étudiant</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .card-container {
                display: flex;
                justify-content: space-around;
                align-items: center;
                page-break-inside: avoid;
                margin-bottom: 2cm;
              }
              .card {
                width: 8.5cm;
                height: 5.5cm;
                page-break-inside: avoid;
              }
              .cut-line {
                border: 1px dashed #ccc;
                margin: 0.5cm 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div class="card" id="front-card"></div>
            <div class="card" id="back-card"></div>
          </div>
          <div class="cut-line"></div>
          <div class="card-container">
            <div class="card" id="front-card-2"></div>
            <div class="card" id="back-card-2"></div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Attendre que les cartes soient chargées
    setTimeout(() => {
      html2canvas(frontCardRef.current, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const frontImg = printWindow.document.getElementById('front-card')
        if (frontImg) {
          // Utiliser replaceChildren pour éviter innerHTML (sécurité XSS)
          const img = printWindow.document.createElement('img')
          img.src = canvas.toDataURL('image/png')
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'contain'
          frontImg.replaceChildren(img)
        }
      }).catch(error => {
        logger.error('Erreur lors de la génération de l\'image recto', error)
        toast.error('Erreur lors de la préparation de l\'impression')
      })
      
      html2canvas(backCardRef.current, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const backImg = printWindow.document.getElementById('back-card')
        if (backImg) {
          // Utiliser replaceChildren pour éviter innerHTML (sécurité XSS)
          const img = printWindow.document.createElement('img')
          img.src = canvas.toDataURL('image/png')
          img.style.width = '100%'
          img.style.height = '100%'
          img.style.objectFit = 'contain'
          backImg.replaceChildren(img)
        }
      }).catch(error => {
        logger.error('Erreur lors de la génération de l\'image verso', error)
        toast.error('Erreur lors de la préparation de l\'impression')
      })
      
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }, 100)
  }

  const handleRegenerateQR = async () => {
    if (!window.confirm('Voulez-vous vraiment régénérer le QR code ? L\'ancien ne fonctionnera plus.')) {
      return
    }

    setLoading(true)
    try {
      await regenerateQRCode(student.id)
      toast.success('QR code régénéré avec succès')
      // Recharger le QR code
      setQrCodeUrl(null)
    } catch (error) {
      logger.error('Erreur lors de la régénération du QR code', error)
      toast.error('Erreur lors de la régénération')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeQR = async () => {
    if (!window.confirm('Voulez-vous vraiment révoquer ce QR code ? Il ne pourra plus être utilisé.')) {
      return
    }

    setLoading(true)
    try {
      await revokeQRCode(student.id)
      toast.success('QR code révoqué')
    } catch (error) {
      logger.error('Erreur lors de la révocation du QR code', error)
      toast.error('Erreur lors de la révocation')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    try {
      const url = generateWhatsAppLink(student)
      window.open(url, '_blank')
    } catch (error) {
      logger.error('Erreur lors de l\'ouverture de WhatsApp', error)
      toast.error('Erreur lors de l\'ouverture de WhatsApp')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-emsp-green">
              Carte Étudiante
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.nom} {student.prenom || ''} - {student.classe}
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
        <div className="p-6">
          {/* Cartes côte à côte */}
          <div className="flex justify-center gap-8 mb-6">
            <div ref={frontCardRef}>
              <StudentCard student={student} side="front" />
            </div>
            <div ref={backCardRef}>
              <StudentCard
                student={student}
                side="back"
                onQRCodeReady={setQrCodeUrl}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-gray-200">
            <AnimatedButton
              variant="primary"
              onClick={() => handleDownload('both')}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Télécharger (PNG)</span>
            </AnimatedButton>
            
            <AnimatedButton
              variant="secondary"
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Printer size={18} />
              <span>Imprimer</span>
            </AnimatedButton>
            
            <AnimatedButton
              variant="secondary"
              onClick={handleWhatsApp}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <MessageCircle size={18} />
              <span>Envoyer par WhatsApp</span>
            </AnimatedButton>
            
            <AnimatedButton
              variant="outline"
              onClick={handleRegenerateQR}
              disabled={loading || student.qr_code_status === 'revoked'}
              className="flex items-center space-x-2"
            >
              <RotateCcw size={18} />
              <span>Régénérer QR</span>
            </AnimatedButton>
            
            <AnimatedButton
              variant="outline"
              onClick={handleRevokeQR}
              disabled={loading || student.qr_code_status === 'revoked'}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <Ban size={18} />
              <span>Révoquer QR</span>
            </AnimatedButton>
          </div>

          {/* Instructions d'impression */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-semibold mb-2">💡 Instructions d'impression :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Format recommandé : 2 cartes par page A4</li>
              <li>Découper selon les repères de découpe</li>
              <li>Plastifier pour une meilleure durabilité</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

