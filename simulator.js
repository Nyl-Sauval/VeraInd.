// simulator.js - Moteur de simulation, persistance multi-mois et synchronisation Équipe 18 Groupe C

// --- CONSTANTES ET RÈGLES OFFICIELLES ---
const PARAMS = {
  capitalDepart: 500000,
  salairesMensuels: 60000,
  fraisStructureMensuels: 35000,
  amortissementMensuel: 30000 / (5 * 12), // 500 € / mois
  tauxMarketing: 0.05, // 5% du CA
  tauxStockage: 0.0042, // 0.42% de la valeur du stock final

  // Stocks initiaux (Mois 1)
  stockInitLiegeKg: 110000,
  prixAchatLiegeInit: 0.50,
  stockInitGrainsKg: 7500,
  prixAchatGrainsInit: 0.56,
  stockInitBouchonsLots: 3000,
  prixAchatBouchonsInit: 12.0,

  // Rendements industriels
  rendementBroyage: 0.35, // 100 kg liège -> 35 kg grains
  coutBroyageParKg: 0.02, // 2€ par 100 kg
  rendementMoulage: 0.20, // 100 kg grains -> 20 lots
  coutMoulageParKg: 0.40, // 40€ par 100 kg (soit 2€ par lot)

  // Transport
  transports: {
    avion: { nom: 'Avion', capacite: 60, cout: 79, rse: 'Très polluant', scoreRse: 1 },
    bateau: { nom: 'Bateau', capacite: 5760, cout: 4668, rse: 'Polluant', scoreRse: 2 },
    camion: { nom: 'Camion', capacite: 1980, cout: 1721, rse: 'Plutôt polluant', scoreRse: 2 },
    train: { nom: 'Train', capacite: 2640, cout: 2768, rse: 'Peu polluant', scoreRse: 4 }
  },

  // Fournisseur liège espagnol - Grille officielle de remises
  commandeMinLiege: 35000,
  paliersLiege: [
    { seuil: 150000, prix: 0.43, remiseLabel: '-14% (0,43 €/kg)' },
    { seuil: 130000, prix: 0.44, remiseLabel: '-12% (0,44 €/kg)' },
    { seuil: 110000, prix: 0.46, remiseLabel: '-8% (0,46 €/kg)' },
    { seuil: 90000,  prix: 0.47, remiseLabel: '-6% (0,47 €/kg)' },
    { seuil: 35000,  prix: 0.50, remiseLabel: 'Tarif base (0,50 €/kg)' }
  ],
  getPrixLiege: function(kg) {
    if (kg >= 150000) return 0.43;
    if (kg >= 130000) return 0.44;
    if (kg >= 110000) return 0.46;
    if (kg >= 90000)  return 0.47;
    return 0.50;
  },

  // Barème classement
  baremePoints: [10, 8, 6, 5, 4, 3, 2, 1],
  coefficientsMois: [1, 2, 3, 4, 5]
};

