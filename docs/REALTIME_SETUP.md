# Configuration Supabase Realtime

Ce document explique comment activer la synchronisation temps réel dans Supabase pour toutes les tables nécessaires.

## 📋 Tables à activer

Les tables suivantes doivent avoir Realtime activé :

1. **students** - Synchronisation des étudiants
2. **payments** - Synchronisation des paiements
3. **scan_logs** - Synchronisation des scans
4. **controllers** - Synchronisation des contrôleurs
5. **profiles** - Synchronisation des profils utilisateurs
6. **user_presence** - Présence en ligne des utilisateurs
7. **editing_locks** - Verrous d'édition

## ⚠️ IMPORTANT : Realtime vs Replication

**Ne confondez pas "Replication" (ETL) avec "Realtime" !**

- **Replication (ETL)** : Fonctionnalité payante pour répliquer les données vers d'autres systèmes (non disponible sur le plan gratuit)
- **Realtime** : Synchronisation temps réel via WebSockets (disponible sur le plan gratuit) ✅

Nous avons besoin de **Realtime**, pas de Replication !

## 🚀 Méthode recommandée : Activation via SQL

La méthode la plus fiable est d'activer Realtime directement via SQL. Cette méthode fonctionne même sur le plan gratuit.

### Étapes :

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (éditeur SQL)
4. Créez une nouvelle requête
5. Copiez-collez le script SQL ci-dessous
6. Exécutez le script (bouton "Run" ou Ctrl+Enter)

### Script SQL à exécuter :

```sql
-- Activer Realtime pour toutes les tables nécessaires
-- Cette méthode fonctionne même sur le plan gratuit de Supabase

-- Vérifier d'abord si la publication existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Ajouter les tables à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS students;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS payments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS scan_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS controllers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS editing_locks;

-- Vérifier que les tables sont bien ajoutées
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

### Vérification

Après exécution, vous devriez voir dans les résultats :
- ✅ students
- ✅ payments
- ✅ scan_logs
- ✅ controllers
- ✅ profiles
- ✅ user_presence
- ✅ editing_locks

## 🔄 Méthode alternative : Interface (si disponible)

Si l'interface est disponible dans votre projet :

1. Allez dans **Database** → **Replication** (ou cherchez "Realtime" dans le menu)
2. **ATTENTION** : Ne cliquez pas sur "Enable replication" (c'est pour ETL, fonctionnalité payante)
3. Cherchez plutôt une section "Realtime" ou "WebSockets"
4. Activez Realtime pour chaque table individuellement

**Note** : Si vous ne voyez pas cette option, utilisez la méthode SQL ci-dessus qui fonctionne toujours.

## 📝 Notes importantes

- **Performance** : Realtime utilise des WebSockets. Assurez-vous que votre infrastructure peut gérer les connexions simultanées.
- **Sécurité** : Les politiques RLS (Row Level Security) s'appliquent toujours aux événements Realtime.
- **Limites** : Supabase a des limites sur le nombre de connexions simultanées selon votre plan.

## 🐛 Dépannage

### Les notifications ne s'affichent pas

1. Vérifiez que Realtime est activé pour la table concernée
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que les politiques RLS permettent la lecture

### Erreur "Channel error"

1. Vérifiez votre connexion internet
2. Vérifiez que votre clé API Supabase est correcte
3. Vérifiez les logs dans le Dashboard Supabase

### Les données ne se mettent pas à jour

1. Vérifiez que l'abonnement est actif (console navigateur)
2. Vérifiez que les événements sont bien déclenchés (INSERT, UPDATE, DELETE)
3. Vérifiez que les filtres dans le code sont corrects

## ✅ Vérification finale

Après activation, testez :

1. Ouvrez l'application dans deux onglets différents
2. Créez un étudiant dans un onglet
3. Vérifiez que l'étudiant apparaît automatiquement dans l'autre onglet
4. Vérifiez qu'une notification toast s'affiche

Si tout fonctionne, la synchronisation temps réel est correctement configurée ! 🎉

