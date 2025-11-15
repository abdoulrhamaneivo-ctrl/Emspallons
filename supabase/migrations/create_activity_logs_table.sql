-- Migration : Créer la table activity_logs pour la traçabilité complète
-- Seuls les admins peuvent voir cet historique

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- 'student', 'payment', 'controller', 'user', 'class', 'promotion', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);

-- RLS Policies pour activity_logs
-- Seuls les admins peuvent voir les logs
DROP POLICY IF EXISTS "Only admins can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;

-- Lecture : Admin uniquement
CREATE POLICY "Only admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Écriture : Tous les utilisateurs authentifiés peuvent créer des logs
CREATE POLICY "Authenticated users can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Commentaire sur la table
COMMENT ON TABLE activity_logs IS 'Journal d''audit de toutes les actions sur la plateforme. Accès admin uniquement.';

