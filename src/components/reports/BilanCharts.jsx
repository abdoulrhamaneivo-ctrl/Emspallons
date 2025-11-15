import { useMemo } from 'react'
import { TrendingUp, Users, DollarSign, AlertCircle, Calendar } from 'lucide-react'
import AnimatedCard from '../ui/AnimatedCard'
import AnimatedCounter from '../ui/AnimatedCounter'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Composant de graphiques pour visualiser les données du bilan mensuel
 */
export default function BilanCharts({ bilanData }) {
  const { data, totaux, month } = bilanData || { data: [], totaux: {}, month: null }
  
  // Formater le mois pour l'affichage
  const monthFormatted = useMemo(() => {
    if (!month) return ''
    try {
      const date = parseISO(month + '-01')
      return format(date, 'MMMM yyyy', { locale: fr })
    } catch {
      return month
    }
  }, [month])

  // Calcul des statistiques pour les graphiques
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalStudents: 0,
        actifs: 0,
        expires: 0,
        enRetard: 0,
        totalRevenue: 0,
        revenueMois: 0,
        tauxRecouvrement: 0,
        paiementsAnticipés: 0,
      }
    }

    const actifs = data.filter(s => s.statut_mois_x.includes('ACTIF')).length
    const expires = data.filter(s => s.statut_mois_x === 'EXPIRÉ').length
    const enRetard = data.filter(s => s.statut_mois_x === 'EN_RETARD').length
    const paiementsAnticipés = data.filter(s => s.paiement_anticipe === 'Oui').length

    return {
      totalStudents: data.length,
      actifs,
      expires,
      enRetard,
      totalRevenue: totaux?.total_encaisse_historique || 0,
      revenueMois: totaux?.total_encaisse_mois || 0,
      tauxRecouvrement: parseFloat(totaux?.taux_recouvrement?.replace('%', '') || 0),
      paiementsAnticipés,
    }
  }, [data, totaux])

  // Données pour le graphique circulaire (statuts)
  const statusData = useMemo(() => {
    const total = stats.totalStudents
    if (total === 0) return []

    return [
      {
        label: 'Actifs',
        value: stats.actifs,
        percentage: ((stats.actifs / total) * 100).toFixed(1),
        color: 'bg-green-500',
        textColor: 'text-green-700',
      },
      {
        label: 'En retard',
        value: stats.enRetard,
        percentage: ((stats.enRetard / total) * 100).toFixed(1),
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
      },
      {
        label: 'Expirés',
        value: stats.expires,
        percentage: ((stats.expires / total) * 100).toFixed(1),
        color: 'bg-red-500',
        textColor: 'text-red-700',
      },
    ]
  }, [stats])

  if (!bilanData || !data || data.length === 0) {
    return (
      <AnimatedCard className="p-6">
        <p className="text-center text-gray-500">
          Aucune donnée à afficher. Générez un bilan pour voir les statistiques.
        </p>
      </AnimatedCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec le mois */}
      {monthFormatted && (
        <AnimatedCard delay={0} className="p-4 bg-gradient-to-r from-emsp-green/10 to-emsp-yellow/10 border-2 border-emsp-green/20">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="text-emsp-green" size={24} />
            <h2 className="text-2xl font-bold text-emsp-green">
              Bilan Mensuel - {monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1)}
            </h2>
          </div>
        </AnimatedCard>
      )}

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCard delay={0.1} className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Étudiants</p>
              <div className="text-3xl font-bold text-emsp-green">
                <AnimatedCounter value={stats.totalStudents} />
              </div>
            </div>
            <Users className="text-emsp-green" size={40} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de Recouvrement</p>
              <div className="text-3xl font-bold text-blue-600">
                <AnimatedCounter value={stats.tauxRecouvrement} suffix="%" decimals={2} />
              </div>
            </div>
            <TrendingUp className="text-blue-600" size={40} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Revenus du Mois {monthFormatted ? `(${monthFormatted})` : ''}
              </p>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.revenueMois.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Paiements reçus ce mois</p>
            </div>
            <DollarSign className="text-yellow-600" size={40} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Historique</p>
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalRevenue.toLocaleString('fr-FR')} <span className="text-xl">FCFA</span>
              </div>
            </div>
            <DollarSign className="text-purple-600" size={40} />
          </div>
        </AnimatedCard>
      </div>

      {/* Graphique des statuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard delay={0.2} className="p-6">
          <h3 className="text-xl font-semibold text-emsp-green mb-2">
            Répartition par Statut
          </h3>
          {monthFormatted && (
            <p className="text-sm text-gray-500 mb-4">
              Au {monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1)}
            </p>
          )}
          
          {/* Graphique en barres horizontales */}
          <div className="space-y-4">
            {statusData.map((item, index) => {
              const percentage = stats.totalStudents > 0 
                ? (item.value / stats.totalStudents) * 100 
                : 0

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.value} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`${item.color} h-full transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 10 && (
                        <span className="text-xs font-semibold text-white">
                          {item.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Légende */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              {statusData.map((item, index) => (
                <div key={index}>
                  <div className={`${item.color} w-full h-2 rounded mb-2`}></div>
                  <p className="text-xs text-gray-600">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>

        {/* Graphique circulaire simplifié */}
        <AnimatedCard delay={0.3} className="p-6">
          <h3 className="text-xl font-semibold text-emsp-green mb-2">
            Vue d'ensemble Mensuelle
          </h3>
          {monthFormatted && (
            <p className="text-sm text-gray-500 mb-4">
              Statistiques pour {monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1)}
            </p>
          )}

          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              {/* Graphique circulaire SVG */}
              <svg className="transform -rotate-90" width="192" height="192">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="24"
                />
                
                {statusData.map((item, index) => {
                  const total = statusData.reduce((sum, i) => sum + i.value, 0)
                  const percentage = total > 0 ? (item.value / total) : 0
                  const offset = statusData
                    .slice(0, index)
                    .reduce((sum, i) => sum + (i.value / total), 0)
                  
                  const circumference = 2 * Math.PI * 80
                  const strokeDasharray = circumference * percentage
                  const strokeDashoffset = circumference * (1 - offset - percentage)

                  return (
                    <circle
                      key={index}
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke={
                        item.label === 'Actifs' ? '#10b981' :
                        item.label === 'En retard' ? '#f59e0b' :
                        '#ef4444'
                      }
                      strokeWidth="24"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  )
                })}
              </svg>

              {/* Centre avec total */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emsp-green">
                    {stats.totalStudents}
                  </p>
                  <p className="text-sm text-gray-600">Étudiants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Actifs</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.actifs} ({((stats.actifs / stats.totalStudents) * 100 || 0).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">En retard</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.enRetard} ({((stats.enRetard / stats.totalStudents) * 100 || 0).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Expirés</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {stats.expires} ({((stats.expires / stats.totalStudents) * 100 || 0).toFixed(1)}%)
              </span>
            </div>
            {stats.paiementsAnticipés > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-700">Paiements anticipés</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.paiementsAnticipés}
                </span>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* Résumé financier */}
      <AnimatedCard delay={0.4} className="p-6 bg-gradient-to-br from-emsp-green/5 to-emsp-yellow/5">
        <h3 className="text-xl font-semibold text-emsp-green mb-2 flex items-center">
          <DollarSign className="mr-2" size={24} />
          Résumé Financier Mensuel
        </h3>
        {monthFormatted && (
          <p className="text-sm text-gray-600 mb-4">
            Données financières pour {monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1)}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">
              Revenus du mois {monthFormatted ? `(${monthFormatted})` : ''}
            </p>
            <p className="text-2xl font-bold text-emsp-green">
              {stats.revenueMois.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Paiements reçus ce mois
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Total historique</p>
            <p className="text-2xl font-bold text-emsp-green">
              {stats.totalRevenue.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tous les paiements enregistrés
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Revenus potentiels</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(stats.expires * (totaux?.montant_mensuel_moyen || 12500)).toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Si tous les expirés payent (estimation)
            </p>
          </div>
        </div>

        {totaux?.taux_recouvrement && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Taux de recouvrement</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emsp-green h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.tauxRecouvrement}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-emsp-green">
                  {stats.tauxRecouvrement.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.actifs} étudiants actifs sur {stats.totalStudents} total
            </p>
          </div>
        )}
      </AnimatedCard>
    </div>
  )
}

