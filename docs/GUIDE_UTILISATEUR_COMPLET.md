# 📖 Guide Utilisateur Complet - EMSP Transport Scolaire

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Connexion et Authentification](#connexion-et-authentification)
3. [Tableau de bord](#tableau-de-bord)
4. [Gestion des étudiants](#gestion-des-étudiants)
5. [Gestion des paiements](#gestion-des-paiements)
6. [Scanner QR Code](#scanner-qr-code)
7. [Cartes étudiantes](#cartes-étudiantes)
8. [Rappels automatiques](#rappels-automatiques)
9. [Bilans et rapports](#bilans-et-rapports)
10. [Administration](#administration)
11. [Fonctionnalités avancées](#fonctionnalités-avancées)
12. [FAQ](#faq)

---

## 🎯 Introduction

La plateforme EMSP Transport Scolaire est un système complet de gestion de transport scolaire permettant de :

- ✅ Gérer les étudiants et leurs informations
- ✅ Enregistrer et suivre les paiements
- ✅ Générer et scanner des QR codes de transport
- ✅ Créer et imprimer des cartes étudiantes
- ✅ Envoyer des rappels automatiques par WhatsApp
- ✅ Générer des bilans et rapports mensuels
- ✅ Administrer la plateforme complètement

---

## 🔐 Connexion et Authentification

### Premier accès

1. Accédez à l'URL de l'application
2. Cliquez sur "Se connecter"
3. Entrez votre email et mot de passe
4. Si vous n'avez pas de compte, contactez un administrateur

### Types de comptes

**👑 Administrateur (Admin)**
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs, contrôleurs, classes, niveaux
- Configuration des prix et lignes
- Réinitialisation de la base de données
- Consultation de tous les logs d'activité

**👨‍🏫 Éducateur (Educator)**
- Gestion des étudiants et paiements
- Génération de rapports
- Consultation de l'historique des scans
- Envoi de rappels manuels

**🎫 Contrôleur (Controller)**
- Accès uniquement au scanner QR Code
- Authentification par code personnel
- Consultation de son propre historique

---

## 📊 Tableau de bord

### Vue d'ensemble

Le tableau de bord affiche :
- **Statistiques en temps réel** : Total étudiants, actifs, en retard, expirés
- **Graphiques** : Évolution des paiements, répartition par ligne, scans par heure
- **Actions rapides** : Ajouter étudiant, enregistrer paiement, scanner QR
- **Activités récentes** : Derniers paiements, scans, rappels

### Actions rapides

1. **Ajouter un étudiant** : Cliquez sur le bouton "Ajouter un étudiant"
2. **Enregistrer un paiement** : Cliquez sur "Enregistrer un paiement"
3. **Générer un rapport** : Cliquez sur "Générer un rapport"
4. **Scanner QR Code** : Cliquez sur "Scanner QR Code"

---

## 👥 Gestion des étudiants

### Créer un étudiant

1. Allez dans **"Étudiants"** dans le menu
2. Cliquez sur **"Ajouter un étudiant"**
3. Remplissez le formulaire :
   - **Nom*** : Nom de l'étudiant (obligatoire)
   - **Prénom** : Prénom de l'étudiant
   - **Contact*** : Numéro de téléphone (obligatoire)
   - **Classe*** : Sélectionnez la classe (obligatoire)
   - **Niveau*** : Sélectionnez le niveau (obligatoire)
   - **Ligne*** : Sélectionnez la ligne de bus (obligatoire)
   - **Point de ramassage** : Lieu de ramassage
   - **Tuteur** : Nom du tuteur

4. Cliquez sur **"Créer l'étudiant"**
5. Un QR code est généré automatiquement

### Modifier un étudiant

1. Trouvez l'étudiant dans la liste
2. Cliquez sur **"Modifier"**
3. Modifiez les informations nécessaires
4. Cliquez sur **"Sauvegarder"**

### Rechercher et filtrer

**Recherche** :
- Tapez dans la barre de recherche (nom, prénom, contact)
- La recherche est en temps réel

**Filtres** :
- **Ligne** : Filtre par ligne de bus
- **Statut** : ACTIF, EN_RETARD, EXPIRE, HORS_SERVICE
- **Classe** : Filtre par classe
- **Niveau** : Filtre par niveau

**Tabs de statut** :
- Cliquez sur les tabs en haut pour filtrer rapidement par statut

### Statistiques

En haut de la page, vous voyez :
- **Total** : Nombre total d'étudiants
- **Actifs** : Étudiants avec paiement valide
- **En retard** : Étudiants en période de grâce
- **Expirés** : Étudiants avec paiement expiré

### Actions sur un étudiant

1. **Modifier** : Éditer les informations
2. **Payer** : Enregistrer un paiement
3. **Voir QR** : Afficher le QR code
4. **Carte** : Générer et imprimer la carte étudiante
5. **Supprimer** : Supprimer l'étudiant (avec confirmation)

### Import/Export

**Importer des étudiants** :
1. Cliquez sur **"Importer"**
2. Sélectionnez un fichier Excel (.xlsx) ou CSV (.csv)
3. Format requis : Nom, Prénom, Contact, Classe, Niveau, Ligne
4. Cliquez sur **"Importer"**

**Exporter des étudiants** :
1. Cliquez sur **"Exporter"**
2. Le fichier Excel sera téléchargé automatiquement

---

## 💰 Gestion des paiements

### Enregistrer un paiement

1. Allez dans **"Paiements"** ou cliquez sur **"Payer"** depuis la liste des étudiants
2. Sélectionnez l'étudiant (si non sélectionné)
3. Remplissez le formulaire :
   - **Nombre de mois** : 1, 2, 3, 5, 6 ou 12 mois
   - **Mois de début** : Date de début du paiement
   - **Paiement anticipé** : Cocher si le paiement concerne des mois futurs

4. Le système calcule automatiquement :
   - **Montant total** : Nombre de mois × Prix mensuel
   - **Date de fin** : Date d'expiration
   - **Périodes couvertes** : Liste des mois payés (format français : "novembre 2026", "décembre 2026")

5. Vérifiez le résumé
6. Cliquez sur **"Enregistrer le paiement"**
7. Un reçu PDF sera généré automatiquement
8. Un message WhatsApp de confirmation sera envoyé automatiquement (si configuré)

### Calcul automatique des prix

Le système calcule automatiquement le prix en fonction de :
- **Prix par défaut** : Prix mensuel standard (12 500 FCFA)
- **Prix par niveau** : Prix personnalisé par niveau (si configuré)
- **Prix par ligne** : Prix personnalisé par ligne (si configuré)

Le prix le plus spécifique est utilisé en priorité.

### Mois hors service

Si des mois sont configurés comme "hors service" :
- Ils sont automatiquement exclus du calcul
- L'abonnement est décalé pour couvrir le nombre de mois actifs demandés
- Un avertissement s'affiche dans le résumé

### Historique des paiements

Dans la page **"Paiements"** :
- Voir tous les paiements enregistrés
- Filtrer par étudiant, date, montant
- Télécharger les reçus PDF
- Voir les détails de chaque paiement

### Formats français

Toutes les dates et périodes sont affichées en français :
- **Mois** : "novembre 2026" au lieu de "2026-11"
- **Périodes couvertes** : "novembre 2026 à décembre 2026"
- **Sessions futures** : "janvier 2026, février 2026, mars 2026"

---

## 📱 Scanner QR Code

### Pour les contrôleurs

1. Accédez à la page **"Scanner QR"**
2. Entrez votre **code contrôleur** (4 chiffres)
3. Autorisez l'accès à la caméra si demandé
4. Scannez le QR code de l'étudiant
5. Le système vérifie automatiquement :
   - ✅ Validité du QR code
   - ✅ Statut de paiement (ACTIF)
   - ✅ Ligne correspondante
   - ✅ Doublons (scan déjà effectué aujourd'hui)

6. Un message s'affiche :
   - ✅ **Vert** : Accès autorisé
   - ⚠️ **Orange** : Doublon ou avertissement
   - ❌ **Rouge** : Accès refusé (expiré, mauvaise ligne, etc.)

7. Le scan est enregistré automatiquement

### Vérifications automatiques

**Accès autorisé** ✅ :
- QR code valide et actif
- Paiement ACTIF
- Ligne correspondante
- Pas de scan dupliqué aujourd'hui

**Doublon détecté** ⚠️ :
- L'étudiant a déjà été scanné aujourd'hui
- Message d'avertissement affiché
- Le scan est quand même enregistré

**Accès refusé** ❌ :
- **QR Code invalide** : QR code révoqué ou inexistant
- **Paiement expiré** : L'étudiant n'a pas de paiement valide
- **Mauvaise ligne** : L'étudiant n'est pas sur cette ligne
- **Statut incorrect** : L'étudiant n'est pas ACTIF

### Historique des scans

**Pour les contrôleurs** :
- Consultez votre historique dans **"Mon historique"**
- Voir vos scans du jour
- Filtres par date, statut, étudiant

**Pour les admins/éducateurs** :
- Consultez l'historique complet dans **"Administration" → "Historique des scans"**
- Statistiques détaillées :
  - Total des scans
  - Scans approuvés
  - Doublons détectés
  - Accès refusés
  - Mauvaise ligne
- Export CSV disponible
- Filtres avancés : Date, contrôleur, étudiant, statut

---

## 🎴 Cartes étudiantes

### Générer une carte

1. Allez dans **"Étudiants"**
2. Cliquez sur **"Carte"** pour l'étudiant souhaité
3. La carte s'affiche avec :
   - **Recto** : Photo, nom, prénom, classe, niveau, ligne
   - **Verso** : QR code, informations de contact

### Actions disponibles

1. **Télécharger (PNG)** : Télécharge la carte en image PNG haute résolution
2. **Imprimer** : Ouvre la fenêtre d'impression avec format optimisé
3. **Envoyer par WhatsApp** : Ouvre WhatsApp avec un message prérempli et la possibilité de partager la carte
4. **Régénérer QR** : Génère un nouveau QR code (l'ancien est automatiquement révoqué)
5. **Révoquer QR** : Révoque le QR code actuel (ne peut plus être utilisé)

### Impression

**Format recommandé** :
- 2 cartes par page A4
- Découper selon les repères de découpe
- Plastifier pour une meilleure durabilité

### Envoi par WhatsApp

1. Cliquez sur **"Envoyer par WhatsApp"**
2. WhatsApp Web s'ouvre avec un message prérempli :
   ```
   Carte étudiante - [Nom] [Prénom]

   Classe: [Classe]
   Niveau: [Niveau]
   Ligne: [Ligne]

   Merci de présenter cette carte lors du contrôle.
   ```
3. Partagez manuellement l'image de la carte depuis la page

---

## 📲 QR Code - Affichage et envoi

### Afficher le QR code

1. Allez dans **"Étudiants"**
2. Cliquez sur **"Voir QR"** pour l'étudiant
3. Le QR code s'affiche avec :
   - Code QR visuel
   - Statut (Actif ou Révoqué)
   - Token de sécurité (partiellement masqué)
   - ID de l'étudiant

### Actions sur le QR code

1. **Télécharger** : Télécharge le QR code en image PNG
2. **Imprimer** : Imprime le QR code
3. **Envoyer par WhatsApp** : 
   - Ouvre WhatsApp avec un message prérempli :
     ```
     Bonjour [Prénom] [Nom],

     🎫 Votre QR Code de transport EMSP

     Présentez ce code au contrôleur lors de l'embarquement.

     📅 Valide jusqu'au : [mois en français, ex: novembre 2026]

     ⚠️ En cas de perte, contactez l'administration.

     École EMSP
     ```
   - Partagez manuellement le QR code depuis la page
4. **Révoquer** : Révoque le QR code (ne peut plus être utilisé)
5. **Régénérer** : Génère un nouveau QR code (l'ancien est automatiquement révoqué)

### Format de la période de validité

La période de validité est affichée en français :
- Exemple : **"novembre 2026"** au lieu de "2026-11"
- Basé sur le dernier mois payé dans `months_ledger`

---

## 🔔 Rappels automatiques

### Configuration des rappels

**Pour les admins** :
1. Allez dans **"Administration" → "Rappels"**
2. Configurez :
   - **Activer les rappels automatiques** : Active/désactive les rappels
   - **Jours avant expiration** : Nombre de jours avant d'envoyer le rappel (ex: 7 jours)
   - **Heure d'envoi** : Heure à laquelle envoyer les rappels (ex: 09:00)
   - **Message personnalisé** : Message à envoyer (avec variables disponibles)

3. Cliquez sur **"Sauvegarder la configuration"**

### Envoi manuel

1. Allez dans **"Rappels"**
2. Sélectionnez les étudiants à qui envoyer des rappels
3. Filtrez par statut si nécessaire
4. Cliquez sur **"Envoyer les rappels sélectionnés"**
5. Un message WhatsApp sera envoyé à chaque étudiant sélectionné

### Historique des rappels

- Consultez l'historique dans **"Rappels" → "Historique"**
- Voir tous les rappels envoyés (automatiques et manuels)
- Filtrer par date, étudiant, type (automatique/manuel)

### Messages WhatsApp automatiques

Les messages incluent automatiquement :
- Nom et prénom de l'étudiant
- Montant dû
- Date d'expiration (format français)
- Informations de contact de l'école

---

## 📊 Bilans et rapports

### Générer un bilan mensuel

1. Allez dans **"Rapports"**
2. Sélectionnez :
   - **Mois** : Mois du bilan (format : novembre 2026)
   - **Ligne** : Ligne de bus (ou "Toutes" pour toutes les lignes)
   - **Format** : CSV ou Excel

3. Cliquez sur **"Générer et visualiser"**
4. Le bilan est généré et affiché avec :
   - **Statistiques** : Total étudiants, taux de recouvrement, revenus
   - **Graphiques** : Répartition par statut, graphiques financiers
   - **Tableau détaillé** : Liste de tous les étudiants avec leurs informations

### Visualisation graphique

Les graphiques affichent :
- **Répartition par statut** : Bar chart horizontal (ACTIF, EN_RETARD, EXPIRE)
- **Vue d'ensemble mensuelle** : Pie chart (simplifié)
- **Statistiques financières** :
  - Total encaissé ce mois
  - Total encaissé (historique)
  - Taux de recouvrement
  - Revenus mensuels moyens

### Export du bilan

1. Après génération, cliquez sur **"Exporter"**
2. Choisissez le format :
   - **CSV** : Fichier `.csv` (ex: `Bilan_novembre 2026_15-11-2025.csv`)
   - **Excel** : Fichier `.xlsx` (ex: `Bilan_novembre 2026_15-11-2025.xlsx`)

3. Le fichier est téléchargé automatiquement avec :
   - **Nom du fichier** : Format français (ex: "novembre 2026")
   - **Date d'export** : Format français (ex: "15-11-2025")
   - **Données** : Tous les étudiants avec leurs informations détaillées
   - **Totaux** : Section récapitulative avec statistiques

### Données incluses dans le bilan

Pour chaque étudiant :
- Numéro étudiant
- Nom complet
- Classe et niveau
- Ligne
- Contact
- Statut au mois X
- Dernière date de paiement
- Montant du dernier paiement
- Mois couverts (format français : "novembre 2026 à décembre 2026")
- Paiement anticipé (Oui/Non)
- Sessions futures (format français : "janvier 2026, février 2026")
- Montant total payé

### Totaux calculés

- **Total étudiants** : Nombre total d'étudiants
- **Étudiants actifs** : Nombre d'étudiants avec statut ACTIF
- **Étudiants en retard** : Nombre d'étudiants avec statut EN_RETARD
- **Étudiants expirés** : Nombre d'étudiants avec statut EXPIRE
- **Total encaissé ce mois** : Montant total des paiements effectués ce mois
- **Total encaissé (historique)** : Montant total de tous les paiements
- **Taux de recouvrement** : Pourcentage d'étudiants actifs

---

## ⚙️ Administration

### Gestion des utilisateurs

**Créer un éducateur** :
1. Allez dans **"Administration" → "Utilisateurs"**
2. Cliquez sur **"Créer un éducateur"**
3. Remplissez :
   - Email (utilisé pour connexion)
   - Nom
   - Prénom
   - Mot de passe initial
4. Cliquez sur **"Créer"**

**Modifier/Supprimer** :
- Utilisez les actions sur chaque ligne du tableau

### Gestion des contrôleurs

**Créer un contrôleur** :
1. Allez dans **"Administration" → "Contrôleurs"** (ou **"Contrôleurs"** dans le menu)
2. Cliquez sur **"Ajouter un contrôleur"**
3. Remplissez :
   - Nom
   - Prénom
   - Code contrôleur (4 chiffres, utilisé pour authentification)
   - Ligne assignée
4. Cliquez sur **"Créer"**

**Réinitialiser les scans du jour** :
- Cliquez sur **"Réinitialiser les scans d'aujourd'hui"**
- Supprime tous les scans du contrôleur actif pour aujourd'hui (utile pour tester)

### Gestion des classes

1. Allez dans **"Administration" → "Classes"**
2. **Créer** : Ajoutez une nouvelle classe
3. **Modifier** : Modifiez une classe existante
4. **Supprimer** : Supprimez une classe (avec vérification)

### Gestion des niveaux (Admin uniquement)

1. Allez dans **"Administration" → "Niveaux"**
2. **Créer** : Ajoutez un nouveau niveau
3. **Modifier** : Modifiez un niveau existant
4. **Supprimer** : Supprimez un niveau

### Gestion des lignes (Admin uniquement)

1. Allez dans **"Paramètres" → "Lignes"**
2. **Créer** : Ajoutez une nouvelle ligne avec :
   - Nom de la ligne
   - Couleur (pour affichage visuel)
   - Statut (Active/Inactive)
3. **Modifier** : Modifiez une ligne existante
4. **Supprimer** : Supprimez une ligne (si aucune assignation)

### Gestion des prix (Admin uniquement)

1. Allez dans **"Paramètres" → "Prix"**
2. **Prix par défaut** : Configurez le prix mensuel standard
3. **Prix par niveau** : Configurez des prix personnalisés par niveau
4. **Prix par ligne** : Configurez des prix personnalisés par ligne
5. **Historique** : Consultez l'historique des modifications de prix

### Mois hors service (Admin uniquement)

1. Allez dans **"Paramètres" → "Mois hors service"**
2. Ajoutez des mois qui seront exclus des calculs de paiement :
   - Exemple : Vacances d'été, congés, etc.
3. Format : "2026-07" (année-mois)
4. Ces mois seront automatiquement exclus lors des paiements

### Historique des activités (Admin uniquement)

1. Allez dans **"Administration" → "Historique des activités"**
2. Consultez toutes les actions effectuées sur la plateforme :
   - Création, modification, suppression
   - Par utilisateur, type d'entité, date
3. Filtres disponibles : Date, utilisateur, type d'action, entité

### Réinitialisation de la base de données (Admin uniquement)

⚠️ **ATTENTION : Action irréversible et très dangereuse !**

1. Allez dans **"Administration" → "Zone Dangereuse"**
2. Cliquez sur **"Réinitialiser tout"**
3. **Étape 1** : Créez un backup automatique (fichier JSON téléchargé)
4. **Étape 2** : Confirmez en tapant exactement : **"RÉINITIALISER TOUT"**
5. Cliquez sur **"Réinitialiser tout"**

**Ce qui est supprimé** :
- ✗ Tous les étudiants
- ✗ Tous les paiements
- ✗ Tous les contrôleurs
- ✗ Tous les logs de scan
- ✗ Toutes les classes et niveaux
- ✗ Tous les historiques

**Ce qui est préservé** :
- ✅ Comptes administrateurs
- ✅ Lignes par défaut (Yopougon, Angré / Bingerville, Abobo)
- ✅ Paramètres globaux

**Sécurité** :
- Backup automatique créé avant suppression
- Confirmation textuelle obligatoire
- Logs d'activité enregistrés
- Seuls les admins peuvent accéder

---

## 🚀 Fonctionnalités avancées

### Synchronisation temps réel

La plateforme utilise la synchronisation temps réel Supabase :
- ✅ Mises à jour automatiques sans rechargement
- ✅ Indicateurs de présence ("En ligne")
- ✅ Notifications collaboratives (quand quelqu'un modifie un étudiant)
- ✅ Badges "En cours d'édition"

### Format français partout

Toutes les dates et périodes sont affichées en français :
- **Mois** : "novembre 2026" au lieu de "2026-11"
- **Dates** : "15 novembre 2025" au lieu de "2025-11-15"
- **Périodes** : "novembre 2026 à décembre 2026"
- **Listes** : "janvier 2026, février 2026, mars 2026"

### Envoi WhatsApp

**Cartes étudiantes** :
- Ouvre WhatsApp avec un message prérempli
- Partagez la carte manuellement depuis la page

**QR Codes** :
- Ouvre WhatsApp avec un message prérempli
- Inclut la période de validité en français
- Partagez le QR code manuellement depuis la page

**Paiements** :
- Message automatique de confirmation après paiement
- Inclut les détails du paiement (montant, périodes couvertes)

**Rappels** :
- Messages automatiques avant expiration
- Messages manuels pour rappeler les paiements

### Export et import

**Export** :
- **Étudiants** : Format Excel/CSV
- **Bilans** : Format Excel/CSV avec format français pour les dates
- **Historique des scans** : Format CSV

**Import** :
- **Étudiants** : Format Excel/CSV
- Validation automatique des données
- Gestion des erreurs avec messages clairs

### Génération PDF

- **Reçus de paiement** : Générés automatiquement après chaque paiement
- **Cartes étudiantes** : Format d'impression optimisé

---

## ❓ FAQ

### Comment changer mon mot de passe ?

1. Allez dans **"Profil"** (menu utilisateur)
2. Cliquez sur **"Changer le mot de passe"**
3. Entrez votre nouveau mot de passe
4. Confirmez

### Comment ajouter plusieurs mois de paiement à la fois ?

Dans le formulaire de paiement :
- Sélectionnez le **nombre de mois** (jusqu'à 12 mois)
- Le système calcule automatiquement le montant total
- Les mois hors service sont automatiquement exclus

### Que faire si un QR code est perdu ou volé ?

1. Allez dans la fiche de l'étudiant
2. Cliquez sur **"Voir QR"**
3. Cliquez sur **"Révoquer"** pour désactiver l'ancien QR code
4. Cliquez sur **"Régénérer"** pour créer un nouveau QR code

### Comment voir quels étudiants doivent payer ?

1. Allez dans **"Étudiants"**
2. Cliquez sur le tab **"Expirés"** ou **"En retard"**
3. Ou utilisez le filtre de statut

### Comment envoyer des rappels à plusieurs étudiants ?

1. Allez dans **"Rappels"**
2. Utilisez les filtres pour trouver les étudiants concernés
3. Cochez les cases des étudiants à qui envoyer
4. Cliquez sur **"Envoyer les rappels sélectionnés"**

### Le scan indique "Doublon détecté", que faire ?

Cela signifie que l'étudiant a déjà été scanné aujourd'hui. C'est normal pour :
- Vérification de sécurité
- Statistiques
- Le scan est quand même enregistré

### Comment imprimer les cartes étudiantes en série ?

1. Allez dans **"Étudiants"**
2. Utilisez les filtres pour sélectionner les étudiants concernés
3. Ouvrez chaque carte et imprimez-la
4. Format : 2 cartes par page A4

### Comment changer le prix mensuel pour tous les étudiants ?

1. Allez dans **"Paramètres" → "Prix"** (Admin uniquement)
2. Modifiez le **prix par défaut**
3. Les nouveaux paiements utiliseront ce prix
4. Les paiements existants ne sont pas affectés

### Comment exclure certains mois des paiements (vacances) ?

1. Allez dans **"Paramètres" → "Mois hors service"** (Admin uniquement)
2. Ajoutez les mois à exclure (ex: "2026-07" pour juillet 2026)
3. Les paiements futurs excluront automatiquement ces mois

### Comment voir l'historique complet d'un étudiant ?

1. Allez dans **"Étudiants"**
2. Cliquez sur un étudiant pour voir ses détails
3. Ou consultez **"Paiements"** et filtrez par étudiant

### Que faire si un contrôleur oublie son code ?

1. Allez dans **"Administration" → "Contrôleurs"** (Admin)
2. Trouvez le contrôleur
3. Cliquez sur **"Modifier"**
4. Modifiez ou réinitialisez le code

### Comment exporter les données pour un mois spécifique ?

1. Allez dans **"Rapports"**
2. Sélectionnez le mois souhaité
3. Cliquez sur **"Générer et visualiser"**
4. Cliquez sur **"Exporter"** (CSV ou Excel)

### Le message WhatsApp ne s'envoie pas automatiquement, pourquoi ?

- Vérifiez la configuration WhatsApp dans **"Administration" → "Rappels"**
- Vérifiez que le numéro de contact de l'étudiant est correct
- Les messages WhatsApp peuvent nécessiter une configuration serveur

### Comment voir qui a modifié quoi et quand ?

1. Allez dans **"Administration" → "Historique des activités"** (Admin)
2. Filtrez par date, utilisateur, type d'action
3. Consultez les détails de chaque action

---

## 📞 Support

Pour toute question ou problème :

1. Consultez ce guide
2. Consultez la documentation technique dans `/docs`
3. Vérifiez les logs dans la console du navigateur (F12)
4. Contactez un administrateur

---

## 🎉 Fonctionnalités récentes

### Format français partout
- Toutes les dates et périodes affichées en français
- Noms de fichiers d'export en français
- Messages WhatsApp avec dates en français

### Envoi WhatsApp amélioré
- Cartes étudiantes envoyables par WhatsApp
- QR codes envoyables par WhatsApp
- Messages avec période de validité en français

### Bilans graphiques
- Visualisation graphique des bilans mensuels
- Graphiques interactifs (bar chart, pie chart)
- Statistiques financières détaillées

### Réinitialisation sécurisée
- Backup automatique avant réinitialisation
- Confirmation textuelle obligatoire
- Logs d'activité complets

---

**Version du guide** : 1.0  
**Dernière mise à jour** : 2025

