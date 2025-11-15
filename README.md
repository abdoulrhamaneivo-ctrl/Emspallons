# 🚌 EMSP Transport - Plateforme de Gestion de Transport Scolaire

Plateforme complète de gestion du transport scolaire pour l'École Multinationale Supérieure des Postes (EMSP).

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Documentation](#-documentation)

## ✨ Fonctionnalités

### 👥 Gestion des Étudiants
- Création et gestion des profils étudiants
- Génération automatique de QR codes
- Cartes étudiantes imprimables
- Gestion des lignes de bus et points de ramassage

### 💰 Gestion des Paiements
- Enregistrement des paiements mensuels
- Calcul automatique des dates d'expiration
- Gestion des mois hors service
- Génération de reçus PDF
- Envoi automatique de confirmations WhatsApp

### 📱 Scanner QR Code
- Application mobile pour contrôleurs
- Vérification en temps réel du statut de paiement
- Détection des doublons
- Historique des scans

### 📊 Tableaux de Bord
- Statistiques en temps réel
- Graphiques interactifs (Recharts)
- Suivi des paiements
- Répartition par ligne

### 🔔 Rappels Automatiques
- Envoi de rappels WhatsApp
- Filtres avancés (statut, ligne, classe)
- Historique des envois

### 👨‍💼 Administration
- Gestion des utilisateurs (admins, éducateurs)
- Gestion des contrôleurs
- Configuration des prix par ligne/niveau
- Gestion des mois hors service
- Logs système

## 🛠️ Technologies

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Temps réel**: Supabase Realtime
- **Graphiques**: Recharts
- **PDF**: jsPDF, jspdf-autotable
- **QR Code**: html5-qrcode, qrcode.react
- **PWA**: Vite PWA Plugin

## 📦 Installation

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### Étapes

1. **Cloner le repository**

```bash
git clone https://github.com/votre-username/emsp-transport.git
cd emsp-transport
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

Voir `docs/ENV_EXAMPLE.md` pour plus de détails.

4. **Lancer le serveur de développement**

```bash
npm run dev
```

5. **Ouvrir dans le navigateur**

```
http://localhost:5173
```

## ⚙️ Configuration

### Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez les migrations SQL dans `supabase/schema.sql`
3. Exécutez les migrations dans `supabase/migrations/` dans l'ordre
4. Configurez les politiques RLS

### WhatsApp (Optionnel)

Pour l'envoi automatique de messages WhatsApp :

1. Suivez le guide : `docs/GUIDE_WHATSAPP_BUSINESS.md`
2. Ajoutez les variables dans `.env.local` :
   ```env
   VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   VITE_WHATSAPP_API_KEY=votre_token
   VITE_WHATSAPP_PHONE_NUMBER_ID=votre_phone_id
   ```

## 🚀 Déploiement

Voir le guide complet : `docs/DEPLOIEMENT_PRODUCTION.md`

### Déploiement Rapide (Vercel)

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez !

### Déploiement (Netlify)

1. Connectez votre repository GitHub à Netlify
2. Configurez le build : `npm run build`
3. Définissez le dossier de sortie : `dist`
4. Configurez les variables d'environnement

## 📚 Documentation

Toute la documentation est disponible dans le dossier `docs/` :

- **Installation** : `docs/ENV_EXAMPLE.md`
- **Déploiement** : `docs/DEPLOIEMENT_PRODUCTION.md`
- **WhatsApp** : `docs/GUIDE_WHATSAPP_BUSINESS.md`
- **Structure** : `docs/STRUCTURE.md`
- **Fonctionnalités** : `docs/FONCTIONNALITES_ADMIN.md`

## 🏗️ Structure du Projet

```
emsp-transport/
├── docs/              # Documentation
├── public/            # Assets statiques
├── scripts/           # Scripts utilitaires
├── src/
│   ├── components/   # Composants React
│   ├── pages/        # Pages de l'application
│   ├── hooks/        # Hooks personnalisés
│   ├── lib/          # Utilitaires et configuration
│   ├── services/     # Services (PDF, WhatsApp, etc.)
│   └── utils/        # Fonctions utilitaires
├── supabase/
│   ├── functions/    # Edge Functions
│   └── migrations/   # Migrations SQL
└── package.json
```

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Authentification sécurisée via Supabase
- ✅ Variables d'environnement pour les clés API
- ✅ Validation des données côté client et serveur
- ✅ Protection XSS (pas d'innerHTML)

## 📝 Scripts Disponibles

```bash
npm run dev      # Démarre le serveur de développement
npm run build    # Build pour la production
npm run preview  # Prévisualise le build de production
npm run lint     # Vérifie le code avec ESLint
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est privé et propriétaire de l'École Multinationale Supérieure des Postes (EMSP).

## 👥 Support

Pour toute question ou problème :
- Consultez la documentation dans `docs/`
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

---

**Développé avec ❤️ pour EMSP**

