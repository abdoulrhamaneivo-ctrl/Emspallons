# 🔍 Débogage : Resend Ne Fonctionne Pas

## ⚠️ Problème

Vous avez configuré Resend mais l'erreur persiste :
```
Failed to send confirmation email
Error sending confirmation email
```

---

## 🔍 Vérifications à Faire

### 1. Vérifier la Configuration SMTP dans Supabase

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

**Vérifier que tous les champs sont EXACTEMENT** :
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Votre API Key Resend - doit commencer par re_...]
Sender Email: onboarding@resend.dev (pour tests)
Sender Name: EMSP Transport
```

**⚠️ Erreurs courantes** :
- ❌ Host incorrect : `smtp.resend.com` (pas `resend.com` ou autre)
- ❌ Port incorrect : `587` (pas `465` ou autre)
- ❌ Username incorrect : `resend` (en minuscules, exactement)
- ❌ Password incorrect : Doit être l'API Key complète (commence par `re_...`)
- ❌ Sender Email incorrect : Pour tests, utiliser `onboarding@resend.dev`

---

### 2. Vérifier l'API Key Resend

**Dans Resend Dashboard** :
1. Aller sur : https://resend.com/api-keys
2. Vérifier que l'API Key est **active**
3. Vérifier que vous avez copié **TOUTE** l'API Key (commence par `re_...`)
4. Si nécessaire, créer une nouvelle API Key

**⚠️ Erreurs courantes** :
- ❌ API Key incomplète (partiellement copiée)
- ❌ API Key expirée ou désactivée
- ❌ Mauvais type d'API Key (doit être "Full Access" pour SMTP)

---

### 3. Vérifier les Logs Supabase

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs

**Chercher** :
- Filtrer par : `auth` ou `email` ou `smtp`
- Regarder les erreurs récentes
- Chercher les messages comme :
  - `SMTP authentication failed`
  - `Invalid credentials`
  - `Connection timeout`
  - `Sender email not verified`

---

### 4. Vérifier le Sender Email dans Resend

**Problème possible** : Le sender email doit être vérifié dans Resend.

**Solution** :
1. Aller dans Resend Dashboard : https://resend.com/domains
2. Vérifier que `onboarding@resend.dev` est disponible
3. Ou ajouter votre propre domaine

**Pour tests** : Utiliser `onboarding@resend.dev` (déjà vérifié par Resend)

---

## 🛠️ Solutions

### Solution 1 : Vérifier la Configuration Exacte

**Configuration CORRECTE pour Resend** :
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx (votre API Key complète)
Sender Email: onboarding@resend.dev
Sender Name: EMSP Transport
```

**Vérifier** :
- ✅ Pas d'espaces avant/après les valeurs
- ✅ Username en minuscules : `resend`
- ✅ API Key complète (commence par `re_...`)

---

### Solution 2 : Créer une Nouvelle API Key

1. **Dans Resend Dashboard** :
   - Aller sur : https://resend.com/api-keys
   - Supprimer l'ancienne API Key (si nécessaire)
   - Créer une nouvelle API Key
   - **Type** : "Full Access"
   - **Copier** l'API Key complète

2. **Dans Supabase** :
   - Aller dans SMTP Settings
   - Coller la nouvelle API Key dans "Password"
   - **Sauvegarder**

---

### Solution 3 : Vérifier le Sender Email

**Pour tests** :
- Utiliser : `onboarding@resend.dev` (déjà vérifié par Resend)

**Pour production** :
- Ajouter votre domaine dans Resend
- Vérifier le domaine
- Utiliser : `noreply@votredomaine.com`

---

### Solution 4 : Vérifier les Logs Resend

1. **Dans Resend Dashboard** :
   - Aller sur : https://resend.com/emails
   - Vérifier si des emails sont envoyés
   - Voir les erreurs éventuelles

---

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier la Configuration

1. Ouvrir : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp
2. **Vérifier chaque champ** :
   - Host = `smtp.resend.com` ?
   - Port = `587` ?
   - Username = `resend` (exactement) ?
   - Password = API Key complète (commence par `re_...`) ?
   - Sender Email = `onboarding@resend.dev` ?

### Étape 2 : Tester avec un Nouvel API Key

1. Créer une nouvelle API Key dans Resend
2. Mettre à jour dans Supabase
3. Sauvegarder
4. Tester à nouveau

### Étape 3 : Vérifier les Logs

1. Aller dans : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs
2. Filtrer par `auth` ou `email`
3. Regarder l'erreur exacte
4. Me donner l'erreur exacte

---

## 📝 Informations à Me Donner

Pour vous aider, j'ai besoin de :

1. **L'erreur exacte dans les logs Supabase** :
   - Aller dans : Logs → Filtrer par `auth`
   - Copier l'erreur exacte

2. **Votre configuration SMTP actuelle** :
   - Host : ?
   - Port : ?
   - Username : ?
   - Sender Email : ?

3. **Dans Resend Dashboard** :
   - L'API Key est active ?
   - Des emails sont envoyés dans "Emails" ?

---

## 🆘 Si Rien Ne Fonctionne

**Alternative** : Utiliser SendGrid ou Mailgun

1. **SendGrid** (gratuit 100 emails/jour) :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Votre API Key SendGrid]
   ```

2. **Mailgun** (gratuit 5 000 emails/mois) :
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: [Votre username Mailgun]
   Password: [Votre password Mailgun]
   ```

---

**🎯 Action** : Vérifiez la configuration exacte et donnez-moi l'erreur précise des logs Supabase.








