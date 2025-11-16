import { cn } from '../../lib/utils'
import { memo } from 'react'

function Input({
  label,
  error,
  required,
  id,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emsp-yellow focus:border-transparent transition-all duration-300',
          error ? 'border-red-500 focus:ring-red-500 error' : 'border-gray-300 hover:border-emsp-lightGreen',
          props.disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        aria-label={ariaLabel || label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId || ariaDescribedBy}
        aria-required={required}
        {...props}
      />
      {error && (
        <p 
          id={errorId}
          className="error-message mt-1 text-sm text-red-600" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default memo(Input)

