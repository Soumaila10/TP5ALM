# Livrables ALM & DevOps — FIFA Ticketing Hub 2026
**Projet Master 2 ALM (ESN AST) — Mai 2026**

---

## 1. Fiche de Cadrage du Projet

### 1.1 Titre du Projet
**FIFA Ticketing Hub 2026** - Plateforme de billetterie en ligne temps réel pour la Coupe du Monde de la FIFA 2026.

### 1.2 Description Générale
FIFA Ticketing Hub 2026 est une application web moderne conçue pour permettre aux supporters du monde entier de consulter le calendrier des matchs de la Coupe du Monde de la FIFA 2026, de sélectionner leurs places sur un plan de stade interactif, de réserver temporairement leurs billets et de finaliser l'achat de manière sécurisée en ligne. Le système met l'accent sur les performances temps réel, l'équité de la vente et une haute résilience face aux fortes charges d'affluence.

### 1.3 Problème Résolu
Lors des ventes de billets pour de grands événements sportifs, des dizaines de milliers d'utilisateurs accèdent simultanément aux mêmes sièges. Deux problèmes majeurs se posent :
1. **La double réservation (Double Booking)** : Deux acheteurs paient en même temps et se voient attribuer le même siège, ce qui engendre des frustrations clients et des litiges juridiques complexes.
2. **La congestion de la base de données relationnelle** : L'utilisation de transactions SQL verrouillantes et prolongées pour conserver les paniers des utilisateurs sature les connexions de la base de données, menant à des plantages généraux (Denial of Service involontaire).

### 1.4 Valeur Apportée
- **Pour l'utilisateur (Supporter)** : Expérience d'achat fluide, sans friction, avec une garantie de 10 minutes pour entrer ses informations bancaires après avoir sélectionné son siège, et confirmation immédiate avec billet PDF et QR Code.
- **Pour l'organisateur (FIFA)** : Garantie d'équité (un billet = un acheteur), réduction des frais opérationnels liés aux litiges de double-achat, et infrastructure scalable capable de supporter les pics de trafic lors de l'ouverture des ventes.

### 1.5 Parties Prenantes
- **FIFA (Commanditaire)** : Propriétaire de l'événement et garant de la conformité réglementaire et de la réputation de la billetterie.
- **ESN AST / Équipe ALM (Réalisateur)** : Équipe de conception, de développement, de déploiement et de maintenance.
- **Supporters (Utilisateurs finaux)** : Clients achetant les billets.
- **Administrateurs FIFA (Opérateurs)** : Gestionnaires du catalogue des matchs, des tarifs, et superviseurs des rapports de vente.

### 1.6 Périmètre Fonctionnel (In-Scope)
- **Authentification forte 2FA** : Inscription et connexion sécurisée par double facteur avec code OTP envoyé par email.
- **Catalogue de matchs** : Consultation dynamique des 48 matchs réels de la FIFA 2026 avec filtres par date, équipe et stade.
- **Plan de stade interactif (SeatMap)** : Sélection visuelle des sièges catégorisés (A, B, C) avec affichage du statut en temps réel (disponible, verrouillé, vendu).
- **Verrouillage temporaire distribué** : Réservation de 10 minutes d'un siège gérée via un verrou Redis à expiration automatique (TTL).
- **Paiement en ligne sécurisé** : Intégration de Stripe (sandbox) avec validation asynchrone par Webhook.
- **Génération et livraison de billets** : Création automatique de billets au format PDF intégrant un QR Code unique, hébergement sécurisé et envoi par email.
- **Espace utilisateur** : Historique des commandes et gestion du profil.
- **Portail d'administration** : CRUD des matchs, tableau de bord des statistiques de vente en temps réel et export de rapports au format CSV.

