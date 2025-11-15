import { motion } from 'framer-motion'
import { useState } from 'react'

const variants = {
  primary: 'bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green text-white hover:shadow-lg hover:shadow-emsp-green/50',
  secondary: 'bg-gradient-to-r from-emsp-lightGreen to-emsp-green text-white hover:shadow-lg hover:shadow-emsp-lightGreen/50',
  danger: 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/50',
  outline: 'border-2 border-emsp-green text-emsp-green hover:bg-emsp-green hover:text-white',
}

export default function AnimatedButton({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) {
  const [ripple, setRipple] = useState(null)

  const handleClick = (e) => {
    if (disabled) return

    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setRipple({ x, y })
    setTimeout(() => setRipple(null), 600)

    if (onClick) onClick(e)
  }

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-semibold
        transition-all duration-300
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {ripple && (
        <motion.span
          className="absolute rounded-full bg-white/30"
          initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y }}
          animate={{ width: 300, height: 300, x: ripple.x - 150, y: ripple.y - 150 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

