-- ============================================
-- TABLE EDITING_LOCKS (Verrous d'édition)
-- ============================================
-- Permet de suivre quels utilisateurs sont en train d'éditer une ressource
-- pour éviter les conflits d'édition simultanée

CREATE TABLE IF NOT EXISTS editing_locks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'student', 'payment', 'controller', etc.
  resource_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_editing_locks_resource ON editing_locks(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_editing_locks_user ON editing_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_editing_locks_started_at ON editing_locks(started_at);

-- Fonction pour nettoyer automatiquement les verrous expirés (> 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_expired_editing_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM editing_locks
  WHERE started_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE editing_locks ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir tous les verrous (pour savoir qui édite quoi)
CREATE POLICY "Users can view all editing locks"
  ON editing_locks FOR SELECT
  USING (true);

-- Les utilisateurs peuvent créer leur propre verrou
CREATE POLICY "Users can create their own editing locks"
  ON editing_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre verrou
CREATE POLICY "Users can delete their own editing locks"
  ON editing_locks FOR DELETE
  USING (auth.uid() = user_id);

-- Les admins peuvent supprimer n'importe quel verrou
CREATE POLICY "Admins can delete any editing locks"
  ON editing_locks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE editing_locks IS 'Verrous d''édition pour éviter les conflits d''édition simultanée';
COMMENT ON COLUMN editing_locks.resource_type IS 'Type de ressource (student, payment, etc.)';
COMMENT ON COLUMN editing_locks.resource_id IS 'ID de la ressource en cours d''édition';
COMMENT ON COLUMN editing_locks.user_id IS 'ID de l''utilisateur qui édite';
COMMENT ON COLUMN editing_locks.started_at IS 'Date/heure de début de l''édition';

