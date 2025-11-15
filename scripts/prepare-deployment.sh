#!/bin/bash

# Script de préparation pour le déploiement
# Usage: ./scripts/prepare-deployment.sh

set -e

echo "🚀 Préparation du déploiement EMSP Transport"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté à la racine du projet${NC}"
    exit 1
fi

# 2. Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installation des dépendances...${NC}"
    npm install
fi

# 3. Linter
echo -e "${YELLOW}🔍 Vérification du code avec ESLint...${NC}"
npm run lint || {
    echo -e "${YELLOW}⚠️  Des warnings ESLint ont été détectés (non bloquant)${NC}"
}

# 4. Build
echo -e "${YELLOW}🏗️  Build de production...${NC}"
npm run build || {
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
}

echo -e "${GREEN}✅ Build réussi !${NC}"
echo ""

# 5. Vérifier les fichiers critiques
echo -e "${YELLOW}📋 Vérification des fichiers critiques...${NC}"

FILES_TO_CHECK=(
    "package.json"
    "vite.config.js"
    "src/main.jsx"
    "src/App.jsx"
    ".gitignore"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
    fi
done

echo ""

# 6. Vérifier .env.local (ne pas le commiter)
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local trouvé (ne sera pas commité)${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local non trouvé - Créez-le avec vos variables d'environnement${NC}"
fi

echo ""

# 7. Statistiques
echo -e "${YELLOW}📊 Statistiques du projet:${NC}"
echo "  - Fichiers source: $(find src -type f \( -name '*.js' -o -name '*.jsx' \) | wc -l)"
echo "  - Composants: $(find src/components -type f -name '*.jsx' | wc -l)"
echo "  - Pages: $(find src/pages -type f -name '*.jsx' | wc -l)"
echo "  - Hooks: $(find src/hooks -type f -name '*.js' | wc -l)"
echo "  - Services: $(find src/services -type f -name '*.js' | wc -l)"
echo "  - Migrations: $(find supabase/migrations -type f -name '*.sql' | wc -l)"

echo ""
echo -e "${GREEN}✅ Préparation terminée !${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. git add ."
echo "  2. git commit -m 'feat: préparation déploiement production'"
echo "  3. git push origin main"
echo ""

