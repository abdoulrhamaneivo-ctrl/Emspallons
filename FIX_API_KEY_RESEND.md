# 🔧 FIX : Erreur "535 API key not found"

## ✅ Progrès Confirmé !

L'erreur a changé, ce qui est **excellent** :

**Avant** :
```
error: "535 5.7.8 Username and Password not accepted... - gsmtp"
```
→ Supabase utilisait encore Gmail

**Maintenant** :
```
error: "535 API key not found"
```
→ ✅ Supabase utilise maintenant Resend !
→ ❌ Mais l'API Key est incorrecte ou manquante

---

## 🔍 Diagnostic de l'Erreur

### Erreur Actuelle : `535 API key not found`

Cette erreur signifie que :
1. ✅ **La configuration Resend est active** (Host = `smtp.resend.com`)
2. ✅ **Le username `resend` est correct**
3. ❌ **L'API Key dans le champ Password est incorrecte** :
   - API Key manquante (champ vide)
   - API Key tronquée (pas copiée en entier)
   - API Key avec espaces avant/après
   - API Key désactivée dans Resend Dashboard
   - API Key invalide ou expirée

---

## ✅ SOLUTION : Corriger l'API Key

### Étape 1 : Obtenir la Bonne API Key Resend

1. **Aller sur** : https://resend.com/api-keys
2. **Vérifier** si vous avez une API Key active

**Si vous n'avez pas d'API Key** :
- Cliquer sur **"Create API Key"**
- Nom : `Supabase EMSP`
- Type : **Full Access** (pas "Read Only")
- Cliquer sur **"Add"**
- **⚠️ IMPORTANT** : Copier l'API Key complète **immédiatement** (vous ne pourrez plus la voir après)
- L'API Key commence par `re_...` et fait environ 40-50 caractères

**Si vous avez déjà une API Key** :
- Vérifier qu'elle est **Active** (pas désactivée)
- Vérifier qu'elle a les permissions **Full Access**
- Si elle est inactive, créer une nouvelle API Key

---

### Étape 2 : Vérifier l'API Key

**Format correct d'une API Key Resend** :
- Commence par `re_`
- Contient environ 40-50 caractères au total
- Exemple : `re_AbCdEfGh1234567890XyZwVuTsRqPo` (format fictif)

**❌ API Keys incorrectes** :
- ❌ Commence par autre chose que `re_`
- ❌ Trop courte (< 30 caractères)
- ❌ Contient des espaces
- ❌ Tronquée (manque la fin)

---

### Étape 3 : Mettre à Jour dans Supabase

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

2. **Vérifier les champs actuels** :
   - Host : `smtp.resend.com` ✅ (doit être correct maintenant)
   - Port : `587` ✅
   - Username : `resend` ✅ (doit être correct maintenant)
   - **Password** : ⚠️ **VOICI LE PROBLÈME** - Vérifiez ce champ

3. **Corriger le champ Password** :
   - **Effacer complètement** le contenu actuel du champ Password
   - **Copier l'API Key Resend complète** depuis Resend Dashboard
   - **Coller** dans le champ Password (sans espaces avant/après)
   - **Vérifier** que l'API Key commence bien par `re_`
   - **Vérifier** qu'il n'y a pas d'espaces

4. **Vérifier les autres champs** (devraient être déjà corrects) :
   - Sender Email : `onboarding@resend.dev`
   - Sender Name : `EMSP Transport`

5. **Sauvegarder** :
   - Cliquer sur **"Save changes"** (bouton vert)
   - Attendre la confirmation **"Settings saved successfully"**

---

### Étape 4 : Tester Immédiatement

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/users
2. **Sélectionner un utilisateur** (par exemple : `ivoabdoul7@gmail.com`)
3. **Cliquer sur "Send confirmation email"**
4. **Vérifier les logs** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/auth-logs
5. **Résultat attendu** :
   - ✅ **Plus d'erreur "API key not found"**
   - ✅ **Status 200** au lieu de 500
   - ✅ **Email envoyé avec succès**

---

## ⚠️ Erreurs Courantes avec l'API Key

### ❌ Ne PAS FAIRE :

