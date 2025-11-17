#!/bin/bash

# Script de déploiement automatique de toutes les Edge Functions
# Utilise npx pour éviter l'installation globale

set -e

echo "🚀 Déploiement de toutes les Edge Functions Supabase"
echo "====================================================="
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

SUPABASE_CMD="npx supabase"

# Liste des fonctions à déployer
FUNCTIONS=(
    "create-user"
    "update-user"
    "delete-user"
    "resend-confirmation-email"
    "get-user-email-status"
    "reset-password"
)

step "Déploiement de ${#FUNCTIONS[@]} fonctions..."
echo ""

SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_FUNCTIONS=()

for func in "${FUNCTIONS[@]}"; do
    echo "  📤 Déploiement de $func..."
    if $SUPABASE_CMD functions deploy "$func" 2>&1; then
        info "  ✅ $func déployé avec succès"
        ((SUCCESS_COUNT++))
    else
        error "  ❌ Erreur lors du déploiement de $func"
        FAILED_FUNCTIONS+=("$func")
        ((FAILED_COUNT++))
    fi
    echo ""
done

# Résumé
echo "====================================================="
step "Résumé du déploiement"
echo "====================================================="
info "Fonctions déployées avec succès : $SUCCESS_COUNT/${#FUNCTIONS[@]}"

if [ $FAILED_COUNT -gt 0 ]; then
    error "Fonctions en échec : $FAILED_COUNT"
    echo ""
    echo "Fonctions qui ont échoué :"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $func"
    done
    echo ""
    warn "Vérifiez les erreurs ci-dessus"
    echo "Vous pouvez réessayer avec : npx supabase functions deploy <function-name>"
    exit 1
else
    echo ""
    info "🎉 Toutes les fonctions sont déployées avec succès !"
    echo ""
    step "Vérification finale..."
    $SUPABASE_CMD functions list
    echo ""
    info "✅ Déploiement terminé !"
    echo ""
    echo "🎯 Vous pouvez maintenant :"
    echo "   - Créer des éducateurs dans /admin/users"
    echo "   - Modifier des éducateurs"
    echo "   - Supprimer des éducateurs"
    echo "   - Voir la traçabilité dans /admin/logs"
fi

echo ""

