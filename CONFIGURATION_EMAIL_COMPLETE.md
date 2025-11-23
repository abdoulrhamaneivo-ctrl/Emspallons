# 📧 Configuration Complète : Emails Fonctionnels avec Vérification

## 🎯 Objectif

Activer la vérification d'email ET configurer SMTP pour recevoir les emails lors de la création de compte.

---

## ✅ Étape 1 : Activer la Vérification d'Email dans Supabase

### 1.1 Aller dans Supabase Auth Settings

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/settings

### 1.2 Activer les Options

**Configurer** :
- ✅ **"Enable email signups"** → **ACTIVÉ** (nécessaire pour les inscriptions)
- ✅ **"Enable email confirmations"** → **ACTIVÉ** (pour envoyer les emails)
- ✅ **"Require email confirmation"** → **ACTIVÉ** (obligatoire pour se connecter)

### 1.3 Sauvegarder

- Cliquer sur **"Save"** ou **"Save changes"**
- Attendre la confirmation

---

## ✅ Étape 2 : Configurer SMTP avec Resend

### 2.1 Obtenir l'API Key Resend

1. **Aller sur** : https://resend.com/api-keys
2. **Se connecter** avec votre compte Resend
3. **Vérifier** si vous avez une API Key active
   - ✅ **Si oui** : Copier l'API Key complète (commence par `re_...`)
   - ❌ **Si non** : Cliquer sur "Create API Key"
     - Nom : `Supabase EMSP`
     - Type : **Full Access** (pas "Read Only")
     - Cliquer sur "Add"
     - **⚠️ IMPORTANT** : Copier l'API Key immédiatement (vous ne pourrez plus la voir)

### 2.2 Aller dans Supabase SMTP Settings

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

### 2.3 Configuration EXACTE pour Resend

