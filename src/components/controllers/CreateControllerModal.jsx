import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Copy, Check, RefreshCw, X } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { Input, Select } from '../ui'
import { hashPassword, generateControllerCode, generateSecurePassword } from '../../lib/controllerAuth'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function CreateControllerModal({ isOpen, onClose, onSuccess, lines }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [createdController, setCreatedController] = useState(null)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    nom: '',
    ligne_id: '',
    code: '',
    password: '',
  })

  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateControllerCode() }))
  }

  const handleGeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generateSecurePassword(12) }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.ligne_id) newErrors.ligne_id = 'La ligne est requise'
    if (!formData.code.trim()) {
      newErrors.code = 'Le code est requis'
    } else {
      const codeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
      if (!codeRegex.test(formData.code.toUpperCase())) {
        newErrors.code = 'Format invalide (XXXX-XXXX)'
      }
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs')
      return
    }

    setLoading(true)
    try {
      // Vérifier si le code existe déjà
      const { data: existing } = await supabase
        .from('controllers')
        .select('id')
        .eq('code', formData.code.toUpperCase().trim())
        .single()

      if (existing) {
        setErrors({ code: 'Ce code existe déjà' })
        setLoading(false)
        return
      }

      // Hash le mot de passe
      const passwordHash = await hashPassword(formData.password)

      // Créer le contrôleur avec le créateur
      const { data, error } = await supabase
        .from('controllers')
        .insert([{
          nom: formData.nom.trim(),
          code: formData.code.toUpperCase().trim(),
          ligne_id: formData.ligne_id,
          password_hash: passwordHash,
          active: true,
          created_by: user?.id, // Enregistrer le créateur
        }])
        .select(`
          *,
          lines:ligne_id (
            id,
            nom,
            couleur
          )
        `)
        .single()

      if (error) throw error

      // Logger l'activité
      await supabase.from('activity_logs').insert([{
        user_id: user?.id,
        action: 'create_controller',
        details: {
          controller_id: data.id,
          controller_name: data.nom,
          controller_code: data.code,
        },
        created_at: new Date().toISOString(),
      }])

      // Afficher le récapitulatif
      setCreatedController({
        ...data,
        password: formData.password, // Garder le mot de passe en clair pour l'affichage
      })
      setShowSummary(true)
      toast.success('Contrôleur créé avec succès !')
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copié !`)
    } catch (error) {
      toast.error('Erreur lors de la copie')
    }
  }

  const handleWhatsApp = () => {
    const line = lines.find(l => l.id === createdController.ligne_id)
    const message = `Contrôleur créé avec succès !\n\nCode: ${createdController.code}\nMot de passe: ${createdController.password}\nLigne: ${line?.nom || 'N/A'}\n\nAccès: ${window.location.origin}/scan`
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleClose = () => {
    setShowSummary(false)
    setCreatedController(null)
    setFormData({ nom: '', ligne_id: '', code: '', password: '' })
    setErrors({})
    onClose()
  }

  if (showSummary && createdController) {
    const line = lines.find(l => l.id === createdController.ligne_id)
    return (
      <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Contrôleur créé avec succès !" size="md">
        <div className="space-y-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Contrôleur créé avec succès !</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Code contrôleur</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-emsp-green font-mono">{createdController.code}</p>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(createdController.code, 'Code')}
                  className="flex items-center space-x-1"
                >
                  <Copy size={16} />
                  <span>Copier</span>
                </AnimatedButton>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Mot de passe</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-emsp-green font-mono">{createdController.password}</p>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(createdController.password, 'Mot de passe')}
                  className="flex items-center space-x-1"
                >
                  <Copy size={16} />
                  <span>Copier</span>
                </AnimatedButton>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Ligne assignée</p>
              <p className="text-lg font-semibold text-emsp-green">{line?.nom || 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              variant="secondary"
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <span>📱</span>
              <span>Envoyer par WhatsApp</span>
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={() => {
                handleClose()
                onSuccess?.()
              }}
              className="flex-1"
            >
              Terminer
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    )
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={handleClose} title="Créer un contrôleur" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom du contrôleur *"
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
          error={errors.nom}
          required
        />

        <Select
          label="Ligne assignée *"
          value={formData.ligne_id}
          onChange={(e) => setFormData(prev => ({ ...prev, ligne_id: e.target.value }))}
          error={errors.ligne_id}
          required
        >
          <option value="">Sélectionner une ligne</option>
          {lines.map(line => (
            <option key={line.id} value={line.id}>{line.nom}</option>
          ))}
        </Select>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code contrôleur (XXXX-XXXX) *
          </label>
          <div className="flex gap-2">
            <Input
              value={formData.code}
              onChange={(e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                // Formatage automatique XXXX-XXXX
                if (value.length > 4 && !value.includes('-')) {
                  value = value.slice(0, 4) + '-' + value.slice(4, 8)
                }
                value = value.slice(0, 9) // Limiter à 9 caractères (XXXX-XXXX)
                setFormData(prev => ({ ...prev, code: value }))
              }}
              error={errors.code}
              placeholder="ABCD-1234"
              className="flex-1 font-mono text-center"
              required
            />
            <AnimatedButton
              type="button"
              variant="outline"
              onClick={handleGenerateCode}
              className="flex items-center space-x-1"
            >
              <RefreshCw size={16} />
              <span>Générer</span>
            </AnimatedButton>
          </div>
          {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe * (min 6 caractères)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <AnimatedButton
              type="button"
              variant="outline"
              onClick={handleGeneratePassword}
              className="flex items-center space-x-1"
            >
              <RefreshCw size={16} />
              <span>Générer</span>
            </AnimatedButton>
          </div>
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          <p className="text-xs text-gray-500 mt-1">Recommandé : Utiliser la génération automatique</p>
        </div>

        <div className="flex gap-3 pt-4">
          <AnimatedButton
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Annuler
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Création...' : 'Créer le contrôleur'}
          </AnimatedButton>
        </div>
      </form>
    </AnimatedModal>
  )
}

