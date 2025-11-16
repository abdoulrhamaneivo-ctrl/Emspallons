# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - EMSP TRANSPORT

## 📋 Étape par Étape

### 1. Connexion à Vercel

```bash
vercel login
```

Cette commande va :
- Ouvrir votre navigateur
- Vous demander de vous connecter à votre compte Vercel (ou GitHub)
- Autoriser l'application

### 2. Configuration du Projet

```bash
vercel
```

Répondez aux questions :
- **Set up and deploy?** → `Yes`
- **Which scope?** → Sélectionnez votre compte
- **Link to existing project?** → `No` (pour la première fois) ou `Yes` (si vous avez déjà un projet)
- **What's your project's name?** → `emsp-transport` (ou le nom de votre choix)
- **In which directory is your code located?** → `./` (par défaut)

### 3. Configuration des Variables d'Environnement

Après le premier déploiement, configurez les variables :

```bash
vercel env add VITE_SUPABASE_URL
# Entrez la valeur : https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Entrez la valeur : your-anon-key
```

Ou via le Dashboard Vercel :
1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
5. Sélectionnez "Production", "Preview" et "Development"
6. Cliquez sur "Save"

### 4. Déploiement en Production

```bash
vercel --prod
```

### 5. Vérification

Après le déploiement, Vercel vous donnera une URL comme :
```
https://emsp-transport.vercel.app
```

Testez l'application sur cette URL.

---

## 🔄 Mises à Jour Futures

Pour mettre à jour l'application :

```bash
npm run build
vercel --prod
```

Ou simplement push sur Git si vous avez connecté votre repository :

```bash
git add .
git commit -m "Update"
git push
```

Vercel déploiera automatiquement.

---

## ⚙️ Configuration Alternative : vercel.json

Si vous voulez une configuration plus avancée, créez `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

---

## 📝 Notes Importantes

1. **Variables d'environnement** : Assurez-vous qu'elles sont configurées AVANT le déploiement
2. **Build** : Le build est automatique avec Vercel
3. **HTTPS** : Activé automatiquement par Vercel
4. **Custom Domain** : Vous pouvez ajouter votre propre domaine dans Settings → Domains

---

## 🆘 Dépannage

### Erreur : "The specified token is not valid"
**Solution :** Exécutez `vercel login`

### Erreur : "Build failed"
**Solution :** Vérifiez les logs dans Vercel Dashboard → Deployments → Cliquez sur le déploiement

### Variables d'environnement non prises en compte
**Solution :** 
1. Vérifiez que les variables sont bien ajoutées
2. Redéployez : `vercel --prod`
3. Ou dans Vercel Dashboard : Settings → Environment Variables → Redéployer

---

**Dernière mise à jour :** 16 novembre 2025

