import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Bell, Settings, Send } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import ReminderConfigModal from '../components/reminders/ReminderConfigModal'
import ManualReminders from '../components/reminders/ManualReminders'
import logger from '../lib/logger'

export default function Rappels() {
  const { isAdmin, role } = useAuth()
  const [activeTab, setActiveTab] = useState('automatic')
  const [remindersConfig, setRemindersConfig] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingReminder, setEditingReminder] = useState(null)

  useEffect(() => {
    if (isAdmin || role === 'educator') {
      fetchRemindersConfig()
    }
  }, [isAdmin, role])

  const fetchRemindersConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reminders_config')
        .select('*')
        .order('delay_days', { ascending: true })

      if (error) throw error
      setRemindersConfig(data || [])
    } catch (error) {
      logger.error('Erreur lors du chargement des rappels', error)
      toast.error('Erreur lors du chargement des rappels')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (reminderId, currentActive) => {
    try {
      const { error } = await supabase
        .from('reminders_config')
        .update({ active: !currentActive })
        .eq('id', reminderId)

      if (error) throw error
      
      setRemindersConfig(prev =>
        prev.map(r => r.id === reminderId ? { ...r, active: !currentActive } : r)
      )
      
      toast.success(`Rappel ${!currentActive ? 'activé' : 'désactivé'}`)
    } catch (error) {
      logger.error('Erreur lors de la modification', error)
      toast.error('Erreur lors de la modification')
    }
  }

  if (!isAdmin && role !== 'educator') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs et éducateurs</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
              Rappels
            </h1>
            <p className="text-gray-600 mt-1">
              Gérer les rappels automatiques et envoyer des rappels manuels
            </p>
          </div>

          {/* Onglets */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('automatic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'automatic'
                    ? 'border-emsp-green text-emsp-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings size={18} />
                  <span>Automatiques</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manual'
                    ? 'border-emsp-green text-emsp-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send size={18} />
                  <span>Manuels</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'automatic' ? (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emsp-yellow mx-auto"></div>
                </div>
              ) : (
                remindersConfig.map((reminder) => (
                  <AnimatedCard key={reminder.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Bell className="text-emsp-green" size={24} />
                          <div>
                            <h3 className="text-lg font-semibold text-emsp-green">
                              {reminder.display_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Délai : {reminder.delay_days > 0 ? '+' : ''}{reminder.delay_days} jour(s)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reminder.active}
                            onChange={() => handleToggleActive(reminder.id, reminder.active)}
                            className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                          />
                          <span className={`text-sm font-medium ${
                            reminder.active ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {reminder.active ? 'Actif' : 'Inactif'}
                          </span>
                        </label>

                        <AnimatedButton
                          variant="outline"
                          onClick={() => setEditingReminder(reminder)}
                          className="flex items-center space-x-2"
                        >
                          <Settings size={16} />
                          <span>Modifier</span>
                        </AnimatedButton>
                      </div>
                    </div>
                  </AnimatedCard>
                ))
              )}
            </div>
          ) : (
            <ManualReminders />
          )}
        </div>

        {/* Modal modification rappel automatique */}
        {editingReminder && (
          <ReminderConfigModal
            isOpen={!!editingReminder}
            onClose={() => {
              setEditingReminder(null)
              fetchRemindersConfig()
            }}
            reminder={editingReminder}
          />
        )}
      </PageTransition>
    </Layout>
  )
}

