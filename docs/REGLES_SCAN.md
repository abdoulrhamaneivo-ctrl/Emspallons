# 📋 Règles de Scan QR Code - EMSP Transport

## 🔍 Vue d'ensemble

Le système de scan QR code vérifie plusieurs conditions avant d'autoriser ou refuser l'accès d'un étudiant au transport. Ces règles sont appliquées dans un ordre précis et strict.

---

## ✅ Ordre des Vérifications

### 1️⃣ **Vérification du QR Code** (Priorité absolue)
**Règle :** Le QR code doit être valide et actif

**Vérifications :**
- Le token du QR code existe dans la base de données
- Le statut du QR code est `'active'`
- L'étudiant associé existe

**Action si échec :**
- ❌ **REFUSER** avec message : "❌ QR Code invalide ou révoqué"
- 🚫 Vibration : Pattern `[100ms, 50ms, 100ms]`
- ❌ **NON enregistré** dans `scan_logs`

**Code :**
```javascript
const { data: student, error: studentError } = await supabase
  .from('students')
  .select('*')
  .eq('qr_code_token', qrToken)
  .eq('qr_code_status', 'active')
  .single()

if (studentError || !student) {
  // REFUSER
}
```

---

### 2️⃣ **Vérification des Doublons** (PRIORITÉ 2)
**Règle :** Un étudiant ne peut pas être scanné deux fois dans la même heure par le même contrôleur

**Vérifications :**
- Recherche dans `scan_logs` : scans de l'étudiant par ce contrôleur dans les 60 dernières minutes
- Si un scan récent existe → REFUSER

**Période de blocage :** 60 minutes (1 heure)

**Action si échec :**
- 🚫 **REFUSER** avec statut `DUPLICATE`
- 📱 Message : "🚫 Déjà scanné il y a X min. Prochain scan dans Y min."
- 🚫 Vibration : Pattern `[100ms, 50ms, 100ms]`
- ⚠️ **IMPORTANT : Ne PAS enregistrer dans `scan_logs`** (pour éviter la pollution des logs)

**Code :**
```javascript
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const { data: recentScans } = await supabase
  .from('scan_logs')
  .select('scanned_at')
  .eq('student_id', student.id)
  .eq('controller_id', controller.id)
  .gte('scanned_at', oneHourAgo)
  .order('scanned_at', { ascending: false })
  .limit(1)

if (recentScans && recentScans.length > 0) {
  // REFUSER - DOUBLON
  // NE PAS enregistrer dans scan_logs
}
```

---

### 3️⃣ **Vérification de la Ligne** (PRIORITÉ 3)
**Règle :** L'étudiant doit appartenir à la même ligne que le contrôleur

**Vérifications :**
- `student.ligne_id` === `controller.ligne_id`
- Si différent → REFUSER (mauvaise ligne)

**Action si échec :**
- ❌ **REFUSER** avec statut `WRONG_LINE`
- 📱 Message : "❌ Ligne incorrecte. Étudiant: [Ligne étudiant], Votre ligne: [Ligne contrôleur]"
- 🚫 Vibration : Pattern `[100ms, 50ms, 100ms]`
- ✅ **ENREGISTRÉ** dans `scan_logs` avec raison

**Code :**
```javascript
if (student.ligne_id !== controller.line_id) {
  await supabase.from('scan_logs').insert([{
    student_id: student.id,
    controller_id: controller.id,
    statut: STATUTS_SCAN.WRONG_LINE,
    statut_paiement: student.statut_paiement,
    raison: `Ligne incorrecte. Étudiant: ${studentLine}, Contrôleur: ${controllerLine}`,
  }])
  // REFUSER
}
```

---

### 4️⃣ **Vérification du Statut de Paiement** (PRIORITÉ 4)
**Règle :** Le statut de paiement détermine l'accès final

**Statuts possibles :**

#### ✅ **ACTIF**
- **Accès :** ✅ AUTORISÉ
- **Message :** "✅ Accès autorisé - [Nom étudiant]"
- **Couleur :** Vert (`bg-green-500`)
- **Vibration :** Pattern `[200ms]` (vibration courte)
- **Enregistrement :** ✅ Oui dans `scan_logs` avec statut `APPROVED`

#### ⚠️ **EN_RETARD**
- **Accès :** ✅ AUTORISÉ (avec avertissement)
- **Message :** "⚠️ Accès autorisé - Paiement en retard"
- **Couleur :** Orange/Jaune (`bg-yellow-500`)
- **Vibration :** ❌ Aucune
- **Enregistrement :** ✅ Oui dans `scan_logs` avec statut `APPROVED`

#### ❌ **EXPIRE**
- **Accès :** ❌ REFUSÉ
- **Message :** "❌ Accès refusé - Paiement expiré"
- **Couleur :** Rouge (`bg-red-500`)
- **Vibration :** Pattern `[100ms, 50ms, 100ms]` (double vibration)
- **Enregistrement :** ✅ Oui dans `scan_logs` avec statut `EXPIRED` et raison

#### ℹ️ **HORS_SERVICE**
- **Accès :** ✅ AUTORISÉ
- **Message :** "ℹ️ Accès autorisé - Hors service"
- **Couleur :** Gris (`bg-gray-500`)
- **Vibration :** ❌ Aucune
- **Enregistrement :** ✅ Oui dans `scan_logs` avec statut `APPROVED`

