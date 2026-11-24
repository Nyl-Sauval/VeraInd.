// simulator.js - Moteur simplifié et direct pour l'Équipe 18 Groupe C (Vinego)

const PARAMS = {
  capitalDepart: 500000,
  salairesMensuels: 60000,
  fraisStructureMensuels: 35000,
  amortissementMensuel: 500, // 30 000 € sur 5 ans = 500 € / mois
  tauxMarketing: 0.05, // 5% du CA
  tauxStockage: 0.0042, // 0.42% du stock final

  // Stocks de départ (Mois 1)
  stockInitLiegeKg: 110000,
  prixAchatLiegeInit: 0.50,
  stockInitGrainsKg: 7500,
  prixAchatGrainsInit: 0.56,
  stockInitBouchonsLots: 3000,
  prixAchatBouchonsInit: 12.0,

  // Rendements de production
  rendementBroyage: 0.35, // 100 kg liège -> 35 kg grains
  coutBroyageKg: 0.02,    // 0,02 € / kg liège entré
  rendementMoulage: 0.20, // 100 kg grains -> 20 lots de bouchons
  coutMoulageKg: 0.40,    // 0,40 € / kg grain entré (soit 2 € / lot)

  // Grille de remise producteur espagnol
  getPrixLiege: function(kg) {
    if (kg >= 150000) return 0.43;
    if (kg >= 130000) return 0.44;
    if (kg >= 110000) return 0.46;
    if (kg >= 90000)  return 0.47;
    return 0.50; // Tarif de base (< 90 000 kg, min 35 000 kg)
  },

  // Transports disponibles
  transports: {
    bateau: { nom: 'Bateau', capacite: 5760, cout: 4668, rse: 'Polluant' },
    camion: { nom: 'Camion', capacite: 1980, cout: 1721, rse: 'Plutôt polluant' },
    train:  { nom: 'Train',  capacite: 2640, cout: 2768, rse: 'Peu polluant' },
    avion:  { nom: 'Avion',  capacite: 60,   cout: 79,   rse: 'Très polluant' }
  },

  baremePoints: [10, 8, 6, 5, 4, 3, 2, 1]
};

