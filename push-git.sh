#!/bin/bash

# Script pour pousser les modifications vers GitHub
# Usage: ./push-git.sh [token]

set -e

echo "🔍 Vérification de l'état Git..."

# Vérifier s'il y a des modifications non commitées
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Des modifications non commitées ont été détectées."
    echo "Voulez-vous les commiter ? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add .
        echo "Message de commit (laisser vide pour 'Mise à jour du projet'):"
        read -r commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="Mise à jour du projet"
        fi
        git commit -m "$commit_msg"
    fi
fi

# Configurer le tracking si nécessaire
if ! git branch --show-current | grep -q "origin"; then
    echo "📝 Configuration du tracking de la branche..."
    git branch --set-upstream-to=origin/main main 2>/dev/null || true
fi

# Méthode 1: Avec token en argument
if [ -n "$1" ]; then
    echo "🔐 Push avec token..."
    git push https://$1@github.com/abdoulrhamaneivo-ctrl/Emspallons.git main
    exit 0
fi

# Méthode 2: Avec token dans variable d'environnement
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔐 Push avec token d'environnement..."
    git push https://$GITHUB_TOKEN@github.com/abdoulrhamaneivo-ctrl/Emspallons.git main
    exit 0
fi

# Méthode 3: Push normal (nécessite authentification interactive)
echo "🚀 Tentative de push..."
echo "Si une authentification est requise:"
echo "  - Username: votre nom d'utilisateur GitHub"
echo "  - Password: utilisez un Personal Access Token (pas votre mot de passe)"
echo ""
echo "Pour créer un token: https://github.com/settings/tokens"
echo ""

git push origin main --set-upstream || {
    echo ""
    echo "❌ Push échoué."
    echo ""
    echo "Options:"
    echo "1. Utiliser un token: GITHUB_TOKEN=your_token ./push-git.sh"
    echo "2. Utiliser un token en argument: ./push-git.sh your_token"
    echo "3. Push manuel: git push origin main --set-upstream"
    exit 1
}

echo "✅ Push réussi !"

