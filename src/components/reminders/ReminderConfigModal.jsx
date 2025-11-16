import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { Input } from '../ui'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { PRIX_MENSUEL } from '../../lib/constants'
import { replaceTemplateVariables } from '../../services/whatsappService'

const AVAILABLE_VARIABLES = [
  { key: 'tuteur', label: 'Nom tuteur', example: 'Kouassi Paul' },
  { key: 'nom_etudiant', label: 'Nom étudiant', example: 'Kouassi' },
  { key: 'prenom_etudiant', label: 'Prénom étudiant', example: 'Jean' },
  { key: 'classe', label: 'Classe', example: '6ème' },
  { key: 'ligne', label: 'Ligne de car', example: 'Yopougon' },
  { key: 'date_expiration', label: 'Date expiration', example: '15/02/2024' },
  { key: 'montant', label: 'Montant à payer', example: '12 500 FCFA' },
  { key: 'jours_restants', label: 'Jours restants', example: '7' },
]

export default function ReminderConfigModal({ isOpen, onClose, reminder }) {
  const [formData, setFormData] = useState({
    display_name: '',
    delay_days: 0,
    message_template: '',
  })
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (reminder) {
      setFormData({
        display_name: reminder.display_name || '',
        delay_days: reminder.delay_days || 0,
        message_template: reminder.message_template || '',
      })
    }
  }, [reminder])

  useEffect(() => {
    // Générer la prévisualisation
    if (formData.message_template) {
      const exampleData = {
        tuteur: 'Kouassi Paul',
        nom_etudiant: 'Kouassi',
        prenom_etudiant: 'Jean',
        classe: '6ème',
        ligne: 'Yopougon',
        date_expiration: format(addDays(new Date(), 7), 'dd/MM/yyyy'),
        montant: `${PRIX_MENSUEL.toLocaleString('fr-FR')} FCFA`,
        jours_restants: '7',
      }
      setPreview(replaceTemplateVariables(formData.message_template, exampleData))
    } else {
      setPreview('')
    }
  }, [formData.message_template])

  const handleInsertVariable = (variable) => {
    const textarea = document.getElementById('message-template')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.message_template
      const newText = text.substring(0, start) + `{${variable}}` + text.substring(end)
      setFormData(prev => ({ ...prev, message_template: newText }))
      
      // Remettre le focus et la position du curseur
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2)
      }, 0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('reminders_config')
        .update({
          display_name: formData.display_name,
          delay_days: formData.delay_days,
          message_template: formData.message_template,
        })
        .eq('id', reminder.id)

      if (error) throw error

      toast.success('Rappel mis à jour avec succès')
      onClose()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le rappel"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nom du rappel *"
          value={formData.display_name}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          required
          placeholder="Ex: 7 jours avant expiration"
        />

        <Input
          label="Délai (nombre de jours) *"
          type="number"
          value={formData.delay_days}
          onChange={(e) => setFormData(prev => ({ ...prev, delay_days: parseInt(e.target.value) || 0 }))}
          required
          placeholder="Ex: -7 (7 jours avant), 0 (jour même), 3 (3 jours après)"
          helpText="Négatif = avant, Positif = après"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template message *
          </label>
          
          {/* Variables disponibles */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">Variables disponibles :</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => handleInsertVariable(variable.key)}
                  className="px-2 py-1 text-xs bg-emsp-green text-white rounded hover:bg-emsp-green/80 transition-colors"
                  title={`Exemple : ${variable.example}`}
                >
                  {'{'}{variable.key}{'}'}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="message-template"
            value={formData.message_template}
            onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green focus:border-emsp-green font-mono text-sm"
            placeholder="Entrez votre message avec les variables {variable}..."
            required
          />
        </div>

        {/* Prévisualisation */}
        {preview && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-2">Prévisualisation :</p>
            <div className="bg-white p-3 rounded border border-blue-300 whitespace-pre-wrap text-sm">
              {preview}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <AnimatedButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  )
}

