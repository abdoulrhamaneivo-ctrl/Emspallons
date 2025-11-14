import { cn } from '../../lib/utils'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-emsp-yellow text-emsp-green hover:bg-yellow-500',
    secondary: 'bg-emsp-green text-white hover:bg-green-800',
    outline: 'border-2 border-emsp-green text-emsp-green hover:bg-emsp-green hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-emsp-green hover:bg-gray-100',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2',
    lg: 'px-8 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

