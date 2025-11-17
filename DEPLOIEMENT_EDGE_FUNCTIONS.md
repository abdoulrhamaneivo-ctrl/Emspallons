# 📋 Guide de Déploiement des Edge Functions Supabase

## 🎯 Problème

L'erreur `FunctionsHttpError: Edge Function returned a non-2xx status code` indique que les Edge Functions Supabase ne sont **pas déployées** sur votre projet Supabase.

## ✅ Solution : Déployer les Edge Functions

### 🚀 Déploiement Rapide (Script Automatique)

**Option la plus simple** : Utiliser le script interactif

```bash
# Rendre le script exécutable
chmod +x deploy-edge-functions-interactive.sh

# Exécuter le script
./deploy-edge-functions-interactive.sh
```

Le script vous guidera à travers toutes les étapes automatiquement.

---

### 📋 Déploiement Manuel (Étape par Étape)

#### Prérequis

1. **Supabase CLI installé** :
   ```bash
   npm install -g supabase
   ```

2. **Authentifié avec Supabase** :
   ```bash
   supabase login
   ```

3. **Lier votre projet** :
   ```bash
   supabase link --project-ref votre-project-ref
   ```
   (Le `project-ref` se trouve dans l'URL de votre projet Supabase : `https://xxxxx.supabase.co`)

### Déploiement

#### Option 1 : Déployer toutes les fonctions

```bash
# Depuis la racine du projet
supabase functions deploy
```

#### Option 2 : Déployer une fonction spécifique

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

### Variables d'Environnement

Les Edge Functions ont besoin de ces variables d'environnement dans Supabase :

1. **Aller dans Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

2. **Ajouter les secrets** :
   - `SUPABASE_URL` : Votre URL Supabase (déjà configurée automatiquement)
   - `SERVICE_ROLE_KEY` : Votre clé service role (dans **Project Settings** → **API** → **service_role key**)

### Vérification

Après déploiement, vérifier que les fonctions sont disponibles :

```bash
supabase functions list
```

## 🔧 Alternative : Utiliser l'API Supabase Admin directement

Si vous ne pouvez pas déployer les Edge Functions, vous pouvez utiliser l'API Supabase Admin directement depuis votre backend (Node.js, Python, etc.).

**⚠️ IMPORTANT** : Ne jamais utiliser le `SERVICE_ROLE_KEY` côté client (frontend) pour des raisons de sécurité.

## 📝 Fonctions Disponibles

| Fonction | Description | Utilisée dans |
|----------|-------------|---------------|
| `create-user` | Crée un utilisateur avec email de confirmation | `AdminUsers.jsx` |
| `update-user` | Met à jour un utilisateur | `AdminUsers.jsx` |
| `delete-user` | Supprime un utilisateur | `AdminUsers.jsx` |
| `resend-confirmation-email` | Renvoie l'email de confirmation | `AdminUsers.jsx` |
| `get-user-email-status` | Récupère le statut de confirmation email | `AdminUsers.jsx` |
| `reset-password` | Réinitialise le mot de passe | `ResetPasswordModal.jsx` |

## 🐛 Dépannage

### Erreur : "Function not found"
- ✅ Vérifier que la fonction est déployée : `supabase functions list`
- ✅ Vérifier le nom de la fonction (sensible à la casse)

### Erreur : "Unauthorized"
- ✅ Vérifier que `SERVICE_ROLE_KEY` est configurée dans les secrets
- ✅ Vérifier que vous êtes authentifié : `supabase login`

### Erreur : "Internal Server Error"
- ✅ Vérifier les logs : `supabase functions logs <function-name>`
- ✅ Vérifier que les variables d'environnement sont correctes

## 📚 Documentation

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)

---

**✅ Une fois déployées, les Edge Functions permettront de créer/modifier/supprimer des utilisateurs avec traçabilité complète.**

