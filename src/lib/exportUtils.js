import * as XLSX from 'xlsx'
import { supabase } from './supabase'

/**
 * Exporte les étudiants en JSON
 */
export const exportStudentsToJSON = (students) => {
  // Vérifier que students est un tableau
  if (!Array.isArray(students)) {
    console.error('exportStudentsToJSON: students is not an array', students)
    return
  }
  
  const dataStr = JSON.stringify(students, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `etudiants-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporte les étudiants en CSV
 */
export const exportStudentsToCSV = (students) => {
  // Vérifier que students est un tableau
  if (!Array.isArray(students)) {
    console.error('exportStudentsToCSV: students is not an array', students)
    return
  }
  
  const headers = ['Nom', 'Prénom', 'Contact', 'Tuteur', 'Ligne', 'Point de ramassage', 'Niveau', 'Classe', 'Statut paiement']
  const rows = students.map(student => [
    student.nom || '',
    student.prenom || '',
    student.contact || '',
    student.tuteur || '',
    student.lines?.nom || '',
    student.point_ramassage || '',
    student.niveau || '',
    student.classe || '',
    student.statut_paiement || '',
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `etudiants-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporte les étudiants en Excel
 */
export const exportStudentsToExcel = (students) => {
  // Vérifier que students est un tableau
  if (!Array.isArray(students)) {
    console.error('exportStudentsToExcel: students is not an array', students)
    return
  }
  
  const worksheet = XLSX.utils.json_to_sheet(
    students.map(student => ({
      'Nom': student.nom || '',
      'Prénom': student.prenom || '',
      'Contact': student.contact || '',
      'Tuteur': student.tuteur || '',
      'Ligne': student.lines?.nom || '',
      'Point de ramassage': student.point_ramassage || '',
      'Niveau': student.niveau || '',
      'Classe': student.classe || '',
      'Statut paiement': student.statut_paiement || '',
    }))
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Étudiants')
  XLSX.writeFile(workbook, `etudiants-${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Parse un fichier JSON
 */
export const parseJSONFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Fichier JSON invalide'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

/**
 * Parse un fichier CSV
 */
export const parseCSVFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const obj = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ''
            })
            return obj
          })
        resolve(data)
      } catch (error) {
        reject(new Error('Fichier CSV invalide'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

/**
 * Parse un fichier Excel
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
        resolve(data)
      } catch (error) {
        reject(new Error('Fichier Excel invalide'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Mappe les données importées vers le format étudiants
 */
export const mapImportedDataToStudents = (data, lines) => {
  // Vérifier que data est un tableau
  if (!Array.isArray(data)) {
    console.error('mapImportedDataToStudents: data is not an array', data)
    return []
  }
  
  // Vérifier que lines est un tableau
  const linesArray = Array.isArray(lines) ? lines : []
  
  return data.map((row) => {
    // Mapping flexible des colonnes
    const nom = row.Nom || row.nom || row['Nom'] || ''
    const prenom = row.Prénom || row.prenom || row['Prénom'] || ''
    const contact = row.Contact || row.contact || row['Contact'] || ''
    const tuteur = row.Tuteur || row.tuteur || row['Tuteur'] || ''
    const ligneNom = row.Ligne || row.ligne || row['Ligne'] || ''
    const pointRamassage = row['Point de ramassage'] || row.point_ramassage || row['Point de ramassage'] || ''
    const niveau = row.Niveau || row.niveau || row['Niveau'] || ''
    const classe = row.Classe || row.classe || row['Classe'] || ''
    const qrToken = row['QR Token'] || row.qr_code_token || row.qrToken || ''
    
    // Trouver la ligne par nom
    const ligne = linesArray.find(l => l.nom === ligneNom)
    
    return {
      nom,
      prenom,
      contact,
      tuteur,
      ligne_id: ligne?.id || null,
      point_ramassage: pointRamassage,
      niveau,
      classe,
      qr_code_token: qrToken || undefined,
    }
  }).filter(student => student.nom && student.contact) // Filtrer les lignes vides
}

/**
 * Importe des étudiants depuis des données mappées
 */
export const importStudentsFromData = async (data, onProgress) => {
  const { data: lines } = await supabase.from('lines').select('*')
  
  let success = 0
  let errors = 0
  const errorRows = []
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i]
      
      // Trouver la ligne
      const ligne = lines?.find(l => l.nom === row.Ligne || l.nom === row.ligne)
      
      // Créer l'étudiant
      const { error } = await supabase.from('students').insert([{
        nom: row.Nom || row.nom,
        prenom: row.Prénom || row.prenom || '',
        contact: row.Contact || row.contact,
        tuteur: row.Tuteur || row.tuteur || '',
        ligne_id: ligne?.id || null,
        point_ramassage: row['Point de ramassage'] || row.point_ramassage || '',
        niveau: row.Niveau || row.niveau || '',
        classe: row.Classe || row.classe || '',
      }])
      
      if (error) throw error
      success++
    } catch (error) {
      errors++
      errorRows.push({
        row: i + 2,
        field: 'Import',
        message: error.message || 'Erreur inconnue',
        data: data[i],
      })
    }
    
    if (onProgress) {
      onProgress(((i + 1) / data.length) * 100)
    }
  }
  
  return { success, errors, errorRows }
}

