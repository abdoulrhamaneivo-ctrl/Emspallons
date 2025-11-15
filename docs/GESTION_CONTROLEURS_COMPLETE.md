# Gestion Complète des Contrôleurs - Documentation

## ✅ Fonctionnalités Implémentées

### 1. Création de Contrôleurs par Éducateurs et Admins

**Fichier:** `src/components/controllers/CreateControllerModal.jsx`

**Fonctionnalités:**
- ✅ Formulaire complet avec validation
- ✅ Nom du contrôleur (requis)
- ✅ Ligne assignée (dropdown depuis Supabase, requis)
- ✅ Code contrôleur format XXXX-XXXX avec formatage automatique
- ✅ Bouton "Générer aléatoirement" pour le code
- ✅ Mot de passe avec génération automatique (recommandé)
- ✅ Saisie manuelle du mot de passe (min 6 caractères)
- ✅ Afficher/masquer mot de passe (icône œil)
- ✅ Modal récapitulatif après création avec :
  - Code contrôleur
  - Mot de passe
  - Ligne assignée
  - Boutons "Copier code" et "Copier mot de passe"
  - Bouton "Envoyer par WhatsApp"
- ✅ Logging dans `activity_logs` avec action `create_controller`
- ✅ Enregistrement du créateur (`created_by`)

### 2. Base de Données

**Migrations:**
- ✅ `supabase/migrations/add_controller_password.sql` - Colonne `password_hash`
- ✅ `supabase/migrations/add_controller_created_by.sql` - Colonne `created_by` et RLS policies

**Structure:**
```sql
controllers (
  id UUID PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  ligne_id UUID REFERENCES lines(id),
  password_hash TEXT, -- Hash bcrypt
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id), -- Créateur
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 3. Edge Functions Supabase

**Fichiers:**
- ✅ `supabase/functions/hash-password/index.ts` - Hash un mot de passe avec bcryptjs
- ✅ `supabase/functions/verify-password/index.ts` - Vérifie un mot de passe contre un hash

**Utilisation:**
```javascript
import { hashPassword, verifyPassword } from '../lib/controllerAuth'

// Hash un mot de passe
const hash = await hashPassword('monMotDePasse')

