-- ============================================
-- Migration: add_controllers_whatsapp.sql
-- Objet: Ajouter la colonne WhatsApp aux contrôleurs
-- Sécurité: Idempotent (IF NOT EXISTS)
-- ============================================

-- 1) Ajouter la colonne 'whatsapp' (type TEXT)
ALTER TABLE controllers
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2) Index sur la colonne 'whatsapp' (recherches/tri)
CREATE INDEX IF NOT EXISTS idx_controllers_whatsapp
ON controllers(whatsapp);

-- 3) Contrainte simple pour éviter des valeurs vides non-numériques
--    (laisse la validation stricte au frontend)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'controllers_whatsapp_not_empty'
  ) THEN
    ALTER TABLE controllers
    ADD CONSTRAINT controllers_whatsapp_not_empty
    CHECK (whatsapp IS NULL OR length(regexp_replace(whatsapp, '\\D', '', 'g')) >= 8);
  END IF;
END$$;

-- 4) Mettre à jour la colonne updated_at si elle existe (optionnel)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'controllers'
      AND column_name = 'updated_at'
  ) THEN
    UPDATE controllers
    SET updated_at = NOW()
    WHERE TRUE;
  END IF;
END$$;

-- ============================================
-- FIN DE MIGRATION
-- ============================================