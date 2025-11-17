#!/bin/bash

# Script de déploiement des Edge Functions Supabase avec npx
# Utilise npx pour éviter l'installation globale

set -e

echo "🚀 Déploiement des Edge Functions Supabase (avec npx)"
echo "====================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Installez Node.js d'abord."
    exit 1
fi

info "Node.js installé ($(node --version))"
info "Utilisation de npx pour Supabase CLI"
echo ""

# Étape 1 : Vérifier npx
step "Étape 1 : Vérification de npx"
if command -v npx &> /dev/null; then
    info "npx disponible"
    SUPABASE_CMD="npx supabase"
else
    error "npx n'est pas disponible"
    exit 1
fi
echo ""

# Étape 2 : Vérifier l'authentification
step "Étape 2 : Vérification de l'authentification"
if $SUPABASE_CMD projects list &> /dev/null 2>&1; then
    info "Déjà authentifié"
else
    warn "Vous n'êtes pas connecté à Supabase."
    echo ""
    echo "🔑 Connexion requise..."
    echo "Cette commande ouvrira votre navigateur pour vous authentifier."
    read -p "Appuyez sur Entrée pour continuer..."
    $SUPABASE_CMD login
    info "Connecté à Supabase"
fi
echo ""

# Étape 3 : Lier le projet
step "Étape 3 : Liaison du projet"
echo ""
echo "📋 Pour trouver votre Project Reference ID :"
echo "   1. Allez dans Supabase Dashboard : https://app.supabase.com"
echo "   2. Sélectionnez votre projet"
echo "   3. Allez dans Project Settings → General"
echo "   4. Copiez le 'Reference ID'"
echo "   OU regardez l'URL : https://xxxxx.supabase.co → xxxxx est le Reference ID"
echo ""
read -p "Entrez votre Project Reference ID : " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    error "Project Reference ID requis"
    exit 1
fi

echo ""
echo "🔗 Liaison du projet $PROJECT_REF..."
if $SUPABASE_CMD link --project-ref "$PROJECT_REF"; then
    info "Projet lié avec succès"
else
    error "Erreur lors de la liaison du projet"
    exit 1
fi
echo ""

# Étape 4 : Vérifier les secrets
step "Étape 4 : Configuration des secrets"
warn "IMPORTANT : Assurez-vous que SERVICE_ROLE_KEY est configurée"
echo ""
echo "📝 Pour configurer SERVICE_ROLE_KEY :"
echo "   1. Allez dans Supabase Dashboard → Project Settings → API"
echo "   2. Copiez la clé 'service_role' (⚠️  NE JAMAIS la partager publiquement)"
echo "   3. Allez dans Project Settings → Edge Functions → Secrets"
echo "   4. Ajoutez un nouveau secret :"
echo "      - Nom : SERVICE_ROLE_KEY"
echo "      - Valeur : votre clé service_role"
echo "   5. Sauvegardez"
echo ""
read -p "Avez-vous configuré SERVICE_ROLE_KEY ? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    warn "⚠️  Vous devez configurer SERVICE_ROLE_KEY avant de continuer"
    echo ""
    read -p "Voulez-vous continuer quand même ? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        info "Déploiement annulé. Configurez SERVICE_ROLE_KEY et réessayez."
        exit 0
    fi
fi
echo ""

# Étape 5 : Déployer les fonctions
step "Étape 5 : Déploiement des Edge Functions"
echo ""

FUNCTIONS=(
    "create-user"
    "update-user"
    "delete-user"
    "resend-confirmation-email"
    "get-user-email-status"
    "reset-password"
)

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