// Vérifier un mot de passe
const isValid = await verifyPassword('monMotDePasse', hash)
```

### 4. Authentification Contrôleur

**Fichier:** `src/components/scanner/ControllerLogin.jsx`

**Fonctionnalités:**
- ✅ Page `/scan` avec formulaire d'authentification
- ✅ Logo EMSP centré
- ✅ Titre "Accès Contrôleur"
- ✅ Champ code contrôleur (XXXX-XXXX) avec formatage automatique
- ✅ Champ mot de passe
- ✅ Bouton "Se connecter"
- ✅ Vérifications :
  - Code existe dans table controllers
  - Mot de passe correspond (via hash)
  - Contrôleur est actif
  - Contrôleur a une ligne assignée
- ✅ Stockage session dans `sessionStorage` :
```json
{
  "controller_session": {
    "id": "uuid",
    "name": "Kouassi",
    "code": "ABCD-1234",
    "line_id": "uuid",
    "line_name": "Yopougon",
    "line_color": "#7CB342"
  }
}
```

**Fichier:** `src/lib/controllerAuth.js`
- ✅ Fonction `loginController(code, password)` pour l'authentification complète

### 5. Interface Scanner avec Infos Contrôleur

**Fichier:** `src/components/scanner/ControllerScanner.jsx`

**Fonctionnalités:**
- ✅ En-tête avec :
  - Avatar (initiales du nom)
  - Nom contrôleur
  - Badge ligne assignée (avec couleur de la ligne)
  - Bouton "Mon historique"
  - Bouton "Déconnexion" (efface sessionStorage)
- ✅ Scanner QR Code avec html5-qrcode
- ✅ Gestion des scans avec validation :
  - Vérification doublons (1 heure)
  - Vérification ligne
  - Vérification statut paiement
  - Enregistrement dans `scan_logs`
- ✅ Affichage des résultats de scan avec feedback visuel

### 6. Historique Scans Personnel

**Fichier:** `src/pages/ControllerHistory.jsx`

**Fonctionnalités:**
- ✅ Page `/scanner/historique`
- ✅ Affichage SEULEMENT des scans du contrôleur connecté
- ✅ Filtres :
  - Date de début
  - Date de fin
  - Statut (tous, approuvé, refusé, etc.)
- ✅ Compteurs :
  - Scans aujourd'hui
  - Scans cette semaine
  - Taux de réussite (%)
- ✅ Export CSV personnel
- ✅ Synchronisation temps réel avec Supabase Realtime

### 7. Gestion des Permissions

**Fichier:** `src/components/controllers/ControllerManager.jsx`

**Fonctionnalités:**
- ✅ Les créateurs peuvent modifier le mot de passe de leurs contrôleurs
- ✅ Les créateurs peuvent supprimer leurs propres contrôleurs
- ✅ Les admins peuvent modifier/supprimer tous les contrôleurs
- ✅ Bouton "Modifier le mot de passe" (icône clé) visible selon permissions
- ✅ Bouton "Supprimer" visible selon permissions

**Fichier:** `src/components/controllers/ResetControllerPasswordModal.jsx`
- ✅ Modal pour modifier le mot de passe
- ✅ Génération automatique ou saisie manuelle
- ✅ Hash via Edge Function

## 🔧 Configuration Requise

### 1. Migrations SQL

Exécuter dans Supabase Dashboard → SQL Editor :

1. `supabase/migrations/add_controller_password.sql`
2. `supabase/migrations/add_controller_created_by.sql`
3. `supabase/migrations/allow_educators_manage_controllers.sql`

### 2. Edge Functions

Déployer les Edge Functions :

```bash
npx supabase functions deploy hash-password
npx supabase functions deploy verify-password
```

### 3. Variables d'Environnement

Assurez-vous d'avoir dans `.env.local` :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## 📋 Workflow Complet

### Création d'un Contrôleur

1. Admin/Éducateur va dans `/admin/controllers`
2. Clique sur "Nouveau contrôleur"
3. Remplit le formulaire :
   - Nom du contrôleur
   - Sélectionne une ligne
   - Génère ou saisit un code (XXXX-XXXX)
   - Génère ou saisit un mot de passe (min 6 caractères)
4. Clique sur "Créer le contrôleur"
5. Le mot de passe est hashé via Edge Function
6. Le contrôleur est créé avec `created_by` = ID du créateur
7. Modal récapitulatif s'affiche avec code et mot de passe
8. Possibilité de copier ou envoyer par WhatsApp
9. Activité loggée dans `activity_logs`

### Connexion d'un Contrôleur

1. Contrôleur va sur `/scan`
2. Saisit son code (XXXX-XXXX) - formatage automatique
3. Saisit son mot de passe
4. Clique sur "Se connecter"
5. Vérifications :
   - Code existe et contrôleur actif
   - Ligne assignée
   - Mot de passe correct (vérification via Edge Function)
6. Session stockée dans `sessionStorage`
7. Redirection vers interface scanner

### Utilisation du Scanner

1. Contrôleur connecté voit son interface avec :
   - Avatar, nom, badge ligne
   - Boutons "Mon historique" et "Déconnexion"
2. Clique sur "Démarrer le scan"
3. Scanne le QR code d'un étudiant
4. Validations automatiques :
   - Doublon (1 heure)
   - Ligne correcte
   - Statut paiement
5. Résultat affiché avec feedback visuel
6. Enregistrement dans `scan_logs`

### Consultation de l'Historique

1. Contrôleur clique sur "Mon historique"
2. Page `/scanner/historique` affiche :
   - Statistiques (aujourd'hui, semaine, taux réussite)
   - Filtres (date, statut)
   - Liste des scans
3. Possibilité d'exporter en CSV
4. Synchronisation temps réel

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Hash effectué côté serveur (Edge Functions)
- ✅ Jamais de mot de passe en clair dans la base
- ✅ RLS policies pour contrôler l'accès
- ✅ Vérification des permissions pour modification/suppression
- ✅ Session stockée dans `sessionStorage` (non persistante)

## 📝 Notes Importantes

1. **Format Code:** Le format XXXX-XXXX est automatiquement appliqué lors de la saisie
2. **Génération:** Les codes et mots de passe générés sont aléatoires et sécurisés
3. **WhatsApp:** Le bouton "Envoyer par WhatsApp" ouvre WhatsApp Web avec un message pré-rempli
4. **Activity Logs:** Toutes les créations sont loggées avec détails complets
5. **Permissions:** Les éducateurs peuvent créer des contrôleurs mais ne peuvent modifier/supprimer que ceux qu'ils ont créés

## 🐛 Dépannage

### Erreur "bcrypt.genSaltSync is not a function"
- Vérifier que les Edge Functions utilisent `bcryptjs` via `esm.sh`
- Redéployer les fonctions

### Erreur "Could not find relationship between controllers and created_by"
- Appliquer la migration `add_controller_created_by.sql`
- La colonne `created_by` doit exister

### Le modal récapitulatif ne s'affiche pas
- Vérifier que `showSummary` est bien géré dans `CreateControllerModal`
- Vérifier les logs de création dans la console

### Le contrôleur ne peut pas se connecter
- Vérifier que le contrôleur est actif (`active = true`)
- Vérifier qu'une ligne est assignée
- Vérifier que `password_hash` existe
- Vérifier les logs de l'Edge Function `verify-password`


