import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { Search, ChevronDown, ChevronUp, BookOpen, GraduationCap, DollarSign, UserCheck, FileText, Settings, HelpCircle, X } from 'lucide-react'
import PageTransition from '../components/ui/PageTransition'
import AnimatedCard from '../components/ui/AnimatedCard'
import { Input } from '../components/ui'

const HELP_SECTIONS = [
  {
    id: 'quick-start',
    title: 'Démarrage rapide',
    icon: BookOpen,
    items: [
      {
        question: 'Comment créer un étudiant ?',
        answer: 'Allez dans la section "Étudiants" et cliquez sur "Nouvel étudiant". Remplissez le formulaire avec les informations de l\'étudiant (nom, prénom, contact, ligne, classe, niveau) et enregistrez.',
      },
      {
        question: 'Comment enregistrer un paiement ?',
        answer: 'Dans la liste des étudiants, cliquez sur le bouton "Payer" à côté de l\'étudiant. Sélectionnez le nombre de mois, la date de début, et confirmez. Un reçu PDF sera généré automatiquement.',
      },
      {
        question: 'Comment générer un QR code ?',
        answer: 'Le QR code est généré automatiquement lors de la création d\'un étudiant. Vous pouvez le visualiser en cliquant sur le bouton "QR Code" dans la liste des étudiants. Vous pouvez également télécharger la carte étudiante complète.',
      },
      {
        question: 'Comment scanner un QR code ?',
        answer: 'Les contrôleurs peuvent accéder au scanner via le menu "Scanner QR". Utilisez la caméra de votre appareil pour scanner le code QR présenté par l\'étudiant. Le système vérifiera automatiquement la validité et la ligne assignée.',
      },
    ],
  },
  {
    id: 'students',
    title: 'Gestion des étudiants',
    icon: GraduationCap,
    items: [
      {
        question: 'Inscrire un nouvel étudiant',
        answer: 'Cliquez sur "Nouvel étudiant" dans la page Étudiants. Remplissez tous les champs obligatoires (marqués d\'un *). Le contact doit être au format +225 XX XX XX XX XX. Une fois créé, l\'étudiant recevra automatiquement un QR code.',
      },
      {
        question: 'Modifier les informations d\'un étudiant',
        answer: 'Dans la liste des étudiants, cliquez sur le bouton "Modifier" (icône crayon). Vous pouvez changer le nom, prénom, contact, ligne, classe, niveau, etc. Les modifications sont sauvegardées immédiatement.',
      },
      {
        question: 'Changer de ligne pour un étudiant',
        answer: 'Modifiez l\'étudiant et sélectionnez une nouvelle ligne dans le menu déroulant. Assurez-vous que la nouvelle ligne est active dans les paramètres.',
      },
      {
        question: 'Supprimer un étudiant',
        answer: 'Cliquez sur le bouton "Supprimer" (icône poubelle) à côté de l\'étudiant. Une confirmation sera demandée. Attention : cette action est irréversible et supprimera également l\'historique des paiements associés.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Paiements',
    icon: DollarSign,
    items: [
      {
        question: 'Enregistrer un paiement',
        answer: 'Sélectionnez un étudiant et cliquez sur "Payer". Choisissez le nombre de mois (1, 2, 3, 5, 6, ou 12), la date de début, et confirmez. Le reçu PDF sera généré et téléchargé automatiquement.',
      },
      {
        question: 'Paiements anticipés',
        answer: 'Vous pouvez enregistrer un paiement pour des mois futurs. Cochez "Paiement anticipé" et sélectionnez un mois de début dans le futur. L\'étudiant sera marqué comme ACTIF immédiatement même si le mois n\'est pas encore arrivé.',
      },
      {
        question: 'Réabonnement',
        answer: 'Pour renouveler un abonnement, enregistrez simplement un nouveau paiement. Le système ajoutera automatiquement les mois payés au ledger de l\'étudiant et mettra à jour son statut.',
      },
      {
        question: 'Télécharger un reçu',
        answer: 'Dans la page Paiements, cliquez sur "Télécharger" à côté d\'un paiement pour régénérer et télécharger le reçu PDF. Vous pouvez également prévisualiser le reçu avant téléchargement.',
      },
    ],
  },
  {
    id: 'controllers',
    title: 'Contrôleurs',
    icon: UserCheck,
    items: [
      {
        question: 'Créer un contrôleur',
        answer: 'Allez dans Administration > Gestion des contrôleurs. Cliquez sur "Nouveau contrôleur", remplissez le nom, générez ou entrez un code (format XXXX-XXXX), et assignez une ligne. Un mot de passe sera généré automatiquement.',
      },
      {
        question: 'Attribuer une ligne à un contrôleur',
        answer: 'Lors de la création ou modification d\'un contrôleur, sélectionnez la ligne dans le menu déroulant. Un contrôleur ne peut scanner que les étudiants de sa ligne assignée.',
      },
      {
        question: 'Utiliser le scanner',
        answer: 'Le contrôleur se connecte avec son code et mot de passe sur la page Scanner. Activez la caméra et scannez le QR code présenté par l\'étudiant. Le système affichera immédiatement le résultat (approuvé, expiré, mauvaise ligne, etc.).',
      },
      {
        question: 'Consulter l\'historique',
        answer: 'Les contrôleurs peuvent voir leur historique personnel dans "Mon Historique". Les admins et éducateurs peuvent voir l\'historique complet dans "Historique des scans".',
      },
    ],
  },
  {
    id: 'status',
    title: 'Statuts de paiement',
    icon: FileText,
    items: [
      {
        question: 'ACTIF - Signification et conditions',
        answer: 'L\'étudiant a payé pour le mois actuel ou a un paiement anticipé. Il peut utiliser le transport normalement. Le statut ACTIF est automatiquement attribué si le mois actuel est dans le months_ledger ou s\'il y a des sessions futures.',
      },
      {
        question: 'EN RETARD - Période de grâce',
        answer: 'L\'abonnement a expiré mais l\'étudiant est encore dans la période de grâce (5 jours après expiration). L\'accès au transport reste autorisé pendant cette période. Après 5 jours, le statut passe à EXPIRÉ.',
      },
      {
        question: 'EXPIRÉ - Conséquences',
        answer: 'L\'abonnement a expiré depuis plus de 5 jours. L\'étudiant ne peut plus utiliser le transport jusqu\'à ce qu\'un nouveau paiement soit enregistré. Le contrôleur verra "EXPIRÉ" lors du scan.',
      },
      {
        question: 'HORS SERVICE - Vacances et pauses',
        answer: 'Ce statut est utilisé pendant les périodes de vacances ou de pause définies dans les paramètres. Pendant ces périodes, aucun paiement n\'est requis et tous les étudiants sont considérés comme HORS SERVICE.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Paramètres',
    icon: Settings,
    items: [
      {
        question: 'Gérer les lignes',
        answer: 'Allez dans Administration > Gestion des lignes. Vous pouvez créer, modifier, activer/désactiver des lignes. Chaque ligne a un nom, une couleur, et une description. Vous pouvez également définir un prix spécifique par ligne.',
      },
      {
        question: 'Modifier les prix',
        answer: 'Dans Administration > Gestion des prix, vous pouvez modifier le prix par défaut, activer la tarification par ligne ou par niveau, et consulter l\'historique de toutes les modifications de prix.',
      },
      {
        question: 'Configurer les rappels',
        answer: 'Allez dans Rappels pour configurer les rappels automatiques (7 jours avant expiration, jour d\'expiration, etc.) et envoyer des rappels manuels aux étudiants. Vous pouvez personnaliser les messages avec des variables.',
      },
      {
        question: 'Mois hors service',
        answer: 'Dans les paramètres, vous pouvez définir des mois où le service est suspendu (vacances). Pendant ces mois, tous les étudiants sont marqués HORS SERVICE et aucun paiement n\'est requis.',
      },
    ],
  },
]

const GLOSSARY = [
  { term: 'Abonné', definition: 'Étudiant inscrit au service de transport scolaire EMSP.' },
  { term: 'Période de grâce', definition: 'Délai de 5 jours après l\'expiration d\'un abonnement pendant lequel l\'accès au transport reste autorisé.' },
  { term: 'QR Code', definition: 'Code scannable unique attribué à chaque étudiant pour vérifier son accès au transport. Doit être présenté au contrôleur à chaque embarquement.' },
  { term: 'Session', definition: 'Période d\'un mois (format YYYY-MM) pour laquelle un paiement a été effectué. Exemple : 2024-01 pour janvier 2024.' },
  { term: 'Months Ledger', definition: 'Liste de toutes les sessions payées pour un étudiant. Utilisée pour calculer le statut de paiement.' },
  { term: 'Paiement anticipé', definition: 'Paiement effectué pour des mois futurs. L\'étudiant est marqué ACTIF immédiatement même si le mois n\'est pas encore arrivé.' },
  { term: 'Contrôleur', definition: 'Personne chargée de vérifier les codes QR des étudiants à l\'embarquement dans les bus.' },
  { term: 'Ligne', definition: 'Itinéraire de bus spécifique. Chaque étudiant est assigné à une ligne et chaque contrôleur est assigné à une ligne.' },
  { term: 'Statut de paiement', definition: 'État actuel de l\'abonnement d\'un étudiant : ACTIF, EN_RETARD, EXPIRÉ, ou HORS_SERVICE.' },
  { term: 'Reçu', definition: 'Document PDF généré automatiquement après chaque paiement, contenant les détails du paiement et un QR code de vérification.' },
]

export default function Aide() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openSections, setOpenSections] = useState({})
  const [openGlossary, setOpenGlossary] = useState(false)

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Filtrer les sections et items selon la recherche
  const filteredSections = useMemo(() => {
    if (!searchTerm) return HELP_SECTIONS

    const term = searchTerm.toLowerCase()
    return HELP_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term)
      ),
    })).filter(section => section.items.length > 0)
  }, [searchTerm])

  const filteredGlossary = useMemo(() => {
    if (!searchTerm) return GLOSSARY
    const term = searchTerm.toLowerCase()
    return GLOSSARY.filter(item =>
      item.term.toLowerCase().includes(term) ||
      item.definition.toLowerCase().includes(term)
    )
  }, [searchTerm])

  const highlightText = (text) => {
    if (!searchTerm) return text
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    )
  }

  return (
    <Layout>
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emsp-yellow via-emsp-lightGreen to-emsp-green bg-clip-text text-transparent">
              Centre d'aide
            </h1>
            <p className="text-gray-600 mt-1">
              Trouvez des réponses à toutes vos questions
            </p>
          </div>

          {/* Barre de recherche */}
          <AnimatedCard delay={0.1} className="p-6">
            <div className="relative">
              <Input
                icon={Search}
                placeholder="Rechercher dans l'aide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                {filteredSections.reduce((sum, s) => sum + s.items.length, 0) + filteredGlossary.length} résultat(s) trouvé(s)
              </p>
            )}
          </AnimatedCard>

          {/* Sections d'aide */}
          <div className="space-y-4">
            {filteredSections.map((section) => {
              const Icon = section.icon
              const isOpen = openSections[section.id]

              return (
                <AnimatedCard key={section.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-emsp-green/10 rounded-lg">
                        <Icon className="text-emsp-green" size={24} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold text-emsp-green">
                          {section.title}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {section.items.length} question(s)
                        </p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="text-gray-400" size={24} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={24} />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200">
                      {section.items.map((item, index) => (
                        <div
                          key={index}
                          className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {highlightText(item.question)}
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {highlightText(item.answer)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatedCard>
              )
            })}
          </div>

          {/* Glossaire */}
          <AnimatedCard className="overflow-hidden">
            <button
              onClick={() => setOpenGlossary(!openGlossary)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emsp-yellow/10 rounded-lg">
                  <HelpCircle className="text-emsp-yellow" size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-emsp-green">
                    Glossaire des termes
                  </h2>
                  <p className="text-sm text-gray-600">
                    Définitions des termes utilisés dans la plateforme
                  </p>
                </div>
              </div>
              {openGlossary ? (
                <ChevronUp className="text-gray-400" size={24} />
              ) : (
                <ChevronDown className="text-gray-400" size={24} />
              )}
            </button>

            {openGlossary && (
              <div className="border-t border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGlossary.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-emsp-green mb-1">
                        {highlightText(item.term)}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {highlightText(item.definition)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatedCard>
        </div>
      </PageTransition>
    </Layout>
  )
}

