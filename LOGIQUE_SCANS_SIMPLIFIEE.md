# 📱 Logique des Scans - Documentation

## 🎯 Vue d'ensemble

La logique des scans QR code pour les contrôleurs suit un ordre précis de vérifications.

---

## ✅ Processus de Scan (Ordre d'exécution)

### 1. Décodage du QR Code

**Objectif** : Extraire le token QR depuis les données scannées

**Logique** :
- Si JSON valide → Extraire `token` ou `studentId`
- Si `studentId` seulement → Chercher le token dans la base
- Sinon → Utiliser le texte brut comme token

**Erreur** : Si QR code invalide → ❌ Refusé

---

### 2. Vérification de l'Étudiant

**Objectif** : Vérifier que l'étudiant existe et que son QR code est actif

**Requête** :
```sql
SELECT id, nom, prenom, classe, statut_paiement, months_ledger, ligne_id, qr_code_status
FROM students
WHERE qr_code_token = ? 
AND qr_code_status = 'active'
```

**Erreur** : Si étudiant non trouvé ou QR code révoqué → ❌ Refusé

---

### 3. Vérification des Doublons (PRIORITÉ)

**Objectif** : Éviter les scans multiples du même étudiant par le même contrôleur

**Règle** : Un étudiant ne peut être scanné qu'**une fois par heure** par le même contrôleur

**Vérification** :
```sql
SELECT scanned_at, statut
FROM scan_logs
WHERE student_id = ?
AND controller_id = ?
AND scanned_at >= (NOW() - INTERVAL '1 hour')
ORDER BY scanned_at ASC
LIMIT 1
```

**Si doublon trouvé** :
- ❌ Refusé avec statut `duplicate`
- Message : "🚫 Déjà scanné à [heure] (il y a X min). Prochain scan dans Y min."
- **IMPORTANT** : Ne PAS enregistrer dans `scan_logs`
- Vibration : `[100ms, pause 50ms, 100ms]`
- Scanner redémarre après 3 secondes

---

### 4. Vérification de la Ligne

**Objectif** : S'assurer que l'étudiant est sur la bonne ligne de transport

**Règle** : `student.ligne_id` doit correspondre à `controller.ligne_id`

**Si ligne incorrecte** :
- ❌ Refusé avec statut `wrong_line`
- Message : "❌ Ligne incorrecte. Étudiant: [ligne], Votre ligne: [ligne]"
- **Enregistré** dans `scan_logs` pour traçabilité
- Vibration : `[100ms, pause 50ms, 100ms]`
- Scanner redémarre après 3 secondes

---

### 5. Vérification du Statut de Paiement

**Objectif** : Vérifier si l'étudiant peut monter dans le bus

**Statuts possibles** :

#### ✅ ACTIF
- **Résultat** : Accès autorisé
- **Statut scan** : `approved`
- **Message** : "✅ Accès autorisé - [Nom Prénom]"
- **Couleur** : Vert (`bg-green-500`)
- **Vibration** : `[200ms]` (une vibration longue)

#### ⚠️ EN_RETARD
- **Résultat** : Accès autorisé avec avertissement
- **Statut scan** : `approved`
- **Message** : "⚠️ Accès autorisé - Paiement en retard"
- **Couleur** : Orange (`bg-yellow-500`)
- **Vibration** : Aucune

#### ❌ EXPIRE
- **Résultat** : Accès refusé
- **Statut scan** : `expired`
- **Message** : "❌ Accès refusé - Paiement expiré"
- **Couleur** : Rouge (`bg-red-500`)
- **Vibration** : `[100ms, pause 50ms, 100ms]` (double vibration)

#### ℹ️ HORS_SERVICE
- **Résultat** : Accès autorisé
- **Statut scan** : `approved`
- **Message** : "ℹ️ Accès autorisé - Hors service"
- **Couleur** : Gris (`bg-gray-500`)
- **Vibration** : Aucune

#### ❓ Statut inconnu
- **Résultat** : Accès refusé
- **Statut scan** : `expired`
- **Message** : "❌ Statut inconnu"
- **Couleur** : Rouge (`bg-red-500`)
- **Vibration** : `[100ms, pause 50ms, 100ms]`

---