**Copier-coller cette configuration** :

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [VOTRE API KEY RESEND - commence par re_...]
Sender Email: onboarding@resend.dev
Sender Name: EMSP Transport
```

**⚠️ POINTS CRITIQUES** :
- ✅ **Host** : `smtp.resend.com` (avec `smtp.` au début)
- ✅ **Port** : `587` (pas 465, pas 25)
- ✅ **Username** : `resend` (en minuscules, exactement comme ça)
- ✅ **Password** : Votre API Key Resend complète (commence par `re_...`, ~40-50 caractères)
- ✅ **Sender Email** : `onboarding@resend.dev` (pour tests, déjà vérifié par Resend)
- ✅ **Sender Name** : `EMSP Transport` (ou le nom que vous préférez)

### 2.4 Sauvegarder

1. **Remplacer TOUS les champs** par la configuration ci-dessus
2. **Vérifier** chaque champ un par un
3. **Cliquer sur "Save changes"** (bouton vert)
4. **Attendre** la confirmation "Settings saved successfully"

---

## ⚠️ Problème : Limitation Resend avec `onboarding@resend.dev`

### 🔍 Diagnostic

**Avec `onboarding@resend.dev`** :
- ✅ Fonctionne pour envoyer à **votre propre email** (`emspallons@gmail.com`)
- ❌ **Ne fonctionne PAS** pour envoyer à d'autres adresses
- ⚠️ Resend limite les emails de test à votre adresse email uniquement

**Erreur attendue** :
```
"450 You can only send testing emails to your own email address (emspallons@gmail.com)"
```

---

## ✅ Solution : Vérifier un Domaine dans Resend

### Option A : Utiliser Votre Email pour les Tests

**Configuration temporaire** :
```
Sender Email: emspallons@gmail.com
```

**Limitation** :
- ❌ Ne peut envoyer qu'à `emspallons@gmail.com`
- ✅ Mais fonctionne pour tester la configuration SMTP

### Option B : Vérifier un Domaine (Recommandé pour Production)

**Pour envoyer à n'importe quelle adresse** :

1. **Acheter un domaine** (si vous n'en avez pas)
   - Exemple : `emspallons.com` (~10-15€/an)
   - Namecheap : https://www.namecheap.com
   - Google Domains : https://domains.google.com

2. **Vérifier le domaine dans Resend** :
   - Aller sur : https://resend.com/domains
   - Cliquer sur "Add Domain"
   - Entrer votre domaine (ex: `emspallons.com`)
   - Ajouter les enregistrements DNS fournis par Resend
   - Attendre la vérification (5-30 minutes)

3. **Changer le Sender Email dans Supabase** :
   ```
   Sender Email: noreply@votredomaine.com
   ```
   (Remplacer `votredomaine.com` par votre domaine vérifié)

4. **Sauvegarder**

**Voir** : `GUIDE_RESEND_VERCEL_ETAPE_PAR_ETAPE.md` pour les détails complets

---

## 🧪 Étape 3 : Tester la Configuration

### 3.1 Tester avec votre Email

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/users

2. **Créer un utilisateur de test** :
   - Email : `emspallons@gmail.com` (votre email)
   - Password : `test123456`
   - Ou utiliser Register : `/register`

3. **Vérifier** :
   - ✅ Email reçu dans votre boîte mail
   - ✅ Lien de confirmation fonctionne
   - ✅ Compte confirmé

### 3.2 Vérifier les Logs Supabase

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/auth-logs

**Vérifier** :
- ✅ **Plus d'erreur** "535 API key not found"
- ✅ **Plus d'erreur** "450 You can only send testing emails..."
- ✅ **Status 200** (si email envoyé avec succès)
- ✅ **Status 500** avec erreur SMTP (si problème de configuration)

### 3.3 Vérifier les Logs Resend

**Aller sur** : https://resend.com/emails

**Vérifier** :
- ✅ Les emails apparaissent dans la liste
- ✅ **Status** : "Sent" (pas "Failed" ou "Bounced")
- ✅ **To** : L'adresse de l'utilisateur
- ✅ **From** : Le sender email configuré

---

## 🔧 Dépannage

### Problème 1 : "535 API key not found"

**Solution** :
1. Vérifier que l'API Key Resend est correcte dans Supabase SMTP Settings
2. Vérifier que l'API Key est active dans Resend Dashboard
3. Vérifier que l'API Key commence par `re_...`
4. Vérifier qu'il n'y a pas d'espaces avant/après l'API Key

### Problème 2 : "450 You can only send testing emails to your own email address"

**Solution** :
- **Temporaire** : Utiliser votre email pour les tests
- **Définitif** : Vérifier un domaine dans Resend (voir Option B ci-dessus)

### Problème 3 : Emails toujours non reçus

**Vérifier** :
1. **Logs Supabase** : Y a-t-il des erreurs ?
2. **Logs Resend** : Les emails apparaissent-ils ? Status ?
3. **Spam** : Vérifier le dossier spam
4. **Sender Email** : Est-ce bien configuré dans Supabase ?
5. **API Key** : Est-ce active dans Resend Dashboard ?

### Problème 4 : "Connection timeout" ou "Connection refused"

**Solution** :
1. Vérifier que le Host est bien `smtp.resend.com` (avec `smtp.`)
2. Vérifier que le Port est bien `587` (pas 465, pas 25)
3. Vérifier votre connexion internet

---

## 📝 Checklist de Configuration

### Configuration Supabase Auth

- [ ] "Enable email signups" : ✅ Activé
- [ ] "Enable email confirmations" : ✅ Activé
- [ ] "Require email confirmation" : ✅ Activé
- [ ] Changements sauvegardés

### Configuration SMTP

- [ ] Host : `smtp.resend.com`
- [ ] Port : `587`
- [ ] Username : `resend`
- [ ] Password : API Key Resend complète (commence par `re_...`)
- [ ] Sender Email : `onboarding@resend.dev` (ou votre domaine vérifié)
- [ ] Sender Name : `EMSP Transport`
- [ ] Changements sauvegardés

### Vérification Resend

- [ ] API Key active dans Resend Dashboard
- [ ] API Key a les permissions "Full Access"
- [ ] Si domaine utilisé : Domaine vérifié dans Resend

### Tests

- [ ] Test création compte avec votre email : Email reçu
- [ ] Test création compte avec autre email : Email reçu (si domaine vérifié)
- [ ] Logs Supabase : Pas d'erreurs
- [ ] Logs Resend : Status "Sent"

---

## ✅ Résultat Final Attendu

**Avec vérification activée ET SMTP configuré** :
- ✅ Inscription admin : Email de confirmation envoyé
- ✅ Email reçu par l'utilisateur
- ✅ Lien de confirmation fonctionne
- ✅ Compte confirmé après clic sur le lien
- ✅ Utilisateur peut se connecter après confirmation

**Avec domaine vérifié** :
- ✅ Emails envoyés à n'importe quelle adresse
- ✅ Email professionnel (`noreply@votredomaine.com`)
- ✅ Pas de limitations Resend

---

## 🎯 Actions Immédiates

1. **Activer la vérification** dans Supabase Auth Settings
2. **Configurer SMTP** avec Resend (étapes 2.1-2.4)
3. **Tester** avec votre email
4. **Si ça fonctionne** : Vérifier un domaine pour envoyer à toutes les adresses
5. **Si ça ne fonctionne pas** : Vérifier les logs et le dépannage ci-dessus

---

**🚀 Commençons par activer la vérification et configurer SMTP !**

