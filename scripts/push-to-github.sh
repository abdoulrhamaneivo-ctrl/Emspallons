#!/bin/bash

# Script pour pousser le projet sur GitHub
# Remplacez YOUR_REPO_URL par l'URL de votre dépôt GitHub

echo "🚀 Préparation du push sur GitHub..."
echo ""

# Vérifier si un remote existe déjà
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Un remote 'origin' existe déjà."
    read -p "Voulez-vous le remplacer ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        git remote remove origin
    else
        echo "Annulé."
        exit 1
    fi
fi

# Demander l'URL du dépôt
read -p "Entrez l'URL de votre dépôt GitHub (ex: https://github.com/username/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ URL vide. Opération annulée."
    exit 1
fi

echo ""
echo "📦 Ajout du remote..."
git remote add origin "$REPO_URL"

echo "📤 Push sur GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push réussi !"
    echo ""
    echo "Prochaines étapes :"
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
    echo "- Le dépôt GitHub existe"
    echo "- Vous avez les permissions d'écriture"
    echo "- Vous êtes authentifié avec GitHub"
fi