### 6. Enregistrement dans scan_logs

**Objectif** : Traçabilité de tous les scans

**Enregistrement** :
```javascript
{
  student_id: student.id,
  controller_id: controller.id,
  statut: scanStatus, // 'approved', 'expired', 'wrong_line'
  statut_paiement: student.statut_paiement,
  raison: scanStatus !== 'approved' ? message : null
}
```

**Note** : Les doublons ne sont **PAS** enregistrés (vérifiés avant)

---

### 7. Affichage du Résultat et Redémarrage

**Affichage** :
- Message selon le résultat
- Couleur de fond selon le statut
- Vibration selon le cas

**Redémarrage** :
- Après 5 secondes pour les scans normaux
- Après 3 secondes pour les erreurs/doublons
- Scanner redémarre automatiquement

---

## 🔄 Flux de Décision

```
Scan QR Code
    ↓
1. Décoder QR → Si invalide → ❌ REFUSER
    ↓
2. Trouver étudiant → Si non trouvé → ❌ REFUSER
    ↓
3. Vérifier doublon → Si doublon → ❌ REFUSER (pas d'enregistrement)
    ↓
4. Vérifier ligne → Si incorrecte → ❌ REFUSER (enregistré)
    ↓
5. Vérifier paiement → Selon statut → ✅/❌ RÉSULTAT (enregistré)
    ↓
6. Enregistrer dans scan_logs (sauf doublons)
    ↓
7. Afficher résultat → Redémarrer scanner
```

---

## ⚙️ Configuration

### Délai anti-doublon
- **Période** : 1 heure
- **Règle** : Un étudiant ne peut être scanné qu'une fois par heure par le même contrôleur

### Délais d'affichage
- **Scans normaux** : 5 secondes
- **Erreurs/doublons** : 3 secondes

### Vibrations
- **Succès** : `[200ms]` (longue)
- **Erreur** : `[100ms, pause 50ms, 100ms]` (double)

---

## 📊 Table scan_logs

**Structure** :
```sql
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  controller_id UUID REFERENCES controllers(id),
  statut TEXT CHECK (statut IN ('approved', 'duplicate', 'expired', 'wrong_line')),
  statut_paiement TEXT,
  scanned_at TIMESTAMP DEFAULT NOW(),
  raison TEXT
)
```

**Statuts** :
- `approved` : Scan autorisé
- `duplicate` : Scan en doublon (théoriquement jamais enregistré)
- `expired` : Paiement expiré
- `wrong_line` : Ligne incorrecte

---

## 🎯 Cas d'usage

### Cas 1 : Scan réussi (ACTIF)
1. QR code valide ✅
2. Étudiant trouvé ✅
3. Pas de doublon ✅
4. Ligne correcte ✅
5. Paiement ACTIF ✅
6. → **Accès autorisé** (vert, vibration longue)
7. → Enregistré dans `scan_logs` avec statut `approved`

### Cas 2 : Doublon
1. QR code valide ✅
2. Étudiant trouvé ✅
3. **Doublon détecté** ❌
4. → **Accès refusé** (orange, message doublon)
5. → **NON enregistré** dans `scan_logs`

### Cas 3 : Ligne incorrecte
1. QR code valide ✅
2. Étudiant trouvé ✅
3. Pas de doublon ✅
4. **Ligne incorrecte** ❌
5. → **Accès refusé** (rouge, message ligne)
6. → **Enregistré** dans `scan_logs` avec statut `wrong_line`

### Cas 4 : Paiement expiré
1. QR code valide ✅
2. Étudiant trouvé ✅
3. Pas de doublon ✅
4. Ligne correcte ✅
5. **Paiement EXPIRE** ❌
6. → **Accès refusé** (rouge, vibration double)
7. → **Enregistré** dans `scan_logs` avec statut `expired`

---

## ✅ Résumé

**Vérifications effectuées** :
1. ✅ QR code valide et actif
2. ✅ Étudiant existe
3. ✅ Pas de doublon (1 heure)
4. ✅ Ligne correcte
5. ✅ Paiement valide

**Enregistrements** :
- ✅ Tous les scans sauf les doublons
- ✅ Statut et raison pour traçabilité

**Logique** : Simple, claire, efficace ✅

