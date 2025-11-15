# 🔧 Correction "Accès Non Autorisé"

## 🔍 Problème

Vous êtes connecté mais voyez la page "Accès non autorisé". Cela signifie que votre profil n'a pas de rôle défini dans la base de données.

## ✅ Solutions

### Solution 1 : Vérifier et Corriger le Profil dans Supabase (Recommandé)

1. **Allez dans Supabase Dashboard**
   - [supabase.com](https://supabase.com) → votre projet
   - **Authentication → Users**
   - Trouvez votre utilisateur par email

2. **Notez votre User ID (UUID)**
   - C'est l'ID unique de votre utilisateur dans `auth.users`

3. **Allez dans SQL Editor**
   - Exécutez cette requête pour vérifier votre profil :

```sql
-- Remplacez USER_ID par votre UUID d'utilisateur
SELECT * FROM profiles WHERE id = 'USER_ID';
```

4. **Si le profil n'existe pas**, créez-le :

```sql
-- Remplacez USER_ID, EMAIL, NOM, et ROLE par vos valeurs
INSERT INTO profiles (id, email, nom, role)
VALUES (
  'USER_ID',
  'EMAIL',
  'NOM',
  'educator'  -- ou 'admin' si vous êtes admin
);
```

5. **Si le profil existe mais n'a pas de rôle**, mettez-le à jour :

```sql
-- Remplacez USER_ID et ROLE par vos valeurs
UPDATE profiles
SET role = 'educator'  -- ou 'admin' si vous êtes admin
WHERE id = 'USER_ID';
```

### Solution 2 : Vérifier via la Console du Navigateur

1. **Ouvrez la console du navigateur** (F12)
2. **Rechargez la page**
3. **Regardez les logs** :
   - Vous devriez voir `ProtectedRoute Debug:` avec vos informations
   - Vous devriez voir `getUserRole result:` avec votre rôle
   - Si vous voyez `Profile not found for user:`, votre profil n'existe pas

### Solution 3 : Vérifier le Rôle dans la Table Profiles

Dans Supabase Dashboard → Table Editor → `profiles` :

1. **Vérifiez que votre utilisateur existe**
   - La colonne `id` doit correspondre à votre User ID
   - La colonne `email` doit correspondre à votre email
   - La colonne `role` doit être `'admin'`, `'educator'`, ou `'controller'`

2. **Si le rôle est vide ou NULL**, mettez-le à jour :
   - Cliquez sur la ligne de votre profil
   - Modifiez la colonne `role`
   - Mettez `'educator'` (ou `'admin'` si vous êtes admin)
   - Sauvegardez

## 🔍 Diagnostic

### Vérifier dans la Console

Après avoir rechargé la page, ouvrez la console (F12) et cherchez :

1. **`ProtectedRoute Debug:`**
   - `role`: devrait être `'admin'`, `'educator'`, ou `'controller'`
   - Si `role` est `null`, votre profil n'a pas de rôle

2. **`getUserRole result:`**
   - Devrait afficher votre `userId` et votre `role`
   - Si le rôle est `null`, vérifiez votre profil dans Supabase

3. **`Profile not found for user:`**
   - Votre profil n'existe pas dans la table `profiles`
   - Créez-le avec la Solution 1

### Vérifier dans Supabase

1. **Authentication → Users**
   - Votre utilisateur doit exister
   - Email doit être confirmé (Email Confirmed = Yes)

2. **Table Editor → profiles**
   - Votre profil doit exister avec le même `id` que dans `auth.users`
   - La colonne `role` doit être définie

## 🚀 Après Correction

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous**
3. **Vérifiez** que vous pouvez accéder au dashboard

## ⚠️ Important

- **Le rôle doit être exactement** : `'admin'`, `'educator'`, ou `'controller'` (en minuscules)
- **L'ID du profil** doit correspondre exactement à l'ID de l'utilisateur dans `auth.users`
- **L'email doit être confirmé** dans `auth.users` pour que la connexion fonctionne

## 📝 Exemple SQL Complet

Si vous êtes un éducateur avec l'email `educateur@emsp.com` :

```sql
-- 1. Trouver votre User ID
SELECT id, email FROM auth.users WHERE email = 'educateur@emsp.com';

-- 2. Vérifier si votre profil existe
SELECT * FROM profiles WHERE email = 'educateur@emsp.com';

-- 3. Si le profil n'existe pas, créez-le (remplacez USER_ID par l'ID trouvé à l'étape 1)
INSERT INTO profiles (id, email, nom, role)
VALUES (
  'USER_ID',
  'educateur@emsp.com',
  'Nom Éducateur',
  'educator'
)
ON CONFLICT (id) DO UPDATE
SET role = 'educator';

-- 4. Vérifier que c'est correct
SELECT * FROM profiles WHERE email = 'educateur@emsp.com';
```

---

**Une fois le profil corrigé, déconnectez-vous et reconnectez-vous pour que les changements prennent effet !** ✅


