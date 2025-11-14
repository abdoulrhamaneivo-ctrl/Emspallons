# EMSP Transport Scolaire

Plateforme de gestion de transport scolaire pour l'École Multinationale Supérieure des Postes (EMSP).

## 🎨 Couleurs de l'école

- **Jaune principal** : `#FDB913`
- **Vert secondaire** : `#2D5016`
- **Vert clair accent** : `#7CB342`

## 🛠️ Stack technique

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL)
- **Hébergement** : Vercel
- **PWA** : Activée

## 👥 Rôles utilisateurs

1. **Admin** : Accès complet à toutes les fonctionnalités
2. **Éducateur** : Gestion des étudiants et des paiements
3. **Contrôleur** : Scan QR uniquement (pas d'authentification complète)

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
Créer un fichier `.env` à la racine du projet :
```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

## 📦 Structure Supabase

### Tables nécessaires

#### `user_profiles`
- `id` (uuid, primary key, references auth.users)
- `role` (text: 'admin', 'educateur', 'controleur')
- `created_at` (timestamp)

#### `students`
- `id` (uuid, primary key)
- `student_id` (text, unique)
- `first_name` (text)
- `last_name` (text)
- `class` (text)
- `status` (text: 'active', 'inactive')
- `qr_code` (text, unique)
- `created_at` (timestamp)

#### `payments`
- `id` (uuid, primary key)
- `student_id` (uuid, references students)
- `amount` (numeric)
- `status` (text: 'completed', 'pending')
- `created_at` (timestamp)

#### `presences`
- `id` (uuid, primary key)
- `student_id` (uuid, references students)
- `scanned_at` (timestamp)
- `scanned_by` (text)

## 🔐 Sécurité

- Les routes sont protégées par rôle
- L'authentification est gérée par Supabase Auth
- Les contrôleurs peuvent scanner sans authentification complète (à implémenter selon vos besoins)

## 📱 PWA

L'application est configurée comme Progressive Web App et peut être installée sur les appareils mobiles.

## 🚢 Déploiement

Le projet est prêt pour le déploiement sur Vercel. 

### Déploiement rapide

1. **Push sur GitHub** :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-username/emsp-transport-scolaire.git
git push -u origin main
```

2. **Déployer sur Vercel** :
   - Connectez-vous sur [vercel.com](https://vercel.com)
   - Importez votre dépôt GitHub
   - Ajoutez les variables d'environnement :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Cliquez sur "Deploy"

**Temps estimé : 2-3 minutes** ⚡

Pour plus de détails, consultez [DEPLOY.md](./DEPLOY.md)

