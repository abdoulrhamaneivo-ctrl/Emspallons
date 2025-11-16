-- Migration : Fonction pour gérer les mois hors service et décaler automatiquement les abonnements
-- Cette fonction est appelée quand un mois est marqué hors service

-- Fonction pour décaler les abonnements quand un mois est marqué hors service
-- SECURITY DEFINER permet d'exécuter la fonction avec les privilèges du propriétaire
CREATE OR REPLACE FUNCTION shift_subscriptions_for_paused_month(paused_month TEXT)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  affected_students INTEGER := 0;
  affected_payments INTEGER := 0;
  updated_students JSONB := '[]'::jsonb;
  updated_payments JSONB := '[]'::jsonb;
  student_record RECORD;
  payment_record RECORD;
  updated_sessions JSONB;
  student_month TEXT;
BEGIN
  -- 1. Mettre à jour tous les étudiants qui ont ce mois dans leur months_ledger
  -- Retirer le mois hors service de leur months_ledger
  FOR student_record IN 
    SELECT id, months_ledger 
    FROM students 
    WHERE months_ledger ? paused_month
  LOOP
    -- Retirer le mois hors service du months_ledger
    updated_sessions := (
      SELECT jsonb_agg(value ORDER BY value)
      FROM jsonb_array_elements_text(student_record.months_ledger) AS value
      WHERE value::text != paused_month
    );
    
    -- Mettre à jour l'étudiant (le trigger calculera automatiquement le statut)
    UPDATE students
    SET 
      months_ledger = COALESCE(updated_sessions, '[]'::jsonb),
      updated_at = NOW()
    WHERE id = student_record.id;
    
    affected_students := affected_students + 1;
    updated_students := updated_students || jsonb_build_object('student_id', student_record.id, 'updated', true);
  END LOOP;

  -- Forcer le recalcul des statuts pour tous les étudiants affectés
  -- Le trigger BEFORE UPDATE sur students recalcule automatiquement le statut_paiement
  -- en incluant les paused_months actuels

  -- 2. Mettre à jour tous les paiements qui ont ce mois dans leurs sessions
  -- Retirer le mois hors service et recalculer les sessions
  FOR payment_record IN 
    SELECT id, sessions, nombre_mois, montant_total
    FROM payments
    WHERE sessions ? paused_month
  LOOP
    -- Retirer le mois hors service des sessions
    updated_sessions := (
      SELECT jsonb_agg(value ORDER BY value)
      FROM jsonb_array_elements_text(payment_record.sessions) AS value
      WHERE value::text != paused_month
    );
    
    -- Si des sessions restent, mettre à jour le paiement
    IF jsonb_array_length(COALESCE(updated_sessions, '[]'::jsonb)) > 0 THEN
      UPDATE payments
      SET 
        sessions = updated_sessions,
        nombre_mois = jsonb_array_length(updated_sessions),
        -- Recalculer le montant total (montant mensuel × nombre de mois valides)
        montant_total = (payment_record.montant_total / jsonb_array_length(payment_record.sessions::jsonb)) * jsonb_array_length(updated_sessions)
      WHERE id = payment_record.id;
      
      affected_payments := affected_payments + 1;
      updated_payments := updated_payments || jsonb_build_object('payment_id', payment_record.id, 'updated', true);
    END IF;
  END LOOP;

  -- 3. Recalculer les statuts de tous les étudiants affectés
  -- Le trigger update_student_payment_status se chargera de recalculer les statuts
  -- lors du prochain UPDATE sur students

  -- Retourner un résumé des modifications
  RETURN jsonb_build_object(
    'paused_month', paused_month,
    'affected_students', affected_students,
    'affected_payments', affected_payments,
    'updated_students', updated_students,
    'updated_payments', updated_payments,
    'timestamp', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, logger et retourner un objet d'erreur
    RAISE WARNING 'Erreur lors du décalage des abonnements pour le mois % : %', paused_month, SQLERRM;
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'paused_month', paused_month
    );
END;
$$;

-- Fonction pour réinitialiser les mois hors service (optionnel)
CREATE OR REPLACE FUNCTION reset_paused_months()
RETURNS JSONB AS $$
DECLARE
  paused_months_list JSONB;
  month_item TEXT;
  result JSONB := '[]'::jsonb;
BEGIN
  -- Récupérer la liste des mois hors service
  SELECT paused_months INTO paused_months_list
  FROM settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF paused_months_list IS NULL OR jsonb_array_length(paused_months_list) = 0 THEN
    RETURN jsonb_build_object('message', 'Aucun mois hors service à traiter');
  END IF;

  -- Traiter chaque mois hors service
  FOR month_item IN SELECT jsonb_array_elements_text(paused_months_list)
  LOOP
    result := result || shift_subscriptions_for_paused_month(month_item);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire sur les fonctions
COMMENT ON FUNCTION shift_subscriptions_for_paused_month IS 'Décale automatiquement les abonnements quand un mois est marqué hors service. Retire le mois des months_ledger et des sessions de paiements, et recalcule les montants.';
COMMENT ON FUNCTION reset_paused_months IS 'Réinitialise tous les mois hors service en décalant tous les abonnements affectés.';

