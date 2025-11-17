# 📧 Solution Finale : Emails Non Reçus

## ⚠️ Problème Persistant

Les emails ne sont toujours pas reçus malgré la configuration SMTP Gmail.

---

## 🔍 Diagnostic Complet

### 1. Vérifier les Logs Supabase Edge Functions

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/logs/edge-functions

**Chercher** :
- Fonction : `create-user`
- Erreurs : `SMTP`, `email`, `resend`, `authentication`

**Erreurs possibles** :
- `Invalid credentials` → App Password incorrect
- `Connection timeout` → Port incorrect (doit être 587)
- `Authentication failed` → Validation en 2 étapes non activée

---

### 2. Vérifier la Configuration SMTP

**Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

**Vérifier** :
```
✅ Host: smtp.gmail.com
✅ Port: 587
✅ Username: emspallons@gmail.com
✅ Password: [App Password - 16 caractères]
✅ Sender Email: emspallons@gmail.com
✅ Sender Name: EMSP Transport
```

**Tester** :
- Si disponible, cliquer sur **"Send Test Email"**
- Vérifier si l'email arrive

---

### 3. Solution Alternative : Utiliser Resend (Recommandé)

Gmail SMTP peut être problématique. **Resend est plus fiable** :

#### Étape 1 : Créer un compte Resend

1. Aller sur : https://resend.com
2. Créer un compte (gratuit jusqu'à 3 000 emails/mois)
3. Vérifier votre email

#### Étape 2 : Obtenir une API Key

1. Dashboard → **API Keys** → **Create API Key**
2. Nom : `Supabase EMSP`
3. **Copier l'API Key** (commence par `re_...`)

#### Étape 3 : Configurer dans Supabase

1. Aller dans : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp
2. Configuration :
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Votre API Key Resend - commence par re_...]
   Sender Email: onboarding@resend.dev (pour tests)
   Sender Name: EMSP Transport
   ```
3. **Sauvegarder**

#### Étape 4 : Tester

1. Créer un nouvel éducateur
2. Vérifier si l'email arrive

---

### 4. Vérifier Gmail

Si vous utilisez toujours Gmail :

1. **Vérifier l'App Password** :
   - https://myaccount.google.com/apppasswords
   - Vérifier qu'il est toujours actif
   - Si nécessaire, créer un nouveau

2. **Vérifier la validation en 2 étapes** :
   - https://myaccount.google.com/security
   - Doit être activée

3. **Vérifier les limites** :
   - Quota : 500 emails/jour
   - Rate limit : 100 emails/heure

---

## ✅ Solution Recommandée : Resend

**Pourquoi Resend ?**
- ✅ Plus fiable que Gmail SMTP
- ✅ 3 000 emails/mois gratuits
- ✅ Configuration plus simple
- ✅ Pas de validation en 2 étapes nécessaire
- ✅ Meilleur pour la production

**Configuration Resend** :
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Votre API Key Resend]
Sender Email: onboarding@resend.dev
```

---

## 🆘 Si Rien Ne Fonctionne

1. **Vérifier les logs Supabase** (Dashboard → Logs → Edge Functions)
2. **Vérifier la console navigateur** (F12) après création d'éducateur
3. **Tester avec Resend** (alternative plus fiable)
4. **Contacter le support Supabase** si nécessaire

---

**📌 Note** : Les erreurs WebSocket dans la console sont normales et n'affectent pas l'envoi d'emails.

