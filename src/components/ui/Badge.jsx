import { cn, getStatusColor } from '../../lib/utils'

export default function Badge({
  children,
  status,
  variant = 'default',
  className,
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  const colorClass = status ? getStatusColor(status) : variants[variant]

  return (
    <span
      className={cn(
        'px-2 py-1 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  )
}

