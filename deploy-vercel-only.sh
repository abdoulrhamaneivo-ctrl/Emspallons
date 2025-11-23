#!/bin/bash

# Script de déploiement Vercel uniquement (non-interactif)
set -e

echo "🚀 Déploiement Vercel - EMSP Transport"
echo "========================================"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Installation de Vercel CLI..."
    npm install -g vercel
fi

# Vérifier connexion
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Veuillez vous connecter à Vercel :"
    echo "   vercel login"
    exit 1
fi

echo "✅ Vercel CLI prêt"
echo ""

# Build
echo "🏗️  Build de production..."
npm run build

echo ""
echo "✅ Build réussi"
echo ""

# Déploiement
echo "🚀 Déploiement sur Vercel..."
vercel --prod --yes

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "⚠️  N'oubliez pas de configurer les variables d'environnement :"
echo "   1. https://vercel.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Settings → Environment Variables"
echo "   4. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
