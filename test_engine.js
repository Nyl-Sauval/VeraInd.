// test_engine.js - Validation arithmétique et règles de gestion Vinego
const assert = require('assert');

// 1. Rendements et transformation
// Broyage: 100 kg liège brut -> 35 kg granulés (rendement 35%), coût 0.02 € / kg entrée
function calcBroyage(liegeKg) {
  const granulesKg = liegeKg * 0.35;
  const coutBroyage = liegeKg * 0.02;
  return { granulesKg, coutBroyage };
}

// Moulage: 100 kg granulés -> 20 lots de bouchons (rendement 0.20 lots / kg), coût 0.40 € / kg entrée
function calcMoulage(granulesKg) {
  const lotsBouchons = granulesKg * 0.20;
  const coutMoulage = granulesKg * 0.40;
  return { lotsBouchons, coutMoulage };
}

// Matière nécessaire pour 1 lot de bouchons
const granulesParLot = 1 / 0.20; // 5 kg
const liegeParLot = granulesParLot / 0.35; // 14.2857 kg
assert(Math.abs(granulesParLot - 5) < 1e-6, "5 kg de grains par lot");
assert(Math.abs(liegeParLot - 14.285714) < 1e-4, "14.2857 kg de liège brut par lot");

// Coût variable de production direct par lot
function coutDirectFabrication(prixLiegeParKg) {
  const coutMatiere = liegeParLot * prixLiegeParKg;
  const coutBroyage = liegeParLot * 0.02;
  const coutMoulage = 5 * 0.40;
  return coutMatiere + coutBroyage + coutMoulage;
}

const coutDirectBase = coutDirectFabrication(0.50);
const coutDirectRemise = coutDirectFabrication(0.47);

console.log("Coût direct fabrication (liège à 0.50€) :", coutDirectBase.toFixed(3), "€ / lot");
console.log("Coût direct fabrication (liège à 0.47€) :", coutDirectRemise.toFixed(3), "€ / lot");

assert(Math.abs(coutDirectBase - 9.42857) < 1e-3, "Coût direct à 0.50€ doit être ~9.43€");
assert(Math.abs(coutDirectRemise - 9.000) < 1e-3, "Coût direct à 0.47€ doit être ~9.00€");

// 2. Potentiel de production et capacités machines (Moulins 155k kg, Mouleuses 45k kg)
const stockLiegeInit = 110000; // kg
const stockGrainsInit = 7500; // kg
const stockBouchonsInit = 3000; // lots

const capaciteMoulins = 155000; // kg liège brut / mois
const capaciteMouleuses = 45000; // kg grains / mois

const liegeBroyable = Math.min(stockLiegeInit, capaciteMoulins); // 110 000 kg
const grainsFromLiege = liegeBroyable * 0.35; // 38 500 kg
const totalGrainsDispo = stockGrainsInit + grainsFromLiege; // 46 000 kg

const grainsMoules = Math.min(totalGrainsDispo, capaciteMouleuses); // 45 000 kg (plafonné par les mouleuses)
const grainsRestants = totalGrainsDispo - grainsMoules; // 1 000 kg
const bouchonsFromGrains = grainsMoules * 0.20; // 9 000 lots
const totalBouchonsPotentiel = stockBouchonsInit + bouchonsFromGrains; // 12 000 lots

console.log("Total grains dispo en M1 :", totalGrainsDispo, "kg | Moulés (max mouleuses 45k) :", grainsMoules, "kg");
console.log("Bouchons produits en M1 :", bouchonsFromGrains, "lots | Stock restant grains :", grainsRestants, "kg");
console.log("Total lots de bouchons mobilisables en M1 :", totalBouchonsPotentiel, "lots");
assert.strictEqual(grainsMoules, 45000, "Mouleuse limitée à 45 000 kg de grains");
assert.strictEqual(bouchonsFromGrains, 9000, "9 000 lots produits par les mouleuses");
assert.strictEqual(totalBouchonsPotentiel, 12000, "Total 12 000 lots disponibles en M1");

// 3. Coût de transport optimal
const transports = [
  { nom: 'Bateau', capacite: 5760, cout: 4668, coutUnitaire: 4668 / 5760, rse: 'Polluant', rseScore: 2 },
  { nom: 'Camion', capacite: 1980, cout: 1721, coutUnitaire: 1721 / 1980, rse: 'Plutôt polluant', rseScore: 2 },
  { nom: 'Train', capacite: 2640, cout: 2768, coutUnitaire: 2768 / 2640, rse: 'Peu polluant', rseScore: 4 },
  { nom: 'Avion', capacite: 60, cout: 79, coutUnitaire: 79 / 60, rse: 'Très polluant', rseScore: 1 }
];

