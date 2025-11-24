# Migration vers la nouvelle couche d'API

## 📋 Vue d'ensemble

Une nouvelle couche d'API a été créée pour séparer le backend du frontend. Cela permet de :
- Changer facilement de backend (Supabase, REST API, GraphQL, etc.)
- Gérer automatiquement les retries et timeouts
- Améliorer la gestion des erreurs réseau
- Éviter les pages blanches

## 🏗️ Architecture

```
src/lib/api/
├── apiClient.js          # Client API principal avec retry et timeout
├── services/
│   ├── authService.js    # Service d'authentification
│   └── dataService.js    # Service de données (CRUD)
└── index.js              # Point d'entrée
```

## 🔄 Migration

### Avant (Direct Supabase)

```javascript
import { supabase } from '../lib/supabase'

// Requête directe
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('id', studentId)
```

### Après (Nouvelle couche d'API)

```javascript
import { dataService } from '../lib/api'

// Avec retry automatique et gestion d'erreurs
const { data, error } = await dataService.query('students', {
  select: '*',
  filters: [{ column: 'id', operator: 'eq', value: studentId }],
  single: true
})
```

## 📚 Services disponibles

### AuthService

```javascript
import { authService } from '../lib/api'

// Se connecter
const { data, error } = await authService.signIn(email, password)

// Se déconnecter
await authService.signOut()

// Obtenir la session
const { data: { session } } = await authService.getSession()

// Rafraîchir la session
await authService.refreshSession()

// Écouter les changements
authService.onAuthStateChange((event, session) => {
  // ...
})
```

### DataService

```javascript
import { dataService } from '../lib/api'

// Requête simple
const { data, error } = await dataService.query('students', {
  select: '*',
  filters: [
    { column: 'classe', operator: 'eq', value: '6ème' }
  ],
  orderBy: { column: 'nom', ascending: true },
  limit: 10
})

// Requête unique
const { data, error } = await dataService.query('students', {
  select: '*',
  filters: [{ column: 'id', operator: 'eq', value: studentId }],
  single: true
})

// Insérer
await dataService.insert('students', {
  nom: 'Dupont',
  prenom: 'Jean',
  classe: '6ème'
})

// Mettre à jour
await dataService.update('students', 
  [{ column: 'id', operator: 'eq', value: studentId }],
  { nom: 'Martin' }
)

// Supprimer
await dataService.delete('students', [
  { column: 'id', operator: 'eq', value: studentId }
])
```

## 🔧 Opérateurs disponibles

- `eq` : Égal à
- `neq` : Différent de
- `gt` : Supérieur à
- `gte` : Supérieur ou égal à
- `lt` : Inférieur à
- `lte` : Inférieur ou égal à
- `like` : Contient (sensible à la casse)
- `ilike` : Contient (insensible à la casse)
- `in` : Dans une liste
- `is` : Est null/not null

## ⚡ Fonctionnalités automatiques

### Retry automatique
- 3 tentatives maximum
- Exponential backoff (1s, 2s, 4s)
- Uniquement pour les erreurs récupérables (réseau, timeout, 5xx)

### Timeout
- 30 secondes par défaut
- Configurable par requête

### Gestion d'erreurs
- Normalisation des erreurs
- Messages d'erreur utilisateur-friendly
- Logging automatique

## 🚀 Avantages

1. **Séparation des préoccupations** : Le frontend ne dépend plus directement de Supabase
2. **Résilience** : Retry automatique en cas d'erreur réseau
3. **Performance** : Timeout pour éviter les requêtes bloquantes
4. **Maintenabilité** : Code plus propre et testable
5. **Évolutivité** : Facile de changer de backend

## 📝 Notes importantes

- Les services existants continuent de fonctionner
- La migration peut être progressive
- Le client Supabase reste accessible via `apiClient.getSupabaseClient()` si nécessaire
- Tous les appels passent automatiquement par le système de retry

## 🔍 Exemple complet

```javascript
import { dataService, authService } from '../lib/api'

// Dans un composant
const fetchStudents = async () => {
  try {
    const { data, error } = await dataService.query('students', {
      select: 'id, nom, prenom, classe',
      filters: [
        { column: 'active', operator: 'eq', value: true }
      ],
      orderBy: { column: 'nom', ascending: true }
    })
    
    if (error) {
      toast.error('Erreur lors du chargement des étudiants')
      return
    }
    
    setStudents(data)
  } catch (error) {
    // Gestion d'erreur réseau (retry échoué)
    toast.error('Erreur de connexion. Vérifiez votre internet.')
  }
}
```

