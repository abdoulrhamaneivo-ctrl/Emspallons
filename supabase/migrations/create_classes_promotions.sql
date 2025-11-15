-- Migration : Créer les tables classes et promotions
-- Date : $(date)

-- Table des classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour classes
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(active);
CREATE INDEX IF NOT EXISTS idx_classes_ordre ON classes(ordre);

-- Table des promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  annee TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active);
CREATE INDEX IF NOT EXISTS idx_promotions_annee ON promotions(annee);

-- Insérer les classes par défaut
INSERT INTO classes (nom, ordre, active) VALUES
  ('6ème', 1, true),
  ('5ème', 2, true),
  ('4ème', 3, true),
  ('3ème', 4, true),
  ('Seconde', 5, true),
  ('Première', 6, true),
  ('Terminale', 7, true)
ON CONFLICT (nom) DO NOTHING;

-- Insérer les promotions par défaut
INSERT INTO promotions (annee, active) VALUES
  ('2024', true),
  ('2025', true),
  ('2026', true),
  ('2027', true),
  ('2028', true)
ON CONFLICT (annee) DO NOTHING;

-- Policies pour classes
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON classes;
DROP POLICY IF EXISTS "Only admins can manage classes" ON classes;

CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage classes"
  ON classes FOR ALL
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

-- Policies pour promotions
DROP POLICY IF EXISTS "Promotions are viewable by everyone" ON promotions;
DROP POLICY IF EXISTS "Only admins can manage promotions" ON promotions;

CREATE POLICY "Promotions are viewable by everyone"
  ON promotions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage promotions"
  ON promotions FOR ALL
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

