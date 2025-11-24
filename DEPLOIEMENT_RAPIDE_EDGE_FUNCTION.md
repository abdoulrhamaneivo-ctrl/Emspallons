# 🚀 Déploiement Rapide - Edge Function delete-user

## ⚡ Déploiement en 3 Étapes

### Étape 1 : Installer et Connecter Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login
```

### Étape 2 : Lier votre Projet

```bash
# Trouver votre PROJECT_REF dans l'URL Supabase
# Exemple : https://zmptirvzmoxprshxiezb.supabase.co
# Le PROJECT_REF est : zmptirvzmoxprshxiezb

supabase link --project-ref VOTRE_PROJECT_REF
```

### Étape 3 : Déployer la Fonction

```bash
# Déployer delete-user
supabase functions deploy delete-user
```

## ✅ Vérification

Après déploiement, testez dans l'application :
1. Allez dans **Profil** → **Supprimer mon compte**
2. Si vous n'êtes pas le dernier admin, la suppression devrait fonctionner
3. Si vous êtes le dernier admin, vous devriez voir un message d'erreur approprié

## 🔍 Vérifier les Logs

Si problème, vérifier les logs :

```bash
supabase functions logs delete-user
```

## 📝 Alternative : Déploiement via Dashboard

Si le CLI ne fonctionne pas :

1. Allez dans **Supabase Dashboard** → **Edge Functions**
2. Trouvez **delete-user** (ou créez-la si elle n'existe pas)
3. Copiez le contenu de `supabase/functions/delete-user/index.ts`
4. Collez dans l'éditeur
5. Cliquez sur **Deploy**

## 🔐 Vérifier les Secrets

Assurez-vous que `SERVICE_ROLE_KEY` est configuré :

1. **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Vérifiez que `SERVICE_ROLE_KEY` existe
3. Si non, ajoutez-le (trouvable dans **Settings** → **API** → **service_role key**)

---

**Une fois déployé, la suppression de compte admin fonctionnera correctement !** ✅

