import { motion } from 'framer-motion'

export default function AnimatedCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

