import Layout from '../components/Layout'
import ControllerManager from '../components/controllers/ControllerManager'
import { motion } from 'framer-motion'
import PageTransition from '../components/ui/PageTransition'

export default function Controllers() {
  return (
    <Layout>
      <PageTransition>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent mb-6">
            Gestion des Contrôleurs
          </h1>
          <ControllerManager />
        </motion.div>
      </PageTransition>
    </Layout>
  )
}
