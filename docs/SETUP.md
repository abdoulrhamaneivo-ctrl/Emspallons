# Guide de configuration - EMSP Transport Scolaire

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase créé
- Git (optionnel)

## 🚀 Installation rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

#### a. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anonyme (anon key)

#### b. Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans l'éditeur SQL
2. Copiez le contenu du fichier `supabase/schema.sql`
3. Exécutez le script SQL

#### c. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

### 3. Créer un utilisateur admin

Dans l'éditeur SQL de Supabase, exécutez :

```sql
-- Remplacez 'admin@emsp.com' et 'motdepasse' par vos valeurs
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@emsp.com', crypt('motdepasse', gen_salt('bf')), NOW())
RETURNING id;

-- Ensuite, créez le profil (remplacez l'UUID par celui retourné ci-dessus)
INSERT INTO user_profiles (id, role)
VALUES ('UUID_RETOURNE_CI_DESSUS', 'admin');
```

**Note** : Pour une meilleure sécurité, utilisez l'interface d'authentification de Supabase pour créer les utilisateurs.

### 4. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📱 Configuration PWA

Pour que la PWA fonctionne correctement, vous devrez :

1. Générer les icônes PWA :
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)

2. Vous pouvez utiliser un outil en ligne comme [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

## 🚢 Déploiement sur Vercel

### 1. Préparer le projet

Assurez-vous que votre code est sur GitHub, GitLab ou Bitbucket.

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre projet
3. Vercel détectera automatiquement Vite

### 3. Configurer les variables d'environnement

Dans les paramètres du projet Vercel :
- Ajoutez `VITE_SUPABASE_URL`
- Ajoutez `VITE_SUPABASE_ANON_KEY`

### 4. Déployer

Vercel déploiera automatiquement à chaque push sur votre branche principale.

## 🔐 Sécurité

### RLS (Row Level Security)

Le schéma SQL inclut des politiques RLS pour sécuriser les données :
- Les admins et éducateurs peuvent voir/modifier les étudiants et paiements
- Les contrôleurs peuvent seulement insérer des présences
- Chaque utilisateur peut voir son propre profil

### Authentification

- Utilisez des mots de passe forts
- Activez l'authentification à deux facteurs pour les admins
- Configurez les politiques d'authentification dans Supabase

## 📊 Structure de la base de données

### Tables principales

- **user_profiles** : Profils utilisateurs avec rôles
- **students** : Informations des étudiants
- **payments** : Historique des paiements
- **presences** : Enregistrement des présences

Voir `supabase/schema.sql` pour plus de détails.

## 🐛 Dépannage

### L'application ne se connecte pas à Supabase

- Vérifiez que les variables d'environnement sont correctement définies
- Vérifiez que l'URL et la clé Supabase sont correctes
- Vérifiez la console du navigateur pour les erreurs

### Erreurs de permissions

- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur a le bon rôle dans `user_profiles`

### Erreurs de build

- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez la version de Node.js : `node --version` (doit être 18+)

## 📞 Support

Pour toute question ou problème, consultez la documentation :
- [React](https://react.dev)
- [Supabase](https://supabase.com/docs)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)

