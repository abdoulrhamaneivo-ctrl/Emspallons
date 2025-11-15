# Fichier .env.example

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# ============================================
# Variables d'environnement EMSP Transport Scolaire
# ============================================
# 
# Instructions :
# 1. Copiez ce contenu dans un fichier nommé .env.local
# 2. Remplacez les valeurs par vos propres clés Supabase
# 3. Ne commitez JAMAIS le fichier .env.local (déjà dans .gitignore)
#
# ============================================

# URL de votre projet Supabase
# Trouvable dans : Supabase Dashboard → Settings → API → Project URL
VITE_SUPABASE_URL=https://votre-projet.supabase.co

# Clé anonyme (publique) Supabase
# Trouvable dans : Supabase Dashboard → Settings → API → Project API keys → anon public
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici

# ============================================
# Configuration WhatsApp (Optionnel)
# ============================================
# Pour l'envoi automatique de messages WhatsApp en production
# 
# Option 1 : WhatsApp Business Cloud API (Recommandé pour production)
# Obtenez vos clés sur : https://developers.facebook.com/docs/whatsapp/cloud-api
# Guide complet : Voir GUIDE_WHATSAPP_BUSINESS.md
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_API_KEY=votre_token_whatsapp_business_cloud
# Optionnel : Phone Number ID (trouvable dans WhatsApp → API Setup)
# Format : VITE_WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Option 2 : Twilio WhatsApp API (Alternative)
# Si vous utilisez Twilio, configurez comme suit :
# VITE_WHATSAPP_API_URL=https://api.twilio.com/2010-04-01/Accounts
# VITE_WHATSAPP_API_KEY=votre_token_twilio

# Note : Si ces variables ne sont pas définies, l'application utilisera
# WhatsApp Web (ouverture manuelle des liens) en mode développement

# ============================================
# Notes importantes :
# ============================================
# - Ces variables sont utilisées côté client (d'où le préfixe VITE_)
# - La clé anonyme est publique mais sécurisée par RLS (Row Level Security)
# - Ne partagez jamais vos clés API publiquement
# - Pour le déploiement, ajoutez ces variables dans les paramètres de votre plateforme
#   (Vercel, Netlify, etc.)
```

## Comment obtenir ces valeurs ?

1. **VITE_SUPABASE_URL** :
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet
   - Allez dans **Settings** → **API**
   - Copiez l'**URL du projet** (Project URL)

2. **VITE_SUPABASE_ANON_KEY** :
   - Dans la même page (Settings → API)
   - Copiez la clé **"anon public"** (Project API keys → anon public)

## Sécurité

- Le fichier `.env.local` est ignoré par Git (déjà dans `.gitignore`)
- Ne partagez jamais vos clés API publiquement
- Pour le déploiement, ajoutez ces variables dans les paramètres de votre plateforme d'hébergement

