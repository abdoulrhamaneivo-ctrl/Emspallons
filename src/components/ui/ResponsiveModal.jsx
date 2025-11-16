import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBreakpoint } from '../../hooks/useBreakpoint'

/**
 * Modal responsive qui devient fullscreen sur mobile
 */
export default function ResponsiveModal({ isOpen, onClose, title, children, size = 'md' }) {
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isMobile])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-white z-50 flex flex-col"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header Sticky */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-emsp-green">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                pointerEvents: 'auto',
                touchAction: 'manipulation'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Scrollable */}
          <div 
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ 
              pointerEvents: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        style={{ pointerEvents: 'none' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emsp-green">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                pointerEvents: 'auto',
                touchAction: 'manipulation'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto p-6"
            style={{ 
              pointerEvents: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}


