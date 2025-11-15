# 🚀 Déploiement des Edge Functions pour la Gestion des Utilisateurs

## 📋 Fonctions à Déployer

1. **create-user** - Créer un utilisateur avec email confirmé automatiquement
2. **update-user** - Mettre à jour un utilisateur
3. **delete-user** - Supprimer un utilisateur

## 🔧 Étape 1 : Vérifier la Configuration

Assurez-vous d'être connecté à Supabase CLI :

```bash
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref VOTRE_PROJECT_REF
```

## 🔐 Étape 2 : Configurer le Secret SERVICE_ROLE_KEY

**IMPORTANT :** Le secret ne doit PAS commencer par `SUPABASE_`

```bash
npx --yes supabase@latest secrets set SERVICE_ROLE_KEY=votre_service_role_key_ici
```

Pour obtenir votre SERVICE_ROLE_KEY :
1. Allez dans votre projet Supabase
2. Settings → API
3. Copiez la "service_role" key (⚠️ NE JAMAIS l'exposer côté client)

## 📦 Étape 3 : Déployer les Edge Functions

### Option A : Déploiement Automatique (Recommandé)

```bash
# Déployer toutes les fonctions
npx --yes supabase@latest functions deploy create-user
npx --yes supabase@latest functions deploy update-user
npx --yes supabase@latest functions deploy delete-user
```

### Option B : Déploiement Manuel

Si vous avez des problèmes avec le CLI, vous pouvez déployer manuellement :

1. Allez dans votre projet Supabase
2. Edge Functions → Create a new function
3. Pour chaque fonction :
   - **create-user** : Copiez le contenu de `supabase/functions/create-user/index.ts`
   - **update-user** : Copiez le contenu de `supabase/functions/update-user/index.ts`
   - **delete-user** : Copiez le contenu de `supabase/functions/delete-user/index.ts`

## ✅ Étape 4 : Vérifier le Déploiement

1. Allez dans Supabase Dashboard → Edge Functions
2. Vérifiez que les 3 fonctions sont listées :
   - ✅ create-user
   - ✅ update-user
   - ✅ delete-user

## 🧪 Étape 5 : Tester

### Tester create-user

Dans l'application :
1. Connectez-vous en tant qu'admin
2. Allez dans `/admin/users`
3. Cliquez sur "Nouvel éducateur"
4. Remplissez le formulaire
5. L'utilisateur doit être créé avec email confirmé automatiquement

### Vérifier dans Supabase

1. Allez dans Authentication → Users
2. Vérifiez que le nouvel utilisateur a :
   - ✅ Email confirmé (colonne "Email Confirmed")
   - ✅ Profil créé dans la table `profiles`

## 🔧 Résolution du Problème "Email Non Confirmé"

Si vous avez déjà créé un éducateur avec email non confirmé, vous pouvez le confirmer manuellement :

### Option 1 : Via Supabase Dashboard

1. Allez dans Authentication → Users
2. Trouvez l'utilisateur
3. Cliquez sur les 3 points (⋯) → Edit
4. Cochez "Email Confirmed"
5. Sauvegardez

### Option 2 : Via SQL

```sql
-- Remplacer USER_ID par l'UUID de l'utilisateur
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = 'USER_ID';
```

### Option 3 : Recréer l'Utilisateur

1. Supprimez l'utilisateur existant
2. Recréez-le via `/admin/users`
3. L'email sera automatiquement confirmé

## ⚠️ Notes Importantes

1. **SERVICE_ROLE_KEY** : Ne JAMAIS exposer cette clé côté client. Elle est utilisée uniquement dans les Edge Functions.

2. **Email Confirmé** : La fonction `create-user` définit automatiquement `email_confirm: true`, donc tous les nouveaux utilisateurs créés via l'admin auront leur email confirmé.

3. **Sécurité** : Les Edge Functions vérifient les permissions et valident les données avant de créer/modifier/supprimer des utilisateurs.

## 🐛 Dépannage

### Erreur : "Function not found"
- Vérifiez que les fonctions sont bien déployées
- Vérifiez le nom de la fonction (doit être exactement `create-user`, `update-user`, `delete-user`)

### Erreur : "SERVICE_ROLE_KEY not found"
- Vérifiez que le secret est bien configuré : `npx supabase secrets list`
- Le secret doit s'appeler `SERVICE_ROLE_KEY` (sans préfixe `SUPABASE_`)

### Email toujours non confirmé
- Vérifiez que la fonction `create-user` est bien déployée
- Vérifiez les logs de la fonction dans Supabase Dashboard
- Recréez l'utilisateur après avoir déployé la fonction

---

**Une fois les Edge Functions déployées, tous les nouveaux éducateurs créés auront leur email automatiquement confirmé !** ✅


