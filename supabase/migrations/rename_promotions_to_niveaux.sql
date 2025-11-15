-- Migration : Renommer promotions en niveaux
-- Cette migration renomme la table promotions en niveaux
-- et la colonne promotion en niveau dans la table students

-- 1. Renommer la table promotions en niveaux
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
        ALTER TABLE promotions RENAME TO niveaux;
        RAISE NOTICE 'Table promotions renommée en niveaux';
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'niveaux') THEN
            -- Créer la table niveaux si elle n'existe pas
            CREATE TABLE IF NOT EXISTS niveaux (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                nom TEXT UNIQUE NOT NULL,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            RAISE NOTICE 'Table niveaux créée';
        END IF;
    END IF;
END $$;

-- 2. Renommer les index
DROP INDEX IF EXISTS idx_promotions_active;
DROP INDEX IF EXISTS idx_promotions_nom;
DROP INDEX IF EXISTS idx_promotions_annee;

CREATE INDEX IF NOT EXISTS idx_niveaux_active ON niveaux(active);
CREATE INDEX IF NOT EXISTS idx_niveaux_nom ON niveaux(nom);

-- 3. Renommer les contraintes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'niveaux' AND constraint_name = 'promotions_nom_key'
    ) THEN
        ALTER TABLE niveaux RENAME CONSTRAINT promotions_nom_key TO niveaux_nom_key;
        RAISE NOTICE 'Contrainte renommée';
    END IF;
END $$;

-- 4. Renommer la colonne promotion en niveau dans students
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'promotion'
    ) THEN
        ALTER TABLE students RENAME COLUMN promotion TO niveau;
        RAISE NOTICE 'Colonne promotion renommée en niveau dans students';
    END IF;
END $$;

-- 5. Mettre à jour les RLS policies
DROP POLICY IF EXISTS "Promotions are viewable by everyone" ON niveaux;
DROP POLICY IF EXISTS "Only admins can manage promotions" ON niveaux;

CREATE POLICY "Niveaux are viewable by everyone"
  ON niveaux FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage niveaux"
  ON niveaux FOR ALL
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