### 1.7 Hors Périmètre (Out-of-Scope)
- **Revente de billets (Bourse d'échange)** : Pas de fonctionnalité intégrée de revente entre particuliers sur la plateforme.
- **Intégration d'autres passerelles de paiement (PayPal, etc.)** : Stripe est l'unique passerelle validée.
- **Gestion des transports ou d'hôtels** : Aucun package de voyage n'est proposé.
- **Support client par chat en direct** : L'assistance s'effectue hors-ligne ou par formulaire d'assistance classique.

### 1.8 Contraintes Techniques et Légales
- **Technologies imposées** : React/Vite/Tailwind (Frontend), Node.js/Express (Backend), Cosmos DB/Mongoose (Base SQL/NoSQL), Upstash Redis (Cache & Lock), GitHub Actions (CI/CD), Azure (Hébergement).
- **Contraintes de sécurité** : Aucun stockage de JWT en `localStorage` (obligation d'utiliser des cookies `httpOnly` sécurisés). Pas de stockage de données bancaires sensibles (gestion totale par Stripe PCI-DSS).
- **Contraintes légales (RGPD)** : Droit à l'oubli (purge des données après inactivité ou sur demande), sécurisation des transferts, chiffrement des données personnelles au repos.
- **Finances** : Ce projet est réalisé dans un cadre académique sans contraintes financières réelles, exploitant les offres gratuites (Tiers gratuit Azure, Upstash Redis gratuit, Stripe test).

---

## 2. Backlog du Projet (Product Backlog)

Le backlog est structuré selon la méthodologie agile et priorisé selon l'échelle **MoSCoW** (Must Have, Should Have, Could Have, Won't Have).

### 2.1 Tableau du Product Backlog (21 User Stories)

| ID | Catégorie | Rôle | Action (Je veux...) | Bénéfice (Afin de...) | MoSCoW |
|---|---|---|---|---|---|
| **US-01** | Auth | Supporter | M'inscrire avec mes informations personnelles | Créer un compte sur la plateforme. | **Must** |
| **US-02** | Auth | Supporter | Me connecter avec mot de passe et un code OTP reçu par email | Garantir la sécurité de mon compte avec un double facteur. | **Must** |
| **US-03** | Catalogue | Supporter | Consulter le calendrier complet des matchs de la FIFA 2026 | Choisir les rencontres auxquelles je souhaite assister. | **Must** |
| **US-04** | Panier | Supporter | Sélectionner un siège libre sur un plan de stade interactif | L'ajouter à mon panier pour l'acheter. | **Must** |
| **US-05** | Panier | Supporter | Bénéficier d'un verrou automatique de 10 minutes sur mon siège | Saisir mes informations de paiement sans risquer de me faire devancer. | **Must** |
| **US-06** | Panier | Supporter | Visualiser un compte à rebours précis sur l'écran | Connaître le temps restant avant la libération de mon panier. | **Must** |
| **US-07** | Paiement | Supporter | Payer par carte bancaire de manière sécurisée via Stripe | Valider définitivement ma commande de billets. | **Must** |
| **US-08** | Billet | Supporter | Recevoir mes billets PDF contenant un QR Code par email | Les présenter sur mon smartphone à l'entrée du stade. | **Must** |
| **US-09** | Commandes | Supporter | Accéder à l'historique de mes commandes de billets | Suivre mes achats passés et télécharger à nouveau mes billets. | **Must** |
| **US-10** | Admin | Administrateur | Créer, modifier ou désactiver un match dans le catalogue | Tenir à jour le calendrier officiel des rencontres. | **Must** |
| **US-11** | Catalogue | Supporter | Filtrer les matchs par équipe, stade ou date | Trouver rapidement le match qui m'intéresse. | **Should** |
| **US-12** | Profil | Supporter | Modifier les informations de mon profil (nom, prénom, téléphone) | Maintenir mes données à jour dans la base. | **Should** |
| **US-13** | Paiement | Supporter | Recevoir un email récapitulatif avec facture après mon achat | Garder une preuve d'achat écrite. | **Should** |
| **US-14** | Admin | Administrateur | Visualiser un tableau de bord avec le revenu total et le taux de remplissage | Analyser les performances commerciales de l'événement. | **Should** |
| **US-15** | Admin | Administrateur | Exporter toutes les transactions en format CSV | Traiter et archiver les données financières dans Excel ou un ERP externe. | **Should** |
| **US-16** | UI/UX | Supporter | Basculer l'interface entre un mode sombre et un mode clair | Adapter l'affichage selon mes préférences de confort visuel. | **Could** |
| **US-17** | Notifs | Supporter | Être notifié par email si un match que j'ai acheté subit une modification | Être informé des changements d'horaire ou de lieu. | **Could** |
| **US-18** | Panier | Supporter | Annuler manuellement mon panier en cours | Libérer immédiatement mes verrous de sièges pour les autres supporters. | **Could** |
| **US-19** | Admin | Administrateur | Visualiser le plan de stade avec des dégradés de couleurs par taux d'occupation | Repérer les zones de sièges les plus populaires en un coup d'œil. | **Could** |
| **US-20** | Paiement | Supporter | Payer mon panier en utilisant un compte PayPal | Avoir une alternative de paiement en ligne. | **Won't** |
| **US-21** | Billet | Supporter | Revendre mon billet directement sur une bourse d'échange intégrée | Récupérer mon argent si je ne peux plus me déplacer. | **Won't** |

---

## 3. Planification des Sprints

Le projet est planifié sur une durée globale de **6 semaines**, divisée en **3 sprints de 2 semaines**. Cette planification garantit la livraison progressive des fonctionnalités critiques d'abord, suivies des enrichissements et de l'industrialisation.

```
Semaine : 1      2      3      4      5      6
Sprint : [  Sprint 1  ] [  Sprint 2  ] [  Sprint 3  ]
Focus :  Fondations &   Réservations,   Admin, CI/CD,
         Catalogue      Paiement, PDF   Test & Supervision
```

### 3.1 Sprint 1 : Fondations & Catalogue (Semaines 1-2)
- **Objectif** : Mettre en place l'environnement technique de développement, implémenter l'authentification forte 2FA et afficher le catalogue de matchs.
- **User Stories incluses** : US-01, US-02, US-03.
- **Tâches clés** :
  - Configuration du monorepo (Express backend, React frontend avec Vite et TailwindCSS).
  - Connexion à Cosmos DB (MongoDB API) et configuration d'Upstash Redis.
  - Définition des schémas de données Mongoose (`User`, `Stadium`, `Match`, `Seat`, `Cart`, `Order`).
  - Script de seed FIFA 2026 : insertion des 16 stades réels, des 48 matchs et génération des sièges.
  - API d'inscription (`/register`) avec hachage bcrypt (cost 12) et envoi d'email de bienvenue.
  - API de connexion (`/login`) avec génération d'OTP à 6 chiffres et envoi par email (Nodemailer).
  - API de vérification d'OTP (`/verify-otp`) retournant le jeton JWT d'accès court et stockant le refresh token dans un cookie `httpOnly`.
  - Frontend : Écrans Register, Login, OTP (avec countdown) et Catalogue (liste des matchs avec états de disponibilité).
  - Initialisation de la pipeline CI de base (Linting et tests Jest basiques).

### 3.2 Sprint 2 : Cœur Métier & Billetterie (Semaines 3-4)
- **Objectif** : Implémenter le mécanisme de verrouillage en temps réel, intégrer la passerelle de paiement Stripe et générer les billets.
- **User Stories incluses** : US-04, US-05, US-06, US-07, US-08, US-09, US-18.
- **Tâches clés** :
  - **seatLockService** : Implémentation du verrou distribué Redis (`SET NX EX 600`) pour bloquer un siège pendant 10 minutes de manière atomique.
  - **cartService** : Gestion du panier dans Cosmos DB avec index TTL à 600 secondes. Le nettoyage libère les verrous Redis associés si expiré.
  - **Plan de Stade interactif** : Rendu SVG responsive avec statut dynamique des sièges et rafraîchissement par polling (10s).
  - **Composant CartTimer** : Affichage du countdown dynamique client, virant au rouge sous les 2 minutes, avec nettoyage automatique et redirection à l'expiration.
  - **Integration Stripe** : Endpoint de génération de clientSecret Stripe, formulaire Stripe Elements côté front, et endpoint Webhook validant les signatures Stripe.
  - **Génération de Billets** : Après paiement réussi, exécution séquentielle de la transaction de billetterie (insertion Order, génération UUID de billet, code QR base64, PDF via PDFKit, envoi dans Azure Blob Storage, envoi par email, et libération finale du verrou Redis).
  - **Historique** : Endpoints et pages affichant les commandes passées et permettant le téléchargement des PDFs de billets.

### 3.3 Sprint 3 : Administration, DevOps & Supervision (Semaines 5-6)
- **Objectif** : Fournir les outils d'administration, optimiser les performances globales de l'application, mettre en place l'observabilité et automatiser les pipelines de livraison.
- **User Stories incluses** : US-10, US-11, US-12, US-13, US-14, US-15, US-16, US-17, US-19.
- **Tâches clés** :
  - **Gestion Admin** : Routes CRUD pour les matchs, protégées par un middleware vérifiant le rôle admin. Page admin dédiée (design dense type Vercel).
  - **Dashboard de vente** : Statistiques de vente (Recharts), KPI financiers en temps réel, export CSV via bibliothèque de streaming.
  - **Filtres Avancés** : Recherche croisée sur le catalogue et pagination côté serveur.
  - **Event Bus Interne** : Utilisation d'un EventEmitter Node.js pour émettre les changements de statut de match et notifier automatiquement les acheteurs concernés par email.
  - **Observabilité** : Intégration d'Azure Application Insights (SDK OpenTelemetry) pour capter la latence des requêtes, le taux d'erreur et les métriques métier custom.
  - **Automatisation CI/CD** : Pipeline GitHub Actions complète avec build Docker, push sur Azure Container Registry, et déploiement avec stratégie Canary (5% de trafic initial) sur Azure Container Apps.
  - **Tests & Qualité** : Augmentation de la couverture des tests Jest (tests unitaires et intégration via supertest avec base MongoDB en mémoire) au-delà des 70%.
  - **Maintenance** : Configuration de Dependabot et stratégie de gestion des correctifs de sécurité.

### 3.4 Justification des priorités
1. **Sprint 1 (Fondations)** est nécessaire car aucune réservation ou navigation n'est possible sans base de données structurée, sans modèle et sans session utilisateur authentifiée.
2. **Sprint 2 (Cœur Métier)** s'attaque au risque technologique majeur du projet (les conflits de concurrence sur Redis et l'intégration Stripe). En le planifiant au milieu, on se laisse du temps de stabilisation.
3. **Sprint 3 (Industrialisation)** peaufine l'expérience utilisateur et livre les exigences de maintenance et de production (CI/CD, Monitoring, Admin) une fois le flux d'achat principal éprouvé.

---

## 4. Matrice des Risques Projet

Cette matrice évalue les risques majeurs du projet, leur criticité (Probabilité $\times$ Impact) et définit des plans de mitigation techniques.

| Code | Risque Identifié | Prob. (1-5) | Imp. (1-5) | Criticité | Stratégie de Mitigation |
|---|---|:---:|:---:|:---:|---|
| **R-01** | **Race Condition : double achat** lors de la validation finale du paiement si le verrou Redis expire précisément à ce moment. | 3 | 5 | **15 (Critique)** | Vérifier la présence et la validité du verrou Redis dans le webhook Stripe avant de débiter/enregistrer la commande. Si expiré et siège racheté, initier un remboursement automatique Stripe et notifier l'utilisateur. |
| **R-02** | **Indisponibilité ou blocage de Redis** (ex. dépassement de mémoire ou coupure Upstash). | 2 | 5 | **10 (Majeur)** | Fallback applicatif : bascule temporaire sur des verrous optimistes en base MongoDB (champ `lockedBy` sur le document `Seat` avec écriture conditionnelle), bien que cela augmente la charge SQL. |
| **R-03** | **Fuite de jetons de session** (vol de JWT via faille XSS). | 2 | 4 | **8 (Moyen)** | Stocker impérativement le Refresh Token dans un cookie sécurisé avec les attributs `httpOnly`, `Secure` et `SameSite=Strict`. Le jeton d'accès (Access Token) est conservé uniquement en mémoire RAM JavaScript (Zustand store). |
| **R-04** | **Non-conformité légale (RGPD)** : conservation indéfinie de données d'identité et de coordonnées bancaires. | 2 | 4 | **8 (Moyen)** | Anonymisation systématique en DB des profils clients inactifs depuis plus de 3 ans. Rappeler qu'aucune coordonnée bancaire n'est stockée dans notre base Cosmos DB (Stripe gère l'intégralité du stockage financier sécurisé). |
| **R-05** | **Échec d'envoi d'email OTP ou de billets** (panne SMTP ou blacklistage IP). | 3 | 3 | **9 (Moyen)** | File d'attente de retentative interne avec limite d'essais. En parallèle, afficher le code OTP sur l'écran d'administration pour les tests, et permettre aux utilisateurs de télécharger leur billet directement depuis leur historique web sans dépendre de l'email. |
| **R-06** | **Dépassement du budget de connexions Cosmos DB** en raison de requêtes répétées et non indexées lors des filtres du catalogue. | 3 | 3 | **9 (Moyen)** | Création d'index composites MongoDB sur les champs fréquemment filtrés (`teamA`, `teamB`, `date`, `stadiumId`) et implémentation d'une couche de cache en mémoire (`node-cache`) de 60 secondes sur les listes de matchs. |

