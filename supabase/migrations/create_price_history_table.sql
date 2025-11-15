-- Migration : Créer la table price_history pour l'historique des modifications de prix

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_type TEXT NOT NULL CHECK (price_type IN ('default', 'line', 'niveau')),
  entity_id UUID, -- ID ligne ou niveau (NULL si default)
  old_price INTEGER,
  new_price INTEGER NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour price_history
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_type ON price_history(price_type);
CREATE INDEX IF NOT EXISTS idx_price_history_entity ON price_history(entity_id);

-- RLS Policies pour price_history
DROP POLICY IF EXISTS "Only admins can view price history" ON price_history;
DROP POLICY IF EXISTS "Only admins can create price history" ON price_history;

-- Lecture : Admin uniquement
CREATE POLICY "Only admins can view price history"
  ON price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Écriture : Admin uniquement
CREATE POLICY "Only admins can create price history"
  ON price_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ajouter colonne price dans lines (si n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lines' AND column_name = 'price'
    ) THEN
        ALTER TABLE lines ADD COLUMN price INTEGER;
        RAISE NOTICE 'Colonne price ajoutée à lines';
    END IF;
END $$;

-- Ajouter colonne price dans niveaux (si n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'niveaux' AND column_name = 'price'
    ) THEN
        ALTER TABLE niveaux ADD COLUMN price INTEGER;
        RAISE NOTICE 'Colonne price ajoutée à niveaux';
    END IF;
END $$;

-- Ajouter colonne description dans lines (si n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lines' AND column_name = 'description'
    ) THEN
        ALTER TABLE lines ADD COLUMN description TEXT;
        RAISE NOTICE 'Colonne description ajoutée à lines';
    END IF;
END $$;

-- Ajouter colonnes pricing_by_line et pricing_by_niveau dans settings (si n'existent pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'pricing_by_line'
    ) THEN
        ALTER TABLE settings ADD COLUMN pricing_by_line BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne pricing_by_line ajoutée à settings';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'pricing_by_niveau'
    ) THEN
        ALTER TABLE settings ADD COLUMN pricing_by_niveau BOOLEAN DEFAULT false;
        RAISE NOTICE 'Colonne pricing_by_niveau ajoutée à settings';
    END IF;
END $$;

-- Commentaire sur la table
COMMENT ON TABLE price_history IS 'Historique des modifications de prix (par défaut, par ligne, par niveau)';

