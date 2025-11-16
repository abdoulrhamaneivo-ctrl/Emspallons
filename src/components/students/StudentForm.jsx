import { useState, useEffect } from 'react'
import { useStudents } from '../../hooks/useStudents'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { isValidPhone, formatPhone } from '../../lib/utils'
import { formatPhoneNumber, validatePhoneNumber, detectCountry, getAvailableCountries } from '../../lib/phoneFormatter'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function StudentForm({ student, onClose, onSuccess }) {
  const { createStudent, updateStudent } = useStudents()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState([])
  const [errors, setErrors] = useState({})
  const [phoneCountry, setPhoneCountry] = useState('CI')

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    contact: '',
    tuteur: '',
    ligne_id: '',
    point_ramassage: '',
    niveau: '',
    classe: '',
  })

  const [niveaux, setNiveaux] = useState([])
  const [classes, setClasses] = useState([])

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

    // Charger les niveaux depuis Supabase
    const fetchNiveaux = async () => {
      const { data } = await supabase
        .from('niveaux')
        .select('*')
        .eq('active', true)
        .order('nom', { ascending: true })
      
      if (data) {
        setNiveaux(data.map(p => p.nom))
      } else {
        // Fallback si la table n'existe pas encore
        setNiveaux(['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'])
      }
    }

    // Charger les classes depuis Supabase
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('active', true)
        .order('ordre', { ascending: true })
      
      if (data) {
        setClasses(data.map(c => c.nom))
      } else {
        // Fallback si la table n'existe pas encore
        setClasses(['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'])
      }
    }

    fetchLines()
    fetchNiveaux()
    fetchClasses()

    // Si on modifie, charger les données
    if (student) {
      const detectedCountry = student.contact ? detectCountry(student.contact) : 'CI'
      setPhoneCountry(detectedCountry)
      setFormData({
        nom: student.nom || '',
        prenom: student.prenom || '',
        contact: student.contact || '',
        tuteur: student.tuteur || '',
        ligne_id: student.ligne_id || '',
        point_ramassage: student.point_ramassage || '',
        niveau: student.niveau || '',
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
    } else if (!validatePhoneNumber(formData.contact, phoneCountry)) {
      newErrors.contact = 'Format de téléphone invalide pour ' + getAvailableCountries().find(c => c.code === phoneCountry)?.name
    }

    if (!formData.ligne_id) {
      newErrors.ligne_id = 'La ligne est requise'
    }

    if (!formData.point_ramassage.trim()) {
      newErrors.point_ramassage = 'Le point de ramassage est requis'
    }

    if (!formData.niveau) {
      newErrors.niveau = 'Le niveau est requis'
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
        contact: formatPhoneNumber(formData.contact, phoneCountry),
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
      logger.error('Erreur création/modification étudiant', error)
      toast.error(error.message || 'Une erreur est survenue')
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
            {/* Contact avec sélection pays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact *
              </label>
              <div className="flex gap-2">
                <Select
                  value={phoneCountry}
                  onChange={(e) => {
                    setPhoneCountry(e.target.value)
                    if (formData.contact) {
                      const formatted = formatPhoneNumber(formData.contact, e.target.value)
                      handleChange('contact', formatted)
                    }
                  }}
                  className="w-32"
                >
                  {getAvailableCountries().map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </Select>
                <Input
                  value={formData.contact}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value, phoneCountry)
                    handleChange('contact', formatted)
                  }}
                  error={errors.contact}
                  required
                  placeholder="Numéro de téléphone"
                  className="flex-1"
                />
              </div>
              {errors.contact && (
                <p className="text-sm text-red-600 mt-1">{errors.contact}</p>
              )}
            </div>

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
              label="Ligne de car *"
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
            {/* Niveau */}
            <Select
              label="Niveau *"
              value={formData.niveau}
              onChange={(e) => handleChange('niveau', e.target.value)}
              error={errors.niveau}
              required
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((niveau) => (
                <option key={niveau} value={niveau}>
                  {niveau}
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

