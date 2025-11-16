#!/bin/bash

# Script de déploiement automatique sur Vercel
# Usage: ./scripts/deploy-vercel.sh

set -e

echo "🚀 Déploiement EMSP Transport sur Vercel"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté à la racine du projet${NC}"
    exit 1
fi

# 2. Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non trouvé. Installation...${NC}"
    npm install -g vercel
fi

# 3. Vérifier le build
echo -e "${YELLOW}🔍 Vérification du build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

# 4. Vérifier Git
echo -e "${YELLOW}📦 Vérification Git...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Repository Git détecté${NC}"
    
    # Vérifier s'il y a des changements non commités
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Des changements non commités détectés${NC}"
        echo -e "${BLUE}💡 Souhaitez-vous les commiter maintenant ? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "feat: préparation déploiement Vercel"
            echo -e "${GREEN}✅ Changements commités${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Pas de repository Git détecté${NC}"
fi

# 5. Déploiement
echo ""
echo -e "${BLUE}🚀 Lancement du déploiement sur Vercel...${NC}"
echo ""

# Déploiement en mode production
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes :${NC}"
echo "  1. Vérifiez votre URL de déploiement ci-dessus"
echo "  2. Configurez les variables d'environnement dans Vercel Dashboard"
echo "  3. Testez votre application"
echo ""

