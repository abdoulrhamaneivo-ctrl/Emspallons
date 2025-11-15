import { motion } from 'framer-motion'
import { useState } from 'react'

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl',
}

export default function Logo({ 
  size = 'md', 
  showText = false, 
  variant = 'transport',
  className = '' 
}) {
  const [imageError, setImageError] = useState(false)
  const imagePath = variant === 'transport' 
    ? '/images/logo-transport.png' 
    : '/images/logo-ecole.png'

  const getInitials = () => {
    return variant === 'transport' ? 'EMSP' : 'E'
  }

  return (
    <motion.div
      className={`flex items-center space-x-3 ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div
        className={`
          ${sizes[size]} rounded-full 
          bg-gradient-to-br from-emsp-yellow via-emsp-lightGreen to-emsp-green
          flex items-center justify-center text-white font-bold shadow-lg
        `}
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {imageError || !imagePath ? (
          getInitials()
        ) : (
          <img
            src={imagePath}
            alt="EMSP Logo"
            className="w-full h-full object-contain rounded-full"
            onError={() => setImageError(true)}
          />
        )}
      </motion.div>
      {showText && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent"
        >
          EMSP Allons
        </motion.span>
      )}
    </motion.div>
  )
}

