# 🌐 Guide Complet : Vérifier un Domaine dans Resend

## 🎯 Objectif

Permettre l'envoi d'emails à **n'importe quelle adresse** via Resend.

**Sans domaine vérifié** : ❌ Envoi uniquement à `emspallons@gmail.com`
**Avec domaine vérifié** : ✅ Envoi à toutes les adresses

---

## 📋 Prérequis

1. ✅ Compte Resend actif (https://resend.com)
2. ✅ API Key Resend configurée dans Supabase
3. 🔑 **Posséder un domaine** OU utiliser un sous-domaine Vercel

**Options de domaine** :
- Votre propre domaine (ex: `emspallons.com`)
- Domaine Vercel personnalisé (si vous avez configuré un domaine dans Vercel)
- Sous-domaine Vercel (ex: `emspallons.vercel.app`)

---

## 🚀 Étape 1 : Ajouter le Domaine dans Resend

### 1.1 Aller dans Resend Domains

1. **Aller sur** : https://resend.com/domains
2. **Connectez-vous** si nécessaire

### 1.2 Cliquer sur "Add Domain"

1. **Cliquer sur le bouton "Add Domain"** (en haut à droite)
2. **Entrer votre domaine** :
   - Exemples :
     - `emspallons.com` (si vous possédez ce domaine)
     - `emspallons.vercel.app` (domaine Vercel)
     - `mail.emspallons.com` (sous-domaine)

3. **Cliquer sur "Add"**

---

## 🔧 Étape 2 : Configurer les Enregistrements DNS

Une fois le domaine ajouté, Resend vous affichera **3 enregistrements DNS** à ajouter.

### 2.1 Comprendre les Enregistrements

Resend vous donnera quelque chose comme :

```
Type: TXT
Name: resend._domainkey
Value: [une longue chaîne de caractères]
```

```
Type: TXT
Name: @
Value: v=spf1 include:resend.net ~all
```

```
Type: CNAME (optionnel, pour DMARC)
Name: _dmarc
Value: [si applicable]
```

### 2.2 Où Ajouter les Enregistrements DNS

#### Option A : Si vous possédez un domaine (Namecheap, GoDaddy, etc.)

1. **Aller dans votre fournisseur de domaine** :
   - Namecheap : https://www.namecheap.com
   - GoDaddy : https://www.godaddy.com
   - Google Domains : https://domains.google.com
   - Autre fournisseur

2. **Aller dans la gestion DNS** :
   - Chercher "DNS Management" ou "Gestion DNS"
   - Ou "Domain Settings" → "DNS"

3. **Ajouter les enregistrements** :
   - Cliquer sur "Add Record" ou "Ajouter un enregistrement"
   - Copier-coller **exactement** ce que Resend vous donne
   - Sauvegarder

#### Option B : Si vous utilisez Vercel (Recommandé)

1. **Aller sur Vercel** : https://vercel.com/dashboard

2. **Sélectionner votre projet** (`emspallons`)

3. **Aller dans Settings** → **Domains**

4. **Si vous avez déjà un domaine personnalisé** :
   - Cliquer sur votre domaine
   - Aller dans "DNS Records"
   - Ajouter les enregistrements fournis par Resend

5. **Si vous utilisez `emspallons.vercel.app`** :
   - ⚠️ **Limitation** : Vercel ne permet pas de modifier les enregistrements DNS pour `.vercel.app`
   - **Solution** : Utiliser un domaine personnalisé ou un autre fournisseur

---

## ⏱️ Étape 3 : Attendre la Vérification

1. **Retourner dans Resend** : https://resend.com/domains

2. **Vérifier le status** :
   - ⏳ **Pending** = En attente de vérification (normal, peut prendre 5-30 minutes)
   - ✅ **Verified** = Domaine vérifié (prêt à utiliser)
   - ❌ **Failed** = Erreur (vérifier les enregistrements DNS)

3. **Si c'est "Pending"** :
   - Attendre quelques minutes
   - Resend vérifie automatiquement toutes les 5-10 minutes
   - Rafraîchir la page

4. **Si c'est "Failed"** :
   - Vérifier que les enregistrements DNS sont **exactement** comme indiqués
   - Vérifier qu'ils sont bien sauvegardés dans votre fournisseur DNS
   - Attendre un peu plus (la propagation DNS peut prendre jusqu'à 24h, mais généralement 5-30 min)

---

## ✅ Étape 4 : Configurer Supabase

Une fois le domaine **Verified** (✅) dans Resend :

### 4.1 Aller dans Supabase SMTP Settings

1. **Aller sur** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

### 4.2 Changer le Sender Email

**Remplacez** :
```
Sender Email: onboarding@resend.dev
```

**Par** :
```
Sender Email: noreply@votredomaine.com
```

**Exemples** :
- Si domaine = `emspallons.com` → `noreply@emspallons.com`
- Si domaine = `emspallons.vercel.app` → `noreply@emspallons.vercel.app`
- Ou : `contact@emspallons.com`, `support@emspallons.com`, etc.

**⚠️ IMPORTANT** :
- Le domaine après `@` doit être **exactement** le domaine vérifié dans Resend
- Vous pouvez utiliser n'importe quelle partie avant `@` (`noreply`, `contact`, `support`, etc.)

### 4.3 Vérifier les Autres Paramètres

```
Host: smtp.resend.com ✅
Port: 587 ✅
Username: resend ✅
Password: [Votre API Key Resend] ✅
Sender Email: noreply@votredomaine.com ← CHANGER ICI
Sender Name: EMSP Transport ✅
```

### 4.4 Sauvegarder

1. **Cliquer sur "Save changes"**
2. **Attendre** la confirmation "Settings saved successfully"

---

## 🧪 Étape 5 : Tester

### 5.1 Tester dans Supabase

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/users

2. **Sélectionner un utilisateur** avec une adresse différente (ex: `ivoabdoul7@gmail.com`)

3. **Cliquer sur "Send confirmation email"**

4. **Vérifier les logs** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/auth-logs
   - ✅ **Plus d'erreur 450**
   - ✅ **Status 200**
   - ✅ **Email envoyé avec succès**

### 5.2 Vérifier dans Resend Dashboard

1. **Aller sur** : https://resend.com/emails

2. **Vérifier** :
   - ✅ L'email apparaît dans la liste
   - ✅ Status : **"Sent"**
   - ✅ Destinataire : L'adresse de l'utilisateur (pas seulement votre email)
   - ✅ Expéditeur : `noreply@votredomaine.com`

---

## 🔍 Vérification Complète

### Checklist

- [ ] Domaine ajouté dans Resend : https://resend.com/domains
- [ ] Enregistrements DNS ajoutés (TXT pour SPF et DKIM)
- [ ] Domaine vérifié (status "Verified" ✅ dans Resend)
- [ ] Sender Email changé dans Supabase vers `noreply@votredomaine.com`
- [ ] "Save changes" cliqué dans Supabase
- [ ] Test d'envoi réussi à une adresse différente
- [ ] Email reçu par le destinataire

---

## 🆘 Problèmes Courants

### Problème 1 : Domaine reste "Pending"

**Solutions** :
1. Vérifier que les enregistrements DNS sont **exactement** comme indiqué
2. Vérifier qu'ils sont bien sauvegardés dans votre fournisseur DNS
3. Attendre plus longtemps (jusqu'à 24h, mais généralement 30 min max)
4. Vérifier dans Resend s'il y a des messages d'erreur spécifiques

### Problème 2 : Domaine "Failed"

**Solutions** :
1. Vérifier chaque enregistrement DNS un par un
2. Supprimer et re-ajouter les enregistrements
3. Vérifier qu'il n'y a pas de caractères supplémentaires ou d'espaces
4. Contacter le support de votre fournisseur DNS si nécessaire

### Problème 3 : Emails toujours bloqués après vérification

**Solutions** :
1. Vérifier que le Sender Email dans Supabase utilise **exactement** le domaine vérifié
2. Vérifier que le domaine est bien "Verified" (pas "Pending")
3. Attendre quelques minutes après la vérification
4. Vérifier les logs Supabase pour l'erreur exacte

---

## 💡 Astuces

### Choix du Sender Email

**Bonnes options** :
- `noreply@votredomaine.com` (standard, ne nécessite pas de réponse)
- `contact@votredomaine.com` (si vous voulez recevoir des réponses)
- `support@votredomaine.com` (pour le support)
- `no-reply@votredomaine.com` (variante)

**À éviter** :
- `info@votredomaine.com` (peut être considéré comme spam)
- Noms trop longs ou complexes

### Plusieurs Domaines

Vous pouvez vérifier **plusieurs domaines** dans Resend :
- `emspallons.com`
- `emsp-transport.com`
- etc.

Chaque domaine vérifié peut être utilisé pour le Sender Email.

---

## 📝 Résumé

**Pour envoyer à n'importe quelle adresse** :

1. ✅ Vérifier un domaine dans Resend (https://resend.com/domains)
2. ✅ Ajouter les enregistrements DNS fournis par Resend
3. ✅ Attendre la vérification (status "Verified")
4. ✅ Changer Sender Email dans Supabase vers `noreply@votredomaine.com`
5. ✅ Tester avec différentes adresses

**Temps estimé** : 10-30 minutes (principalement pour la propagation DNS)

---

## ✅ Résultat Final

Une fois configuré :

- ✅ **Envoi à toutes les adresses** (pas seulement votre email)
- ✅ **Emails professionnels** (`noreply@votredomaine.com`)
- ✅ **Plus d'erreur 450**
- ✅ **Status 200** dans les logs
- ✅ **Utilisateurs reçoivent leurs emails de confirmation**

---

**🎯 Action Immédiate** : Allez sur https://resend.com/domains et ajoutez votre domaine maintenant !


