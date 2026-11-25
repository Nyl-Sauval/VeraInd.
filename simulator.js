// simulator.js - Moteur décisionnel & Récapitulatif Mois par Mois pour l'Équipe 18 Groupe C (Vinego)

const PARAMS = {
  capitalDepart: 500000,
  salairesMensuels: 60000, // En M1 et M2
  salairesMensuelsM3: 100000, // Dès le Mois 3 (Note de conjoncture)
  fraisStructureMensuels: 35000,
  amortissementMensuel: 500, // 30 000 € sur 5 ans = 500 € / mois
  amortissementTubeuseMensuel: 250, // 15 000 € sur 5 ans = 250 € / mois dès Février (M2)

  getSalairesMensuels: function(m) {
    return m >= 3 ? this.salairesMensuelsM3 : this.salairesMensuels;
  },
  getAmortissementMensuel: function(m) {
    return m >= 2 ? (this.amortissementMensuel + this.amortissementTubeuseMensuel) : this.amortissementMensuel;
  },

  tauxMarketing: 0.05, // 5% du CA
  tauxStockage: 0.0042, // 0.42% de la valeur du stock final

  // Stocks de départ (Mois 1)
  stockInitLiegeKg: 110000,
  prixAchatLiegeInit: 0.50,
  stockInitGrainsKg: 7500,
  prixAchatGrainsInit: 0.56,
  stockInitBouchonsLots: 3000,
  prixAchatBouchonsInit: 12.0,

  // Stocks rachetés du client allemand (disponibles en M3, payés en M3)
  stockRachetePlanchesKg: 72000, // Total 72 000 kg = 175 000 € exacts
  stockRachetePlanchesAKg: 30000, // 30 000 kg @ 2.00 €/kg = 60 000 €
  stockRachetePlanchesBKg: 22000, // 22 000 kg @ 2.50 €/kg = 55 000 €
  stockRachetePlanchesCKg: 20000, // 20 000 kg @ 3.00 €/kg = 60 000 €
  prixAchatPlanchesAInit: 2.00,
  prixAchatPlanchesBInit: 2.50,
  prixAchatPlanchesCInit: 3.00,

  // Rendements de production classiques (Agglomérés)
  rendementBroyage: 0.35, // 100 kg liège -> 35 kg grains
  coutBroyageKg: 0.02,    // 0,02 € / kg liège entré
  rendementMoulage: 0.20, // 100 kg grains -> 20 lots de bouchons (soit 5 kg / lot)
  coutMoulageKg: 0.40,    // 0,40 € / kg grain entré (soit 2 € / lot)

  // Paramètres du procédé de tubage (Bouchons Naturels - Nouvelles Activités M3)
  coutTubagePlanche: 0.03, // 0,03 € / planche tubée (soit 0,30 € / lot)
  ratioPlanchesParLot: 10, // 10 planches (10 kg) -> 1 lot de bouchons naturels
  rendementLiegeABroyerTubage: 0.50, // 50% de perte = 5 kg de liège à broyer récupéré par lot

  // Capacités maximales des machines (par mois)
  capaciteMoulinsKg: 155000,   // Limite Moulins : max 155 000 kg liège brut / mois
  capaciteMouleusesKg: 45000,  // Limite Mouleuses : max 45 000 kg grains / mois (soit 9 000 lots max / mois)
  capaciteTubeusesPlanches: 75000, // Limite Tubeuses : max 75 000 planches / mois (soit 7 500 lots naturels max / mois)

  // Événements de trésorerie exceptionnels
  achatTubeuseComptantM2: 15000, // Payé comptant en Février (M2)
  rachatStockPlanchesM3: 175000,  // Payé en Mars (M3)
  bonusBouchonsGagnesM3Lots: 2000, // 2 000 bouchons agglomérés gagnés entre Fév et Mars (ajoutés en stock M3)
  
  // Enchères Mai (M5) - Lot 1 (15k Maroc A + 15k Maroc B)
  encheresM5Lot1PlanchesAKg: 15000,
  encheresM5Lot1PlanchesBKg: 15000,
  encheresM5Lot1Prix: 31000,

  // Enchères Mai (M5) - Lot 2 (30k Maroc B + 10k Espagne A)
  encheresM5Lot2PlanchesBKg: 30000,
  encheresM5Lot2PlanchesEspagneAKg: 10000,
  encheresM5Lot2Prix: 30000,

  // Totaux Enchères M5
  encheresM5PlanchesAKg: 15000,
  encheresM5PlanchesBKg: 45000, // 15k + 30k
  encheresM5PlanchesEspagneAKg: 10000,
  encheresM5PrixTotal: 61000, // 31k + 30k

  // Paramètres de trieuse des distributeurs (pour simulation et négociation)
  trieuse: {
    coutTriLot: 2.00, // 2 € / lot en entrée
    repartition: {
      A: { Q1: 0.15, Q2: 0.30, Q3: 0.30, Q4: 0.25 },
      B: { Q1: 0.20, Q2: 0.30, Q3: 0.30, Q4: 0.20 },
      C: { Q1: 0.25, Q2: 0.30, Q3: 0.25, Q4: 0.20 }
    },
    // Prix moyens observés auprès des clients finaux (Vignerons, Caves, Grands Comptes)
    prixClientsMoyens: {
      Q1: 170, // 160 à 200 €
      Q2: 145, // 125 à 180 €
      Q3: 120, // 105 à 160 €
      Q4: 95   // 85 à 140 €
    }
  },

  // Prix moyens du marché distributeurs constatés (Note de Conjoncture M3)
  prixMarcheNaturels: {
    A: 55.0, // Espagne A
    B: 60.0, // Espagne B
    C: 65.0  // Espagne C
  },

  // Grille de remise producteur espagnol (Liège brut : -3% par tranche de 20k kg dès 70k kg)
  getPrixLiege: function(kg) {
    if (kg >= 150000) return 0.425; // -15% (ex: 150k kg = 63 750 €, 155k kg = 65 875 €)
    if (kg >= 130000) return 0.440; // -12%
    if (kg >= 110000) return 0.455; // -9%
    if (kg >= 90000)  return 0.470; // -6%
    if (kg >= 70000)  return 0.485; // -3% (ex: 70k kg = 33 950 €)
    return 0.50; // Tarif de base (< 70 000 kg)
  },

  // Grilles de prix des planches (Commande min 5 000 €, réductions dès 10 000 €)
  getPrixPlancheA: function(kg) {
    if (kg >= 20000) return 1.70;
    if (kg >= 18000) return 1.76;
    if (kg >= 15000) return 1.82;
    if (kg >= 13000) return 1.88;
    if (kg >= 10000) return 1.94;
    return 2.00; // Base (< 10 000 kg, min 5 000 € soit 2 500 kg)
  },

  getPrixPlancheB: function(kg) {
    if (kg >= 20000) return 2.13;
    if (kg >= 18000) return 2.20;
    if (kg >= 15000) return 2.28;
    if (kg >= 13000) return 2.35;
    if (kg >= 10000) return 2.43;
    return 2.50; // Base (< 10 000 kg, min 5 000 € soit 2 000 kg)
  },

  getPrixPlancheC: function(kg) {
    if (kg >= 20000) return 2.55;
    if (kg >= 18000) return 2.64;
    if (kg >= 15000) return 2.73;
    if (kg >= 13000) return 2.82;
    if (kg >= 10000) return 2.91;
    return 3.00; // Base (< 10 000 kg, min 5 000 € soit 1 667 kg)
  },

  // Modes de transport disponibles
  transports: {
    camion: { id: 'camion', nom: 'Camion', capacite: 1980, cout: 1721, rse: 'Plutôt polluant', icone: 'fa-truck' },
    train:  { id: 'train',  nom: 'Train',  capacite: 2640, cout: 2768, rse: 'Peu polluant (RSE)', icone: 'fa-train' },
    bateau: { id: 'bateau', nom: 'Bateau', capacite: 5760, cout: 4668, rse: 'Économique gros volume', icone: 'fa-ship' },
    avion:  { id: 'avion',  nom: 'Avion',  capacite: 60,   cout: 79,   rse: 'Très polluant (Urgence)', icone: 'fa-plane' }
  },

  baremePoints: [10, 8, 6, 5, 4, 3, 2, 1],

  // Configuration temporelle de la simulation (8 mois)
  nbMoisTotal: 8,
  moisNoms: ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août'],
  moisCourts: ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août']
};

