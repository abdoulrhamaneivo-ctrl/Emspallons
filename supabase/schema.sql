-- ============================================
-- SCHÉMA COMPLET EMSP TRANSPORT SCOLAIRE
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE PROFILES (Utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'educator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 2. TABLE LINES (Lignes de bus)
-- ============================================
CREATE TABLE IF NOT EXISTS lines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  couleur TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour lines
CREATE INDEX IF NOT EXISTS idx_lines_active ON lines(active);

-- ============================================
-- 3. TABLE STUDENTS (Étudiants)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT,
  contact TEXT NOT NULL,
  tuteur TEXT,
  ligne_id UUID REFERENCES lines(id) ON DELETE SET NULL,
  point_ramassage TEXT NOT NULL,
  promotion TEXT NOT NULL,
  classe TEXT NOT NULL,
  months_ledger JSONB DEFAULT '[]'::jsonb,
  statut_paiement TEXT,
  qr_code_token TEXT UNIQUE,
  qr_code_status TEXT DEFAULT 'active' CHECK (qr_code_status IN ('active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour students
CREATE INDEX IF NOT EXISTS idx_students_ligne_id ON students(ligne_id);
CREATE INDEX IF NOT EXISTS idx_students_qr_code_token ON students(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_students_qr_code_status ON students(qr_code_status);
CREATE INDEX IF NOT EXISTS idx_students_statut_paiement ON students(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_students_created_by ON students(created_by);
CREATE INDEX IF NOT EXISTS idx_students_contact ON students(contact);
CREATE INDEX IF NOT EXISTS idx_students_months_ledger ON students USING GIN(months_ledger);

-- ============================================
-- 4. TABLE CONTROLLERS (Contrôleurs)
-- ============================================
CREATE TABLE IF NOT EXISTS controllers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  ligne_id UUID REFERENCES lines(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour controllers
CREATE INDEX IF NOT EXISTS idx_controllers_code ON controllers(code);
CREATE INDEX IF NOT EXISTS idx_controllers_ligne_id ON controllers(ligne_id);
CREATE INDEX IF NOT EXISTS idx_controllers_active ON controllers(active);

-- ============================================
-- 5. TABLE PAYMENTS (Paiements)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  montant_total INTEGER NOT NULL,
  nombre_mois INTEGER NOT NULL,
  montant_mensuel INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index pour payments
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_date_debut ON payments(date_debut);
CREATE INDEX IF NOT EXISTS idx_payments_date_fin ON payments(date_fin);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_sessions ON payments USING GIN(sessions);

-- ============================================
-- 6. TABLE SCAN_LOGS (Historique des scans)
-- ============================================
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  controller_id UUID REFERENCES controllers(id) ON DELETE SET NULL,
  statut TEXT NOT NULL CHECK (statut IN ('approved', 'duplicate', 'expired', 'wrong_line')),
  statut_paiement TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raison TEXT
);

-- Index pour scan_logs
CREATE INDEX IF NOT EXISTS idx_scan_logs_student_id ON scan_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_controller_id ON scan_logs(controller_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_statut ON scan_logs(statut);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at_desc ON scan_logs(scanned_at DESC);

-- ============================================
-- 7. TABLE SETTINGS (Paramètres globaux)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  paused_months JSONB DEFAULT '[]'::jsonb,
  default_monthly_fee INTEGER DEFAULT 12500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour settings
CREATE INDEX IF NOT EXISTS idx_settings_paused_months ON settings USING GIN(paused_months);

-- Insérer un enregistrement par défaut pour settings (si aucun n'existe)
INSERT INTO settings (id, paused_months, default_monthly_fee)
SELECT uuid_generate_v4(), '[]'::jsonb, 12500
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le statut de paiement
CREATE OR REPLACE FUNCTION calculate_payment_status(
  p_months_ledger JSONB,
  p_paused_months JSONB DEFAULT '[]'::jsonb
)
RETURNS TEXT AS $$
DECLARE
  current_month TEXT;
  period_grace INTEGER := 5;
  last_paid_month TEXT;
  last_paid_date DATE;
  grace_end_date DATE;
BEGIN
  -- Obtenir le mois actuel au format "YYYY-MM"
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Vérifier si le mois actuel est dans paused_months
  IF p_paused_months ? current_month THEN
    RETURN 'HORS_SERVICE';
  END IF;
  
  -- Vérifier si months_ledger contient le mois actuel
  IF p_months_ledger ? current_month THEN
    RETURN 'ACTIF';
  END IF;
  
  -- Trouver le dernier mois payé dans months_ledger
  -- On suppose que months_ledger est un array de strings ["2024-01", "2024-02"]
  IF jsonb_array_length(p_months_ledger) > 0 THEN
    -- Extraire le dernier élément (le plus récent)
    last_paid_month := (SELECT value::text 
                        FROM jsonb_array_elements_text(p_months_ledger) 
                        ORDER BY value DESC 
                        LIMIT 1);
    
    -- Convertir en date (premier jour du mois suivant)
    last_paid_date := (TO_DATE(last_paid_month || '-01', 'YYYY-MM-DD') + INTERVAL '1 month')::DATE;
    
    -- Calculer la date de fin de période de grâce
    grace_end_date := last_paid_date + (period_grace || ' days')::INTERVAL;
    
    -- Vérifier si on est dans la période de grâce
    IF CURRENT_DATE <= grace_end_date THEN
      RETURN 'EN_RETARD';
    END IF;
  END IF;
  
  -- Sinon, le statut est EXPIRE
  RETURN 'EXPIRE';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le statut_paiement d'un étudiant
CREATE OR REPLACE FUNCTION update_student_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_paused_months JSONB;
  v_new_status TEXT;
BEGIN
  -- Récupérer les paused_months depuis settings
  SELECT paused_months INTO v_paused_months
  FROM settings
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si aucun setting n'existe, utiliser un array vide
  IF v_paused_months IS NULL THEN
    v_paused_months := '[]'::jsonb;
  END IF;
  
  -- Calculer le nouveau statut
  v_new_status := calculate_payment_status(
    COALESCE(NEW.months_ledger, '[]'::jsonb),
    v_paused_months
  );
  
  -- Mettre à jour le statut_paiement
  NEW.statut_paiement := v_new_status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour months_ledger après un paiement
CREATE OR REPLACE FUNCTION update_student_months_ledger()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le months_ledger de l'étudiant avec les nouvelles sessions
  UPDATE students
  SET months_ledger = (
    SELECT jsonb_agg(DISTINCT value ORDER BY value)
    FROM (
      SELECT value FROM jsonb_array_elements_text(students.months_ledger)
      UNION
      SELECT value FROM jsonb_array_elements_text(NEW.sessions)
    ) AS combined
  ),
  updated_at = NOW()
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_controllers_updated_at ON controllers;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS calculate_student_payment_status ON students;
DROP TRIGGER IF EXISTS update_months_ledger_on_payment ON payments;

-- Trigger pour mettre à jour updated_at sur profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur students
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur controllers
CREATE TRIGGER update_controllers_updated_at
  BEFORE UPDATE ON controllers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour updated_at sur settings
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer et mettre à jour statut_paiement sur students
CREATE TRIGGER calculate_student_payment_status
  BEFORE INSERT OR UPDATE OF months_ledger ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_student_payment_status();

-- Trigger pour mettre à jour months_ledger après un paiement
CREATE TRIGGER update_months_ledger_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_student_months_ledger();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - PROFILES
-- ============================================

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les utilisateurs peuvent mettre à jour leur propre profil (email, nom)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Les admins peuvent créer des profils
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- POLICIES - LINES
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Lines are viewable by everyone" ON lines;
DROP POLICY IF EXISTS "Only admins can manage lines" ON lines;

-- Lecture publique
CREATE POLICY "Lines are viewable by everyone"
  ON lines FOR SELECT
  USING (true);

-- Écriture admin uniquement
CREATE POLICY "Only admins can manage lines"
  ON lines FOR ALL
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

-- ============================================
-- POLICIES - STUDENTS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Students are viewable by everyone" ON students;
DROP POLICY IF EXISTS "Authenticated users can manage students" ON students;

-- Lecture publique (pour les contrôleurs)
CREATE POLICY "Students are viewable by everyone"
  ON students FOR SELECT
  USING (true);

-- Écriture authentifiée (admin et educator)
CREATE POLICY "Authenticated users can manage students"
  ON students FOR ALL
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

-- ============================================
-- POLICIES - CONTROLLERS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Controllers are viewable by everyone" ON controllers;
DROP POLICY IF EXISTS "Only admins can manage controllers" ON controllers;

-- Lecture publique
CREATE POLICY "Controllers are viewable by everyone"
  ON controllers FOR SELECT
  USING (true);

-- Écriture admin uniquement
CREATE POLICY "Only admins can manage controllers"
  ON controllers FOR ALL
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

-- ============================================
-- POLICIES - PAYMENTS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Educators can create payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;

-- Lecture authentifiée (admin et educator)
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Écriture éducateurs uniquement
CREATE POLICY "Educators can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- Mise à jour admin et educator
CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
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

-- ============================================
-- POLICIES - SCAN_LOGS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Anyone can create scan logs" ON scan_logs;
DROP POLICY IF EXISTS "Authenticated users can view scan logs" ON scan_logs;

-- Écriture publique (pour les contrôleurs sans auth complète)
CREATE POLICY "Anyone can create scan logs"
  ON scan_logs FOR INSERT
  WITH CHECK (true);

-- Lecture authentifiée
CREATE POLICY "Authenticated users can view scan logs"
  ON scan_logs FOR SELECT
  USING (
    auth.uid() IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'educator')
    )
  );

-- ============================================
-- POLICIES - SETTINGS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Only admins can manage settings" ON settings;

-- Lecture publique
CREATE POLICY "Settings are viewable by everyone"
  ON settings FOR SELECT
  USING (true);

-- Écriture admin uniquement
CREATE POLICY "Only admins can manage settings"
  ON settings FOR ALL
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

-- ============================================
-- VUES UTILES (OPTIONNEL)
-- ============================================

-- Vue pour les étudiants avec leurs informations complètes
CREATE OR REPLACE VIEW students_view AS
SELECT 
  s.id,
  s.nom,
  s.prenom,
  s.contact,
  s.tuteur,
  s.point_ramassage,
  s.promotion,
  s.classe,
  s.months_ledger,
  s.statut_paiement,
  s.qr_code_token,
  s.qr_code_status,
  s.created_at,
  s.updated_at,
  l.nom AS ligne_nom,
  l.couleur AS ligne_couleur,
  p.nom AS created_by_nom
FROM students s
LEFT JOIN lines l ON s.ligne_id = l.id
LEFT JOIN profiles p ON s.created_by = p.id;

-- Vue pour les statistiques de paiement
CREATE OR REPLACE VIEW payment_stats_view AS
SELECT 
  statut_paiement,
  COUNT(*) as nombre_etudiants,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM students), 0), 2) as pourcentage
FROM students
GROUP BY statut_paiement;

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL - À SUPPRIMER EN PRODUCTION)
-- ============================================

-- Insérer quelques lignes de bus par défaut
INSERT INTO lines (nom, couleur, active) VALUES
  ('Yopougon', '#FDB913', true),
  ('Angré/Bingerville', '#2D5016', true),
  ('Abobo', '#7CB342', true)
ON CONFLICT (nom) DO NOTHING;

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
