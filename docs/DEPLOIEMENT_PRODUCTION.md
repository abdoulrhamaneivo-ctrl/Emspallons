# 🚀 Guide de Déploiement en Production - EMSP Transport

Ce guide vous explique comment déployer la plateforme EMSP Transport en production.

## 📋 Prérequis

1. ✅ Compte Supabase (gratuit ou payant)
2. ✅ Compte GitHub
3. ✅ Compte de déploiement (Vercel, Netlify, ou autre)
4. ✅ Variables d'environnement configurées

---

## 🎯 Étape 1 : Préparer le Projet

### 1.1 Vérifier le Build

```bash
# Installer les dépendances
npm install

# Tester le build
npm run build

# Vérifier qu'il n'y a pas d'erreurs
```

### 1.2 Vérifier les Variables d'Environnement

Créez un fichier `.env.production` avec :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY=votre_token_whatsapp
VITE_WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
```

---

## 🌐 Étape 2 : Déployer sur Vercel (Recommandé)

### 2.1 Créer un Projet Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez votre compte GitHub**
3. **Importez votre repository**
4. **Configurez le projet** :
   - Framework Preset: **Vite**
   - Root Directory: `.` (racine)
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.2 Configurer les Variables d'Environnement

Dans Vercel → Settings → Environment Variables :

```
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre_cle_anon
VITE_WHATSAPP_API_URL = https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY = votre_token_whatsapp
VITE_WHATSAPP_PHONE_NUMBER_ID = votre_phone_number_id
```

### 2.3 Déployer

1. **Cliquez sur "Deploy"**
2. **Attendez la fin du déploiement**
3. **Votre site est en ligne !**

---

## 🌐 Étape 3 : Déployer sur Netlify

### 3.1 Créer un Projet Netlify

1. **Allez sur [netlify.com](https://netlify.com)**
2. **Connectez votre compte GitHub**
3. **Importez votre repository**
4. **Configurez le build** :
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3.2 Configurer les Variables d'Environnement

Dans Netlify → Site settings → Environment variables :

```
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre_cle_anon
VITE_WHATSAPP_API_URL = https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY = votre_token_whatsapp
VITE_WHATSAPP_PHONE_NUMBER_ID = votre_phone_number_id
```

### 3.3 Déployer

1. **Cliquez sur "Deploy site"**
2. **Attendez la fin du déploiement**
3. **Votre site est en ligne !**

---

## 🗄️ Étape 4 : Configurer Supabase

### 4.1 Migrations

1. **Allez dans Supabase Dashboard → SQL Editor**
2. **Exécutez les migrations dans l'ordre** :
   - `supabase/schema.sql`
   - Toutes les migrations dans `supabase/migrations/`

### 4.2 Row Level Security (RLS)

Les politiques RLS sont déjà définies dans `schema.sql`. Vérifiez qu'elles sont actives :

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 4.3 Edge Functions (Optionnel)

Si vous utilisez des Edge Functions :

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Déployer les functions
supabase functions deploy
```

---

## 📱 Étape 5 : Configurer WhatsApp Business

Voir le guide complet : `docs/GUIDE_WHATSAPP_BUSINESS.md`

1. **Créer une application Meta**
2. **Obtenir le token d'accès**
3. **Configurer le numéro de téléphone**
4. **Ajouter les variables d'environnement**

---

## ✅ Étape 6 : Vérifications Post-Déploiement

### 6.1 Tests Fonctionnels

- [ ] Connexion utilisateur fonctionne
- [ ] Création d'étudiant fonctionne
- [ ] Enregistrement de paiement fonctionne
- [ ] Scan QR code fonctionne
- [ ] Génération de reçu PDF fonctionne
- [ ] Envoi WhatsApp fonctionne (si configuré)

### 6.2 Tests de Performance

- [ ] Temps de chargement < 3 secondes
- [ ] Images optimisées
- [ ] PWA fonctionne (installation possible)

### 6.3 Tests de Sécurité

- [ ] Variables d'environnement non exposées
- [ ] RLS activé sur toutes les tables
- [ ] HTTPS activé
- [ ] CORS configuré correctement

---

## 🔧 Configuration Avancée

### Custom Domain (Vercel)

1. **Allez dans Settings → Domains**
2. **Ajoutez votre domaine**
3. **Suivez les instructions DNS**

### Custom Domain (Netlify)

1. **Allez dans Domain settings**
2. **Ajoutez votre domaine**
3. **Configurez les DNS**

### Analytics (Optionnel)

Ajoutez Google Analytics ou autre :

```html
<!-- Dans index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## 🐛 Dépannage

### Erreur : "Failed to fetch"

**Solution :**
- Vérifiez que `VITE_SUPABASE_URL` est correct
- Vérifiez les CORS dans Supabase Dashboard

### Erreur : "Invalid API key"

**Solution :**
- Vérifiez que `VITE_SUPABASE_ANON_KEY` est correct
- Régénérez la clé dans Supabase si nécessaire

### Erreur : "Build failed"

**Solution :**
- Vérifiez les logs de build
- Vérifiez que toutes les dépendances sont installées
- Vérifiez qu'il n'y a pas d'erreurs de syntaxe

---

## 📊 Monitoring

### Vercel Analytics

Activez Vercel Analytics dans le dashboard pour suivre :
- Visiteurs
- Performance
- Erreurs

### Supabase Dashboard

Surveillez dans Supabase :
- Utilisation de la base de données
- Requêtes lentes
- Erreurs API

---

## 🔄 Mises à Jour

### Déploiement Automatique

Avec Vercel/Netlify, chaque push sur `main` déclenche un déploiement automatique.

### Déploiement Manuel

```bash
# Faire un commit
git add .
git commit -m "Mise à jour"
git push origin main

# Le déploiement se fait automatiquement
```

---

## 📝 Checklist de Déploiement

- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Supabase migrations exécutées
- [ ] RLS activé et testé
- [ ] WhatsApp configuré (si nécessaire)
- [ ] Tests fonctionnels passés
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Analytics activé (optionnel)
- [ ] Documentation à jour

---

## 🎉 Félicitations !

Votre plateforme EMSP Transport est maintenant en production ! 🚀

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Netlify](https://docs.netlify.com)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vite](https://vitejs.dev)

---

**Besoin d'aide ?** Consultez les autres guides dans le dossier `docs/`.

