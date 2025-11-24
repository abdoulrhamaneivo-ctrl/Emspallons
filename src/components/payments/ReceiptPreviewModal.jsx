import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Download, MessageCircle } from 'lucide-react'
import { generateReceiptPDF, downloadReceipt, generateWhatsAppLink } from '../../services/receiptService'
import AnimatedButton from '../ui/AnimatedButton'
import toast from 'react-hot-toast'

export default function ReceiptPreviewModal({ isOpen, onClose, payment, student }) {
  const [pdfBlob, setPdfBlob] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const lastGeneratedKey = useRef(null)

  // Calculer la clé de cache pour le PDF
  const cacheKey = payment?.id && student?.id ? `${payment.id}-${student.id}` : null

  // Générer le PDF et le convertir en blob pour l'affichage
  const generatePDF = useCallback(async (keyOverride = null) => {
    const currentCacheKey = payment?.id && student?.id ? `${payment.id}-${student.id}` : null
    const cacheKeyToUse = keyOverride || currentCacheKey
    
    if (!payment || !student || !cacheKeyToUse) return

    setLoading(true)
    try {
      const doc = await generateReceiptPDF(payment, student)
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      
      setPdfBlob(blob)
      setPdfUrl(url)
      lastGeneratedKey.current = cacheKeyToUse
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      toast.error('Erreur lors de la génération du reçu')
    } finally {
      setLoading(false)
    }
  }, [payment, student])

  // Générer le PDF lorsque le modal s'ouvre ou que les données changent
  useEffect(() => {
    if (!isOpen || !cacheKey || !payment || !student) return

    // Générer le PDF seulement si la clé a changé
    if (lastGeneratedKey.current !== cacheKey) {
      generatePDF(cacheKey)
    }

    // Nettoyer l'URL blob lors du démontage pour éviter les fuites mémoire
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cacheKey, generatePDF])

  // Télécharger le reçu en PDF
  const handleDownload = async () => {
    if (!payment || !student) return

    try {
      const doc = await generateReceiptPDF(payment, student)
      const studentName = `${student.nom} ${student.prenom || ''}`.trim()
      const receiptDate = payment.created_at || new Date().toISOString()
      
      downloadReceipt(doc, studentName, receiptDate)
      toast.success('Reçu téléchargé')
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  // Ouvrir WhatsApp automatiquement avec le numéro de l'étudiant
  const handleWhatsApp = () => {
    if (!payment || !student) return

    if (!student.contact) {
      toast.error('Contact de l\'étudiant non disponible')
      return
    }

    try {
      const whatsappUrl = generateWhatsAppLink(payment, student)
      window.open(whatsappUrl, '_blank')
      toast.success('WhatsApp ouvert avec le numéro de l\'étudiant')
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de WhatsApp:', error)
      toast.error(error.message || 'Erreur lors de l\'ouverture de WhatsApp')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emsp-green">
              Prévisualisation du Reçu
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {student?.nom} {student?.prenom || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu PDF */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-green mx-auto mb-4"></div>
                <p className="text-gray-600">Génération du reçu...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border border-gray-300 rounded-lg"
              title="Aperçu du reçu"
              style={{ minHeight: '600px' }}
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Erreur lors du chargement du PDF</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <AnimatedButton
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </AnimatedButton>
          <AnimatedButton
            variant="secondary"
            onClick={handleDownload}
            disabled={loading || !pdfBlob}
            className="flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Télécharger</span>
          </AnimatedButton>
          <AnimatedButton
            variant="primary"
            onClick={handleWhatsApp}
            disabled={loading || !payment || !student}
            className="flex items-center space-x-2"
          >
            <MessageCircle size={18} />
            <span>Envoyer par WhatsApp</span>
          </AnimatedButton>
        </div>
      </div>
    </div>
  )
}

