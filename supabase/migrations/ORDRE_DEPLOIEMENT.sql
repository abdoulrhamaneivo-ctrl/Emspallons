-- ============================================
-- SCRIPT DE DÉPLOIEMENT COMPLET
-- ============================================
-- Ce script liste l'ordre d'exécution des migrations
-- NE PAS EXÉCUTER CE FICHIER DIRECTEMENT
-- Exécutez chaque migration individuellement dans l'ordre
-- ============================================

-- ============================================
-- ÉTAPE 1 : SCHÉMA DE BASE
-- ============================================
-- Fichier : schema.sql
-- Description : Crée toutes les tables, index, triggers de base
-- Durée estimée : 30 secondes
-- ⚠️ CRITIQUE : Doit être exécuté en premier

-- ============================================
-- ÉTAPE 2 : REALTIME
-- ============================================
-- Fichier : enable_realtime.sql
-- Description : Active Realtime sur les tables nécessaires
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 3 : SYSTÈME DE RAPPELS
-- ============================================
-- Fichier : create_reminders_system.sql
-- Description : Crée les tables reminders_config et reminders_history
-- Durée estimée : 10 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 4 : HISTORIQUE DES PRIX
-- ============================================
-- Fichier : create_price_history_table.sql
-- Description : Crée la table price_history pour l'historique des modifications de prix
-- Durée estimée : 10 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 5 : PRÉSENCE UTILISATEUR
-- ============================================
-- Fichier : create_user_presence.sql
-- Description : Crée la table user_presence pour suivre les utilisateurs en ligne
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 6 : VERROUS D'ÉDITION
-- ============================================
-- Fichier : create_editing_locks.sql
-- Description : Crée la table editing_locks pour éviter les conflits d'édition
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 7 : LOGS D'ACTIVITÉ
-- ============================================
-- Fichier : create_activity_logs_table.sql
-- Description : Crée la table activity_logs pour l'audit
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 8 : CLASSES ET NIVEAUX
-- ============================================
-- Fichier : create_classes_promotions.sql
-- Description : Crée les tables classes et niveaux
-- Durée estimée : 10 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 9 : MOTS DE PASSE CONTRÔLEURS
-- ============================================
-- Fichier : add_controller_password.sql
-- Description : Ajoute la colonne password_hash aux contrôleurs
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 10 : RLS SUR TABLES MANQUANTES
-- ============================================
-- Fichier : enable_rls_missing_tables.sql
-- Description : Active RLS sur price_history, reminders_config, reminders_history, user_presence
-- Durée estimée : 10 secondes
-- Dépend de : create_price_history_table.sql, create_reminders_system.sql, create_user_presence.sql

-- ============================================
-- ÉTAPE 11 : CORRECTION RLS PROFILES
-- ============================================
-- Fichier : fix_profiles_rls_policies.sql
-- Description : Corrige les politiques RLS de profiles et user_presence (évite récursion)
-- Durée estimée : 10 secondes
-- Dépend de : schema.sql, create_user_presence.sql

-- ============================================
-- ÉTAPE 12 : CORRECTION RLS SCAN LOGS
-- ============================================
-- Fichier : fix_scan_logs_rls_policies.sql
-- Description : Corrige les politiques RLS de scan_logs pour permettre la lecture publique
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 13 : FONCTION RESET DATABASE
-- ============================================
-- Fichier : create_reset_function.sql
-- Description : Crée les fonctions reset_database_except_admins et create_backup_before_reset
-- Durée estimée : 10 secondes
-- Dépend de : schema.sql

-- ============================================
-- ÉTAPE 14 : AMÉLIORATION CALCUL STATUT
-- ============================================
-- Fichier : update_calculate_payment_status_for_future_sessions.sql
-- Description : Améliore la fonction de calcul du statut pour gérer les sessions futures
-- Durée estimée : 5 secondes
-- Dépend de : schema.sql

-- ============================================
-- MIGRATIONS OPTIONNELLES (Si nécessaire)
-- ============================================

-- Si vous migrez depuis une ancienne version avec "promotions" :
-- rename_promotions_to_niveaux.sql
-- rename_promotions_annee_to_nom.sql

-- Si vous avez besoin de traçabilité des contrôleurs :
-- add_controller_created_by.sql

-- Si vous voulez que les éducateurs puissent gérer les contrôleurs :
-- allow_educators_manage_controllers.sql

-- Si vous avez besoin de vérifier le premier utilisateur :
-- create_check_first_user_function.sql

-- ============================================
-- VÉRIFICATION POST-DÉPLOIEMENT
-- ============================================

-- Vérifier que toutes les tables existent
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables pt 
      WHERE pt.tablename = t.table_name 
      AND pt.schemaname = 'public'
    ) THEN '✅'
    ELSE '❌'
  END as existe
FROM (
  VALUES 
    ('profiles'),
    ('students'),
    ('lines'),
    ('controllers'),
    ('payments'),
    ('scan_logs'),
    ('settings'),
    ('price_history'),
    ('reminders_config'),
    ('reminders_history'),
    ('user_presence'),
    ('editing_locks'),
    ('activity_logs'),
    ('classes'),
    ('niveaux')
) AS t(table_name);

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Activé'
    ELSE '❌ RLS Désactivé'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Vérifier les fonctions importantes
SELECT 
  routine_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = r.routine_name
    ) THEN '✅'
    ELSE '❌'
  END as existe
FROM (
  VALUES 
    ('update_student_payment_status'),
    ('update_student_months_ledger'),
    ('check_if_user_is_admin'),
    ('upsert_user_presence'),
    ('reset_database_except_admins'),
    ('create_backup_before_reset')
) AS r(routine_name);

-- Vérifier les triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Total estimé : ~2-3 minutes pour toutes les migrations
-- ============================================

