# 🚀 GUIDE DE DÉPLOIEMENT - EMSP TRANSPORT SCOLAIRE

**Version :** 1.0.0  
**Date :** 16 novembre 2025

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ Prérequis

- [ ] Compte Supabase créé et projet configuré
- [ ] Node.js 18+ installé
- [ ] Git configuré
- [ ] Accès au projet Supabase (SQL Editor)

---

## 🔧 ÉTAPE 1 : CONFIGURATION LOCALE

### 1.1 Cloner le Projet

```bash
git clone <repository-url>
cd emsp-allons
```

### 1.2 Installer les Dépendances

```bash
npm install
```

### 1.3 Configurer les Variables d'Environnement

Créez le fichier `.env.local` à la racine :

```env
# Variables requises
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Variables optionnelles (pour WhatsApp)
VITE_WHATSAPP_API_URL=https://api.whatsapp.com/send
VITE_WHATSAPP_API_KEY=your-whatsapp-key
VITE_WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

**Où trouver les valeurs :**
- `VITE_SUPABASE_URL` : Dashboard Supabase > Settings > API > Project URL
- `VITE_SUPABASE_ANON_KEY` : Dashboard Supabase > Settings > API > anon public key

### 1.4 Tester en Local

```bash
npm run dev
```

Vérifiez que l'application démarre sans erreur.

---

## 🗄️ ÉTAPE 2 : BASE DE DONNÉES

### 2.1 Accéder au SQL Editor

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**

### 2.2 Appliquer les Migrations dans l'Ordre

**⚠️ IMPORTANT :** Exécutez les migrations dans l'ordre exact suivant :

#### Migration 1 : Schéma de Base

```sql
-- Exécutez le contenu complet de : supabase/schema.sql
```

**Vérification :**
```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### Migration 2 : Realtime

```sql
-- Exécutez : supabase/migrations/enable_realtime.sql
```

#### Migration 3 : Système de Rappels

```sql
-- Exécutez : supabase/migrations/create_reminders_system.sql
```

#### Migration 4 : Historique des Prix

```sql
-- Exécutez : supabase/migrations/create_price_history_table.sql
```

#### Migration 5 : Présence Utilisateur

```sql
-- Exécutez : supabase/migrations/create_user_presence.sql
```

#### Migration 6 : Verrous d'Édition

```sql
-- Exécutez : supabase/migrations/create_editing_locks.sql
```

#### Migration 7 : Logs d'Activité

```sql
-- Exécutez : supabase/migrations/create_activity_logs_table.sql
```

#### Migration 8 : Classes et Niveaux

```sql
-- Exécutez : supabase/migrations/create_classes_promotions.sql
```

#### Migration 9 : Mots de Passe Contrôleurs

```sql
-- Exécutez : supabase/migrations/add_controller_password.sql
```

#### Migration 10 : RLS sur Tables Manquantes

```sql
-- Exécutez : supabase/migrations/enable_rls_missing_tables.sql
```

#### Migration 11 : Correction RLS Profiles

```sql
-- Exécutez : supabase/migrations/fix_profiles_rls_policies.sql
```

#### Migration 12 : Correction RLS Scan Logs

```sql
-- Exécutez : supabase/migrations/fix_scan_logs_rls_policies.sql
```

#### Migration 13 : Fonction Reset Database

```sql
-- Exécutez : supabase/migrations/create_reset_function.sql
```

#### Migration 14 : Amélioration Calcul Statut

```sql
-- Exécutez : supabase/migrations/update_calculate_payment_status_for_future_sessions.sql
```

### 2.3 Vérification Post-Migration

Exécutez ces requêtes pour vérifier :

