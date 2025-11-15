# Implémentation de la synchronisation temps réel

Ce document décrit l'implémentation complète de la synchronisation temps réel pour l'application EMSP Transport Scolaire.

## 📦 Composants créés

### Hooks temps réel

#### 1. `useRealtimeStudents`
**Fichier** : `src/hooks/useRealtimeStudents.js`

- Synchronise les étudiants en temps réel
- Notifications toast pour INSERT, UPDATE, DELETE
- Debounce pour éviter le spam de notifications
- Batch des notifications si > 5 en même temps
- Désactive les notifications si utilisateur inactif (> 5 min)

**Utilisation** :
```javascript
import { useRealtimeStudents } from '../hooks/useRealtimeStudents'

const { students, loading } = useRealtimeStudents()
```

#### 2. `useRealtimeScans`
**Fichier** : `src/hooks/useRealtimeScans.js`

- Synchronise les scans en temps réel
- Notifications toast pour chaque nouveau scan
- Mise à jour automatique du compteur de scans
- Messages personnalisés selon le statut (approuvé, doublon, expiré, etc.)

**Utilisation** :
```javascript
import { useRealtimeScans } from '../hooks/useRealtimeScans'

const { scans, loading, scanCount } = useRealtimeScans()
```

#### 3. `useRealtimePayments`
**Fichier** : `src/hooks/useRealtimePayments.js`

