import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, X } from 'lucide-react'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedButton from '../ui/AnimatedButton'
import { useStudents } from '../../hooks/useStudents'

export default function SelectStudentModal({ isOpen, onClose, onSelect }) {
  const { students } = useStudents()
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])

  useEffect(() => {
    if (students) {
      const filtered = students.filter(student => {
        const search = searchTerm.toLowerCase()
        return (
          student.nom?.toLowerCase().includes(search) ||
          student.prenom?.toLowerCase().includes(search) ||
          student.contact?.toLowerCase().includes(search) ||
          student.classe?.toLowerCase().includes(search)
        )
      })
      setFilteredStudents(filtered)
    }
  }, [students, searchTerm])

  const handleSelect = (student) => {
    onSelect(student)
    onClose()
  }

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} title="Sélectionner un étudiant" size="lg">
      <div className="space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, contact ou classe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emsp-yellow focus:border-emsp-yellow"
          />
        </div>

        {/* Liste des étudiants */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun étudiant trouvé
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleSelect(student)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-emsp-green hover:bg-emsp-green/5 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-emsp-green">
                      {student.nom} {student.prenom || ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.classe} - {student.contact}
                    </p>
                    {student.lines && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ligne: {student.lines.nom}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.statut_paiement === 'ACTIF' ? 'bg-green-100 text-green-800' :
                      student.statut_paiement === 'EN_RETARD' ? 'bg-yellow-100 text-yellow-800' :
                      student.statut_paiement === 'EXPIRE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.statut_paiement || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AnimatedModal>
  )
}

