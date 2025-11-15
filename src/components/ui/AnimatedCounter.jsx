import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

export default function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0 
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px' })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 100,
  })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [motionValue, isInView, value])

  useEffect(() => {
    springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest)}${suffix}`
      }
    })
  }, [springValue, prefix, suffix, decimals])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

