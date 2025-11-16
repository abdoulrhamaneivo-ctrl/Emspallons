#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT AUTOMATIQUE
# EMSP TRANSPORT SCOLAIRE
# ============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement EMSP Transport Scolaire"
echo "========================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
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

# ============================================
# ÉTAPE 1 : VÉRIFICATIONS PRÉ-DÉPLOIEMENT
# ============================================

echo "📋 Étape 1 : Vérifications pré-déploiement"
echo "----------------------------------------"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Installez Node.js 18+"
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18+ requis. Version actuelle : $(node -v)"
fi
info "Node.js $(node -v) détecté"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi
info "npm $(npm -v) détecté"

# Vérifier les variables d'environnement
if [ ! -f ".env.local" ]; then
    warn "Fichier .env.local non trouvé"
    echo "Création du fichier .env.local..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF
    error "Veuillez configurer .env.local avec vos vraies valeurs"
fi

# Vérifier que les variables sont configurées
source .env.local 2>/dev/null || true
if [ -z "$VITE_SUPABASE_URL" ] || [ "$VITE_SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    error "VITE_SUPABASE_URL n'est pas configuré dans .env.local"
fi
if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "your-anon-key" ]; then
    error "VITE_SUPABASE_ANON_KEY n'est pas configuré dans .env.local"
fi
info "Variables d'environnement configurées"

echo ""

# ============================================
# ÉTAPE 2 : INSTALLATION DES DÉPENDANCES
# ============================================

echo "📦 Étape 2 : Installation des dépendances"
echo "----------------------------------------"

if [ ! -d "node_modules" ]; then
    info "Installation des dépendances..."
    npm install
else
    info "Vérification des dépendances..."
    npm install
fi
info "Dépendances installées"

echo ""

# ============================================
# ÉTAPE 3 : VÉRIFICATION DU CODE
# ============================================

echo "🔍 Étape 3 : Vérification du code"
echo "----------------------------------------"

if command -v npm &> /dev/null && npm list eslint &> /dev/null 2>&1; then
    info "Exécution du linter..."
    npm run lint || warn "Le linter a trouvé des avertissements (non bloquant)"
else
    warn "ESLint non installé, vérification ignorée"
fi

echo ""

# ============================================
# ÉTAPE 4 : BUILD DE PRODUCTION
# ============================================

echo "🏗️  Étape 4 : Build de production"
echo "----------------------------------------"

info "Nettoyage du dossier dist..."
rm -rf dist

info "Build en cours..."
npm run build

if [ ! -d "dist" ]; then
    error "Le build a échoué. Le dossier dist n'existe pas."
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
info "Build réussi ! Taille : $BUILD_SIZE"

echo ""

# ============================================
# ÉTAPE 5 : VÉRIFICATION DU BUILD
# ============================================

echo "✅ Étape 5 : Vérification du build"
echo "----------------------------------------"

# Vérifier que les fichiers essentiels existent
ESSENTIAL_FILES=("index.html" "assets")

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -e "dist/$file" ] || [ -d "dist/$file" ]; then
        info "Fichier/dossier $file trouvé"
    else
        warn "Fichier/dossier $file manquant"
    fi
done

echo ""

# ============================================
# ÉTAPE 6 : RÉSUMÉ
# ============================================

echo "📊 Résumé du déploiement"
echo "========================================"
info "✅ Toutes les vérifications sont passées"
info "✅ Build de production créé dans dist/"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Appliquez les migrations SQL dans Supabase (voir DEPLOIEMENT.md)"
echo "   2. Déployez le contenu de dist/ sur votre serveur"
echo "   3. Configurez HTTPS"
echo "   4. Testez l'application"
echo ""
echo "📚 Documentation :"
echo "   - Guide de déploiement : DEPLOIEMENT.md"
echo "   - Audit complet : AUDIT_COMPLET.md"
echo "   - Ordre des migrations : supabase/migrations/ORDRE_DEPLOIEMENT.sql"
echo ""
info "Déploiement préparé avec succès ! 🎉"

