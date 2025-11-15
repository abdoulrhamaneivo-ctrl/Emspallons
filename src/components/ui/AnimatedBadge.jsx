import { motion } from 'framer-motion'

const variants = {
  success: 'bg-emsp-lightGreen text-white',
  warning: 'bg-emsp-yellow text-white',
  danger: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  default: 'bg-gray-200 text-gray-800',
}

export default function AnimatedBadge({ 
  children, 
  variant = 'default', 
  pulse = false,
  className = '' 
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
        ${variants[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
    </motion.span>
  )
}

