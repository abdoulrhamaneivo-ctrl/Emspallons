-- Migration : Créer le système de rappels (historique et configuration)

-- Table pour l'historique des rappels envoyés
CREATE TABLE IF NOT EXISTS reminders_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('manual', 'automatic')),
  recipients_count INTEGER NOT NULL,
  filters JSONB,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb
);

-- Index pour reminders_history
CREATE INDEX IF NOT EXISTS idx_reminders_history_type ON reminders_history(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminders_history_sent_at ON reminders_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_history_sent_by ON reminders_history(sent_by);

-- Table pour la configuration des rappels automatiques
CREATE TABLE IF NOT EXISTS reminders_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- '7_days_before', 'expiration_day', '3_days_after', 'grace_period_end'
  display_name TEXT NOT NULL, -- '7 jours avant expiration', etc.
  delay_days INTEGER NOT NULL, -- Nombre de jours avant/après l'événement
  active BOOLEAN DEFAULT true,
  message_template TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour reminders_config
CREATE INDEX IF NOT EXISTS idx_reminders_config_active ON reminders_config(active);
CREATE INDEX IF NOT EXISTS idx_reminders_config_name ON reminders_config(name);

-- Activer RLS sur reminders_history
ALTER TABLE IF EXISTS reminders_history ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur reminders_config
ALTER TABLE IF EXISTS reminders_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour reminders_history
DROP POLICY IF EXISTS "Admins and educators can view reminders history" ON reminders_history;
DROP POLICY IF EXISTS "Admins and educators can create reminders history" ON reminders_history;

CREATE POLICY "Admins and educators can view reminders history"
  ON reminders_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

CREATE POLICY "Admins and educators can create reminders history"
  ON reminders_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- RLS Policies pour reminders_config
DROP POLICY IF EXISTS "Admins can manage reminders config" ON reminders_config;

CREATE POLICY "Admins can view reminders config"
  ON reminders_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage reminders config"
  ON reminders_config FOR ALL
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

-- Insérer les rappels automatiques par défaut
INSERT INTO reminders_config (name, display_name, delay_days, active, message_template)
VALUES
  ('7_days_before', '7 jours avant expiration', -7, true, 'Bonjour {tuteur},\n\nRappel : L''abonnement transport de {nom_etudiant} {prenom_etudiant} expire dans {jours_restants} jours ({date_expiration}).\n\nMontant à payer : {montant} FCFA\n\nMerci de régulariser votre situation.\n\nÉcole Multinationale Supérieure des Postes d''Abidjan'),
  ('expiration_day', 'Jour d''expiration', 0, true, 'Bonjour {tuteur},\n\nL''abonnement transport de {nom_etudiant} {prenom_etudiant} expire aujourd''hui ({date_expiration}).\n\nMontant à payer : {montant} FCFA\n\nVeuillez régulariser rapidement.\n\nÉcole Multinationale Supérieure des Postes d''Abidjan'),
  ('3_days_after', '3 jours après expiration', 3, true, 'Bonjour {tuteur},\n\nL''abonnement transport de {nom_etudiant} {prenom_etudiant} a expiré depuis 3 jours ({date_expiration}).\n\nMontant à payer : {montant} FCFA\n\nVeuillez régulariser votre situation dans les plus brefs délais.\n\nÉcole Multinationale Supérieure des Postes d''Abidjan'),
  ('grace_period_end', 'Fin période de grâce', 5, true, 'Bonjour {tuteur},\n\nURGENT : La période de grâce pour l''abonnement transport de {nom_etudiant} {prenom_etudiant} se termine aujourd''hui.\n\nMontant à payer : {montant} FCFA\n\nVeuillez régulariser immédiatement pour éviter la suspension du service.\n\nÉcole Multinationale Supérieure des Postes d''Abidjan')
ON CONFLICT (name) DO NOTHING;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reminders_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_reminders_config_updated_at ON reminders_config;
CREATE TRIGGER update_reminders_config_updated_at
  BEFORE UPDATE ON reminders_config
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_config_updated_at();

-- Commentaires
COMMENT ON TABLE reminders_history IS 'Historique de tous les rappels envoyés (automatiques et manuels)';
COMMENT ON TABLE reminders_config IS 'Configuration des rappels automatiques';

