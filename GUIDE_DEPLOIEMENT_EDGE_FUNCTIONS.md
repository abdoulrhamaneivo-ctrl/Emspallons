# 🚀 Guide Complet : Déploiement des Edge Functions (Option 1)

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour déployer les Edge Functions Supabase nécessaires à la création d'éducateurs.

---

## ✅ Étape 1 : Installer Supabase CLI

### Sur Linux/Mac :

```bash
npm install -g supabase
```

### Vérifier l'installation :

```bash
supabase --version
```

Vous devriez voir quelque chose comme : `supabase 1.x.x`

---

## ✅ Étape 2 : Se connecter à Supabase

```bash
supabase login
```

Cela ouvrira votre navigateur pour vous authentifier. Suivez les instructions.

**Vérifier la connexion** :
```bash
supabase projects list
```

Vous devriez voir la liste de vos projets Supabase.

---

## ✅ Étape 3 : Trouver votre Project Reference ID

1. **Aller dans Supabase Dashboard** : https://app.supabase.com
2. **Sélectionner votre projet**
3. **Aller dans Project Settings** → **General**
4. **Copier le "Reference ID"** (format : `abcdefghijklmnop`)

**OU** regarder l'URL de votre projet :
- URL : `https://abcdefghijklmnop.supabase.co`
- Le `Reference ID` est : `abcdefghijklmnop`

---

## ✅ Étape 4 : Lier votre projet local

```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

Remplacez `VOTRE_PROJECT_REF` par votre Reference ID.

**Exemple** :
```bash
supabase link --project-ref abcdefghijklmnop
```

---

## ✅ Étape 5 : Configurer les Secrets (IMPORTANT)

Les Edge Functions ont besoin de la clé `SERVICE_ROLE_KEY` pour fonctionner.

### 5.1. Trouver votre SERVICE_ROLE_KEY

1. **Supabase Dashboard** → **Project Settings** → **API**
2. **Section "Project API keys"**
3. **Copier la clé `service_role`** (⚠️ **NE JAMAIS** la partager publiquement !)

### 5.2. Ajouter le secret dans Supabase

**Option A : Via Dashboard (Recommandé)**
1. **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Cliquer sur **"Add new secret"**
3. Nom : `SERVICE_ROLE_KEY`
4. Valeur : Collez votre clé `service_role`
5. Cliquer sur **"Save"**

**Option B : Via CLI**
```bash
supabase secrets set SERVICE_ROLE_KEY=votre-service-role-key-ici
```

⚠️ **IMPORTANT** : Remplacez `votre-service-role-key-ici` par votre vraie clé.

---

## ✅ Étape 6 : Déployer les Edge Functions

### Option A : Déployer toutes les fonctions d'un coup

```bash
# Depuis la racine du projet
supabase functions deploy
```

### Option B : Déployer fonction par fonction (Recommandé)

```bash
# Créer un utilisateur
supabase functions deploy create-user

# Mettre à jour un utilisateur
supabase functions deploy update-user

# Supprimer un utilisateur
supabase functions deploy delete-user

# Renvoyer email de confirmation
supabase functions deploy resend-confirmation-email

# Obtenir statut email
supabase functions deploy get-user-email-status

# Réinitialiser mot de passe
supabase functions deploy reset-password
```

### Option C : Utiliser le script automatique

```bash
# Rendre le script exécutable (si pas déjà fait)
chmod +x deploy-edge-functions.sh

# Exécuter le script
./deploy-edge-functions.sh
```

Le script vous guidera à travers toutes les étapes.

---

## ✅ Étape 7 : Vérifier le déploiement

### Vérifier que les fonctions sont déployées :

```bash
supabase functions list
```

Vous devriez voir toutes vos fonctions listées.

### Tester une fonction :

```bash
# Voir les logs d'une fonction
supabase functions logs create-user

# Tester la fonction (depuis votre application)
# Créer un éducateur dans AdminUsers.jsx
```

---

## 🎯 Résultat Attendu

Après le déploiement, vous devriez pouvoir :

1. ✅ **Créer un éducateur** dans `/admin/users`
2. ✅ **Modifier un éducateur** (nom, rôle)
3. ✅ **Supprimer un éducateur**
4. ✅ **Renvoyer l'email de confirmation**
5. ✅ **Réinitialiser le mot de passe**
6. ✅ **Voir la traçabilité** dans `/admin/logs`

---

## 🐛 Dépannage

### Erreur : "Function not found"
- ✅ Vérifier que la fonction est déployée : `supabase functions list`
- ✅ Vérifier le nom de la fonction (sensible à la casse)

### Erreur : "Unauthorized" ou "Invalid API key"
- ✅ Vérifier que `SERVICE_ROLE_KEY` est configurée dans les secrets
- ✅ Vérifier que vous avez copié la **bonne** clé (service_role, pas anon)
- ✅ Vérifier que vous êtes authentifié : `supabase login`

### Erreur : "Internal Server Error"
- ✅ Vérifier les logs : `supabase functions logs <function-name>`
- ✅ Vérifier que les variables d'environnement sont correctes
- ✅ Vérifier que le projet est bien lié : `supabase link --project-ref ...`

### Erreur : "Project not found"
- ✅ Vérifier que le `project-ref` est correct
- ✅ Vérifier que vous avez accès au projet dans Supabase Dashboard

---

## 📝 Checklist de Déploiement

- [ ] Supabase CLI installé (`supabase --version`)
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Projet lié (`supabase link --project-ref ...`)
- [ ] `SERVICE_ROLE_KEY` configurée dans les secrets
- [ ] Toutes les fonctions déployées (`supabase functions list`)
- [ ] Test de création d'éducateur réussi

---

## 🎉 Une fois déployé

Vous pourrez créer des éducateurs depuis l'interface `/admin/users` sans erreur !

Toutes les actions seront tracées dans `/admin/logs`.

---

**✅ Bon déploiement !**

