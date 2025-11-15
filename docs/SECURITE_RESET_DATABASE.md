# ⚠️ Sécurité - Réinitialisation de la Base de Données

## 🔒 Protection Maximale

### Fonctionnalité TRÈS Dangereuse

Cette fonctionnalité permet de **réinitialiser complètement** la base de données. Elle doit être utilisée avec **extrême prudence**.

---

## 🛡️ Mesures de Sécurité Implémentées

### 1. **Contrôle d'Accès**
- ✅ **Seuls les administrateurs** peuvent voir le bouton
- ✅ **Vérification RLS** dans Supabase
- ✅ **Protection de route** avec `ProtectedRoute`

### 2. **Vérifications Préalables**
- ✅ **Au moins 1 admin** doit exister dans la base
- ✅ **Backup automatique** avant réinitialisation
- ✅ **Confirmation textuelle** obligatoire ("RÉINITIALISER TOUT")

### 3. **Protection des Données**
- ✅ **Backup JSON** téléchargé automatiquement
- ✅ **Comptes administrateurs préservés**
- ✅ **Lignes par défaut préservées** (Yopougon, Angré/Bingerville, Abobo)

### 4. **Traçabilité**
- ✅ **Logs détaillés** dans `activity_logs`
- ✅ **Timestamp** de chaque action
- ✅ **Résumé des données supprimées**

---

## 📋 Processus de Réinitialisation

### Étape 1 : Création du Backup
1. L'administrateur clique sur "Réinitialiser tout"
2. **Backup automatique** créé via `create_backup_before_reset()`
3. **Téléchargement automatique** du fichier JSON
4. Le backup contient :
   - Tous les étudiants
   - Tous les paiements
   - Tous les contrôleurs
   - Statistiques complètes

### Étape 2 : Confirmation
1. L'administrateur doit taper exactement : **"RÉINITIALISER TOUT"**
2. Le bouton reste **désactivé** tant que le texte n'est pas exact
3. Impossible de continuer sans cette confirmation

### Étape 3 : Réinitialisation
1. **Vérification** qu'au moins 1 admin existe
2. **Suppression** dans l'ordre respectant les contraintes FK
3. **Préservation** des comptes administrateurs
4. **Recréation** des lignes par défaut
5. **Reset** des paramètres globaux

---

## 🗑️ Données Supprimées

### Tables Nettoyées
- ❌ `scan_logs` - Tous les logs de scan
- ❌ `activity_logs` - Historique (sauf admins)
- ❌ `payments` - Tous les paiements
- ❌ `students` - Tous les étudiants
- ❌ `controllers` - Tous les contrôleurs
- ❌ `classes` - Toutes les classes
- ❌ `niveaux` - Tous les niveaux
- ❌ `price_history` - Historique des prix
- ❌ `reminders_history` - Historique des rappels
- ❌ `reminders_config` - Configuration des rappels
- ❌ `user_presence` - Présence (sauf admins)
- ❌ `editing_locks` - Verrous d'édition
- ❌ `profiles` - Profils non-admins

### Données Préservées
- ✅ **Comptes administrateurs** (`profiles` où `role = 'admin'`)
- ✅ **Lignes par défaut** (Yopougon, Angré/Bingerville, Abobo)
- ✅ **Paramètres globaux** (reset aux valeurs par défaut)

---

## 📝 Migration SQL

### Fichier : `supabase/migrations/create_reset_function.sql`

#### Fonctions Créées

1. **`reset_database_except_admins()`**
   - Réinitialise complètement la base
   - Préserve les admins
   - Retourne un résumé JSON

2. **`create_backup_before_reset()`**
   - Crée un snapshot JSON
   - Contient toutes les données
   - Pour récupération si nécessaire

#### Permissions

- **`SECURITY DEFINER`** : Exécute avec les privilèges du créateur
- **Vérification RLS** : Seuls les admins peuvent exécuter

---

## ⚠️ Checklist Avant Utilisation

### En Développement
- [ ] Tester sur une base de test
- [ ] Vérifier le backup se télécharge
- [ ] Vérifier les admins sont préservés
- [ ] Vérifier les lignes par défaut sont recréées
- [ ] Vérifier les logs sont enregistrés

