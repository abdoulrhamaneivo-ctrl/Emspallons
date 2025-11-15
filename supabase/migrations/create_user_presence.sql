-- ============================================
-- TABLE USER_PRESENCE (Présence utilisateurs)
-- ============================================
-- Permet de suivre quels utilisateurs sont en ligne
-- et quand ils ont été vus pour la dernière fois

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();

-- Fonction pour marquer automatiquement comme hors ligne après 5 minutes d'inactivité
CREATE OR REPLACE FUNCTION check_user_presence_timeout()
RETURNS void AS $$
BEGIN
  UPDATE user_presence
  SET is_online = false
  WHERE is_online = true
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre présence
CREATE POLICY "Users can view their own presence"
  ON user_presence FOR SELECT
  USING (auth.uid() = user_id);

-- Les admins peuvent voir toutes les présences
CREATE POLICY "Admins can view all presences"
  ON user_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les utilisateurs peuvent mettre à jour leur propre présence
CREATE POLICY "Users can update their own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leur propre présence
CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE user_presence IS 'Suivi de la présence en ligne des utilisateurs';
COMMENT ON COLUMN user_presence.user_id IS 'ID de l''utilisateur (référence profiles)';
COMMENT ON COLUMN user_presence.last_seen IS 'Dernière fois que l''utilisateur a été vu';
COMMENT ON COLUMN user_presence.is_online IS 'Indique si l''utilisateur est actuellement en ligne';

