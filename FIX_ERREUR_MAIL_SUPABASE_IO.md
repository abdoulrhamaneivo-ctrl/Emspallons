# 🔧 Fix : Erreur "mail.supabase.io: no such host"

## 🔴 Erreur Actuelle

```
"error": "dial tcp: lookup mail.supabase.io on 127.0.0.53:53: no such host"
```

**Signification** :
- ❌ Supabase essaie de se connecter à `mail.supabase.io`
- ❌ Ce host n'existe pas
- ❌ Configuration SMTP incorrecte ou incomplète

---

## ✅ Solution : Vider Complètement les Champs SMTP

### Étape 1 : Retirer Toutes les Valeurs SMTP

**URL** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

**Retirer** :
- ❌ **Host** : Laisser **VIDE** (ne pas mettre `mail.supabase.io`)
- ❌ **Port** : Laisser **VIDE** ou mettre `0` si obligatoire
- ❌ **Username** : Laisser **VIDE**
- ❌ **Password** : Laisser **VIDE**
- ❌ **Sender Email** : Laisser **VIDE**
- ❌ **Sender Name** : Laisser **VIDE**

### Étape 2 : Chercher un Toggle pour Désactiver SMTP

**Dans la page SMTP**, chercher en haut :

1. **Toggle "Enable Custom SMTP"** ou **"SMTP Enabled"**
   - ❌ **Désactiver** (mettre sur "off")
   - ✅ Cela désactive le SMTP personnalisé

2. **Si toggle trouvé et désactivé** :
   - Supabase utilisera son service par défaut
   - Pas besoin de remplir les champs

### Étape 3 : Si Pas de Toggle - Ne Pas Sauvegarder

**Si tous les champs sont obligatoires ET pas de toggle** :

1. **Ne pas cliquer sur "Save changes"**
2. **Laisser les champs avec erreurs**
3. **Fermer la page**
4. **Tester quand même** la création de compte

**Peut-être que** Supabase utilise son service par défaut même si la page SMTP n'est pas sauvegardée.

---

## ⚠️ Problème : Supabase Nécessite Maintenant un SMTP

### D'après les Recherches

**Supabase a changé** :
- ❌ Le service email par défaut **ne fonctionne plus** comme avant
- ❌ Il nécessite maintenant une **configuration SMTP personnalisée**
- ❌ Le service par défaut a des **limitations très strictes** (seulement adresses préautorisées)

### Pour Votre Premier Compte

**Pourquoi ça fonctionnait** :
- ✅ Peut-être que votre email était dans les adresses préautorisées
- ✅ Ou Supabase permettait le service par défaut avant

**Maintenant** :
- ❌ Supabase exige une configuration SMTP pour envoyer à toutes les adresses

---

## ✅ Solution : Configuration SMTP Minimale

### Option A : Utiliser Gmail SMTP (Simple et Gratuit)

**Configuration Gmail SMTP** :

1. **Créer un App Password Gmail** :
   - Aller sur : https://myaccount.google.com/apppasswords
   - Activer "Validation en 2 étapes" si nécessaire
   - Créer App Password : `Supabase EMSP`
   - **Copier l'App Password** (16 caractères)

2. **Dans Supabase SMTP Settings** :

```
Sender email address: emspallons@gmail.com
Sender name: EMSP Transport

Host: smtp.gmail.com
Port number: 587
Username: emspallons@gmail.com
Password: [Votre App Password Gmail - 16 caractères]
Minimum interval per user: 60
```

3. **Sauvegarder** : Cliquer sur "Save changes"

**Avantages** :
- ✅ Gratuit
- ✅ Pas besoin de Resend
- ✅ Fonctionne immédiatement
- ✅ Limite : 500 emails/jour

**Voir** : `CONFIGURATION_SMTP_GMAIL.md` pour les détails

---

### Option B : Tester Sans SMTP (Si Possible)

**Essayer** :

1. **Dans la page SMTP** :
   - Ne pas remplir les champs
   - Ne pas cliquer sur "Save changes"
   - Chercher un toggle pour désactiver SMTP

2. **Tester la création de compte** :
   - Vérifier les logs
   - Voir si Supabase essaie quand même d'envoyer

3. **Si erreur SMTP** → Il faut configurer un SMTP

---

## 🎯 Solution Recommandée : Gmail SMTP

**Pour avoir un SMTP qui fonctionne sans API externe** :

### Configuration Gmail Simple

1. **Obtenir App Password Gmail** (5 minutes)
2. **Configurer dans Supabase** :
   - Host : `smtp.gmail.com`
   - Port : `587`
   - Username : `emspallons@gmail.com`
   - Password : App Password Gmail
   - Sender Email : `emspallons@gmail.com`

3. **Sauvegarder et tester**

**Résultat** :
- ✅ Emails envoyés automatiquement
- ✅ Pas besoin de Resend ou autre API
- ✅ Fonctionne comme Gmail normal

---

## 📝 Actions Immédiates

### Action 1 : Vider les Champs SMTP

1. **Dans la page SMTP** :
   - Retirer `mail.supabase.io` du Host (laisser vide)
   - Retirer toutes les valeurs
   - Chercher un toggle "Enable Custom SMTP" → Désactiver si trouvé

2. **Ne pas sauvegarder** si les champs sont vides avec erreurs

3. **Tester** : Créer un compte → Vérifier les logs

### Action 2 : Si Ça Ne Fonctionne Pas → Configurer Gmail

1. **Créer App Password Gmail**
2. **Configurer dans Supabase SMTP** (voir Option A ci-dessus)
3. **Sauvegarder**
4. **Tester**

---

## 🔍 Diagnostic

**Erreur actuelle** : `mail.supabase.io: no such host`

**Cause** : Configuration SMTP avec host invalide

**Solutions** :
1. **Vider complètement les champs SMTP** (si toggle existe pour désactiver)
2. **OU configurer Gmail SMTP** (solution simple et gratuite)
3. **OU configurer Resend** (si vous changez d'avis)

---

## ✅ Résultat Attendu

**Avec champs SMTP vides ET toggle désactivé** :
- ✅ Supabase utilise son service par défaut
- ✅ Email envoyé automatiquement

**Avec Gmail SMTP configuré** :
- ✅ Email envoyé automatiquement via Gmail
- ✅ Pas d'erreur "no such host"

---

**🎯 Action Immédiate** : 
1. Vider tous les champs SMTP dans Supabase
2. Chercher un toggle pour désactiver SMTP personnalisé
3. Si pas de toggle : Configurer Gmail SMTP (simple et gratuit)

