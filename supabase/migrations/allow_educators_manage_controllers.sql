-- Migration : Permettre aux éducateurs de gérer les contrôleurs

-- Supprimer la policy existante
DROP POLICY IF EXISTS "Only admins can manage controllers" ON controllers;

-- Nouvelle policy : Admin et éducateurs peuvent gérer les contrôleurs
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


