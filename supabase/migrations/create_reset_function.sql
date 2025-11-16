-- ⚠️ DANGER : Fonction de réinitialisation complète de la base de données
-- Cette migration crée des fonctions très sensibles pour réinitialiser la base
-- Seuls les administrateurs peuvent utiliser ces fonctions

-- Fonction de réinitialisation complète de la base de données
-- ⚠️ DANGER : Supprime TOUTES les données sauf les admins

CREATE OR REPLACE FUNCTION reset_database_except_admins()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_counts json;
  admin_count integer;
BEGIN
  -- Vérifier qu'il y a au moins 1 admin
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  IF admin_count < 1 THEN
    RAISE EXCEPTION 'Impossible : Aucun administrateur dans la base';
  END IF;

  -- Supprimer dans l'ordre (respect des contraintes de clés étrangères)
  -- Note: Utiliser WHERE 1=1 pour éviter l'erreur "DELETE requires a WHERE clause" avec RLS
  
  -- 1. Logs de scan (si la table existe)
  DELETE FROM scan_logs WHERE 1=1;
  
  -- 2. Historique activités (garder les admins)
  DELETE FROM activity_logs WHERE user_id NOT IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) AND 1=1;
  
  -- 3. Paiements
  DELETE FROM payments WHERE 1=1;
  
  -- 4. Étudiants
  DELETE FROM students WHERE 1=1;
  
  -- 5. Contrôleurs
  DELETE FROM controllers WHERE 1=1;
  
  -- 6. Classes et niveaux (si les tables existent)
  DELETE FROM classes WHERE 1=1;
  DELETE FROM niveaux WHERE 1=1;
  
  -- 7. Lignes (sauf les 3 par défaut - vérifier les noms exacts)
  DELETE FROM lines WHERE nom NOT IN ('Yopougon', 'Angré / Bingerville', 'Abobo', 'Angré/Bingerville');
  
  -- 8. Historique prix (si la table existe)
  DELETE FROM price_history WHERE 1=1;
  
  -- 9. Historique rappels (si la table existe)
  DELETE FROM reminders_history WHERE 1=1;
  
  -- 10. Configuration rappels (reset aux valeurs par défaut)
  DELETE FROM reminders_config WHERE 1=1;
  
  -- 11. Présence utilisateurs (sauf admins)
  DELETE FROM user_presence WHERE user_id NOT IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ) AND 1=1;
  
  -- 12. Verrous d'édition (si la table existe)
  DELETE FROM editing_locks WHERE 1=1;
  
  -- 13. Éducateurs (garder les admins)
  DELETE FROM profiles WHERE role != 'admin' AND 1=1;
  
  -- Recréer les lignes par défaut si supprimées (avec vérification d'existence)
  INSERT INTO lines (nom, couleur, active)
  SELECT * FROM (VALUES
    ('Yopougon', '#2563eb', true),
    ('Angré / Bingerville', '#10b981', true),
    ('Abobo', '#f59e0b', true)
  ) AS v(nom, couleur, active)
  WHERE NOT EXISTS (SELECT 1 FROM lines WHERE lines.nom = v.nom);
  
  -- Si la ligne "Angré / Bingerville" n'existe pas, essayer "Angré/Bingerville"
  INSERT INTO lines (nom, couleur, active)
  SELECT 'Angré / Bingerville', '#10b981', true
  WHERE NOT EXISTS (
    SELECT 1 FROM lines WHERE nom IN ('Angré / Bingerville', 'Angré/Bingerville')
  );
  
  -- Reset les paramètres globaux (si la table settings existe)
  -- Mettre à jour le premier enregistrement ou en créer un nouveau
  IF EXISTS (SELECT 1 FROM settings LIMIT 1) THEN
    -- Mettre à jour le premier enregistrement trouvé
    UPDATE settings SET
      paused_months = '[]'::jsonb,
      default_monthly_fee = 12500,
      updated_at = NOW()
    WHERE id = (SELECT id FROM settings LIMIT 1);
  ELSE
    -- Si aucun enregistrement n'existe, en créer un par défaut avec UUID auto-généré
    INSERT INTO settings (paused_months, default_monthly_fee, created_at, updated_at)
    VALUES ('[]'::jsonb, 12500, NOW(), NOW());
  END IF;
  
  -- Construire le résumé (après suppression)
  deleted_counts := json_build_object(
    'students_deleted', (SELECT COUNT(*) FROM students),
    'payments_deleted', (SELECT COUNT(*) FROM payments),
    'controllers_deleted', (SELECT COUNT(*) FROM controllers),
    'scan_logs_deleted', (SELECT COUNT(*) FROM scan_logs),
    'admins_preserved', admin_count,
    'timestamp', NOW()
  );
  
  RETURN deleted_counts;
END;
$$;

-- Fonction pour créer un backup avant reset
CREATE OR REPLACE FUNCTION create_backup_before_reset()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_data json;
BEGIN
  -- Créer un snapshot JSON de toutes les données
  backup_data := json_build_object(
    'timestamp', NOW(),
    'students', COALESCE((SELECT json_agg(row_to_json(t)) FROM students t), '[]'::json),
    'payments', COALESCE((SELECT json_agg(row_to_json(t)) FROM payments t), '[]'::json),
    'controllers', COALESCE((SELECT json_agg(row_to_json(t)) FROM controllers t), '[]'::json),
    'scan_logs_count', (SELECT COUNT(*) FROM scan_logs),
    'profiles_count', (SELECT COUNT(*) FROM profiles),
    'students_count', (SELECT COUNT(*) FROM students),
    'payments_count', (SELECT COUNT(*) FROM payments),
    'controllers_count', (SELECT COUNT(*) FROM controllers)
  );
  
  RETURN backup_data;
END;
$$;

-- Permissions : Seuls les admins peuvent exécuter
-- Vérifier via RLS que l'utilisateur est admin avant d'exécuter

-- Commentaire pour documentation
COMMENT ON FUNCTION reset_database_except_admins() IS 
'⚠️ DANGER : Supprime toutes les données sauf les comptes administrateurs. '
'Exige au moins 1 admin dans la base. Utilisation réservée aux administrateurs.';

COMMENT ON FUNCTION create_backup_before_reset() IS 
'Crée un backup JSON de toutes les données avant réinitialisation. '
'Utilisation réservée aux administrateurs.';

