# 📱 Guide Complet - Configuration et Intégration WhatsApp Business API

**Version:** 1.0.0  
**Date:** $(Get-Date -Format "yyyy-MM-dd")  
**Application:** EMSP Transport Scolaire

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Étape 1 : Créer un Compte Meta Developer](#étape-1--créer-un-compte-meta-developer)
4. [Étape 2 : Créer une Application WhatsApp Business](#étape-2--créer-une-application-whatsapp-business)
5. [Étape 3 : Configurer WhatsApp Business Cloud API](#étape-3--configurer-whatsapp-business-cloud-api)
6. [Étape 4 : Obtenir les Tokens d'Accès](#étape-4--obtenir-les-tokens-daccès)
7. [Étape 5 : Configurer le Numéro de Téléphone](#étape-5--configurer-le-numéro-de-téléphone)
8. [Étape 6 : Configurer les Variables d'Environnement](#étape-6--configurer-les-variables-denvironnement)
9. [Étape 7 : Tester l'Intégration](#étape-7--tester-lintégration)
10. [Étape 8 : Déploiement en Production](#étape-8--déploiement-en-production)
11. [Dépannage](#dépannage)
12. [Coûts et Limites](#coûts-et-limites)

---

## 🎯 Vue d'ensemble

Ce guide vous explique comment configurer l'API WhatsApp Business Cloud pour envoyer automatiquement des messages depuis votre application EMSP Transport Scolaire.

### Fonctionnalités Disponibles

- ✅ Envoi automatique de confirmations de paiement
- ✅ Envoi automatique de QR codes
- ✅ Envoi de rappels personnalisés
- ✅ Envoi de messages batch (par lots)

### Options Disponibles

1. **WhatsApp Business Cloud API** (Recommandé) - Ce guide
2. **WhatsApp Web** (Fallback) - Utilisé si l'API n'est pas configurée

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] Un compte Facebook/Meta actif
- [ ] Un numéro de téléphone valide (pour recevoir les codes de vérification)
- [ ] Un compte WhatsApp Business (optionnel pour le mode Sandbox)
- [ ] Accès à votre fichier `.env.local`
- [ ] Accès à votre dashboard Vercel (pour la production)

---

## 📝 Étape 1 : Créer un Compte Meta Developer

### 1.1 Accéder au Portail Meta for Developers

1. Allez sur [developers.facebook.com](https://developers.facebook.com)
2. Cliquez sur **"Se connecter"** ou **"Créer un compte"**
3. Connectez-vous avec votre compte Facebook

### 1.2 Créer un Compte Developer

1. Si c'est votre première fois, cliquez sur **"Créer un compte"**
2. Remplissez le formulaire :
   - **Nom** : Votre nom ou nom de l'organisation
   - **Email** : Votre email professionnel
   - **Type de compte** : Sélectionnez **"Business"** ou **"Developer"**
3. Acceptez les conditions d'utilisation
4. Vérifiez votre email

### 1.3 Vérifier votre Compte

1. Meta vous demandera de vérifier votre identité
2. Suivez les instructions pour la vérification
3. Cela peut prendre quelques heures à quelques jours

---

## 🚀 Étape 2 : Créer une Application WhatsApp Business

### 2.1 Créer une Nouvelle Application

1. Dans le [Meta for Developers Dashboard](https://developers.facebook.com/apps/)
2. Cliquez sur **"Créer une application"**
3. Sélectionnez **"Business"** comme type d'application
4. Cliquez sur **"Suivant"**

### 2.2 Configurer l'Application

1. **Nom de l'application** : `EMSP Transport WhatsApp` (ou un nom de votre choix)
2. **Email de contact** : Votre email professionnel
3. **Objectif commercial** : Sélectionnez **"Messagerie"** ou **"Autre"**
4. Cliquez sur **"Créer une application"**

### 2.3 Ajouter le Produit WhatsApp

1. Dans le tableau de bord de votre application
2. Trouvez la section **"Ajouter des produits à votre application"**
3. Cliquez sur **"Configurer"** à côté de **"WhatsApp"**
4. Suivez les instructions pour configurer WhatsApp

---

## ⚙️ Étape 3 : Configurer WhatsApp Business Cloud API

### 3.1 Accéder aux Paramètres WhatsApp

1. Dans votre application, allez dans **"WhatsApp"** dans le menu de gauche
2. Cliquez sur **"API Setup"** (Configuration API)
3. Vous verrez votre **Phone Number ID** et d'autres informations

### 3.2 Noter les Informations Importantes

Notez ces informations (vous en aurez besoin plus tard) :

- **Phone Number ID** : `123456789012345` (exemple)
- **WhatsApp Business Account ID** : `123456789012345` (exemple)
- **Temporary Access Token** : (sera généré à l'étape suivante)

---

## 🔑 Étape 4 : Obtenir les Tokens d'Accès

### 4.1 Token Temporaire (Pour les Tests - Sandbox)

1. Dans **"API Setup"** → **"Temporary access token"**
2. Cliquez sur **"Générer un token"**
3. **⚠️ IMPORTANT** : Ce token expire après quelques heures
4. Copiez le token (vous en aurez besoin pour les tests)

### 4.2 Token Permanent (Pour la Production)

#### Option A : App Access Token (Simple)

1. Allez dans **"Paramètres"** → **"De base"**
2. Notez votre **App ID** et **App Secret**
3. Le token sera généré automatiquement lors de l'envoi

#### Option B : System User Token (Recommandé pour Production)

1. Allez dans **"Paramètres"** → **"Utilisateurs système"**
2. Cliquez sur **"Ajouter"**
3. Donnez un nom : `EMSP WhatsApp Service`
4. Sélectionnez le rôle : **"Administrateur"**
5. Cliquez sur **"Créer un utilisateur système"**
6. Cliquez sur **"Générer un token"**
7. **⚠️ IMPORTANT** : Copiez ce token immédiatement, il ne sera affiché qu'une seule fois !
8. Sélectionnez les permissions :
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
9. Cliquez sur **"Générer un token"**
10. Copiez et sauvegardez le token dans un endroit sûr

---

## 📞 Étape 5 : Configurer le Numéro de Téléphone

### 5.1 Mode Sandbox (Tests - Gratuit)

1. Dans **"API Setup"** → **"Add phone number"**
2. Entrez votre numéro de téléphone (format international : `+225 XX XX XX XX XX`)
3. Cliquez sur **"Envoyer le code"**
4. Entrez le code reçu par SMS
5. Votre numéro est maintenant configuré pour les tests

**Limitations du Sandbox :**
- ✅ Vous pouvez envoyer des messages à 5 numéros de test maximum
- ✅ Messages illimités vers ces numéros
- ⚠️ Token temporaire (expire rapidement)

### 5.2 Mode Production (Payant)

1. **Vérifier votre Compte Business**
   - Vous devez avoir un compte WhatsApp Business vérifié
   - Votre compte doit être approuvé par Meta

2. **Ajouter un Numéro de Production**
   - Dans **"API Setup"** → **"Add phone number"**
   - Sélectionnez votre compte Business existant
   - Vérifiez le numéro

3. **Demander l'Accès à l'API**
   - Soumettez votre demande d'accès
   - Attendez l'approbation (peut prendre plusieurs jours)

---

## 🔧 Étape 6 : Configurer les Variables d'Environnement

### 6.1 Configuration Locale (.env.local)

1. **Ouvrez votre fichier `.env.local`** à la racine du projet

2. **Ajoutez ces variables :**

```env
# ============================================
# Configuration WhatsApp Business Cloud API
# ============================================

# URL de l'API WhatsApp Business Cloud
# Version actuelle : v18.0 (vérifiez la dernière version sur developers.facebook.com)
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Token d'accès WhatsApp
# Pour les tests : Utilisez le Temporary Access Token
# Pour la production : Utilisez le System User Token
VITE_WHATSAPP_API_KEY=votre_token_d_acces_ici

# Phone Number ID (Optionnel mais recommandé)
# Trouvable dans : WhatsApp → API Setup → Phone Number ID
VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

3. **Remplacez les valeurs :**
   - `votre_token_d_acces_ici` : Votre token d'accès (étape 4)
   - `123456789012345` : Votre Phone Number ID (étape 3.2)

4. **Exemple complet :**

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici

# WhatsApp Configuration
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

5. **Redémarrez votre serveur de développement :**
   ```bash
   npm run dev
   ```

### 6.2 Configuration Production (Vercel)

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Sélectionnez votre projet**
3. **Allez dans "Settings" → "Environment Variables"**
4. **Ajoutez les variables suivantes :**

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `VITE_WHATSAPP_API_URL` | `https://graph.facebook.com/v18.0` | Production, Preview, Development |
| `VITE_WHATSAPP_API_KEY` | Votre token d'accès | Production, Preview, Development |
| `VITE_WHATSAPP_PHONE_NUMBER_ID` | Votre Phone Number ID | Production, Preview, Development |

5. **Redéployez votre application :**
   - Vercel redéploiera automatiquement
   - Ou cliquez sur **"Redeploy"** manuellement

---

## 🧪 Étape 7 : Tester l'Intégration

### 7.1 Test Local

1. **Démarrer l'application :**
   ```bash
   npm run dev
   ```

2. **Tester l'envoi d'un message :**
   - Connectez-vous à l'application
   - Allez dans **"Paiements"**
   - Créez un nouveau paiement
   - Cochez **"Envoyer confirmation par WhatsApp"**
   - Enregistrez le paiement

3. **Vérifier les logs :**
   - Ouvrez la console du navigateur (F12)
   - Cherchez les messages :
     - ✅ `Message WhatsApp envoyé avec succès`
     - ❌ `Erreur API WhatsApp Business` (si erreur)

4. **Vérifier le téléphone :**
   - Le destinataire devrait recevoir le message WhatsApp
   - Vérifiez que le message est bien formaté

### 7.2 Test avec un Numéro de Test (Sandbox)

1. **Ajouter un numéro de test :**
   - Dans **"API Setup"** → **"To"** (section Sandbox)
   - Cliquez sur **"Manage phone number list"**
   - Ajoutez jusqu'à 5 numéros de test
   - Ces numéros peuvent recevoir des messages en mode Sandbox

2. **Tester avec un numéro de test :**
   - Utilisez un des numéros ajoutés comme contact étudiant
   - Envoyez un message
   - Vérifiez la réception

### 7.3 Test de l'API Directement

Vous pouvez tester l'API directement avec curl :

```bash
curl -X POST "https://graph.facebook.com/v18.0/VOTRE_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "225XXXXXXXXX",
    "type": "text",
    "text": {
      "body": "Test message depuis EMSP Transport"
    }
  }'
```

**Remplacez :**
- `VOTRE_PHONE_NUMBER_ID` : Votre Phone Number ID
- `VOTRE_TOKEN` : Votre token d'accès
- `225XXXXXXXXX` : Le numéro de destination (format international sans +)

---

## 🚀 Étape 8 : Déploiement en Production

### 8.1 Vérifications Pré-déploiement

- [ ] Token d'accès permanent configuré (System User Token)
- [ ] Phone Number ID configuré
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Compte WhatsApp Business vérifié
- [ ] Tests locaux réussis

### 8.2 Déploiement

1. **Pousser le code sur GitHub :**
   ```bash
   git add .
   git commit -m "feat: Configuration WhatsApp Business API"
   git push origin main
   ```

2. **Vercel déploiera automatiquement**

3. **Vérifier le déploiement :**
   - Allez sur votre dashboard Vercel
   - Vérifiez que le déploiement est réussi
   - Vérifiez que les variables d'environnement sont bien chargées

### 8.3 Test en Production

1. **Tester l'envoi d'un message réel**
2. **Vérifier les logs Vercel** pour les erreurs
3. **Monitorer les coûts** dans le dashboard Meta

---

## 🔍 Dépannage

### Problème : "Invalid OAuth access token"

**Solution :**
- Vérifiez que votre token n'a pas expiré
- Générez un nouveau token
- Vérifiez que vous utilisez le bon token (System User Token pour production)

### Problème : "Phone number not registered"

**Solution :**
- Vérifiez que le numéro est bien ajouté dans le Sandbox (mode test)
- Vérifiez que le numéro est au format international sans le `+`
- Pour la production, assurez-vous que le numéro est vérifié

### Problème : "Rate limit exceeded"

**Solution :**
- WhatsApp a des limites de taux
- Attendez quelques minutes avant de réessayer
- Implémentez un système de retry avec backoff exponentiel (déjà fait dans le code)

### Problème : "Message not sent"

**Vérifications :**
1. Vérifiez les logs dans la console
2. Vérifiez que les variables d'environnement sont bien configurées
3. Vérifiez que le token est valide
4. Vérifiez que le Phone Number ID est correct

### Problème : "CORS error"

**Solution :**
- L'API WhatsApp doit être appelée depuis le serveur (backend)
- Pour l'instant, le code appelle l'API depuis le client
- **Recommandation** : Créer une fonction Supabase Edge Function pour appeler l'API

---

## 💰 Coûts et Limites

### Mode Sandbox (Gratuit)

- ✅ 5 numéros de test
- ✅ Messages illimités vers ces numéros
- ✅ Token temporaire (expire rapidement)
- ⚠️ Non utilisable en production

### Mode Production (Payant)

#### Structure de Prix

WhatsApp utilise un système de **conversations** (pas de messages individuels) :

1. **Conversation initiée par l'utilisateur** (24h) : **GRATUIT**
   - L'utilisateur envoie un message
   - Vous pouvez répondre gratuitement pendant 24h

2. **Conversation initiée par vous** : **PAYANT**
   - Vous envoyez le premier message
   - Prix variable selon le pays

#### Exemples de Prix (par conversation)

- **Côte d'Ivoire** : ~0.005 USD par conversation
- **France** : ~0.01 USD par conversation
- **États-Unis** : ~0.005 USD par conversation

#### Limites

- **Rate Limits** : 1000 conversations par jour (par défaut)
- **Message Templates** : Requis pour les messages initiés par vous (hors fenêtre 24h)
- **Opt-in** : Les utilisateurs doivent avoir opté-in pour recevoir des messages

---

## 📚 Ressources Supplémentaires

### Documentation Officielle

- [WhatsApp Business Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

### Guides Utiles

- [Getting Started with WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Webhooks Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)

---

## ✅ Checklist Finale

Avant de considérer la configuration comme terminée :

- [ ] Compte Meta Developer créé et vérifié
- [ ] Application WhatsApp Business créée
- [ ] Token d'accès obtenu (temporaire pour tests, permanent pour production)
- [ ] Phone Number ID noté
- [ ] Numéro de téléphone configuré (Sandbox ou Production)
- [ ] Variables d'environnement configurées (local et Vercel)
- [ ] Tests locaux réussis
- [ ] Tests en production réussis
- [ ] Documentation lue et comprise

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans la console du navigateur
2. **Vérifiez les logs Vercel** pour les erreurs serveur
3. **Consultez la documentation Meta** pour les erreurs API
4. **Contactez le support Meta** si nécessaire

---

**Dernière mise à jour :** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Version du guide :** 1.0.0

