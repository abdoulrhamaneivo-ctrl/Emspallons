# 🔐 Authentification GitHub

GitHub ne supporte plus l'authentification par mot de passe. Vous devez utiliser un **Personal Access Token (PAT)**.

## ⚠️ Erreur : Permission `workflow` requise

Si vous voyez cette erreur :
```
refusing to allow a Personal Access Token to create or update workflow `.github/workflows/deploy.yml` without `workflow` scope
```

## Solution 1 : Ajouter la permission `workflow` au token (Recommandé)

### Étape 1 : Créer un nouveau token avec toutes les permissions

1. Allez sur [github.com/settings/tokens](https://github.com/settings/tokens)
2. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
3. Donnez un nom : `EMSP Transport Deployment`
4. Sélectionnez les permissions :
   - ✅ `repo` (toutes les permissions)
   - ✅ `workflow` (pour les GitHub Actions)
5. Cliquez sur **"Generate token"**
6. **Copiez le token immédiatement** (il ne sera plus visible)

### Étape 2 : Push avec le nouveau token

```bash
./push-with-token.sh
# Ou directement :
git push -u origin main
# Username: Emspallons
# Password: [collez votre nouveau token avec permission workflow]
```

## Solution 2 : Supprimer temporairement le workflow

Si vous ne voulez pas utiliser GitHub Actions pour l'instant :

```bash
# Le fichier workflow a été retiré du commit
# Poussez maintenant
./push-with-token.sh

# Plus tard, vous pourrez ajouter le workflow avec un token qui a la permission workflow
```

## Option 3 : SSH (Alternative)

### Étape 1 : Générer une clé SSH

```bash
ssh-keygen -t ed25519 -C "emsp@transport.com"
# Appuyez sur Entrée pour accepter l'emplacement par défaut
```

### Étape 2 : Ajouter la clé à GitHub

```bash
# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub
```

1. Copiez la clé affichée
2. Allez sur GitHub → **Settings** → **SSH and GPG keys**
3. Cliquez sur **New SSH key**
4. Collez la clé et sauvegardez

### Étape 3 : Changer le remote en SSH

```bash
git remote set-url origin git@github.com:abdoulrhamaneivo-ctrl/Emspallons.git
git push -u origin main
```

---

**Recommandation** : Utilisez la Solution 1 avec un token qui a les permissions `repo` ET `workflow`.