transports.forEach(t => {
  console.log(`Transport ${t.nom}: Capacité ${t.capacite} lots, Coût unitaire plein: ${t.coutUnitaire.toFixed(3)} €/lot`);
});

// 4. Calcul Seuil de Rentabilité (Point Mort)
const chargesFixes = 60000 + 35000 + (30000 / 60); // 95 500 €
const prixVenteMoyen = 21.0;
const fraisMarketing = 0.05 * prixVenteMoyen; // 1.05 €/lot
const transportMoyen = 0.869; // Camion plein
const coutDirect = coutDirectRemise; // 9.00 €

const mscvUnitaire = prixVenteMoyen - coutDirect - fraisMarketing - transportMoyen;
const seuilRentabiliteLots = chargesFixes / mscvUnitaire;

console.log("Marge sur Coûts Variables unitaire :", mscvUnitaire.toFixed(2), "€ / lot");
console.log("Seuil de rentabilité mensuel :", Math.round(seuilRentabiliteLots), "lots");

// 5. Test Coût Moyen Pondéré (CMP) Mois 1 vs Coût Mois 2 (Livraison producteur M+1)
const sim = require('./simulator.js');
const state = sim.getDefaultState();
const res = sim.calculateSimulation(state);

console.log("\n=== VALIDATION RÈGLES DE GESTION MOIS 1 vs MOIS 2 ===");
console.log("Coût Moyen Pondéré (CMP) en Mois 1 (Stock Initial consommé) :", res.coutDirectLot.toFixed(4), "€ / lot");
console.log("CMP blended en Mois 2 (Stock restant M1 + Production M2) :", res.allMonths.moisResults[2].cmpBouchonLot.toFixed(4), "€ / lot");
console.log("Coût unitaire de fabrication brute en M2 :", res.coutDirectLotMois2.toFixed(4), "€ / lot");

assert(Math.abs(res.coutDirectLot - 9.5054) < 0.01, "Le CMP en Mois 1 doit être ~9.51€");
assert(Math.abs(res.allMonths.moisResults[2].cmpBouchonLot - 8.5708) < 0.02, "Le CMP blended en Mois 2 doit être ~8.57€");
assert(res.resultatNet >= 0, "Le résultat net en M1 avec la stratégie par défaut doit être positif");
assert(res.allMonths.moisResults[2].resultatNet > res.resultatNet, "Le résultat net en M2 doit être supérieur grâce à la réduction de coût");

// 6. Test Calculatrice Slider (calcProfitFromPrice)
const testSlider21_5 = sim.calcProfitFromPrice(21.5, 10000, res.coutDirectLot);
console.log("Slider M1 (21.50€, 10k lots) -> Résultat Net :", testSlider21_5.rn.toFixed(0), "€ | Point mort :", testSlider21_5.pointMortLots, "lots");
assert(testSlider21_5.rn > 3500, "À 21.50€ pour 10k lots en M1, le RN doit être positif");

// 7. Test Boussole de Négociation & Prix Neutres
console.log("\n=== VALIDATION BOUSSOLE DE NÉGOCIATION & PRIX NEUTRES ===");
const direct050 = sim.calcDirectCost(0.50);
const direct046 = sim.calcDirectCost(0.46);
const direct0425 = sim.calcDirectCost(0.425);

assert(Math.abs(direct050 - 9.4285) < 0.01, "Coût direct liège 0.50€ = 9.43€");
assert(Math.abs(direct046 - 8.8571) < 0.01, "Coût direct liège 0.46€ = 8.86€");
assert(Math.abs(direct0425 - 8.3571) < 0.01, "Coût direct liège 0.425€ = 8.36€");

const neutreM1 = sim.calcPrixNeutre(res.coutDirectLot, 10000, 0.95);
const neutreM2 = sim.calcPrixNeutre(direct0425, 10000, 0.95);

console.log("Prix Neutre Mois 1 (Stock Départ 9.51€, 10k lots) :", neutreM1.toFixed(2), "€ / lot");
console.log("Prix Neutre Mois 2 (Liège 0.425€, 10k lots) :", neutreM2.toFixed(2), "€ / lot");

assert(Math.abs(neutreM1 - 21.07) < 0.03, "Prix neutre M1 doit être ~21.07€");
assert(Math.abs(neutreM2 - 19.86) < 0.02, "Prix neutre M2 doit être ~19.86€");

