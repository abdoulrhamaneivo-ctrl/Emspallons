# 🚀 Guide Étape par Étape : Resend avec Vercel

## 🎯 Objectif

Permettre l'envoi d'emails à **n'importe quelle adresse** en vérifiant un domaine via Vercel.

---

## 📋 Étape 1 : Vérifier Votre Domaine Vercel

### 1.1 Aller dans Vercel Dashboard

1. **Aller sur** : https://vercel.com/dashboard
2. **Se connecter** si nécessaire
3. **Sélectionner votre projet** (`emspallons` ou le nom de votre projet)

### 1.2 Vérifier les Domaines Disponibles

1. **Dans votre projet**, cliquer sur **"Settings"** (en haut)
2. **Cliquer sur "Domains"** dans le menu de gauche

**Questions à répondre** :

**Avez-vous un domaine personnalisé configuré ?**
- ✅ **OUI** : Si vous voyez un domaine comme `emspallons.com` ou `www.emspallons.com`
- ❌ **NON** : Si vous voyez seulement `emspallons.vercel.app`

**📝 Notez votre domaine** : _____________________________

---

## 📋 Étape 2 : Aller dans Resend

### 2.1 Ouvrir Resend Domains

1. **Aller sur** : https://resend.com/domains
2. **Se connecter** si nécessaire (avec votre compte Resend)

### 2.2 Cliquer sur "Add Domain"

1. **Chercher le bouton** "Add Domain" (en haut à droite, généralement vert ou bleu)
2. **Cliquer dessus**

---

## 📋 Étape 3 : Ajouter Votre Domaine

### 3.1 Entrer le Domaine

**Selon votre situation** :

#### Si vous avez un domaine personnalisé dans Vercel (ex: `emspallons.com`)

1. **Dans le champ "Domain"**, entrer : `emspallons.com`
   (Remplacez par votre propre domaine)

2. **⚠️ IMPORTANT** : Entrer **SEULEMENT** le domaine, sans `https://`, sans `www`, sans `/`
   - ✅ Correct : `emspallons.com`
   - ❌ Incorrect : `https://emspallons.com`
   - ❌ Incorrect : `www.emspallons.com`
   - ❌ Incorrect : `emspallons.com/`

#### Si vous n'avez QUE le domaine Vercel (`emspallons.vercel.app`)

**⚠️ ATTENTION** : Les domaines `.vercel.app` ne peuvent généralement **PAS** être vérifiés dans Resend car Vercel ne permet pas de modifier les enregistrements DNS pour ces domaines.

**Options** :
- **Option A** : Acheter un domaine personnalisé (recommandé)
- **Option B** : Vérifier si vous pouvez utiliser un sous-domaine

**Pour l'instant**, essayons d'abord avec votre domaine personnalisé si vous en avez un.

### 3.2 Cliquer sur "Add"

1. **Vérifier** que le domaine est correct
2. **Cliquer sur "Add"** ou "Create Domain"

---

## 📋 Étape 4 : Copier les Enregistrements DNS

### 4.1 Resend Affiche les Enregistrements

Après avoir ajouté le domaine, Resend va vous montrer **2 ou 3 enregistrements DNS** à ajouter.

**Ils ressembleront à ça** :

```
Enregistrement 1 :
Type: TXT
Name: resend._domainkey
Value: [une très longue chaîne de caractères]
TTL: 3600

Enregistrement 2 :
Type: TXT
Name: @
Value: v=spf1 include:resend.net ~all
TTL: 3600

Enregistrement 3 (optionnel - DMARC) :
Type: TXT
Name: _dmarc
Value: [si fourni]
TTL: 3600
```

### 4.2 Copier Chaque Enregistrement

**📝 Action** : Copier **EXACTEMENT** chaque valeur dans un document temporaire ou garder cette page ouverte.

**⚠️ IMPORTANT** : 
- Copier **TOUT** le contenu du champ "Value"
- Faire attention aux espaces
- Ne rien modifier

---

## 📋 Étape 5 : Ajouter les Enregistrements DNS dans Vercel

### 5.1 Retourner dans Vercel

1. **Aller sur** : https://vercel.com/dashboard
2. **Sélectionner votre projet**
3. **Settings** → **Domains**

### 5.2 Sélectionner Votre Domaine

1. **Dans la liste des domaines**, cliquer sur **votre domaine** (ex: `emspallons.com`)
2. **Cliquer sur "DNS Records"** ou "Enregistrements DNS" (onglet)

### 5.3 Ajouter le Premier Enregistrement (DKIM)

1. **Cliquer sur "Add Record"** ou "Ajouter un enregistrement"

2. **Remplir** :
   - **Type** : Sélectionner **"TXT"**
   - **Name** : Copier depuis Resend (ex: `resend._domainkey`)
   - **Value** : Copier la longue chaîne depuis Resend
   - **TTL** : Laisser par défaut ou mettre `3600`

