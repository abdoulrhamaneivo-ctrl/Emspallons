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
  type,
  inputMode,
  autoComplete,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  const errorId = error ? `${inputId}-error` : undefined

  // Détection automatique du type d'input pour les attributs mobiles
  const detectedType = type || 'text'
  
  // Déterminer inputMode automatiquement si non fourni
  let detectedInputMode = inputMode
  let detectedAutoComplete = autoComplete
  let detectedAutoCapitalize = autoCapitalize
  let detectedAutoCorrect = autoCorrect !== undefined ? autoCorrect : undefined
  let detectedSpellCheck = spellCheck

  if (!inputMode) {
    if (detectedType === 'tel' || detectedType === 'phone') {
      detectedInputMode = 'tel'
      detectedAutoComplete = detectedAutoComplete || 'tel'
    } else if (detectedType === 'email') {
      detectedInputMode = 'email'
      detectedAutoComplete = detectedAutoComplete || 'email'
    } else if (detectedType === 'number' || detectedType === 'numeric') {
      detectedInputMode = 'numeric'
    } else if (detectedType === 'password') {
      detectedInputMode = 'text'
      detectedAutoComplete = detectedAutoComplete || 'off'
    } else {
      // Pour les champs texte, détecter selon le label ou le placeholder
      const lowerLabel = (label || '').toLowerCase()
      const lowerPlaceholder = (props.placeholder || '').toLowerCase()
      
      if (lowerLabel.includes('nom') || lowerLabel.includes('prénom') || lowerLabel.includes('name') || lowerPlaceholder.includes('nom')) {
        detectedAutoCapitalize = detectedAutoCapitalize || 'words'
        detectedAutoCorrect = detectedAutoCorrect !== false
      } else if (lowerLabel.includes('email') || lowerLabel.includes('mail') || lowerPlaceholder.includes('email')) {
        detectedInputMode = 'email'
        detectedAutoComplete = detectedAutoComplete || 'email'
        detectedAutoCapitalize = detectedAutoCapitalize || 'none'
      } else if (lowerLabel.includes('téléphone') || lowerLabel.includes('contact') || lowerLabel.includes('phone') || lowerLabel.includes('tel') || lowerPlaceholder.includes('téléphone') || lowerPlaceholder.includes('contact')) {
        detectedInputMode = 'tel'
        detectedAutoComplete = detectedAutoComplete || 'tel'
        detectedAutoCapitalize = detectedAutoCapitalize || 'none'
      } else {
        detectedInputMode = 'text'
      }
    }
  }

  // Définir les valeurs par défaut
  if (detectedAutoCapitalize === undefined) {
    detectedAutoCapitalize = detectedInputMode === 'email' || detectedInputMode === 'tel' || detectedType === 'password' ? 'none' : 'sentences'
  }
  if (detectedAutoCorrect === undefined) {
    detectedAutoCorrect = detectedInputMode === 'email' || detectedInputMode === 'tel' || detectedType === 'password' ? false : true
  }
  if (detectedSpellCheck === undefined) {
    detectedSpellCheck = detectedInputMode === 'email' || detectedInputMode === 'tel' || detectedType === 'password' ? false : true
  }

  // Style pour éviter le zoom automatique sur iOS (fontSize minimum 16px)
  const mobileStyle = {
    fontSize: '16px', // Évite le zoom automatique sur iOS
    touchAction: 'manipulation',
    ...props.style
  }

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
        type={detectedType}
        inputMode={detectedInputMode}
        autoComplete={detectedAutoComplete}
        autoCapitalize={detectedAutoCapitalize}
        autoCorrect={detectedAutoCorrect}
        spellCheck={detectedSpellCheck}
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
        style={mobileStyle}
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

