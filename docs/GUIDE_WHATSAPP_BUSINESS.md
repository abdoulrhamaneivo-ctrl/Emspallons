# 📱 Guide de Configuration WhatsApp Business Cloud API

Ce guide vous explique comment configurer WhatsApp Business Cloud API pour l'envoi automatique de messages dans EMSP Transport.

## 📋 Prérequis

1. Un compte Facebook Business (gratuit)
2. Un compte Meta for Developers (gratuit)
3. Un numéro de téléphone dédié (recommandé)

---

## 🚀 Étape 1 : Créer une Application Meta

1. **Allez sur [Meta for Developers](https://developers.facebook.com/)**
   - Connectez-vous avec votre compte Facebook Business

2. **Créez une nouvelle application**
   - Cliquez sur "Mes applications" → "Créer une application"
   - Sélectionnez le type : **"Business"**
   - Donnez un nom à votre application (ex: "EMSP Transport")
   - Cliquez sur "Créer une application"

---

## 🎯 Étape 2 : Ajouter WhatsApp au projet

1. **Dans votre application Meta**
   - Allez dans "Ajouter des produits"
   - Recherchez **"WhatsApp"**
   - Cliquez sur "Configurer"

2. **Choisissez votre mode**
   - **Mode Sandbox** (gratuit, pour tester) : Limité à 5 numéros de test
   - **Mode Production** (payant) : Pour l'utilisation réelle

---

## 🔑 Étape 3 : Obtenir votre Token d'accès

### Pour le Mode Sandbox (Test)

1. **Allez dans WhatsApp → API Setup**
2. **Copiez le "Temporary access token"**
   - ⚠️ Ce token expire après quelques heures
   - Vous devrez le régénérer régulièrement

### Pour le Mode Production

1. **Créez un App Access Token permanent**
   - Allez dans "Paramètres" → "Paramètres de base"
   - Notez votre **App ID** et **App Secret**

2. **Générez le token via Graph API Explorer**
   - Allez sur [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Sélectionnez votre application
   - Sélectionnez la permission : `whatsapp_business_messaging`
   - Cliquez sur "Générer un token d'accès"

3. **Ou utilisez un Token System User (Recommandé)**
   - Allez dans "Paramètres" → "Utilisateurs système"
   - Créez un utilisateur système
   - Ajoutez-lui le rôle "Administrateur"
   - Générez un token pour cet utilisateur

---

## 📞 Étape 4 : Configurer votre Numéro de Téléphone

### Option A : Utiliser un numéro de test (Sandbox)

1. **Dans WhatsApp → API Setup**
2. **Cliquez sur "Ajouter un numéro de téléphone"**
3. **Entrez votre numéro** (format international : +225 XX XX XX XX XX)
4. **Vérifiez le code reçu par SMS**
5. **Votre numéro est maintenant configuré**

### Option B : Utiliser un numéro de production

1. **Vous devez avoir un compte WhatsApp Business vérifié**
2. **Dans WhatsApp → API Setup**
3. **Cliquez sur "Ajouter un numéro de téléphone"**
4. **Sélectionnez votre compte Business existant**
5. **Vérifiez le numéro**

---

## 🔧 Étape 5 : Configurer les Variables d'Environnement

1. **Ouvrez votre fichier `.env.local`** (à la racine du projet)

2. **Ajoutez ces variables :**

```env
# WhatsApp Business Cloud API
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY=votre_token_d_acces_ici
```

3. **Remplacez `votre_token_d_acces_ici`** par :
   - Votre **Temporary access token** (Sandbox)
   - Ou votre **App Access Token** (Production)

4. **Redémarrez votre serveur de développement**

---

## 📝 Étape 6 : Tester l'Envoi

1. **Lancez votre application**
2. **Enregistrez un paiement**
3. **Vérifiez les logs dans la console** :
   - Si l'envoi réussit : `Confirmation paiement envoyée par WhatsApp`
   - Si l'envoi échoue : `Erreur API WhatsApp Business`

4. **Vérifiez le téléphone de l'étudiant** pour voir le message

---

## 💰 Coûts WhatsApp Business Cloud API

### Mode Sandbox (Gratuit)
- ✅ 5 numéros de test
- ✅ Messages illimités vers ces numéros
- ⚠️ Token temporaire (expire rapidement)

### Mode Production (Payant)
- 💰 **Prix par conversation** (pas par message)
- 📊 **Tarifs** :
  - Conversation utilisateur initiée : **0,005$ - 0,09$** selon le pays
  - Conversation business initiée : **0,005$ - 0,09$** selon le pays
  - Côte d'Ivoire : ~**0,005$** par conversation

### Exemple de coût
- 100 étudiants × 1 message/mois = **0,50$** par mois
- 1000 étudiants × 1 message/mois = **5,00$** par mois

---

## 🔒 Sécurité

### ⚠️ Important

1. **Ne commitez JAMAIS votre token dans Git**
   - Le fichier `.env.local` est déjà dans `.gitignore`
   - Vérifiez qu'il n'est pas commité

2. **Régénérez votre token si compromis**
   - Allez dans Meta for Developers
   - Révoquez l'ancien token
   - Générez un nouveau token

3. **Utilisez des tokens avec permissions minimales**
   - Seulement `whatsapp_business_messaging`
   - Pas d'autres permissions

---

## 🐛 Dépannage

### Erreur : "Invalid OAuth access token"

**Solution :**
- Vérifiez que votre token est valide
- Régénérez le token dans Meta for Developers
- Vérifiez que le token a la permission `whatsapp_business_messaging`

### Erreur : "Phone number not registered"

**Solution :**
- Vérifiez que votre numéro est bien ajouté dans WhatsApp → API Setup
- Vérifiez que le numéro est vérifié
- En mode Sandbox, vérifiez que le destinataire est dans votre liste de test

### Erreur : "Rate limit exceeded"

**Solution :**
- WhatsApp limite le nombre de messages par seconde
- Réduisez la fréquence d'envoi
- Utilisez des batchs avec délais (déjà implémenté dans le code)

### Messages non reçus

**Vérifications :**
1. Le numéro de téléphone est au format international (+225...)
2. Le numéro est valide et actif
3. Le destinataire n'a pas bloqué votre numéro
4. Vous êtes en mode Production (pas Sandbox) pour les vrais numéros

---

## 📚 Ressources Utiles

- [Documentation WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Tarifs WhatsApp Business](https://developers.facebook.com/docs/whatsapp/pricing)
- [Guide de démarrage rapide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)

---

## ✅ Checklist de Configuration

- [ ] Compte Meta for Developers créé
- [ ] Application Meta créée
- [ ] WhatsApp ajouté au projet
- [ ] Token d'accès obtenu
- [ ] Numéro de téléphone configuré
- [ ] Variables d'environnement configurées (`.env.local`)
- [ ] Test d'envoi réussi
- [ ] Mode Production activé (si nécessaire)

---

## 🎯 Prochaines Étapes

Une fois configuré :

1. **Testez avec quelques paiements**
2. **Vérifiez les logs** pour détecter les erreurs
3. **Passez en mode Production** quand vous êtes prêt
4. **Surveillez les coûts** dans Meta for Developers

---

## 💡 Astuce

Pour le développement, utilisez le **Mode Sandbox** avec des numéros de test. Cela vous permet de tester gratuitement sans coûts.

Pour la production, passez en **Mode Production** et configurez un token permanent.

---

**Besoin d'aide ?** Consultez la [documentation officielle](https://developers.facebook.com/docs/whatsapp/cloud-api) ou contactez le support Meta.

