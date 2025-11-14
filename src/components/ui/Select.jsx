import { cn } from '../../lib/utils'

export default function Select({
  label,
  error,
  options = [],
  children,
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
      <select
        className={cn(
          'input',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {children || options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

