-- Migration : Ajouter password_hash à la table controllers
-- Date : $(date)

-- Ajouter la colonne password_hash si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'controllers' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE controllers 
    ADD COLUMN password_hash TEXT;
    
    -- Commentaire
    COMMENT ON COLUMN controllers.password_hash IS 'Hash bcrypt du mot de passe du contrôleur';
  END IF;
END $$;

