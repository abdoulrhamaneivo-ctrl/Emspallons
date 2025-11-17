# 📦 Installation de Supabase CLI

## 🎯 Méthodes d'Installation

### Option 1 : Via Homebrew (Linux/Mac) - Recommandé

```bash
# Installer Homebrew (si pas déjà installé)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Supabase CLI
brew install supabase/tap/supabase
```

### Option 2 : Via npm (npx - sans installation globale)

```bash
# Utiliser npx pour exécuter sans installation
npx supabase --version

# Pour les commandes, utiliser npx :
npx supabase login
npx supabase link --project-ref ...
npx supabase functions deploy ...
```

### Option 3 : Téléchargement Direct (Linux)

```bash
# Télécharger le binaire
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o supabase.tar.gz

# Extraire
tar -xzf supabase.tar.gz

# Déplacer vers /usr/local/bin (nécessite sudo)
sudo mv supabase /usr/local/bin/

# Vérifier
supabase --version
```

### Option 4 : Via Snap (Linux)

```bash
sudo snap install supabase
```

---

## ✅ Vérification

Après installation, vérifier :

```bash
supabase --version
```

Vous devriez voir : `supabase 1.x.x`

---

## 🚀 Utilisation avec npx (Sans Installation)

Si vous ne voulez pas installer globalement, utilisez `npx` :

```bash
# Se connecter
npx supabase login

# Lier le projet
npx supabase link --project-ref VOTRE_PROJECT_REF

# Déployer les fonctions
npx supabase functions deploy create-user
npx supabase functions deploy update-user
# etc...
```

---

## 📝 Note

Supabase CLI ne peut **pas** être installé via `npm install -g supabase` car il n'est pas un package npm standard.

Utilisez l'une des méthodes ci-dessus.

