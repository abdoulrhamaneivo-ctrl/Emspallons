#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT COMPLET
# EMSP TRANSPORT SCOLAIRE
# ============================================

set -e

echo "🚀 Déploiement Complet - EMSP Transport Scolaire"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

step() {
    echo -e "${BLUE}📋 $1${NC}"
}

# Vérifier qu'on est à la racine du projet
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté à la racine du projet"
    exit 1
fi

# ============================================
# ÉTAPE 1: PRÉPARATION
# ============================================

step "Étape 1: Préparation du projet"
echo ""

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    warn "Installation des dépendances..."
    npm install
else
    info "Dépendances déjà installées"
fi

# Vérifier .env.local
if [ ! -f ".env.local" ]; then
    warn ".env.local non trouvé"
    echo "Création du fichier .env.local..."
    echo ""
    echo "Veuillez entrer vos variables d'environnement :"
    read -p "VITE_SUPABASE_URL: " SUPABASE_URL
    read -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    
    cat > .env.local << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
    info ".env.local créé"
else
    info ".env.local trouvé"
fi

echo ""

# ============================================
# ÉTAPE 2: BUILD
# ============================================

step "Étape 2: Build de production"
echo ""

npm run build

if [ ! -d "dist" ]; then
    error "Le build a échoué. Le dossier dist n'existe pas."
    exit 1
fi

info "Build réussi !"
echo ""

# ============================================
# ÉTAPE 3: DÉPLOIEMENT VERCEL
# ============================================

step "Étape 3: Déploiement sur Vercel"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI non installé. Installation en cours..."
    npm install -g vercel
fi

# Vérifier la connexion Vercel
if ! vercel whoami &> /dev/null; then
    warn "Vous n'êtes pas connecté à Vercel"
    echo ""
    echo "Vercel va ouvrir votre navigateur pour vous connecter..."
    echo "Appuyez sur Entrée pour continuer..."
    read
    vercel login
fi

info "Vercel CLI prêt"
echo ""

# Déploiement
echo "Déploiement sur Vercel en cours..."
echo ""
warn "⚠️  Instructions :"
echo "   1. Répondez 'Y' à 'Set up and deploy?'"
echo "   2. Sélectionnez votre scope"
echo "   3. Répondez 'N' à 'Link to existing project?' (première fois)"
echo "   4. Entrez le nom du projet : emsp-transport"
echo "   5. Répondez './' à 'In which directory?'"
echo ""

if vercel --prod; then
    info "Déploiement Vercel réussi !"
else
    error "Erreur lors du déploiement Vercel"
    echo ""
    warn "Vous pouvez réessayer manuellement avec : vercel --prod"
fi

echo ""

# ============================================
# ÉTAPE 4: VARIABLES D'ENVIRONNEMENT VERCEL
# ============================================

step "Étape 4: Configuration des variables d'environnement Vercel"
echo ""

warn "⚠️  IMPORTANT : N'oubliez pas de configurer les variables d'environnement dans Vercel Dashboard :"
echo ""
echo "   1. Allez sur https://vercel.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Settings → Environment Variables"
echo "   4. Ajoutez les variables suivantes :"
echo "      - VITE_SUPABASE_URL"
echo "      - VITE_SUPABASE_ANON_KEY"
echo "   5. Sélectionnez 'Production', 'Preview' et 'Development'"
echo "   6. Redéployez si nécessaire"
echo ""