```sql
-- Vérifier RLS activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Vérifier les triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

**Résultat attendu :**
- ✅ Toutes les tables ont `rowsecurity = true`
- ✅ Toutes les fonctions existent
- ✅ Tous les triggers sont actifs

---

## 🔐 ÉTAPE 3 : CONFIGURATION SUPABASE

### 3.1 Edge Functions (Optionnel)

Si vous utilisez les Edge Functions pour le hash de mot de passe :

1. Allez dans **Edge Functions** dans Supabase Dashboard
2. Créez les fonctions :
   - `hash-password`
   - `verify-password`

**Note :** Si les Edge Functions ne sont pas disponibles, le système utilisera un fallback.

### 3.2 Storage (Optionnel)

Si vous voulez stocker des fichiers (photos étudiants, etc.) :

1. Allez dans **Storage** dans Supabase Dashboard
2. Créez un bucket `student-photos` (ou autre)
3. Configurez les politiques RLS

### 3.3 Vérifier les Politiques RLS

Dans **Authentication > Policies**, vérifiez que toutes les tables ont des politiques :

- ✅ `profiles` - 4 politiques
- ✅ `students` - 2 politiques
- ✅ `lines` - 2 politiques
- ✅ `controllers` - 2 politiques
- ✅ `payments` - 3 politiques
- ✅ `scan_logs` - 2 politiques
- ✅ `settings` - 2 politiques
- ✅ `price_history` - 2 politiques
- ✅ `reminders_config` - 2 politiques
- ✅ `reminders_history` - 2 politiques
- ✅ `user_presence` - 2 politiques

---

## 🏗️ ÉTAPE 4 : BUILD DE PRODUCTION

### 4.1 Build

```bash
npm run build
```

Cela crée le dossier `dist/` avec les fichiers optimisés.

### 4.2 Vérifier le Build

```bash
npm run preview
```

Testez l'application en mode preview.

---

## 🌐 ÉTAPE 5 : DÉPLOIEMENT

### Option A : Vercel (Recommandé)

1. **Installer Vercel CLI** :
```bash
npm i -g vercel
```

2. **Déployer** :
```bash
vercel
```

3. **Configurer les Variables d'Environnement** :
   - Allez dans Vercel Dashboard > Settings > Environment Variables
   - Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

4. **Redéployer** :
```bash
vercel --prod
```

### Option B : Netlify

1. **Installer Netlify CLI** :
```bash
npm i -g netlify-cli
```

2. **Déployer** :
```bash
netlify deploy --prod --dir=dist
```

3. **Configurer les Variables** :
   - Netlify Dashboard > Site settings > Environment variables

### Option C : GitHub Pages

1. **Configurer GitHub Actions** :
   - Créez `.github/workflows/deploy.yml`
   - Configurez les secrets GitHub

2. **Push** :
```bash
git push origin main
```

### Option D : Serveur Propre

1. **Uploader les fichiers** :
   - Uploader tout le contenu de `dist/` sur votre serveur
   - Configurer un serveur web (Nginx, Apache, etc.)

2. **Configurer HTTPS** :
   - Utiliser Let's Encrypt pour SSL

---

## ✅ ÉTAPE 6 : VÉRIFICATIONS POST-DÉPLOIEMENT

### 6.1 Tests Fonctionnels

- [ ] **Connexion Admin** : Se connecter avec un compte admin
- [ ] **Dashboard** : Vérifier que les stats s'affichent
- [ ] **Étudiants** : Créer un étudiant test
- [ ] **Paiements** : Enregistrer un paiement test
- [ ] **Scanner QR** : Scanner un QR code test
- [ ] **Bilan Mensuel** : Générer un bilan
- [ ] **Rappels** : Tester l'envoi de rappels

### 6.2 Tests de Sécurité

- [ ] **RLS** : Vérifier qu'un utilisateur ne peut pas voir les données d'un autre
- [ ] **Routes Protégées** : Vérifier que les routes sont protégées
- [ ] **Contrôleurs** : Vérifier que les contrôleurs ne peuvent accéder qu'au scanner

### 6.3 Tests de Performance

- [ ] **Temps de chargement** : < 3s
- [ ] **Temps de connexion** : < 1s
- [ ] **Scanner QR** : < 500ms

---

## 🔄 ÉTAPE 7 : MAINTENANCE

### 7.1 Sauvegardes

**Supabase** :
- Configurer les sauvegardes automatiques dans Supabase Dashboard
- Fréquence recommandée : Quotidienne

**Application** :
- Versionner le code sur Git
- Taguer les versions importantes

### 7.2 Monitoring

**Recommandé :**
- Sentry pour le tracking d'erreurs
- LogRocket pour le replay utilisateur
- Supabase Dashboard pour les métriques DB

### 7.3 Mises à Jour

**Dépendances** :
```bash
npm outdated
npm update
```

**Migrations** :
- Appliquer les nouvelles migrations dans l'ordre
- Tester en staging avant production

---

## 🆘 DÉPANNAGE

### Problème : Erreur "Variable d'environnement manquante"

**Solution :**
- Vérifier que `.env.local` existe
- Vérifier que les variables sont correctement nommées
- Redémarrer le serveur de développement

### Problème : Erreur RLS "Policy exists RLS disabled"

**Solution :**
- Exécuter `enable_rls_missing_tables.sql`
- Vérifier que RLS est activé : `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

### Problème : Erreur "Column does not exist"

**Solution :**
- Vérifier que toutes les migrations ont été appliquées
- Vérifier l'ordre d'exécution des migrations

### Problème : Scanner QR ne fonctionne pas

**Solution :**
- Vérifier les permissions caméra dans le navigateur
- Vérifier que `html5-qrcode` est installé
- Vérifier la console pour les erreurs

---

## 📞 SUPPORT

En cas de problème :
1. Consulter les logs dans la console navigateur
2. Vérifier les logs Supabase Dashboard
3. Consulter `AUDIT_COMPLET.md` pour les détails techniques

---

**Dernière mise à jour :** 16 novembre 2025

