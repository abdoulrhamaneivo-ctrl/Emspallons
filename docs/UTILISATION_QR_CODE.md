# 📱 Utilisation du Code QR sur la Carte Étudiante

## 🎯 Rôle Principal

Le **code QR** sur la carte étudiante sert d'**identifiant unique et sécurisé** pour permettre aux contrôleurs de vérifier rapidement l'accès d'un étudiant au transport scolaire.

---

## 📋 Contenu du QR Code

### Données Encodées

Le QR code contient un **token JSON sécurisé** avec les informations suivantes :

```json
{
  "studentId": "UUID-de-l-etudiant",
  "token": "QR-1234567890-ABC123",
  "generatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Génération du Token

- **Format :** `QR-{timestamp}-{random}`
- **Exemple :** `QR-1734345000000-XYZ789`
- **Caractéristiques :**
  - ✅ Unique pour chaque étudiant
  - ✅ Généré automatiquement lors de la création
  - ✅ Peut être régénéré si nécessaire
  - ✅ Peut être révoqué pour désactiver l'accès

**Fichier :** `src/lib/utils.js:104-106`

---

## 🔍 Utilisation lors du Scan

### 1️⃣ **Identification de l'Étudiant**

Quand un contrôleur scanne le QR code :

1. **Décodage du QR** : Extraction du token
2. **Recherche dans la base** : Trouver l'étudiant avec ce token
3. **Vérification du statut** : QR actif ou révoqué

```javascript
// ControllerScanner.jsx:68-81
const { data: student } = await supabase
  .from('students')
  .select('*')
  .eq('qr_code_token', qrToken)  // Recherche par token
  .eq('qr_code_status', 'active') // Vérifie qu'il est actif
  .single()
```

### 2️⃣ **Vérifications Automatiques**

Une fois l'étudiant identifié, le système vérifie automatiquement :

#### ✅ **QR Code Valide ?**
- Le token existe dans la base
- Le statut est `'active'` (pas révoqué)
- **Si invalide** → Accès refusé

#### ✅ **Pas de Doublon ?**
- Pas de scan récent dans les **60 dernières minutes**
- **Si doublon** → Accès refusé (message avec temps restant)

#### ✅ **Même Ligne ?**
- L'étudiant appartient à la même ligne que le contrôleur
- **Si ligne différente** → Accès refusé

#### ✅ **Paiement à Jour ?**
- Statut de paiement vérifié :
  - **ACTIF** → ✅ Accès autorisé
  - **EN_RETARD** → ⚠️ Accès autorisé (avec avertissement)
  - **EXPIRE** → ❌ Accès refusé
  - **HORS_SERVICE** → ℹ️ Accès autorisé

---

## 🎫 Fonctionnalités de la Carte

### 📄 **Carte Étudiante**

La carte contient :
- **Recto (Face avant) :**
  - Logo EMSP
  - Photo/Initiales de l'étudiant
  - Nom et prénom
  - Classe et niveau
  - Numéro d'étudiant
  - Ligne de car
  - Point de ramassage

- **Verso (Face arrière) :**
  - **Code QR** (élément principal)
  - Instructions de scan
  - Informations supplémentaires
  - Numéro de contact

**Fichier :** `src/components/students/StudentCard.jsx`

---

## 🔐 Sécurité

### Mesures de Sécurité

1. **Token Unique**
   - Chaque étudiant a un token unique
   - Impossible de falsifier sans accès à la base de données

2. **Statut Révocable**
   - Le QR code peut être révoqué à tout moment
   - Un QR révoqué ne fonctionne plus
   - Permet de bloquer l'accès immédiatement

3. **Vérification en Temps Réel**
   - Chaque scan vérifie :
     - Validité du token
     - Statut actif
     - Paiement à jour
     - Doublons

4. **Traçabilité**
   - Tous les scans sont enregistrés dans `scan_logs`
   - Historique complet disponible
   - Traçable par étudiant et contrôleur

---

## 📱 Processus Complet

### Pour l'Étudiant :

1. ✅ Reçoit une carte avec QR code unique
2. ✅ Peut télécharger/imprimer la carte
3. ✅ Présente la carte au contrôleur lors du contrôle

### Pour le Contrôleur :

1. ✅ Ouvre l'application de scan
2. ✅ Scanne le QR code avec la caméra
3. ✅ Système vérifie automatiquement :
   - Identité de l'étudiant
   - Validité du QR code
   - Statut de paiement
   - Ligne de car
4. ✅ Reçoit une réponse immédiate :
   - ✅ Vert = Accès autorisé
   - ⚠️ Orange = Avertissement (en retard)
   - ❌ Rouge = Accès refusé
5. ✅ Le scan est enregistré dans l'historique

---

## 🛡️ Avantages du QR Code

### ✅ **Rapidité**
- Scan en moins d'une seconde
- Pas besoin de saisir manuellement

### ✅ **Sécurité**
- Token unique et sécurisé
- Impossible à falsifier facilement
- Vérification en temps réel

### ✅ **Traçabilité**
- Historique complet des scans
- Identification du contrôleur
- Date et heure précises

### ✅ **Fiabilité**
- Fonctionne hors ligne (avec sync)
- Pas d'erreurs de saisie
- Identification instantanée

### ✅ **Flexibilité**
- Peut être révoqué/régénéré
- Fonctionne sur téléphone/tablette
- Compatible avec toutes les caméras

---

## 🔄 Gestion du QR Code

### Actions Disponibles

#### 📥 **Télécharger**
- Export du QR code en PNG
- Pour impression ou sauvegarde

#### 🖨️ **Imprimer**
- Impression directe de la carte
- Format optimisé pour carte d'étudiant

#### 🔄 **Régénérer**
- Créer un nouveau QR code
- L'ancien est automatiquement révoqué
- **Utile si :** La carte est perdue, volée, ou endommagée

#### 🚫 **Révoquer**
- Désactiver le QR code
- Bloque immédiatement l'accès
- **Utile si :** Suspension, fin d'abonnement, etc.

**Fichier :** `src/components/students/QRCodeDisplay.jsx`

---

## 📊 Exemple d'Utilisation

### Scénario 1 : Scan Réussi

```
1. Contrôleur scanne le QR code
   ↓
