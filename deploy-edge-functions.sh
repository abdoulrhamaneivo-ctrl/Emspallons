#!/bin/bash

# Script de déploiement des Edge Functions Supabase
# Usage: ./deploy-edge-functions.sh

set -e

echo "🚀 Déploiement des Edge Functions Supabase"
echo "=========================================="
echo ""

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo ""
    echo "📦 Installation..."
    npm install -g supabase
    echo ""
    echo "✅ Supabase CLI installé !"
    echo ""
else
    echo "✅ Supabase CLI déjà installé"
    echo ""
fi

# Vérifier si l'utilisateur est connecté
echo "🔐 Vérification de l'authentification..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Supabase."
    echo ""
    echo "🔑 Connexion requise..."
    supabase login
    echo ""
fi

echo "✅ Authentifié"
echo ""

# Demander le project-ref
echo "📋 Informations du projet Supabase"
echo "-----------------------------------"
read -p "Entrez votre Project Reference ID (trouvé dans l'URL: https://xxxxx.supabase.co) : " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project Reference ID requis"
    exit 1
fi

echo ""
echo "🔗 Liaison du projet..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "📦 Déploiement des Edge Functions..."
echo ""

# Déployer toutes les fonctions
FUNCTIONS=(
    "create-user"
    "update-user"
    "delete-user"
    "resend-confirmation-email"
    "get-user-email-status"
    "reset-password"
)

for func in "${FUNCTIONS[@]}"; do
    echo "  📤 Déploiement de $func..."
    supabase functions deploy "$func" || {
        echo "  ⚠️  Erreur lors du déploiement de $func"
    }
done

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 IMPORTANT : Configurez les secrets dans Supabase Dashboard :"
echo "   1. Allez dans Project Settings → Edge Functions → Secrets"
echo "   2. Ajoutez SERVICE_ROLE_KEY (trouvé dans Project Settings → API → service_role key)"
echo ""
echo "🔍 Vérification..."
supabase functions list

echo ""
echo "✅ Toutes les fonctions sont déployées !"
echo ""