3. **Cliquer sur "Save"** ou "Save Record"

### 5.4 Ajouter le Deuxième Enregistrement (SPF)

1. **Cliquer à nouveau sur "Add Record"**

2. **Remplir** :
   - **Type** : Sélectionner **"TXT"**
   - **Name** : Mettre `@` (ou laisser vide selon Vercel)
   - **Value** : `v=spf1 include:resend.net ~all`
   - **TTL** : Laisser par défaut ou mettre `3600`

3. **Cliquer sur "Save"**

### 5.5 Ajouter le Troisième Enregistrement (DMARC - si fourni)

**Si Resend vous a donné un enregistrement DMARC** :

1. **Cliquer sur "Add Record"**

2. **Remplir** :
   - **Type** : Sélectionner **"TXT"**
   - **Name** : `_dmarc`
   - **Value** : Copier depuis Resend
   - **TTL** : Laisser par défaut

3. **Cliquer sur "Save"**

### 5.6 Vérifier les Enregistrements

**📝 Action** : Vérifier que vous avez bien **3 enregistrements TXT** :
1. ✅ `resend._domainkey` avec la longue valeur
2. ✅ `@` avec `v=spf1 include:resend.net ~all`
3. ✅ `_dmarc` (si fourni)

---

## 📋 Étape 6 : Attendre la Vérification dans Resend

### 6.1 Retourner dans Resend

1. **Aller sur** : https://resend.com/domains
2. **Vous devriez voir votre domaine** dans la liste

### 6.2 Vérifier le Status

**Status possibles** :
- ⏳ **"Pending"** = En attente (normal)
- ✅ **"Verified"** = Vérifié et prêt !
- ❌ **"Failed"** = Erreur (vérifier les enregistrements)

### 6.3 Attendre

**⏱️ Temps d'attente** :
- **Généralement** : 5-30 minutes
- **Maximum** : 24 heures (rare)

**💡 Conseil** :
- Laisser l'onglet ouvert
- Rafraîchir la page toutes les 5 minutes
- Ne pas abandonner avant 30 minutes

### 6.4 Si le Status est "Pending"

**✅ C'est normal !** Resend vérifie automatiquement toutes les 5-10 minutes.

**Actions** :
- Attendre un peu plus
- Rafraîchir la page (F5 ou Ctrl+R)
- Vérifier dans Vercel que les enregistrements DNS sont bien sauvegardés

### 6.5 Si le Status passe à "Verified" ✅

**🎉 Félicitations !** Votre domaine est vérifié. Passez à l'étape suivante.

### 6.6 Si le Status est "Failed" ❌

**Ne paniquez pas !** Vérifier :

1. **Dans Vercel** :
   - Les enregistrements sont-ils bien sauvegardés ?
   - Sont-ils exactement comme indiqués par Resend ?

2. **Dans Resend** :
   - Y a-t-il un message d'erreur spécifique ?
   - Cliquer sur le domaine pour voir les détails

3. **Solutions** :
   - Supprimer et re-ajouter les enregistrements dans Vercel
   - Vérifier qu'il n'y a pas d'espaces supplémentaires
   - Attendre un peu plus (parfois la propagation DNS prend plus de temps)

---

## 📋 Étape 7 : Configurer Supabase

### 7.1 Aller dans Supabase SMTP Settings

1. **Aller sur** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp
2. **Se connecter** si nécessaire

### 7.2 Vérifier la Configuration Actuelle

**Vérifier que vous avez** :
```
Host: smtp.resend.com ✅
Port: 587 ✅
Username: resend ✅
Password: [Votre API Key Resend] ✅
Sender Email: onboarding@resend.dev ← À CHANGER
Sender Name: EMSP Transport ✅
```

### 7.3 Changer le Sender Email

**Dans le champ "Sender Email"** :

**Remplacer** :
```
onboarding@resend.dev
```

**Par** (en utilisant votre domaine vérifié) :
```
noreply@votredomaine.com
```

**Exemple** :
- Si votre domaine = `emspallons.com` → `noreply@emspallons.com`
- Si votre domaine = `www.emspallons.com` → `noreply@emspallons.com` (sans www)

**⚠️ IMPORTANT** :
- Utiliser **exactement** le domaine vérifié dans Resend
- Vous pouvez mettre `noreply`, `contact`, `support`, etc. avant le `@`
- Mais le domaine après `@` doit être **exactement** celui vérifié

### 7.4 Sauvegarder

1. **Vérifier** tous les champs une dernière fois
2. **Cliquer sur "Save changes"** (bouton vert en bas)
3. **Attendre** la confirmation "Settings saved successfully" ✅

---

## 📋 Étape 8 : Tester

