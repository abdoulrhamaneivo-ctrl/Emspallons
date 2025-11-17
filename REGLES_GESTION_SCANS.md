# 📋 Règles de Gestion - Système de Scan QR

## 🎯 Vue d'ensemble

Le système de scan QR permet aux contrôleurs de vérifier l'accès des étudiants au transport scolaire en scannant leur QR code.

---

## 🔄 Processus de Validation (Ordre d'exécution)

### 1️⃣ **Décodage du QR Code**
- **Format accepté** : 
  - Token brut (string)
  - JSON avec `token` : `{"token": "xxx"}`
  - JSON avec `studentId` : `{"studentId": "uuid"}` (recherche du token associé)
- **Action si échec** : ❌ REFUSER - Message "QR Code invalide ou révoqué"
- **Enregistrement** : ❌ NON (pas de log)

---

### 2️⃣ **Recherche de l'Étudiant**
- **Critères** :
  - `qr_code_token` correspond au token décodé
  - `qr_code_status = 'active'` (QR code non révoqué)
- **Champs récupérés** :
  - `id`, `nom`, `prenom`, `classe`
  - `statut_paiement`, `months_ledger`
  - `ligne_id`, `qr_code_status`
  - Relation `lines` (nom, couleur)
- **Action si échec** : ❌ REFUSER - Message "QR Code invalide ou révoqué"
- **Enregistrement** : ❌ NON (pas de log)

---

### 3️⃣ **Vérification des Doublons** ⚠️ PRIORITÉ
- **Fenêtre temporelle** : **1 heure** (60 minutes)
- **Critères** :
  - Même `student_id`
  - Même `controller_id`
  - `scanned_at >= maintenant - 1 heure`
  - **Tous les statuts** (approved, wrong_line, expired) sont pris en compte
- **Recherche** : Premier scan (le plus ancien) dans la fenêtre, **quel que soit son statut**
- **Action si doublon détecté** :
  - ❌ REFUSER
  - Message : `🚫 Déjà scanné à [heure] (il y a X min). Prochain scan dans Y min.`
  - Fond orange (`bg-orange-500`)
  - Vibration : `[100ms, 50ms, 100ms]`
- **Enregistrement** : ❌ **NON** (pas de log pour les doublons)
- **Redémarrage scanner** : Après 3 secondes

**⚠️ IMPORTANT** : 
- Les doublons ne sont **PAS** enregistrés dans `scan_logs` pour éviter la pollution des données.
- La vérification inclut **TOUS les statuts** (même `wrong_line` ou `expired`) pour éviter les tentatives répétées dans l'heure, même si le premier scan était refusé.

---

### 4️⃣ **Vérification de la Ligne**
- **Critère** : `student.ligne_id === controller.line_id`
- **Action si ligne incorrecte** :
  - ❌ REFUSER
  - Message : `❌ Ligne incorrecte. Étudiant: [ligne], Votre ligne: [ligne]`
  - Fond rouge (`bg-red-500`)
  - Vibration : `[100ms, 50ms, 100ms]`
- **Enregistrement** : ✅ **OUI** dans `scan_logs` avec :
  - `statut = 'wrong_line'`
  - `statut_paiement` de l'étudiant
  - `raison` : Détails de la ligne incorrecte
- **Redémarrage scanner** : Après 3 secondes

---

### 5️⃣ **Vérification du Statut de Paiement**

#### 📊 Tableau des Statuts

| Statut | Accès | Message | Fond | Vibration | Enregistrement |
|--------|-------|---------|------|-----------|----------------|
| **ACTIF** | ✅ **AUTORISÉ** | `✅ Accès autorisé - [Nom Prénom]` | Vert (`bg-green-500`) | `[200ms]` | ✅ OUI - `statut = 'approved'` |
| **EN_RETARD** | ✅ **AUTORISÉ** | `⚠️ Accès autorisé - Paiement en retard` | Jaune (`bg-yellow-500`) | ❌ Non | ✅ OUI - `statut = 'approved'` |
| **EXPIRE** | ❌ **REFUSÉ** | `❌ Accès refusé - Paiement expiré` | Rouge (`bg-red-500`) | `[100ms, 50ms, 100ms]` | ✅ OUI - `statut = 'expired'` |
| **HORS_SERVICE** | ✅ **AUTORISÉ** | `ℹ️ Accès autorisé - Hors service` | Gris (`bg-gray-500`) | ❌ Non | ✅ OUI - `statut = 'approved'` |
| **Autre/Inconnu** | ❌ **REFUSÉ** | `❌ Statut inconnu` | Rouge (`bg-red-500`) | `[100ms, 50ms, 100ms]` | ✅ OUI - `statut = 'expired'` |

#### 📝 Détails par Statut

**ACTIF** :
- ✅ Accès autorisé sans restriction
- Message positif avec nom de l'étudiant
- Vibration courte (200ms) pour confirmation

