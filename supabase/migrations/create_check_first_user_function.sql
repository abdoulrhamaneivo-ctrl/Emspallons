-- Migration : Fonction pour vérifier si c'est le premier utilisateur (admin)
-- Date : $(date)

CREATE OR REPLACE FUNCTION check_if_first_user()
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permettre l'exécution de cette fonction pour les utilisateurs anonymes
GRANT EXECUTE ON FUNCTION check_if_first_user() TO anon;


