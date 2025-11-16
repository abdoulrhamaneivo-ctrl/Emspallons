-- ============================================
-- MIGRATION : Activer RLS sur les tables manquantes
-- ============================================
-- Cette migration active Row Level Security (RLS) sur les tables
-- qui ont des politiques mais RLS n'est pas activé :
-- - price_history
-- - reminders_config
-- - reminders_history
-- 
-- Note: profiles a déjà des politiques, mais RLS doit être réactivé
-- ============================================

-- Activer RLS sur price_history
ALTER TABLE IF EXISTS price_history ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur reminders_config
ALTER TABLE IF EXISTS reminders_config ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur reminders_history
ALTER TABLE IF EXISTS reminders_history ENABLE ROW LEVEL SECURITY;

-- Réactiver RLS sur profiles (au cas où il serait désactivé)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRÉER DES POLITIQUES PAR DÉFAUT SI ELLES N'EXISTENT PAS
-- ============================================

-- Politiques pour price_history
-- Seuls les admins et éducateurs peuvent voir l'historique des prix
DROP POLICY IF EXISTS "Authenticated users can view price history" ON price_history;
CREATE POLICY "Authenticated users can view price history"
  ON price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Seuls les admins peuvent insérer/modifier l'historique des prix
DROP POLICY IF EXISTS "Admins can manage price history" ON price_history;
CREATE POLICY "Admins can manage price history"
  ON price_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politiques pour reminders_config
-- Les admins et éducateurs peuvent voir la configuration des rappels
DROP POLICY IF EXISTS "Authenticated users can view reminders config" ON reminders_config;
CREATE POLICY "Authenticated users can view reminders config"
  ON reminders_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Seuls les admins peuvent modifier la configuration des rappels
DROP POLICY IF EXISTS "Admins can manage reminders config" ON reminders_config;
CREATE POLICY "Admins can manage reminders config"
  ON reminders_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politiques pour reminders_history
-- Les admins et éducateurs peuvent voir l'historique des rappels
DROP POLICY IF EXISTS "Authenticated users can view reminders history" ON reminders_history;
CREATE POLICY "Authenticated users can view reminders history"
  ON reminders_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Les admins et éducateurs peuvent insérer dans l'historique des rappels
DROP POLICY IF EXISTS "Authenticated users can insert reminders history" ON reminders_history;
CREATE POLICY "Authenticated users can insert reminders history"
  ON reminders_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Seuls les admins peuvent modifier/supprimer l'historique des rappels
DROP POLICY IF EXISTS "Admins can manage reminders history" ON reminders_history;
CREATE POLICY "Admins can manage reminders history"
  ON reminders_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete reminders history" ON reminders_history;
CREATE POLICY "Admins can delete reminders history"
  ON reminders_history FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

