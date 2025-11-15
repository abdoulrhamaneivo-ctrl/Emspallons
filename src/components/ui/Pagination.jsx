import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { memo } from 'react'

function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  itemsPerPage = 50,
  totalItems = 0,
  className = ''
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className={`flex items-center justify-between ${className}`} role="navigation" aria-label="Pagination">
      <div className="text-sm text-gray-600">
        Affichage de <span className="font-semibold">{startItem}</span> à{' '}
        <span className="font-semibold">{endItem}</span> sur{' '}
        <span className="font-semibold">{totalItems}</span> résultats
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-emsp-yellow text-emsp-green'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Aller à la page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

export default memo(Pagination)