// Modèle de données simplifié
function getDefaultState() {
  return {
    moisActif: 1,
    // Phase 1 : Commande au producteur
    commandeLiegeKg: 150000,

    // Phase 2 : Production
    liegeABroyerKg: 110000,
    grainsAMoulerKg: 46000, // 7 500 kg initiaux + 38 500 kg broyés = 46 000 kg

    // Phase 2 : Ventes aux 4 Équipes Distributeurs
    ventes: [
      { client: 'Équipe Distributeur 1', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
      { client: 'Équipe Distributeur 2', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
      { client: 'Équipe Distributeur 3', lots: 2500, prix: 21.0, delai: 30, transport: 'train' },
      { client: 'Équipe Distributeur 4', lots: 1500, prix: 21.0, delai: 0, transport: 'camion' }
    ],

    // Résultats réels enregistrés par mois
    historique: [
      { mois: 1, ca: null, rn: null, treso: null, pts: null },
      { mois: 2, ca: null, rn: null, treso: null, pts: null },
      { mois: 3, ca: null, rn: null, treso: null, pts: null },
      { mois: 4, ca: null, rn: null, treso: null, pts: null }
    ]
  };
}

let appState = getDefaultState();

// PERSISTANCE
const STORAGE_KEY = 'vinego_subertech_equipe18_simple_v2';

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
      if (parsed && parsed.ventes) {
        appState = parsed;
        return true;
      }
    }
  } catch (e) {}
  return false;
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
      if (parsed && parsed.ventes) {
        appState = parsed;
        saveToLocalStorage();
        window.history.replaceState(null, null, window.location.pathname);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// MOTEUR DE CALCUL DIRECT
function calculateSimulation(state) {
  // 1. Commande producteur
  const prixLiegeKg = PARAMS.getPrixLiege(state.commandeLiegeKg);
  const montantCommandeLiege = state.commandeLiegeKg * prixLiegeKg;

  // 2. Production
  const grainsProduitsKg = state.liegeABroyerKg * PARAMS.rendementBroyage;
  const coutBroyage = state.liegeABroyerKg * PARAMS.coutBroyageKg;

  const bouchonsProduitsLots = state.grainsAMoulerKg * PARAMS.rendementMoulage;
  const coutMoulage = state.grainsAMoulerKg * PARAMS.coutMoulageKg;

  // Stocks finaux
  const stockLiegeRestantKg = Math.max(0, PARAMS.stockInitLiegeKg - state.liegeABroyerKg);
  const stockGrainsRestantKg = Math.max(0, PARAMS.stockInitGrainsKg + grainsProduitsKg - state.grainsAMoulerKg);
  const totalBouchonsDisponibles = PARAMS.stockInitBouchonsLots + bouchonsProduitsLots;

  // 3. Ventes aux distributeurs
  let lotsVendusTotal = 0;
  let caTotal = 0;
  let encaissementM1 = 0;
  let coutTransportTotal = 0;

  state.ventes.forEach(v => {
    const ca = v.lots * v.prix;
    lotsVendusTotal += v.lots;
    caTotal += ca;

    if (v.delai === 0) {
      encaissementM1 += ca;
    }

    // Calcul du transport pour cette vente
    if (v.lots > 0) {
      // Calcul du nombre de trajets selon le mode choisi
      const mode = PARAMS.transports[v.transport] || PARAMS.transports.camion;
      const nbVehicules = Math.ceil(v.lots / mode.capacite);
      coutTransportTotal += nbVehicules * mode.cout;
    }
  });

  const stockBouchonsRestantLots = Math.max(0, totalBouchonsDisponibles - lotsVendusTotal);

  // 4. Frais marketing et stockage
  const fraisMarketing = caTotal * PARAMS.tauxMarketing; // 5%

  const valeurStockFinal =
    (stockLiegeRestantKg * PARAMS.prixAchatLiegeInit) +
    (stockGrainsRestantKg * PARAMS.prixAchatGrainsInit) +
    (stockBouchonsRestantLots * PARAMS.prixAchatBouchonsInit);

  const fraisStockage = valeurStockFinal * PARAMS.tauxStockage; // 0.42%

  // 5. Coût direct des matières des produits vendus (méthode de gestion)
  // Pour fabriquer 1 lot : 14.286 kg de liège @ prixLiegeKg + broyage + moulage (2€)
  const coutDirectLot = (14.2857 * prixLiegeKg) + (14.2857 * 0.02) + 2.0;
  const coutDirectVendus = lotsVendusTotal * coutDirectLot;

  // 6. Charges fixes
  const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel; // 95 500 €

  // 7. Compte de Résultat (P&L)
  const margeBrute = caTotal - coutDirectVendus - coutTransportTotal - fraisMarketing;
  const resultatNet = margeBrute - chargesFixes - fraisStockage;

  // 8. Trésorerie
  // Dettes de départ payées fin janvier : 110k*0.50 + 7.5k*0.56 + 3000*12 = 95 200 €
  const detteStockDepart = 95200;
  const investissementMachines = 30000; // Payé comptant
  const decaissementFixe = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels; // 95 000 €
  const decaissementVariables = coutBroyage + coutMoulage + coutTransportTotal + fraisMarketing + fraisStockage;
  
  // Commande liège passée en M1 est livrée en M2 et payée 30j après livraison (M3) -> 0 € en M1 !
  const decaissementCommandeLiegeM1 = 0;

  const totalDecaissements = detteStockDepart + investissementMachines + decaissementFixe + decaissementVariables + decaissementCommandeLiegeM1;
  const tresorerieFinMois = PARAMS.capitalDepart + encaissementM1 - totalDecaissements;

  // 9. Seuil de rentabilité
  const prixMoyenLot = lotsVendusTotal > 0 ? (caTotal / lotsVendusTotal) : 21.0;
  const coutVariableUnitaire = lotsVendusTotal > 0 ? ((coutDirectVendus + coutTransportTotal + fraisMarketing) / lotsVendusTotal) : coutDirectLot + 1.8;
  const mscvUnitaire = prixMoyenLot - coutVariableUnitaire;
  const seuilRentabiliteLots = mscvUnitaire > 0 ? (chargesFixes + fraisStockage) / mscvUnitaire : 9500;

  // 10. Points Barème
  const pointsRN = (resultatNet > 0 ? 10 : 4) * 2; // 1er = 20 pts
  const pointsCA = (caTotal >= 200000 ? 10 : 8) * 1; // 1er = 10 pts
  const penaliteTreso = tresorerieFinMois < 0 ? -10 : 0;
  const totalPointsMois = pointsRN + pointsCA + penaliteTreso;

  return {
    prixLiegeKg,
    montantCommandeLiege,
    grainsProduitsKg,
    coutBroyage,
    bouchonsProduitsLots,
    coutMoulage,
    stockLiegeRestantKg,
    stockGrainsRestantKg,
    totalBouchonsDisponibles,
    stockBouchonsRestantLots,
    lotsVendusTotal,
    caTotal,
    coutTransportTotal,
    fraisMarketing,
    fraisStockage,
    coutDirectLot,
    coutDirectVendus,
    chargesFixes,
    resultatNet,
    encaissementM1,
    totalDecaissements,
    tresorerieFinMois,
    seuilRentabiliteLots,
    pointsRN,
    pointsCA,
    penaliteTreso,
    totalPointsMois
  };
}

// Export pour node si test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PARAMS, getDefaultState, calculateSimulation };
}