#### ❓ **Statut inconnu**
- **Accès :** ❌ REFUSÉ
- **Message :** "❌ Statut inconnu"
- **Couleur :** Rouge (`bg-red-500`)
- **Vibration :** Pattern `[100ms, 50ms, 100ms]`
- **Enregistrement :** ✅ Oui dans `scan_logs` avec statut `EXPIRED`

**Code :**
```javascript
switch (statutPaiement) {
  case STATUTS_PAIEMENT.ACTIF:
    scanStatus = STATUTS_SCAN.APPROVED
    message = `✅ Accès autorisé - ${student.nom}`
    bgColor = 'bg-green-500'
    vibrationPattern = [200]
    break

  case STATUTS_PAIEMENT.EN_RETARD:
    scanStatus = STATUTS_SCAN.APPROVED
    message = `⚠️ Accès autorisé - Paiement en retard`
    bgColor = 'bg-yellow-500'
    break

  case STATUTS_PAIEMENT.EXPIRE:
    scanStatus = STATUTS_SCAN.EXPIRED
    message = `❌ Accès refusé - Paiement expiré`
    bgColor = 'bg-red-500'
    vibrationPattern = [100, 50, 100]
    break

  case STATUTS_PAIEMENT.HORS_SERVICE:
    scanStatus = STATUTS_SCAN.APPROVED
    message = `ℹ️ Accès autorisé - Hors service`
    bgColor = 'bg-gray-500'
    break

  default:
    scanStatus = STATUTS_SCAN.EXPIRED
    message = `❌ Statut inconnu`
    vibrationPattern = [100, 50, 100]
}
```

---

## 📊 Enregistrement dans scan_logs

### ✅ Cas où on ENREGISTRE :
1. ✅ QR code valide + Doublon OK + Ligne OK + Statut vérifié → **TOUJOURS**
2. ❌ Mauvaise ligne → **OUI** (pour traçabilité)
3. ❌ Statut expiré → **OUI** (pour traçabilité)
4. ❌ Erreur système → **OUI** (pour traçabilité)

### ❌ Cas où on N'ENREGISTRE PAS :
1. 🚫 QR code invalide → **NON**
2. 🚫 Doublon (dans l'heure) → **NON** (éviter la pollution des logs)

---

## 🔄 Flow complet

```
1. Scan QR Code
   ↓
2. QR Code valide ? → NON → REFUSER (non loggé)
   ↓ OUI
3. Doublon dans l'heure ? → OUI → REFUSER (non loggé)
   ↓ NON
4. Même ligne ? → NON → REFUSER (loggé WRONG_LINE)
   ↓ OUI
5. Statut paiement ?
   ├─ ACTIF → ✅ AUTORISER (loggé APPROVED)
   ├─ EN_RETARD → ✅ AUTORISER (loggé APPROVED)
   ├─ EXPIRE → ❌ REFUSER (loggé EXPIRED)
   ├─ HORS_SERVICE → ✅ AUTORISER (loggé APPROVED)
   └─ Inconnu → ❌ REFUSER (loggé EXPIRED)
```

---

## 📱 Feedback Utilisateur

### Vibrations :
- **Succès (ACTIF) :** `[200ms]` - Vibration courte unique
- **Avertissement (EN_RETARD) :** Aucune vibration
- **Refus :** `[100ms, 50ms, 100ms]` - Double vibration d'erreur

### Messages :
- Utilisation d'émojis pour identification rapide :
  - ✅ = Autorisé
  - ⚠️ = Avertissement
  - ❌ = Refusé
  - ℹ️ = Information
  - 🚫 = Doublon

### Couleurs :
- 🟢 Vert = Accès autorisé (ACTIF)
- 🟡 Orange/Jaune = Accès autorisé avec avertissement (EN_RETARD)
- 🔴 Rouge = Accès refusé (EXPIRE)
- ⚫ Gris = Accès autorisé spécial (HORS_SERVICE)

---

## ✅ Vérification de l'Implémentation

### Fichiers concernés :
- ✅ `src/components/scanner/ControllerScanner.jsx` - Logique principale
- ✅ `src/lib/constants.js` - Constantes STATUTS_SCAN et STATUTS_PAIEMENT

### Tests à effectuer :
1. ✅ QR code invalide → Doit refuser
2. ✅ QR code révoqué → Doit refuser
3. ✅ Scan doublon dans l'heure → Doit refuser sans logger
4. ✅ Ligne différente → Doit refuser avec log
5. ✅ Statut ACTIF → Doit autoriser avec log
6. ✅ Statut EN_RETARD → Doit autoriser avec log
7. ✅ Statut EXPIRE → Doit refuser avec log
8. ✅ Statut HORS_SERVICE → Doit autoriser avec log

---

## 📝 Notes importantes

1. **Ordre critique :** Les vérifications doivent être dans cet ordre exact
2. **Doublons :** Ne pas logger les doublons pour éviter la pollution
3. **Ligne :** Toujours vérifier avant le statut paiement (économise des vérifications)
4. **Performance :** Les requêtes sont optimisées (limit(1) pour les doublons)
5. **Sécurité :** Toutes les vérifications sont côté serveur (RLS Supabase)

---

**Dernière mise à jour :** 15 novembre 2025

