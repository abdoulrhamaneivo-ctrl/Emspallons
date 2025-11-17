#!/bin/bash

# Script interactif de déploiement des Edge Functions Supabase

set -e

echo "🚀 Déploiement des Edge Functions Supabase"
echo "=========================================="
echo ""

# Couleurs
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
}

# Étape 1 : Vérifier/Installer Supabase CLI
echo "📦 Étape 1 : Vérification de Supabase CLI"
if ! command -v supabase &> /dev/null; then
    warn "Supabase CLI n'est pas installé."
    read -p "Voulez-vous l'installer maintenant ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        echo "Installation de Supabase CLI..."
        npm install -g supabase
        info "Supabase CLI installé !"
    else
        error "Installation annulée. Installez Supabase CLI manuellement : npm install -g supabase"
        exit 1
    fi
else
    info "Supabase CLI déjà installé ($(supabase --version))"
fi
echo ""

# Étape 2 : Vérifier l'authentification
echo "🔐 Étape 2 : Vérification de l'authentification"
if ! supabase projects list &> /dev/null 2>&1; then
    warn "Vous n'êtes pas connecté à Supabase."
    read -p "Voulez-vous vous connecter maintenant ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        supabase login
        info "Connecté à Supabase"
    else
        error "Connexion annulée. Connectez-vous manuellement : supabase login"
        exit 1
    fi
else
    info "Déjà authentifié"
fi
echo ""

# Étape 3 : Lier le projet
echo "🔗 Étape 3 : Liaison du projet"
read -p "Entrez votre Project Reference ID (trouvé dans l'URL: https://xxxxx.supabase.co) : " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    error "Project Reference ID requis"
    exit 1
fi

echo "Liaison du projet $PROJECT_REF..."
if supabase link --project-ref "$PROJECT_REF"; then
    info "Projet lié avec succès"
else
    error "Erreur lors de la liaison du projet"
    exit 1
fi
echo ""

# Étape 4 : Vérifier les secrets
echo "🔑 Étape 4 : Configuration des secrets"
warn "IMPORTANT : Assurez-vous que SERVICE_ROLE_KEY est configurée dans Supabase Dashboard"
echo "  1. Allez dans Project Settings → Edge Functions → Secrets"
echo "  2. Ajoutez SERVICE_ROLE_KEY avec votre clé service_role"
echo ""
read -p "Avez-vous configuré SERVICE_ROLE_KEY ? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    warn "Vous devez configurer SERVICE_ROLE_KEY avant de continuer"
    echo "Voulez-vous continuer quand même ? (o/n) "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        exit 1
    fi
fi
echo ""

# Étape 5 : Déployer les fonctions
echo "📤 Étape 5 : Déploiement des Edge Functions"
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

for func in "${FUNCTIONS[@]}"; do
    echo "  📤 Déploiement de $func..."
    if supabase functions deploy "$func"; then
        info "  ✅ $func déployé avec succès"
        ((SUCCESS_COUNT++))
    else
        error "  ❌ Erreur lors du déploiement de $func"
        ((FAILED_COUNT++))
    fi
    echo ""
done

# Résumé
echo "=========================================="
echo "📊 Résumé du déploiement"
echo "=========================================="
info "Fonctions déployées avec succès : $SUCCESS_COUNT"
if [ $FAILED_COUNT -gt 0 ]; then
    error "Fonctions en échec : $FAILED_COUNT"
fi
echo ""

# Vérification finale
if [ $FAILED_COUNT -eq 0 ]; then
    info "✅ Toutes les fonctions sont déployées !"
    echo ""
    echo "🔍 Vérification..."
    supabase functions list
    echo ""
    info "🎉 Déploiement terminé avec succès !"
    echo ""
    echo "Vous pouvez maintenant créer des éducateurs dans /admin/users"
else
    warn "⚠️  Certaines fonctions n'ont pas pu être déployées"
    echo "Vérifiez les erreurs ci-dessus et réessayez"
fi