// Test analyseur d'offre
const offreRentable = sim.analyzeOffreDistributeur(21.5, 3000, 1, 10000, 'camion');
assert(offreRentable.verdict.includes('RENTABLE'), "21.50€ en M1 doit être rentable");
assert(offreRentable.benefTotalDeal > 1000, "21.50€ sur 3000 lots doit dégager > 1000€ de bénéfice net");

const offreDeficitaire = sim.analyzeOffreDistributeur(20.0, 3000, 1, 10000, 'camion');
assert(offreDeficitaire.verdict.includes('DÉFICITAIRE'), "20.00€ en M1 doit être déficitaire");
assert(offreDeficitaire.benefTotalDeal < 0, "20.00€ sur 3000 lots doit être négatif");

// 8. Test Règle de Livraison Producteur à M+1 & Modalités de Règlement Fournisseur
console.log("\n=== VALIDATION RÈGLE LIVRAISON M+1 & MODALITÉS DE RÈGLEMENT ===");

// A. Test Mode Instantané / Comptant
const stateInstant = sim.getDefaultState();
stateInstant.reglementFournisseur = 'instant';
const allInstant = sim.simulateAllMonths(stateInstant).moisResults;
console.log("Mode Instant : Décaissement M1 =", allInstant[1].decaissementFournisseur, "€ | Trésorerie fin M1 =", Math.round(allInstant[1].tresorerieFinMois), "€");
assert.strictEqual(allInstant[1].livraisonRecueKg, 0, "En Mois 1, livraison = 0 kg");
assert.strictEqual(allInstant[1].stockLiegeEntrantKg, 110000, "En Mois 1, stock = 110k kg");
assert.strictEqual(allInstant[2].livraisonRecueKg, 150000, "En Mois 2, livraison = 150k kg");
assert.strictEqual(allInstant[1].decaissementFournisseur, 63750, "En mode Instant, décaissement M1 = 63 750 € dès la commande");
assert.strictEqual(allInstant[2].decaissementFournisseur, 63750, "En mode Instant, décaissement M2 = 63 750 €");
assert(allInstant[1].tresorerieFinMois > 300000, "En mode Instant, trésorerie M1 > 300 000 € (très largement positive)");

// B. Test Mode Différé 30 jours après livraison (Règle officielle : 30j après 30j = M+2)
const state30j = sim.getDefaultState();
state30j.reglementFournisseur = '30j';
const all30j = sim.simulateAllMonths(state30j).moisResults;
console.log("Mode 30j : Décaissement M1 =", all30j[1].decaissementFournisseur, "€ | M2 =", all30j[2].decaissementFournisseur, "€ | M3 =", all30j[3].decaissementFournisseur, "€ | M4 =", all30j[4].decaissementFournisseur, "€");
assert.strictEqual(all30j[1].decaissementFournisseur, 0, "En mode 30j, décaissement M1 = 0 € (différé M3)");
assert.strictEqual(all30j[2].decaissementFournisseur, 0, "En mode 30j, décaissement M2 = 0 € (différé M4)");
assert.strictEqual(all30j[3].decaissementFournisseur, 63750, "En mode 30j, décaissement M3 = 63 750 € (Paiement commande M1 livrée en M2)");
assert.strictEqual(all30j[4].decaissementFournisseur, 63750, "En mode 30j, décaissement M4 = 63 750 € (Paiement commande M2 livrée en M3)");
assert(all30j[3].tresorerieFinMois > 450000, "Trésorerie en fin M3 reste > 450 000 € en mode 30j après livraison");

// 9. Validation de la simulation complète sur 8 mois
console.log("\n=== VALIDATION DE LA SIMULATION SUR 8 MOIS ===");
const res8 = sim.simulateAllMonths(state30j);
assert.strictEqual(Object.keys(res8.moisResults).length, 8, "La simulation doit comporter exactement 8 mois");
for (let m = 1; m <= 8; m++) {
  const rm = res8.moisResults[m];
  assert(rm !== undefined, `Le Mois ${m} doit être calculé`);
  assert(rm.caTotal > 0, `Le CA du Mois ${m} doit être positif`);
  assert(rm.resultatNet > 0, `Le résultat net du Mois ${m} doit être rentable`);
  assert(rm.tresorerieFinMois > 0, `La trésorerie du Mois ${m} ne doit jamais être dans le rouge`);
  assert.strictEqual(rm.scoreMois, (rm.pointsRN + rm.pointsCA) * m, `Le score du Mois ${m} doit être coefficienté par ${m}`);
}
console.log("Score cumulé sur 8 mois :", res8.totaux.scoreCumule, "/ 1 080 pts");
console.log("Résultat net cumulé sur 8 mois :", Math.round(res8.totaux.rnCumule).toLocaleString('fr-FR'), "€");
console.log("Trésorerie finale en Mois 8 :", Math.round(res8.moisResults[8].tresorerieFinMois).toLocaleString('fr-FR'), "€");

