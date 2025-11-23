# ✅ Erreur Trouvée : Gmail Utilisé au Lieu de Resend

## 🔴 Erreur Exacte

```
"error": "535 5.7.8 Username and Password not accepted. 
For more information, go to
https://support.google.com/mail/?p=BadCredentials 
... - gsmtp"
```

---

## 🔍 Analyse de l'Erreur

### Ce Que L'Erreur Signifie

1. **"535 5.7.8 Username and Password not accepted"** :
   - Gmail refuse les identifiants (username/password)
   - App Password incorrect ou expiré

2. **"... - gsmtp"** :
   - **`gsmtp`** = **Gmail SMTP** (pas Resend !)
   - Cela confirme que **Gmail est encore utilisé**, pas Resend

3. **Conclusion** :
   - ❌ La configuration SMTP dans Supabase utilise **encore Gmail**
   - ❌ Resend n'est **pas configuré** ou **pas sauvegardé**

---

## ✅ Solution : Configurer Resend Correctement

### Étape 1 : Aller dans SMTP Settings

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp

### Étape 2 : Vérifier la Configuration Actuelle

**Vérifiez** ce qui est actuellement dans les champs :
- Host : Est-ce `smtp.gmail.com` ou `smtp.resend.com` ?
- Username : Est-ce `emspallons@gmail.com` ou `resend` ?
- Password : Est-ce un App Password Gmail ou une API Key Resend ?

**Si vous voyez encore Gmail** → C'est pour ça que ça ne fonctionne pas !

---

### Étape 3 : Remplacer par Resend

**Configuration EXACTE pour Resend** :

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Votre API Key Resend - commence par re_...]
Sender Email: onboarding@resend.dev
Sender Name: EMSP Transport
```

**Points critiques** :
- ✅ Host : `smtp.resend.com` (pas `smtp.gmail.com`)
- ✅ Port : `587` (pas 465)
- ✅ Username : `resend` (en minuscules, pas votre email Gmail)
- ✅ Password : API Key Resend (commence par `re_...`, pas App Password Gmail)
- ✅ Sender Email : `onboarding@resend.dev` (pour tests)

---

### Étape 4 : Sauvegarder

1. **Remplacer TOUS les champs** par la configuration Resend ci-dessus
2. **Cliquer sur "Save changes"** (bouton vert)
3. **Attendre** la confirmation de sauvegarde

---

### Étape 5 : Tester

1. **Retourner dans** : Auth → Users
2. **Sélectionner un utilisateur**
3. **Cliquer sur "Send confirmation email"**
4. **L'erreur disparaîtra** ✅
5. **L'email partira** ✅

---

## 🔍 Vérification

### Si Vous Avez Déjà Configuré Resend

**Vérifiez** :
1. La configuration est-elle **sauvegardée** dans Supabase ?
2. L'API Key Resend est-elle **active** dans Resend Dashboard ?
3. L'API Key est-elle **complète** (commence par `re_...`) ?

**Si la configuration n'est pas sauvegardée** :
- Les changements ne sont pas appliqués
- Supabase utilise encore l'ancienne config (Gmail)
- **→ C'est pour ça que vous voyez l'erreur Gmail !**

---

## 📝 Checklist

Avant de tester, vérifiez :

- [ ] Host = `smtp.resend.com` (pas `smtp.gmail.com`)
- [ ] Port = `587` (pas 465)
- [ ] Username = `resend` (pas votre email Gmail)
- [ ] Password = API Key Resend complète (commence par `re_...`)
- [ ] Sender Email = `onboarding@resend.dev`
- [ ] **"Save changes" cliqué et sauvegardé**

---

## 🎯 Action Immédiate

1. **Aller dans** : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp
2. **Vérifier** si la configuration est Gmail ou Resend
3. **Si c'est Gmail** → Remplacer par Resend (configuration ci-dessus)
4. **Sauvegarder**
5. **Tester** → L'erreur disparaîtra

---

**📌 L'erreur `gsmtp` confirme que Gmail est encore utilisé. Il faut remplacer par Resend dans la configuration SMTP !**