---

## 5. Modélisation UML

### 5.1 Diagramme de Cas d'Utilisation
Ce diagramme illustre les interactions des différents acteurs (Supporter, Administrateur, Stripe et Système de notification par email) avec le système.

```
                ┌──────────────────────────────────────────────────────────┐
                │                  FIFA Ticketing Hub                      │
                │                                                          │
                │   ┌─────────────────────┐                                │
                │   │ S'inscrire / Connect│◀────────────────────────────┐  │
                │   └─────────────────────┘                             │  │
                │              ▲                                        │  │
                │              │ (contient)                             │  │
                │   ┌─────────────────────┐                             │  │
                │   │  Vérifier OTP (2FA) │                             │  │
                │   └─────────────────────┘                             │  │
                │                                                       │  │
                │   ┌─────────────────────┐                             │  │
                │   │  Consulter Matchs   │                             │  │
                │   └─────────────────────┘                             │  │
 ┌──────────┐   │              ▲                                        │  │
 │          │   │              │ (inclut)                               │  │  ┌───────────┐
 │          ├───┼   ┌─────────────────────┐                             ├──┼──┤ Service   │
 │Supporter │   │   │ Sélectionner Siège  │                             │  │  │  d'Email  │
 │          │   │   └─────────────────────┘                             │  │  └───────────┘
 └──────────┘   │              │                                        │  │
      ▲         │              ▼ (provoque)                             │  │
      │         │   ┌─────────────────────┐                             │  │
      │         │   │ Verrouiller Place   │                             │  │
      │         │   │  (Redis TTL 10min)  │                             │  │
      │         │   └─────────────────────┘                             │  │
      │         │              │                                        │  │
      │         │              ▼ (inclut)                               │  │
      │         │   ┌─────────────────────┐      ┌──────────────────┐   │  │
      │         │   │   Payer Billet      ├─────▶│ Passerelle Stripe│   │  │
      │         │   └─────────────────────┘      └──────────────────┘   │  │
      │         │              │                                        │  │
      │         │              ▼ (provoque)                             │  │
      │         │   ┌─────────────────────┐                             │  │
      │         │   │ Générer PDF & QR    │─────────────────────────────┘  │
      │         │   └─────────────────────┘                                │
      │         │                                                          │
      │         │   ┌─────────────────────┐                                │
      │         └───│  Gérer les Matchs   │◀──────────────────────────────┐│
      │             └─────────────────────┘                               ││
 ┌────┴─────┐                                                             ││
 │          │                                                             ││
 │  Admin   ├─────────────────────────────────────────────────────────────┘│
 │          │                                                              │
 └──────────┘                                                              │
                └──────────────────────────────────────────────────────────┘
```

### 5.2 Diagramme de Classes
Ce diagramme représente la structure des données Cosmos DB (modèles Mongoose) et leurs relations.

```
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│                 User                 │          │               Stadium                │
├──────────────────────────────────────┤          ├──────────────────────────────────────┤
│ - _id: ObjectId                      │          │ - _id: ObjectId                      │
│ - email: String {unique, lowercase}  │          │ - name: String                       │
│ - passwordHash: String               │          │ - city: String                       │
│ - firstName: String                  │          │ - country: String                    │
│ - lastName: String                   │          │ - capacity: Number                   │
│ - phone: String                      │          └──────────────────┬───────────────────┘
│ - otpCode: String                    │                             │ 1
│ - otpExpiresAt: Date                 │                             │
│ - isVerified: Boolean                │                             │ a
│ - role: String {'user', 'admin'}     │                             │
│ - createdAt: Date                    │                             │ 1..*
├──────────────────────────────────────┤          ┌──────────────────▼───────────────────┐
│ + hashPassword()                     │          │                Match                 │
│ + verifyPassword()                   │          ├──────────────────────────────────────┤
└──────────────────┬───────────────────┘          │ - _id: ObjectId                      │
                   │                              │ - teamA: String                      │
                   │ 1                            │ - teamB: String                      │
                   │                              │ - round: String                      │
                   │                              │ - group: String                      │
                   │                              │ - date: Date                         │
                   │                              │ - stadiumId: ObjectId [FK]           │
                   │                              │ - totalSeats: Number                 │
                   │                              │ - availableSeats: Number             │
                   │                              │ - isActive: Boolean                  │
                   │                              └──────────────────┬───────────────────┘
                   │                                                 │ 1
                   │                                                 │
                   │                                                 │ a
                   │                                                 │
                   │ 1..*                                            │ 1..*
┌──────────────────▼───────────────────┐          ┌──────────────────▼───────────────────┐
│                 Cart                 │          │                 Seat                 │
├──────────────────────────────────────┤          ├──────────────────────────────────────┤
│ - _id: ObjectId                      │          │ - _id: ObjectId                      │
│ - userId: ObjectId [FK]              │          │ - stadiumId: ObjectId [FK]           │
│ - expiresAt: Date {index TTL}        │          │ - section: String                    │
│ - status: String {'active','expired'}│          │ - row: String                        │
│ - items: [CartItem]                  │          │ - number: Number                     │
├──────────────────────────────────────┤          │ - category: String {'A', 'B', 'C'}   │
│                                      │          │ - price: Number                      │
│                                      │          │ - status: String                     │
└──────────────────┬───────────────────┘          └──────────────────▲───────────────────┘
                   │                                                 │
                   │                                                 │
                   │ 1                                               │ 1
                   │                                                 │
                   │                                                 │
                   │ 1                                               │ 1
┌──────────────────▼───────────────────┐          ┌──────────────────┴───────────────────┐
│                Order                 │          │                Ticket                │
├──────────────────────────────────────┤          ├──────────────────────────────────────┤
│ - _id: ObjectId                      │          │ - _id: ObjectId                      │
│ - userId: ObjectId [FK]              │1     1..*│ - orderId: ObjectId [FK]             │
│ - totalAmount: Number                ├─────────▶│ - matchId: ObjectId [FK]             │
│ - status: String                     │          │ - seatId: ObjectId [FK]              │
│ - stripePaymentIntentId: String      │          │ - userId: ObjectId [FK]              │
│ - createdAt: Date                    │          │ - qrCode: String {unique}            │
└──────────────────┬───────────────────┘          │ - pdfUrl: String                     │
                   │                              │ - status: String {'valid', 'used'}   │
                   │ 1                            │ - createdAt: Date                    │
                   │                              └──────────────────────────────────────┘
                   │ 1
┌──────────────────▼───────────────────┐
│               Payment                │
├──────────────────────────────────────┤
│ - _id: ObjectId                      │
│ - orderId: ObjectId [FK]             │
│ - amount: Number                     │
│ - currency: String                   │
│ - method: String {'STRIPE'}          │
│ - status: String                     │
│ - transactionId: String              │
│ - createdAt: Date                    │
└──────────────────────────────────────┘
```

### 5.3 Diagramme de Séquence : Verrouillage Temporaire (Redis TTL)
Ce diagramme détaille le mécanisme de réservation d'un siège, qui s'appuie sur l'atomicité de Redis pour empêcher les double-réservations.

```
Supporter              Frontend                   API Backend                 Upstash Redis               Cosmos DB
   │                      │                            │                            │                         │
   │─── Sélectionne ─────▶│                            │                            │                         │
   │    un siège          │─── POST /cart ────────────▶│                            │                         │
   │                      │    {matchId, seatId}       │                            │                         │
   │                      │                            │─── GET seat:{seatId} ─────▶│                         │
   │                      │                            │    avec NX EX 600          │                         │
   │                      │                            │◀── [Réponse Redis] ────────│                         │
   │                      │                            │                            │                         │
   │                      │                            │─── [SI VERROU RÉUSSI] ───────────────────────────────▶│
   │                      │                            │                                                      │ Créer document Cart
   │                      │                            │                                                      │ avec expiresAt = Now + 10m
   │                      │                            │◀─────────────────────────────────────────────────────│
   │                      │◀── HTTP 201 Created ───────│                                                      │
   │                      │    {cartId, expiresAt}     │                                                      │
   │                      │                            │                                                      │
   │                      │                            │─── [SI DÉJÀ VERROUILLÉ]                              │
   │                      │◀── HTTP 409 Conflict ──────│                                                      │
   │                      │    (Siège indisponible)    │                                                      │
   │                      │                            │                                                      │
   │◀── Affiche le ───────│                            │                                                      │
   │    Timer (10min)     │                            │                                                      │
```

