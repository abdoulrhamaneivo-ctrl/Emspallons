# 🚀 Guide de Déploiement Complet - EMSP Transport

## ✅ Préparation Terminée

Le build de production a été effectué avec succès. Votre projet est prêt pour le déploiement.

---

## 📦 Étape 1 : Déploiement Frontend sur Vercel

### Option A : Déploiement Automatique (Recommandé)

Exécutez le script de déploiement :

```bash
./deploy-complete.sh
```

Le script va :
1. ✅ Vérifier les dépendances (déjà fait)
2. ✅ Construire le projet (déjà fait)
3. 🔄 Vous connecter à Vercel (si nécessaire)
4. 🔄 Déployer sur Vercel
5. 🔄 Configurer les variables d'environnement

### Option B : Déploiement Manuel

#### 1. Connexion à Vercel

```bash
vercel login
```

Cela ouvrira votre navigateur pour vous connecter à votre compte Vercel.

#### 2. Configuration du Projet (Première fois)

```bash
vercel
```

Répondez aux questions :
- **Set up and deploy?** → `Y`
- **Which scope?** → Sélectionnez votre compte/organisation
- **Link to existing project?** → `N` (première fois) ou `Y` (si projet existe)
- **What's your project's name?** → `emsp-transport` (ou votre choix)
- **In which directory is your code located?** → `./` (par défaut)

#### 3. Déploiement en Production

```bash
vercel --prod --yes
```

#### 4. Configuration des Variables d'Environnement

**Via Dashboard Vercel (Recommandé)** :
1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `emsp-transport`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :
   - `VITE_SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `votre_cle_anon`
5. Sélectionnez **Production**, **Preview** et **Development**
6. Cliquez sur **Save**
7. **Redéployez** : Allez dans **Deployments** → Cliquez sur les trois points → **Redeploy**

**Via CLI** :

```bash
# Ajouter VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_URL
# Sélectionnez Production, Preview, Development
# Entrez la valeur : https://votre-projet.supabase.co

# Ajouter VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_ANON_KEY
# Sélectionnez Production, Preview, Development
# Entrez la valeur : votre_cle_anon

# Redéployer
vercel --prod
```

---

## ⚡ Étape 2 : Déploiement des Edge Functions Supabase

### Option A : Via Dashboard Supabase (Recommandé)

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet EMSP
3. Allez dans **Edge Functions** (dans le menu de gauche)
4. Pour chaque fonction ci-dessous, cliquez sur **Deploy** ou **Manage** :
   - `create-user`
   - `update-user`
   - `delete-user`
   - `resend-confirmation-email`
   - `get-user-email-status`
   - `hash-password`
   - `reset-password`
   - `verify-password`

### Option B : Via CLI Supabase

#### 1. Installation du CLI Supabase

```bash
npm install -g supabase
```

#### 2. Connexion

```bash
supabase login
```

#### 3. Lien au Projet

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Vous pouvez trouver votre `PROJECT_REF` dans :
- Dashboard Supabase → Settings → General → Reference ID

#### 4. Déploiement des Fonctions

```bash
# Déployer toutes les fonctions
npx supabase functions deploy create-user --no-verify-jwt
npx supabase functions deploy update-user --no-verify-jwt
npx supabase functions deploy delete-user --no-verify-jwt
npx supabase functions deploy resend-confirmation-email --no-verify-jwt
npx supabase functions deploy get-user-email-status --no-verify-jwt
npx supabase functions deploy hash-password --no-verify-jwt
npx supabase functions deploy reset-password --no-verify-jwt
npx supabase functions deploy verify-password --no-verify-jwt
```

Ou utilisez le script automatique :

```bash
./deploy-all-functions.sh
```

---

## ✅ Vérification du Déploiement

### Frontend Vercel

1. Visitez votre URL Vercel (vous la recevrez après le déploiement, format : `https://emsp-transport.vercel.app`)
2. Testez les fonctionnalités principales :
   - ✅ Connexion utilisateur
   - ✅ Dashboard
   - ✅ Gestion des étudiants
   - ✅ Gestion des paiements
   - ✅ Scanner QR code

### Edge Functions Supabase

1. Allez dans Dashboard Supabase → Edge Functions
2. Vérifiez que toutes les fonctions sont **Active** (status vert)
3. Testez les fonctionnalités qui utilisent les Edge Functions :
   - ✅ Création d'éducateurs dans `/admin/users`
   - ✅ Modification d'éducateurs
   - ✅ Suppression d'éducateurs
   - ✅ Réinitialisation de mot de passe

---

## 🔄 Mises à Jour Futures

### Frontend

Pour mettre à jour le frontend :

```bash
npm run build
vercel --prod
```

Ou simplement push sur Git si vous avez connecté votre repository :

```bash
git add .
git commit -m "Update"
git push
```

Vercel déploiera automatiquement si vous avez configuré l'intégration Git.

### Edge Functions

Pour mettre à jour une Edge Function :

```bash
# Via CLI
supabase functions deploy <function-name> --no-verify-jwt

# Via Dashboard
# Allez dans Edge Functions → Sélectionnez la fonction → Deploy
```

---

## 🆘 Dépannage

### Erreur : "The specified token is not valid" (Vercel)

**Solution :**
```bash
vercel login
```

### Erreur : "Build failed" (Vercel)

**Solution :**
1. Vérifiez les logs dans Vercel Dashboard → Deployments
2. Testez localement : `npm run build`
3. Vérifiez les erreurs de linting : `npm run lint`

### Variables d'environnement non prises en compte

**Solution :**
1. Vérifiez que les variables sont bien ajoutées dans Vercel Dashboard
2. Redéployez : `vercel --prod`
3. Ou dans Vercel Dashboard : Settings → Environment Variables → Redéployer

### Erreur : "Not linked to a project" (Supabase)

**Solution :**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Edge Function non déployée

**Solution :**
- Vérifiez que le dossier de la fonction existe dans `supabase/functions/`
- Vérifiez les logs dans Supabase Dashboard → Edge Functions → Logs
- Réessayez le déploiement via Dashboard ou CLI

---

## 📝 Checklist de Déploiement

### Frontend Vercel
- [ ] Vercel CLI installé et connecté
- [ ] Projet créé/linké sur Vercel
- [ ] Build de production réussi
- [ ] Déploiement effectué
- [ ] Variables d'environnement configurées :
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Application testée en production

### Edge Functions Supabase
- [ ] Toutes les fonctions déployées :
  - [ ] `create-user`
  - [ ] `update-user`
  - [ ] `delete-user`
  - [ ] `resend-confirmation-email`
  - [ ] `get-user-email-status`
  - [ ] `hash-password`
  - [ ] `reset-password`
  - [ ] `verify-password`
- [ ] Fonctions testées et fonctionnelles

---

## 📚 Ressources

- **Documentation Vercel** : https://vercel.com/docs
- **Documentation Supabase** : https://supabase.com/docs
- **Edge Functions Supabase** : https://supabase.com/docs/guides/functions
- **Guide de déploiement Vercel** : `GUIDE_DEPLOIEMENT_VERCEL.md`

---

**Date de préparation** : $(date)
**Statut Build** : ✅ Réussi
**Prêt pour déploiement** : ✅ Oui




