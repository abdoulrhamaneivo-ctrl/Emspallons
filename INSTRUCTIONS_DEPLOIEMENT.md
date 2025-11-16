# 📋 INSTRUCTIONS RAPIDES DE DÉPLOIEMENT

## 🚀 Déploiement Vercel (Recommandé)

### Option 1 : Script Automatique

```bash
./deploy.sh
```

### Option 2 : Manuel

1. **Connectez-vous à Vercel** (si pas déjà fait) :
```bash
vercel login
```

2. **Déployez** :
```bash
vercel --prod
```

3. **Répondez aux questions** :
   - Set up and deploy? → **Y**
   - Which scope? → Sélectionnez votre compte
   - Link to existing project? → **N** (première fois)
   - Project name? → **emsp-transport**
   - Directory? → **./** (par défaut)

4. **Configurez les variables d'environnement** dans Vercel Dashboard :
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez votre projet
   - Settings → Environment Variables
   - Ajoutez :
     - `VITE_SUPABASE_URL` = votre URL Supabase
     - `VITE_SUPABASE_ANON_KEY` = votre clé anon Supabase
   - Sélectionnez : Production, Preview, Development
   - Cliquez sur "Save"

5. **Redéployez** (si vous avez ajouté des variables) :
```bash
vercel --prod
```

---

## 🗄️ Migrations SQL (OBLIGATOIRE)

Avant que l'application fonctionne, vous DEVEZ appliquer les migrations SQL dans Supabase :

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. SQL Editor
4. Exécutez les migrations dans cet ordre (voir `DEPLOIEMENT.md`) :

```
1. schema.sql
2. enable_realtime.sql
3. create_reminders_system.sql
4. create_price_history_table.sql
5. create_user_presence.sql
6. create_editing_locks.sql
7. create_activity_logs_table.sql
8. create_classes_promotions.sql
9. add_controller_password.sql
10. enable_rls_missing_tables.sql
11. fix_profiles_rls_policies.sql
12. fix_scan_logs_rls_policies.sql
13. create_reset_function.sql
14. update_calculate_payment_status_for_future_sessions.sql
```

**Voir `supabase/migrations/ORDRE_DEPLOIEMENT.sql` pour les détails.**

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées dans `.env.local`
- [ ] Build de production réussi (`npm run build`)
- [ ] Migrations SQL appliquées dans Supabase
- [ ] Déploiement sur Vercel réussi
- [ ] Variables d'environnement configurées dans Vercel Dashboard
- [ ] Application testée en production
- [ ] HTTPS vérifié
- [ ] Domain personnalisé configuré (optionnel)

---

## 🆘 Dépannage

### Build échoue
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Variables d'environnement non prises en compte
- Vérifiez qu'elles sont bien dans Vercel Dashboard
- Redéployez : `vercel --prod`

### Erreur RLS dans l'application
- Vérifiez que toutes les migrations SQL sont appliquées
- Vérifiez les politiques RLS dans Supabase Dashboard

---

**Questions ?** Consultez `DEPLOIEMENT.md` ou `AUDIT_COMPLET.md`

