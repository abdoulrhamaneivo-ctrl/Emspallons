# Migrations Supabase

## Installation du schéma

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez le contenu du fichier `schema.sql`
4. Exécutez le script complet

## Structure des tables

### Tables principales
- `profiles` : Utilisateurs de l'application
- `students` : Étudiants avec gestion des paiements
- `lines` : Lignes de bus
- `controllers` : Contrôleurs
- `payments` : Historique des paiements
- `scan_logs` : Historique des scans QR
- `settings` : Paramètres globaux

### Fonctionnalités

1. **Fonction `calculate_payment_status()`** : Calcule automatiquement le statut de paiement
2. **Trigger `calculate_student_payment_status`** : Met à jour automatiquement le statut lors des modifications
3. **Trigger `update_months_ledger_on_payment`** : Met à jour le months_ledger après un paiement
4. **RLS (Row Level Security)** : Sécurité au niveau des lignes pour toutes les tables

## Vérification

Après l'exécution, vérifiez que :
- Toutes les tables sont créées
- Les index sont présents
- Les triggers sont actifs
- Les politiques RLS sont en place

## Données de test

Le schéma inclut des données de test pour les lignes de bus. Supprimez-les en production si nécessaire.

