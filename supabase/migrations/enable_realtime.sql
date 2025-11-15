-- ============================================
-- ACTIVATION REALTIME POUR TOUTES LES TABLES
-- ============================================
-- Ce script active Realtime (synchronisation temps réel) pour toutes les tables
-- nécessaires à l'application EMSP Transport Scolaire.
-- 
-- IMPORTANT : Realtime est différent de "Replication" (ETL) qui est payant.
-- Realtime fonctionne sur le plan gratuit de Supabase.

-- Vérifier et créer la publication si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
    RAISE NOTICE 'Publication supabase_realtime créée';
  ELSE
    RAISE NOTICE 'Publication supabase_realtime existe déjà';
  END IF;
END $$;

-- Activer Realtime pour la table students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'students'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE students;
    RAISE NOTICE 'Table students ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table students déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    RAISE NOTICE 'Table payments ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table payments déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table scan_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'scan_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE scan_logs;
    RAISE NOTICE 'Table scan_logs ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table scan_logs déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table controllers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'controllers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE controllers;
    RAISE NOTICE 'Table controllers ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table controllers déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    RAISE NOTICE 'Table profiles ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table profiles déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table user_presence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
    RAISE NOTICE 'Table user_presence ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table user_presence déjà dans Realtime';
  END IF;
END $$;

-- Activer Realtime pour la table editing_locks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'editing_locks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE editing_locks;
    RAISE NOTICE 'Table editing_locks ajoutée à Realtime';
  ELSE
    RAISE NOTICE 'Table editing_locks déjà dans Realtime';
  END IF;
END $$;

-- Afficher toutes les tables activées pour Realtime
SELECT 
  schemaname,
  tablename,
  '✅ Activé' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Commentaires
COMMENT ON PUBLICATION supabase_realtime IS 'Publication Realtime pour synchronisation temps réel des données EMSP';

