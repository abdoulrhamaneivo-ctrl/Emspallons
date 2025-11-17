# 📧 Guide : Configuration Email Supabase

## ⚠️ Problème Actuel

Les emails de confirmation ne sont **pas envoyés** car Supabase nécessite une **configuration SMTP personnalisée** pour envoyer des emails en production.

---

## 🔧 Solution : Configurer SMTP dans Supabase

### Option 1 : Configuration SMTP dans Supabase Dashboard (Recommandé)

1. **Aller dans Supabase Dashboard**
   - https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/settings/auth

2. **Configurer SMTP**
   - Allez dans **Settings → Auth → SMTP Settings**
   - Activez **"Enable Custom SMTP"**

3. **Choisir un fournisseur SMTP**

   #### A. SendGrid (Recommandé - Gratuit jusqu'à 100 emails/jour)
   
   - Créer un compte : https://sendgrid.com
   - Obtenir une API Key
   - Configuration :
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [Votre API Key SendGrid]
     Sender Email: noreply@votredomaine.com
     Sender Name: EMSP Transport
     ```

   #### B. Mailgun (Gratuit jusqu'à 5 000 emails/mois)
   
   - Créer un compte : https://mailgun.com
   - Configuration :
     ```
     Host: smtp.mailgun.org
     Port: 587
     Username: [Votre nom d'utilisateur Mailgun]
     Password: [Votre mot de passe Mailgun]
     Sender Email: noreply@votredomaine.com
     Sender Name: EMSP Transport
     ```

   #### C. Gmail SMTP (Pour tests uniquement)
   
   - Créer un "App Password" dans Google Account
   - Configuration :
     ```
     Host: smtp.gmail.com
     Port: 587
     Username: votre-email@gmail.com
     Password: [App Password]
     Sender Email: votre-email@gmail.com
     Sender Name: EMSP Transport
     ```

4. **Tester la configuration**
   - Cliquez sur **"Send Test Email"**
   - Vérifiez votre boîte de réception

---

### Option 2 : Utiliser Resend (Moderne et Simple)

1. **Créer un compte Resend**
   - https://resend.com
   - Gratuit jusqu'à 3 000 emails/mois

2. **Obtenir une API Key**
   - Dashboard → API Keys → Create API Key

3. **Configurer dans Supabase**
   - Settings → Auth → SMTP Settings
   - Utiliser les paramètres Resend :
     ```
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: [Votre API Key Resend]
     Sender Email: noreply@votredomaine.com (ou onboarding@resend.dev pour tests)
     Sender Name: EMSP Transport
     ```

---

## 🔍 Vérification

### 1. Vérifier les logs des Edge Functions

```bash
npx supabase functions logs create-user --limit 20
```

Cherchez les erreurs liées à l'envoi d'email :
- `Email sending failed`
- `SMTP configuration missing`
- `Rate limit exceeded`

### 2. Vérifier dans Supabase Dashboard

- **Auth → Users** : Vérifier si les utilisateurs sont créés
- **Auth → Email Templates** : Vérifier les templates d'email
- **Logs** : Vérifier les logs d'envoi d'email

---

## 🛠️ Solution Temporaire : Confirmer Manuellement

En attendant la configuration SMTP, vous pouvez :

1. **Confirmer manuellement dans Supabase Dashboard**
   - Auth → Users → Sélectionner l'utilisateur
   - Cliquer sur "Confirm Email"

2. **Ou modifier temporairement l'Edge Function**
   - Changer `email_confirm: false` → `email_confirm: true`
   - ⚠️ **ATTENTION** : Cela saute l'étape de confirmation par email

---

## 📝 Amélioration de l'Edge Function

Pour mieux gérer les erreurs d'email, je vais améliorer la fonction `create-user` pour :

1. Logger les erreurs d'email
2. Retourner un message clair si l'email n'a pas pu être envoyé
3. Fournir un lien de confirmation manuel si nécessaire

---

## ✅ Checklist

- [ ] Compte SMTP créé (SendGrid/Mailgun/Resend)
- [ ] Configuration SMTP dans Supabase Dashboard
- [ ] Test d'envoi d'email réussi
- [ ] Vérification des logs
- [ ] Test de création d'utilisateur avec email

---

## 🆘 Support

Si les emails ne sont toujours pas envoyés après configuration :

1. Vérifier les **spams/junk**
2. Vérifier les **logs Supabase**
3. Vérifier la **configuration SMTP** (port, host, credentials)
4. Tester avec un autre fournisseur SMTP

---

**📌 Note** : Sur le plan gratuit de Supabase, l'envoi d'emails est limité. Il est **fortement recommandé** de configurer un SMTP personnalisé pour la production.

