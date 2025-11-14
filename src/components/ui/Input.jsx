import { cn } from '../../lib/utils'

export default function Input({
  label,
  error,
  className,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input
        className={cn(
          'input',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

