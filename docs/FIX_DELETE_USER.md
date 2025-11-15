# 🔧 Correction Erreur Suppression Éducateur

## 🔴 Problème Identifié

Erreur `FunctionsHttpError: Edge Function returned a non-2xx status code` lors de la suppression d'un éducateur.

## ✅ Corrections Appliquées

### 1. AdminUsers.jsx - Gestion d'Erreur Améliorée

**Avant :**
```javascript
catch (error) {
  toast.error('Erreur lors de la suppression')
  console.error(error)
}
```

**Après :**
```javascript
catch (error) {
  console.error('Delete error:', error)
  const errorMessage = error.message || error.error || 'Erreur lors de la suppression'
  toast.error(errorMessage) // Affiche maintenant le message d'erreur exact
}
```

### 2. delete-user Edge Function - Gestion du Profil Manquant

**Avant :**
```typescript
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single()

if (profile?.role === 'admin') {
  // Erreur si profil n'existe pas
}
```

**Après :**
```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single()

if (profileError) {
  // Si le profil n'existe pas, on peut quand même essayer de supprimer l'utilisateur auth
  console.warn('Profile not found, attempting to delete auth user:', profileError)
} else if (profile?.role === 'admin') {
  // Empêcher la suppression d'un admin
}
```

## 🚀 Déploiement

La fonction `delete-user` a été redéployée avec les corrections.

## 🧪 Test

1. **Allez dans `/admin/users`**
2. **Essayez de supprimer un éducateur**
3. **Vérifiez la console** (F12) pour voir le message d'erreur exact si ça échoue
4. **Le toast affichera maintenant le message d'erreur exact** au lieu d'un message générique

## 🔍 Diagnostic

Si l'erreur persiste, vérifiez dans la console du navigateur (F12) :
- Le message d'erreur exact
- Les détails de l'erreur dans `console.error('Delete error:', error)`

Les causes possibles :
1. L'utilisateur n'existe pas dans auth.users
2. Problème de permissions
3. L'utilisateur a des données liées (étudiants, paiements, etc.) qui empêchent la suppression

---

**La gestion d'erreur est maintenant améliorée pour afficher le message exact !** ✅


