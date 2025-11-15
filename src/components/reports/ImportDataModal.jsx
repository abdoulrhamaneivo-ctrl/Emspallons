import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Upload, FileCheck, AlertCircle, CheckCircle, Download } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { importStudentsFromData } from '../../lib/exportUtils'

const STEPS = {
  UPLOAD: 1,
  MAPPING: 2,
  VALIDATION: 3,
  IMPORT: 4,
}

export default function ImportDataModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [file, setFile] = useState(null)
  const [rawData, setRawData] = useState([])
  const [mappedData, setMappedData] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [validationErrors, setValidationErrors] = useState([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState(null)
  const fileInputRef = useRef(null)

  // Colonnes attendues
  const expectedColumns = [
    'Nom', 'Prénom', 'Contact', 'Tuteur', 'Ligne', 'Point de ramassage', 'Niveau', 'Classe'
  ]

  // ÉTAPE 1 : Upload fichier
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)

    try {
      const data = await readFile(uploadedFile)
      setRawData(data)
      
      // Détection automatique des colonnes
      if (data.length > 0) {
        const headers = Object.keys(data[0])
        const autoMapping = {}
        
        expectedColumns.forEach(expected => {
          const found = headers.find(h => 
            h.toLowerCase().includes(expected.toLowerCase()) ||
            expected.toLowerCase().includes(h.toLowerCase())
          )
          if (found) {
            autoMapping[expected] = found
          }
        })
        
        setColumnMapping(autoMapping)
      }
      
      setStep(STEPS.MAPPING)
    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier')
      console.error(error)
    }
  }

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = reject
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8')
      } else {
        reader.readAsBinaryString(file)
      }
    })
  }

  // ÉTAPE 2 : Mapping colonnes
  const handleMappingChange = (expectedCol, fileCol) => {
    setColumnMapping(prev => ({
      ...prev,
      [expectedCol]: fileCol || null,
    }))
  }

  const handleApplyMapping = () => {
    if (rawData.length === 0) return

    const mapped = rawData.map(row => {
      const mappedRow = {}
      expectedColumns.forEach(expected => {
        const fileCol = columnMapping[expected]
        mappedRow[expected] = fileCol ? row[fileCol] : ''
      })
      return mappedRow
    })

    setMappedData(mapped)
    setStep(STEPS.VALIDATION)
    validateData(mapped)
  }

  // ÉTAPE 3 : Validation
  const validateData = (data) => {
    const errors = []
    
    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 car ligne 1 = headers, index 0 = ligne 2
      
      // Vérifier champs requis
      if (!row.Nom || !row.Contact) {
        errors.push({
          row: rowNum,
          field: 'Nom/Contact',
          message: 'Nom et Contact sont requis',
        })
      }
      
      // Vérifier format téléphone
      if (row.Contact) {
        const phoneRegex = /^(\+225|225|0)?[0-9]{9}$/
        const cleaned = row.Contact.replace(/\s/g, '')
        if (!phoneRegex.test(cleaned)) {
          errors.push({
            row: rowNum,
            field: 'Contact',
            message: 'Format téléphone invalide',
          })
        }
      }
      
      // Vérifier doublons (même nom + contact)
      const duplicates = data.filter(r => 
        r.Nom === row.Nom && r.Contact === row.Contact
      )
      if (duplicates.length > 1) {
        errors.push({
          row: rowNum,
          field: 'Doublon',
          message: 'Étudiant en double',
        })
      }
    })
    
    setValidationErrors(errors)
  }

  // ÉTAPE 4 : Import
  const handleImport = async () => {
    try {
      setStep(STEPS.IMPORT)
      setImportProgress(0)
      
      const results = await importStudentsFromData(mappedData, (progress) => {
        setImportProgress(progress)
      })
      
      setImportResults(results)
      toast.success(`Import terminé : ${results.success} succès, ${results.errors} erreurs`)
    } catch (error) {
      toast.error('Erreur lors de l\'import')
      console.error(error)
    }
  }

  const handleDownloadErrors = () => {
    if (!importResults || !importResults.errorRows) return
    
    const errorData = importResults.errorRows.map(err => [
      err.row,
      err.field,
      err.message,
      err.data ? JSON.stringify(err.data) : '',
    ])
    
    const csvContent = [
      ['Ligne', 'Champ', 'Message', 'Données'],
      ...errorData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Rapport_Erreurs_Import_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setStep(STEPS.UPLOAD)
    setFile(null)
    setRawData([])
    setMappedData([])
    setColumnMapping({})
    setValidationErrors([])
    setImportProgress(0)
    setImportResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileColumns = rawData.length > 0 ? Object.keys(rawData[0]) : []

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Importer des données"
      size="xl"
    >
      <div className="space-y-6">
        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s
                  ? 'bg-emsp-green text-white border-emsp-green'
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-emsp-green' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* ÉTAPE 1 : Upload */}
        {step === STEPS.UPLOAD && (
          <div className="text-center py-8">
            <Upload className="mx-auto mb-4 text-emsp-green" size={48} />
            <h3 className="text-xl font-semibold mb-2">Étape 1 : Upload fichier</h3>
            <p className="text-gray-600 mb-6">
              Sélectionnez un fichier CSV ou Excel à importer
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-emsp-green text-white rounded-lg cursor-pointer hover:bg-emsp-green/90 transition-colors"
            >
              Choisir un fichier
            </label>
            {file && (
              <p className="mt-4 text-sm text-gray-600">
                Fichier sélectionné : {file.name}
              </p>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : Mapping */}
        {step === STEPS.MAPPING && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Étape 2 : Mapping colonnes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Associez les colonnes de votre fichier aux colonnes attendues
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {expectedColumns.map(expected => (
                <div key={expected} className="flex items-center space-x-4">
                  <div className="w-48 text-sm font-medium text-emsp-green">
                    {expected} *
                  </div>
                  <div className="flex-1">
                    <select
                      value={columnMapping[expected] || ''}
                      onChange={(e) => handleMappingChange(expected, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emsp-green"
                    >
                      <option value="">-- Sélectionner --</option>
                      {fileColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Aperçu */}
            {rawData.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Aperçu (5 premières lignes) :</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        {expectedColumns.map(col => (
                          <th key={col} className="px-2 py-1 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {expectedColumns.map(col => (
                            <td key={col} className="px-2 py-1">
                              {columnMapping[col] ? row[columnMapping[col]] : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <AnimatedButton onClick={handleApplyMapping}>
                Valider le mapping
              </AnimatedButton>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Validation */}
        {step === STEPS.VALIDATION && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Étape 3 : Validation</h3>
            
            {validationErrors.length === 0 ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Aucune erreur détectée</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  {mappedData.length} lignes prêtes à être importées
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">{validationErrors.length} erreur(s) détectée(s)</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="text-sm text-red-700">
                      Ligne {err.row} - {err.field} : {err.message}
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <p className="text-sm text-red-600 mt-2">
                      ... et {validationErrors.length - 10} autre(s) erreur(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <AnimatedButton variant="outline" onClick={() => setStep(STEPS.MAPPING)}>
                Retour
              </AnimatedButton>
              <AnimatedButton
                onClick={handleImport}
                disabled={validationErrors.length > 0}
              >
                Importer ({mappedData.length} lignes)
              </AnimatedButton>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Import */}
        {step === STEPS.IMPORT && importResults && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Étape 4 : Import terminé</h3>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Succès</p>
                  <p className="text-2xl font-bold text-green-600">
                    {importResults.success}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Erreurs</p>
                  <p className="text-2xl font-bold text-red-600">
                    {importResults.errors}
                  </p>
                </div>
              </div>
            </div>

            {importResults.errorRows && importResults.errorRows.length > 0 && (
              <div className="mb-4">
                <AnimatedButton
                  variant="outline"
                  onClick={handleDownloadErrors}
                  className="flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Télécharger rapport d'erreurs</span>
                </AnimatedButton>
              </div>
            )}

            <div className="flex justify-end">
              <AnimatedButton onClick={() => { handleReset(); onClose(); }}>
                Fermer
              </AnimatedButton>
            </div>
          </div>
        )}

        {/* Barre de progression (étape 4) */}
        {step === STEPS.IMPORT && !importResults && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Étape 4 : Import en cours...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-emsp-green h-4 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {importProgress}% - Import en cours...
            </p>
          </div>
        )}
      </div>
    </AnimatedModal>
  )
}

