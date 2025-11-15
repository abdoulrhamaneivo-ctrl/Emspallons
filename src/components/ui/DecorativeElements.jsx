import { motion } from 'framer-motion'

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-10"
          style={{
            width: `${50 + i * 20}px`,
            height: `${50 + i * 20}px`,
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
            background: i % 2 === 0
              ? 'linear-gradient(135deg, #FDB913, #FFE082)'
              : 'linear-gradient(135deg, #7CB342, #AED581)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

export function GradientOrb({ position = 'top-right', size = 'large' }) {
  const positions = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  }

  const sizes = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96',
  }

  return (
    <motion.div
      className={`absolute ${positions[position]} ${sizes[size]} rounded-full blur-3xl opacity-20`}
      style={{
        background: 'radial-gradient(circle, #FDB913, #7CB342)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.3, 0.2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export function AnimatedPattern() {
  return (
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `
          radial-gradient(circle at 2px 2px, #FDB913 1px, transparent 0)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  )
}

