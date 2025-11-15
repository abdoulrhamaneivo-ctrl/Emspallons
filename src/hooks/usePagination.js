import { useState, useMemo } from 'react'

export function usePagination(items = [], itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex)
  }, [items, startIndex, endIndex])

  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNumber)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const reset = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    itemsPerPage,
    goToPage,
    nextPage,
    previousPage,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  }
}