1. **Copier partiellement l'API Key** :
   - ❌ Ne copier que les premiers caractères
   - ❌ Ne copier que les derniers caractères
   - ✅ Copier **TOUTE** l'API Key du début à la fin

2. **Ajouter des espaces** :
   - ❌ Espace avant l'API Key : ` re_...`
   - ❌ Espace après l'API Key : `re_... `
   - ❌ Espaces au milieu : `re_ ... ...` (ne devrait pas y en avoir normalement)
   - ✅ Pas d'espaces : `re_...` (tout collé)

3. **Utiliser une ancienne API Key** :
   - ❌ API Key désactivée dans Resend Dashboard
   - ❌ API Key supprimée
   - ✅ API Key active et valide

4. **Mauvaise permission** :
   - ❌ API Key avec permission "Read Only"
   - ✅ API Key avec permission **"Full Access"**

---

## 🔍 Vérification dans Resend Dashboard

Après avoir configuré l'API Key :

1. **Aller sur** : https://resend.com/api-keys
2. **Vérifier** :
   - ✅ L'API Key est **Active** (pas "Revoked" ou "Inactive")
   - ✅ Le type est **"Full Access"** (pas "Read Only")
   - ✅ La date de création est récente (si vous venez de la créer)

3. **Aller sur** : https://resend.com/emails
4. **Après un test d'envoi**, vérifier :
   - ✅ Les emails apparaissent dans la liste
   - ✅ Le status est **"Sent"** (pas "Failed" ou "Bounced")
   - ✅ La date/heure correspond à votre test

---

## 📝 Checklist de Vérification

Avant de tester, vérifiez **CHAQUE POINT** :

- [ ] **Host** = `smtp.resend.com` (pas `smtp.gmail.com`)
- [ ] **Port** = `587` (pas 465, pas 25)
- [ ] **Username** = `resend` (minuscules, exactement)
- [ ] **Password** = API Key Resend complète (commence par `re_...`)
- [ ] **Password** = Pas d'espaces avant/après
- [ ] **Password** = API Key complète (40-50 caractères environ)
- [ ] **Sender Email** = `onboarding@resend.dev`
- [ ] **Sender Name** = `EMSP Transport`
- [ ] **API Key dans Resend Dashboard** = Active et Full Access
- [ ] **"Save changes" cliqué et confirmé** dans Supabase

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Vérifications Complémentaires :

1. **Dans Supabase SMTP Settings** :
   - Copier-coller le contenu du champ Password dans un éditeur de texte
   - Vérifier qu'il commence par `re_`
   - Compter les caractères (doit être ~40-50)
   - Vérifier qu'il n'y a pas d'espaces

2. **Créer une Nouvelle API Key** :
   - Parfois les anciennes API Keys peuvent avoir des problèmes
   - Créer une nouvelle API Key dans Resend
   - L'utiliser immédiatement dans Supabase
   - Tester avec la nouvelle

3. **Vérifier dans les Logs Supabase** :
   - Quelle erreur exacte apparaît maintenant ?
   - Est-ce toujours "API key not found" ?
   - Y a-t-il une autre erreur ?

4. **Test direct Resend** :
   - Aller sur : https://resend.com/emails
   - Cliquer sur "Send Test Email" (si disponible)
   - Vérifier si un email de test fonctionne directement depuis Resend

---

## 📝 Résumé

**Problème actuel** : `535 API key not found`
**Cause** : API Key Resend incorrecte, manquante ou mal copiée dans Supabase
**Solution** : Copier-coller l'API Key Resend complète dans le champ Password
**Temps estimé** : 2 minutes

---

## ✅ Résultat Final Attendu

Une fois l'API Key corrigée :

- ✅ **Plus d'erreur "API key not found"**
- ✅ **Status 200** dans les logs
- ✅ **Emails envoyés avec succès**
- ✅ **Emails visibles dans Resend Dashboard**
- ✅ **Utilisateurs reçoivent leurs emails de confirmation**

---

**🎯 ACTION IMMÉDIATE** : Vérifiez le champ Password dans Supabase SMTP Settings et remplacez-le par une API Key Resend complète et valide !


