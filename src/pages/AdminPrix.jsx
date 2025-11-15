import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { DollarSign, History, Settings } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import AnimatedModal from '../components/ui/AnimatedModal'
import { Input } from '../components/ui'
import PageTransition from '../components/ui/PageTransition'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../lib/utils'
import { format, parseISO } from 'date-fns'
import { logActivity, ACTIONS } from '../lib/activityLogger'
import { PRIX_MENSUEL } from '../lib/constants'
import logger from '../lib/logger'

export default function AdminPrix() {
  const { isAdmin, user } = useAuth()
  const [defaultPrice, setDefaultPrice] = useState(PRIX_MENSUEL)
  const [loading, setLoading] = useState(true)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [priceHistory, setPriceHistory] = useState([])
  const [pricingByLine, setPricingByLine] = useState(false)
  const [pricingByNiveau, setPricingByNiveau] = useState(false)
  const [lines, setLines] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    if (!isAdmin) return
    fetchSettings()
    fetchPriceHistory()
    fetchLines()
    fetchNiveaux()
  }, [isAdmin])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setDefaultPrice(data.default_monthly_fee || PRIX_MENSUEL)
        setPricingByLine(data.pricing_by_line || false)
        setPricingByNiveau(data.pricing_by_niveau || false)
      }
    } catch (error) {
      logger.error('Erreur récupération settings', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPriceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select(`
          *,
          changed_by_profile:changed_by (
            id,
            nom,
            email
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setPriceHistory(data || [])
    } catch (error) {
      logger.error('Erreur récupération historique', error)
    }
  }

  const fetchLines = async () => {
    try {
      const { data } = await supabase
        .from('lines')
        .select('*')
        .order('nom')
      
      if (data) setLines(data)
    } catch (error) {
      logger.error('Erreur récupération lignes', error)
    }
  }

  const fetchNiveaux = async () => {
    try {
      const { data } = await supabase
        .from('niveaux')
        .select('*')
        .order('nom')
      
      if (data) setNiveaux(data)
    } catch (error) {
      logger.error('Erreur récupération niveaux', error)
    }
  }

  const handleUpdateDefaultPrice = async () => {
    const price = parseInt(newPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }

    try {
      const oldPrice = defaultPrice

      // Mettre à jour settings (créer si n'existe pas)
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (existingSettings) {
        const { error: updateError } = await supabase
          .from('settings')
          .update({ default_monthly_fee: price })
          .eq('id', existingSettings.id)
        
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{ default_monthly_fee: price }])
        
        if (insertError) throw insertError
      }

      // Logger dans price_history
      await supabase
        .from('price_history')
        .insert([{
          price_type: 'default',
          entity_id: null,
          old_price: oldPrice,
          new_price: price,
          changed_by: user?.id || null,
        }])

      await logActivity({
        action: ACTIONS.UPDATE_DEFAULT_PRICE,
        entityType: 'settings',
        details: {
          old_price: oldPrice,
          new_price: price,
        },
      })

      setDefaultPrice(price)
      setShowPriceModal(false)
      setNewPrice('')
      fetchPriceHistory()
      toast.success('Prix par défaut mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Erreur mise à jour prix par défaut', error)
    }
  }

  const handleUpdateLinePrice = async (lineId, newPrice) => {
    const price = parseInt(newPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }

    try {
      const line = lines.find(l => l.id === lineId)
      const oldPrice = line?.price || null

      // Mettre à jour la ligne
      const { error } = await supabase
        .from('lines')
        .update({ price })
        .eq('id', lineId)

      if (error) throw error

      // Logger dans price_history
      await supabase
        .from('price_history')
        .insert([{
          price_type: 'line',
          entity_id: lineId,
          old_price: oldPrice,
          new_price: price,
          changed_by: user?.id || null,
        }])

      await logActivity({
        action: ACTIONS.UPDATE_LINE_PRICE,
        entityType: 'line',
        entityId: lineId,
        details: {
          old_price: oldPrice,
          new_price: price,
        },
      })

      fetchLines()
      fetchPriceHistory()
      toast.success('Prix de la ligne mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Erreur mise à jour prix ligne', error, { lineId })
    }
  }

  const handleUpdateNiveauPrice = async (niveauId, newPrice) => {
    const price = parseInt(newPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Le prix doit être supérieur à 0')
      return
    }

    try {
      const niveau = niveaux.find(n => n.id === niveauId)
      const oldPrice = niveau?.price || null

      // Mettre à jour le niveau
      const { error } = await supabase
        .from('niveaux')
        .update({ price })
        .eq('id', niveauId)

      if (error) throw error

      // Logger dans price_history
      await supabase
        .from('price_history')
        .insert([{
          price_type: 'niveau',
          entity_id: niveauId,
          old_price: oldPrice,
          new_price: price,
          changed_by: user?.id || null,
        }])

      await logActivity({
        action: ACTIONS.UPDATE_NIVEAU_PRICE,
        entityType: 'niveau',
        entityId: niveauId,
        details: {
          old_price: oldPrice,
          new_price: price,
        },
      })

      fetchNiveaux()
      fetchPriceHistory()
      toast.success('Prix du niveau mis à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Erreur mise à jour prix niveau', error, { niveauId })
    }
  }

  const handleTogglePricingByLine = async () => {
    try {
      const newValue = !pricingByLine
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (existingSettings) {
        await supabase
          .from('settings')
          .update({ pricing_by_line: newValue })
          .eq('id', existingSettings.id)
      } else {
        await supabase
          .from('settings')
          .insert([{ pricing_by_line: newValue }])
      }

      setPricingByLine(newValue)
      toast.success(`Tarification par ligne ${newValue ? 'activée' : 'désactivée'}`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Erreur toggle tarification par ligne', error)
    }
  }

  const handleTogglePricingByNiveau = async () => {
    try {
      const newValue = !pricingByNiveau
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single()

      if (existingSettings) {
        await supabase
          .from('settings')
          .update({ pricing_by_niveau: newValue })
          .eq('id', existingSettings.id)
      } else {
        await supabase
          .from('settings')
          .insert([{ pricing_by_niveau: newValue }])
      }

      setPricingByNiveau(newValue)
      toast.success(`Tarification par niveau ${newValue ? 'activée' : 'désactivée'}`)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Erreur toggle tarification par niveau', error)
    }
  }

  const paginatedHistory = priceHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(priceHistory.length / itemsPerPage)

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs</p>
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
              Gestion des Prix
            </h1>
            <p className="text-gray-600 mt-1">
              Configurez les prix mensuels et l'historique des modifications
            </p>
          </div>

          {/* Section 1 : Prix par défaut */}
          <AnimatedCard delay={0.1} className="p-6">
            <h2 className="text-xl font-semibold text-emsp-green mb-4 flex items-center">
              <DollarSign size={24} className="mr-2" />
              Prix par défaut
            </h2>
            
            <div className="bg-emsp-green-light/10 border-2 border-emsp-green-light rounded-lg p-6 mb-4">
              <p className="text-sm text-gray-600 mb-2">Prix actuel</p>
              <p className="text-4xl font-bold text-emsp-green">
                {formatCurrency(defaultPrice)}
              </p>
              <p className="text-sm text-gray-500 mt-1">par mois</p>
            </div>

            <AnimatedButton
              onClick={() => {
                setNewPrice(defaultPrice.toString())
                setShowPriceModal(true)
              }}
              className="flex items-center space-x-2"
            >
              <Settings size={20} />
              <span>Modifier le prix</span>
            </AnimatedButton>
          </AnimatedCard>

          {/* Section 2 : Historique */}
          <AnimatedCard delay={0.2} className="p-6">
            <h2 className="text-xl font-semibold text-emsp-green mb-4 flex items-center">
              <History size={24} className="mr-2" />
              Historique des modifications
            </h2>
            
            {priceHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune modification enregistrée</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-emsp-green">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-emsp-green">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-emsp-green">Ancien prix</th>
                        <th className="text-left py-3 px-4 font-semibold text-emsp-green">Nouveau prix</th>
                        <th className="text-left py-3 px-4 font-semibold text-emsp-green">Modifié par</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {format(parseISO(entry.changed_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {entry.price_type === 'default' ? 'Par défaut' :
                               entry.price_type === 'line' ? 'Par ligne' :
                               entry.price_type === 'niveau' ? 'Par niveau' : entry.price_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {entry.old_price ? formatCurrency(entry.old_price) : '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {formatCurrency(entry.new_price)}
                          </td>
                          <td className="py-3 px-4">
                            {entry.changed_by_profile?.nom || entry.changed_by_profile?.email || 'Système'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </AnimatedCard>

          {/* Section 3 : Prix par ligne */}
          <AnimatedCard delay={0.3} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-emsp-green">
                Prix par ligne
              </h2>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingByLine}
                  onChange={handleTogglePricingByLine}
                  className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                />
                <span className="text-sm font-medium text-gray-700">
                  Activer tarification par ligne
                </span>
              </label>
            </div>

            {pricingByLine ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Ligne</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Prix mensuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: line.couleur || '#2D5016' }}
                            />
                            <span className="font-medium">{line.nom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={line.price || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (parseInt(value) > 0)) {
                                handleUpdateLinePrice(line.id, value || defaultPrice)
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) <= 0) {
                                e.target.value = line.price || defaultPrice
                              }
                            }}
                            placeholder={defaultPrice.toString()}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green"
                          />
                          <span className="ml-2 text-sm text-gray-600">FCFA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Toutes les lignes utilisent le prix par défaut
              </p>
            )}
          </AnimatedCard>

          {/* Section 4 : Prix par niveau */}
          <AnimatedCard delay={0.4} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-emsp-green">
                Prix par niveau
              </h2>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingByNiveau}
                  onChange={handleTogglePricingByNiveau}
                  className="w-4 h-4 text-emsp-green border-gray-300 rounded focus:ring-emsp-green"
                />
                <span className="text-sm font-medium text-gray-700">
                  Activer tarification par niveau
                </span>
              </label>
            </div>

            {pricingByNiveau ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Niveau</th>
                      <th className="text-left py-3 px-4 font-semibold text-emsp-green">Prix mensuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niveaux.map((niveau) => (
                      <tr key={niveau.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{niveau.nom}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={niveau.price || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (parseInt(value) > 0)) {
                                handleUpdateNiveauPrice(niveau.id, value || defaultPrice)
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) <= 0) {
                                e.target.value = niveau.price || defaultPrice
                              }
                            }}
                            placeholder={defaultPrice.toString()}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green"
                          />
                          <span className="ml-2 text-sm text-gray-600">FCFA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Tous les niveaux utilisent le prix par défaut
              </p>
            )}
          </AnimatedCard>

          {/* Info Priorité */}
          <AnimatedCard delay={0.5} className="p-6 bg-blue-50 border-2 border-blue-200">
            <h3 className="font-semibold text-emsp-green mb-2">Priorité des prix :</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Prix par niveau (si activé et défini)</li>
              <li>Sinon, prix par ligne (si activé et défini)</li>
              <li>Sinon, prix par défaut</li>
            </ol>
          </AnimatedCard>
        </div>

        {/* Modal Modification Prix */}
        <AnimatedModal
          isOpen={showPriceModal}
          onClose={() => {
            setShowPriceModal(false)
            setNewPrice('')
          }}
          title="Modifier le prix par défaut"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau prix (FCFA) *
              </label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={defaultPrice.toString()}
                min="1"
                required
              />
            </div>

            {newPrice && parseInt(newPrice) > 0 && (
              <div className="bg-emsp-green-light/10 border-2 border-emsp-green-light rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Aperçu :</p>
                <p className="text-xl font-bold text-emsp-green">
                  Nouveau prix : {formatCurrency(parseInt(newPrice))}/mois
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Ce prix s'appliquera aux nouveaux paiements. Les paiements existants ne seront pas modifiés.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <AnimatedButton
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPriceModal(false)
                  setNewPrice('')
                }}
                className="flex-1"
              >
                Annuler
              </AnimatedButton>
              <AnimatedButton
                type="button"
                variant="primary"
                onClick={handleUpdateDefaultPrice}
                disabled={!newPrice || parseInt(newPrice) <= 0}
                className="flex-1"
              >
                Confirmer
              </AnimatedButton>
            </div>
          </div>
        </AnimatedModal>
      </PageTransition>
    </Layout>
  )
}

