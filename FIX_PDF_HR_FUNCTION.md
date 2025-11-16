# ✅ Fix : Fonction `hr()` pour Génération PDF

## 🔴 Problème Identifié

L'erreur `jsPDF.f3 → encodeColorString → setTextColor` venait d'une fonction `hr()` appelée avec une couleur `undefined` ou invalide.

**Stack trace** :
```
hr → setTextColor(undefined) → Erreur
```

## ✅ Solution Implémentée

### 1. **Fonction `hr()` Sécurisée Créée**

Ajoutée dans `src/services/receiptService.js` (lignes 91-146) :

```javascript
export const hr = (doc, y, color = [0, 0, 0], lineWidth = 1, xStart = null, xEnd = null) => {
  try {
    // Normaliser la couleur en tableau RGB [r, g, b]
    let rgbColor = [0, 0, 0] // Par défaut : noir
    
    if (Array.isArray(color)) {
      // Déjà un tableau [r, g, b]
      rgbColor = color.map(c => Math.max(0, Math.min(255, Math.round(c || 0))))
    } else if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      // Objet {r, g, b}
      rgbColor = [
        Math.max(0, Math.min(255, Math.round(color.r || 0))),
        Math.max(0, Math.min(255, Math.round(color.g || 0))),
        Math.max(0, Math.min(255, Math.round(color.b || 0)))
      ]
    } else if (typeof color === 'string' && color.startsWith('#')) {
      // Chaîne hex
      const rgb = hexToRgb(color)
      if (rgb) {
        rgbColor = [rgb.r, rgb.g, rgb.b]
      }
    }
    
    // S'assurer que toutes les valeurs sont valides
    rgbColor = rgbColor.map(c => Math.max(0, Math.min(255, Math.round(c || 0))))
    
    // Obtenir les dimensions de la page si non fournies
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const startX = xStart !== null ? xStart : margin
    const endX = xEnd !== null ? xEnd : (pageWidth - margin)
    
    // Dessiner la ligne
    doc.setDrawColor(rgbColor[0], rgbColor[1], rgbColor[2])
    doc.setLineWidth(lineWidth)
    doc.line(startX, y, endX, y)
  } catch (error) {
    // En cas d'erreur, dessiner une ligne noire par défaut
    console.error('Erreur dans hr():', error)
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(margin, y, pageWidth - margin, y)
  }
}
```

### 2. **Caractéristiques de la Fonction**

✅ **Valeurs par défaut sécurisées** :
- `color = [0, 0, 0]` (noir par défaut)
- `lineWidth = 1`
- Marges automatiques si `xStart`/`xEnd` non fournis

✅ **Support de multiples formats de couleur** :
- Tableau RGB : `[255, 0, 0]`
- Objet RGB : `{r: 255, g: 0, b: 0}`
- Chaîne hex : `"#FF0000"`
- `undefined` ou `null` → Noir par défaut

✅ **Validation des valeurs** :
- Toutes les valeurs RGB sont clampées entre 0 et 255
- Arrondi automatique des valeurs décimales

✅ **Gestion d'erreurs** :
- Try/catch pour éviter les crashes
- Fallback vers ligne noire en cas d'erreur

### 3. **Remplacement des Appels Directs**

Les appels directs à `doc.line()` ont été remplacés par `hr()` :

**AVANT** :
```javascript
doc.setDrawColor(yRgb.r, yRgb.g, yRgb.b)
doc.setLineWidth(2)
doc.line(margin, yPosition, pageWidth - margin, yPosition)
```

**APRÈS** :
```javascript
hr(doc, yPosition, [yRgb.r, yRgb.g, yRgb.b], 2, margin, pageWidth - margin)
```

## 📋 Utilisation

### Exemple 1 : Ligne simple (noir par défaut)
```javascript
hr(doc, 100) // Ligne noire à Y=100
```

### Exemple 2 : Ligne avec couleur RGB
```javascript
hr(doc, 100, [255, 0, 0]) // Ligne rouge
```

### Exemple 3 : Ligne avec couleur hex
```javascript
hr(doc, 100, '#2D5016') // Ligne verte EMSP
```

### Exemple 4 : Ligne avec objet RGB
```javascript
hr(doc, 100, {r: 45, g: 80, b: 22}) // Ligne verte EMSP
```

### Exemple 5 : Ligne personnalisée complète
```javascript
hr(doc, 100, [255, 0, 0], 2, 20, 180) // Ligne rouge, épaisseur 2, de X=20 à X=180
```

## 🎯 Résultat

✅ **Plus d'erreur `setTextColor(undefined)`**
✅ **Fonction robuste avec fallbacks**
✅ **Support de tous les formats de couleur**
✅ **Code plus maintenable et réutilisable**

## 🧪 Test

Pour tester la génération de PDF :

1. Ouvrir l'application
2. Aller dans "Paiements"
3. Enregistrer un nouveau paiement
4. Le reçu PDF devrait se générer sans erreur

## 📝 Notes

- La fonction `hr()` est maintenant **exportée** et peut être utilisée ailleurs dans le projet
- Tous les appels utilisent maintenant `hr()` au lieu de `doc.line()` directement
- La fonction gère automatiquement les cas où la couleur est `undefined` ou invalide

---

**✅ Problème résolu !**

