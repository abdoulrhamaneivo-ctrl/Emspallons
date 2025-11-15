# 🚀 Déploiement sur Vercel - Guide Complet

## Méthode 1 : Déploiement via Interface Web (Recommandé)

### Étape 1 : Préparer le Repository

1. **Vérifiez que tout est commité et pushé sur GitHub**

```bash
git add .
git commit -m "feat: configuration Vercel"
git push origin main
```

### Étape 2 : Créer un Projet Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** avec votre compte GitHub
3. **Cliquez sur "Add New..." → "Project"**
4. **Importez votre repository** : `abdoulrhamaneivo-ctrl/Emspallons`
5. **Vercel détectera automatiquement** :
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Étape 3 : Configurer les Variables d'Environnement

Dans la section "Environment Variables", ajoutez :

```
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre_cle_anon
VITE_WHATSAPP_API_URL = https://graph.facebook.com/v18.0 (optionnel)
VITE_WHATSAPP_API_KEY = votre_token (optionnel)
VITE_WHATSAPP_PHONE_NUMBER_ID = votre_id (optionnel)
```

**Important** : Sélectionnez "Production", "Preview", et "Development" pour chaque variable.

### Étape 4 : Déployer

1. **Cliquez sur "Deploy"**
2. **Attendez la fin du build** (2-3 minutes)
3. **Votre site est en ligne !** 🎉

Vous recevrez une URL comme : `https://emspallons.vercel.app`

---

## Méthode 2 : Déploiement via CLI

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
```

### Étape 2 : Se connecter

```bash
vercel login
```

### Étape 3 : Déployer

```bash
# Déploiement en preview
vercel

# Déploiement en production
vercel --prod
```

### Étape 4 : Configurer les Variables d'Environnement

```bash
# Ajouter une variable
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_WHATSAPP_API_URL production
vercel env add VITE_WHATSAPP_API_KEY production
vercel env add VITE_WHATSAPP_PHONE_NUMBER_ID production
```

---

## 🔧 Configuration Avancée

### Domain Personnalisé

1. **Allez dans Settings → Domains**
2. **Ajoutez votre domaine** (ex: `transport.emsp.int`)
3. **Suivez les instructions DNS** :
   - Ajoutez un enregistrement CNAME pointant vers `cname.vercel-dns.com`
   - Ou un enregistrement A avec l'IP fournie

### Variables d'Environnement par Environnement

Vous pouvez avoir des variables différentes pour :
- **Production** : Variables de production
- **Preview** : Variables de test
- **Development** : Variables locales

### Analytics (Optionnel)

1. **Allez dans Settings → Analytics**
2. **Activez Vercel Analytics** (gratuit jusqu'à 100k événements/mois)
3. **Suivez les performances** de votre site

---

## ✅ Vérifications Post-Déploiement

### 1. Test de l'Application

- [ ] La page d'accueil se charge
- [ ] Le login fonctionne
- [ ] Le dashboard s'affiche
- [ ] Les routes fonctionnent (pas d'erreur 404)

### 2. Test des Fonctionnalités

- [ ] Création d'étudiant
- [ ] Enregistrement de paiement
- [ ] Scan QR code
- [ ] Génération PDF
- [ ] Envoi WhatsApp (si configuré)

### 3. Test de Performance

- [ ] Temps de chargement < 3 secondes
- [ ] Images optimisées
- [ ] PWA fonctionne

### 4. Test de Sécurité

- [ ] HTTPS activé (automatique sur Vercel)
- [ ] Variables d'environnement non exposées
- [ ] CORS configuré correctement

---

## 🔄 Mises à Jour Automatiques

Vercel déploie automatiquement à chaque push sur `main` :

1. **Faites vos modifications**
2. **Commit et push** :
   ```bash
   git add .
   git commit -m "fix: correction bug"
   git push origin main
   ```
3. **Vercel déploie automatiquement** en quelques minutes

---

## 🐛 Dépannage

### Erreur : "Build Failed"

**Solutions** :
1. Vérifiez les logs de build dans Vercel Dashboard
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### Erreur : "Environment Variable Not Found"

**Solutions** :
1. Vérifiez que les variables sont bien configurées dans Vercel
2. Vérifiez que le préfixe `VITE_` est présent
3. Redéployez après avoir ajouté les variables

### Erreur : "404 Not Found" sur les routes

**Solution** :
Le fichier `vercel.json` avec les rewrites devrait résoudre ce problème. Vérifiez qu'il est bien présent.

### Site lent

**Solutions** :
1. Activez Vercel Analytics pour voir les performances
2. Optimisez les images
3. Utilisez le CDN de Vercel (automatique)

---

## 📊 Monitoring

### Vercel Dashboard

Surveillez dans le dashboard :
- **Deployments** : Historique des déploiements
- **Analytics** : Visiteurs, performance
- **Logs** : Logs en temps réel
- **Functions** : Si vous utilisez des Edge Functions

### Supabase Dashboard

Surveillez aussi dans Supabase :
- Utilisation de la base de données
- Requêtes lentes
- Erreurs API

---

## 🎯 Checklist de Déploiement

- [ ] Repository GitHub à jour
- [ ] Variables d'environnement configurées
- [ ] Build local réussi
- [ ] Projet Vercel créé
- [ ] Déploiement réussi
- [ ] Tests fonctionnels passés
- [ ] Domain personnalisé configuré (optionnel)
- [ ] Analytics activé (optionnel)

---

## 🎉 Félicitations !

Votre application EMSP Transport est maintenant en ligne sur Vercel ! 🚀

**URL de production** : `https://emspallons.vercel.app` (ou votre domaine personnalisé)

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Guide Vite + Vercel](https://vercel.com/guides/deploying-vite-with-vercel)
- [Variables d'environnement Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Besoin d'aide ?** Consultez les logs dans Vercel Dashboard ou ouvrez une issue.