### 5.4 Diagramme de Séquence : Paiement et Livraison (Stripe Webhook)
Ce diagramme décrit le flux de paiement Stripe, sa validation asynchrone sécurisée par Webhook, et la génération de billets en arrière-plan.

```
Supporter             Frontend                 Stripe Gateway               API Backend             Azure Blob/Mail
   │                     │                           │                           │                         │
   │── Confirme Achat ──▶│                           │                           │                         │
   │                     │── POST /payment/intent ──▶│                           │                         │
   │                     │   (cartId)                │                           │                         │
   │                     │                           │── Appelle Stripe API ────▶│                         │
   │                     │                           │   (PaymentIntent)         │                         │
   │                     │                           │◀── Retourne ClientSecret ─│                         │
   │                     │◀─ Reçoit ClientSecret ────│                           │                         │
   │                     │                           │                           │                         │
   │                     │── Envoie coordonnées ────▶│                           │                         │
   │                     │   bancaires (Stripe Form) │                           │                         │
   │                     │◀─ Paiement Validé ────────│                           │                         │
   │                     │                           │                           │                         │
   │                     │                           │──[Asynchrone Webhook]────▶│                         │
   │                     │                           │  charge.succeeded         │                         │
   │                     │                           │  (avec signature)         │                         │
   │                     │                           │                           │── 1. Insère Order (confirmed)
   │                     │                           │                           │── 2. Insère Ticket (qrCode)
   │                     │                           │                           │── 3. Génère QR Code & PDF
   │                     │                           │                           │── 4. Upload PDF ───────▶│
   │                     │                           │                           │                         │ (Azure Blob Storage)
   │                     │                           │                           │── 5. Envoie Email ─────▶│
   │                     │                           │                           │                         │ (Lien PDF + QR)
   │                     │                           │                           │── 6. Libère Verrou Redis
   │                     │                           │                           │      (DEL seat:{seatId})
   │                     │                           │                           │── 7. Met à jour Seat DB
   │                     │                           │                           │      (status: sold)
   │                     │◀── Reçoit Notification ───│                           │                         │
   │                     │    Achat Confirmé         │                           │                         │
   │◀─ Affiche Billet ───│                           │                           │                         │
   │   avec QR Code      │                           │                           │                         │
```

---

## 6. Architecture Technique et Gestion de la Concurrence

L'architecture est structurée en monolithe modulaire. Pour éviter que deux utilisateurs ne réservent le même siège, nous implémentons un mécanisme robuste de **Verrouillage Distribué (Distributed Locking)** via Redis.

### 6.1 Flux de Réservation Temporaire
1. **Sélection** : L'utilisateur clique sur le siège `45` de la section `A` du match `Match-123` sur son navigateur.
2. **Requête** : Le frontend envoie une requête `POST /api/v1/cart` avec les identifiants du match et du siège.
3. **Acquisition du verrou** :
   - Le backend génère une clé de verrouillage : `lockKey = seat:Match-123:45`.
   - Le backend exécute la commande atomique Redis : `SET seat:Match-123:45 userId NX EX 600`.
     - `NX` : Ne définit la clé que si elle n'existe pas encore. C'est la condition d'atomicité.
     - `EX 600` : Expire automatiquement la clé après 600 secondes (10 minutes). C'est le TTL.
4. **Scénario A (Verrou Acquis)** : Le serveur crée un document `Cart` dans Cosmos DB avec un champ `expiresAt` égal à `Date.now() + 600000` (10 minutes) et retourne un statut `201 Created` au frontend.
5. **Scénario B (Échec du Verrou)** : Redis retourne `null` car la clé existe déjà (le siège est déjà réservé par un autre utilisateur). Le serveur lève immédiatement une exception métier (HTTP `409 Conflict`), stoppant la transaction.

### 6.2 Stratégie Anti-Double Achat
Le risque d'une double réservation survient si le panier de l'utilisateur expire pendant qu'il effectue le paiement sur l'interface Stripe. Si le verrou expire, le siège redevient disponible pour d'autres utilisateurs. Si un deuxième utilisateur le verrouille et que le premier finalise son paiement Stripe une seconde après, on fait face à un double-achat.

Pour l'éviter, notre passerelle de paiement valide de façon asynchrone et stricte le verrou lors de l'appel du webhook Stripe :
1. Stripe confirme le succès de la transaction via le webhook `charge.succeeded`.
2. Le backend intercepte l'appel, vérifie la validité de la signature de Stripe pour éviter l'usurpation.
3. Le backend extrait le `cartId` des métadonnées du paiement Stripe et charge le panier depuis Cosmos DB.
4. Avant d'écrire la commande, le backend effectue un contrôle transactionnel :
   - Il vérifie si le verrou Redis `seat:Match-123:45` appartient toujours à cet utilisateur (via la valeur `userId` stockée dans le verrou).
   - Si le verrou a expiré en cache Redis mais que le siège n'a pas encore été acheté par quelqu'un d'autre (statut `available` en DB), le backend s'approprie à nouveau le siège, écrit l'achat définitif (`status: sold` en base) et génère le billet.
   - Si le verrou a expiré **ET** que le siège a déjà été vendu à un autre utilisateur (`status: sold` en DB), le système refuse la création du billet, loggue une alerte critique dans Application Insights, et appelle l'API de remboursement Stripe (`stripe.refunds.create`) pour restituer l'argent à l'utilisateur initial, puis lui envoie un email d'explication.

### 6.3 Justification : Redis vs Cron Job pour l'expiration

La gestion des expirations de paniers est critique. Nous justifions l'utilisation exclusive des mécanismes natifs Redis et Cosmos DB au détriment d'un Cron job récurrent pour les raisons suivantes :

| Critère | Redis (Distributed Lock TTL) | Cron Job Planifié (Toutes les 1 minute) |
|---|---|---|
| **Temps réel & Expansibilité** | L'expiration a lieu à la milliseconde près. Dès que les 10 minutes sont écoulées, la clé est détruite et le siège redevient instantanément sélectionnable. | Le cron s'exécute à intervalles fixes (ex. toutes les minutes). Un siège libéré à $T+1s$ devra attendre la prochaine exécution de la tâche à $T+60s$, créant une indisponibilité artificielle. |
| **Opérations Atomiques** | La commande `SET NX EX` garantit qu'une seule instance d'API peut verrouiller la ressource. Pas de risque de conflit d'écriture. | Le cron nécessite de lire en base, de filtrer les paniers expirés, puis d'écrire des mises à jour. Durant cet intervalle de lecture-écriture, des conflits de concurrence surviennent. |
| **Charge sur la base SQL/NoSQL** | Redis fonctionne entièrement en mémoire RAM ($O(1)$). Aucun appel à Cosmos DB n'est nécessaire pour vérifier ou maintenir les états des verrous lors de la navigation. | Le cron exécute des requêtes de balayage (`SCAN` ou `SELECT`) sur l'ensemble de la base de données SQL pour trouver les expirations, ce qui sature inutilement les E/S disque de la DB principale. |
| **Scalabilité Horizontale** | Redis centralise les verrous pour toutes les instances de l'API Node.js. Aucune synchronisation inter-serveur n'est nécessaire. | Si plusieurs serveurs exécutent le cron en parallèle, ils risquent de nettoyer les mêmes lignes en même temps, provoquant des verrous morts ou des écritures dupliquées (nécessite un orchestrateur de tâches). |

---

## 7. Structure du Projet et Conventions de Développement

### 7.1 Architecture des Dossiers (Workspace)
Le projet utilise une structure monorepo propre pour séparer les responsabilités.

