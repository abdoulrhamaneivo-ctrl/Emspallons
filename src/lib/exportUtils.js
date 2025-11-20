import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import { genererCodeQR } from './utils'
import { detectCountry, formatPhoneNumber } from './phoneFormatter'

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
    student.niveau || student.promotion || '', // Utiliser niveau (nom de la colonne dans la DB après migration)
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
      'Niveau': student.promotion || student.niveau || '', // Utiliser promotion (champ DB) ou niveau comme fallback
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
 * Normalise une chaîne pour la comparaison (supprime accents, espaces, casse)
 */
const normalizeString = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim()
}

/**
 * Trouve une ligne par nom avec matching flexible (insensible à la casse, espaces, accents)
 */
const findLineByName = (ligneNom, linesArray) => {
  if (!ligneNom || !Array.isArray(linesArray) || linesArray.length === 0) {
    return null
  }
  
  const normalizedNom = normalizeString(ligneNom)
  
  // D'abord, essayer une correspondance exacte (normale)
  let ligne = linesArray.find(l => l.nom === ligneNom)
  if (ligne) return ligne
  
  // Ensuite, essayer une correspondance insensible à la casse
  ligne = linesArray.find(l => l.nom.toLowerCase() === ligneNom.toLowerCase())
  if (ligne) return ligne
  
  // Enfin, essayer une correspondance normalisée (insensible aux accents et espaces)
  ligne = linesArray.find(l => normalizeString(l.nom) === normalizedNom)
  if (ligne) return ligne
  
  return null
}

/**
 * Mappe les données importées vers le format étudiants
 */
export const mapImportedDataToStudents = (data, lines) => {
  // Gérer le cas où data est un objet d'export complet (structure avec exportDate, version, students, etc.)
  let studentsData = data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Si c'est un objet d'export complet, extraire le tableau students
    if (data.students && Array.isArray(data.students)) {
      studentsData = data.students
    } else {
      console.error('mapImportedDataToStudents: data is not an array and has no students property', data)
      return []
    }
  }
  
  // Vérifier que studentsData est un tableau
  if (!Array.isArray(studentsData)) {
    console.error('mapImportedDataToStudents: studentsData is not an array', studentsData)
    return []
  }
  
  // Vérifier que lines est un tableau
  const linesArray = Array.isArray(lines) ? lines : []
  
  return studentsData.map((row) => {
    // Mapping flexible des colonnes
    const nom = row.Nom || row.nom || row['Nom'] || ''
    const prenom = row.Prénom || row.prenom || row['Prénom'] || ''
    const contactRaw = row.Contact || row.contact || row['Contact'] || ''
    const tuteur = row.Tuteur || row.tuteur || row['Tuteur'] || ''
    const ligneNom = row.Ligne || row.ligne || row['Ligne'] || ''
    const pointRamassage = row['Point de ramassage'] || row.point_ramassage || row['Point de ramassage'] || ''
    const niveau = row.Niveau || row.niveau || row['Niveau'] || ''
    const classe = row.Classe || row.classe || row['Classe'] || ''
    
    // IMPORTANT : Formater automatiquement le numéro de téléphone selon le pays détecté
    // Détecter le pays à partir du numéro (CI, ML, SN, TG, BJ, MR, BF)
    let contact = contactRaw
    if (contactRaw) {
      const detectedCountry = detectCountry(contactRaw)
      contact = formatPhoneNumber(contactRaw, detectedCountry)
    }
    
    // IMPORTANT : Ne pas inclure le qr_code_token lors de l'import
    // Un nouveau code QR sera toujours généré lors de la création de l'étudiant
    
    // Trouver la ligne par nom avec matching flexible
    const ligne = findLineByName(ligneNom, linesArray)
    
    return {
      nom,
      prenom,
      contact, // Contact formaté automatiquement selon le pays
      tuteur,
      ligne_id: ligne?.id || null,
      ligne_nom_original: ligneNom, // Conserver le nom original pour les messages d'erreur
      point_ramassage: pointRamassage,
      niveau, // Utiliser niveau (nom de la colonne dans la DB après migration)
      classe,
      // qr_code_token est intentionnellement omis - sera généré lors de la création
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
      
      // IMPORTANT : Toujours générer un nouveau code QR lors de l'import
      // Ne pas utiliser qr_code_token du fichier importé, même s'il existe
      
      // Validation des champs requis
      const nom = row.Nom || row.nom
      const contactRaw = row.Contact || row.contact
      // Utiliser Niveau/Promotion du fichier (peu importe le nom de la colonne dans le fichier)
      const niveauFromFile = row.Niveau || row.niveau || row.Promotion || row.promotion || ''
      
      if (!nom || !contactRaw) {
        throw new Error('Nom et Contact sont requis')
      }
      
      // IMPORTANT : Formater automatiquement le numéro de téléphone selon le pays détecté
      // Détecter le pays à partir du numéro (CI, ML, SN, TG, BJ, MR, BF)
      const detectedCountry = detectCountry(contactRaw)
      const contact = formatPhoneNumber(contactRaw, detectedCountry)
      
      // S'assurer que niveau est toujours défini et non vide (champ NOT NULL dans la DB)
      const niveauValue = niveauFromFile ? niveauFromFile.toString().trim() : 'Non spécifié'
      
      // Générer un nouveau code QR pour chaque étudiant importé
      const qrToken = genererCodeQR()
      
      // Créer l'étudiant avec un nouveau code QR généré
      const { error } = await supabase.from('students').insert([{
        nom,
        prenom: row.Prénom || row.prenom || '',
        contact, // Contact formaté automatiquement selon le pays
        tuteur: row.Tuteur || row.tuteur || '',
        ligne_id: ligne?.id || null,
        point_ramassage: row['Point de ramassage'] || row.point_ramassage || '',
        niveau: niveauValue, // Utiliser niveau (nom de la colonne dans la DB après migration)
        classe: row.Classe || row.classe || '',
        qr_code_token: qrToken,
        qr_code_status: 'active',
        months_ledger: [], // Initialiser explicitement
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