- Synchronise les paiements en temps réel
- Calcul automatique des statistiques (total, ce mois, aujourd'hui)
- Notifications toast pour nouveaux paiements
- Mise à jour automatique des stats du dashboard

**Utilisation** :
```javascript
import { useRealtimePayments } from '../hooks/useRealtimePayments'

const { payments, loading, stats } = useRealtimePayments()
```

#### 4. `useUserPresence`
**Fichier** : `src/hooks/useUserPresence.js`

- Suit la présence en ligne des utilisateurs
- Heartbeat automatique toutes les 2 minutes
- Marque comme hors ligne au démontage
- Gère la visibilité de la page (on/off)

**Utilisation** :
```javascript
import { useUserPresence } from '../hooks/useUserPresence'

// Appelé automatiquement dans App.jsx
useUserPresence()
```

### Composants UI

#### 1. `CollaborativeNotificationManager`
**Fichier** : `src/components/ui/CollaborativeNotification.jsx`

- Affiche les notifications collaboratives
- Toast avec avatar utilisateur
- Message : "Jean a ajouté un étudiant"
- Option "Voir" pour naviguer vers la ressource
- Position : top-right
- Durée : 5 secondes
- Max 3 notifications empilées

**Utilisation** :
```javascript
import { CollaborativeNotificationManager } from '../components/ui/CollaborativeNotification'

<CollaborativeNotificationManager />
```

#### 2. `OnlineBadge`
**Fichier** : `src/components/ui/OnlineBadge.jsx`

- Affiche un badge vert si utilisateur en ligne
- Point animé avec effet ping
- Affiche le nom de l'utilisateur (optionnel)
- Affiche l'heure de dernière connexion si hors ligne

**Utilisation** :
```javascript
import { OnlineBadge } from '../components/ui/OnlineBadge'

<OnlineBadge userId={user.id} showName={true} />
```

#### 3. `OnlineUsersList`
**Fichier** : `src/components/ui/OnlineBadge.jsx`

- Liste tous les utilisateurs en ligne
- Mise à jour automatique en temps réel
- Affiche le nom et le statut de chaque utilisateur

**Utilisation** :
```javascript
import { OnlineUsersList } from '../components/ui/OnlineBadge'

<OnlineUsersList />
```

#### 4. `EditingIndicator`
**Fichier** : `src/components/ui/EditingIndicator.jsx`

- Affiche un badge si un autre utilisateur édite une ressource
- Message : "✏️ En cours de modification par Jean"
- Verrouillage optionnel pour empêcher l'édition simultanée

**Utilisation** :
```javascript
import { EditingIndicator, useEditingLock } from '../components/ui/EditingIndicator'

<EditingIndicator resourceType="student" resourceId={student.id} />

// Dans un formulaire d'édition
const { acquireLock, releaseLock, isLocked } = useEditingLock('student', student.id)

useEffect(() => {
  acquireLock()
  return () => releaseLock()
}, [])
```

## 🗄️ Migrations SQL

### 1. `create_user_presence.sql`
**Fichier** : `supabase/migrations/create_user_presence.sql`

- Table `user_presence` pour suivre les utilisateurs en ligne
- Colonnes : `user_id`, `last_seen`, `is_online`
- Index pour requêtes rapides
- Fonction pour nettoyer automatiquement les utilisateurs inactifs (> 5 min)
- RLS policies pour sécurité

### 2. `create_editing_locks.sql`
**Fichier** : `supabase/migrations/create_editing_locks.sql`

- Table `editing_locks` pour les verrous d'édition
- Colonnes : `resource_type`, `resource_id`, `user_id`, `started_at`
- Contrainte UNIQUE sur `(resource_type, resource_id)`
- Fonction pour nettoyer les verrous expirés (> 10 min)
- RLS policies pour sécurité

## 🔄 Intégration dans le Dashboard

Le Dashboard a été mis à jour pour utiliser les hooks temps réel :

```javascript
// Avant
const { students } = useStudents()
const { payments } = usePayments()

// Après
const { students } = useRealtimeStudents()
const { payments, stats } = useRealtimePayments()
const { scanCount } = useRealtimeScans()
```

Les compteurs sont maintenant mis à jour automatiquement avec animation CountUp.

## ⚙️ Configuration Supabase

Voir le fichier `REALTIME_SETUP.md` pour les instructions complètes d'activation de Realtime dans Supabase.

## 🎯 Fonctionnalités

### ✅ Implémenté

- [x] Hook `useRealtimeStudents` avec notifications
- [x] Hook `useRealtimeScans` avec notifications
- [x] Hook `useRealtimePayments` avec notifications
- [x] Hook `useUserPresence` pour badge en ligne
- [x] Notifications collaboratives avec avatar
- [x] Badge "En ligne" avec indicateur vert
- [x] Indicateur "Modification en cours"
- [x] Compteurs animés dans le Dashboard
- [x] Debounce des notifications
- [x] Batch des notifications (> 5)
- [x] Désactivation si utilisateur inactif
- [x] Migrations SQL pour `user_presence` et `editing_locks`

### 📝 À faire manuellement

1. **Activer Realtime dans Supabase** :
   - Aller dans Database → Replication
   - Activer pour : students, payments, scan_logs, controllers, profiles, user_presence, editing_locks

2. **Exécuter les migrations SQL** :
   ```bash
   # Dans Supabase Dashboard → SQL Editor
   # Exécuter :
   # - supabase/migrations/create_user_presence.sql
   # - supabase/migrations/create_editing_locks.sql
   ```

3. **Tester la synchronisation** :
   - Ouvrir l'application dans deux onglets
   - Créer un étudiant dans un onglet
   - Vérifier qu'il apparaît automatiquement dans l'autre onglet
   - Vérifier qu'une notification toast s'affiche

## 🐛 Dépannage

### Les notifications ne s'affichent pas

1. Vérifier que Realtime est activé dans Supabase
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier que les politiques RLS permettent la lecture

### Les compteurs ne se mettent pas à jour

1. Vérifier que les hooks temps réel sont utilisés
2. Vérifier que les abonnements sont actifs (console navigateur)
3. Vérifier que les événements sont bien déclenchés

### Le badge "En ligne" ne fonctionne pas

1. Vérifier que la table `user_presence` existe
2. Vérifier que `useUserPresence()` est appelé dans `App.jsx`
3. Vérifier que Realtime est activé pour `user_presence`

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Hot Toast](https://react-hot-toast.com/)
- [Framer Motion](https://www.framer.com/motion/)

