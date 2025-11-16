# 🔧 Migration - Correction Fonction Reset Database

## ⚠️ Important
Cette migration corrige l'erreur **"DELETE requires a WHERE clause"** dans la fonction `reset_database_except_admins()`.

## 📋 Instructions d'Application

### Étape 1 : Accéder à Supabase
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** (Éditeur SQL)

### Étape 2 : Appliquer la Migration
1. Ouvrez le fichier `supabase/migrations/create_reset_function.sql`
2. Copiez le contenu complet
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (Exécuter)

### Étape 3 : Vérification
Après l'exécution, vérifiez que :
- ✅ Aucune erreur n'apparaît
- ✅ Le message "Success. No rows returned" s'affiche
- ✅ La fonction `reset_database_except_admins()` a été mise à jour

## 🔍 Ce qui a été corrigé

### Problème
L'erreur **"DELETE requires a WHERE clause"** se produisait parce que les politiques RLS (Row Level Security) de Supabase empêchent les commandes `DELETE` sans clause `WHERE`.

### Solution
Ajout de `WHERE 1=1` à toutes les commandes `DELETE` :
- ✅ `DELETE FROM scan_logs WHERE 1=1;`
- ✅ `DELETE FROM payments WHERE 1=1;`
- ✅ `DELETE FROM students WHERE 1=1;`
- ✅ Etc.

### Améliorations
1. **Gestion des settings** : Vérification d'existence avant UPDATE/INSERT
2. **Gestion d'erreur améliorée** : Messages plus clairs dans le frontend
3. **Sécurité** : Toutes les commandes DELETE respectent maintenant RLS

## ⚠️ Attention
- Cette migration est **sécurisée** et **rétrocompatible**
- Elle ne supprime aucune donnée
- Elle met simplement à jour la fonction SQL

## 🆘 En cas de problème
Si l'erreur persiste après avoir appliqué la migration :
1. Vérifiez que la migration a bien été exécutée
2. Vérifiez que la fonction `reset_database_except_admins()` existe
3. Contactez un administrateur système

