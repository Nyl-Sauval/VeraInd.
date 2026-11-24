// simulator.js - Moteur décisionnel & Récapitulatif Mois par Mois pour l'Équipe 18 Groupe C (Vinego)

const PARAMS = {
  capitalDepart: 500000,
  salairesMensuels: 60000,
  fraisStructureMensuels: 35000,
  amortissementMensuel: 500, // 30 000 € sur 5 ans = 500 € / mois
  tauxMarketing: 0.05, // 5% du CA
  tauxStockage: 0.0042, // 0.42% de la valeur du stock final

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
  rendementMoulage: 0.20, // 100 kg grains -> 20 lots de bouchons (soit 5 kg / lot)
  coutMoulageKg: 0.40,    // 0,40 € / kg grain entré (soit 2 € / lot)

  // Grille de remise producteur espagnol
  getPrixLiege: function(kg) {
    if (kg >= 150000) return 0.43;
    if (kg >= 130000) return 0.44;
    if (kg >= 110000) return 0.46;
    if (kg >= 90000)  return 0.47;
    return 0.50; // Tarif de base (< 90 000 kg, min 35 000 kg)
  },

  // Modes de transport disponibles
  transports: {
    camion: { id: 'camion', nom: 'Camion', capacite: 1980, cout: 1721, rse: 'Plutôt polluant', icone: 'fa-truck' },
    train:  { id: 'train',  nom: 'Train',  capacite: 2640, cout: 2768, rse: 'Peu polluant (RSE)', icone: 'fa-train' },
    bateau: { id: 'bateau', nom: 'Bateau', capacite: 5760, cout: 4668, rse: 'Économique gros volume', icone: 'fa-ship' },
    avion:  { id: 'avion',  nom: 'Avion',  capacite: 60,   cout: 79,   rse: 'Très polluant (Urgence)', icone: 'fa-plane' }
  },

  baremePoints: [10, 8, 6, 5, 4, 3, 2, 1]
};