// Modèle par défaut pour un mois
function getDefaultMonthData(m) {
  if (m === 1) {
    return {
      commandeLiegeKg: 150000,
      reductionFournisseurPct: 0,
      commandePlanchesAKg: 0,
      commandePlanchesBKg: 0,
      commandePlanchesCKg: 0,
      liegeABroyerKg: 110000, // Stock initial usine (<= 155 000 kg limite moulins)
      grainsAMoulerKg: 45000, // Plafonné à la capacité machine des mouleuses (45 000 kg max)
      planchesATuberAKg: 0,
      planchesATuberBKg: 0,
      planchesATuberCKg: 0,
      planchesATuberMarocAKg: 0,
      planchesATuberMarocBKg: 0,
      planchesATuberMarocCKg: 0,
      ventes: [
        { client: 'Équipe Distributeur 1', lots: 3000, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 2', lots: 3000, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 3', lots: 2500, prix: 21.0, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 30, transport: 'train' },
        { client: 'Équipe Distributeur 4', lots: 1500, prix: 21.0, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' }
      ],
      bonusBouchonsLots: 0,
      tresoDebutForce: null,
      encheresPlanchesAKg: 0,
      encheresPlanchesBKg: 0,
      encheresPlanchesCKg: 0,
      encheresPrixTotal: 0
    };
  }
  if (m === 2) {
    return {
      commandeLiegeKg: 150000,
      reductionFournisseurPct: 0,
      commandePlanchesAKg: 0,
      commandePlanchesBKg: 0,
      commandePlanchesCKg: 0,
      liegeABroyerKg: 150000, // <= 155 000 kg max moulins
      grainsAMoulerKg: 45000, // <= 45 000 kg max mouleuses
      planchesATuberAKg: 0,
      planchesATuberBKg: 0,
      planchesATuberCKg: 0,
      planchesATuberMarocAKg: 0,
      planchesATuberMarocBKg: 0,
      planchesATuberMarocCKg: 0,
      bonusBouchonsLots: 0,
      tresoDebutForce: null,
      encheresPlanchesAKg: 0,
      encheresPlanchesBKg: 0,
      encheresPlanchesCKg: 0,
      encheresPrixTotal: 0,
      ventes: [
        { client: 'Équipe Distributeur 1', lots: 3000, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 2', lots: 3000, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 3', lots: 2500, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 4', lots: 2500, prix: 21.5, lotsNatA: 0, prixNatA: 55, lotsNatB: 0, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'camion' }
      ]
    };
  }
  if (m === 3) {
    // En Mois 3 : 9 000 lots produits + 2 000 lots bonus gagnés = 11 000 lots d'agglomérés disponibles
    // + 3 000 lots de bouchons naturels (1 000 A + 1 000 B + 1 000 C)
    return {
      commandeLiegeKg: 150000,
      reductionFournisseurPct: 0,
      commandePlanchesAKg: 0,
      commandePlanchesBKg: 0,
      commandePlanchesCKg: 0,
      liegeABroyerKg: 150000, // <= 155 000 kg max moulins
      grainsAMoulerKg: 45000, // <= 45 000 kg max mouleuses (9 000 lots)
      planchesATuberAKg: 10000, // 1 000 lots A
      planchesATuberBKg: 10000, // 1 000 lots B
      planchesATuberCKg: 10000, // 1 000 lots C
      planchesATuberMarocAKg: 0,
      planchesATuberMarocBKg: 0,
      planchesATuberMarocCKg: 0,
      bonusBouchonsLots: 2000, // 2 000 bouchons agglomérés gagnés entre Fév et Mars
      tresoDebutForce: null,
      encheresPlanchesAKg: 0,
      encheresPlanchesBKg: 0,
      encheresPlanchesCKg: 0,
      encheresPrixTotal: 0,
      ventes: [
        { client: 'Équipe Distributeur 1', lots: 2750, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 2', lots: 2750, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 3', lots: 2750, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 4', lots: 2750, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' }
      ]
    };
  }
  if (m === 5) {
    // En Mai (Mois 5) : 2 Enchères remportées
    // Lot 1 : 15 000 Maroc A + 15 000 Maroc B pour 31 000 €
    // Lot 2 : 30 000 Maroc B + 10 000 Espagne A pour 30 000 €
    // Total payé comptant : 61 000 €
    return {
      commandeLiegeKg: 150000,
      reductionFournisseurPct: 0,
      commandePlanchesAKg: 0,
      commandePlanchesBKg: 0,
      commandePlanchesCKg: 0,
      encheresLot1PlanchesAKg: 15000,
      encheresLot1PlanchesBKg: 15000,
      encheresLot1Prix: 31000,
      encheresLot2PlanchesBKg: 30000,
      encheresLot2PlanchesEspagneAKg: 10000,
      encheresLot2Prix: 30000,
      encheresPlanchesAKg: 15000,
      encheresPlanchesBKg: 45000,
      encheresPlanchesCKg: 0,
      encheresPlanchesEspagneAKg: 10000,
      encheresPrixTotal: 61000,
      liegeABroyerKg: 150000, // <= 155 000 kg max moulins
      grainsAMoulerKg: 45000, // <= 45 000 kg max mouleuses (9 000 lots)
      planchesATuberAKg: 10000, // 1 000 lots Espagne A
      planchesATuberBKg: 2000,  // 200 lots Espagne B
      planchesATuberCKg: 0,     // Planches Espagne C épuisées
      planchesATuberMarocAKg: 5000, // 500 lots Maroc A tubés
      planchesATuberMarocBKg: 5000, // 500 lots Maroc B tubés
      planchesATuberMarocCKg: 0,
      bonusBouchonsLots: 0,
      tresoDebutForce: null,
      ventes: [
        { client: 'Équipe Distributeur 1', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 50, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 125, prixNatMarocA: 55, lotsNatMarocB: 125, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 2', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 50, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 125, prixNatMarocA: 55, lotsNatMarocB: 125, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 3', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 50, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 125, prixNatMarocA: 55, lotsNatMarocB: 125, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
        { client: 'Équipe Distributeur 4', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 50, prixNatB: 60, lotsNatC: 0, prixNatC: 65, lotsNatMarocA: 125, prixNatMarocA: 55, lotsNatMarocB: 125, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' }
      ]
    };
  }
  // Par défaut pour M4, M6, M7, M8 : Mix de production optimal Agglomérés (9k) + Bouchons Naturels
  return {
    commandeLiegeKg: 150000,
    reductionFournisseurPct: 0,
    commandePlanchesAKg: 0,
    commandePlanchesBKg: 0,
    commandePlanchesCKg: 0,
    encheresPlanchesAKg: 0,
    encheresPlanchesBKg: 0,
    encheresPlanchesCKg: 0,
    encheresPrixTotal: 0,
    liegeABroyerKg: 150000, // <= 155 000 kg max moulins
    grainsAMoulerKg: 45000, // <= 45 000 kg max mouleuses (9 000 lots)
    planchesATuberAKg: 10000, // 1 000 lots A
    planchesATuberBKg: 10000, // 1 000 lots B
    planchesATuberCKg: 10000, // 1 000 lots C
    planchesATuberMarocAKg: 0,
    planchesATuberMarocBKg: 0,
    planchesATuberMarocCKg: 0,
    bonusBouchonsLots: 0,
    tresoDebutForce: null,
    ventes: [
      { client: 'Équipe Distributeur 1', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
      { client: 'Équipe Distributeur 2', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
      { client: 'Équipe Distributeur 3', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' },
      { client: 'Équipe Distributeur 4', lots: 2250, prix: 21.5, lotsNatA: 250, prixNatA: 55, lotsNatB: 250, prixNatB: 60, lotsNatC: 250, prixNatC: 65, lotsNatMarocA: 0, prixNatMarocA: 55, lotsNatMarocB: 0, prixNatMarocB: 60, lotsNatMarocC: 0, prixNatMarocC: 65, delai: 0, transport: 'train' }
    ]
  };
}

// Modèle de données complet multi-mois (8 mois)
function getDefaultState() {
  const moisData = {};
  for (let m = 1; m <= PARAMS.nbMoisTotal; m++) {
    moisData[m] = getDefaultMonthData(m);
  }
  return {
    moisActif: 1,
    recapMaxMonth: 8,
    reglementFournisseur: '30j', // Règle officielle : 30j après livraison (M+2, donc 30j après 30j)
    moisData
  };
}

let appState = getDefaultState();

// PERSISTANCE LOCALSTORAGE & URL
const STORAGE_KEY = 'vinego_subertech_equipe18_multimois_v1';

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    return true;
  } catch (e) {
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        migrateState(parsed);
        return true;
      }
    }
    // Tentative de récupération ancienne clé v2
    const oldRaw = localStorage.getItem('vinego_subertech_equipe18_simple_v2');
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (oldParsed) {
        migrateState(oldParsed);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function migrateState(parsed) {
  if (parsed.moisData && parsed.moisData[1]) {
    appState = parsed;
    if (!appState.moisActif) appState.moisActif = 1;
    if (!appState.recapMaxMonth) appState.recapMaxMonth = 8;
    // Règle officielle demandée : 30j après la livraison (M+2, donc 30j après 30j)
    if (!appState.reglementFournisseur || appState.reglementFournisseur === 'instant') {
      appState.reglementFournisseur = '30j';
    }
    if (appState.moisData[3] && appState.moisData[3].bonusBouchonsLots === undefined) {
      appState.moisData[3].bonusBouchonsLots = 2000;
    }
    if (appState.moisData[5]) {
      if (appState.moisData[5].encheresLot1PlanchesAKg === undefined) {
        appState.moisData[5].encheresLot1PlanchesAKg = 15000;
      }
      if (appState.moisData[5].encheresLot1PlanchesBKg === undefined) {
        appState.moisData[5].encheresLot1PlanchesBKg = 15000;
      }
      if (appState.moisData[5].encheresLot1Prix === undefined) {
        appState.moisData[5].encheresLot1Prix = 31000;
      }
      if (appState.moisData[5].encheresLot2PlanchesBKg === undefined) {
        appState.moisData[5].encheresLot2PlanchesBKg = 30000;
      }
      if (appState.moisData[5].encheresLot2PlanchesEspagneAKg === undefined) {
        appState.moisData[5].encheresLot2PlanchesEspagneAKg = 10000;
      }
      if (appState.moisData[5].encheresLot2Prix === undefined) {
        appState.moisData[5].encheresLot2Prix = 30000;
      }
      if (appState.moisData[5].encheresPlanchesAKg === undefined) {
        appState.moisData[5].encheresPlanchesAKg = 15000;
      }
      if (appState.moisData[5].encheresPlanchesBKg === undefined || appState.moisData[5].encheresPlanchesBKg === 15000) {
        appState.moisData[5].encheresPlanchesBKg = 45000;
      }
      if (appState.moisData[5].encheresPlanchesEspagneAKg === undefined) {
        appState.moisData[5].encheresPlanchesEspagneAKg = 10000;
      }
      if (appState.moisData[5].encheresPlanchesCKg === undefined) {
        appState.moisData[5].encheresPlanchesCKg = 0;
      }
      if (appState.moisData[5].encheresPrixTotal === undefined || appState.moisData[5].encheresPrixTotal === 31000) {
        appState.moisData[5].encheresPrixTotal = 61000;
      }
    }
    // S'assurer que tous les mois existent et respectent les capacités machines
    for (let m = 1; m <= PARAMS.nbMoisTotal; m++) {
      if (!appState.moisData[m]) {
        appState.moisData[m] = getDefaultMonthData(m);
      } else {
        if (appState.moisData[m].liegeABroyerKg > PARAMS.capaciteMoulinsKg) {
          appState.moisData[m].liegeABroyerKg = PARAMS.capaciteMoulinsKg;
        }
        if (appState.moisData[m].grainsAMoulerKg > PARAMS.capaciteMouleusesKg) {
          appState.moisData[m].grainsAMoulerKg = PARAMS.capaciteMouleusesKg;
        }
        if (appState.moisData[m].planchesATuberMarocAKg === undefined) appState.moisData[m].planchesATuberMarocAKg = 0;
        if (appState.moisData[m].planchesATuberMarocBKg === undefined) appState.moisData[m].planchesATuberMarocBKg = 0;
        if (appState.moisData[m].planchesATuberMarocCKg === undefined) appState.moisData[m].planchesATuberMarocCKg = 0;
        if (appState.moisData[m].ventes) {
          appState.moisData[m].ventes.forEach(v => {
            if (v.lotsNatMarocA === undefined) v.lotsNatMarocA = 0;
            if (v.prixNatMarocA === undefined) v.prixNatMarocA = 55.0;
            if (v.lotsNatMarocB === undefined) v.lotsNatMarocB = 0;
            if (v.prixNatMarocB === undefined) v.prixNatMarocB = 60.0;
            if (v.lotsNatMarocC === undefined) v.lotsNatMarocC = 0;
            if (v.prixNatMarocC === undefined) v.prixNatMarocC = 65.0;
          });
        }
      }
    }
  } else if (parsed.ventes) {
    // Migration depuis ancien format mono-mois
    appState = getDefaultState();
    appState.reglementFournisseur = parsed.reglementFournisseur || 'instant';
    appState.moisData[1] = {
      commandeLiegeKg: parsed.commandeLiegeKg || 150000,
      liegeABroyerKg: Math.min(PARAMS.capaciteMoulinsKg, parsed.liegeABroyerKg || 110000),
      grainsAMoulerKg: Math.min(PARAMS.capaciteMouleusesKg, parsed.grainsAMoulerKg || 45000),
      ventes: parsed.ventes || getDefaultMonthData(1).ventes
    };
  }
}

function generateShareLink() {
  const json = JSON.stringify(appState);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return window.location.origin + window.location.pathname + '#data=' + b64;
}

function loadFromUrlHash() {
  try {
    if (window.location.hash && window.location.hash.startsWith('#data=')) {
      const b64 = window.location.hash.replace('#data=', '');
      const json = decodeURIComponent(escape(atob(b64)));
      const parsed = JSON.parse(json);
      if (parsed) {
        migrateState(parsed);
        saveToLocalStorage();
        window.history.replaceState(null, null, window.location.pathname);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// MOTEUR DE SIMULATION ENCHAÎNÉE SUR LES 8 MOIS
function simulateAllMonths(state) {
  const results = {};
  let prevResult = null;
  let caCumule = 0;
  let rnCumule = 0;
  let scoreCumule = 0;
  let lotsCumule = 0;

  for (let m = 1; m <= PARAMS.nbMoisTotal; m++) {
    const isM1 = (m === 1);
    const monthData = (state.moisData && state.moisData[m]) ? state.moisData[m] : getDefaultMonthData(m);
    
    // 1. Commande au producteur espagnol (Liège brut)
    const commandeLiegeKg = Number(monthData.commandeLiegeKg) || 0;
    const prixLiegeKg = PARAMS.getPrixLiege(commandeLiegeKg);
    const montantCommandeLiegeBrut = commandeLiegeKg * prixLiegeKg;

    // 1 bis. Commandes de planches Espagne A, B, C (dès M3)
    const commandePlanchesAKg = (m >= 3) ? (Number(monthData.commandePlanchesAKg) || 0) : 0;
    const commandePlanchesBKg = (m >= 3) ? (Number(monthData.commandePlanchesBKg) || 0) : 0;
    const commandePlanchesCKg = (m >= 3) ? (Number(monthData.commandePlanchesCKg) || 0) : 0;

    const prixPlancheAKg = PARAMS.getPrixPlancheA(commandePlanchesAKg);
    const prixPlancheBKg = PARAMS.getPrixPlancheB(commandePlanchesBKg);
    const prixPlancheCKg = PARAMS.getPrixPlancheC(commandePlanchesCKg);

    const montantCommandePlancheABrut = commandePlanchesAKg * prixPlancheAKg;
    const montantCommandePlancheBBrut = commandePlanchesBKg * prixPlancheBKg;
    const montantCommandePlancheCBrut = commandePlanchesCKg * prixPlancheCKg;
    const montantCommandePlanchesBrut = montantCommandePlancheABrut + montantCommandePlancheBBrut + montantCommandePlancheCBrut;
    const montantCommandeFournisseurBrut = montantCommandeLiegeBrut + montantCommandePlanchesBrut;

    // Réduction globale négociée sur le total de la commande fournisseur (%)
    const reductionFournisseurPct = Math.max(0, Math.min(100, Number(monthData.reductionFournisseurPct) || 0));
    const remiseFournisseurFacteur = Math.max(0, 1 - (reductionFournisseurPct / 100));

    const montantCommandeLiege = montantCommandeLiegeBrut * remiseFournisseurFacteur;
    const montantCommandePlancheA = montantCommandePlancheABrut * remiseFournisseurFacteur;
    const montantCommandePlancheB = montantCommandePlancheBBrut * remiseFournisseurFacteur;
    const montantCommandePlancheC = montantCommandePlancheCBrut * remiseFournisseurFacteur;
    const montantCommandePlanchesTotal = montantCommandePlancheA + montantCommandePlancheB + montantCommandePlancheC;
    const montantCommandeFournisseurTotal = montantCommandeLiege + montantCommandePlanchesTotal;
    const montantEconomieRemiseFournisseur = montantCommandeFournisseurBrut - montantCommandeFournisseurTotal;

    // 2. Stocks entrants au début du mois
    // A. Liège brut
    const livraisonRecueKg = isM1 ? 0 : (prevResult.commandeLiegeKg || 0);
    const livraisonRecueVal = isM1 ? 0 : (prevResult.montantCommandeLiege || 0);

    let stockLiegeEntrantKg = isM1 ? PARAMS.stockInitLiegeKg : (prevResult.stockLiegeFinKg + livraisonRecueKg);
    let valStockLiegeEntrant = isM1 ? (PARAMS.stockInitLiegeKg * PARAMS.prixAchatLiegeInit) : (prevResult.valStockLiegeFin + livraisonRecueVal);

    // B. Grains
    const stockGrainsEntrantKg = isM1 ? PARAMS.stockInitGrainsKg : prevResult.stockGrainsFinKg;
    const valStockGrainsEntrant = isM1 ? (PARAMS.stockInitGrainsKg * PARAMS.prixAchatGrainsInit) : prevResult.valStockGrainsFin;
    const cmpGrainsKg = stockGrainsEntrantKg > 0 ? (valStockGrainsEntrant / stockGrainsEntrantKg) : 1.335;

    // C. Bouchons agglomérés (avec intégration des 2 000 bouchons bonus gagnés entre Fév et Mars en M3)
    const bonusBouchonsLots = (monthData.bonusBouchonsLots !== undefined)
      ? Number(monthData.bonusBouchonsLots)
      : (m === 3 ? (PARAMS.bonusBouchonsGagnesM3Lots || 2000) : 0);
    const stockBouchonsEntrantPreBonus = isM1 ? PARAMS.stockInitBouchonsLots : prevResult.stockBouchonsFinLots;
    const stockBouchonsEntrantLots = stockBouchonsEntrantPreBonus + bonusBouchonsLots;
    const valStockBouchonsEntrant = isM1 ? (PARAMS.stockInitBouchonsLots * PARAMS.prixAchatBouchonsInit) : prevResult.valStockBouchonsFin;

    // D. Planches (Espagne A, B, C) - Disponibles dès M3 grâce au rachat allemand (175 000 €) puis réapprovisionnements
    // D2. Enchères Exceptionnelles Mai (Mois 5) : 2 Lots Remportés
    // Lot 1 : 15 000 Maroc A + 15 000 Maroc B pour 31 000 €
    // Lot 2 : 30 000 Maroc B + 10 000 Espagne A pour 30 000 €
    const encheresLot1MarocAKg = (monthData.encheresLot1PlanchesAKg !== undefined)
      ? Number(monthData.encheresLot1PlanchesAKg)
      : (m === 5 ? (PARAMS.encheresM5Lot1PlanchesAKg || 15000) : 0);

    const encheresLot1MarocBKg = (monthData.encheresLot1PlanchesBKg !== undefined)
      ? Number(monthData.encheresLot1PlanchesBKg)
      : (m === 5 ? (PARAMS.encheresM5Lot1PlanchesBKg || 15000) : 0);

    const encheresLot1Prix = (monthData.encheresLot1Prix !== undefined && monthData.encheresLot1Prix !== null && monthData.encheresLot1Prix !== '')
      ? Number(monthData.encheresLot1Prix)
      : (m === 5 ? (PARAMS.encheresM5Lot1Prix || 31000) : 0);

    const encheresLot2MarocBKg = (monthData.encheresLot2PlanchesBKg !== undefined)
      ? Number(monthData.encheresLot2PlanchesBKg)
      : (m === 5 ? (PARAMS.encheresM5Lot2PlanchesBKg || 30000) : 0);

    const encheresLot2EspagneAKg = (monthData.encheresLot2PlanchesEspagneAKg !== undefined)
      ? Number(monthData.encheresLot2PlanchesEspagneAKg)
      : (monthData.encheresPlanchesEspagneAKg !== undefined ? Number(monthData.encheresPlanchesEspagneAKg) : (m === 5 ? (PARAMS.encheresM5Lot2PlanchesEspagneAKg || 10000) : 0));

    const encheresLot2Prix = (monthData.encheresLot2Prix !== undefined && monthData.encheresLot2Prix !== null && monthData.encheresLot2Prix !== '')
      ? Number(monthData.encheresLot2Prix)
      : (m === 5 ? (PARAMS.encheresM5Lot2Prix || 30000) : 0);

    const encheresPlanchesCKg = (monthData.encheresPlanchesCKg !== undefined)
      ? Number(monthData.encheresPlanchesCKg)
      : 0;

    // Totaux cumulés
    const encheresPlanchesAKg = encheresLot1MarocAKg;
    const encheresPlanchesBKg = encheresLot1MarocBKg + encheresLot2MarocBKg;
    const encheresPlanchesEspagneAKg = encheresLot2EspagneAKg;
    const encheresPrixTotal = encheresLot1Prix + encheresLot2Prix;

    // Ventilation comptable Lot 1 (Maroc A & Maroc B)
    let valLot1A = 0;
    let valLot1B = 0;
    const ref1 = (encheresLot1MarocAKg * PARAMS.prixAchatPlanchesAInit) + (encheresLot1MarocBKg * PARAMS.prixAchatPlanchesBInit);
    if (ref1 > 0 && encheresLot1Prix > 0) {
      valLot1A = encheresLot1Prix * ((encheresLot1MarocAKg * PARAMS.prixAchatPlanchesAInit) / ref1);
      valLot1B = encheresLot1Prix * ((encheresLot1MarocBKg * PARAMS.prixAchatPlanchesBInit) / ref1);
    } else if ((encheresLot1MarocAKg + encheresLot1MarocBKg) > 0 && encheresLot1Prix > 0) {
      const tot1 = encheresLot1MarocAKg + encheresLot1MarocBKg;
      valLot1A = encheresLot1Prix * (encheresLot1MarocAKg / tot1);
      valLot1B = encheresLot1Prix * (encheresLot1MarocBKg / tot1);
    }

    // Ventilation comptable Lot 2 (Espagne A & Maroc B)
    let valLot2EspA = 0;
    let valLot2MarocB = 0;
    const ref2 = (encheresLot2EspagneAKg * PARAMS.prixAchatPlanchesAInit) + (encheresLot2MarocBKg * PARAMS.prixAchatPlanchesBInit);
    if (ref2 > 0 && encheresLot2Prix > 0) {
      valLot2EspA = encheresLot2Prix * ((encheresLot2EspagneAKg * PARAMS.prixAchatPlanchesAInit) / ref2);
      valLot2MarocB = encheresLot2Prix * ((encheresLot2MarocBKg * PARAMS.prixAchatPlanchesBInit) / ref2);
    } else if ((encheresLot2EspagneAKg + encheresLot2MarocBKg) > 0 && encheresLot2Prix > 0) {
      const tot2 = encheresLot2EspagneAKg + encheresLot2MarocBKg;
      valLot2EspA = encheresLot2Prix * (encheresLot2EspagneAKg / tot2);
      valLot2MarocB = encheresLot2Prix * (encheresLot2MarocBKg / tot2);
    }

    const valEncheresA = valLot1A;
    const valEncheresB = valLot1B + valLot2MarocB;
    const valEncheresC = 0;

    let livraisonPlanchesAKg = 0;
    let livraisonPlanchesAVal = 0;
    let livraisonPlanchesBKg = 0;
    let livraisonPlanchesBVal = 0;
    let livraisonPlanchesCKg = 0;
    let livraisonPlanchesCVal = 0;

    let stockPlanchesAEntrantKg = 0;
    let valStockPlanchesAEntrant = 0;
    let stockPlanchesBEntrantKg = 0;
    let valStockPlanchesBEntrant = 0;
    let stockPlanchesCEntrantKg = 0;
    let valStockPlanchesCEntrant = 0;

    if (m === 3) {
      stockPlanchesAEntrantKg = PARAMS.stockRachetePlanchesAKg; // 30 000 kg
      valStockPlanchesAEntrant = PARAMS.stockRachetePlanchesAKg * PARAMS.prixAchatPlanchesAInit; // 60 000 €
      stockPlanchesBEntrantKg = PARAMS.stockRachetePlanchesBKg; // 22 000 kg
      valStockPlanchesBEntrant = PARAMS.stockRachetePlanchesBKg * PARAMS.prixAchatPlanchesBInit; // 55 000 €
      stockPlanchesCEntrantKg = PARAMS.stockRachetePlanchesCKg; // 20 000 kg
      valStockPlanchesCEntrant = PARAMS.stockRachetePlanchesCKg * PARAMS.prixAchatPlanchesCInit; // 60 000 €
    } else if (m > 3 && prevResult) {
      livraisonPlanchesAKg = prevResult.commandePlanchesAKg || 0;
      livraisonPlanchesAVal = prevResult.montantCommandePlancheA || 0;
      livraisonPlanchesBKg = prevResult.commandePlanchesBKg || 0;
      livraisonPlanchesBVal = prevResult.montantCommandePlancheB || 0;
      livraisonPlanchesCKg = prevResult.commandePlanchesCKg || 0;
      livraisonPlanchesCVal = prevResult.montantCommandePlancheC || 0;

      stockPlanchesAEntrantKg = (prevResult.stockPlanchesAFinKg || 0) + livraisonPlanchesAKg + encheresLot2EspagneAKg;
      valStockPlanchesAEntrant = (prevResult.valStockPlanchesAFin || 0) + livraisonPlanchesAVal + valLot2EspA;

      stockPlanchesBEntrantKg = (prevResult.stockPlanchesBFinKg || 0) + livraisonPlanchesBKg;
      valStockPlanchesBEntrant = (prevResult.valStockPlanchesBFin || 0) + livraisonPlanchesBVal;

      stockPlanchesCEntrantKg = (prevResult.stockPlanchesCFinKg || 0) + livraisonPlanchesCKg;
      valStockPlanchesCEntrant = (prevResult.valStockPlanchesCFin || 0) + livraisonPlanchesCVal;
    }

    // D. Planches Espagne (A, B, C) - Disponibles dès M3 grâce au rachat allemand (175 000 €) puis réapprovisionnements
    const cmpPlancheAKg = stockPlanchesAEntrantKg > 0 ? (valStockPlanchesAEntrant / stockPlanchesAEntrantKg) : PARAMS.prixAchatPlanchesAInit;
    const cmpPlancheBKg = stockPlanchesBEntrantKg > 0 ? (valStockPlanchesBEntrant / stockPlanchesBEntrantKg) : PARAMS.prixAchatPlanchesBInit;
    const cmpPlancheCKg = stockPlanchesCEntrantKg > 0 ? (valStockPlanchesCEntrant / stockPlanchesCEntrantKg) : PARAMS.prixAchatPlanchesCInit;

    // Stocks entrants Maroc (Report mois précédent + Nouvelles enchères du mois)
    const stockPlanchesMarocAEntrantKg = (prevResult ? (prevResult.stockPlanchesMarocAFinKg || 0) : 0) + encheresLot1MarocAKg;
    const valStockPlanchesMarocAEntrant = (prevResult ? (prevResult.valStockPlanchesMarocAFin || 0) : 0) + valLot1A;

    const stockPlanchesMarocBEntrantKg = (prevResult ? (prevResult.stockPlanchesMarocBFinKg || 0) : 0) + encheresLot1MarocBKg + encheresLot2MarocBKg;
    const valStockPlanchesMarocBEntrant = (prevResult ? (prevResult.valStockPlanchesMarocBFin || 0) : 0) + valLot1B + valLot2MarocB;

    const stockPlanchesMarocCEntrantKg = (prevResult ? (prevResult.stockPlanchesMarocCFinKg || 0) : 0) + encheresPlanchesCKg;
    const valStockPlanchesMarocCEntrant = (prevResult ? (prevResult.valStockPlanchesMarocCFin || 0) : 0) + valEncheresC;

    const cmpPlancheMarocAKg = stockPlanchesMarocAEntrantKg > 0 ? (valStockPlanchesMarocAEntrant / stockPlanchesMarocAEntrantKg) : (valEncheresA > 0 ? valEncheresA / (encheresPlanchesAKg || 1) : 0.9185);
    const cmpPlancheMarocBKg = stockPlanchesMarocBEntrantKg > 0 ? (valStockPlanchesMarocBEntrant / stockPlanchesMarocBEntrantKg) : (valEncheresB > 0 ? valEncheresB / (encheresPlanchesBKg || 1) : 0.9090);
    const cmpPlancheMarocCKg = stockPlanchesMarocCEntrantKg > 0 ? (valStockPlanchesMarocCEntrant / stockPlanchesMarocCEntrantKg) : (valEncheresC > 0 ? valEncheresC / (encheresPlanchesCKg || 1) : 1.3778);

    // E. Bouchons naturels tubés en stock (Espagne & Maroc)
    let stockNatAEntrantLots = (m > 3 && prevResult) ? (prevResult.stockNatAFinLots || 0) : 0;
    let stockNatBEntrantLots = (m > 3 && prevResult) ? (prevResult.stockNatBFinLots || 0) : 0;
    let stockNatCEntrantLots = (m > 3 && prevResult) ? (prevResult.stockNatCFinLots || 0) : 0;

    let stockNatMarocAEntrantLots = (m > 4 && prevResult) ? (prevResult.stockNatMarocAFinLots || 0) : 0;
    let stockNatMarocBEntrantLots = (m > 4 && prevResult) ? (prevResult.stockNatMarocBFinLots || 0) : 0;
    let stockNatMarocCEntrantLots = (m > 4 && prevResult) ? (prevResult.stockNatMarocCFinLots || 0) : 0;

    // 3. Procédé de Tubage (Bouchons Naturels) - Dès M3
    const maxTubageMachine = PARAMS.capaciteTubeusesPlanches; // 75 000 planches / mois
    const planchesDemandeA = (m >= 3) ? (Number(monthData.planchesATuberAKg) || 0) : 0;
    const planchesDemandeB = (m >= 3) ? (Number(monthData.planchesATuberBKg) || 0) : 0;
    const planchesDemandeC = (m >= 3) ? (Number(monthData.planchesATuberCKg) || 0) : 0;

    const planchesDemandeMarocA = (m >= 5) ? (Number(monthData.planchesATuberMarocAKg) || 0) : 0;
    const planchesDemandeMarocB = (m >= 5) ? (Number(monthData.planchesATuberMarocBKg) || 0) : 0;
    const planchesDemandeMarocC = (m >= 5) ? (Number(monthData.planchesATuberMarocCKg) || 0) : 0;

    const planchesATuberAKg = Math.min(stockPlanchesAEntrantKg, Math.max(0, planchesDemandeA));
    const planchesATuberBKg = Math.min(stockPlanchesBEntrantKg, Math.max(0, planchesDemandeB));
    const planchesATuberCKg = Math.min(stockPlanchesCEntrantKg, Math.max(0, planchesDemandeC));

    const planchesATuberMarocAKg = Math.min(stockPlanchesMarocAEntrantKg, Math.max(0, planchesDemandeMarocA));
    const planchesATuberMarocBKg = Math.min(stockPlanchesMarocBEntrantKg, Math.max(0, planchesDemandeMarocB));
    const planchesATuberMarocCKg = Math.min(stockPlanchesMarocCEntrantKg, Math.max(0, planchesDemandeMarocC));

    const totalPlanchesTubees = planchesATuberAKg + planchesATuberBKg + planchesATuberCKg +
                                planchesATuberMarocAKg + planchesATuberMarocBKg + planchesATuberMarocCKg;

    const alerteDepassementTubeuse = totalPlanchesTubees > maxTubageMachine;
    const coutTubage = totalPlanchesTubees * PARAMS.coutTubagePlanche; // 0,03 € / planche

    // Rendement tubage : 10 planches (10 kg) -> 1 lot naturel (5 kg) + 5 kg de liège à broyer (50%)
    const bouchonsNatAProduitsLots = Math.floor(planchesATuberAKg / PARAMS.ratioPlanchesParLot);
    const bouchonsNatBProduitsLots = Math.floor(planchesATuberBKg / PARAMS.ratioPlanchesParLot);
    const bouchonsNatCProduitsLots = Math.floor(planchesATuberCKg / PARAMS.ratioPlanchesParLot);

    const bouchonsNatMarocAProduitsLots = Math.floor(planchesATuberMarocAKg / PARAMS.ratioPlanchesParLot);
    const bouchonsNatMarocBProduitsLots = Math.floor(planchesATuberMarocBKg / PARAMS.ratioPlanchesParLot);
    const bouchonsNatMarocCProduitsLots = Math.floor(planchesATuberMarocCKg / PARAMS.ratioPlanchesParLot);

    const totalBouchonsNatProduitsLots = bouchonsNatAProduitsLots + bouchonsNatBProduitsLots + bouchonsNatCProduitsLots +
                                         bouchonsNatMarocAProduitsLots + bouchonsNatMarocBProduitsLots + bouchonsNatMarocCProduitsLots;

    // Liège à broyer généré par le tubage (rebuts réinjectés pour le moulin)
    const liegeRecupereTubageKg = totalPlanchesTubees * PARAMS.rendementLiegeABroyerTubage; // 5 kg / lot
    stockLiegeEntrantKg += liegeRecupereTubageKg;
    valStockLiegeEntrant += liegeRecupereTubageKg * 0.43;
    const cmpLiegeKg = stockLiegeEntrantKg > 0 ? (valStockLiegeEntrant / stockLiegeEntrantKg) : 0.43;

    // Coûts de revient unitaires des bouchons naturels (10 planches @ cmpPlanche + 0.30€ tubage)
    const cmpNatALot = (PARAMS.ratioPlanchesParLot * cmpPlancheAKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);
    const cmpNatBLot = (PARAMS.ratioPlanchesParLot * cmpPlancheBKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);
    const cmpNatCLot = (PARAMS.ratioPlanchesParLot * cmpPlancheCKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);

    const cmpNatMarocALot = (PARAMS.ratioPlanchesParLot * cmpPlancheMarocAKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);
    const cmpNatMarocBLot = (PARAMS.ratioPlanchesParLot * cmpPlancheMarocBKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);
    const cmpNatMarocCLot = (PARAMS.ratioPlanchesParLot * cmpPlancheMarocCKg) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);

    const totalNatADispoLots = stockNatAEntrantLots + bouchonsNatAProduitsLots;
    const totalNatBDispoLots = stockNatBEntrantLots + bouchonsNatBProduitsLots;
    const totalNatCDispoLots = stockNatCEntrantLots + bouchonsNatCProduitsLots;

    const totalNatMarocADispoLots = stockNatMarocAEntrantLots + bouchonsNatMarocAProduitsLots;
    const totalNatMarocBDispoLots = stockNatMarocBEntrantLots + bouchonsNatMarocBProduitsLots;
    const totalNatMarocCDispoLots = stockNatMarocCEntrantLots + bouchonsNatMarocCProduitsLots;

    // 4. Transformation & Production classique (Broyage & Moulage Agglomérés)
    const maxBroyageMachine = PARAMS.capaciteMoulinsKg; // 155 000 kg / mois
    const liegeDemande = Number(monthData.liegeABroyerKg) || 0;
    const maxBroyagePossible = Math.min(maxBroyageMachine, stockLiegeEntrantKg);
    const liegeABroyerKg = Math.min(maxBroyagePossible, Math.max(0, liegeDemande));
    const alerteDepassementMoulins = liegeDemande > maxBroyageMachine;

    const coutBroyage = liegeABroyerKg * PARAMS.coutBroyageKg;
    const grainsProduitsKg = liegeABroyerKg * PARAMS.rendementBroyage;
    const valGrainsProduits = (liegeABroyerKg * cmpLiegeKg) + coutBroyage;

    const totalGrainsDispoKg = stockGrainsEntrantKg + grainsProduitsKg;
    const totalValGrainsDispo = valStockGrainsEntrant + valGrainsProduits;
    const cmpGrainsDispoKg = totalGrainsDispoKg > 0 ? (totalValGrainsDispo / totalGrainsDispoKg) : 1.30;

    const maxMoulageMachine = PARAMS.capaciteMouleusesKg; // 45 000 kg / mois (soit 9 000 lots)
    const grainsDemandes = Number(monthData.grainsAMoulerKg) || 0;
    const maxMoulagePossible = Math.min(maxMoulageMachine, totalGrainsDispoKg);
    const grainsAMoulerKg = Math.min(maxMoulagePossible, Math.max(0, grainsDemandes));
    const alerteDepassementMouleuses = grainsDemandes > maxMoulageMachine;

    const coutMoulage = grainsAMoulerKg * PARAMS.coutMoulageKg;
    const bouchonsProduitsLots = grainsAMoulerKg * PARAMS.rendementMoulage;
    const valBouchonsProduits = (grainsAMoulerKg * cmpGrainsDispoKg) + coutMoulage;

    const totalBouchonsDispoLots = stockBouchonsEntrantLots + bouchonsProduitsLots;
    const totalValBouchonsDispo = valStockBouchonsEntrant + valBouchonsProduits;
    const cmpBouchonLot = totalBouchonsDispoLots > 0 ? (totalValBouchonsDispo / totalBouchonsDispoLots) : 9.0;

    // 5. Ventes aux distributeurs (Agglomérés + Naturels Espagne + Naturels Maroc)
    let lotsVendusAggloTotal = 0;
    let lotsVendusNatATotal = 0;
    let lotsVendusNatBTotal = 0;
    let lotsVendusNatCTotal = 0;
    let lotsVendusNatMarocATotal = 0;
    let lotsVendusNatMarocBTotal = 0;
    let lotsVendusNatMarocCTotal = 0;
    let caTotal = 0;
    let encaissementVentesMois = 0;
    let creances30jMois = 0;
    let creances60jMois = 0;
    let coutTransportTotal = 0;

    (monthData.ventes || []).forEach(v => {
      const qteAgglo = Number(v.lots) || 0;
      const prixAgglo = Number(v.prix) || 0;
      const qteNatA = Number(v.lotsNatA) || 0;
      const prixNatA = Number(v.prixNatA) || 0;
      const qteNatB = Number(v.lotsNatB) || 0;
      const prixNatB = Number(v.prixNatB) || 0;
      const qteNatC = Number(v.lotsNatC) || 0;
      const prixNatC = Number(v.prixNatC) || 0;

      const qteNatMarocA = Number(v.lotsNatMarocA) || 0;
      const prixNatMarocA = Number(v.prixNatMarocA) || 0;
      const qteNatMarocB = Number(v.lotsNatMarocB) || 0;
      const prixNatMarocB = Number(v.prixNatMarocB) || 0;
      const qteNatMarocC = Number(v.lotsNatMarocC) || 0;
      const prixNatMarocC = Number(v.prixNatMarocC) || 0;

      const caDeal = (qteAgglo * prixAgglo) +
                     (qteNatA * prixNatA) + (qteNatB * prixNatB) + (qteNatC * prixNatC) +
                     (qteNatMarocA * prixNatMarocA) + (qteNatMarocB * prixNatMarocB) + (qteNatMarocC * prixNatMarocC);
      const totalLotsDistributeur = qteAgglo + qteNatA + qteNatB + qteNatC + qteNatMarocA + qteNatMarocB + qteNatMarocC;

      lotsVendusAggloTotal += qteAgglo;
      lotsVendusNatATotal += qteNatA;
      lotsVendusNatBTotal += qteNatB;
      lotsVendusNatCTotal += qteNatC;
      lotsVendusNatMarocATotal += qteNatMarocA;
      lotsVendusNatMarocBTotal += qteNatMarocB;
      lotsVendusNatMarocCTotal += qteNatMarocC;
      caTotal += caDeal;

      if (Number(v.delai) === 0) {
        encaissementVentesMois += caDeal;
      } else if (Number(v.delai) === 60) {
        creances60jMois += caDeal;
      } else {
        creances30jMois += caDeal;
      }

      if (totalLotsDistributeur > 0) {
        const mode = PARAMS.transports[v.transport] || PARAMS.transports.camion;
        const nbVehicules = Math.ceil(totalLotsDistributeur / mode.capacite);
        coutTransportTotal += nbVehicules * mode.cout;
      }
    });

    const lotsVendusTotal = lotsVendusAggloTotal + lotsVendusNatATotal + lotsVendusNatBTotal + lotsVendusNatCTotal +
                            lotsVendusNatMarocATotal + lotsVendusNatMarocBTotal + lotsVendusNatMarocCTotal;

    // 6. Stocks de fin de mois
    // A. Liège brut
    const stockLiegeFinKg = Math.max(0, stockLiegeEntrantKg - liegeABroyerKg);
    const valStockLiegeFin = stockLiegeFinKg * cmpLiegeKg;

    // B. Grains
    const stockGrainsFinKg = Math.max(0, totalGrainsDispoKg - grainsAMoulerKg);
    const valStockGrainsFin = stockGrainsFinKg * cmpGrainsDispoKg;

    // C. Bouchons agglomérés
    const stockBouchonsFinLots = Math.max(0, totalBouchonsDispoLots - lotsVendusAggloTotal);
    const valStockBouchonsFin = stockBouchonsFinLots * cmpBouchonLot;

    // D. Planches Espagne (A, B, C)
    const stockPlanchesAFinKg = Math.max(0, stockPlanchesAEntrantKg - planchesATuberAKg);
    const valStockPlanchesAFin = stockPlanchesAFinKg * cmpPlancheAKg;
    const stockPlanchesBFinKg = Math.max(0, stockPlanchesBEntrantKg - planchesATuberBKg);
    const valStockPlanchesBFin = stockPlanchesBFinKg * cmpPlancheBKg;
    const stockPlanchesCFinKg = Math.max(0, stockPlanchesCEntrantKg - planchesATuberCKg);
    const valStockPlanchesCFin = stockPlanchesCFinKg * cmpPlancheCKg;
    const valStockPlanchesFin = valStockPlanchesAFin + valStockPlanchesBFin + valStockPlanchesCFin;

    // D2. Planches Maroc (A, B, C)
    const stockPlanchesMarocAFinKg = Math.max(0, stockPlanchesMarocAEntrantKg - planchesATuberMarocAKg);
    const valStockPlanchesMarocAFin = stockPlanchesMarocAFinKg * cmpPlancheMarocAKg;
    const stockPlanchesMarocBFinKg = Math.max(0, stockPlanchesMarocBEntrantKg - planchesATuberMarocBKg);
    const valStockPlanchesMarocBFin = stockPlanchesMarocBFinKg * cmpPlancheMarocBKg;
    const stockPlanchesMarocCFinKg = Math.max(0, stockPlanchesMarocCEntrantKg - planchesATuberMarocCKg);
    const valStockPlanchesMarocCFin = stockPlanchesMarocCFinKg * cmpPlancheMarocCKg;
    const valStockPlanchesMarocFin = valStockPlanchesMarocAFin + valStockPlanchesMarocBFin + valStockPlanchesMarocCFin;

    // E. Bouchons naturels Espagne (A, B, C)
    const stockNatAFinLots = Math.max(0, totalNatADispoLots - lotsVendusNatATotal);
    const stockNatBFinLots = Math.max(0, totalNatBDispoLots - lotsVendusNatBTotal);
    const stockNatCFinLots = Math.max(0, totalNatCDispoLots - lotsVendusNatCTotal);
    const valStockNatFin = (stockNatAFinLots * cmpNatALot) + (stockNatBFinLots * cmpNatBLot) + (stockNatCFinLots * cmpNatCLot);

    // E2. Bouchons naturels Maroc (A, B, C)
    const stockNatMarocAFinLots = Math.max(0, totalNatMarocADispoLots - lotsVendusNatMarocATotal);
    const stockNatMarocBFinLots = Math.max(0, totalNatMarocBDispoLots - lotsVendusNatMarocBTotal);
    const stockNatMarocCFinLots = Math.max(0, totalNatMarocCDispoLots - lotsVendusNatMarocCTotal);
    const valStockNatMarocFin = (stockNatMarocAFinLots * cmpNatMarocALot) + (stockNatMarocBFinLots * cmpNatMarocBLot) + (stockNatMarocCFinLots * cmpNatMarocCLot);

    const valeurStockTotalFin = valStockLiegeFin + valStockGrainsFin + valStockBouchonsFin +
                                valStockPlanchesFin + valStockPlanchesMarocFin +
                                valStockNatFin + valStockNatMarocFin;
    const fraisStockage = valeurStockTotalFin * PARAMS.tauxStockage; // 0,42%

    // 7. P&L (Compte de résultat)
    const coutDirectVendus = (lotsVendusAggloTotal * cmpBouchonLot) +
                             (lotsVendusNatATotal * cmpNatALot) +
                             (lotsVendusNatBTotal * cmpNatBLot) +
                             (lotsVendusNatCTotal * cmpNatCLot) +
                             (lotsVendusNatMarocATotal * cmpNatMarocALot) +
                             (lotsVendusNatMarocBTotal * cmpNatMarocBLot) +
                             (lotsVendusNatMarocCTotal * cmpNatMarocCLot);

    const fraisMarketing = caTotal * PARAMS.tauxMarketing; // 5%
    const salairesMois = PARAMS.getSalairesMensuels(m); // 60k en M1-M2, 100k dès M3
    const amortissementMois = PARAMS.getAmortissementMensuel(m); // 500 en M1, 750 dès M2
    const chargesFixes = salairesMois + PARAMS.fraisStructureMensuels + amortissementMois;

    const margeBrute = caTotal - coutDirectVendus - coutTransportTotal - fraisMarketing;
    const resultatNet = margeBrute - chargesFixes - fraisStockage;

    // 8. Trésorerie
    const tresoDebutEstimee = isM1 ? PARAMS.capitalDepart : prevResult.tresorerieFinMois;
    const hasTresoDebutForcee = (monthData.tresoDebutForce !== undefined && monthData.tresoDebutForce !== null && monthData.tresoDebutForce !== '' && !isNaN(Number(monthData.tresoDebutForce)));
    const tresoDebut = hasTresoDebutForcee ? Number(monthData.tresoDebutForce) : tresoDebutEstimee;

    const encaissementCreances30jPrecedentes = isM1 ? 0 : (prevResult.creances30jMois || 0);
    const encaissementCreances60jPrecedentes = (m >= 3 && results[m - 2]) ? (results[m - 2].creances60jMois || 0) : 0;
    const encaissementCreancesPrecedentes = encaissementCreances30jPrecedentes + encaissementCreances60jPrecedentes;
    const totalEncaissements = encaissementVentesMois + encaissementCreancesPrecedentes;

    const detteStockInitDecaissee = isM1 ? 95200 : 0;
    const machinesDecaissees = isM1 ? 30000 : 0;
    const achatTubeuseDecaissee = (m === 2) ? PARAMS.achatTubeuseComptantM2 : 0; // 15 000 € en M2
    const stockPlanchesAllemandDecaisse = (m === 3) ? PARAMS.rachatStockPlanchesM3 : 0; // 175 000 € en M3
    const achatEncheresDecaisse = encheresPrixTotal; // Payé comptant le mois de l'enchère (ex: 31 000 € en Mai M5)

    const decaissementFixe = salairesMois + PARAMS.fraisStructureMensuels;
    const decaissementVariables = coutBroyage + coutMoulage + coutTubage + coutTransportTotal + fraisMarketing + fraisStockage;
    
    // Décaissement commande producteur (Liège brut + Planches éventuelles)
    // Mode de règlement : '30j' (30 jours après livraison = M+2, Règle officielle) | 'livraison' (M+1) | 'instant' (Comptant M)
    const modeReglement = state.reglementFournisseur || '30j';
    let decaissementFournisseur = 0;
    let detailDecaissementFournisseur = '';

    if (modeReglement === 'instant') {
      decaissementFournisseur = montantCommandeFournisseurTotal;
      detailDecaissementFournisseur = `Commande M${m} payée comptant`;
    } else if (modeReglement === 'livraison') {
      decaissementFournisseur = isM1 ? 0 : (prevResult.montantCommandeFournisseurTotal || 0);
      detailDecaissementFournisseur = isM1 ? 'Aucun décaissement en M1' : `Commande M${m - 1} payée à la livraison`;
    } else { // '30j' : 30 jours après la livraison (donc 30j après 30j = M+2)
      if (m >= 3 && results[m - 2]) {
        decaissementFournisseur = results[m - 2].montantCommandeFournisseurTotal || 0;
        detailDecaissementFournisseur = `Commande M${m - 2} payée à 30j après livraison M${m - 1}`;
      } else {
        decaissementFournisseur = 0;
        detailDecaissementFournisseur = isM1 
          ? `Commande M1 payable en M3 (30j après livraison M2)` 
          : `Commande M2 payable en M4 (30j après livraison M3)`;
      }
    }

    const totalDecaissements = detteStockInitDecaissee + machinesDecaissees + achatTubeuseDecaissee + stockPlanchesAllemandDecaisse + achatEncheresDecaisse + decaissementFixe + decaissementVariables + decaissementFournisseur;
    const tresorerieFinMois = tresoDebut + totalEncaissements - totalDecaissements;

    // 9. Seuil de rentabilité (Point mort)
    const prixMoyenLot = lotsVendusTotal > 0 ? (caTotal / lotsVendusTotal) : 21.0;
    const coutVariableUnitaire = lotsVendusTotal > 0 ? ((coutDirectVendus + coutTransportTotal + fraisMarketing) / lotsVendusTotal) : cmpBouchonLot + 1.8;
    const mscvUnitaire = prixMoyenLot - coutVariableUnitaire;
    const seuilRentabiliteLots = mscvUnitaire > 0 ? Math.ceil((chargesFixes + fraisStockage) / mscvUnitaire) : 10000;

    // 10. Points au barème officiel (avec coefficient du mois : M1 x1 à M8 x8)
    const coefMois = m;
    const pointsRN = (resultatNet > 0 ? 10 : 4) * 2;
    const pointsCA = (caTotal >= 200000 ? 10 : 8) * 1;
    const penaliteTreso = tresorerieFinMois < 0 ? -10 : 0;
    const scoreMois = (pointsRN + pointsCA + penaliteTreso) * coefMois;

    caCumule += caTotal;
    rnCumule += resultatNet;
    scoreCumule += scoreMois;
    lotsCumule += lotsVendusTotal;

    const resMois = {
      mois: m,
      commandeLiegeKg,
      prixLiegeKg,
      montantCommandeLiegeBrut,
      montantCommandeLiege,
      reductionFournisseurPct,
      remiseFournisseurFacteur,
      montantCommandePlancheABrut,
      montantCommandePlancheBBrut,
      montantCommandePlancheCBrut,
      montantCommandePlanchesBrut,
      montantCommandeFournisseurBrut,
      montantEconomieRemiseFournisseur,
      livraisonRecueKg,
      livraisonRecueVal,
      stockLiegeEntrantKg,
      liegeABroyerKg,
      capaciteMoulinsKg: maxBroyageMachine,
      capaciteMouleusesKg: maxMoulageMachine,
      capaciteTubeusesPlanches: maxTubageMachine,
      maxBroyagePossible,
      maxMoulagePossible,
      alerteDepassementMoulins,
      alerteDepassementMouleuses,
      alerteDepassementTubeuse,
      coutBroyage,
      grainsProduitsKg,
      stockGrainsEntrantKg,
      grainsAMoulerKg,
      coutMoulage,
      stockLiegeFinKg,
      valStockLiegeFin,
      stockGrainsFinKg,
      valStockGrainsFin,
      stockBouchonsEntrantPreBonus,
      bonusBouchonsLots,
      stockBouchonsEntrantLots,
      bouchonsProduitsLots,
      totalBouchonsDispoLots,
      stockBouchonsFinLots,
      valStockBouchonsFin,
      cmpBouchonLot,

      // Données spécifiques Tubage & Bouchons Naturels
      commandePlanchesAKg,
      commandePlanchesBKg,
      commandePlanchesCKg,
      prixPlancheAKg,
      prixPlancheBKg,
      prixPlancheCKg,
      montantCommandePlancheA,
      montantCommandePlancheB,
      montantCommandePlancheC,
      montantCommandePlanchesTotal,
      montantCommandeFournisseurTotal,
      livraisonPlanchesAKg,
      livraisonPlanchesAVal,
      livraisonPlanchesBKg,
      livraisonPlanchesBVal,
      livraisonPlanchesCKg,
      livraisonPlanchesCVal,
      stockPlanchesAEntrantKg,
      stockPlanchesBEntrantKg,
      stockPlanchesCEntrantKg,
      cmpPlancheAKg,
      cmpPlancheBKg,
      cmpPlancheCKg,
      planchesATuberAKg,
      planchesATuberBKg,
      planchesATuberCKg,
      totalPlanchesTubees,
      coutTubage,
      liegeRecupereTubageKg,
      bouchonsNatAProduitsLots,
      bouchonsNatBProduitsLots,
      bouchonsNatCProduitsLots,
      totalBouchonsNatProduitsLots,
      cmpNatALot,
      cmpNatBLot,
      cmpNatCLot,
      stockNatAFinLots,
      stockNatBFinLots,
      stockNatCFinLots,
      stockPlanchesAFinKg,
      stockPlanchesBFinKg,
      stockPlanchesCFinKg,
      valStockPlanchesAFin,
      valStockPlanchesBFin,
      valStockPlanchesCFin,
      valStockPlanchesFin,

      // Données spécifiques Planches & Bouchons Naturels Maroc
      stockPlanchesMarocAEntrantKg,
      stockPlanchesMarocBEntrantKg,
      stockPlanchesMarocCEntrantKg,
      cmpPlancheMarocAKg,
      cmpPlancheMarocBKg,
      cmpPlancheMarocCKg,
      planchesATuberMarocAKg,
      planchesATuberMarocBKg,
      planchesATuberMarocCKg,
      bouchonsNatMarocAProduitsLots,
      bouchonsNatMarocBProduitsLots,
      bouchonsNatMarocCProduitsLots,
      cmpNatMarocALot,
      cmpNatMarocBLot,
      cmpNatMarocCLot,
      totalNatMarocADispoLots,
      totalNatMarocBDispoLots,
      totalNatMarocCDispoLots,
      stockPlanchesMarocAFinKg,
      stockPlanchesMarocBFinKg,
      stockPlanchesMarocCFinKg,
      valStockPlanchesMarocFin,
      stockNatMarocAFinLots,
      stockNatMarocBFinLots,
      stockNatMarocCFinLots,
      valStockNatMarocFin,

      // Ventes
      lotsVendusAggloTotal,
      lotsVendusNatATotal,
      lotsVendusNatBTotal,
      lotsVendusNatCTotal,
      lotsVendusNatMarocATotal,
      lotsVendusNatMarocBTotal,
      lotsVendusNatMarocCTotal,
      lotsVendusTotal,
      prixMoyenLot,
      caTotal,
      coutDirectVendus,
      coutTransportTotal,
      fraisMarketing,
      margeBrute,
      salairesMois,
      amortissementMois,
      chargesFixes,
      fraisStockage,
      resultatNet,
      rnCumule,
      tresoDebut,
      tresoDebutEstimee,
      tresoDebutForce: hasTresoDebutForcee ? Number(monthData.tresoDebutForce) : null,
      hasTresoDebutForcee,
      encaissementVentesMois,
      encaissementCreancesPrecedentes,
      totalEncaissements,
      detteStockInitDecaissee,
      machinesDecaissees,
      achatTubeuseDecaissee,
      stockPlanchesAllemandDecaisse,
      achatEncheresDecaisse,
      encheresLot1PlanchesAKg: encheresLot1MarocAKg,
      encheresLot1PlanchesBKg: encheresLot1MarocBKg,
      encheresLot1Prix,
      encheresLot2PlanchesBKg: encheresLot2MarocBKg,
      encheresLot2PlanchesEspagneAKg: encheresLot2EspagneAKg,
      encheresLot2Prix,
      encheresPlanchesAKg,
      encheresPlanchesBKg,
      encheresPlanchesEspagneAKg,
      encheresPlanchesCKg,
      encheresPrixTotal,
      valEncheresLot1A: valLot1A,
      valEncheresLot1B: valLot1B,
      valEncheresLot2EspA: valLot2EspA,
      valEncheresLot2B: valLot2MarocB,
      valEncheresA,
      valEncheresB,
      valEncheresC,
      decaissementFixe,
      decaissementVariables,
      decaissementFournisseur,
      reglementFournisseur: modeReglement,
      detailDecaissementFournisseur,
      totalDecaissements,
      tresorerieFinMois,
      creances30jMois,
      creances60jMois,
      encaissementCreances30jPrecedentes,
      encaissementCreances60jPrecedentes,
      seuilRentabiliteLots,
      pointsRN,
      pointsCA,
      penaliteTreso,
      scoreMois,
      scoreCumule
    };

    results[m] = resMois;
    prevResult = resMois;
  }

  return {
    moisResults: results,
    totaux: {
      caCumule,
      rnCumule,
      scoreCumule,
      lotsCumule
    }
  };
}

// Fonction passerelle pour calculer et renvoyer le mois actif
function calculateSimulation(state) {
  const mActif = state.moisActif || 1;
  const all = simulateAllMonths(state);
  const cur = all.moisResults[mActif] || all.moisResults[1];

  return {
    ...cur,
    // Alias pour compatibilité interface
    grainsProduitsKg: cur.grainsProduitsKg,
    coutBroyage: cur.coutBroyage,
    bouchonsProduitsLots: cur.bouchonsProduitsLots,
    coutMoulage: cur.coutMoulage,
    stockLiegeRestantKg: cur.stockLiegeFinKg,
    stockGrainsRestantKg: cur.stockGrainsFinKg,
    totalBouchonsDisponibles: cur.totalBouchonsDispoLots,
    stockBouchonsRestantLots: cur.stockBouchonsFinLots,
    coutDirectLot: cur.cmpBouchonLot,
    coutDirectLotMois2: (all.moisResults[2] ? all.moisResults[2].cmpBouchonLot : 8.43),
    resultatNetMois2: (all.moisResults[2] ? all.moisResults[2].resultatNet : 15000),
    encaissementM1: cur.totalEncaissements,
    totalPointsMois: cur.scoreMois,
    allMonths: all
  };
}

// Calculatrice pour le slider direct
function calcProfitFromPrice(prix, volume = 10000, coutUnitaireLot = 9.4918) {
  const ca = volume * prix;
  const transportEstime = volume * 0.95;
  const marketing = ca * PARAMS.tauxMarketing; // 5%
  const coutMatiere = volume * coutUnitaireLot;
  const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel + 80; // ~95 580 €
  
  const mscv = ca - coutMatiere - transportEstime - marketing;
  const rn = mscv - chargesFixes;
  const mscvUnitaire = (ca > 0 && volume > 0) ? (mscv / volume) : 0;
  const pointMortLots = mscvUnitaire > 0 ? Math.ceil(chargesFixes / mscvUnitaire) : 0;

  return {
    prix,
    volume,
    ca,
    coutMatiere,
    transportEstime,
    marketing,
    mscv,
    chargesFixes,
    rn,
    pointMortLots
  };
}

// Calcul du coût direct de fabrication selon le prix d'achat du liège brut
function calcDirectCost(prixLiegeKg) {
  const kgLiegeParLot = 5 / PARAMS.rendementBroyage; // 14.2857 kg
  const coutBroyageParLot = kgLiegeParLot * PARAMS.coutBroyageKg; // 0.2857 €
  const coutMoulageParLot = 5 * PARAMS.coutMoulageKg; // 2.00 €
  const coutMatiere = kgLiegeParLot * prixLiegeKg;
  return coutMatiere + coutBroyageParLot + coutMoulageParLot;
}

// Calcul du Prix Neutre (Seuil de rentabilité 0 € de bénéfice)
// P = (CoutDirect + CoutTransport + (ChargesFixes / Volume)) / (1 - 0.05)
function calcPrixNeutre(coutDirectLot, volume = 10000, transportLot = 0.95) {
  const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel + 80; // 95 580 €
  const chargesFixesParLot = chargesFixes / volume;
  return (coutDirectLot + transportLot + chargesFixesParLot) / (1 - PARAMS.tauxMarketing);
}

// Analyseur d'offre distributeur pour la négociation
function analyzeOffreDistributeur(prixOffert, volume = 3000, mois = 1, volumeTotalMois = 10000, transportType = 'camion') {
  // Coût direct selon le mois
  const coutDirectLot = (mois === 1) ? 9.4918 : 8.4286;
  
  // Coût transport unitaire
  let transportLot = 0.95;
  if (transportType === 'camion') transportLot = 1721 / 1980; // ~0.869 €
  else if (transportType === 'train') transportLot = 2768 / 2640; // ~1.048 €
  else if (transportType === 'bateau') transportLot = 4668 / 5760; // ~0.810 €
  else if (transportType === 'avion') transportLot = 79 / 60; // ~1.317 €

  const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel + 80;
  const chargesFixesLot = chargesFixes / volumeTotalMois;
  const prixNeutre = (coutDirectLot + transportLot + chargesFixesLot) / (1 - PARAMS.tauxMarketing);

  const caDeal = volume * prixOffert;
  const marketingDeal = caDeal * PARAMS.tauxMarketing;
  const coutDirectTotalDeal = volume * coutDirectLot;
  const coutTransportDeal = volume * transportLot;
  const partChargesFixesDeal = volume * chargesFixesLot;

  const coutCompletTotal = coutDirectTotalDeal + coutTransportDeal + marketingDeal + partChargesFixesDeal;
  const benefTotalDeal = caDeal - coutCompletTotal;
  const coutRevientCompletLot = coutCompletTotal / volume;
  const margeNetteLot = benefTotalDeal / volume;

  let verdict = 'RENTABLE';
  let badgeColor = 'emerald';
  let conseil = 'Proposition favorable. Vous gagnez de l\'argent sur ce contrat.';

  if (prixOffert < prixNeutre - 0.20) {
    verdict = 'DÉFICITAIRE';
    badgeColor = 'red';
    conseil = `⚠️ REFUSEZ OU REHAUSSEZ ! Vous perdez ${Math.abs(margeNetteLot).toFixed(2)} € par lot. Prix plancher absolu : ${prixNeutre.toFixed(2)} €.`;
  } else if (prixOffert < prixNeutre + 0.30) {
    verdict = 'NEUTRE / MARGE MINIMALE';
    badgeColor = 'amber';
    conseil = `Limite point mort (+${margeNetteLot.toFixed(2)} €/lot). Tentez de gratter +0,50 €/lot ou négociez le paiement comptant.`;
  } else if (prixOffert >= prixNeutre + 1.00) {
    verdict = 'TRÈS RENTABLE (★)';
    badgeColor = 'emerald';
    conseil = `Excellente opportunité (+${margeNetteLot.toFixed(2)} €/lot). À signer rapidement !`;
  }

  return {
    prixOffert,
    volume,
    mois,
    coutDirectLot,
    transportLot,
    chargesFixesLot,
    prixNeutre,
    caDeal,
    benefTotalDeal,
    coutRevientCompletLot,
    margeNetteLot,
    verdict,
    badgeColor,
    conseil
  };
}

// Calcule la rentabilité du fabricant SuberTech et du distributeur pour les bouchons naturels
function calcMargeDistributeur(type = 'B', prixAchat = 60.0) {
  let repKey = 'B';
  let isMaroc = false;
  let qualiteLetter = 'B';
  let coutPlancheInit = PARAMS.prixAchatPlanchesBInit;

  const tStr = String(type).trim();
  if (tStr.includes('Maroc') || tStr.startsWith('M')) {
    isMaroc = true;
    if (tStr.includes('A')) {
      qualiteLetter = 'A';
      repKey = 'A';
      coutPlancheInit = 31000 * (30000 / 67500) / 15000; // ~0.9185 €/kg
    } else if (tStr.includes('C')) {
      qualiteLetter = 'C';
      repKey = 'C';
      coutPlancheInit = 1.3778; // Estimation Maroc C
    } else {
      qualiteLetter = 'B';
      repKey = 'B';
      coutPlancheInit = (17222.2222 + 23684.2105) / 45000; // ~0.9090 €/kg (Lot 1: 15k + Lot 2: 30k)
    }
  } else {
    if (tStr === 'A' || tStr.includes('A')) {
      qualiteLetter = 'A';
      repKey = 'A';
      coutPlancheInit = PARAMS.prixAchatPlanchesAInit; // 2.00 €/kg
    } else if (tStr === 'C' || tStr.includes('C')) {
      qualiteLetter = 'C';
      repKey = 'C';
      coutPlancheInit = PARAMS.prixAchatPlanchesCInit; // 3.00 €/kg
    } else {
      qualiteLetter = 'B';
      repKey = 'B';
      coutPlancheInit = PARAMS.prixAchatPlanchesBInit; // 2.50 €/kg
    }
  }

  const rep = PARAMS.trieuse.repartition[repKey] || PARAMS.trieuse.repartition.B;
  const p = PARAMS.trieuse.prixClientsMoyens;
  const coutTri = PARAMS.trieuse.coutTriLot; // 2.00 €
  
  // Coût direct de fabrication pour SuberTech (10 planches + 0,30 € tubage)
  const coutDirectFabricant = (PARAMS.ratioPlanchesParLot * coutPlancheInit) + (PARAMS.ratioPlanchesParLot * PARAMS.coutTubagePlanche);
  const margeBruteFabricant = prixAchat - coutDirectFabricant;
  const tauxMargeFabricant = coutDirectFabricant > 0 ? (margeBruteFabricant / coutDirectFabricant) * 100 : 0;

  // Revenu moyen client = Somme(part * prixMoyenClient)
  const revenuReventeLot = (rep.Q1 * p.Q1) + (rep.Q2 * p.Q2) + (rep.Q3 * p.Q3) + (rep.Q4 * p.Q4);
  const coutTotalDistributeur = prixAchat + coutTri;
  const margeBruteDistributeur = revenuReventeLot - coutTotalDistributeur;
  const tauxMargeDistributeur = coutTotalDistributeur > 0 ? (margeBruteDistributeur / coutTotalDistributeur) * 100 : 0;

  return {
    type,
    isMaroc,
    qualiteLetter,
    coutPlancheInit,
    prixAchat,
    coutDirectFabricant,
    margeBruteFabricant,
    tauxMargeFabricant,
    seuilRentabiliteFabricant: coutDirectFabricant,
    coutTri,
    revenuReventeLot,
    coutTotalDistributeur,
    margeBruteDistributeur,
    tauxMargeDistributeur,
    repartition: rep
  };
}

// Export pour node si test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PARAMS,
    getDefaultMonthData,
    getDefaultState,
    simulateAllMonths,
    calculateSimulation,
    calcProfitFromPrice,
    calcDirectCost,
    calcPrixNeutre,
    analyzeOffreDistributeur,
    calcMargeDistributeur
  };
}
