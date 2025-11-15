# 📧 Déploiement - Email de Confirmation pour Éducateurs

## ✅ Configuration Modifiée

L'Edge Function `create-user` a été modifiée pour :
- ❌ **NE PAS** confirmer automatiquement l'email (`email_confirm: false`)
- ✅ **ENVOYER** un email de confirmation à l'éducateur
- ✅ L'éducateur doit cliquer sur le lien dans l'email pour activer son compte

## 🚀 Déploiement

### Étape 1 : Déployer l'Edge Function Modifiée

```bash
# 1. Se connecter à Supabase (si pas déjà fait)
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref VOTRE_PROJECT_REF

# 2. Vérifier que le secret SERVICE_ROLE_KEY est configuré
npx --yes supabase@latest secrets list

# Si pas configuré, l'ajouter :
npx --yes supabase@latest secrets set SERVICE_ROLE_KEY=votre_service_role_key

# 3. Déployer la fonction modifiée
npx --yes supabase@latest functions deploy create-user
```

### Étape 2 : Vérifier la Configuration Email dans Supabase

1. **Allez dans Supabase Dashboard**
   - Settings → Authentication → Email

2. **Vérifiez que l'email est activé**
   - "Enable email confirmations" doit être activé
   - "Enable email signups" doit être activé

3. **Configurez les URLs de redirection**
   - Settings → Authentication → URL Configuration
   - **Site URL :** `https://votre-domaine.com` (ou `http://localhost:5173` en dev)
   - **Redirect URLs :** 
     ```
     https://votre-domaine.com/**
     http://localhost:5173/**
     ```

## 📧 Comment ça Fonctionne Maintenant

### 1. Création d'un Éducateur

1. Admin va dans `/admin/users`
2. Clique sur "Nouvel éducateur"
3. Remplit le formulaire
4. Clique sur "Créer"

### 2. Processus Automatique

1. ✅ L'utilisateur est créé dans Supabase Auth avec `email_confirm: false`
2. ✅ Le profil est créé dans la table `profiles`
3. ✅ **Un email de confirmation est envoyé automatiquement par Supabase**
4. ✅ Message affiché : "Éducateur créé avec succès. Un email de confirmation a été envoyé."

### 3. Confirmation par l'Éducateur

1. L'éducateur reçoit l'email de confirmation
2. Clique sur le lien dans l'email
3. Est redirigé vers l'URL configurée (ex: `/dashboard`)
4. Peut maintenant se connecter avec email/mot de passe

## 🔍 Vérification

### Vérifier qu'un Email a été Envoyé

1. **Dans Supabase Dashboard**
   - Authentication → Users
   - Trouvez l'utilisateur créé
   - Vérifiez :
     - ✅ Email Confirmed : "No" (avant confirmation)
     - ✅ Email : L'email de l'éducateur

2. **Vérifier les Logs**
   - Edge Functions → Logs → create-user
   - Vérifiez qu'il n'y a pas d'erreurs

### Tester le Processus Complet

1. **Créer un nouvel éducateur**
   - Via `/admin/users`
   - Vérifiez le message de succès

2. **Vérifier l'email**
   - L'éducateur doit recevoir un email
   - Vérifiez aussi le dossier spam

3. **Confirmer l'email**
   - Cliquez sur le lien dans l'email
   - Vérifiez la redirection

4. **Se connecter**
   - Allez sur `/login`
   - Connectez-vous avec l'email et le mot de passe
   - La connexion doit fonctionner

## ⚠️ Si l'Email n'arrive Pas

### Option 1 : Renvoyer l'Email de Confirmation

Dans Supabase Dashboard :
1. Authentication → Users
2. Trouvez l'utilisateur
3. Cliquez sur les 3 points (⋯) → Resend confirmation email

### Option 2 : Vérifier la Configuration Email

1. Settings → Authentication → Email
2. Vérifiez que :
   - "Enable email confirmations" est activé
   - L'email SMTP est configuré (si vous utilisez un SMTP personnalisé)

### Option 3 : Vérifier les Logs

1. Edge Functions → Logs → create-user
2. Vérifiez s'il y a des erreurs liées à l'envoi d'email

## 📝 Notes Importantes

1. **URLs de Redirection** : Assurez-vous que les URLs de redirection sont bien configurées dans Supabase pour que le lien de confirmation fonctionne.

2. **Email Automatique** : Supabase envoie automatiquement l'email de confirmation quand on crée un utilisateur avec `email_confirm: false`. L'appel à `resend` dans l'Edge Function est une sécurité supplémentaire.

3. **Processus Identique à l'Admin** : Le processus est maintenant identique à celui de l'admin lors de la première inscription via `/register`.

4. **Sécurité** : Les éducateurs doivent confirmer leur email avant de pouvoir se connecter, ce qui ajoute une couche de sécurité.

---

**Après déploiement, tous les nouveaux éducateurs devront confirmer leur email avant de pouvoir se connecter !** ✅


