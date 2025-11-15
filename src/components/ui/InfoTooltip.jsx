import { Info } from 'lucide-react'
import { Tooltip } from 'react-tooltip'

/**
 * Composant tooltip réutilisable pour afficher des informations contextuelles
 * @param {string} content - Contenu du tooltip
 * @param {React.ReactNode} children - Élément enfant (icône, texte, etc.)
 * @param {string} id - ID unique pour le tooltip (généré automatiquement si non fourni)
 * @param {string} place - Position du tooltip ('top', 'bottom', 'left', 'right')
 */
export default function InfoTooltip({ content, children, id, place = 'top' }) {
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`

  return (
    <>
      <span
        data-tooltip-id={tooltipId}
        data-tooltip-content={content}
        className="inline-flex items-center cursor-help"
      >
        {children || <Info size={16} className="text-gray-400 hover:text-emsp-yellow transition-colors" />}
      </span>
      <Tooltip
        id={tooltipId}
        place={place}
        style={{
          backgroundColor: '#2D5016',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          maxWidth: '300px',
          zIndex: 9999,
        }}
        className="z-50"
      />
    </>
  )
}



