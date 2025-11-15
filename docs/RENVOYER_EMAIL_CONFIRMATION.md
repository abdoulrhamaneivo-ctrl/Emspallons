# 📧 Renvoyer l'Email de Confirmation

## 🔍 Problème

Un éducateur a été créé mais n'a pas reçu l'email de confirmation, et le système indique "email non confirmé".

## ✅ Solutions

### Solution 1 : Renvoyer via Supabase Dashboard (Recommandé)

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Allez dans Authentication → Users**
   - Trouvez l'utilisateur éducateur par son email
   - Cliquez sur les 3 points (⋯) à droite de l'utilisateur
   - Cliquez sur **"Resend confirmation email"**

3. **Vérifier**
   - L'email devrait être envoyé immédiatement
   - Vérifiez le dossier spam si l'email n'arrive pas

### Solution 2 : Confirmer Manuellement l'Email

Si l'email ne peut pas être renvoyé, vous pouvez confirmer manuellement l'email :

1. **Dans Supabase Dashboard → Authentication → Users**
   - Trouvez l'utilisateur
   - Cliquez sur les 3 points (⋯) → **"Edit user"**
   - Cochez la case **"Email Confirmed"**
   - Cliquez sur **"Save"**

2. **Vérifier**
   - La colonne "Email Confirmed" doit maintenant afficher "Yes"
   - L'éducateur peut maintenant se connecter

### Solution 3 : Confirmer via SQL (Rapide)

1. **Allez dans Supabase Dashboard → SQL Editor**

2. **Exécutez cette requête** (remplacez `EMAIL_EDUCATEUR` par l'email de l'éducateur) :

```sql
-- Confirmer l'email de l'éducateur
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'EMAIL_EDUCATEUR';
```

3. **Vérifier** :
```sql
-- Vérifier que l'email est confirmé
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'EMAIL_EDUCATEUR';
```

## 🔧 Pourquoi l'Email n'est Pas Envoyé ?

### Causes Possibles

1. **Configuration Email Supabase**
   - Vérifiez que l'email est configuré dans Supabase
   - Settings → Authentication → Email
   - Vérifiez que "Enable email confirmations" est activé

2. **Email dans les Spams**
   - L'email peut être dans le dossier spam
   - Vérifiez aussi les dossiers "Promotions" ou "Autres"

3. **URLs de Redirection Non Configurées**
   - Settings → Authentication → URL Configuration
   - Vérifiez que les URLs de redirection sont correctes

4. **Problème avec l'Edge Function**
   - Vérifiez les logs de l'Edge Function `create-user`
   - Edge Functions → Logs → create-user

## 🚀 Amélioration de l'Edge Function

L'Edge Function `create-user` a été améliorée pour :
- ✅ Utiliser `resend` pour forcer l'envoi de l'email
- ✅ Fallback avec `generateLink` si `resend` échoue
- ✅ Logs détaillés pour le débogage

**Déployer la fonction améliorée :**
```bash
npx --yes supabase@latest functions deploy create-user
```

## 📝 Vérification

Après avoir renvoyé/confirmé l'email :

1. **Testez la connexion**
   - Allez sur `/login`
   - Connectez-vous avec l'email et le mot de passe de l'éducateur
   - La connexion doit fonctionner

2. **Vérifiez dans Supabase**
   - Authentication → Users
   - La colonne "Email Confirmed" doit être "Yes"

## ⚠️ Important

- **L'email de confirmation est nécessaire** pour que l'éducateur puisse se connecter
- **Si l'email n'arrive pas**, utilisez la Solution 2 ou 3 pour confirmer manuellement
- **Pour les futurs éducateurs**, l'Edge Function améliorée devrait envoyer l'email automatiquement

---

**Une fois l'email confirmé, l'éducateur pourra se connecter normalement !** ✅


