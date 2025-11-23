# 🔍 Comment Trouver les Logs d'Erreur Email dans Supabase

## 📍 Vous Êtes dans les Logs - Maintenant Trouvons les Erreurs

### Étape 1 : Changer de Collection

Dans la sidebar gauche, vous voyez **"COLLECTIONS"**.

**Cliquez sur** : **"Auth"** (pour les logs d'authentification/email)

OU

**Cliquez sur** : **"Edge Functions"** (pour les logs de l'Edge Function `create-user`)

---

### Étape 2 : Chercher les Erreurs Email

#### Option A : Logs Auth (Recommandé)

1. **Cliquez sur "Auth"** dans la sidebar
2. **Dans l'éditeur de requête**, remplacez la requête par :

```sql
select
  cast(timestamp as datetime) as timestamp,
  event_message,
  metadata
from edge_logs
where event_message like '%email%' 
   or event_message like '%SMTP%'
   or event_message like '%confirmation%'
order by timestamp desc
limit 20
```

3. **Cliquez sur "Run ▷"** (bouton vert)

#### Option B : Logs Edge Functions

1. **Cliquez sur "Edge Functions"** dans la sidebar
2. **Dans l'éditeur de requête**, remplacez par :

```sql
select
  cast(timestamp as datetime) as timestamp,
  event_message,
  metadata
from edge_logs
where event_message like '%create-user%'
   or event_message like '%email%'
order by timestamp desc
limit 20
```

3. **Cliquez sur "Run ▷"**

---

### Étape 3 : Lire les Erreurs

**Cherchez dans les résultats** :
- Messages contenant `error`, `failed`, `SMTP`, `email`
- Regardez la colonne `event_message` et `metadata`

**Erreurs possibles** :
- `SMTP authentication failed`
- `Invalid credentials`
- `Connection timeout`
- `Error sending confirmation email`
- `Sender email not verified`

---

## 🔍 Alternative : Logs Edge Functions (Plus Simple)

### Méthode Directe

1. **Dans la sidebar**, cliquez sur **"Edge Functions"**
2. **Dans l'éditeur**, tapez :

```sql
select *
from edge_logs
where function_name = 'create-user'
order by timestamp desc
limit 10
```

3. **Cliquez sur "Run ▷"**

**Cela vous montrera** tous les logs de l'Edge Function qui crée les utilisateurs, y compris les erreurs d'email.

---

## 📝 Ce Que Je Dois Voir

**Copiez-moi** :
1. Les **dernières lignes** de `event_message` qui contiennent `error` ou `email`
2. Le contenu de `metadata` (s'il y a des détails d'erreur)

**Exemple de ce que je cherche** :
```
event_message: "Error sending confirmation email"
metadata: { "error": "SMTP authentication failed", ... }
```

---

## 🎯 Action Immédiate

1. **Cliquez sur "Auth"** dans la sidebar
2. **Remplacez la requête** par celle de l'Option A ci-dessus
3. **Cliquez sur "Run ▷"**
4. **Regardez les résultats** et copiez-moi les erreurs que vous voyez

---

**Une fois que vous avez les erreurs, donnez-les moi et je vous dirai exactement comment les corriger !**








