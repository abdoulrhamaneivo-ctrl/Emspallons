# ✅ Test de la Configuration Email

## 🎉 Configuration Terminée !

Maintenant, testons si les emails sont bien envoyés.

---

## 🧪 Test 1 : Créer un Nouvel Éducateur

1. **Aller dans l'application** : https://emspallons.vercel.app
2. **Se connecter** en tant qu'admin
3. **Aller dans** : `/admin/users`
4. **Cliquer sur** : "Nouvel éducateur"
5. **Remplir le formulaire** :
   - Email : `test@emsp.com` (ou votre email de test)
   - Nom : `Test Éducateur`
   - Mot de passe : `Test123456`
   - Rôle : `Éducateur`
6. **Cliquer sur** : "Créer"

### ✅ Résultat Attendu

- **Message de succès** : "Éducateur créé avec succès. Un email de confirmation a été envoyé."
- **Email reçu** : Vérifiez votre boîte de réception (et les spams)

---

## 📧 Vérifier l'Email

1. **Ouvrir votre boîte email** : `emspallons@gmail.com`
2. **Vérifier** :
   - Boîte de réception
   - Dossier Spam/Junk
   - Dossier Promotions (si Gmail)
3. **Chercher** : Email de Supabase avec le sujet "Confirm your signup"

---

## 🔍 Si l'Email N'Arrive Pas

### Vérifier les Logs

1. **Dans Supabase Dashboard** :
   - Aller dans : **Logs** → **Edge Functions**
   - Chercher les logs de `create-user`
   - Vérifier s'il y a des erreurs SMTP

2. **Dans l'Application** :
   - Ouvrir la console du navigateur (F12)
   - Chercher les messages d'erreur

### Vérifier la Configuration SMTP

1. **Dans Supabase Dashboard** :
   - Settings → Auth → SMTP Settings
   - Vérifier que tous les champs sont corrects :
     - Host : `smtp.gmail.com`
     - Port : `587`
     - Username : `emspallons@gmail.com`
     - Password : App Password (16 caractères)

### Erreurs Courantes

- ❌ **"Invalid credentials"** → Vérifier l'App Password
- ❌ **"Connection timeout"** → Vérifier le port (587)
- ❌ **"Authentication failed"** → Vérifier que la validation en 2 étapes est activée

---

## ✅ Si Ça Fonctionne

Si vous recevez l'email de confirmation :

1. **Cliquer sur le lien** dans l'email
2. **Confirmer l'email**
3. **Se connecter** avec le compte créé
4. **Vérifier** que tout fonctionne

---

## 🎯 Prochaines Étapes

Une fois que les emails fonctionnent :

1. ✅ Créer les éducateurs nécessaires
2. ✅ Vérifier que tous reçoivent leurs emails
3. ✅ Documenter la configuration pour l'équipe

---

**📌 Note** : Gmail a une limite de **500 emails/jour**. Pour la production, envisagez **Resend** ou **SendGrid** pour plus de quota.

---

**✅ Testez maintenant et dites-moi si ça fonctionne !**

