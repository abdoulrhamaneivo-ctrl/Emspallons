-- Migration : Mettre à jour calculate_payment_status pour prendre en compte les sessions futures
-- Si months_ledger contient des sessions futures, le statut doit être ACTIF

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
  has_future_sessions BOOLEAN := false;
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
  
  -- NOUVEAU : Vérifier si months_ledger contient des sessions futures
  -- Si oui, l'étudiant est ACTIF même si le mois actuel n'est pas payé
  IF jsonb_array_length(p_months_ledger) > 0 THEN
    SELECT EXISTS(
      SELECT 1
      FROM jsonb_array_elements_text(p_months_ledger) AS session
      WHERE session::text > current_month
    ) INTO has_future_sessions;
    
    IF has_future_sessions THEN
      RETURN 'ACTIF';
    END IF;
  END IF;
  
  -- Trouver le dernier mois payé dans months_ledger
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

