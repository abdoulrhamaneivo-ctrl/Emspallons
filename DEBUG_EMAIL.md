# 🔍 Débogage : Emails Non Reçus

## ✅ Corrections Appliquées

1. **Erreur JavaScript `r.map is not a function`** → ✅ **CORRIGÉ**
   - Ajout de vérifications dans `exportUtils.js`
   - Vérification que `data` est un tableau avant `.map()`

---

## 📧 Problème : Emails Non Reçus

### Étape 1 : Vérifier la Configuration SMTP

1. **Aller dans Supabase Dashboard** :
   - https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

2. **Vérifier tous les champs** :
   ```
   ✅ Sender email: emspallons@gmail.com
   ✅ Sender name: EMSP Transport
   ✅ Host: smtp.gmail.com
   ✅ Port: 587
   ✅ Username: emspallons@gmail.com
   ✅ Password: [Votre App Password - 16 caractères]
   ```

3. **Tester l'envoi** :
   - Si disponible, cliquer sur **"Send Test Email"**
   - Vérifier si l'email arrive

---

### Étape 2 : Vérifier les Logs Supabase

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/edge-functions

2. **Chercher les logs de `create-user`** :
   - Filtrer par fonction : `create-user`
   - Chercher les erreurs SMTP

3. **Erreurs courantes** :
   - `Invalid credentials` → Vérifier l'App Password
   - `Connection timeout` → Vérifier le port (587)
   - `Authentication failed` → Vérifier la validation en 2 étapes

---

### Étape 3 : Vérifier dans l'Application

1. **Créer un nouvel éducateur** :
   - Aller dans `/admin/users`
   - Cliquer sur "Nouvel éducateur"
   - Remplir le formulaire
   - Cliquer sur "Créer"

2. **Vérifier le message** :
   - ✅ Si message : "Éducateur créé avec succès. Un email de confirmation a été envoyé."
   - ⚠️ Si message : "Éducateur créé, mais l'email n'a pas pu être envoyé."
     → Voir les logs dans la console (F12)

3. **Ouvrir la console** (F12) :
   - Chercher les messages d'erreur
   - Chercher les logs de l'Edge Function

---

### Étape 4 : Vérifier Gmail

1. **Vérifier la boîte de réception** : `emspallons@gmail.com`
2. **Vérifier les spams/junk**
3. **Vérifier le dossier Promotions** (si Gmail)
4. **Chercher** : Email de Supabase avec le sujet "Confirm your signup"

---

### Étape 5 : Vérifier les Limites Gmail

- **Quota** : 500 emails/jour maximum
- **Rate limiting** : 100 emails/heure
- **Vérifier** : https://myaccount.google.com/apppasswords
  - Vérifier que l'App Password est toujours actif

---

## 🛠️ Solutions Possibles

### Solution 1 : Vérifier l'App Password

1. Aller sur : https://myaccount.google.com/apppasswords
2. Vérifier que l'App Password est toujours actif
3. Si nécessaire, créer un nouvel App Password
4. Mettre à jour dans Supabase

### Solution 2 : Vérifier la Validation en 2 Étapes

1. Aller sur : https://myaccount.google.com/security
2. Vérifier que la validation en 2 étapes est activée
3. Si non, l'activer et créer un nouvel App Password

### Solution 3 : Tester avec un Autre Email

1. Créer un éducateur avec un autre email (pas Gmail)
2. Vérifier si l'email arrive
3. Cela permet de savoir si le problème vient de Gmail ou de Supabase

### Solution 4 : Utiliser Resend (Alternative)

Si Gmail ne fonctionne toujours pas :

1. Créer un compte Resend : https://resend.com
2. Obtenir une API Key
3. Configurer dans Supabase :
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Votre API Key Resend]
   Sender Email: onboarding@resend.dev
   ```

---

## 📝 Checklist de Débogage

- [ ] Configuration SMTP vérifiée dans Supabase
- [ ] App Password Gmail actif et correct
- [ ] Validation en 2 étapes activée
- [ ] Logs Supabase vérifiés (pas d'erreurs SMTP)
- [ ] Console navigateur vérifiée (pas d'erreurs)
- [ ] Boîte de réception vérifiée (spams inclus)
- [ ] Test avec un autre email effectué
- [ ] Limites Gmail vérifiées (pas de quota dépassé)

---

## 🆘 Si Rien Ne Fonctionne

1. **Vérifier les logs Supabase** (Dashboard → Logs → Edge Functions)
2. **Vérifier les logs de l'application** (Console navigateur F12)
3. **Tester avec Resend** (alternative plus fiable)
4. **Contacter le support Supabase** si nécessaire

---

**📌 Note** : Les erreurs WebSocket/Realtime dans la console sont normales et n'affectent pas l'envoi d'emails. Elles sont liées à la connexion temps réel et peuvent être ignorées pour l'instant.

