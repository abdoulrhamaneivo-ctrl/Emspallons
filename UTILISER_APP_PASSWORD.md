# 🔑 Comment Utiliser l'App Password Gmail

## ✅ Vous Avez Généré l'App Password - Maintenant ?

### Étape 1 : Copier l'App Password

Quand vous avez généré l'App Password, Google vous a affiché quelque chose comme :

```
xxxx xxxx xxxx xxxx
```

Par exemple :
```
abcd efgh ijkl mnop
```

**⚠️ IMPORTANT** : Copiez **TOUT** le mot de passe (les 16 caractères).

---

### Étape 2 : Aller dans Supabase

1. Ouvrez : https://supabase.com/dashboard/project/zmptirvzmoxprshxiezb/auth/smtp
2. Vous êtes sur la page de configuration SMTP (celle que vous m'avez montrée)

---

### Étape 3 : Remplir les Champs

#### Dans "Sender details" :
- **Sender email address** : `emspallons@gmail.com`
- **Sender name** : `EMSP Transport`

#### Dans "SMTP provider settings" :
- **Host** : `smtp.gmail.com` (remplacez `your.smtp.host.com`)
- **Port number** : `587`
- **Username** : `emspallons@gmail.com` (déjà rempli)
- **Password** : ⬇️ **COLLEZ VOTRE APP PASSWORD ICI** ⬇️

---

### Étape 4 : Coller l'App Password

1. Cliquez dans le champ **Password** (celui qui est jaune sur votre capture)
2. **Supprimez** le mot de passe actuel (`@Ems72025§`)
3. **Collez** votre App Password Gmail (les 16 caractères que vous avez copiés)

**Format** :
- Vous pouvez coller avec ou sans espaces
- Exemple : `abcd efgh ijkl mnop` ou `abcdefghijklmnop`
- Les deux fonctionnent !

---

### Étape 5 : Sauvegarder

1. Vérifiez que tous les champs sont corrects :
   ```
   Sender email: emspallons@gmail.com
   Sender name: EMSP Transport
   Host: smtp.gmail.com
   Port: 587
   Username: emspallons@gmail.com
   Password: [Votre App Password collé ici]
   ```

2. Cliquez sur **"Save changes"** (bouton vert en bas à droite)

---

## ✅ C'est Fait !

Une fois sauvegardé, les emails devraient être envoyés automatiquement.

---

## 🧪 Tester

1. Créez un nouvel éducateur dans `/admin/users`
2. Vérifiez que l'email de confirmation est envoyé
3. Vérifiez votre boîte de réception (et les spams)

---

## ❓ Si Vous Ne Trouvez Plus l'App Password

Si vous avez fermé la page et ne voyez plus l'App Password :

1. Allez sur : https://myaccount.google.com/apppasswords
2. Vous verrez la liste de vos App Passwords
3. **⚠️ ATTENTION** : Google ne montre que le mot de passe **une seule fois** lors de la création
4. Si vous ne l'avez pas copié, vous devrez **en créer un nouveau**

---

## 🆘 Problème ?

Si après avoir collé l'App Password et sauvegardé, les emails ne sont toujours pas envoyés :

1. Vérifiez que la **validation en 2 étapes** est bien activée
2. Vérifiez que l'App Password est bien collé (16 caractères)
3. Vérifiez que le **Host** est bien `smtp.gmail.com` (pas `your.smtp.host.com`)
4. Vérifiez que le **Port** est `587` ou `465`

---

**📌 Résumé** : Copiez l'App Password → Collez-le dans le champ Password de Supabase → Sauvegardez → C'est tout !

