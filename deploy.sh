#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT VERCEL AUTOMATIQUE
# EMSP TRANSPORT SCOLAIRE
# ============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Vercel - EMSP Transport Scolaire"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérifier si Vercel est installé
if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
fi

# Vérifier si l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    warn "Vous n'êtes pas connecté à Vercel. Connexion en cours..."
    vercel login
fi

info "Vercel CLI prêt"

# Vérifier les variables d'environnement
if [ ! -f ".env.local" ]; then
    warn "Fichier .env.local non trouvé"
    error "Veuillez créer .env.local avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
fi

# Lire les variables d'environnement
source .env.local 2>/dev/null || true

if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    error "VITE_SUPABASE_URL n'est pas configuré dans .env.local"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "your-anon-key" ]; then
    error "VITE_SUPABASE_ANON_KEY n'est pas configuré dans .env.local"
fi

info "Variables d'environnement détectées"

# Build de production
info "Build de production en cours..."
npm run build

# Vérifier que dist existe
if [ ! -d "dist" ]; then
    error "Le build a échoué. Le dossier dist n'existe pas."
fi

info "Build réussi !"

# Déployer sur Vercel
info "Déploiement sur Vercel en cours..."
echo ""
echo "📝 Instructions :"
echo "   1. Répondez 'Y' à 'Set up and deploy?'"
echo "   2. Sélectionnez votre scope"
echo "   3. Répondez 'N' à 'Link to existing project?' (première fois)"
echo "   4. Entrez le nom du projet : emsp-transport"
echo "   5. Répondez './' à 'In which directory?'"
echo ""

vercel --prod

echo ""
info "Déploiement terminé !"
echo ""
warn "⚠️  IMPORTANT : N'oubliez pas de configurer les variables d'environnement dans Vercel Dashboard :"
echo "   1. Allez sur vercel.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Settings → Environment Variables"
echo "   4. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
echo "   5. Redéployez si nécessaire"
echo ""

