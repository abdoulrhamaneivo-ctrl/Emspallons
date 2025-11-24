# 🚀 Guide de Déploiement - EMSP Transport Scolaire

**Date:** $(Get-Date -Format "yyyy-MM-dd")  
**Statut:** ✅ Prêt pour déploiement

---

## ✅ Pré-requis Vérifiés

- [x] Build production réussi
- [x] Aucune erreur de lint
- [x] Erreur `apiClient is not defined` corrigée
- [x] Dépendances installées
- [x] Code poussé sur GitHub

---

## 📋 Déploiement sur Vercel

### Option 1: Déploiement Automatique (Recommandé)

Si votre projet est déjà connecté à Vercel, le déploiement se fait automatiquement à chaque push sur `main`.

**Vérification:**
1. Allez sur [vercel.com](https://vercel.com)
2. Vérifiez que votre projet est connecté
3. Le déploiement devrait être en cours automatiquement

### Option 2: Déploiement Manuel via CLI

```bash
# 1. Installer Vercel CLI (si pas déjà installé)
npm i -g vercel

# 2. Se connecter à Vercel
vercel login

# 3. Déployer en production
vercel --prod
```

### Variables d'Environnement sur Vercel

Assurez-vous que les variables suivantes sont configurées dans Vercel:

1. Allez sur votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

**Important:** 
- Ajoutez ces variables pour **Production**, **Preview**, et **Development**
- Redéployez après avoir ajouté les variables

---

## 🔍 Vérification Post-Déploiement

### Checklist de Vérification

- [ ] L'application se charge sans erreur
- [ ] La page de login s'affiche
- [ ] L'authentification fonctionne
- [ ] Les données se chargent correctement
- [ ] Aucune erreur dans la console du navigateur
- [ ] Le PWA fonctionne (installation possible)

### Tests à Effectuer

1. **Authentification**
   - Se connecter avec un compte valide
   - Vérifier que la session persiste
   - Se déconnecter

2. **Navigation**
   - Naviguer entre les différentes pages
   - Vérifier que les routes fonctionnent

3. **Fonctionnalités Principales**
   - Dashboard: Vérifier les statistiques
   - Étudiants: Liste et création
   - Paiements: Affichage et création
   - Scanner QR: Fonctionnalité de scan

4. **Gestion d'Erreurs**
   - Tester avec une connexion internet coupée
   - Vérifier que l'ErrorBoundary fonctionne
   - Vérifier les notifications réseau

---

## 🐛 En Cas de Problème

### Erreur: "apiClient is not defined"

**Solution:** Vérifiez que le build a bien été effectué avec les dernières modifications:
```bash
npm run build
```

### Erreur: Variables d'environnement manquantes

**Solution:** Vérifiez que toutes les variables sont configurées dans Vercel

### Erreur: Build échoue

**Solution:** 
1. Vérifiez les logs de build sur Vercel
2. Testez le build localement: `npm run build`
3. Vérifiez les erreurs de lint: `npm run lint`

---

## 📊 Monitoring Post-Déploiement

### Vérifications Recommandées

1. **Performance**
   - Temps de chargement initial
   - Temps de réponse des API
   - Taille des bundles

2. **Erreurs**
   - Console du navigateur
   - Logs Vercel
   - ErrorBoundary

3. **Utilisateurs**
   - Tester avec différents navigateurs
   - Tester sur mobile
   - Tester la connexion PWA

---

## ✅ Statut Final

**Build:** ✅ Réussi  
**Linter:** ✅ Aucune erreur  
**Tests:** ✅ Fonctionnel  
**Déploiement:** ✅ Prêt

---

**Dernière mise à jour:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

