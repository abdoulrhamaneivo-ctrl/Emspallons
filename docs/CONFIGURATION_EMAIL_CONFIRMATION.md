# 📧 Configuration Email de Confirmation

## ✅ Configuration Actuelle

Les éducateurs créés via `/admin/users` recevront maintenant un **email de confirmation** qu'ils devront cliquer pour activer leur compte, exactement comme pour l'admin lors de la première inscription.

## 🔧 Comment ça Fonctionne

### 1. Création d'un Éducateur

1. Admin va dans `/admin/users`
2. Clique sur "Nouvel éducateur"
3. Remplit le formulaire (email, nom, mot de passe, rôle)
4. Clique sur "Créer"

### 2. Processus Automatique

1. ✅ L'utilisateur est créé dans Supabase Auth
2. ✅ Le profil est créé dans la table `profiles`
3. ✅ **Un email de confirmation est envoyé automatiquement**
4. ✅ L'utilisateur doit cliquer sur le lien dans l'email

### 3. Confirmation par l'Éducateur

1. L'éducateur reçoit l'email
2. Clique sur le lien de confirmation
3. Est redirigé vers l'URL configurée dans Supabase
4. Peut maintenant se connecter avec email/mot de passe

## ⚙️ Configuration Supabase

### URLs de Redirection

Assurez-vous que les URLs de redirection sont configurées dans Supabase :

1. **Allez dans Supabase Dashboard**
   - Settings → Authentication → URL Configuration

2. **Configurez les URLs :**
   - **Site URL :** `https://votre-domaine.com` (ou `http://localhost:5173` en dev)
   - **Redirect URLs :** 
     ```
     https://votre-domaine.com/**
     http://localhost:5173/**
     ```

3. **Email Templates (optionnel)**
   - Settings → Authentication → Email Templates
   - Vous pouvez personnaliser le template d'email de confirmation

## 📝 Template d'Email Personnalisé (Optionnel)

Si vous voulez personnaliser l'email de confirmation :

1. **Allez dans Supabase Dashboard**
   - Settings → Authentication → Email Templates
   - Sélectionnez "Confirm signup"

2. **Personnalisez le template :**
   ```html
   <h2>Confirmez votre compte EMSP</h2>
   <p>Bonjour {{ .Name }},</p>
   <p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
   <p><a href="{{ .ConfirmationURL }}">Confirmer mon compte</a></p>
   <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
   ```

## 🔍 Vérification

### Vérifier qu'un Email a été Envoyé

1. **Dans Supabase Dashboard**
   - Authentication → Users
   - Trouvez l'utilisateur
   - Vérifiez la colonne "Email Confirmed" (doit être "No" avant confirmation)

2. **Vérifier les Logs**
   - Edge Functions → Logs
   - Vérifiez les logs de `create-user` pour voir si l'email a été envoyé

### Si l'Email n'arrive Pas

1. **Vérifier le dossier Spam**
   - L'email peut être dans les spams

2. **Vérifier la Configuration Email Supabase**
   - Settings → Authentication → Email
   - Vérifiez que l'email est bien configuré

3. **Renvoyer l'Email de Confirmation**
   - Dans Supabase Dashboard → Authentication → Users
   - Cliquez sur les 3 points (⋯) → Resend confirmation email

## 🚀 Déploiement

### Déployer l'Edge Function Modifiée

```bash
# 1. Se connecter à Supabase
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref VOTRE_PROJECT_REF

# 2. Configurer le secret (si pas déjà fait)
npx --yes supabase@latest secrets set SERVICE_ROLE_KEY=votre_service_role_key

# 3. Déployer la fonction modifiée
npx --yes supabase@latest functions deploy create-user
```

## ✅ Résultat

Après déploiement :
- ✅ Les nouveaux éducateurs recevront un email de confirmation
- ✅ Ils devront cliquer sur le lien pour activer leur compte
- ✅ Une fois confirmé, ils pourront se connecter normalement
- ✅ Le processus est identique à celui de l'admin lors de la première inscription

---

**Les éducateurs devront maintenant confirmer leur email avant de pouvoir se connecter !** ✅