2. Système identifie : "Jean Kouassi"
   ↓
3. Vérifications :
   ✅ QR valide et actif
   ✅ Pas de doublon dans l'heure
   ✅ Même ligne (Yopougon)
   ✅ Paiement ACTIF
   ↓
4. Résultat : 
   ✅ "Accès autorisé - Jean Kouassi"
   🟢 Fond vert, vibration courte
   📝 Enregistré dans scan_logs
```

### Scénario 2 : QR Code Révoqué

```
1. Contrôleur scanne le QR code
   ↓
2. Système cherche l'étudiant
   ↓
3. Vérification : QR code révoqué
   ↓
4. Résultat :
   ❌ "QR Code invalide ou révoqué"
   🔴 Fond rouge, vibration double
   🚫 NON enregistré dans scan_logs
```

### Scénario 3 : Doublon

```
1. Contrôleur scanne le QR code
   ↓
2. Système identifie l'étudiant
   ↓
3. Vérification : Déjà scanné il y a 15 minutes
   ↓
4. Résultat :
   🚫 "Déjà scanné il y a 15 min. Prochain scan dans 45 min."
   🔴 Fond rouge, vibration double
   🚫 NON enregistré dans scan_logs (évite la pollution)
```

---

## 💡 Points Importants

### ⚠️ **Sécurité**
- Le QR code ne contient **PAS** de données sensibles (pas de mots de passe, etc.)
- C'est uniquement un **identifiant unique**
- Toutes les vérifications sont faites côté serveur

### 📱 **Compatibilité**
- Fonctionne sur tous les smartphones/tablettes
- Compatible avec toutes les caméras
- Pas besoin de connexion spéciale

### 🔄 **Régénération**
- Si une carte est perdue → Régénérer le QR code
- L'ancien QR devient invalide automatiquement
- Nouvelle carte peut être imprimée

### 🚫 **Révocation**
- Si un étudiant est suspendu → Révoquer le QR code
- L'accès est bloqué immédiatement
- Peut être réactivé en régénérant

---

## 📝 Résumé

Le **code QR sur la carte étudiante** sert à :

1. ✅ **Identifier rapidement** l'étudiant lors du contrôle
2. ✅ **Vérifier automatiquement** le statut de paiement
3. ✅ **Enregistrer les scans** pour la traçabilité
4. ✅ **Bloquer l'accès** si paiement expiré ou QR révoqué
5. ✅ **Éviter les doublons** (blocage 60 minutes)
6. ✅ **Vérifier la ligne** (même ligne que le contrôleur)

**En résumé :** C'est le **passe numérique** qui permet aux contrôleurs de vérifier rapidement et de manière sécurisée si un étudiant peut monter dans le bus.

---

**Fichiers concernés :**
- `src/components/students/StudentCard.jsx` - Affichage de la carte
- `src/components/scanner/ControllerScanner.jsx` - Logique de scan
- `src/lib/utils.js` - Génération du token
- `src/hooks/useStudents.js` - Gestion des QR codes

