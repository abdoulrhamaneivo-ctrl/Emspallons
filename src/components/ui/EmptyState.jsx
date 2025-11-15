import { ReactNode } from 'react'
import AnimatedButton from './AnimatedButton'

/**
 * Composant pour afficher un état vide avec message et action
 */
export default function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  children 
}) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="text-6xl mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {children}
      {actionLabel && onAction && (
        <AnimatedButton onClick={onAction} className="mt-4">
          {actionLabel}
        </AnimatedButton>
      )}
    </div>
  )
}



