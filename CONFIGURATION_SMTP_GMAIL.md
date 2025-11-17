# 📧 Configuration SMTP Gmail pour Supabase

## ⚠️ Configuration Actuelle (À Corriger)

D'après votre capture d'écran, voici ce qu'il faut corriger :

---

## ✅ Configuration Correcte pour Gmail

### 1. Sender Details (Détails de l'expéditeur)

- **Sender email address** : `emspallons@gmail.com` (votre email Gmail)
- **Sender name** : `EMSP Transport` (ou le nom que vous préférez)

### 2. SMTP Provider Settings (Paramètres SMTP)

- **Host** : `smtp.gmail.com` ✅ (à changer de `your.smtp.host.com`)
- **Port number** : `587` ✅ (recommandé pour TLS) ou `465` (pour SSL)
- **Username** : `emspallons@gmail.com` ✅ (déjà correct)
- **Password** : ⚠️ **IMPORTANT** : Vous devez utiliser un **App Password**, pas votre mot de passe Gmail normal

---

## 🔑 Créer un App Password Gmail

### Étape 1 : Activer la Validation en 2 Étapes

1. Aller sur : https://myaccount.google.com/security
2. Activer **"Validation en 2 étapes"** si ce n'est pas déjà fait

### Étape 2 : Créer un App Password

1. Aller sur : https://myaccount.google.com/apppasswords
2. Sélectionner **"Application"** : `Mail`
3. Sélectionner **"Appareil"** : `Autre (nom personnalisé)`
4. Entrer : `Supabase EMSP`
5. Cliquer sur **"Générer"**
6. **Copier le mot de passe généré** (16 caractères, espaces inclus ou non)

### Étape 3 : Utiliser l'App Password

- Dans Supabase, dans le champ **Password**, coller l'App Password (sans les espaces)
- Format : `xxxx xxxx xxxx xxxx` → `xxxxxxxxxxxxxxxx`

---

## 📝 Configuration Finale dans Supabase

```
Sender email address: emspallons@gmail.com
Sender name: EMSP Transport

Host: smtp.gmail.com
Port number: 587
Username: emspallons@gmail.com
Password: [Votre App Password - 16 caractères sans espaces]
Minimum interval per user: 60 (par défaut)
```

---

## ⚠️ Limitations Gmail SMTP

- **Quota** : 500 emails/jour maximum
- **Rate limiting** : Limite de 100 emails/heure
- **Recommandation** : Pour la production, utilisez plutôt **Resend** ou **SendGrid** (plus fiable et plus de quota)

---

## ✅ Tester la Configuration

1. Cliquer sur **"Save changes"** dans Supabase
2. Cliquer sur **"Send Test Email"** (si disponible)
3. Vérifier votre boîte de réception (et les spams)

---

## 🆘 Si Ça Ne Fonctionne Pas

### Vérifier :

1. ✅ La validation en 2 étapes est activée
2. ✅ L'App Password est correct (16 caractères, sans espaces)
3. ✅ Le port est `587` (TLS) ou `465` (SSL)
4. ✅ Le host est `smtp.gmail.com` (pas `your.smtp.host.com`)

### Erreurs Courantes :

- ❌ **"Invalid credentials"** → Vérifier l'App Password
- ❌ **"Connection timeout"** → Vérifier le port (587 ou 465)
- ❌ **"Authentication failed"** → Activer la validation en 2 étapes

---

## 🎯 Alternative Recommandée : Resend

Pour éviter les limitations Gmail, je recommande **Resend** :

1. Gratuit jusqu'à **3 000 emails/mois**
2. Plus fiable que Gmail SMTP
3. Configuration plus simple
4. Pas de validation en 2 étapes nécessaire

Voir `GUIDE_CONFIGURATION_EMAIL_SUPABASE.md` pour la configuration Resend.

---

**✅ Une fois configuré, les emails de confirmation seront envoyés automatiquement !**

