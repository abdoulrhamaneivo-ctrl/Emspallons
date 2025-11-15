#!/bin/bash

# Script pour pousser sans le fichier workflow (pour éviter l'erreur de permission)

echo "📤 Push sur GitHub (sans workflow file)"
echo ""
echo "Le fichier .github/workflows/deploy.yml a été retiré temporairement."
echo "Vous pourrez l'ajouter plus tard avec un token qui a la permission 'workflow'."
echo ""

read -p "Entrez votre Personal Access Token (avec permission 'repo'): " -s TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Token vide. Opération annulée."
    exit 1
fi

echo "📤 Push sur GitHub..."
git push https://${TOKEN}@github.com/abdoulrhamaneivo-ctrl/Emspallons.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Push réussi !"
    echo ""
    echo "📝 Note : Le fichier .github/workflows/deploy.yml n'a pas été poussé."
    echo "Pour l'ajouter plus tard, créez un token avec la permission 'workflow'."
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

