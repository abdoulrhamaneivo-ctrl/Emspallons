import { useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { exportStudentsToJSON, exportStudentsToCSV, exportStudentsToExcel, parseJSONFile, parseCSVFile, parseExcelFile, mapImportedDataToStudents } from '../../lib/exportUtils'
import toast from 'react-hot-toast'
import { useStudents } from '../../hooks/useStudents'
import { useAuth } from '../../context/AuthContext'
import { logActivity, ACTIONS } from '../../lib/activityLogger'

export default function ImportExportModal({ isOpen, onClose, students, lines, onImportSuccess }) {
  const [importing, setImporting] = useState(false)
  const { createStudent } = useStudents()
  const { user } = useAuth()

  const handleExport = (format) => {
    try {
      // Vérifier que students est un tableau
      if (!Array.isArray(students) || students.length === 0) {
        toast.error('Aucun étudiant à exporter')
        return
      }
      
      switch (format) {
        case 'json':
          exportStudentsToJSON(students)
          toast.success('Export JSON réussi')
          break
        case 'csv':
          exportStudentsToCSV(students)
          toast.success('Export CSV réussi')
          break
        case 'excel':
          exportStudentsToExcel(students)
          toast.success('Export Excel réussi')
          break
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export')
      console.error(error)
    }
  }

  const handleImport = async (format) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = format === 'json' ? '.json' : format === 'csv' ? '.csv' : '.xlsx,.xls'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      setImporting(true)
      try {
        let data
        switch (format) {
          case 'json':
            data = await parseJSONFile(file)
            break
          case 'csv':
            data = await parseCSVFile(file)
            break
          case 'excel':
            data = await parseExcelFile(file)
            break
        }

        // Vérifier que data est valide
        if (!data || (Array.isArray(data) && data.length === 0)) {
          toast.error('Le fichier est vide ou invalide')
          setImporting(false)
          return
        }
        
        const studentsToImport = mapImportedDataToStudents(data, lines || [])
        
        if (!Array.isArray(studentsToImport) || studentsToImport.length === 0) {
          toast.error('Aucun étudiant valide trouvé dans le fichier')
          setImporting(false)
          return
        }
        
        // Vérifier les lignes manquantes avec plus de détails
        const missingLine = studentsToImport.filter(student => !student.ligne_id)
        if (missingLine.length > 0) {
          // Extraire les noms de lignes uniques qui n'ont pas été trouvées
          const missingLineNames = [...new Set(missingLine.map(s => s.ligne_nom_original).filter(Boolean))]
          
          // Obtenir la liste des lignes disponibles
          const availableLines = (lines || []).map(l => l.nom).join(', ') || 'Aucune ligne disponible'
          
          // Construire un message d'erreur détaillé
          let errorMessage = `Certaines lignes n'ont pas de correspondance dans la base de données.\n\n`
          errorMessage += `Lignes non trouvées : ${missingLineNames.join(', ')}\n\n`
          errorMessage += `Lignes disponibles : ${availableLines}\n\n`
          errorMessage += `Veuillez vérifier les noms de lignes dans votre fichier et les aligner avec les noms dans la base de données.`
          
          // Afficher l'erreur dans une alerte pour plus de visibilité
          alert(errorMessage)
          toast.error(`Lignes non trouvées : ${missingLineNames.join(', ')}`)
          setImporting(false)
          return
        }
        
        // Créer les étudiants
        let successCount = 0
        let errorCount = 0

        for (const studentData of studentsToImport) {
          try {
            // IMPORTANT : Toujours générer un nouveau code QR lors de l'import
            // Même si l'étudiant avait déjà un code QR dans le fichier importé,
            // on génère un nouveau code pour garantir l'unicité et la fraîcheur
            
            // Créer une copie sans le qr_code_token et ligne_nom_original (champ temporaire)
            const { qr_code_token: _, ligne_nom_original: __, ...studentDataClean } = studentData
            
            const result = await createStudent({
              ...studentDataClean,
              // qr_code_token sera généré automatiquement par createStudent
              qr_code_status: 'active',
              created_by: user?.id,
            }, { silent: true })

            if (!result.error) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            errorCount++
            console.error('Erreur création étudiant:', error)
          }
        }

        // Logger l'import dans activity_logs pour traçabilité
        try {
          await logActivity({
            action: ACTIONS.IMPORT_STUDENTS,
            entityType: 'student',
            entityId: null,
            details: {
              total_imported: studentsToImport.length,
              success_count: successCount,
              error_count: errorCount,
              format: format,
              file_name: file.name,
            },
            userId: user?.id,
          })
        } catch (logError) {
          console.error('Erreur logging import', logError)
          // Non bloquant
        }

        toast.success(`${successCount} étudiant(s) importé(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`)
        onImportSuccess?.()
        onClose()
      } catch (error) {
        toast.error('Erreur lors de l\'import: ' + error.message)
        console.error(error)
      } finally {
        setImporting(false)
      }
    }

    input.click()
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} title="Import/Export Étudiants" size="md">
      <div className="space-y-6">
        {/* Export */}
        <div>
          <h3 className="text-lg font-semibold text-emsp-green mb-4 flex items-center">
            <Download size={20} className="mr-2" />
            Exporter
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <AnimatedButton
              variant="outline"
              onClick={() => handleExport('json')}
              className="flex flex-col items-center p-4"
            >
              <FileText size={24} className="mb-2" />
              <span>JSON</span>
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              onClick={() => handleExport('csv')}
              className="flex flex-col items-center p-4"
            >
              <FileText size={24} className="mb-2" />
              <span>CSV</span>
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              onClick={() => handleExport('excel')}
              className="flex flex-col items-center p-4"
            >
              <FileText size={24} className="mb-2" />
              <span>Excel</span>
            </AnimatedButton>
          </div>
        </div>

        {/* Import */}
        <div>
          <h3 className="text-lg font-semibold text-emsp-green mb-4 flex items-center">
            <Upload size={20} className="mr-2" />
            Importer
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <AnimatedButton
              variant="secondary"
              onClick={() => handleImport('json')}
              disabled={importing}
              className="flex flex-col items-center p-4"
            >
              <Upload size={24} className="mb-2" />
              <span>JSON</span>
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => handleImport('csv')}
              disabled={importing}
              className="flex flex-col items-center p-4"
            >
              <Upload size={24} className="mb-2" />
              <span>CSV</span>
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              onClick={() => handleImport('excel')}
              disabled={importing}
              className="flex flex-col items-center p-4"
            >
              <Upload size={24} className="mb-2" />
              <span>Excel</span>
            </AnimatedButton>
          </div>
          {importing && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Import en cours...
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Note :</strong> Les fichiers importés doivent contenir les colonnes : Nom, Prénom, Contact, Tuteur, Ligne, Point de ramassage, Niveau, Classe
          </p>
        </div>
      </div>
    </AnimatedModal>
  )
}

