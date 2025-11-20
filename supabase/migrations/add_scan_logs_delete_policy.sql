-- MIGRATION : Ajouter policy DELETE pour scan_logs
-- Permet aux contrôleurs de supprimer leurs propres scans pour la réinitialisation

-- Ajouter la policy DELETE pour scan_logs
-- IMPORTANT : Permettre aux contrôleurs de supprimer leurs propres scans
-- Vérifie que le controller_id existe dans la table controllers et est actif
CREATE POLICY IF NOT EXISTS "Controllers can delete their own scans"
  ON scan_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM controllers
      WHERE controllers.id = scan_logs.controller_id
      AND controllers.active = true
    )
  );

-- Vérifier que la policy a été créée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'scan_logs'
    AND policyname = 'Controllers can delete their own scans'
  ) THEN
    RAISE EXCEPTION 'Policy "Controllers can delete their own scans" n''a pas été créée';
  ELSE
    RAISE NOTICE 'Policy "Controllers can delete their own scans" créée avec succès';
  END IF;
END $$;