// Modèle de données multi-mois par défaut
function createDefaultCompanyState() {
  return {
    meta: {
      equipe: '18',
      groupe: 'C',
      entreprise: 'SuberTech Industries',
      derniereMiseAJour: new Date().toISOString()
    },
    activeMonth: 1,
    months: [
      {
        monthIndex: 1,
        coef: 1,
        inputs: {
          commandeLiegeKg: 150000,
          liegeABroyerKg: 110000,
          grainsAMoulerKg: 46000,
          ventesSteckerLots: 2000,
          prixStecker: 21.0,
          delaiStecker: 0,
          distributeurs: [
            { nom: 'Distributeur 1 (Vignerons/Caves)', lots: 2500, prix: 22.0, delai: 0 },
            { nom: 'Distributeur 2 (Caves)', lots: 2500, prix: 21.5, delai: 0 },
            { nom: 'Distributeur 3 (Grands Comptes)', lots: 2000, prix: 21.0, delai: 30 },
            { nom: 'Distributeur 4 (Régional)', lots: 1000, prix: 21.0, delai: 0 }
          ],
          modeTransport: 'optimal_eco'
        },
        actual: {
          isEntered: false,
          ca: 215500,
          resultatNet: 8721,
          tresorerie: 411721,
          pointsRN: 20,
          pointsCA: 10,
          pointsTotal: 30
        }
      },
      {
        monthIndex: 2,
        coef: 2,
        inputs: {
          commandeLiegeKg: 150000,
          liegeABroyerKg: 150000,
          grainsAMoulerKg: 52500,
          ventesSteckerLots: 2000,
          prixStecker: 21.0,
          delaiStecker: 0,
          distributeurs: [
            { nom: 'Distributeur 1 (Vignerons/Caves)', lots: 2500, prix: 22.0, delai: 0 },
            { nom: 'Distributeur 2 (Caves)', lots: 2500, prix: 21.5, delai: 0 },
            { nom: 'Distributeur 3 (Grands Comptes)', lots: 2500, prix: 21.0, delai: 0 },
            { nom: 'Distributeur 4 (Régional)', lots: 1000, prix: 21.0, delai: 0 }
          ],
          modeTransport: 'optimal_eco'
        },
        actual: { isEntered: false, ca: null, resultatNet: null, tresorerie: null, pointsRN: null, pointsCA: null, pointsTotal: null }
      },
      {
        monthIndex: 3,
        coef: 3,
        inputs: {
          commandeLiegeKg: 150000,
          liegeABroyerKg: 150000,
          grainsAMoulerKg: 52500,
          ventesSteckerLots: 2000,
          prixStecker: 21.0,
          delaiStecker: 0,
          distributeurs: [
            { nom: 'Distributeur 1 (Vignerons/Caves)', lots: 2500, prix: 22.0, delai: 0 },
            { nom: 'Distributeur 2 (Caves)', lots: 2500, prix: 21.5, delai: 0 },
            { nom: 'Distributeur 3 (Grands Comptes)', lots: 2500, prix: 21.0, delai: 0 },
            { nom: 'Distributeur 4 (Régional)', lots: 1000, prix: 21.0, delai: 0 }
          ],
          modeTransport: 'optimal_eco'
        },
        actual: { isEntered: false, ca: null, resultatNet: null, tresorerie: null, pointsRN: null, pointsCA: null, pointsTotal: null }
      },
      {
        monthIndex: 4,
        coef: 4,
        inputs: {
          commandeLiegeKg: 150000,
          liegeABroyerKg: 150000,
          grainsAMoulerKg: 52500,
          ventesSteckerLots: 2000,
          prixStecker: 21.0,
          delaiStecker: 0,
          distributeurs: [
            { nom: 'Distributeur 1 (Vignerons/Caves)', lots: 2500, prix: 22.0, delai: 0 },
            { nom: 'Distributeur 2 (Caves)', lots: 2500, prix: 21.5, delai: 0 },
            { nom: 'Distributeur 3 (Grands Comptes)', lots: 2500, prix: 21.0, delai: 0 },
            { nom: 'Distributeur 4 (Régional)', lots: 1000, prix: 21.0, delai: 0 }
          ],
          modeTransport: 'optimal_eco'
        },
        actual: { isEntered: false, ca: null, resultatNet: null, tresorerie: null, pointsRN: null, pointsCA: null, pointsTotal: null }
      }
    ]
  };
}

// État global en mémoire
let companyState = createDefaultCompanyState();

// PERSISTANCE : LocalStorage
const STORAGE_KEY = 'subertech_vinego_equipe18_state_v1';

function saveStateToStorage() {
  try {
    companyState.meta.derniereMiseAJour = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companyState));
    return true;
  } catch (e) {
    console.error('Erreur sauvegarde LocalStorage:', e);
    return false;
  }
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.months && parsed.months.length > 0) {
        companyState = parsed;
        return true;
      }
    }
  } catch (e) {
    console.error('Erreur chargement LocalStorage:', e);
  }
  return false;
}