// Modèle par défaut pour un mois
function getDefaultMonthData(m) {
  if (m === 1) {
    return {
      commandeLiegeKg: 150000,
      liegeABroyerKg: 110000,
      grainsAMoulerKg: 46000,
      ventes: [
        { client: 'Équipe Distributeur 1', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 2', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
        { client: 'Équipe Distributeur 3', lots: 2500, prix: 21.0, delai: 30, transport: 'train' },
        { client: 'Équipe Distributeur 4', lots: 1500, prix: 21.0, delai: 0, transport: 'camion' }
      ]
    };
  }
  // Par défaut pour M2, M3, M4
  return {
    commandeLiegeKg: 150000,
    liegeABroyerKg: 150000,
    grainsAMoulerKg: 52500,
    ventes: [
      { client: 'Équipe Distributeur 1', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
      { client: 'Équipe Distributeur 2', lots: 3000, prix: 21.5, delai: 0, transport: 'camion' },
      { client: 'Équipe Distributeur 3', lots: 2500, prix: 21.5, delai: 0, transport: 'train' },
      { client: 'Équipe Distributeur 4', lots: 2000, prix: 21.5, delai: 0, transport: 'camion' }
    ]
  };
}

// Modèle de données complet multi-mois
function getDefaultState() {
  return {
    moisActif: 1,
    moisData: {
      1: getDefaultMonthData(1),
      2: getDefaultMonthData(2),
      3: getDefaultMonthData(3),
      4: getDefaultMonthData(4)
    }
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
    // S'assurer que tous les mois existent
    for (let m = 1; m <= 4; m++) {
      if (!appState.moisData[m]) {
        appState.moisData[m] = getDefaultMonthData(m);
      }
    }
  } else if (parsed.ventes) {
    // Migration depuis ancien format mono-mois
    appState = getDefaultState();
    appState.moisData[1] = {
      commandeLiegeKg: parsed.commandeLiegeKg || 150000,
      liegeABroyerKg: parsed.liegeABroyerKg || 110000,
      grainsAMoulerKg: parsed.grainsAMoulerKg || 46000,
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

// MOTEUR DE SIMULATION ENCHAÎNÉE SUR LES 4 MOIS
function simulateAllMonths(state) {
  const results = {};
  let prevResult = null;
  let caCumule = 0;
  let rnCumule = 0;
  let scoreCumule = 0;
  let lotsCumule = 0;

  for (let m = 1; m <= 4; m++) {
    const isM1 = (m === 1);
    const monthData = (state.moisData && state.moisData[m]) ? state.moisData[m] : getDefaultMonthData(m);
    
    // 1. Commande au producteur espagnol
    const commandeLiegeKg = Number(monthData.commandeLiegeKg) || 0;
    const prixLiegeKg = PARAMS.getPrixLiege(commandeLiegeKg);
    const montantCommandeLiege = commandeLiegeKg * prixLiegeKg;

    // 2. Stocks entrants au début du mois
    // En M1 : stock initial. En M2..M4 : stock restant du mois précédent + commande du mois précédent livrée !
    const livraisonRecueKg = isM1 ? 0 : (prevResult.commandeLiegeKg || 0);
    const livraisonRecueVal = isM1 ? 0 : (prevResult.montantCommandeLiege || 0);

    const stockLiegeEntrantKg = isM1 ? PARAMS.stockInitLiegeKg : (prevResult.stockLiegeFinKg + livraisonRecueKg);
    const valStockLiegeEntrant = isM1 ? (PARAMS.stockInitLiegeKg * PARAMS.prixAchatLiegeInit) : (prevResult.valStockLiegeFin + livraisonRecueVal);
    const cmpLiegeKg = stockLiegeEntrantKg > 0 ? (valStockLiegeEntrant / stockLiegeEntrantKg) : 0.43;

    const stockGrainsEntrantKg = isM1 ? PARAMS.stockInitGrainsKg : prevResult.stockGrainsFinKg;
    const valStockGrainsEntrant = isM1 ? (PARAMS.stockInitGrainsKg * PARAMS.prixAchatGrainsInit) : prevResult.valStockGrainsFin;
    const cmpGrainsKg = stockGrainsEntrantKg > 0 ? (valStockGrainsEntrant / stockGrainsEntrantKg) : 1.335;

    const stockBouchonsEntrantLots = isM1 ? PARAMS.stockInitBouchonsLots : prevResult.stockBouchonsFinLots;
    const valStockBouchonsEntrant = isM1 ? (PARAMS.stockInitBouchonsLots * PARAMS.prixAchatBouchonsInit) : prevResult.valStockBouchonsFin;

    // 3. Transformation & Production
    const liegeABroyerKg = Math.min(stockLiegeEntrantKg, Number(monthData.liegeABroyerKg) || 0);
    const coutBroyage = liegeABroyerKg * PARAMS.coutBroyageKg;
    const grainsProduitsKg = liegeABroyerKg * PARAMS.rendementBroyage;
    const valGrainsProduits = (liegeABroyerKg * cmpLiegeKg) + coutBroyage;

    const totalGrainsDispoKg = stockGrainsEntrantKg + grainsProduitsKg;
    const totalValGrainsDispo = valStockGrainsEntrant + valGrainsProduits;
    const cmpGrainsDispoKg = totalGrainsDispoKg > 0 ? (totalValGrainsDispo / totalGrainsDispoKg) : 1.30;

    const grainsAMoulerKg = Math.min(totalGrainsDispoKg, Number(monthData.grainsAMoulerKg) || 0);
    const coutMoulage = grainsAMoulerKg * PARAMS.coutMoulageKg;
    const bouchonsProduitsLots = grainsAMoulerKg * PARAMS.rendementMoulage;
    const valBouchonsProduits = (grainsAMoulerKg * cmpGrainsDispoKg) + coutMoulage;

    const totalBouchonsDispoLots = stockBouchonsEntrantLots + bouchonsProduitsLots;
    const totalValBouchonsDispo = valStockBouchonsEntrant + valBouchonsProduits;
    const cmpBouchonLot = totalBouchonsDispoLots > 0 ? (totalValBouchonsDispo / totalBouchonsDispoLots) : 9.0;

    // 4. Ventes aux distributeurs
    let lotsVendusTotal = 0;
    let caTotal = 0;
    let encaissementVentesMois = 0;
    let creances30jMois = 0;
    let coutTransportTotal = 0;

    (monthData.ventes || []).forEach(v => {
      const qte = Number(v.lots) || 0;
      const prix = Number(v.prix) || 0;
      const ca = qte * prix;
      lotsVendusTotal += qte;
      caTotal += ca;

      if (Number(v.delai) === 0) {
        encaissementVentesMois += ca;
      } else {
        creances30jMois += ca;
      }

      if (qte > 0) {
        const mode = PARAMS.transports[v.transport] || PARAMS.transports.camion;
        const nbVehicules = Math.ceil(qte / mode.capacite);
        coutTransportTotal += nbVehicules * mode.cout;
      }
    });

    // 5. Stocks de fin de mois
    const stockLiegeFinKg = Math.max(0, stockLiegeEntrantKg - liegeABroyerKg);
    const valStockLiegeFin = stockLiegeFinKg * cmpLiegeKg;

    const stockGrainsFinKg = Math.max(0, totalGrainsDispoKg - grainsAMoulerKg);
    const valStockGrainsFin = stockGrainsFinKg * cmpGrainsDispoKg;

    const stockBouchonsFinLots = Math.max(0, totalBouchonsDispoLots - lotsVendusTotal);
    const valStockBouchonsFin = stockBouchonsFinLots * cmpBouchonLot;

    const valeurStockTotalFin = valStockLiegeFin + valStockGrainsFin + valStockBouchonsFin;
    const fraisStockage = valeurStockTotalFin * PARAMS.tauxStockage; // 0,42%

    // 6. P&L (Compte de résultat)
    const coutDirectVendus = lotsVendusTotal * cmpBouchonLot;
    const fraisMarketing = caTotal * PARAMS.tauxMarketing; // 5%
    const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel; // 95 500 €
    const margeBrute = caTotal - coutDirectVendus - coutTransportTotal - fraisMarketing;
    const resultatNet = margeBrute - chargesFixes - fraisStockage;

    // 7. Trésorerie
    const tresoDebut = isM1 ? PARAMS.capitalDepart : prevResult.tresorerieFinMois;
    const encaissementCreancesPrecedentes = isM1 ? 0 : prevResult.creances30jMois;
    const totalEncaissements = encaissementVentesMois + encaissementCreancesPrecedentes;

    const detteStockInitDecaissee = isM1 ? 95200 : 0;
    const machinesDecaissees = isM1 ? 30000 : 0;
    const decaissementFixe = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels; // 95 000 €
    const decaissementVariables = coutBroyage + coutMoulage + coutTransportTotal + fraisMarketing + fraisStockage;
    
    // Décaissement commande producteur : payée 30 jours après livraison (M1 livrée M2 -> payée M3)
    let decaissementFournisseur = 0;
    if (m === 3 && results[1]) {
      decaissementFournisseur = results[1].montantCommandeLiege;
    } else if (m === 4 && results[2]) {
      decaissementFournisseur = results[2].montantCommandeLiege;
    }

    const totalDecaissements = detteStockInitDecaissee + machinesDecaissees + decaissementFixe + decaissementVariables + decaissementFournisseur;
    const tresorerieFinMois = tresoDebut + totalEncaissements - totalDecaissements;

    // 8. Seuil de rentabilité (Point mort)
    const prixMoyenLot = lotsVendusTotal > 0 ? (caTotal / lotsVendusTotal) : 21.0;
    const coutVariableUnitaire = lotsVendusTotal > 0 ? ((coutDirectVendus + coutTransportTotal + fraisMarketing) / lotsVendusTotal) : cmpBouchonLot + 1.8;
    const mscvUnitaire = prixMoyenLot - coutVariableUnitaire;
    const seuilRentabiliteLots = mscvUnitaire > 0 ? Math.ceil((chargesFixes + fraisStockage) / mscvUnitaire) : 10000;

    // 9. Points au barème officiel (avec coefficient du mois : M1 x1, M2 x2, M3 x3, M4 x4)
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
      montantCommandeLiege,
      livraisonRecueKg,
      stockLiegeEntrantKg,
      liegeABroyerKg,
      coutBroyage,
      grainsProduitsKg,
      stockGrainsEntrantKg,
      grainsAMoulerKg,
      coutMoulage,
      stockLiegeFinKg,
      valStockLiegeFin,
      stockGrainsFinKg,
      valStockGrainsFin,
      stockBouchonsEntrantLots,
      bouchonsProduitsLots,
      totalBouchonsDispoLots,
      stockBouchonsFinLots,
      valStockBouchonsFin,
      cmpBouchonLot,
      lotsVendusTotal,
      prixMoyenLot,
      caTotal,
      coutDirectVendus,
      coutTransportTotal,
      fraisMarketing,
      margeBrute,
      chargesFixes,
      fraisStockage,
      resultatNet,
      rnCumule,
      tresoDebut,
      encaissementVentesMois,
      encaissementCreancesPrecedentes,
      totalEncaissements,
      detteStockInitDecaissee,
      machinesDecaissees,
      decaissementFixe,
      decaissementVariables,
      decaissementFournisseur,
      totalDecaissements,
      tresorerieFinMois,
      creances30jMois,
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

// Export pour node si test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PARAMS,
    getDefaultMonthData,
    getDefaultState,
    simulateAllMonths,
    calculateSimulation,
    calcProfitFromPrice
  };
}
