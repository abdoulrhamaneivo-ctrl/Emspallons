#!/bin/bash

# Script pour pousser avec un Personal Access Token
# GitHub ne supporte plus l'authentification par mot de passe

echo "🔐 Authentification GitHub avec Personal Access Token"
echo ""
echo "Si vous n'avez pas encore de token :"
echo "1. Allez sur https://github.com/settings/tokens"
echo "2. Cliquez sur 'Generate new token (classic)'"
echo "3. Sélectionnez la permission 'repo'"
echo "4. Copiez le token généré"
echo ""

read -p "Entrez votre Personal Access Token: " -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Token vide. Opération annulée."
    exit 1
fi

# Vérifier si le remote existe
if ! git remote get-url origin &>/dev/null; then
    echo "📦 Ajout du remote..."
    git remote add origin https://github.com/abdoulrhamaneivo-ctrl/Emspallons.git
fi

# Utiliser le token pour l'authentification
echo "📤 Push sur GitHub..."
git push https://${TOKEN}@github.com/abdoulrhamaneivo-ctrl/Emspallons.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push réussi !"
    echo ""
    echo "🌐 Prochaines étapes :"
    echo "1. Allez sur https://vercel.com"
    echo "2. Importez votre dépôt GitHub"
    echo "3. Ajoutez les variables d'environnement :"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "4. Cliquez sur 'Deploy'"
else
    echo ""
    echo "❌ Erreur lors du push."
    echo "Vérifiez que :"
    echo "- Le token est valide"
    echo "- Le dépôt existe sur GitHub"
    echo "- Vous avez les permissions d'écriture"
fi

