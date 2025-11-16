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
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Support touch et mouse events
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const touch = e.touches?.[0] || e.changedTouches?.[0]
    const x = (touch?.clientX || e.clientX) - rect.left
    const y = (touch?.clientY || e.clientY) - rect.top

    setRipple({ x, y })
    setTimeout(() => setRipple(null), 600)

    if (onClick) {
      // Prévenir double clic sur mobile
      e.preventDefault()
      onClick(e)
    }
  }

  const handleTouchStart = (e) => {
    // Prévenir le comportement par défaut sur touch
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Note: on laisse onClick gérer le clic pour éviter double appel
  }

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => {
        // Permettre le clic tactile sans double appel
        if (!disabled && onClick && e.cancelable) {
          e.preventDefault()
        }
      }}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl font-semibold
        transition-all duration-300
        touch-manipulation
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        ...props.style
      }}
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

