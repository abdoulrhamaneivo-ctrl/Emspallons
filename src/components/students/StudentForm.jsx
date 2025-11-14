import { useState, useEffect } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { isValidPhone, formatPhone } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function StudentForm({ student, onClose, onSuccess }) {
  const { createStudent, updateStudent } = useStudents()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState([])
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    contact: '',
    tuteur: '',
    ligne_id: '',
    point_ramassage: '',
    promotion: '',
    classe: '',
  })

  // Promotions et classes prédéfinies (à adapter selon vos besoins)
  const promotions = ['2024', '2025', '2026', '2027', '2028']
  const classes = [
    '6ème',
    '5ème',
    '4ème',
    '3ème',
    'Seconde',
    'Première',
    'Terminale',
  ]

  useEffect(() => {
    // Charger les lignes
    const fetchLines = async () => {
      const { data } = await supabase
        .from('lines')
        .select('*')
        .eq('active', true)
        .order('nom')
      
      if (data) setLines(data)
    }
    fetchLines()

    // Si on modifie, charger les données
    if (student) {
      setFormData({
        nom: student.nom || '',
        prenom: student.prenom || '',
        contact: student.contact || '',
        tuteur: student.tuteur || '',
        ligne_id: student.ligne_id || '',
        point_ramassage: student.point_ramassage || '',
        promotion: student.promotion || '',
        classe: student.classe || '',
      })
    }
  }, [student])

  const validate = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Le contact est requis'
    } else if (!isValidPhone(formData.contact)) {
      newErrors.contact = 'Format de téléphone invalide'
    }

    if (!formData.ligne_id) {
      newErrors.ligne_id = 'La ligne est requise'
    }

    if (!formData.point_ramassage.trim()) {
      newErrors.point_ramassage = 'Le point de ramassage est requis'
    }

    if (!formData.promotion) {
      newErrors.promotion = 'La promotion est requise'
    }

    if (!formData.classe) {
      newErrors.classe = 'La classe est requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setLoading(true)

    try {
      const dataToSubmit = {
        ...formData,
        contact: formatPhone(formData.contact),
        created_by: user?.id || null,
      }

      let result
      if (student) {
        result = await updateStudent(student.id, dataToSubmit)
      } else {
        result = await createStudent(dataToSubmit)
      }

      if (result.error) {
        throw result.error
      }

      toast.success(
        student
          ? 'Étudiant mis à jour avec succès'
          : 'Étudiant créé avec succès'
      )
      onSuccess?.()
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-emsp-green">
            {student ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <Input
              label="Nom *"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              error={errors.nom}
              required
            />

            {/* Prénom */}
            <Input
              label="Prénom"
              value={formData.prenom}
              onChange={(e) => handleChange('prenom', e.target.value)}
              error={errors.prenom}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact */}
            <Input
              label="Contact *"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              error={errors.contact}
              placeholder="+225 XX XX XX XX XX"
              required
            />

            {/* Tuteur */}
            <Input
              label="Tuteur"
              value={formData.tuteur}
              onChange={(e) => handleChange('tuteur', e.target.value)}
              error={errors.tuteur}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ligne */}
            <Select
              label="Ligne de bus *"
              value={formData.ligne_id}
              onChange={(e) => handleChange('ligne_id', e.target.value)}
              error={errors.ligne_id}
              required
            >
              <option value="">Sélectionner une ligne</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.nom}
                </option>
              ))}
            </Select>

            {/* Point de ramassage */}
            <Input
              label="Point de ramassage *"
              value={formData.point_ramassage}
              onChange={(e) => handleChange('point_ramassage', e.target.value)}
              error={errors.point_ramassage}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Promotion */}
            <Select
              label="Promotion *"
              value={formData.promotion}
              onChange={(e) => handleChange('promotion', e.target.value)}
              error={errors.promotion}
              required
            >
              <option value="">Sélectionner une promotion</option>
              {promotions.map((promo) => (
                <option key={promo} value={promo}>
                  {promo}
                </option>
              ))}
            </Select>

            {/* Classe */}
            <Select
              label="Classe *"
              value={formData.classe}
              onChange={(e) => handleChange('classe', e.target.value)}
              error={errors.classe}
              required
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe} value={classe}>
                  {classe}
                </option>
              ))}
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Enregistrement...'
                : student
                ? 'Mettre à jour'
                : 'Créer l\'étudiant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

