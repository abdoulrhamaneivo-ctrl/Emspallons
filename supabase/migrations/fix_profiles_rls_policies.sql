-- ============================================
-- MIGRATION : Corriger les politiques RLS pour profiles
-- ============================================
-- Problème : Les politiques RLS actuelles créent une récursion
-- (lecture de profiles pour vérifier le rôle, ce qui nécessite
-- de lire profiles, ce qui vérifie le rôle, etc.)
--
-- Solution : Utiliser directement auth.jwt() pour vérifier le rôle
-- ou permettre la lecture sans vérification de rôle pour son propre profil
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- Politique 1 : Les utilisateurs peuvent toujours voir leur propre profil
-- (nécessaire pour le chargement initial du profil et du rôle)
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique 2 : Les admins peuvent voir tous les profils
-- Utiliser une fonction SECURITY DEFINER pour éviter la récursion RLS
CREATE OR REPLACE FUNCTION check_if_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (check_if_user_is_admin());

-- Politique 3 : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique 4 : Les admins peuvent créer des profils
-- Permettre aussi la création depuis les edge functions (service role)
CREATE POLICY "Admins can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    -- Permettre la création par service role (edge functions)
    auth.role() = 'service_role'
    OR
    -- Permettre la création par un admin authentifié (utiliser la fonction)
    check_if_user_is_admin()
  );

-- ============================================
-- CORRECTION DES POLITIQUES USER_PRESENCE
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own presence" ON user_presence;
DROP POLICY IF EXISTS "Admins can view all presences" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;

-- Politique 1 : Les utilisateurs peuvent voir leur propre présence
CREATE POLICY "Users can view their own presence"
  ON user_presence FOR SELECT
  USING (auth.uid() = user_id);

-- Politique 2 : Les admins peuvent voir toutes les présences
CREATE POLICY "Admins can view all presences"
  ON user_presence FOR SELECT
  USING (check_if_user_is_admin());

-- Politique 3 : Les utilisateurs peuvent mettre à jour leur propre présence
CREATE POLICY "Users can update their own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique 4 : Les utilisateurs peuvent insérer leur propre présence
-- Permettre l'upsert (INSERT ... ON CONFLICT UPDATE)
CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique 5 : Permettre l'upsert (INSERT avec ON CONFLICT)
-- Cette politique permet d'utiliser upsert sans violation RLS
-- (nécessite que l'utilisateur puisse à la fois insérer ET mettre à jour)
-- On utilise une fonction qui combine les deux permissions

-- Comment : La politique INSERT + UPDATE ci-dessus devrait suffire pour upsert
-- Mais on peut aussi créer une fonction sécurisée pour l'upsert
CREATE OR REPLACE FUNCTION upsert_user_presence(
  p_user_id UUID,
  p_is_online BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur modifie sa propre présence
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot update presence for other users';
  END IF;
  
  INSERT INTO user_presence (user_id, last_seen, is_online)
  VALUES (p_user_id, NOW(), p_is_online)
  ON CONFLICT (user_id) DO UPDATE
  SET last_seen = NOW(),
      is_online = p_is_online,
      updated_at = NOW();
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION upsert_user_presence IS 'Fonction sécurisée pour upsert la présence utilisateur (bypass RLS pour éviter les problèmes de permissions)';

