# Guide de déploiement - EMSP Transport Scolaire

## 🚀 Déploiement sur Vercel

### Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Projet Supabase configuré

### Étape 1 : Push sur GitHub

```bash
# Initialiser le dépôt Git
git init

# Ajouter tous les fichiers
git add .

# Créer le commit initial
git commit -m "Initial commit: EMSP Transport Scolaire"

# Ajouter le remote GitHub (remplacez par votre URL)
git remote add origin https://github.com/votre-username/emsp-transport-scolaire.git

# Renommer la branche en main si nécessaire
git branch -M main

# Pousser sur GitHub
git push -u origin main
```

**Note** : Si votre dépôt GitHub existe déjà, utilisez :
```bash
git remote add origin https://github.com/votre-username/emsp-transport-scolaire.git
git branch -M main
git push -u origin main
```

### Étape 2 : Déployer sur Vercel

1. **Connecter GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Sign Up" ou "Log In"
   - Choisissez "Continue with GitHub"
   - Autorisez Vercel à accéder à vos dépôts GitHub

2. **Importer le projet**
   - Cliquez sur "Add New..." → "Project"
   - Sélectionnez votre dépôt `emsp-transport-scolaire`
   - Cliquez sur "Import"

3. **Configuration du projet**
   - **Framework Preset** : Vite (détecté automatiquement)
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `dist` (par défaut)
   - **Install Command** : `npm install` (par défaut)

4. **Variables d'environnement**
   - Cliquez sur "Environment Variables"
   - Ajoutez les variables suivantes :
     ```
     VITE_SUPABASE_URL=https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
     ```
   - Sélectionnez tous les environnements (Production, Preview, Development)

5. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez 2-3 minutes pour le build
   - Votre application sera accessible sur `https://votre-projet.vercel.app`

### Étape 3 : Configuration Supabase

1. **Exécuter le schéma SQL**
   - Allez dans votre projet Supabase
   - Ouvrez l'éditeur SQL
   - Copiez le contenu de `supabase/schema.sql`
   - Exécutez le script

2. **Configurer les politiques RLS**
   - Les politiques sont déjà incluses dans le schéma SQL
   - Vérifiez qu'elles sont actives dans l'onglet "Authentication" → "Policies"

3. **Créer un utilisateur admin**
   - Allez dans "Authentication" → "Users"
   - Créez un nouvel utilisateur
   - Dans l'éditeur SQL, créez le profil :
   ```sql
   INSERT INTO profiles (id, email, nom, role)
   VALUES (
     'UUID_DE_L_UTILISATEUR',
     'admin@emsp.com',
     'Administrateur',
     'admin'
   );
   ```

### Étape 4 : Vérification

1. **Tester l'application**
   - Visitez votre URL Vercel
   - Connectez-vous avec votre compte admin
   - Vérifiez que toutes les fonctionnalités fonctionnent

2. **Vérifier les logs**
   - Dans Vercel, allez dans "Deployments"
   - Cliquez sur le dernier déploiement
   - Vérifiez les logs pour d'éventuelles erreurs

## 🔧 Configuration post-déploiement

### Domaine personnalisé (optionnel)

1. Dans Vercel, allez dans "Settings" → "Domains"
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Variables d'environnement supplémentaires

Si vous avez besoin d'autres variables :
- Allez dans "Settings" → "Environment Variables"
- Ajoutez-les et redéployez

## 📝 Commandes Git utiles

```bash
# Voir le statut
git status

# Ajouter des fichiers modifiés
git add .

# Créer un commit
git commit -m "Description des changements"

# Pousser les changements
git push origin main

# Créer une nouvelle branche
git checkout -b feature/nom-feature

# Revenir à la branche main
git checkout main
```

## 🐛 Dépannage

### Erreur de build sur Vercel

- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez les logs de build dans Vercel
- Assurez-vous que Node.js 18+ est utilisé

### Erreurs de connexion Supabase

- Vérifiez que les variables d'environnement sont correctement configurées
- Vérifiez que l'URL et la clé Supabase sont valides
- Vérifiez les politiques RLS dans Supabase

### Erreurs de permissions

- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur a le bon rôle dans `profiles`

## ⚡ Temps de déploiement

- **Push GitHub** : ~30 secondes
- **Build Vercel** : ~2-3 minutes
- **Total** : ~3-4 minutes

## 🔗 Liens utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vite](https://vitejs.dev)

---

**Note** : Après le déploiement, n'oubliez pas de :
1. Tester toutes les fonctionnalités
2. Créer des utilisateurs de test
3. Configurer les lignes de bus dans Supabase
4. Créer des contrôleurs pour les tests