### En Production
- [ ] **Backup manuel complet** de la base
- [ ] **Sauvegarde externe** du backup JSON
- [ ] **Vérifier** qu'au moins 2 admins existent
- [ ] **Notifier** les autres administrateurs
- [ ] **Planifier** la réinitialisation (hors heures d'utilisation)
- [ ] **Documenter** la raison de la réinitialisation

---

## 🚨 Avertissements

### ⚠️ Irréversible
Une fois la réinitialisation effectuée, **toutes les données sont définitivement supprimées**.

### ⚠️ Impact Utilisateurs
- Tous les étudiants perdent leur compte
- Tous les paiements sont supprimés
- L'historique complet est perdu

### ⚠️ Seulement en Cas de :
- Réinitialisation complète de la plateforme
- Migration vers un nouvel environnement
- Retour à un état initial pour tests
- **PAS** pour corriger des erreurs mineures

---

## 🔧 Utilisation

### Accès
1. Se connecter en tant qu'administrateur
2. Aller dans **Administration** (`/admin`)
3. Scroller jusqu'à **"Zone Dangereuse"**
4. Cliquer sur **"Réinitialiser tout"**

### Processus
1. **Créer le backup** (téléchargement automatique)
2. **Taper la confirmation** : "RÉINITIALISER TOUT"
3. **Valider** la réinitialisation
4. **Attendre** la confirmation
5. **Redirection** automatique vers le dashboard

---

## 📊 Logs et Traçabilité

### Enregistré dans `activity_logs`
```json
{
  "action_type": "DATABASE_RESET",
  "entity_type": "SYSTEM",
  "user_id": "uuid-admin",
  "details": {
    "deleted_counts": {
      "students_deleted": 0,
      "payments_deleted": 0,
      "controllers_deleted": 0,
      "scan_logs_deleted": 0,
      "admins_preserved": 1,
      "timestamp": "2025-11-15T10:30:00Z"
    },
    "backup_created": true,
    "timestamp": "2025-11-15T10:30:00Z"
  }
}
```

### Console Logger
- `INFO` : Création backup
- `WARN` : 🚨 RÉINITIALISATION COMPLÈTE
- `INFO` : Réinitialisation terminée
- `ERROR` : Erreurs éventuelles

---

## ✅ Tests de Sécurité

### À Vérifier Manuellement

1. **Accès Restreint**
   - [ ] Les éducateurs ne voient PAS le bouton
   - [ ] Les contrôleurs ne voient PAS le bouton
   - [ ] Seuls les admins peuvent accéder

2. **Backup**
   - [ ] Le backup se télécharge automatiquement
   - [ ] Le backup contient toutes les données
   - [ ] Le fichier est valide JSON

3. **Confirmation**
   - [ ] Le texte exact est requis
   - [ ] Impossible de valider sans confirmation
   - [ ] Le bouton reste désactivé

4. **Réinitialisation**
   - [ ] Les admins sont préservés
   - [ ] Les lignes par défaut sont recréées
   - [ ] Les autres données sont supprimées
   - [ ] Les logs sont enregistrés

5. **Post-Réinitialisation**
   - [ ] Redirection vers dashboard
   - [ ] Les admins peuvent toujours se connecter
   - [ ] Les lignes par défaut sont disponibles

---

## 🆘 En Cas de Problème

### Erreur : "Aucun administrateur dans la base"
- **Solution** : Créer au moins 1 compte administrateur avant

### Erreur : Fonction RPC non trouvée
- **Solution** : Exécuter la migration SQL dans Supabase

### Erreur : Permission denied
- **Solution** : Vérifier les RLS policies dans Supabase

### Backup Non Téléchargé
- **Solution** : Vérifier les logs de la console
- **Alternative** : Créer un backup manuel via Supabase

---

## 📚 Fichiers Concernés

- `supabase/migrations/create_reset_function.sql` - Migration SQL
- `src/components/admin/ResetDatabaseModal.jsx` - Composant modal
- `src/pages/Admin.jsx` - Page admin avec zone dangereuse
- `src/pages/ResetSuccess.jsx` - Page de confirmation
- `src/App.jsx` - Route protégée

---

**⚠️ UTILISEZ UNIQUEMENT EN CAS D'ABSOLUE NÉCESSITÉ**

**🔒 TOUJOURS CRÉER UN BACKUP COMPLET AVANT UTILISATION**

