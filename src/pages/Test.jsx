import { useState } from 'react'
import Layout from '../components/Layout'
import { Button, Card, Input, Select, Badge, AnimatedCard, AnimatedButton, AnimatedCounter, AnimatedModal, AnimatedBadge } from '../components/ui'
import ResponsiveModal from '../components/ui/ResponsiveModal'
import { Users, DollarSign, CheckCircle, AlertCircle, X, Plus, Edit, Trash2, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Test() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showAnimatedModal, setShowAnimatedModal] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [loading, setLoading] = useState(false)

  // Vérifier que c'est en développement
  if (import.meta.env.PROD) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Cette page n'est accessible qu'en mode développement.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </Layout>
    )
  }

  const handleToast = (type) => {
    switch (type) {
      case 'success':
        toast.success('Opération réussie !')
        break
      case 'error':
        toast.error('Une erreur est survenue')
        break
      case 'info':
        toast.info('Information importante')
        break
      case 'warning':
        toast('Attention !', { icon: '⚠️' })
        break
      case 'loading':
        toast.loading('Chargement en cours...')
        break
      default:
        toast('Notification par défaut')
    }
  }

  const handleLoading = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    toast.success('Action terminée !')
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent mb-2">
            Page de Test UI
          </h1>
          <p className="text-gray-600">Testez tous les composants de l'interface utilisateur</p>
          <Badge className="mt-2">Mode Développement</Badge>
        </div>

        {/* Boutons */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Boutons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
            <Button loading={loading} onClick={handleLoading}>
              Loading
            </Button>
            <AnimatedButton variant="primary">Animated</AnimatedButton>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </Card>

        {/* Inputs */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Input normal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tapez quelque chose..."
            />
            <Input
              label="Input avec erreur"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error="Ce champ contient une erreur"
            />
            <Input
              label="Input requis *"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
            />
            <Input
              label="Input désactivé"
              value="Valeur fixe"
              disabled
            />
            <Input
              label="Input avec icône"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
        </Card>

        {/* Select */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Select</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select normal"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            >
              <option value="">Sélectionner...</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
              <option value="3">Option 3</option>
            </Select>
            <Select
              label="Select avec erreur"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              error="Erreur de sélection"
            >
              <option value="">Sélectionner...</option>
              <option value="1">Option 1</option>
            </Select>
            <Select
              label="Select requis *"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="1">Option 1</option>
            </Select>
            <Select
              label="Select désactivé"
              value="1"
              disabled
            >
              <option value="1">Option 1</option>
            </Select>
          </div>
        </Card>

        {/* Badges */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="success">Success</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge>Default</Badge>
            <AnimatedBadge variant="success">Animated</AnimatedBadge>
          </div>
        </Card>

        {/* Cards */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-bold mb-2">Card normale</h3>
              <p className="text-gray-600">Contenu de la carte</p>
            </Card>
            <AnimatedCard delay={0.1} className="p-4">
              <h3 className="font-bold mb-2">Card animée</h3>
              <p className="text-gray-600">Avec animation d'entrée</p>
            </AnimatedCard>
            <Card className="p-4 bg-gradient-to-br from-emsp-yellow/20 to-emsp-green/20">
              <h3 className="font-bold mb-2">Card avec gradient</h3>
              <p className="text-gray-600">Style personnalisé</p>
            </Card>
          </div>
        </Card>

        {/* Modals */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Modals</h2>
          <div className="flex gap-4">
            <Button onClick={() => setShowModal(true)}>Ouvrir Modal</Button>
            <Button onClick={() => setShowAnimatedModal(true)}>Ouvrir Animated Modal</Button>
          </div>

          {showModal && (
            <ResponsiveModal
              title="Modal de test"
              onClose={() => setShowModal(false)}
            >
              <p className="mb-4">Contenu de la modal</p>
              <Button onClick={() => setShowModal(false)}>Fermer</Button>
            </ResponsiveModal>
          )}

          {showAnimatedModal && (
            <AnimatedModal
              isOpen={showAnimatedModal}
              title="Modal animée"
              onClose={() => setShowAnimatedModal(false)}
            >
              <p className="mb-4">Cette modal a une animation d'entrée/sortie</p>
              <Button onClick={() => setShowAnimatedModal(false)}>Fermer</Button>
            </AnimatedModal>
          )}
        </Card>

        {/* Toasts */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Toasts</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button variant="success" onClick={() => handleToast('success')}>
              Success
            </Button>
            <Button variant="error" onClick={() => handleToast('error')}>
              Error
            </Button>
            <Button variant="info" onClick={() => handleToast('info')}>
              Info
            </Button>
            <Button variant="warning" onClick={() => handleToast('warning')}>
              Warning
            </Button>
            <Button onClick={() => handleToast('loading')}>
              Loading
            </Button>
          </div>
        </Card>

        {/* Animated Counter */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Animated Counter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Nombre simple</p>
              <p className="text-4xl font-bold text-emsp-green">
                <AnimatedCounter value={1234} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avec suffixe</p>
              <p className="text-4xl font-bold text-emsp-yellow">
                <AnimatedCounter value={5678} suffix=" FCFA" />
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avec décimales</p>
              <p className="text-4xl font-bold text-emsp-lightGreen">
                <AnimatedCounter value={99.99} decimals={2} />
              </p>
            </div>
          </div>
        </Card>

        {/* Icônes */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Icônes</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            <div className="text-center">
              <Users className="mx-auto mb-2 text-emsp-green" size={32} />
              <p className="text-xs">Users</p>
            </div>
            <div className="text-center">
              <DollarSign className="mx-auto mb-2 text-emsp-yellow" size={32} />
              <p className="text-xs">Dollar</p>
            </div>
            <div className="text-center">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              <p className="text-xs">Check</p>
            </div>
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 text-orange-500" size={32} />
              <p className="text-xs">Alert</p>
            </div>
            <div className="text-center">
              <Plus className="mx-auto mb-2 text-blue-500" size={32} />
              <p className="text-xs">Plus</p>
            </div>
            <div className="text-center">
              <Edit className="mx-auto mb-2 text-purple-500" size={32} />
              <p className="text-xs">Edit</p>
            </div>
            <div className="text-center">
              <Trash2 className="mx-auto mb-2 text-red-500" size={32} />
              <p className="text-xs">Trash</p>
            </div>
            <div className="text-center">
              <Search className="mx-auto mb-2 text-gray-500" size={32} />
              <p className="text-xs">Search</p>
            </div>
          </div>
        </Card>

        {/* Informations utilisateur */}
        <Card className="p-6 bg-gradient-to-br from-emsp-yellow/10 to-emsp-green/10">
          <h2 className="text-2xl font-bold text-emsp-green mb-4">Informations</h2>
          <div className="space-y-2">
            <p><strong>Utilisateur :</strong> {user?.email || 'Non connecté'}</p>
            <p><strong>Rôle :</strong> {role || 'Aucun'}</p>
            <p><strong>Environnement :</strong> {import.meta.env.MODE}</p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

