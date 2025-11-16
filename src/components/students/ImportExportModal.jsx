import { useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { exportStudentsToJSON, exportStudentsToCSV, exportStudentsToExcel, parseJSONFile, parseCSVFile, parseExcelFile, mapImportedDataToStudents } from '../../lib/exportUtils'
import toast from 'react-hot-toast'
import { useStudents } from '../../hooks/useStudents'
import { useAuth } from '../../context/AuthContext'

export default function ImportExportModal({ isOpen, onClose, students, lines, onImportSuccess }) {
  const [importing, setImporting] = useState(false)
  const { createStudent } = useStudents()
  const { user } = useAuth()

  const handleExport = (format) => {
    try {
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

        const studentsToImport = mapImportedDataToStudents(data, lines)
        const missingLine = studentsToImport.filter(student => !student.ligne_id)
        if (missingLine.length > 0) {
          toast.error('Certaines lignes n\'ont pas de ligne de car correspondante. Vérifiez le mapping avant de continuer.')
          setImporting(false)
          return
        }
        
        // Créer les étudiants
        let successCount = 0
        let errorCount = 0

        for (const studentData of studentsToImport) {
          try {
            // Générer QR code
            const qrToken = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
            
            const result = await createStudent({
              ...studentData,
              qr_code_token: studentData.qr_code_token || qrToken,
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

