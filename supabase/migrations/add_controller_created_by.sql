-- Ajouter la colonne created_by à la table controllers
ALTER TABLE controllers 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_controllers_created_by ON controllers(created_by);

-- Mettre à jour les RLS policies pour permettre aux créateurs de modifier/supprimer leurs contrôleurs
DROP POLICY IF EXISTS "Admins and educators can manage controllers" ON controllers;
DROP POLICY IF EXISTS "Creators can manage their controllers" ON controllers;

-- Policy pour les admins et éducateurs (création et lecture)
CREATE POLICY "Admins and educators can manage controllers"
  ON controllers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Policy pour permettre aux créateurs de modifier leurs propres contrôleurs
CREATE POLICY "Creators can update their controllers"
  ON controllers FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy pour permettre aux créateurs de supprimer leurs propres contrôleurs
-- Mais seulement les admins peuvent supprimer n'importe quel contrôleur
CREATE POLICY "Creators can delete their controllers"
  ON controllers FOR DELETE
  USING (
    -- Les admins peuvent supprimer n'importe quel contrôleur
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Les créateurs peuvent supprimer leurs propres contrôleurs
    created_by = auth.uid()
  );


