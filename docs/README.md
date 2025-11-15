# EMSP Transport Scolaire

Plateforme complète de gestion de transport scolaire pour l'École Multinationale Supérieure des Postes (EMSP).

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Scripts disponibles](#-scripts-disponibles)
- [Structure du projet](#-structure-du-projet)
- [Déploiement](#-déploiement)
- [Guide utilisateur](#-guide-utilisateur)
- [FAQ technique](#-faq-technique)
- [Support](#-support)

## ✨ Fonctionnalités

### 🎯 Gestion des étudiants
- ✅ Création, modification, suppression d'étudiants
- ✅ Génération automatique de QR codes
- ✅ Filtres avancés (ligne, statut, classe, niveau)
- ✅ Recherche en temps réel
- ✅ Import/Export Excel/CSV
- ✅ Cartes étudiantes imprimables
- ✅ Envoi de cartes et QR codes par WhatsApp
- ✅ Format français pour toutes les dates

### 💰 Gestion des paiements
- ✅ Enregistrement des paiements
- ✅ Calcul automatique des dates d'expiration
- ✅ Statuts automatiques (ACTIF, EN_RETARD, EXPIRE)
- ✅ Gestion des paiements anticipés
- ✅ Exclusion automatique des mois hors service
- ✅ Calcul dynamique des prix (par défaut, niveau, ligne)
- ✅ Historique complet
- ✅ Reçus PDF automatiques
- ✅ Confirmation WhatsApp automatique

### 📱 Scanner QR Code
- ✅ Scanner pour contrôleurs
- ✅ Validation en temps réel
- ✅ Historique complet des scans
- ✅ Détection de doublons
- ✅ Vérification de validité (QR code, paiement, ligne)
- ✅ Statistiques détaillées
- ✅ Export CSV de l'historique

### 📊 Tableau de bord
- ✅ Statistiques en temps réel
- ✅ Compteurs animés
- ✅ Graphiques interactifs (bar, line, pie charts)
- ✅ Actions rapides
- ✅ Activités récentes

### 📈 Bilans et rapports
- ✅ Génération de bilans mensuels
- ✅ Graphiques visuels (bar chart, pie chart)
- ✅ Statistiques financières détaillées
- ✅ Export Excel/CSV avec format français
- ✅ Filtrage par ligne et mois
- ✅ Visualisation des périodes couvertes

### 🔔 Rappels automatiques
- ✅ Rappels WhatsApp automatiques
- ✅ Configuration personnalisable (jours avant expiration, heure)
- ✅ Historique complet des envois
- ✅ Rappels manuels par sélection
- ✅ Messages personnalisés

### 👥 Gestion des utilisateurs
- ✅ Rôles (Admin, Éducateur, Contrôleur)
- ✅ Gestion des contrôleurs avec codes
- ✅ Logs d'activité complets
- ✅ Présence en ligne
- ✅ Historique des modifications

### ⚡ Synchronisation temps réel
- ✅ Mise à jour automatique des données
- ✅ Notifications collaboratives
- ✅ Badges "En ligne"
- ✅ Indicateurs d'édition en cours

### 🛡️ Administration avancée
- ✅ Gestion des classes et niveaux
- ✅ Gestion des lignes de bus
- ✅ Configuration des prix (par défaut, niveau, ligne)
- ✅ Gestion des mois hors service
- ✅ Réinitialisation sécurisée de la base de données
- ✅ Backup automatique avant réinitialisation

## 🛠️ Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Realtime)
- **UI** : Framer Motion, Lucide Icons, React Hot Toast
- **PWA** : Service Worker, Manifest
- **Hébergement** : Vercel (recommandé)

## 🚀 Installation

### Prérequis

- Node.js 18+ installé
- Compte Supabase créé
- Git (optionnel)

### Étapes d'installation

1. **Cloner le projet** (ou télécharger) :
```bash
git clone https://github.com/votre-username/emsp-transport-scolaire.git
cd emsp-transport-scolaire
```

2. **Installer les dépendances** :
```bash
npm install
```

3. **Configurer les variables d'environnement** :
```bash
cp .env.example .env.local
```

Puis éditez `.env.local` avec vos valeurs Supabase.

4. **Configurer Supabase** :
   - Créez un projet sur [supabase.com](https://supabase.com)
   - Exécutez les migrations SQL dans l'ordre :
     - `supabase/schema.sql`
     - `supabase/migrations/create_user_presence.sql`
     - `supabase/migrations/create_editing_locks.sql`
     - `supabase/migrations/enable_realtime.sql`

5. **Lancer le serveur de développement** :
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

### Configuration Supabase

1. **Activer Realtime** :
   - Voir `REALTIME_SETUP.md` pour les instructions complètes
   - Exécutez `supabase/migrations/enable_realtime.sql` dans l'éditeur SQL

2. **Créer un utilisateur admin** :
   - Utilisez l'interface d'authentification Supabase
   - Ou créez manuellement via SQL (voir `SETUP.md`)

3. **Configurer les politiques RLS** :
   - Les politiques sont incluses dans `supabase/schema.sql`
   - Vérifiez qu'elles sont bien activées

## 📜 Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Build
npm run build        # Crée un build de production
npm run preview      # Prévisualise le build de production

# Linting
npm run lint         # Vérifie le code avec ESLint
```

## 📁 Structure du projet

```
emsp-transport-scolaire/
├── src/
│   ├── components/      # Composants React
│   │   ├── ui/          # Composants UI réutilisables
│   │   ├── students/    # Composants étudiants
│   │   ├── payments/     # Composants paiements
│   │   └── ...
│   ├── hooks/           # Hooks React personnalisés
│   ├── pages/           # Pages de l'application
│   ├── context/         # Contextes React (Auth, etc.)
│   ├── lib/             # Utilitaires et helpers
│   └── services/        # Services (export, PDF, etc.)
├── supabase/
│   ├── migrations/      # Migrations SQL
│   └── schema.sql       # Schéma complet
├── public/              # Fichiers statiques
└── package.json
```

## 🚢 Déploiement

### Déploiement sur Vercel (recommandé)

1. **Préparer le projet** :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/emsp-transport-scolaire.git
git push -u origin main
```

2. **Connecter à Vercel** :
   - Allez sur [vercel.com](https://vercel.com)
   - Importez votre dépôt GitHub
   - Vercel détectera automatiquement Vite

3. **Configurer les variables d'environnement** :
   Dans les paramètres du projet Vercel :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anonyme

4. **Déployer** :
   - Cliquez sur "Deploy"
   - Vercel déploiera automatiquement à chaque push

**Temps estimé : 2-3 minutes** ⚡

### Déploiement sur Netlify

1. **Build command** : `npm run build`
2. **Publish directory** : `dist`
3. **Variables d'environnement** : Ajoutez les mêmes que Vercel

## 📖 Guide utilisateur

### Guide complet disponible

Un **guide utilisateur complet** détaillant toutes les fonctionnalités est disponible :

👉 **[GUIDE_UTILISATEUR_COMPLET.md](./GUIDE_UTILISATEUR_COMPLET.md)**

Ce guide couvre :
- ✅ Toutes les fonctionnalités de gestion des étudiants
- ✅ Enregistrement et suivi des paiements
- ✅ Scanner QR Code et validation
- ✅ Génération et impression de cartes étudiantes
- ✅ Envoi de QR codes et cartes par WhatsApp
- ✅ Rappels automatiques et manuels
- ✅ Génération de bilans mensuels avec graphiques
- ✅ Toutes les fonctionnalités d'administration
- ✅ Format français pour toutes les dates
- ✅ Export et import de données
- ✅ Réinitialisation sécurisée de la base de données
- ✅ FAQ complète

### Résumé rapide

**Pour les administrateurs** :
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs, contrôleurs, classes, niveaux
- Configuration des prix, lignes, mois hors service
- Consultation de tous les logs et statistiques

**Pour les éducateurs** :
- Gestion complète des étudiants et paiements
- Génération de rapports et bilans
- Envoi de rappels manuels
- Consultation de l'historique des scans

**Pour les contrôleurs** :
- Accès au scanner QR Code avec code personnel
- Consultation de son propre historique
- Authentification simplifiée

## ❓ FAQ technique

### L'application ne se connecte pas à Supabase

- Vérifiez que les variables d'environnement sont correctement définies
- Vérifiez que l'URL et la clé Supabase sont correctes
- Vérifiez la console du navigateur pour les erreurs

### Erreurs de permissions

- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur a le bon rôle dans `profiles`
- Vérifiez les logs dans Supabase Dashboard

### Les notifications temps réel ne fonctionnent pas

- Vérifiez que Realtime est activé (voir `REALTIME_SETUP.md`)
- Vérifiez que les tables sont ajoutées à la publication `supabase_realtime`
- Vérifiez la console du navigateur pour les erreurs de connexion

### Erreurs de build

- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez la version de Node.js : `node --version` (doit être 18+)
- Vérifiez les logs de build pour plus de détails

### Le QR code ne scanne pas

- Vérifiez que le QR code n'est pas révoqué
- Vérifiez que le statut de paiement est ACTIF
- Vérifiez que la ligne correspond

## 🔐 Sécurité

- **RLS (Row Level Security)** : Toutes les tables ont des politiques de sécurité
- **Authentification** : Gérée par Supabase Auth
- **Validation** : Tous les formulaires sont validés côté client et serveur
- **HTTPS** : Obligatoire en production

## 📱 PWA

L'application est configurée comme Progressive Web App :
- Installable sur mobile et desktop
- Fonctionne hors ligne (avec cache)
- Notifications push (à configurer)

## 🧪 Tests

### Page de test UI

En mode développement, accédez à `/test` pour tester tous les composants :
- Boutons, Inputs, Modals, Toasts, etc.
- Accessible uniquement aux admins et éducateurs

## 📞 Support

Pour toute question ou problème :

1. Consultez la documentation :
   - `SETUP.md` - Configuration initiale
   - `REALTIME_SETUP.md` - Configuration temps réel
   - `REALTIME_IMPLEMENTATION.md` - Détails techniques

2. Vérifiez les logs :
   - Console du navigateur (F12)
   - Logs Supabase Dashboard

3. Contactez le support technique

## 📄 Licence

Ce projet est propriétaire de l'EMSP.

## 🙏 Remerciements

- Supabase pour l'infrastructure backend
- Vercel pour l'hébergement
- La communauté React pour les outils

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024
