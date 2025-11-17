# 📧 Solution : Problème d'Envoi d'Emails

## ⚠️ Problème Identifié

Les emails de confirmation **ne sont pas envoyés** car **Supabase nécessite une configuration SMTP personnalisée** pour envoyer des emails en production.

---

## 🔧 Solution Immédiate : Configurer SMTP

### Étape 1 : Aller dans Supabase Dashboard

1. Ouvrir : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/settings/auth
2. Aller dans **Settings → Auth → SMTP Settings**
3. Activer **"Enable Custom SMTP"**

### Étape 2 : Choisir un Fournisseur SMTP

#### Option A : Resend (Recommandé - Gratuit 3 000 emails/mois)

1. Créer un compte : https://resend.com
2. Obtenir une API Key : Dashboard → API Keys → Create API Key
3. Configuration dans Supabase :
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Votre API Key Resend]
   Sender Email: onboarding@resend.dev (pour tests) ou noreply@votredomaine.com
   Sender Name: EMSP Transport
   ```

#### Option B : SendGrid (Gratuit 100 emails/jour)

1. Créer un compte : https://sendgrid.com
2. Obtenir une API Key
3. Configuration :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Votre API Key SendGrid]
   Sender Email: noreply@votredomaine.com
   Sender Name: EMSP Transport
   ```

#### Option C : Mailgun (Gratuit 5 000 emails/mois)

1. Créer un compte : https://mailgun.com
2. Configuration :
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: [Votre nom d'utilisateur Mailgun]
   Password: [Votre mot de passe Mailgun]
   Sender Email: noreply@votredomaine.com
   Sender Name: EMSP Transport
   ```

### Étape 3 : Tester

1. Cliquer sur **"Send Test Email"** dans Supabase Dashboard
2. Vérifier votre boîte de réception (et les spams)

---

## 🛠️ Solution Temporaire : Confirmer Manuellement

En attendant la configuration SMTP :

### Méthode 1 : Via Supabase Dashboard

1. Aller dans **Auth → Users**
2. Sélectionner l'utilisateur
3. Cliquer sur **"Confirm Email"**

### Méthode 2 : Via l'Application

1. Aller dans `/admin/users`
2. Cliquer sur **"Renvoyer l'email de confirmation"**
3. Si l'email n'arrive toujours pas, confirmer manuellement dans Supabase Dashboard

---

## 📊 Améliorations Apportées

### 1. Edge Function `create-user` Améliorée

- ✅ Détection des erreurs d'email
- ✅ Génération d'un lien de confirmation si l'email échoue
- ✅ Messages d'erreur clairs dans la réponse
- ✅ Logs détaillés pour le débogage

### 2. Interface Utilisateur Améliorée

- ✅ Affichage d'un message d'erreur si l'email n'est pas envoyé
- ✅ Indication claire que la configuration SMTP est requise
- ✅ Lien de confirmation disponible dans les logs (console)

---

## 🔍 Vérification

### Vérifier les Logs

```bash
# Voir les logs de création d'utilisateur
npx supabase functions logs create-user

# Chercher les erreurs SMTP
# Rechercher : "SMTP", "email", "resend", "error"
```

### Vérifier dans Supabase Dashboard

1. **Auth → Users** : Vérifier si les utilisateurs sont créés
2. **Auth → Email Templates** : Vérifier les templates d'email
3. **Logs** : Vérifier les logs d'envoi d'email

---

## ✅ Checklist

- [ ] Compte SMTP créé (Resend/SendGrid/Mailgun)
- [ ] Configuration SMTP dans Supabase Dashboard
- [ ] Test d'envoi d'email réussi
- [ ] Vérification des logs
- [ ] Test de création d'utilisateur avec email
- [ ] Vérification de la réception d'email

---

## 🆘 Si les Emails Ne Sont Toujours Pas Envoyés

1. **Vérifier les spams/junk**
2. **Vérifier les logs Supabase** (Dashboard → Logs)
3. **Vérifier la configuration SMTP** (port, host, credentials)
4. **Tester avec un autre fournisseur SMTP**
5. **Vérifier les limites de quota** (gratuit = limité)

---

## 📝 Note Importante

Sur le **plan gratuit de Supabase**, l'envoi d'emails est **très limité**. Il est **fortement recommandé** de configurer un SMTP personnalisé pour la production.

---

**📌 Guide détaillé** : Voir `GUIDE_CONFIGURATION_EMAIL_SUPABASE.md`