```
fifa-ticketing/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # Pipeline d'automatisation GitHub Actions
├── agent/
│   ├── ALM_PROJECT_DELIVERABLES.md # Ce document de livrables
│   ├── tasks-sprint1.md          # Guide d'exécution Sprint 1
│   ├── tasks-sprint2.md          # Guide d'exécution Sprint 2
│   ├── tasks-sprint3.md          # Guide d'exécution Sprint 3
│   ├── api-contracts.md          # Contrats d'interfaces de l'API REST
│   ├── data-models.md            # Modélisation logique des données Mongoose
│   ├── design-system.md          # Spécifications de la charte graphique et tokens
│   └── architecture.md           # Spécifications architecturales de référence
├── backend/
│   ├── src/
│   │   ├── config/               # Connexions aux services (database, redis, stripe)
│   │   ├── controllers/          # Contrôleurs HTTP (gestion des requêtes et réponses)
│   │   ├── listeners/            # Écouteurs d'événements asynchrones internes
│   │   ├── middlewares/          # Validation, authentification, gestion des erreurs
│   │   ├── models/               # Modèles de données Mongoose
│   │   ├── routes/               # Déclaration des points d'accès API REST
│   │   ├── services/             # Cœur logique de l'application (Services Métier)
│   │   ├── utils/                # Outils utilitaires (logger, pdf, qr, errors)
│   │   ├── scripts/              # Scripts utilitaires et seeder de base de données
│   │   └── __tests__/            # Suite de tests Jest unitaires et intégration
│   ├── Dockerfile                # Image de conteneurisation du service backend
│   └── package.json              # Dépendances backend et scripts NPM
└── frontend/
    ├── src/
    │   ├── components/           # Composants UI réutilisables (Boutons, Cartes)
    │   ├── pages/                # Écrans principaux de l'application
    │   ├── hooks/                # Hooks React personnalisés (auth, cart)
    │   ├── services/             # Appels réseau (Service d'API)
    │   ├── store/                # Gestion globale de l'état (Zustand)
    │   ├── styles/               # Styles CSS et variables thématiques
    │   └── utils/                # Formateurs de prix, dates et fonctions UI
    ├── Dockerfile                # Image de conteneurisation du service frontend
    ├── vite.config.js            # Configuration du build Vite
    └── package.json              # Dépendances frontend et scripts NPM
```

### 7.2 Stratégie de Branches Git
Nous adoptons un modèle dérivé de **Git Flow** adapté aux pipelines modernes d'intégration continue :

- `main` : Branche de production. Chaque commit sur `main` correspond à une version stable déployable et déclenche la pipeline de production. Protégée contre les pushs directs.
- `develop` : Branche d'intégration. Elle regroupe les fonctionnalités terminées en attente de validation pour la prochaine release.
- `feature/*` : Branches de développement de nouvelles fonctionnalités (ex : `feature/auth-otp`). Créées à partir de `develop` et fusionnées dans `develop` via Pull Request validée.
- `hotfix/*` : Branches de correction urgente en production (ex : `hotfix/stripe-webhook-timeout`). Créées à partir de `main` et fusionnées directement dans `main` et `develop` après validation.

```
main      ───────────────────────────────● (Production)
                                         ▲
develop   ──────────────●────────●───────┼ (Intégration)
                         ▲      ▲        │
feature   ───●───────────┘      │        │
             (auth-otp)         │        │
hotfix    ──────────────────────●────────┘
                                (stripe-timeout)
```

### 7.3 Conventions de Commit (Conventional Commits)
L'historique Git doit être parfaitement lisible pour générer des Changelogs automatiques et faciliter les revues. Chaque commit doit respecter la structure suivante : `<type>(<scope>): <description>` :

- `feat` : Ajout d'une nouvelle fonctionnalité (ex : `feat(auth): add OTP email verification endpoint`).
- `fix` : Correction d'un bug (ex : `fix(cart): release Redis lock on cart expiration`).
- `refactor` : Modification du code sans changement fonctionnel (ex : `refactor(seat): extract seat locking logic to service layer`).
- `test` : Ajout ou correction de tests (ex : `test(ticket): add unit tests for QR generation`).
- `chore` : Tâche de maintenance ou configuration (ex : `chore(ci): add Azure deployment to GitHub Actions pipeline`).
- `docs` : Rédaction ou modification de la documentation (ex : `docs(api): update API contracts`).

---

## 8. Pipeline CI/CD et Déploiement Continu

La pipeline CI/CD automatisée sous **GitHub Actions** orchestre les étapes de validation et de livraison pour assurer la qualité du code à chaque étape du cycle de vie logiciel.

```
Déclencheur (Push / PR)
  │
  ├──► Job LINT & FORMAT (ESLint / Prettier)
  │
  ├──► Job TEST (Jest avec couverture > 70%)
  │
  └──► Job BUILD (Compilation Vite & Build Docker backend)
        │
        └──► [Si branche MAIN uniquement] Déploiement :
              ├──► Frontend ──► Azure Static Web Apps (CDN Global)
              └──► Backend  ──► Azure Container Registry ──► Azure Container Apps
```

### 8.1 Fichier de configuration GitHub Actions (`.github/workflows/ci-cd.yml`)
```yaml
name: CI/CD Pipeline - FIFA Ticketing Hub

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json

      - name: Lint Backend
        run: |
          cd backend
          npm ci
          npm run lint

      - name: Lint Frontend
        run: |
          cd frontend
          npm ci
          npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json

      - name: Run Backend Tests (Jest)
        run: |
          cd backend
          npm ci
          npm run test -- --coverage
        env:
          NODE_ENV: test
          COSMOS_CONNECTION_STRING: mongodb://localhost:27017/test-db # Simulé via mongodb-memory-server en interne
          UPSTASH_REDIS_URL: redis://localhost:6379 # Mocké en interne des tests

      - name: Upload Coverage to GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage/

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Connexion à Microsoft Azure
      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      # Déploiement du Frontend (Azure Static Web Apps)
      - name: Deploy Frontend to Azure SWA
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_SWA_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: ""
          output_location: "dist"

      # Construction et push de l'image Docker du backend
      - name: Build & Push Backend Docker Image
        run: |
          docker build -t ${{ secrets.AZURE_ACR_NAME }}.azurecr.io/fifa-backend:${{ github.sha }} -f backend/Dockerfile backend/
          az acr login --name ${{ secrets.AZURE_ACR_NAME }}
          docker push ${{ secrets.AZURE_ACR_NAME }}.azurecr.io/fifa-backend:${{ github.sha }}

      # Déploiement progressif (Canary 5%) sur Azure Container Apps
      - name: Deploy Backend to Azure Container Apps (Canary)
        run: |
          az containerapp update \
            --name fifa-ticketing-backend \
            --resource-group rg-fifa-ticketing \
            --image ${{ secrets.AZURE_ACR_NAME }}.azurecr.io/fifa-backend:${{ github.sha }} \
            --traffic-weight latest=5,current=95
```

### 8.2 Stratégie de Rollback (Retour Arrière)
Si une version déployée présente une anomalie en production :
1. **Canary Validation** : Lors du déploiement, la nouvelle version (révision $R_{new}$) ne reçoit que 5% du trafic utilisateur, tandis que l'ancienne ($R_{old}$) conserve 95%. Si le taux d'erreur sur la révision $R_{new}$ dépasse 1% dans Application Insights durant la première heure, la réversion est immédiate et automatique.
2. **Rollback Automatique** : La commande Azure CLI réajuste le trafic à 100% sur la version stable précédente ($R_{old}$) sans aucune interruption de service.
   ```bash
   az containerapp update --name fifa-ticketing-backend --resource-group rg-fifa-ticketing --traffic-weight current=100,latest=0
   ```
3. **Rollback Manuel en cas d'urgence** : Si le bug est identifié plus tard, un développeur peut déclencher le workflow GitHub Actions `Rollback` en spécifiant le tag de l'image Docker précédente pour forcer un redéploiement instantané.

---

## 9. Stratégie de Tests et Scénarios Détaillés

La pyramide des tests du projet vise à sécuriser le comportement applicatif :
- **Tests Unitaires (Jest)** : Valider les règles métier isolées (ex: calcul du prix, expiration des paniers, formatage).
- **Tests d'Intégration (Jest + Supertest)** : Tester les endpoints de l'API avec une base de données MongoDB en mémoire (`mongodb-memory-server`) et des mocks Redis.
- **Objectif de couverture globale** : **> 70%** sur le backend et le frontend.

```
       /\
      /  \       Tests E2E (Playwright) - Scénario achat complet (<5%)
     /----\
    /      \     Tests d'Intégration (Supertest) - API & Base de données (35%)
   /--------\
  /          \   Tests Unitaires (Jest) - Fonctions & Services Métier (60%)
 /____________\
```

### 9.1 Fiches de Cas de Test Détaillés (Format Professionnel)

#### Module 1 : Authentification & Sécurité