### 8.1 Aller dans Supabase Users

1. **Aller sur** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/users

### 8.2 Sélectionner un Utilisateur

1. **Dans la liste**, sélectionner un utilisateur avec une adresse différente
   - Exemple : `ivoabdoul7@gmail.com`

### 8.3 Envoyer l'Email de Confirmation

1. **Cliquer sur "Send confirmation email"** ou le bouton d'envoi d'email
2. **Attendre** quelques secondes

### 8.4 Vérifier les Logs Supabase

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/auth-logs

2. **Chercher l'entrée la plus récente**

3. **Vérifier** :
   - ✅ **Plus d'erreur "450"** ou "API key not found"
   - ✅ **Status 200** (au lieu de 500)
   - ✅ **Message** : "request completed" ou "Email sent successfully"

### 8.5 Vérifier dans Resend Dashboard

1. **Aller sur** : https://resend.com/emails

2. **Vérifier** :
   - ✅ L'email apparaît dans la liste
   - ✅ **Status** : "Sent" (pas "Failed" ou "Bounced")
   - ✅ **To** : L'adresse de l'utilisateur (`ivoabdoul7@gmail.com`)
   - ✅ **From** : `noreply@votredomaine.com`
   - ✅ **Date** : Maintenant ou il y a quelques minutes

### 8.6 Vérifier la Réception (Bonus)

**Si possible** :
- Vérifier la boîte de réception de `ivoabdoul7@gmail.com`
- L'email devrait être arrivé (peut prendre quelques minutes)
- Vérifier aussi les spams au cas où

---

## ✅ Étape 9 : Vérification Finale

### Checklist Complète

**Configuration Resend** :
- [ ] Domaine ajouté dans Resend
- [ ] Enregistrements DNS ajoutés dans Vercel
- [ ] Domaine vérifié (status "Verified" ✅)

**Configuration Supabase** :
- [ ] Host = `smtp.resend.com`
- [ ] Port = `587`
- [ ] Username = `resend`
- [ ] Password = API Key Resend (commence par `re_...`)
- [ ] Sender Email = `noreply@votredomaine.com` (domaine vérifié)
- [ ] Sender Name = `EMSP Transport`
- [ ] "Save changes" cliqué et confirmé

**Test** :
- [ ] Email envoyé sans erreur dans Supabase
- [ ] Status 200 dans les logs Supabase
- [ ] Email visible dans Resend Dashboard
- [ ] Status "Sent" dans Resend
- [ ] Destinataire = Adresse de l'utilisateur (pas seulement votre email)

---

## 🆘 Problèmes Courants et Solutions

### Problème 1 : Domaine reste "Pending" longtemps

**Solutions** :
1. Attendre jusqu'à 30 minutes
2. Vérifier dans Vercel que les enregistrements DNS sont bien sauvegardés
3. Rafraîchir la page Resend (F5)
4. Vérifier que les valeurs sont exactement comme indiquées (pas d'espaces supplémentaires)

### Problème 2 : "Failed" dans Resend

**Solutions** :
1. Vérifier chaque enregistrement DNS un par un
2. Supprimer et re-ajouter les enregistrements dans Vercel
3. Vérifier qu'il n'y a pas de caractères supplémentaires
4. Attendre un peu plus (propagation DNS)

### Problème 3 : Emails toujours bloqués après vérification

**Solutions** :
1. Vérifier que le Sender Email dans Supabase utilise **exactement** le domaine vérifié
2. Vérifier que le domaine est bien "Verified" (pas "Pending")
3. Attendre 5-10 minutes après la vérification
4. Vérifier les logs Supabase pour l'erreur exacte

### Problème 4 : Je n'ai que `emspallons.vercel.app`

**Solution** :
Les domaines `.vercel.app` ne peuvent généralement pas être vérifiés car Vercel ne permet pas de modifier leurs enregistrements DNS.

**Options** :
1. **Acheter un domaine** (ex: `emspallons.com`) - ~10-15€/an
2. **Ajouter un domaine personnalisé** dans Vercel puis le vérifier dans Resend

---

## 📝 Résumé Rapide

1. ✅ Vercel : Vérifier votre domaine (Settings → Domains)
2. ✅ Resend : Ajouter le domaine (https://resend.com/domains)
3. ✅ Resend : Copier les enregistrements DNS
4. ✅ Vercel : Ajouter les enregistrements DNS dans votre domaine
5. ✅ Resend : Attendre la vérification (status "Verified")
6. ✅ Supabase : Changer Sender Email vers `noreply@votredomaine.com`
7. ✅ Tester : Envoyer un email à une adresse différente
8. ✅ Vérifier : Logs Supabase et Dashboard Resend

---

**🎯 Commençons !** Allez à l'Étape 1 et dites-moi quel domaine vous avez dans Vercel.