// 10. Validation des Nouveautés Conjoncture Mois 3 (Tubeuses, Bouchons Naturels & Trieuses)
console.log("\n=== VALIDATION NOUVEAUTÉS CONJONCTURE MOIS 3 ===");
const m2 = res8.moisResults[2];
const m3 = res8.moisResults[3];

// Capacité tubeuses et stocks initiaux en M3
assert.strictEqual(sim.PARAMS.capaciteTubeusesPlanches, 75000, "Capacité max des tubeuses = 75 000 planches / mois");
assert.strictEqual(m3.capaciteTubeusesPlanches, 75000, "Capacité tubeuses en M3 = 75 000");

assert.strictEqual(m3.stockPlanchesAEntrantKg, 30000, "Stock initial planches Espagne A = 30 000 kg");
assert.strictEqual(m3.stockPlanchesBEntrantKg, 22000, "Stock initial planches Espagne B = 22 000 kg");
assert.strictEqual(m3.stockPlanchesCEntrantKg, 20000, "Stock initial planches Espagne C = 20 000 kg");

const totalValStockPlanchesM3 = (30000 * 2.00) + (22000 * 2.50) + (20000 * 3.00);
console.log("Valorisation exacte stock planches initial (30k A @ 2€ + 22k B @ 2.5€ + 20k C @ 3€) :", totalValStockPlanchesM3, "€");
assert.strictEqual(totalValStockPlanchesM3, 175000, "La valorisation du stock initial est exactement de 175 000 € (rachat allemand)");