// SYNCHRONISATION : Export / Import JSON
function exportStateAsJSON() {
  companyState.meta.derniereMiseAJour = new Date().toISOString();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(companyState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `subertech_equipe18_sauvegarde_m${companyState.activeMonth}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importStateFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.months) {
      companyState = parsed;
      saveStateToStorage();
      return { success: true, message: 'Sauvegarde importée avec succès !' };
    }
  } catch (e) {
    return { success: false, message: 'Format de fichier JSON invalide.' };
  }
  return { success: false, message: 'Données incompatibles.' };
}

// SYNCHRONISATION : Lien URL partageable instantané
function generateShareURL() {
  companyState.meta.derniereMiseAJour = new Date().toISOString();
  const jsonStr = JSON.stringify(companyState);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const url = window.location.origin + window.location.pathname + '#data=' + base64;
  return url;
}

function loadStateFromURLHash() {
  try {
    if (window.location.hash && window.location.hash.startsWith('#data=')) {
      const base64 = window.location.hash.replace('#data=', '');
      const jsonStr = decodeURIComponent(escape(atob(base64)));
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.months) {
        companyState = parsed;
        saveStateToStorage();
        window.history.replaceState(null, null, window.location.pathname); // Nettoie l'URL
        return true;
      }
    }
  } catch (e) {
    console.error('Erreur lecture hash URL:', e);
  }
  return false;
}

// MOTEUR DE SIMULATION FINANCIÈRE ET INDUSTRIELLE
function runFullSimulation(state) {
  const prixLiegeCommande = PARAMS.getPrixLiege(state.commandeLiegeKg);

  // 1. Production
  const grainsProduits = state.liegeABroyerKg * PARAMS.rendementBroyage;
  const coutBroyage = state.liegeABroyerKg * PARAMS.coutBroyageParKg;

  const bouchonsProduits = state.grainsAMoulerKg * PARAMS.rendementMoulage;
  const coutMoulage = state.grainsAMoulerKg * PARAMS.coutMoulageParKg;

  const stockGrainsFinal = PARAMS.stockInitGrainsKg + grainsProduits - state.grainsAMoulerKg;
  const stockLiegeFinal = PARAMS.stockInitLiegeKg - state.liegeABroyerKg;
  const totalBouchonsDisponibles = PARAMS.stockInitBouchonsLots + bouchonsProduits;

  // 2. Ventes
  const lotsVendusStecker = state.ventesSteckerLots;
  const caStecker = lotsVendusStecker * state.prixStecker;

  let lotsVendusDistrib = 0;
  let caDistrib = 0;
  let encaissementM1 = (state.delaiStecker === 0 ? caStecker : 0);

  state.distributeurs.forEach(d => {
    const ca = d.lots * d.prix;
    lotsVendusDistrib += d.lots;
    caDistrib += ca;
    if (d.delai === 0) {
      encaissementM1 += ca;
    }
  });

  const totalLotsVendus = lotsVendusStecker + lotsVendusDistrib;
  const chiffreAffairesTotal = caStecker + caDistrib;
  const stockBouchonsFinal = totalBouchonsDisponibles - totalLotsVendus;

  // 3. Coûts de Transport
  const transportCalc = computeTransport(totalLotsVendus, state.modeTransport, state.allocTransport);

  // 4. Frais marketing & stockage
  const fraisMarketing = chiffreAffairesTotal * PARAMS.tauxMarketing;

  const valeurStockFinal =
    Math.max(0, stockLiegeFinal * PARAMS.prixAchatLiegeInit) +
    Math.max(0, stockGrainsFinal * PARAMS.prixAchatGrainsInit) +
    Math.max(0, stockBouchonsFinal * PARAMS.prixAchatBouchonsInit);

  const fraisStockage = valeurStockFinal * PARAMS.tauxStockage;

  // 5. Coût de fabrication direct par lot selon approvisionnement
  const coutMatiereLot = (1 / 0.20 / 0.35) * prixLiegeCommande;
  const coutBroyageLot = (1 / 0.20 / 0.35) * 0.02;
  const coutMoulageLot = 5 * 0.40;
  const coutFabricationDirect = coutMatiereLot + coutBroyageLot + coutMoulageLot; // ~8.43€ à 0.43€/kg
  const coutDirectVendus = totalLotsVendus * coutFabricationDirect;

  // 6. Charges Fixes
  const chargesFixes = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels + PARAMS.amortissementMensuel; // 95 500 €

  // 7. Compte de Résultat (P&L)
  const margeSurCoutVariable = chiffreAffairesTotal - coutDirectVendus - transportCalc.coutTotal - fraisMarketing;
  const resultatNet = margeSurCoutVariable - chargesFixes - fraisStockage;

  // 8. Plan de Trésorerie Mois 1
  const detteStockInitial = (110000 * 0.50) + (7500 * 0.56) + (3000 * 12); // 95 200 €
  const machinesInvestissement = 30000;
  const decaissementFixe = PARAMS.salairesMensuels + PARAMS.fraisStructureMensuels; // 95 000 €
  const decaissementVariables = coutBroyage + coutMoulage + transportCalc.coutTotal + fraisMarketing + fraisStockage;
  
  // Commande passée en M1 est livrée en M2 et payée 30j après livraison (M3) !
  const decaissementFournisseurLiegeM1 = 0;

  const totalDecaissementsM1 = detteStockInitial + machinesInvestissement + decaissementFixe + decaissementVariables + decaissementFournisseurLiegeM1;
  const tresorerieFinM1 = PARAMS.capitalDepart + encaissementM1 - totalDecaissementsM1;

  // 9. Seuil de Rentabilité
  const prixMoyenUnitaire = totalLotsVendus > 0 ? (chiffreAffairesTotal / totalLotsVendus) : 21.0;
  const coutVariableUnitaire = (coutDirectVendus + transportCalc.coutTotal + fraisMarketing) / (totalLotsVendus || 1);
  const mscvUnitaire = prixMoyenUnitaire - coutVariableUnitaire;
  const seuilRentabiliteLots = mscvUnitaire > 0 ? (chargesFixes + fraisStockage) / mscvUnitaire : Infinity;
  const seuilRentabiliteCA = seuilRentabiliteLots * prixMoyenUnitaire;

  // 10. Barème
  const rangEstimeRN = resultatNet > 0 ? 1 : 4;
  const rangEstimeCA = chiffreAffairesTotal >= 200000 ? 1 : 2;
  const pointsRN = (PARAMS.baremePoints[rangEstimeRN - 1] || 1) * 2;
  const pointsCA = (PARAMS.baremePoints[rangEstimeCA - 1] || 1) * 1;
  const penaliteTreso = tresorerieFinM1 < 0 ? -10 : 0;
  const pointsTotaux = pointsRN + pointsCA + penaliteTreso;

  return {
    prixLiegeCommande,
    coutFabricationDirect,
    grainsProduits,
    coutBroyage,
    bouchonsProduits,
    coutMoulage,
    stockGrainsFinal,
    stockLiegeFinal,
    stockBouchonsFinal,
    totalLotsVendus,
    chiffreAffairesTotal,
    caStecker,
    caDistrib,
    transportCalc,
    fraisMarketing,
    fraisStockage,
    chargesFixes,
    margeSurCoutVariable,
    resultatNet,
    encaissementM1,
    totalDecaissementsM1,
    tresorerieFinM1,
    detteStockInitial,
    decaissementFixe,
    decaissementVariables,
    prixMoyenUnitaire,
    coutVariableUnitaire,
    mscvUnitaire,
    seuilRentabiliteLots,
    seuilRentabiliteCA,
    pointsRN,
    pointsCA,
    penaliteTreso,
    pointsTotaux,
    rangEstimeRN,
    rangEstimeCA
  };
}

// Logistique
function computeTransport(lotsVendus, mode, customAlloc) {
  if (lotsVendus <= 0) {
    return { coutTotal: 0, coutParLot: 0, capaciteTotale: 0, tauxRemplissage: 100, vehicules: { bateau: 0, train: 0, camion: 0, avion: 0 }, scoreRse: 5, labelRse: 'Neutre' };
  }

  let vehicules = { bateau: 0, train: 0, camion: 0, avion: 0 };

  if (mode === 'optimal_cost') {
    let reste = lotsVendus;
    if (reste >= 4000) {
      vehicules.bateau = Math.floor(reste / PARAMS.transports.bateau.capacite);
      reste %= PARAMS.transports.bateau.capacite;
    }
    if (reste >= 1500) {
      vehicules.camion = Math.floor(reste / PARAMS.transports.camion.capacite);
      reste %= PARAMS.transports.camion.capacite;
    }
    if (reste > 0) vehicules.camion += 1;
  } else if (mode === 'optimal_eco') {
    let reste = lotsVendus;
    if (reste >= 5000) {
      vehicules.bateau = Math.floor(reste / PARAMS.transports.bateau.capacite);
      reste %= PARAMS.transports.bateau.capacite;
    }
    vehicules.train = Math.ceil(reste / PARAMS.transports.train.capacite);
  } else {
    vehicules = { ...customAlloc };
  }

  const capaciteTotale =
    (vehicules.bateau * PARAMS.transports.bateau.capacite) +
    (vehicules.train * PARAMS.transports.train.capacite) +
    (vehicules.camion * PARAMS.transports.camion.capacite) +
    (vehicules.avion * PARAMS.transports.avion.capacite);

  const coutTotal =
    (vehicules.bateau * PARAMS.transports.bateau.cout) +
    (vehicules.train * PARAMS.transports.train.cout) +
    (vehicules.camion * PARAMS.transports.camion.cout) +
    (vehicules.avion * PARAMS.transports.avion.cout);

  const coutParLot = lotsVendus > 0 ? (coutTotal / lotsVendus) : 0;
  const tauxRemplissage = capaciteTotale > 0 ? Math.min(100, (lotsVendus / capaciteTotale) * 100) : 0;

  let scorePondere = 0;
  if (capaciteTotale > 0) {
    scorePondere =
      (vehicules.train * PARAMS.transports.train.capacite * 4 +
       vehicules.bateau * PARAMS.transports.bateau.capacite * 2.5 +
       vehicules.camion * PARAMS.transports.camion.capacite * 2 +
       vehicules.avion * PARAMS.transports.avion.capacite * 0.5) / capaciteTotale;
  }

  return {
    coutTotal,
    coutParLot,
    capaciteTotale,
    tauxRemplissage,
    vehicules,
    scoreRse: Math.min(5, Math.max(1, scorePondere)),
    labelRse: scorePondere >= 3.5 ? 'Excellent (Éco-responsable)' : scorePondere >= 2.2 ? 'Bon (Équilibré)' : 'Améliorable'
  };
}

// Analyse offre distributeur
function analyserOffreDistributeur(quantite, prix, delaiJours, typeClient = 'caves') {
  const coutFabrication = 8.43; // Palier liège 0.43€
  const transportMoyen = 0.87;
  const marketing = prix * 0.05;
  const margeUnitaire = prix - coutFabrication - transportMoyen - marketing;
  const margeTotale = margeUnitaire * quantite;
  const caTotal = prix * quantite;

  const prixReventeDistrib = {
    vignerons: { min: 40, max: 80, moy: 60 },
    caves: { min: 25, max: 50, moy: 37.5 },
    grandsComptes: { min: 10, max: 30, moy: 20 }
  }[typeClient] || { moy: 25 };

  const margeEstimeeDistributeur = (prixReventeDistrib.moy - prix) * quantite;
  const tauxMargeIndustriel = caTotal > 0 ? (margeTotale / caTotal) * 100 : 0;

  let verdict = 'NEUTRE';
  let badgeColor = 'bg-yellow-500';
  let recommandation = '';

  if (prix >= 21.5 && delaiJours <= 30) {
    verdict = 'TRÈS AVANTAGEUX';
    badgeColor = 'bg-green-600';
    recommandation = 'Accepter sans hésiter ! Marge élevée et trésorerie sécurisée.';
  } else if (prix >= 20.0) {
    verdict = 'ACCEPTABLE';
    badgeColor = 'bg-blue-600';
    recommandation = delaiJours > 0 ? 'Négocier un paiement comptant en échange de 0,50€ de remise.' : 'Offre convenable pour le volume.';
  } else {
    verdict = 'TROP BAS';
    badgeColor = 'bg-red-600';
    recommandation = 'Prix inférieur aux standards. Exiger 21,00 € minimum.';
  }

  return {
    margeUnitaire,
    margeTotale,
    caTotal,
    tauxMargeIndustriel,
    margeEstimeeDistributeur,
    verdict,
    badgeColor,
    recommandation,
    contreOffreConseillee: Math.max(21.2, prix + 0.8)
  };
}

// Export pour node / navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PARAMS,
    createDefaultCompanyState,
    companyState,
    runFullSimulation,
    computeTransport,
    analyserOffreDistributeur
  };
}
