# 📧 Configuration : Emails Supabase par Défaut (Sans API Externe)

## 🎯 Objectif

Activer la vérification d'email avec le service email par défaut de Supabase, sans configurer Resend ou une autre API externe.

---

## ✅ Étape 1 : Désactiver la Configuration SMTP Personnalisée

### 1.1 Aller dans Supabase SMTP Settings

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

### 1.2 Désactiver le SMTP Personnalisé

**Si vous avez une configuration SMTP** :

1. **Retirer tous les champs SMTP** :
   - Host : Laisser vide
   - Port : Laisser vide
   - Username : Laisser vide
   - Password : Laisser vide
   - Sender Email : Laisser vide (ou utiliser l'email par défaut de Supabase)

2. **OU Désactiver l'option "Enable Custom SMTP"** si elle existe

3. **Sauvegarder** :
   - Cliquer sur "Save changes"

**Résultat** : Supabase utilisera son service email par défaut

---

## ✅ Étape 2 : Activer la Vérification d'Email

### 2.1 Aller dans Supabase Auth Settings

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/settings

### 2.2 Activer les Options Email

**Configurer** :
- ✅ **"Enable email signups"** → **ACTIVÉ** (nécessaire pour les inscriptions)
- ✅ **"Enable email confirmations"** → **ACTIVÉ** (pour envoyer les emails)
- ✅ **"Require email confirmation"** → **ACTIVÉ** (obligatoire pour se connecter)

### 2.3 Sauvegarder

- Cliquer sur **"Save"** ou **"Save changes"**
- Attendre la confirmation

---

## ✅ Étape 3 : Vérifier les Templates d'Email

### 3.1 Aller dans Email Templates

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/templates

### 3.2 Vérifier le Template "Confirm signup"

1. **Chercher** : "Confirm signup" ou "Confirmation d'inscription"
2. **Vérifier** que le template existe et est activé
3. **Si nécessaire** : Personnaliser le message (optionnel)

### 3.3 Vérifier le Sender Email

**Dans Auth Settings** :
- Vérifier le **"Sender Email"** par défaut
- Si vide, Supabase utilisera généralement un email automatique
- Vous pouvez définir un email personnalisé si nécessaire

---

## 🧪 Étape 4 : Tester

### 4.1 Tester la Création de Compte

1. **Aller sur** : `/register` ou https://emspallons.vercel.app/register

2. **Créer un compte admin** :
   - Nom : Test Admin
   - Email : Votre email (ex: `emspallons@gmail.com`)
   - Mot de passe : test123456

3. **Vérifier** :
   - ✅ Message : "Compte créé avec succès ! Un email de confirmation a été envoyé."
   - ✅ Pas d'erreur dans les logs
   - ✅ Email reçu dans votre boîte mail (vérifier les spams aussi)

### 4.2 Vérifier les Logs Supabase

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/auth-logs

**Vérifier** :
- ✅ **Status 200** (si email envoyé avec succès)
- ✅ **Plus d'erreur SMTP** (pas d'erreur "API key not found" ou "gsmtp")
- ✅ **Action** : `user_confirmation_requested`

---

## ⚠️ Limitations du Service Email Par Défaut de Supabase

### Plan Gratuit

**Limitations** :
- ⚠️ **Quota limité** : ~4 emails/heure par défaut
- ⚠️ **Rate limiting** : Peut être bloqué temporairement
- ⚠️ **Deliverability** : Peut finir dans les spams plus facilement

**Recommandation** :
- Pour la production, il est recommandé de configurer un SMTP personnalisé
- Pour les tests et le développement, le service par défaut fonctionne

### Plan Pro/Team

**Avantages** :
- ✅ Quota plus élevé
- ✅ Meilleure deliverability
- ✅ Analytics des emails

---

## 🔍 Vérifications à Faire

### Checklist

**Configuration Supabase** :
- [ ] SMTP personnalisé : **Désactivé** ou champs vides
- [ ] "Enable email signups" : ✅ Activé
- [ ] "Enable email confirmations" : ✅ Activé
- [ ] "Require email confirmation" : ✅ Activé
- [ ] Templates d'email : ✅ Activés

**Test** :
- [ ] Créer un compte test : Email reçu
- [ ] Vérifier les logs : Status 200, pas d'erreurs
- [ ] Lien de confirmation : Fonctionne
- [ ] Connexion après confirmation : Fonctionne

---

## 🆘 Dépannage

### Problème : Email toujours non reçu

**Vérifications** :

1. **Spams** : Vérifier le dossier spam/junk
2. **Logs Supabase** : Y a-t-il des erreurs ?
3. **Quota** : Vérifier si le quota n'est pas dépassé
4. **Rate limiting** : Attendre quelques minutes et réessayer

### Problème : "Rate limit exceeded"

**Solution** :
- Attendre quelques minutes
- Ou configurer un SMTP personnalisé pour éviter les limitations

### Problème : Email dans les spams

**Solution** :
- Vérifier les spams régulièrement
- Configurer un SMTP personnalisé avec domaine vérifié pour améliorer la deliverability

---

## 📝 Résumé

**Configuration** :
1. ✅ Désactiver SMTP personnalisé (champs vides)
2. ✅ Activer vérification d'email dans Auth Settings
3. ✅ Tester avec votre email

**Résultat** :
- ✅ Emails envoyés via le service par défaut de Supabase
- ✅ Pas besoin de configurer Resend ou autre API
- ✅ Fonctionne immédiatement (avec limitations du plan gratuit)

---

**🎯 Action Immédiate** : 
1. Désactivez la configuration SMTP dans Supabase
2. Activez la vérification d'email
3. Testez avec votre email !

