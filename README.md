# Guide d'Utilisation - SuberTech Industries (Simulation Vinego)

Bienvenue dans l'environnement décisionnel de **SuberTech Industries**, conçu pour vous guider pas à pas vers la victoire dans la simulation **Vinego** (Sciado Partenaires).

---

## 1. Démarrer l'Application & Déployer sur GitHub Pages

### A. Déploiement en 2 minutes sur GitHub Pages :
1. Créez un nouveau dépôt public ou privé sur votre compte GitHub (ex: `vinego-equipe18`).
2. Dans le terminal de votre dossier :
   ```bash
   git init
   git add .
   git commit -m "Déploiement SuberTech Industries - Équipe 18 Groupe C"
   git branch -M main
   git remote add origin https://github.com/<VOTRE-PSEUDO-GITHUB>/<VOTRE-DEPOT>.git
   git push -u origin main
   ```
3. Sur GitHub, rendez-vous dans **Settings > Pages** :
   * **Source :** Sélectionnez *Deploy from a branch*.
   * **Branch :** Sélectionnez `main` et `/root`, puis cliquez sur **Save**.
4. En 30 secondes, votre application est en ligne à l'adresse :
   `https://<VOTRE-PSEUDO-GITHUB>.github.io/<VOTRE-DEPOT>/`

### B. Fonctionnalités de Synchronisation d'Équipe :
* **Bouton « Lien Équipe » :** Génère un lien URL unique compressé contenant toutes vos décisions pour les Mois 1 à 4. Envoyez-le sur votre groupe WhatsApp / Discord, vos coéquipiers cliquent dessus et ouvrent instantanément le tableau de bord avec vos données !
* **Bouton « Sauvegarder » :** Télécharge un fichier de sauvegarde `.json`.
* **Bouton « Importer » :** Charge en 1 clic le fichier `.json` partagé par un membre de l'équipe.
* **Auto-sauvegarde locale :** Toutes vos modifications sont enregistrées en temps réel dans votre navigateur (`LocalStorage`).

---

## 2. Contenu des Fichiers du Projet

* **`index.html`** : Interface web interactive complète comprenant 5 modules :
  1. *Cockpit Décisionnel M1* : Saisie des approvisionnements, transformation usine, ventes Stecker & Distributeurs, P&L instantané, trésorerie, calcul des points au barème.
  2. *Coût de Revient & Seuil de Rentabilité* : Décomposition exacte conforme au cours Sciado Partenaires (Charges directes + indirectes unitaires, graphique interactif du point mort).
  3. *Optimiseur Logistique & RSE* : Calculateur automatique de flotte (Bateau, Train, Camion, Avion) minimisant le coût unitaire et optimisant la note RSE.
  4. *Simulateur de Négociation Distributeurs & Stecker* : Outil d'évaluation des offres reçues (prix, quantités, délais) avec calcul des marges de chaque partie et contre-offres recommandées.
  5. *Challenge 1 : Identité & Charte* : Visualisation du logo haute définition et texte prêt à copier pour le rendu du challenge.
* **`simulator.js`** : Moteur économique certifié avec tous les barèmes, rendements industriels et règles de flux financiers.
* **`test_engine.js`** : Suite de tests automatisés validant les formules et seuils de rentabilité.
* **`Equipe_X_Identite.md`** : Dossier officiel complet pour le Challenge Identité du Mois 1 (prêt à exporter en PDF ou Word).
* **`logo.jpg`** : Logo officiel haute résolution généré pour SuberTech Industries (*« L'Excellence du Liège, l'Empreinte de Demain »*).
* **`logo.svg`** : Version vectorielle du logo.

---

## 3. Les 5 Règles d'Or pour Gagner la Simulation

1. **Volume critique dès le Mois 1 (Viser 10 000 lots vendus) :**
   * Votre seuil de rentabilité est de **~9 474 lots** à 21 €/lot pour couvrir les 95 500 € de charges fixes.
   * Vous disposez de **12 000 lots** mobilisables en M1 (3 000 bouchons de stock initial + 9 000 lots produits par les mouleuses, plafonnées à leur capacité max de 45 000 kg de grains, laissant 1 000 kg de grains en réserve pour M2).
   * **Vendre 10 000 lots à 21-22 € vous assure un Résultat Net positif (+4 000 € à +15 000 €)** dès le premier mois, vous propulsant à la **1ère place du classement (20 pts RN + 10 pts CA = 30/30 pts)** !

2. **Commande Fournisseur Espagnol : Activer la remise volume immédiatement :**
   * Commandez dès le Mois 1 **100 000 kg de liège brut à 0,47 €/kg** (au lieu de 0,50 €).
   * Cette commande est livrée en M2 et payée 30 jours après livraison (donc décaissée en **M3**). **Impact trésorerie en M1 = 0 €**, mais coût de matière réduit de 6% pour toujours !

3. **Négociation Distributeurs : Cibler les clients à haute marge :**
   * Les distributeurs revendent aux Vignerons entre **40 € et 80 €**, et aux Caves entre **25 € et 50 €**.
   * Vous pouvez leur vendre à **21,50 € - 22,50 €** : ils réaliseront encore une marge colossale et préféreront votre fiabilité.
   * Privilégiez un paiement comptant ou 15-30 jours maximum.

4. **Logistique : Zéro Avion, Priorité Train & Bateau :**
   * L'avion coûte 1,32 €/lot et plombe la note RSE.
   * Le Bateau (0,81 €/lot) et le Train (1,05 €/lot) offrent le meilleur compromis rentabilité / RSE.

5. **Gagner le Challenge Identité (60% de la note finale !) :**
   * Le livrable `Equipe_X_Identite.md` avec `logo.jpg` vous donne toutes les clés pour remporter les **2 000 lots de bouchons de la 1ère place** (valeur marchande de ~42 000 €) !