read -p "Voulez-vous configurer les variables maintenant via CLI ? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    source .env.local 2>/dev/null || true
    
    if [ ! -z "$VITE_SUPABASE_URL" ]; then
        echo "Ajout de VITE_SUPABASE_URL..."
        vercel env add VITE_SUPABASE_URL production preview development <<< "$VITE_SUPABASE_URL" || true
    fi
    
    if [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
        echo "Ajout de VITE_SUPABASE_ANON_KEY..."
        vercel env add VITE_SUPABASE_ANON_KEY production preview development <<< "$VITE_SUPABASE_ANON_KEY" || true
    fi
    
    info "Variables d'environnement ajoutées"
fi

echo ""

# ============================================
# ÉTAPE 5: EDGE FUNCTIONS SUPABASE
# ============================================

step "Étape 5: Déploiement des Edge Functions Supabase"
echo ""

FUNCTIONS=(
    "create-user"
    "update-user"
    "delete-user"
    "resend-confirmation-email"
    "get-user-email-status"
    "hash-password"
    "reset-password"
    "verify-password"
)

if command -v supabase &> /dev/null || command -v npx &> /dev/null; then
    SUPABASE_CMD="supabase"
    if ! command -v supabase &> /dev/null; then
        SUPABASE_CMD="npx supabase"
    fi
    
    read -p "Voulez-vous déployer les Edge Functions Supabase maintenant ? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        step "Vérification de la connexion Supabase..."
        
        if ! $SUPABASE_CMD projects list &> /dev/null; then
            warn "Vous n'êtes pas connecté à Supabase"
            $SUPABASE_CMD login || true
            $SUPABASE_CMD link --project-ref YOUR_PROJECT_REF || {
                warn "Veuillez lier votre projet Supabase manuellement"
                warn "Utilisez: $SUPABASE_CMD link --project-ref YOUR_PROJECT_REF"
            }
        fi
        
        info "Déploiement de ${#FUNCTIONS[@]} fonctions..."
        echo ""
        
        SUCCESS_COUNT=0
        FAILED_COUNT=0
        
        for func in "${FUNCTIONS[@]}"; do
            echo "  📤 Déploiement de $func..."
            if $SUPABASE_CMD functions deploy "$func" --no-verify-jwt 2>&1; then
                info "  ✅ $func déployé"
                ((SUCCESS_COUNT++))
            else
                error "  ❌ Erreur pour $func"
                ((FAILED_COUNT++))
            fi
            echo ""
        done
        
        echo "Résumé : $SUCCESS_COUNT/${#FUNCTIONS[@]} fonctions déployées"
        
        if [ $FAILED_COUNT -gt 0 ]; then
            warn "$FAILED_COUNT fonction(s) n'a(ont) pas pu être déployée(s)"
            warn "Vous pouvez les déployer manuellement via le Dashboard Supabase"
        fi
    else
        warn "Déploiement des Edge Functions ignoré"
        echo ""
        warn "Pour déployer plus tard :"
        echo "   - Via Dashboard : https://supabase.com/dashboard → Edge Functions"
        echo "   - Via CLI : npx supabase functions deploy <function-name>"
    fi
else
    warn "Supabase CLI non disponible"
    echo ""
    warn "Options pour déployer les Edge Functions :"
    echo "   1. Via Dashboard Supabase (Recommandé) :"
    echo "      https://supabase.com/dashboard → Edge Functions"
    echo ""
    echo "   2. Installer Supabase CLI :"
    echo "      npm install -g supabase"
    echo "      supabase login"
    echo "      supabase link --project-ref YOUR_PROJECT_REF"
    echo "      supabase functions deploy <function-name>"
    echo ""
fi

# ============================================
# RÉSUMÉ
# ============================================

echo ""
echo "=================================================="
step "Résumé du déploiement"
echo "=================================================="
echo ""

info "✅ Build de production : Réussi"
info "✅ Déploiement Vercel : En cours / Terminé"
info "✅ Edge Functions : Vérifiez manuellement si nécessaire"
echo ""

warn "📝 Prochaines étapes :"
echo "   1. Vérifiez votre URL de déploiement Vercel"
echo "   2. Configurez les variables d'environnement dans Vercel Dashboard"
echo "   3. Testez l'application en production"
echo "   4. Vérifiez que toutes les Edge Functions sont déployées"
echo ""

info "🎉 Déploiement terminé !"
echo ""




