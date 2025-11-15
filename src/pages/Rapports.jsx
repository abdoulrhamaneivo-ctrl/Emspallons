import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { FileText, Download, Upload, FileDown, Eye } from 'lucide-react'
import AnimatedCard from '../components/ui/AnimatedCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import PageTransition from '../components/ui/PageTransition'
import { Input, Select } from '../components/ui'
import toast from 'react-hot-toast'
import { format, startOfMonth } from 'date-fns'
import { generateBilanMensuel, exportBilanToCSV, exportBilanToExcel } from '../services/exportBilanService'
import ImportDataModal from '../components/reports/ImportDataModal'
import BilanCharts from '../components/reports/BilanCharts'
import logger from '../lib/logger'

export default function Rapports() {
  const [loading, setLoading] = useState(false)
  const [bilanData, setBilanData] = useState(null)
  const [showCharts, setShowCharts] = useState(false)
  const [formData, setFormData] = useState({
    month: format(startOfMonth(new Date()), 'yyyy-MM'),
    ligne: 'all',
    format: 'csv',
  })
  const [lines, setLines] = useState([])
  const [showImportModal, setShowImportModal] = useState(false)

  // Charger les lignes
  useEffect(() => {
    const fetchLines = async () => {
      const { data } = await supabase
        .from('lines')
        .select('*')
        .eq('active', true)
        .order('nom')
      
      if (data) setLines(data)
    }
    fetchLines()
  }, [])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setShowCharts(false)
      
      const ligneId = formData.ligne === 'all' ? null : formData.ligne
      const generatedData = await generateBilanMensuel(formData.month, ligneId)
      
      // Stocker les données pour les graphiques
      setBilanData(generatedData)
      setShowCharts(true)
      
      toast.success('Bilan généré avec succès')
    } catch (error) {
      logger.error('Erreur lors de la génération du bilan', error, {
        month: formData.month,
        ligne: formData.ligne
      })
      toast.error('Erreur lors de la génération du bilan')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!bilanData) {
      toast.error('Veuillez d\'abord générer le bilan')
      return
    }

    try {
      if (formData.format === 'csv') {
        exportBilanToCSV(bilanData, formData.month)
        toast.success('Bilan exporté en CSV')
      } else {
        exportBilanToExcel(bilanData, formData.month)
        toast.success('Bilan exporté en Excel')
      }
    } catch (error) {
      logger.error('Erreur lors de l\'export du bilan', error)
      toast.error('Erreur lors de l\'export du bilan')
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      ['Nom', 'Prénom', 'Contact', 'Tuteur', 'Ligne', 'Point de ramassage', 'Niveau', 'Classe'],
      ['Kouassi', 'Jean', '+225 07 12 34 56 78', 'Kouassi Paul', 'Yopougon', 'Carrefour', 'Licence 1', '6ème'],
      ['Traoré', 'Marie', '+225 05 98 76 54 32', 'Traoré Amadou', 'Cocody', 'Riviera', 'Master 1', 'Terminale'],
    ]
    
    const csvContent = template.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Template_Import_EMSP.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Template téléchargé')
  }

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
                Rapports et Bilans
              </h1>
              <p className="text-gray-600 mt-1">
                Exportez des bilans mensuels et importez des données
              </p>
            </div>
            <div className="flex space-x-3">
              <AnimatedButton
                variant="outline"
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-2"
              >
                <FileDown size={20} />
                <span>Template CSV</span>
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2"
              >
                <Upload size={20} />
                <span>Importer des données</span>
              </AnimatedButton>
            </div>
          </div>

          {/* Section Export Bilan */}
          <AnimatedCard delay={0.1} className="p-6">
            <h2 className="text-xl font-semibold text-emsp-green mb-4 flex items-center">
              <FileText size={24} className="mr-2" />
              Exporter un bilan mensuel
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mois *
                </label>
                <Input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ligne
                </label>
                <Select
                  value={formData.ligne}
                  onChange={(e) => setFormData(prev => ({ ...prev, ligne: e.target.value }))}
                >
                  <option value="all">Toutes les lignes</option>
                  {lines.map(line => (
                    <option key={line.id} value={line.id}>{line.nom}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format *
                </label>
                <Select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </Select>
              </div>
            </div>

            <div className="flex space-x-3">
              <AnimatedButton
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Eye size={20} />
                <span>{loading ? 'Génération...' : 'Générer et visualiser'}</span>
              </AnimatedButton>
              
              {bilanData && (
                <AnimatedButton
                  onClick={handleExport}
                  disabled={loading}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <Download size={20} />
                  <span>Exporter ({formData.format.toUpperCase()})</span>
                </AnimatedButton>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-emsp-green mb-2">Contenu du bilan :</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Numéro étudiant</li>
                <li>Nom complet</li>
                <li>Classe et Niveau</li>
                <li>Ligne et Contact</li>
                <li>Statut au mois sélectionné</li>
                <li>Dernière date paiement</li>
                <li>Montant dernier paiement</li>
                <li>Mois couverts</li>
                <li>Paiement anticipé (Oui/Non)</li>
                <li>Sessions futures</li>
                <li>Montant total payé (historique)</li>
                <li>Totaux et statistiques</li>
              </ul>
            </div>
          </AnimatedCard>

          {/* Visualisation avec graphiques */}
          {showCharts && bilanData && (
            <div className="mt-6">
              <BilanCharts bilanData={bilanData} />
            </div>
          )}

          {/* Tableau de données détaillées */}
          {showCharts && bilanData && bilanData.data && bilanData.data.length > 0 && (
            <AnimatedCard delay={0.3} className="p-6">
              <h3 className="text-xl font-semibold text-emsp-green mb-4">
                Données Détaillées ({bilanData.data.length} étudiants)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-emsp-green">Étudiant</th>
                      <th className="px-4 py-3 text-left font-semibold text-emsp-green">Classe</th>
                      <th className="px-4 py-3 text-left font-semibold text-emsp-green">Ligne</th>
                      <th className="px-4 py-3 text-left font-semibold text-emsp-green">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-emsp-green">Dernier paiement</th>
                      <th className="px-4 py-3 text-right font-semibold text-emsp-green">Montant total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bilanData.data.slice(0, 20).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{row.nom_complet}</td>
                        <td className="px-4 py-3">{row.classe}</td>
                        <td className="px-4 py-3">{row.ligne}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            row.statut_mois_x.includes('ACTIF') ? 'bg-green-100 text-green-800' :
                            row.statut_mois_x === 'EN_RETARD' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {row.statut_mois_x}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.derniere_date_paiement}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {row.montant_total_paye.toLocaleString('fr-FR')} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bilanData.data.length > 20 && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Affichage des 20 premiers résultats sur {bilanData.data.length} total.
                    Exportez le bilan pour voir toutes les données.
                  </p>
                )}
              </div>
            </AnimatedCard>
          )}
        </div>

        {/* Modal Import */}
        {showImportModal && (
          <ImportDataModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </PageTransition>
    </Layout>
  )
}

