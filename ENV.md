# Configuration des variables d'environnement

## Fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

## Où trouver ces valeurs ?

1. **VITE_SUPABASE_URL** : 
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet
   - Allez dans Settings > API
   - Copiez l'URL du projet (Project URL)

2. **VITE_SUPABASE_ANON_KEY** :
   - Dans la même page (Settings > API)
   - Copiez la clé "anon public" (Project API keys)

## Important

- Le fichier `.env.local` est ignoré par Git (déjà dans .gitignore)
- Ne partagez jamais vos clés API publiquement
- Pour le déploiement sur Vercel, ajoutez ces variables dans les paramètres du projet

