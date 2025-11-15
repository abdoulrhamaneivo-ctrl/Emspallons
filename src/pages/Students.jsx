import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import StudentList from '../components/students/StudentList'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'

export default function Students() {
  const location = useLocation()

  // Gérer l'ouverture du formulaire depuis le dashboard
  useEffect(() => {
    // Vérifier si on vient du dashboard avec openForm ou sessionStorage
    const shouldOpen = location.state?.openForm || sessionStorage.getItem('openStudentForm')
    
    if (shouldOpen) {
      // Nettoyer sessionStorage
      sessionStorage.removeItem('openStudentForm')
      // Attendre un peu pour que la page soit chargée
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-student-form'))
      }, 300)
    }

    // Écouter l'événement custom
    const handleOpenForm = () => {
      window.dispatchEvent(new CustomEvent('open-student-form'))
    }
    window.addEventListener('open-student-form', handleOpenForm)

    return () => {
      window.removeEventListener('open-student-form', handleOpenForm)
    }
  }, [location.state])

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
              Étudiants
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les étudiants et leurs paiements
            </p>
          </motion.div>
          <StudentList />
        </div>
      </PageTransition>
    </Layout>
  )
}
