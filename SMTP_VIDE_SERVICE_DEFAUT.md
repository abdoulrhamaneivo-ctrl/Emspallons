# 🔧 Utiliser le Service Email Par Défaut de Supabase (SMTP Vide)

## ⚠️ Situation Actuelle

Vous êtes dans la page **SMTP Settings** et Supabase demande de remplir tous les champs (champs rouges).

**Problème** : Vous voulez utiliser le service par défaut de Supabase (sans configuration SMTP personnalisée).

---

## ✅ Solution : Désactiver le SMTP Personnalisé

### Option 1 : Chercher un Toggle "Enable Custom SMTP"

**Dans la page SMTP Settings**, regardez :

1. **En haut de la page** :
   - Chercher un toggle ou switch **"Enable Custom SMTP"**
   - OU **"Use Custom SMTP"**
   - OU **"SMTP Enabled"**

2. **Si vous trouvez ce toggle** :
   - ❌ **Désactiver** le toggle (mettre sur "off")
   - ✅ **Sauvegarder** : Cliquer sur "Save changes"
   - **Résultat** : Supabase utilisera son service par défaut

### Option 2 : Laisser les Champs avec Valeurs Minimales

**Si le toggle n'existe pas**, vous pouvez essayer :

1. **Remplir les champs minimaux** :
   - Host : `mail.supabase.io` (service par défaut)
   - Port : `587`
   - Username : `default`
   - Password : `default` (ou laisser vide)
   - Sender Email : `noreply@supabase.io`
   - Sender Name : `EMSP Transport`

2. **OU essayer de sauvegarder avec champs vides** :
   - Laisser tous les champs vides
   - Cliquer sur "Save changes"
   - Voir si ça accepte (peut-être que l'interface est stricte mais le service accepte)

---

## 🔍 Alternative : Utiliser les Valeurs Par Défaut de Supabase

### Configuration Minimale

**Si Supabase exige une configuration**, utilisez ces valeurs :

```
Sender email address: noreply@supabase.io
Sender name: EMSP Transport

Host: mail.supabase.io
Port number: 587
Username: default
Password: [laisser vide ou mettre "default"]
Minimum interval per user: 60
```

**⚠️ Note** : Ces valeurs sont des exemples. Supabase peut avoir changé sa configuration.

---

## 🎯 Meilleure Solution : Ne Pas Configurer de SMTP

### Option A : Ignorer cette Page

**Si possible** :
1. **Ne pas configurer** la page SMTP
2. **Laisser les champs tels quels** (avec erreurs)
3. **Ne pas cliquer sur "Save changes"**
4. **Tester** la création de compte pour voir si les emails partent

**Le service par défaut de Supabase peut fonctionner** même sans configuration SMTP sur cette page.

---

### Option B : Chercher dans Auth Settings

**Peut-être que la configuration SMTP est optionnelle** :

1. **Retourner dans** : Auth → Settings
   - URL : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/settings

2. **Chercher** :
   - Section "Email" ou "Email Configuration"
   - Option "Use default email service"
   - Toggle pour désactiver SMTP personnalisé

---

## 🧪 Test : Vérifier si ça Fonctionne Sans Configuration

### Test Immédiat

**Même avec les champs en erreur**, testez :

1. **Ne pas cliquer sur "Save changes"** dans la page SMTP
2. **Aller directement sur** : `/register`
3. **Créer un compte** :
   - Email : Votre email
   - Password : test123456
4. **Vérifier** :
   - ✅ Message : "Email envoyé automatiquement" ?
   - ✅ Logs Supabase : Status 200 ?
   - ✅ Email reçu ?

**Si l'email part quand même** → Le service par défaut fonctionne sans configuration SMTP ! ✅

---

## 📝 Actions à Essayer

### Action 1 : Laisser les Champs en Erreur

1. **Ne rien remplir** (laisser les erreurs)
2. **Ne pas cliquer sur "Save changes"**
3. **Fermer la page** (cliquer sur X ou autre page)
4. **Tester** la création de compte

### Action 2 : Chercher un Toggle

1. **Dans la page SMTP**, chercher en haut
2. **Toggle "Enable Custom SMTP"** → Désactiver
3. **Sauvegarder**

### Action 3 : Utiliser Valeurs Minimales

1. **Remplir avec des valeurs par défaut** (voir Option 2 ci-dessus)
2. **Sauvegarder**
3. **Tester**

---

## 🔍 Vérification : Est-ce que le SMTP est Nécessaire ?

**Supabase peut fonctionner de deux façons** :

1. **Service par défaut** :
   - ✅ Pas de configuration SMTP nécessaire
   - ✅ Emails envoyés automatiquement
   - ⚠️ Limitations (quota, deliverability)

2. **SMTP personnalisé** :
   - ✅ Meilleure deliverability
   - ✅ Plus de quota
   - ❌ Configuration requise

**Pour votre cas** : Le service par défaut devrait suffire (comme avec votre premier compte).

---

## 🎯 Action Immédiate

**Essayez dans cet ordre** :

1. **Chercher un toggle** "Enable Custom SMTP" en haut de la page → Désactiver
2. **Si pas de toggle** : Ne pas sauvegarder, fermer la page, tester quand même
3. **Si ça ne fonctionne pas** : Me dire ce qui se passe dans les logs Supabase lors du test

---

## ✅ Si le Toggle N'Existe Pas

**Essayer** :

1. **Laisser la page SMTP telle quelle** (avec erreurs)
2. **Aller directement tester** la création de compte
3. **Vérifier les logs Supabase** :
   - Si Status 200 → ✅ Fonctionne sans SMTP !
   - Si Status 500 avec erreur SMTP → ⚠️ SMTP requis, il faut configurer

---

**🎯 Essayez d'abord de chercher un toggle pour désactiver le SMTP personnalisé, ou testez directement sans sauvegarder la page SMTP !**

