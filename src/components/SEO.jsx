import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Tableau de bord - EMSP Transport Scolaire',
  '/students': 'Gestion des étudiants - EMSP Transport Scolaire',
  '/payments': 'Paiements - EMSP Transport Scolaire',
  '/scan': 'Scanner QR Code - EMSP Transport Scolaire',
  '/admin': 'Administration - EMSP Transport Scolaire',
  '/rapports': 'Rapports - EMSP Transport Scolaire',
  '/rappels': 'Rappels - EMSP Transport Scolaire',
  '/profile': 'Profil - EMSP Transport Scolaire',
}

const pageDescriptions = {
  '/dashboard': 'Tableau de bord de gestion du transport scolaire EMSP',
  '/students': 'Gérez les étudiants et leurs informations',
  '/payments': 'Gérez les paiements et abonnements',
  '/scan': 'Scanner les QR codes des étudiants',
  '/admin': 'Panneau d\'administration',
  '/rapports': 'Consultez les rapports et statistiques',
  '/rappels': 'Gérez les rappels automatiques',
  '/profile': 'Votre profil utilisateur',
}

export function SEO({ title, description, image }) {
  const location = useLocation()
  const pageTitle = title || pageTitles[location.pathname] || 'EMSP Transport Scolaire'
  const pageDescription = description || pageDescriptions[location.pathname] || 'Plateforme de gestion de transport scolaire pour l\'École Multinationale Supérieure des Postes'
  const pageImage = image || '/pwa-512x512.png'
  const siteUrl = window.location.origin

  useEffect(() => {
    // Mettre à jour le titre
    document.title = pageTitle

    // Mettre à jour ou créer les meta tags
    const updateMetaTag = (name, content, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Meta tags standards
    updateMetaTag('description', pageDescription)
    updateMetaTag('keywords', 'transport scolaire, EMSP, gestion étudiants, paiements, QR code')

    // Open Graph
    updateMetaTag('og:title', pageTitle, 'property')
    updateMetaTag('og:description', pageDescription, 'property')
    updateMetaTag('og:image', `${siteUrl}${pageImage}`, 'property')
    updateMetaTag('og:url', `${siteUrl}${location.pathname}`, 'property')
    updateMetaTag('og:type', 'website', 'property')
    updateMetaTag('og:site_name', 'EMSP Transport Scolaire', 'property')

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', pageTitle)
    updateMetaTag('twitter:description', pageDescription)
    updateMetaTag('twitter:image', `${siteUrl}${pageImage}`)

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', `${siteUrl}${location.pathname}`)
  }, [pageTitle, pageDescription, pageImage, siteUrl, location.pathname])

  return null
}