##### ID : TC-AUTH-001 — Inscription nominale
- **Fonctionnalité** : Inscription utilisateur.
- **Préconditions** : Aucun compte utilisateur n'existe avec l'adresse email `supporter@fifa.com`.
- **Étapes** :
  1. Envoyer une requête HTTP `POST /api/v1/auth/register` avec le corps :
     ```json
     {
       "email": "supporter@fifa.com",
       "password": "Password123!",
       "firstName": "Jean",
       "lastName": "Dupont",
       "phone": "+33612345678"
     }
     ```
  2. Interroger la base Cosmos DB pour vérifier l'existence de l'utilisateur.
  3. Vérifier qu'un email de bienvenue a été intercepté par le serveur SMTP de test.
- **Résultat Attendu** : Code de retour HTTP `201 Created`. Le mot de passe stocké en DB doit être chiffré (hash bcrypt) et non en clair. L'email de bienvenue a été envoyé avec succès.
- **Statut** : Validé ✅

##### ID : TC-AUTH-002 — Inscription avec email doublon
- **Fonctionnalité** : Inscription utilisateur.
- **Préconditions** : Un compte utilisateur avec l'adresse email `supporter@fifa.com` existe déjà en DB.
- **Étapes** :
  1. Envoyer une requête HTTP `POST /api/v1/auth/register` avec le même corps que `TC-AUTH-001`.
- **Résultat Attendu** : Code de retour HTTP `409 Conflict` avec un message d'erreur : `{"error": "Email déjà utilisé"}`. Aucune modification en base de données.
- **Statut** : Validé ✅

##### ID : TC-AUTH-005 — Connexion nominale (Génération OTP)
- **Fonctionnalité** : Première étape d'authentification.
- **Préconditions** : L'utilisateur `supporter@fifa.com` est enregistré et vérifié.
- **Étapes** :
  1. Envoyer une requête HTTP `POST /api/v1/auth/login` avec :
     ```json
     {
       "email": "supporter@fifa.com",
       "password": "Password123!"
     }
     ```
  2. Inspecter le document utilisateur en DB pour récupérer l'OTP généré.
- **Résultat Attendu** : Code HTTP `200 OK`. Un jeton temporaire JWT `tempToken` est retourné dans la réponse. Un code OTP aléatoire de 6 chiffres est stocké en base de données avec une expiration de 10 minutes, et un email contenant l'OTP a été envoyé.
- **Statut** : Validé ✅

##### ID : TC-AUTH-007 — Validation OTP 2FA nominale
- **Fonctionnalité** : Deuxième étape d'authentification (2FA).
- **Préconditions** : L'utilisateur a initié sa connexion et dispose d'un `tempToken` valide et d'un code OTP `854312`.
- **Étapes** :
  1. Envoyer une requête HTTP `POST /api/v1/auth/verify-otp` avec :
     ```json
     {
       "tempToken": "eyJhbGciOi...",
       "code": "854312"
     }
     ```
  2. Inspecter les en-têtes HTTP de la réponse.
- **Résultat Attendu** : Code HTTP `200 OK`. La réponse contient l'Access Token `accessToken` (valide 15 minutes). Un cookie nommé `refreshToken` a été défini avec les drapeaux `HttpOnly` et `Secure`. L'OTP et son expiration sont effacés du document utilisateur en DB pour éviter les rejeux.
- **Statut** : Validé ✅

#### Module 2 : Verrouillage & Gestion du Panier

##### ID : TC-SEAT-001 — Acquisition de verrou nominal
- **Fonctionnalité** : Verrouillage temporaire de siège sur Redis.
- **Préconditions** : Le siège `seat-45` du match `match-10` est libre. Redis est actif.
- **Étapes** :
  1. Exécuter l'appel au service : `seatLockService.lockSeat("seat-45", "user-789")`.
  2. Interroger la clé Redis `seat:seat-45`.
- **Résultat Attendu** : Le service retourne `true`. La clé Redis `seat:seat-45` existe et a pour valeur `user-789`. Le TTL restant de la clé Redis est compris entre 595 et 600 secondes.
- **Statut** : Validé ✅

##### ID : TC-SEAT-002 — Concurrence de verrouillage (Conflit)
- **Fonctionnalité** : Verrouillage temporaire de siège.
- **Préconditions** : La clé Redis `seat:seat-45` existe déjà avec la valeur `user-789`.
- **Étapes** :
  1. Exécuter en parallèle ou immédiatement après : `seatLockService.lockSeat("seat-45", "user-333")` par un autre utilisateur.
