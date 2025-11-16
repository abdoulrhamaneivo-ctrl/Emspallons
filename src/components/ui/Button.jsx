import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'
import { memo } from 'react'

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading = false,
  'aria-label': ariaLabel,
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emsp-yellow focus:ring-offset-2 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
  
  const variants = {
    primary: 'bg-emsp-yellow text-emsp-green hover:bg-yellow-500',
    secondary: 'bg-emsp-green text-white hover:bg-green-800',
    outline: 'border-2 border-emsp-green text-emsp-green hover:bg-emsp-green hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-emsp-green hover:bg-gray-100',
    success: 'bg-green-600 text-white hover:bg-green-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-blue-600 text-white hover:bg-blue-700',
    warning: 'bg-orange-600 text-white hover:bg-orange-700',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2',
    lg: 'px-8 py-3 text-lg',
  }

  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          <span>Chargement...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}

const MemoizedButton = memo(Button)
export default MemoizedButton
export { MemoizedButton as Button }