// Grilles tarifaires des planches et remises
console.log("\n--- Validation des grilles de réduction des planches ---");
// Planche A : base 2.00, 10k: 1.94, 13k: 1.88, 15k: 1.82, 18k: 1.76, 20k: 1.70
assert.strictEqual(sim.PARAMS.getPrixPlancheA(5000), 2.00, "Planche A < 10k kg = 2.00 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheA(10000), 1.94, "Planche A 10k kg = 1.94 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheA(13000), 1.88, "Planche A 13k kg = 1.88 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheA(15000), 1.82, "Planche A 15k kg = 1.82 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheA(18000), 1.76, "Planche A 18k kg = 1.76 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheA(20000), 1.70, "Planche A 20k kg = 1.70 €/kg");

// Planche B : base 2.50, 10k: 2.43, 13k: 2.35, 15k: 2.28, 18k: 2.20, 20k: 2.13
assert.strictEqual(sim.PARAMS.getPrixPlancheB(5000), 2.50, "Planche B < 10k kg = 2.50 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheB(10000), 2.43, "Planche B 10k kg = 2.43 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheB(13000), 2.35, "Planche B 13k kg = 2.35 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheB(15000), 2.28, "Planche B 15k kg = 2.28 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheB(18000), 2.20, "Planche B 18k kg = 2.20 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheB(20000), 2.13, "Planche B 20k kg = 2.13 €/kg");

// Planche C : base 3.00, 10k: 2.91, 13k: 2.82, 15k: 2.73, 18k: 2.64, 20k: 2.55
assert.strictEqual(sim.PARAMS.getPrixPlancheC(5000), 3.00, "Planche C < 10k kg = 3.00 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheC(10000), 2.91, "Planche C 10k kg = 2.91 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheC(13000), 2.82, "Planche C 13k kg = 2.82 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheC(15000), 2.73, "Planche C 15k kg = 2.73 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheC(18000), 2.64, "Planche C 18k kg = 2.64 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlancheC(20000), 2.55, "Planche C 20k kg = 2.55 €/kg");

// Coûts de revient et marges directes des bouchons naturels
console.log("\n--- Validation Coûts et Marges des Bouchons Naturels en M3 ---");
console.log("Coût unitaire Nat A :", m3.cmpNatALot.toFixed(2), "€ / lot (Planche A 2.00€ + 0.30€ tubage)");
console.log("Coût unitaire Nat B :", m3.cmpNatBLot.toFixed(2), "€ / lot (Planche B 2.50€ + 0.30€ tubage)");
console.log("Coût unitaire Nat C :", m3.cmpNatCLot.toFixed(2), "€ / lot (Planche C 3.00€ + 0.30€ tubage)");

assert.strictEqual(m3.cmpNatALot, 20.30, "Coût direct Nat A = 20.30 € / lot");
assert.strictEqual(m3.cmpNatBLot, 25.30, "Coût direct Nat B = 25.30 € / lot");
assert.strictEqual(m3.cmpNatCLot, 30.30, "Coût direct Nat C = 30.30 € / lot");

const margeBruteNatA = 55.0 - m3.cmpNatALot; // 34.70 €
const margeBruteNatB = 60.0 - m3.cmpNatBLot; // 34.70 €
const margeBruteNatC = 65.0 - m3.cmpNatCLot; // 34.70 €
console.log("Marge brute unitaire dégagée : Nat A =", margeBruteNatA.toFixed(2), "€ | Nat B =", margeBruteNatB.toFixed(2), "€ | Nat C =", margeBruteNatC.toFixed(2), "€");
assert.strictEqual(margeBruteNatA, 34.70, "Marge brute Nat A = 34.70 € / lot");
assert.strictEqual(margeBruteNatB, 34.70, "Marge brute Nat B = 34.70 € / lot");
assert.strictEqual(margeBruteNatC, 34.70, "Marge brute Nat C = 34.70 € / lot");

// Amortissement et investissements
assert.strictEqual(m2.achatTubeuseDecaissee, 15000, "Achat tubeuse comptant en M2 = 15 000 €");
assert.strictEqual(m2.amortissementMois, 750, "Amortissement mensuel dès M2 = 750 € (500 + 250 € tubeuse)");
assert.strictEqual(m3.salairesMois, 100000, "Salaires mensuels dès M3 = 100 000 €");
assert.strictEqual(m3.stockPlanchesAllemandDecaisse, 175000, "Rachat stock planches allemand décaissé en M3 = 175 000 €");
assert(m3.tresorerieFinMois > 300000, "Trésorerie en fin de Mois 3 reste > 300 000 € malgré le décaissement de 175 000 €");

// Procédé de tubage et recyclage liège
assert.strictEqual(m3.totalPlanchesTubees, 30000, "30 000 planches tubées en M3");
assert.strictEqual(m3.totalBouchonsNatProduitsLots, 3000, "3 000 lots de bouchons naturels produits (ratio 10 planches / lot)");
assert.strictEqual(m3.liegeRecupereTubageKg, 15000, "15 000 kg de liège à broyer récupéré (50% rendement)");
assert.strictEqual(m3.coutTubage, 30000 * 0.03, "Coût tubage = 900 € (0.03 € / planche)");

// Marge du distributeur après trieuse
const margeDistB = sim.calcMargeDistributeur('B', 60.0);
console.log("Marge brute distributeur (Espagne B racheté à 60€) :", margeDistB.margeBruteDistributeur.toFixed(2), "€ / lot (Revente moyenne client : " + margeDistB.revenuReventeLot.toFixed(2) + " €)");
assert(margeDistB.margeBruteDistributeur > 60.0, "Le distributeur réalise plus de 60 € de marge brute par lot trié !");

// 11. Validation des 2 000 bouchons agglomérés bonus gagnés en Mois 3
console.log("\n--- Validation des 2 000 bouchons agglomérés bonus (Mois 3) ---");
assert.strictEqual(m3.bonusBouchonsLots, 2000, "Le bonus en Mois 3 doit être exactement de 2 000 lots");
assert.strictEqual(m3.totalBouchonsDispoLots, 11000, "Disponibilité totale agglomérés en M3 = 9 000 produits + 2 000 bonus = 11 000 lots");
assert.strictEqual(m3.lotsVendusAggloTotal, 11000, "Les 11 000 lots d'agglomérés sont vendus aux distributeurs (4 x 2 750)");
assert.strictEqual(m3.lotsVendusTotal, 14000, "Total lots vendus en M3 = 11 000 agglomérés + 3 000 naturels = 14 000 lots");
console.log("Mois 3 avec +2 000 lots bonus -> CA Total :", Math.round(m3.caTotal).toLocaleString('fr-FR'), "€ | Résultat Net :", Math.round(m3.resultatNet).toLocaleString('fr-FR'), "€");
assert(m3.caTotal >= 415000, "Le CA en Mois 3 dépasse 415 000 € grâce aux 2 000 bouchons bonus");
assert(m3.resultatNet > 80000, "Le résultat net en Mois 3 dépasse 80 000 €");

console.log("\n Tous les tests du moteur mathématique (8 mois), conjoncture Mois 3, tubage (75k cap, 30k/22k/20k stocks), prix planches, trieuse et +2 000 bouchons bonus sont passés avec succès !");