- **Résultat Attendu** : Le service retourne `false`. La valeur de la clé dans Redis reste `user-789` (le verrou n'a pas été écrasé). Le système backend doit lever une erreur HTTP `409 Conflict`.
- **Statut** : Validé ✅

##### ID : TC-CART-002 — Expiration et libération automatique (TTL)
- **Fonctionnalité** : Nettoyage automatique des paniers et sièges expirés.
- **Préconditions** : Un panier `cart-12` a été créé en DB pour le siège `seat-45` verrouillé sur Redis.
- **Étapes** :
  1. Simuler l'expiration en base en configurant une date passée sur le champ `expiresAt` du panier `cart-12`.
  2. Attendre le déclenchement du mécanisme de nettoyage de session (ou appeler manuellement le service de nettoyage des paniers expirés).
  3. Vérifier l'existence de la clé Redis `seat:seat-45`.
- **Résultat Attendu** : Le document du panier dans Cosmos DB est supprimé (ou marqué expiré). La clé Redis `seat:seat-45` a été libérée (`DEL`). Le siège est à nouveau accessible à d'autres acheteurs.
- **Statut** : Validé ✅

#### Module 3 : Paiement & Validation Stripe

##### ID : TC-PAY-001 — Validation asynchrone après webhook
- **Fonctionnalité** : Finalisation de commande après confirmation de paiement.
- **Préconditions** : Le panier de l'utilisateur contient le siège `seat-45` verrouillé à son nom sur Redis.
- **Étapes** :
  1. Émettre une requête HTTP `POST /api/v1/payment/webhook` simulant l'appel Stripe `charge.succeeded` avec une signature valide, contenant le panier `cart-12` dans les métadonnées.
  2. Vérifier l'insertion de la commande (`Order`) en DB.
  3. Vérifier le statut du siège `seat-45` en DB et sur Redis.
- **Résultat Attendu** : Code HTTP `200 OK` renvoyé à Stripe. Une commande `Order` est créée en statut `confirmed`. Un billet avec QR Code unique est enregistré. La clé Redis `seat:seat-45` est libérée. Le siège `seat-45` passe au statut `sold` en base de données pour empêcher tout nouvel achat.
- **Statut** : Validé ✅

---

## 10. Monitoring et Observabilité en Production

L'observabilité repose sur **Azure Application Insights** et le protocole standardisé **OpenTelemetry** pour remonter de manière structurée les métriques d'infrastructure et les métriques métier.

### 10.1 Métriques Techniques Clés (SLI)
Pour respecter les objectifs de performance du site en période de forte vente, nous supervisons trois indicateurs clés de niveau de service (SLI) :
- **Taux d'erreur HTTP** : Pourcentage de requêtes se soldant par une erreur 5xx. *Objectif (SLO) : < 0.1%*.
- **Latence des requêtes (Achat/Verrou)** : Temps de réponse pour `/api/v1/cart` et `/api/v1/payment/confirm`. *Objectif (SLO) : 95% des requêtes traitées en < 200 ms*.
- **Uptime du service** : Disponibilité globale de l'API REST. *Objectif (SLO) : 99.9% de disponibilité mensuelle*.

### 10.2 Métriques Métier Personnalisées
Des compteurs spécifiques sont intégrés dans le code Node.js pour suivre le comportement métier en temps réel :
- `cart.created` : Nombre total de paniers créés (sièges temporairement bloqués).
- `cart.expired` : Nombre de paniers abandonnés ou expirés sans achat (indicateur de frustration utilisateur ou d'indécision).
- `payment.failed` : Suivi des échecs de paiement Stripe (erreurs de saisie ou manque de provisions).
- `ticket.generated` : Nombre de billets émis avec succès (compteur de conversion).
- `redis.lock.concurrency_failures` : Nombre de conflits d'accès où un utilisateur a tenté de verrouiller un siège déjà pris.

### 10.3 Configuration des Alertes de Production
Trois alertes critiques sont configurées sur la console Azure Application Insights avec notifications automatiques sur un canal Slack technique et par email :

1. **Alerte Rouge : Taux d'Erreur API**
   - *Condition* : Le taux d'erreur HTTP 500 dépasse 1% sur une fenêtre glissante de 5 minutes.
   - *Action* : Alerte immédiate de l'équipe DevOps d'astreinte, déclenchement automatique d'un diagnostic d'état de la base de données Cosmos DB.
2. **Alerte Orange : Échecs de Verrous en Cascade**
   - *Condition* : La métrique `redis.lock.concurrency_failures` dépasse 50 échecs par minute.
   - *Action* : Notification sur Slack d'un pic d'activité concurrentielle. Cela permet d'identifier une éventuelle tentative de scraping automatisé ou d'achat par des robots.
3. **Alerte Critique : Latence Redis**
   - *Condition* : La latence moyenne d'écriture sur le serveur Upstash Redis dépasse 50 ms pendant plus de 2 minutes.
   - *Action* : Risque de ralentissement général des verrous. DevOps notifié pour redimensionner ou répliquer le nœud Redis.

---

## 11. Maintenance et Dette Technique

La maintenance applicative s'organise autour d'engagements de niveaux de services (SLA) clairs et d'une gestion proactive de la qualité du code.

### 11.1 Niveaux de Gravité des Incidents et SLA de Résolution

| Gravité | Description | Exemples | Temps de Réponse (GTR) | Temps de Résolution (GTE) |
|---|---|---|:---:|:---:|
| **P1 - Critique** | Dysfonctionnement bloquant affectant tous les utilisateurs, pas de contournement. | Base Cosmos DB inaccessible ; Échec systématique de Stripe ; Fuite mémoire crashant l'API. | 15 minutes | 2 heures |
| **P2 - Majeur** | Fonctionnalité clé indisponible mais l'application reste accessible. | Impossible d'afficher le plan SVG des sièges ; Échecs fréquents de génération de PDF. | 1 heure | 8 heures |
| **P3 - Moyen** | Anomalie mineure impactant un nombre limité d'utilisateurs. | Erreur visuelle sur le thème sombre ; Retard de notification par email. | 4 heures | 24 heures |
| **P4 - Faible** | Demande d'évolution ou amélioration non bloquante. | Ajout d'une nouvelle colonne d'export CSV ; Optimisation de style CSS. | 24 heures | Prochaine Release |

### 11.2 Gestion Proactive de la Dette Technique
- **Analyse SonarQube** : Intégration d'une analyse automatique du code lors des Pull Requests sur GitHub. Un seuil de blocage est défini à un ratio de duplication de code > 3% et une couverture de tests < 70%.
- **Mises à Jour Automatisées avec Dependabot** : Configuration du fichier `.github/dependabot.yml` pour analyser chaque semaine les dépendances backend et frontend :
  - Les correctifs de sécurité critiques (vulnérabilités CVE) font l'objet d'une Pull Request générée automatiquement et fusionnée immédiatement si les tests d'intégration sont au vert.
  - Les mises à jour de versions majeures sont bloquées pour éviter les régressions, et sont planifiées manuellement à chaque fin de sprint.

---

## 12. Protocole de Décommissionnement et RGPD

Conformément à la réglementation **RGPD** en vigueur en Europe, l'application intègre dès sa conception les mécanismes nécessaires pour assurer la protection et la suppression des données personnelles.

```
       [ Utilisateur inactif depuis 3 ans ]
                       │
                       ▼
       ┌───────────────────────────────┐
       │   Script de purge nocturne    │
       └───────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 ┌──────────────┐              ┌──────────────┐
 │ Anonymisation│              │ Conservation │
 │  Données DB  │              │ Archives Fact│
 └──────┬───────┘              └──────┬───────┘
        │                             │
        │ Nettoyage :                 │
        │ - email -> hash anonyme     │ Rétention légale (10 ans) :
        │ - firstName / lastName      │ - Archivage chiffré et
        │   supprimés                 │   séparé des données de
        │ - Téléphone effacé          │   production
        ▼                             ▼
 ┌──────────────┐              ┌──────────────┐
 │ Suppression  │              │ Accès révoqué│
 │  Billets PDF │              │ pour l'Admin │
 └─────────────────────────────└──────────────┘
```

### 12.1 Droit à l'oubli et Purge des données personnelles
1. **Suppression sur demande** : L'utilisateur peut demander la suppression de son compte via son interface profil. Une fois la demande validée, un événement interne `user.deleted` est émis.
2. **Purge automatique pour inactivité** : Un script s'exécute chaque nuit pour identifier les comptes utilisateurs n'ayant pas enregistré de connexion depuis **3 ans**.
3. **Traitement de purge** :
   - Les informations d'identification directe (`firstName`, `lastName`, `phone`) sont définitivement effacées de la base Cosmos DB.
   - L'adresse `email` est remplacée par une chaîne anonymisée non réversible (ex. `deleted-user-d8f9@fifa-ticketing.com`) pour préserver l'intégrité référentielle des commandes historiques.
   - Les fichiers PDF des billets associés stockés dans le conteneur sécurisé Azure Blob Storage sont définitivement détruits.

### 12.2 Rétention et Archivage Légal des Données Comptables
Bien que les données personnelles d'accès soient purgées, la législation fiscale française et européenne impose de conserver les détails des transactions financières pendant une durée de **10 ans**.
- **Archivage comptable** : Les documents de commande (`Order`) et de paiement (`Payment`) ne sont pas supprimés. Ils sont copiés vers une base de données d'archivage chiffrée, isolée du réseau de production.
- Ces archives ne contiennent plus les noms ou adresses emails en clair des acheteurs, mais uniquement les identifiants techniques anonymisés, le montant payé et la référence de transaction Stripe.

### 12.3 Révocation des accès en fin de cycle de vie de l'application
Lorsque l'événement Coupe du Monde de la FIFA 2026 touche à sa fin et que la plateforme doit être décommissionnée :
1. **Verrouillage de la base** : Le site frontend est désactivé et remplacé par une page statique de remerciements. Les APIs d'achat sont désactivées.
2. **Révocation des accès API** : Les clés Stripe de production sont immédiatement révoquées et supprimées du coffre-fort de secrets (Azure Key Vault).
3. **Destruction des infrastructures** : Les conteneurs d'API sur Azure Container Apps sont supprimés pour stopper la facturation.
4. **Export de sécurité** : Un export final de la base de données (données comptables archivées) est réalisé sous format chiffré et remis aux services financiers de la FIFA pour archivage légal longue durée.

---

## 13. Matrice de Traçabilité des Exigences (RTM)

La matrice RTM (Requirements Traceability Matrix) garantit que chaque exigence fonctionnelle ou contrainte technique est correctement modélisée, implémentée et validée par un test.

| Réf. Exigence | Description | User Story | Fichier Conception / Modèle | Scénario de Test | Code Module / Service | Sprint |
|---|---|---|---|---|---|:---:|
| **REQ-F01** | Inscription et Connexion double facteur | **US-01, US-02** | `data-models.md` (User), `CLAUDE.md` Section 3.3 | `TC-AUTH-001`, `TC-AUTH-005`, `TC-AUTH-007` | `backend/src/services/authService.js` | Sprint 1 |
| **REQ-F02** | Liste et filtres des matchs | **US-03, US-11** | `api-contracts.md` (Matches) | `TC-MATCH-001` (Filtres catalogue) | `backend/src/services/matchService.js` | Sprint 1 |
| **REQ-F03** | Sélection et affichage de plan de stade SVG | **US-04** | `design-system.md` (SeatMap) | `TC-SEAT-004` (Affichage plan) | `frontend/src/components/SeatMap.jsx` | Sprint 2 |
| **REQ-F04** | Verrou de siège temps réel 10 minutes | **US-05, US-06** | `architecture.md` Section 5 | `TC-SEAT-001`, `TC-SEAT-002`, `TC-CART-002` | `backend/src/services/seatLockService.js` | Sprint 2 |
| **REQ-F05** | Paiement en ligne sécurisé par carte | **US-07** | `CLAUDE.md` Section 3.4 | `TC-PAY-001`, `TC-PAY-002` | `backend/src/services/paymentService.js` | Sprint 2 |
| **REQ-F06** | Génération de billet PDF avec QR unique | **US-08** | `CLAUDE.md` Section 3.5 | `TC-TICKET-001` (Génération PDF) | `backend/src/services/ticketService.js` | Sprint 2 |
| **REQ-F07** | CRUD des Matchs (Administration) | **US-10** | `api-contracts.md` (Admin) | `TC-ADMIN-001` (CRUD Matchs) | `backend/src/services/adminService.js` | Sprint 3 |
| **REQ-F08** | Tableau de bord de statistiques & Export | **US-14, US-15** | `CLAUDE.md` Section 4 | `TC-ADMIN-002` (Calcul stats) | `backend/src/services/adminService.js` | Sprint 3 |
| **REQ-T01** | Configuration d'index TTL sur le panier Cosmos | **Contrainte** | `CLAUDE.md` Section 5 (Cart) | `TC-CART-002` (Vérification TTL) | `backend/src/models/Cart.js` | Sprint 1 |
| **REQ-T02** | Observabilité en production et métriques | **Contrainte** | `architecture.md` Section 7 | `TC-MON-001` (Vérification SDK OpenTelemetry) | `backend/src/config/telemetry.js` | Sprint 3 |

---

## 14. Comparatif des Outils ALM et DevOps

Pour outiller au mieux le cycle de vie de notre application, nous comparons trois solutions majeures du marché : **GitHub Enterprise (avec GitHub Actions)**, **GitLab Ultimate** et **Microsoft Azure DevOps Suite**.

### 14.1 Grille d'évaluation comparative

Les solutions sont notées de **1 (insuffisant/complexe)** à **5 (excellent/natif)** sur six critères clés :

| Critère d'Évaluation | Description du Critère | GitHub + Actions | GitLab Enterprise | Azure DevOps |
|---|---|:---:|:---:|:---:|
| **Gestion du Backlog & Kanban** | Clarté de la gestion des exigences, des User Stories, intégration du backlog produit et suivi de la vélocité. | **3** *(GitHub Issues & Projects conviennent pour le Kanban simple mais manquent de fonctionnalités Agile avancées)* | **4** *(Excellents Epic boards et roadmaps intégrés)* | **5** *(Azure Boards est la référence absolue pour Scrum, gestion des sprints, des backlogs et de la vélocité)* |
| **Hébergement & Revue de Code** | Qualité du repository Git, ergonomie de la revue de code (Pull/Merge Requests), gestion des branches et sécurité. | **5** *(Leader mondial, interface intuitive, intégrations de sécurité inégalées)* | **5** *(Excellent outil de Merge Request avec revues de sécurité intégrées)* | **4** *(Azure Repos est robuste mais l'interface visuelle est plus austère)* |
| **Moteur CI/CD** | Flexibilité, performances, simplicité de configuration en YAML, et écosystème de runners et d'actions réutilisables. | **5** *(GitHub Actions bénéficie d'une marketplace immense, syntaxe YAML claire et exécution ultra-rapide)* | **5** *(GitLab CI est historiquement très puissant et complet, axé sur les pipelines complexes)* | **4** *(Azure Pipelines est très performant pour le multi-stage mais plus lourd à configurer)* |
| **Sécurité & Conformité** | Détection automatique des secrets, failles de dépendances (SCA), analyse statique de code (SAST) et conformité réglementaire. | **5** *(Dependabot et Advanced Security/CodeQL natifs et ultra-efficaces)* | **5** *(Security Dashboard extrêmement avancé sur l'analyse de conteneurs)* | **3** *(Nécessite des extensions tierces ou l'intégration payante de GitHub Advanced Security)* |
| **Intégration Cloud (Azure)** | Facilité de déploiement natif sur les services de cloud computing cibles du projet (Static Web Apps, Container Apps, etc.). | **5** *(Intégrations et credentials Azure configurables en quelques clics via GitHub)* | **4** *(Requiert une configuration manuelle de variables et de runners dédiés)* | **5** *(Intégration native totale avec l'écosystème cloud Microsoft Azure)* |
| **Coût & Courbe d'Apprentissage** | Accessibilité financière pour l'équipe étudiante/ESN AST, et simplicité d'adoption immédiate par les développeurs. | **5** *(Gratuit pour les projets publics et les équipes réduites, universellement connu des développeurs)* | **3** *(Tarification Enterprise très élevée pour accéder aux fonctionnalités clés, interface plus dense)* | **4** *(Offre gratuite correcte pour les petites équipes de moins de 5 développeurs)* |
| **TOTAL** | **Note cumulée sur 30 points** | **28 / 30** | **25 / 30** | **25 / 30** |

### 14.2 Recommandation Argumentée
Pour le projet **FIFA Ticketing Hub 2026**, nous recommandons l'utilisation de **GitHub avec GitHub Actions** comme plateforme ALM principale pour les raisons suivantes :

1. **Intégration Azure Native** : L'hébergement de notre application se fait sur Azure. Microsoft ayant fait de GitHub son principal levier DevOps, l'intégration entre GitHub Actions et Azure Container Apps/Static Web Apps est directe et documentée via des Actions officielles (ex. `azure/login`, `Azure/static-web-apps-deploy`).
2. **Qualité de la Sécurité Intégrée** : L'activation gratuite de **Dependabot** pour la veille des packages npm vulnérables et l'analyse syntaxique intégrée répondent directement à nos contraintes de maintenance proactive sans configurer de serveur tiers.
3. **Courbe d'Apprentissage Optimale** : L'équipe de développement maîtrise déjà les concepts de Pull Requests GitHub et la syntaxe des Actions GitHub. L'adoption d'un autre outil comme GitLab Enterprise ralentirait le démarrage du Sprint 1, sans apporter de valeur ajoutée décisive sur notre périmètre.
4. **Agilité Légère** : Bien que l'outil Azure Boards (Azure DevOps) soit plus outillé pour les grandes organisations Scrum, l'outil **GitHub Projects** (version 2) est largement suffisant pour organiser nos 3 sprints de 2 semaines sous forme de Kanban agile connecté directement à nos commits et Pull Requests.

---

## 15. Analyse Rétrospective de Fin de Projet

Ce retour d'expérience est formalisé à l'issue de la réalisation des sprints pour analyser l'efficacité de nos choix méthodologiques et DevOps.

### 15.1 Ce qui a très bien fonctionné
- **L'utilisation exclusive de Redis pour les verrous** : Les tests de charge ont démontré qu'Upstash Redis absorbe sans difficulté les requêtes concurrentes d'écriture. Le coût d'accès en mémoire ($O(1)$) a épargné la base Cosmos DB de centaines de milliers de requêtes de verrouillage inutiles lors des pics de trafic simulés.
- **La validation par Webhook Stripe asynchrone** : Le découplage entre la saisie bancaire et la création des billets a permis une haute résilience. Même en cas de coupure temporaire d'un serveur d'API backend, Stripe réessaye la notification du webhook, évitant ainsi toute perte de billets payés par les supporters.
- **Le couple httpOnly Cookie & Zustand** : La séparation stricte de la sécurité des jetons a résisté à toutes nos tentatives de scripting XSS malveillants lors de la phase de test d'intrusion.

### 15.2 Ce qui a moins bien fonctionné
- **La gestion de l'expiration du panier Cosmos DB (Index TTL)** : Cosmos DB n'exécute le nettoyage des documents expirés par l'index TTL que de manière périodique (parfois toutes les quelques minutes selon la charge globale d'Azure). Il y a eu des scénarios en début de projet où le panier était considéré comme expiré côté client (countdown à 00:00) mais le document restait présent en DB pendant 60 secondes supplémentaires. Nous avons corrigé cela en ajoutant une double vérification systématique de la date en backend lors du chargement du panier, plutôt que de faire une confiance aveugle à la suppression physique de Cosmos DB.
- **L'envoi des gros fichiers PDF de billets par email** : Nodemailer a parfois subi des latences ou des rejets lors de l'attachement direct de billets PDF volumineux sur les serveurs SMTP gratuits. Nous avons opté pour le stockage permanent dans Azure Blob Storage et l'envoi d'un simple lien de téléchargement sécurisé et temporaire dans l'email, ce qui a drastiquement allégé la taille des messages et fiabilisé leur envoi.

### 15.3 Actions d'Amélioration pour les Futures Ventes
1. **Implémentation d'une file d'attente d'attente (Virtual Waiting Room)** : Pour la vraie Coupe du Monde de la FIFA 2026, l'affluence dépassera les limites physiques du serveur Node.js. Intégrer un système de salle d'attente en amont (type Cloudflare Waiting Room ou Queue-it) permettrait de réguler le trafic entrant et de ne laisser entrer que le nombre exact de personnes correspondant aux capacités de traitement de notre API et de Redis.
2. **Changement de protocole : WebSocket pour les sièges** : Remplacer le polling HTTP toutes les 10 secondes du plan de stade par une connexion bidirectionnelle persistante (Socket.io ou WebSockets natifs) permettrait de notifier instantanément tous les clients de la prise d'un siège, améliorant considérablement l'expérience utilisateur et réduisant encore la charge de requêtes HTTP GET sur nos serveurs.
