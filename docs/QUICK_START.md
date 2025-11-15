# 🚀 Démarrage rapide - EMSP Transport Scolaire

## ✅ Étape 1 : Git est déjà configuré !

Le dépôt Git est initialisé et le commit initial est créé avec **58 fichiers**.

## 📤 Étape 2 : Push sur GitHub

### Option A : Utiliser le script automatique

```bash
./push-to-github.sh
```

Le script vous demandera l'URL de votre dépôt GitHub.

### Option B : Commandes manuelles avec Personal Access Token

**⚠️ GitHub nécessite un Personal Access Token (pas de mot de passe)**

1. **Créez un token** : https://github.com/settings/tokens
   - Cliquez sur "Generate new token (classic)"
   - Sélectionnez la permission `repo`
   - Copiez le token

2. **Push avec le token** :
```bash
# Le remote est déjà configuré
git push -u origin main
# Username: Emspallons (ou votre username)
# Password: [collez votre Personal Access Token]
```

**Option C : Script avec token**
```bash
./push-with-token.sh
```

**Exemple d'URL GitHub :**
- HTTPS : `https://github.com/votre-username/emsp-transport-scolaire.git`
- SSH : `git@github.com:votre-username/emsp-transport-scolaire.git`

## 🌐 Étape 3 : Déployer sur Vercel

1. **Connectez-vous** sur [vercel.com](https://vercel.com)
2. **Cliquez** sur "Add New..." → "Project"
3. **Sélectionnez** votre dépôt `emsp-transport-scolaire`
4. **Cliquez** sur "Import"

### Configuration Vercel

- **Framework Preset** : Vite (détecté automatiquement)
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `dist` (par défaut)

### Variables d'environnement

Dans "Environment Variables", ajoutez :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

Sélectionnez tous les environnements (Production, Preview, Development).

5. **Cliquez** sur "Deploy"

⏱️ **Temps estimé : 2-3 minutes**

## 📋 Étape 4 : Configuration Supabase

1. **Exécutez le schéma SQL** :
   - Allez dans votre projet Supabase
   - Ouvrez l'éditeur SQL
   - Copiez le contenu de `supabase/schema.sql`
   - Exécutez le script

2. **Créez un utilisateur admin** :
   - Dans "Authentication" → "Users", créez un utilisateur
   - Dans l'éditeur SQL :
   ```sql
   INSERT INTO profiles (id, email, nom, role)
   VALUES (
     'UUID_DE_L_UTILISATEUR',
     'admin@emsp.com',
     'Administrateur',
     'admin'
   );
   ```

## ✅ Vérification

1. Visitez votre URL Vercel
2. Connectez-vous avec votre compte admin
3. Testez les fonctionnalités :
   - Gestion des étudiants
   - Enregistrement de paiements
   - Scan QR (avec code contrôleur)
   - Historique des scans

## 🆘 Besoin d'aide ?

Consultez :
- [DEPLOY.md](./DEPLOY.md) pour le guide détaillé
- [SETUP.md](./SETUP.md) pour la configuration locale
- [README.md](./README.md) pour la documentation complète

---

**🎉 Votre application est prête à être déployée !**

