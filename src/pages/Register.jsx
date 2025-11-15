import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import Logo from '../components/ui/Logo'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { Input } from '../components/ui'
import { FloatingShapes, GradientOrb } from '../components/ui/DecorativeElements'

export default function Register() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkFirstUser()
  }, [])

  const checkFirstUser = async () => {
    try {
      const { data, error } = await supabase.rpc('check_if_first_user')
      
      if (error) {
        console.error('Error checking first user:', error)
        // En cas d'erreur, rediriger vers login pour sécurité
        navigate('/login')
        return
      }

      if (!data) {
        // Un admin existe déjà, rediriger vers login
        toast.error('Un compte administrateur existe déjà')
        navigate('/login')
        return
      }

      setChecking(false)
    } catch (error) {
      console.error('Error in checkFirstUser:', error)
      navigate('/login')
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
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
      // Vérifier à nouveau qu'aucun admin n'existe
      const { data: canRegister, error: checkError } = await supabase.rpc('check_if_first_user')
      
      if (checkError) throw checkError
      if (!canRegister) {
        toast.error('Un compte administrateur existe déjà')
        navigate('/login')
        return
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      // Créer le profil dans la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: formData.email.trim(),
            nom: formData.nom.trim(),
            role: 'admin',
          },
        ])

      if (profileError) {
        // Si la création du profil échoue, supprimer l'utilisateur auth
        await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error)
        throw profileError
      }

      toast.success('Compte administrateur créé avec succès !')
      
      // Connexion automatique
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (signInError) {
        console.error('Auto-login error:', signInError)
        navigate('/login')
        return
      }

      // Redirection vers le dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-12 w-12 border-4 border-emsp-yellow/30 border-t-emsp-yellow mx-auto mb-4"
            />
            <p className="text-emsp-green font-medium">Vérification...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center relative overflow-hidden">
          <FloatingShapes />
          <GradientOrb position="top-right" size="large" />
          <GradientOrb position="bottom-left" size="medium" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 relative z-10"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <Logo size="xl" showText={true} variant="transport" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent"
              >
                Créer le compte administrateur
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mt-2"
              >
                Première inscription - Configuration initiale
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Input
                  label="Nom complet *"
                  value={formData.nom}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nom: e.target.value }))
                    if (errors.nom) setErrors(prev => ({ ...prev, nom: null }))
                  }}
                  error={errors.nom}
                  required
                  placeholder="Votre nom complet"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }))
                  }}
                  error={errors.email}
                  required
                  placeholder="admin@emsp.com"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Input
                  label="Mot de passe *"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }))
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }))
                  }}
                  error={errors.password}
                  required
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Input
                  label="Confirmer le mot de passe *"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }))
                  }}
                  error={errors.confirmPassword}
                  required
                  placeholder="Répétez le mot de passe"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte admin'}
                </AnimatedButton>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </PageTransition>
    </Layout>
  )
}

