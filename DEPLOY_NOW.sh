#!/bin/bash
echo "🚀 Déploiement Vercel - EMSP Transport"
echo "======================================"
echo ""
echo "Choisissez votre méthode :"
echo "1. Interface Web (Recommandé)"
echo "2. CLI (Nécessite authentification)"
echo ""
read -p "Votre choix (1 ou 2) : " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📝 Étapes pour l'interface web :"
    echo "1. Push vers GitHub :"
    echo "   git add ."
    echo "   git commit -m 'feat: déploiement Vercel'"
    echo "   git push origin main"
    echo ""
    echo "2. Allez sur : https://vercel.com/new"
    echo "3. Importez : abdoulrhamaneivo-ctrl/Emspallons"
    echo "4. Configurez les variables d'environnement"
    echo "5. Cliquez sur 'Deploy'"
    echo ""
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🔐 Connexion à Vercel..."
    vercel login
    echo ""
    echo "🚀 Déploiement en cours..."
    vercel --prod --yes
    echo ""
    echo "✅ Déploiement terminé !"
else
    echo "Choix invalide"
fi
