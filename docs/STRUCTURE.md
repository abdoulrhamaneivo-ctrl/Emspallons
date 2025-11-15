# Structure du projet EMSP Transport Scolaire

## 📁 Structure des dossiers

```
emsp-transport/
├── public/                 # Fichiers statiques
├── src/
│   ├── components/        # Composants React
│   │   ├── ui/           # Composants réutilisables (Button, Input, Card, etc.)
│   │   ├── auth/         # Composants d'authentification
│   │   ├── students/     # Composants de gestion étudiants
│   │   ├── payments/     # Composants de gestion paiements
│   │   ├── controllers/  # Composants de gestion contrôleurs
│   │   └── scanner/      # Interface scan QR
│   ├── lib/              # Bibliothèques et utilitaires
│   │   ├── supabase.js   # Configuration Supabase
│   │   ├── constants.js  # Constantes (prix, statuts, rôles)
│   │   └── utils.js      # Fonctions utilitaires
│   ├── hooks/            # Hooks personnalisés
│   │   ├── useStudents.js
│   │   └── usePayments.js
│   ├── context/          # Context API
│   │   └── AuthContext.jsx
│   ├── pages/            # Pages de l'application
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Payments.jsx
│   │   ├── ScanQR.jsx
│   │   ├── Admin.jsx
│   │   └── Unauthorized.jsx
│   ├── App.jsx           # Composant principal
│   ├── main.jsx          # Point d'entrée
│   └── index.css         # Styles globaux
├── supabase/
│   └── schema.sql        # Schéma de base de données
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Configuration Tailwind

Les couleurs EMSP sont configurées dans `tailwind.config.js` :

```js
colors: {
  emsp: {
    yellow: '#FDB913',
    green: '#2D5016',
    lightGreen: '#7CB342',
  }
}
```

Utilisation : `bg-emsp-yellow`, `text-emsp-green`, `border-emsp-lightGreen`

## 📦 Dépendances principales

- **react, react-dom, react-router-dom** : Framework React
- **@supabase/supabase-js** : Client Supabase
- **tailwindcss, autoprefixer, postcss** : Styling
- **lucide-react** : Icônes
- **html5-qrcode, qrcode.react** : Scanner QR Code
- **date-fns** : Gestion des dates

## 🔧 Configuration Supabase

Le fichier `src/lib/supabase.js` configure le client Supabase avec :
- Variables d'environnement : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Helpers pour les rôles et profils utilisateurs

## 📋 Constantes

Le fichier `src/lib/constants.js` contient :
- `PRIX_MENSUEL` : 12500 FCFA
- `PERIODE_GRACE` : 5 jours
- `STATUTS_PAIEMENT` : ACTIF, EN_RETARD, EXPIRE, HORS_SERVICE
- `LIGNES_BUS` : Yopougon, Angré/Bingerville, Abobo
- `ROLES` : admin, educator, controller

## 🎣 Hooks personnalisés

- `useStudents` : Gestion des étudiants (CRUD)
- `usePayments` : Gestion des paiements (CRUD + filtres)

## 🧩 Composants UI

Composants réutilisables dans `src/components/ui/` :
- `Button` : Bouton avec variantes (primary, secondary, outline, danger, ghost)
- `Input` : Champ de saisie avec label et gestion d'erreur
- `Card` : Carte conteneur
- `Select` : Liste déroulante
- `Badge` : Badge de statut

## 🔐 Authentification

Le contexte `AuthContext` fournit :
- `user` : Utilisateur actuel
- `role` : Rôle de l'utilisateur
- `profile` : Profil complet
- `isAdmin`, `isEducator`, `isController` : Helpers booléens
- `signIn`, `signOut` : Fonctions d'authentification

## 🛡️ Routes protégées

Les routes sont protégées par rôle via `ProtectedRoute` :
- `/dashboard` : Tous les rôles
- `/students` : Admin, Educator
- `/payments` : Admin, Educator
- `/scan` : Controller
- `/admin` : Admin uniquement

