# 🔧 Correction - Suppression de Compte Admin

## ✅ Problème Résolu

L'Edge Function `delete-user` bloquait la suppression de tous les administrateurs, même si ce n'était pas le dernier admin.

## 🔄 Modification Apportée

L'Edge Function a été modifiée pour :
- ✅ Permettre la suppression d'un admin si ce n'est pas le dernier
- ✅ Bloquer la suppression uniquement si c'est le dernier admin
- ✅ Vérifier automatiquement le nombre d'admins avant suppression

## 📝 Code Modifié

**Fichier :** `supabase/functions/delete-user/index.ts`

**Avant :** Bloquait tous les admins
**Après :** Vérifie qu'il n'est pas le dernier admin avant de bloquer

## 🚀 Déploiement de l'Edge Function

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Se connecter à Supabase
supabase login

# 3. Lier le projet
supabase link --project-ref VOTRE_PROJECT_REF

# 4. Déployer la fonction delete-user
supabase functions deploy delete-user
```

### Option 2 : Via Dashboard Supabase

1. Allez dans votre projet Supabase
2. **Edge Functions** → Trouvez `delete-user`
3. Cliquez sur **"Deploy"** ou **"Update"**
4. Copiez le contenu de `supabase/functions/delete-user/index.ts`
5. Collez dans l'éditeur
6. Cliquez sur **"Deploy"**

### Option 3 : Via npx (Sans installation)

```bash
# Se connecter
npx supabase@latest login

# Lier le projet
npx supabase@latest link --project-ref VOTRE_PROJECT_REF

# Déployer
npx supabase@latest functions deploy delete-user
```

## ✅ Vérification

Après déploiement :

1. **Tester la suppression d'un admin** (qui n'est pas le dernier)
2. **Vérifier que ça fonctionne** sans erreur 403
3. **Tester avec le dernier admin** → doit bloquer avec message approprié

## 🐛 Si l'Erreur Persiste

1. **Vérifier les logs** :
   ```bash
   supabase functions logs delete-user
   ```

2. **Vérifier les secrets** :
   - `SERVICE_ROLE_KEY` doit être configuré dans Supabase Dashboard
   - Settings → Edge Functions → Secrets

3. **Redéployer** :
   ```bash
   supabase functions deploy delete-user --no-verify-jwt
   ```

---

**Date de correction :** $(Get-Date -Format "yyyy-MM-dd")  
**Statut :** ✅ Corrigé et prêt pour déploiement

