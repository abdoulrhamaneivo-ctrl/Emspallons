-- Migration : Renommer la colonne 'annee' en 'nom' dans la table promotions
-- Permet la saisie libre de texte (ex: "Licence 1", "Master", etc.) au lieu de dates
-- Cette migration gère tous les cas : colonne déjà renommée, colonnes existantes, etc.

DO $$
BEGIN
    -- Vérifier si la colonne 'annee' existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        AND column_name = 'annee'
    ) THEN
        -- Vérifier si la colonne 'nom' existe déjà
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'promotions' 
            AND column_name = 'nom'
        ) THEN
            -- Les deux colonnes existent : copier les données de 'annee' vers 'nom' (si nom est vide)
            UPDATE promotions 
            SET nom = annee 
            WHERE (nom IS NULL OR nom = '') AND annee IS NOT NULL;
            
            -- Supprimer la colonne 'annee'
            ALTER TABLE promotions DROP COLUMN annee;
            
            RAISE NOTICE 'Colonne annee supprimée, données copiées vers nom';
        ELSE
            -- Seule 'annee' existe : la renommer en 'nom'
            ALTER TABLE promotions RENAME COLUMN annee TO nom;
            RAISE NOTICE 'Colonne annee renommée en nom';
        END IF;
    ELSE
        -- 'annee' n'existe pas
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'promotions' 
            AND column_name = 'nom'
        ) THEN
            -- Aucune des deux colonnes n'existe : créer 'nom'
            ALTER TABLE promotions ADD COLUMN nom TEXT UNIQUE;
            RAISE NOTICE 'Colonne nom créée';
        ELSE
            -- Seule 'nom' existe : déjà bon, ne rien faire
            RAISE NOTICE 'Colonne nom existe déjà, aucune action nécessaire';
        END IF;
    END IF;
END $$;

-- Gérer les index
DROP INDEX IF EXISTS idx_promotions_annee;
CREATE INDEX IF NOT EXISTS idx_promotions_nom ON promotions(nom);

-- S'assurer que la colonne nom a la contrainte UNIQUE si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'promotions' 
        AND constraint_name = 'promotions_nom_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Ajouter la contrainte UNIQUE si elle n'existe pas
        ALTER TABLE promotions ADD CONSTRAINT promotions_nom_key UNIQUE (nom);
        RAISE NOTICE 'Contrainte UNIQUE ajoutée sur nom';
    END IF;
END $$;