**EN_RETARD** :
- ✅ Accès autorisé (période de grâce)
- ⚠️ Avertissement visuel (fond jaune)
- Pas de vibration (pour ne pas alarmer)

**EXPIRE** :
- ❌ Accès refusé
- Message d'erreur clair
- Vibration d'alerte (double pulsation)

**HORS_SERVICE** :
- ✅ Accès autorisé (ex: mois de pause)
- Message informatif
- Pas de vibration

---

### 6️⃣ **Enregistrement dans scan_logs**

**Champs enregistrés** :
- `student_id` : ID de l'étudiant scanné
- `controller_id` : ID du contrôleur qui a scanné
- `statut` : Statut du scan (`approved`, `expired`, `wrong_line`, `duplicate`)
- `statut_paiement` : Statut de paiement de l'étudiant au moment du scan
- `scanned_at` : Timestamp automatique (NOW())
- `raison` : Message explicatif (si statut ≠ `approved`)

**⚠️ Cas particuliers** :
- **Doublons** : ❌ **NON enregistrés** (pour éviter pollution)
- **Ligne incorrecte** : ✅ Enregistrés avec `statut = 'wrong_line'`
- **Tous les autres** : ✅ Enregistrés avec le statut approprié

---

## 🔄 Redémarrage Automatique du Scanner

- **Après succès/échec** : 5 secondes (temps pour voir le résultat)
- **Après doublon** : 3 secondes
- **Après ligne incorrecte** : 3 secondes
- **Après erreur** : 3 secondes

---

## 🛠️ Fonctionnalités Spéciales

### Réinitialisation des Scans (Reset)
- **Bouton** : Icône `RefreshCcw` dans l'en-tête
- **Action** : Supprime **tous les scans d'aujourd'hui** (depuis 00:00:00) pour le contrôleur actif
- **Utilité** : Permet de rescanner les étudiants sans message de doublon
- **Confirmation** : Oui (dialogue de confirmation avec nombre de scans à supprimer)
- **Portée** : Uniquement les scans du contrôleur connecté effectués aujourd'hui
- **Affichage** : Affiche le nombre de scans qui seront supprimés dans la confirmation

---

## 📊 Statuts de Scan (scan_logs.statut)

| Statut | Description | Quand |
|--------|-------------|-------|
| `approved` | Scan approuvé | Accès autorisé (ACTIF, EN_RETARD, HORS_SERVICE) |
| `expired` | Paiement expiré | Statut EXPIRE ou inconnu |
| `wrong_line` | Mauvaise ligne | Étudiant d'une autre ligne |
| `duplicate` | Doublon | ⚠️ **NON utilisé** (doublons non enregistrés) |

---

## 🔐 Sécurité

1. **QR Code révoqué** : Vérification `qr_code_status = 'active'`
2. **Contrôleur actif** : Vérification `controller.active = true` (dans l'authentification)
3. **Ligne assignée** : Vérification `controller.line_id` (dans l'authentification)
4. **Session** : Stockage dans `sessionStorage` (perdure pendant la session navigateur)

---

## 📱 Expérience Utilisateur

### Vibration
- **Succès (ACTIF)** : 200ms (confirmation)
- **Échec (EXPIRE)** : 100ms, pause 50ms, 100ms (alerte)
- **Doublon** : 100ms, pause 50ms, 100ms (avertissement)
- **Ligne incorrecte** : 100ms, pause 50ms, 100ms (erreur)

### Couleurs
- **Vert** : Accès autorisé (ACTIF)
- **Jaune** : Accès autorisé avec avertissement (EN_RETARD)
- **Orange** : Doublon détecté
- **Rouge** : Accès refusé (EXPIRE, ligne incorrecte, QR invalide)
- **Gris** : Accès autorisé (HORS_SERVICE)

---

## ⚙️ Configuration

### Fenêtre de Doublons
- **Durée** : 60 minutes (1 heure)
- **Modifiable** : Non (hardcodé dans le code)
- **Raison** : Éviter les scans multiples accidentels dans un court laps de temps

### Scanner
- **FPS** : 10 images/seconde
- **Zone de scan** : 300x300 pixels
- **Caméra** : Arrière (`facingMode: 'environment'`)

---

## 🐛 Cas Limites

1. **QR Code invalide** : Message clair, pas de log
2. **Étudiant introuvable** : Message clair, pas de log
3. **Erreur base de données** : Continue le processus (ne bloque pas l'affichage)
4. **Scanner déjà actif** : Vérification avant démarrage
5. **Caméra indisponible** : Message d'erreur explicite

---

## 📈 Statistiques

Les scans sont utilisés pour :
- Historique des contrôles
- Statistiques de présence
- Traçabilité des accès
- Analyse des refus d'accès

---

**✅ Règles de gestion documentées et validées**

