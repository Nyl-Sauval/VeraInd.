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

// 12. Validation de la surcharge manuelle du solde de début (tresoDebutForce)
console.log("\n--- Validation de l'ajustement manuel du solde de début (tresoDebutForce) ---");
const stateForce = sim.getDefaultState();
// Sans surcharge : M3 tresoDebut = tresoDebutEstimee
const resSansForce = sim.simulateAllMonths(stateForce);
assert.strictEqual(resSansForce.moisResults[3].hasTresoDebutForcee, false, "Sans surcharge, hasTresoDebutForcee = false");
assert.strictEqual(resSansForce.moisResults[3].tresoDebut, resSansForce.moisResults[3].tresoDebutEstimee, "Sans surcharge, tresoDebut === tresoDebutEstimee");

// Avec surcharge sur le Mois 3 (solde réel du jeu : 321 186.30 €)
stateForce.moisData[3].tresoDebutForce = 321186.30;
const resAvecForce = sim.simulateAllMonths(stateForce);
assert.strictEqual(resAvecForce.moisResults[3].hasTresoDebutForcee, true, "Avec surcharge, hasTresoDebutForcee = true");
assert.strictEqual(resAvecForce.moisResults[3].tresoDebut, 321186.30, "Mois 3 utilise exactement le solde forcé (321 186.30 €)");
assert.strictEqual(resAvecForce.moisResults[3].tresoDebutEstimee, resSansForce.moisResults[3].tresoDebutEstimee, "tresoDebutEstimee reste conservé en mémoire pour comparaison");
// Vérification que le Mois 4 cascade bien depuis la nouvelle fin de Mois 3
assert.strictEqual(resAvecForce.moisResults[4].tresoDebutEstimee, resAvecForce.moisResults[3].tresorerieFinMois, "Le Mois 4 cascade automatiquement depuis la fin du Mois 3 ajusté");
console.log("Solde forcé M3 :", resAvecForce.moisResults[3].tresoDebut, "€ | Solde estimé M3 :", Math.round(resAvecForce.moisResults[3].tresoDebutEstimee), "€ | Cascade M4 début :", Math.round(resAvecForce.moisResults[4].tresoDebut), "€");

// 13. Validation du champ Réduction Fournisseur (reductionFournisseurPct)
console.log("\n--- Validation du champ Réduction Fournisseur (remise en % sur le total) ---");
const stateReduc = sim.getDefaultState();

// Vérification de la valeur par défaut (0%)
const resReducDefaut = sim.simulateAllMonths(stateReduc);
assert.strictEqual(resReducDefaut.moisResults[1].reductionFournisseurPct, 0, "Par défaut, la réduction fournisseur est à 0%");
assert.strictEqual(resReducDefaut.moisResults[1].montantEconomieRemiseFournisseur, 0, "Économie par défaut = 0 €");
assert.strictEqual(resReducDefaut.moisResults[1].montantCommandeLiege, 63750, "Total brut liège sans remise (150k @ 0.425) = 63 750 €");
assert.strictEqual(resReducDefaut.moisResults[1].montantCommandeFournisseurTotal, 63750, "Total fournisseur = 63 750 €");

// Test avec 10% de réduction en Mois 1
stateReduc.moisData[1].reductionFournisseurPct = 10;
const resReduc10 = sim.simulateAllMonths(stateReduc);
const m1Reduc = resReduc10.moisResults[1];
assert.strictEqual(m1Reduc.reductionFournisseurPct, 10, "La réduction fournisseur enregistrée est bien de 10%");
assert.strictEqual(m1Reduc.montantCommandeLiegeBrut, 63750, "Montant brut liège = 63 750 €");
assert.strictEqual(m1Reduc.montantCommandeLiege, 57375, "Montant net liège après 10% de réduction = 57 375 €");
assert.strictEqual(m1Reduc.montantCommandeFournisseurTotal, 57375, "Facture totale fournisseur = 57 375 €");
assert.strictEqual(m1Reduc.montantEconomieRemiseFournisseur, 6375, "Économie réalisée = 6 375 €");

// Vérification de la livraison valorisée au prix remisé en Mois 2
const m2Reduc = resReduc10.moisResults[2];
assert.strictEqual(m2Reduc.livraisonRecueVal, 57375, "Le stock de liège entrant en M2 est valorisé au prix remisé (57 375 €)");

// Vérification du décaissement en trésorerie en Mois 3 (règle 30j après livraison)
const m3Reduc = resReduc10.moisResults[3];
assert.strictEqual(m3Reduc.decaissementFournisseur, 57375, "Le décaissement en M3 pour la commande M1 est de 57 375 €");

// Test en Mois 3 avec commande mixte (Liège brut + Planches A) et 5% de réduction
stateReduc.moisData[3].commandePlanchesAKg = 10000; // 10k kg @ 1.94 € = 19 400 € brut
stateReduc.moisData[3].reductionFournisseurPct = 5;  // 5% de remise
const resReducMois3 = sim.simulateAllMonths(stateReduc);
const m3Mix = resReducMois3.moisResults[3];
const brutLiege = 150000 * 0.425; // 63 750 €
const brutPlanches = 10000 * 1.94; // 19 400 €
const brutTotalAttendu = brutLiege + brutPlanches; // 83 150 €
const netTotalAttendu = brutTotalAttendu * 0.95;   // 78 992.50 €
const ecoAttendue = brutTotalAttendu * 0.05;      // 4 157.50 €

assert.strictEqual(m3Mix.montantCommandeFournisseurBrut, brutTotalAttendu, "Total brut mixte attendu = 83 150 €");
assert.strictEqual(m3Mix.montantCommandeFournisseurTotal, netTotalAttendu, "Total net remisé (-5%) = 78 992.50 €");
assert.strictEqual(m3Mix.montantEconomieRemiseFournisseur, ecoAttendue, "Économie attendue = 4 157.50 €");
assert.strictEqual(m3Mix.montantCommandeLiege, brutLiege * 0.95, "Liège net = 60 562.50 €");
assert.strictEqual(m3Mix.montantCommandePlancheA, brutPlanches * 0.95, "Planche A nette = 18 430 €");

// Vérification de la livraison en Mois 4
const m4Mix = resReducMois3.moisResults[4];
assert.strictEqual(m4Mix.livraisonRecueVal, brutLiege * 0.95, "Livraison liège en M4 valorisée à 60 562.50 €");
assert.strictEqual(m4Mix.livraisonPlanchesAVal, brutPlanches * 0.95, "Livraison Planche A en M4 valorisée à 18 430 €");
// Vérification décaissement en Mois 5
const m5Mix = resReducMois3.moisResults[5];
assert.strictEqual(m5Mix.decaissementFournisseur, netTotalAttendu, "Décaissement en M5 = 78 992.50 €");

console.log("Validation réduction fournisseur réussie :");
console.log("- Remise 10% sur M1 (Liège seul) -> Facture :", m1Reduc.montantCommandeFournisseurTotal, "€ (Économie : " + m1Reduc.montantEconomieRemiseFournisseur + " €)");
console.log("- Remise 5% sur M3 (Liège + Planches) -> Brut :", m3Mix.montantCommandeFournisseurBrut, "€ | Net :", m3Mix.montantCommandeFournisseurTotal, "€ (Économie : " + m3Mix.montantEconomieRemiseFournisseur + " €)");

// ==========================================
// 14. Test des Enchères de Mai (Mois 5 : 15k Maroc A + 15k Maroc B pour 31 000 €)
// ==========================================
console.log("\n--- Validation des Enchères de Mai (Mois 5) ---");
const stateEncheres = sim.getDefaultState();
const resEncheres = sim.simulateAllMonths(stateEncheres);
const m5Ench = resEncheres.moisResults[5];

assert.strictEqual(m5Ench.encheresPlanchesAKg, 15000, "15 000 kg Maroc A remportés (Lot 1)");
assert.strictEqual(m5Ench.encheresPlanchesBKg, 45000, "45 000 kg Maroc B remportés (15k Lot 1 + 30k Lot 2)");
assert.strictEqual(m5Ench.encheresPlanchesEspagneAKg, 10000, "10 000 kg Espagne A remportés (Lot 2)");
assert.strictEqual(m5Ench.achatEncheresDecaisse, 61000, "Prix payé comptant aux enchères = 61 000 € (31k + 30k)");

// Vérification de la ventilation comptable des 2 lots
const totalValLot1 = m5Ench.valEncheresLot1A + m5Ench.valEncheresLot1B;
const totalValLot2 = m5Ench.valEncheresLot2EspA + m5Ench.valEncheresLot2B;
assert(Math.abs(totalValLot1 - 31000) < 1e-4, "Ventilation Lot 1 = 31 000 €");
assert(Math.abs(totalValLot2 - 30000) < 1e-4, "Ventilation Lot 2 = 30 000 €");

// Vérification des stocks entrants en M5
// Espagne A : 10 000 kg reportés + 10 000 kg Enchères Lot 2 = 20 000 kg
assert.strictEqual(m5Ench.stockPlanchesAEntrantKg, 20000, "Stock entrant Planches Espagne A = 20 000 kg (10k report + 10k Lot 2)");
assert.strictEqual(m5Ench.stockPlanchesBEntrantKg, 2000, "Stock entrant Planches Espagne B = 2 000 kg (report M4)");
assert.strictEqual(m5Ench.stockPlanchesMarocAEntrantKg, 15000, "Stock entrant Planches Maroc A = 15 000 kg (Lot 1)");
assert.strictEqual(m5Ench.stockPlanchesMarocBEntrantKg, 45000, "Stock entrant Planches Maroc B = 45 000 kg (Lot 1 + Lot 2)");

// Vérification des CMP des planches
assert(Math.abs(m5Ench.cmpPlancheAKg - 1.3158) < 0.001, "CMP Planche Espagne A dilué à ~1.316 €/kg grâce au Lot 2");
assert.strictEqual(m5Ench.cmpPlancheBKg, 2.50, "CMP Planche Espagne B = 2.50 €/kg");
assert(Math.abs(m5Ench.cmpPlancheMarocAKg - (13777.777777777777 / 15000)) < 1e-4, "CMP Planche Maroc A = ~0.9185 €/kg");
assert(Math.abs(m5Ench.cmpPlancheMarocBKg - (40906.43274853801 / 45000)) < 1e-4, "CMP Planche Maroc B = ~0.9090 €/kg (blended Lot 1 & 2)");

// Vérification des coûts de revient directs des lots de bouchons naturels
assert(Math.abs(m5Ench.cmpNatALot - 13.458) < 0.01, "Coût direct lot Nat Espagne A = ~13.46 € (en forte baisse grâce au Lot 2)");
assert.strictEqual(m5Ench.cmpNatBLot, 25.30, "Coût direct lot Nat Espagne B = 25.30 €");
assert(Math.abs(m5Ench.cmpNatMarocALot - 9.485) < 0.01, "Coût direct lot Nat Maroc A = ~9.49 €");
assert(Math.abs(m5Ench.cmpNatMarocBLot - 9.390) < 0.01, "Coût direct lot Nat Maroc B = ~9.39 € (en baisse grâce aux 30k Lot 2)");

// Vérification des options Boussole pour Maroc A et Maroc B
const boussoleMarocA = sim.calcMargeDistributeur('Maroc A', 55.0);
const boussoleMarocB = sim.calcMargeDistributeur('Maroc B', 60.0);
assert(Math.abs(boussoleMarocA.coutDirectFabricant - 9.485) < 0.01, "Boussole Maroc A coût direct ~9.49 €");
assert(Math.abs(boussoleMarocB.coutDirectFabricant - 9.390) < 0.01, "Boussole Maroc B coût direct ~9.39 €");
assert(boussoleMarocA.margeBruteFabricant > 45, "Marge brute exceptionnelle SuberTech sur Maroc A (> 45 €)");
assert(boussoleMarocB.margeBruteFabricant > 50, "Marge brute exceptionnelle SuberTech sur Maroc B (> 50 €)");

// Vérification de la rentabilité et de la trésorerie
assert(m5Ench.resultatNet > 0, "Résultat net en M5 très profitable grâce aux bouchons Maroc et Espagne A");
assert(m5Ench.tresorerieFinMois > 600000, "Trésorerie excellente (> 600k€) malgré le double décaissement de 61 000 €");

console.log("Validation des 2 Lots d'Enchères de Mai réussie (Séparation stricte Espagne vs Maroc) :");
console.log("- Stock Espagne M5 : A = " + m5Ench.stockPlanchesAEntrantKg + " kg (CMP: " + m5Ench.cmpPlancheAKg.toFixed(3) + "€) | B = " + m5Ench.stockPlanchesBEntrantKg + " kg (CMP: 2.50€)");
console.log("- Stock Maroc M5   : A = " + m5Ench.stockPlanchesMarocAEntrantKg + " kg (CMP: " + m5Ench.cmpPlancheMarocAKg.toFixed(3) + "€) | B = " + m5Ench.stockPlanchesMarocBEntrantKg + " kg (CMP: " + m5Ench.cmpPlancheMarocBKg.toFixed(3) + "€)");
console.log("- Coûts lots Nat   : Espagne A = " + m5Ench.cmpNatALot.toFixed(2) + "€, Espagne B = 25.30€ | Maroc A = " + m5Ench.cmpNatMarocALot.toFixed(2) + "€, Maroc B = " + m5Ench.cmpNatMarocBLot.toFixed(2) + "€");
console.log("- Décaissement enchères : -" + m5Ench.achatEncheresDecaisse + " € | Trésorerie fin Mai : " + Math.round(m5Ench.tresorerieFinMois).toLocaleString('fr-FR') + " €");

// 13. Validation du Nouveau Producteur Portugais (Grilles dégressives, approvisionnement, tubage et marges)
console.log("\n--- Validation du Producteur Portugais ---");

// Test des grilles de prix Portugal
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(3000), 1.80, "Base Planche Portugal A = 1.80 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(8000), 1.75, "Palier 8k Planche Portugal A = 1.75 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(10000), 1.69, "Palier 10k Planche Portugal A = 1.69 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(12000), 1.64, "Palier 12k Planche Portugal A = 1.64 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(14000), 1.58, "Palier 14k Planche Portugal A = 1.58 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalA(16000), 1.53, "Palier 16k Planche Portugal A = 1.53 €/kg");

assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(3000), 2.30, "Base Planche Portugal B = 2.30 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(8000), 2.23, "Palier 8k Planche Portugal B = 2.23 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(10000), 2.16, "Palier 10k Planche Portugal B = 2.16 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(12000), 2.09, "Palier 12k Planche Portugal B = 2.09 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(14000), 2.02, "Palier 14k Planche Portugal B = 2.02 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalB(16000), 1.95, "Palier 16k Planche Portugal B = 1.95 €/kg");

assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(3000), 2.80, "Base Planche Portugal C = 2.80 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(8000), 2.72, "Palier 8k Planche Portugal C = 2.72 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(10000), 2.63, "Palier 10k Planche Portugal C = 2.63 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(12000), 2.55, "Palier 12k Planche Portugal C = 2.55 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(14000), 2.46, "Palier 14k Planche Portugal C = 2.46 €/kg");
assert.strictEqual(sim.PARAMS.getPrixPlanchePortugalC(16000), 2.38, "Palier 16k Planche Portugal C = 2.38 €/kg");

assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(50000), 0.50, "Base Liège Portugal = 0.50 €/kg");
assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(100000), 0.49, "Palier 100k Liège Portugal = 0.49 €/kg");
assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(110000), 0.47, "Palier 110k Liège Portugal = 0.47 €/kg");
assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(120000), 0.46, "Palier 12k Liège Portugal = 0.46 €/kg");
assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(130000), 0.44, "Palier 130k Liège Portugal = 0.44 €/kg");
assert.strictEqual(sim.PARAMS.getPrixLiegePortugal(140000), 0.43, "Palier 140k Liège Portugal = 0.43 €/kg");

// Test Commande en M3 livrée en M4 + Tubage en M4
const statePort = sim.getDefaultState();
// Commande en M3 : 16k Portugal A + 16k Portugal B + 140k Liège Portugal
statePort.moisData[3].commandePlanchesPortugalAKg = 16000;
statePort.moisData[3].commandePlanchesPortugalBKg = 16000;
statePort.moisData[3].commandeLiegePortugalKg = 140000;
statePort.moisData[3].commandeLiegeKg = 0; // Remplace le liège espagnol par le liège portugais

// En M4 : Tubage des planches portugaises reçues
statePort.moisData[4].planchesATuberPortugalAKg = 10000;
statePort.moisData[4].planchesATuberPortugalBKg = 10000;
statePort.moisData[4].ventes[0].lotsNatPortugalA = 500;
statePort.moisData[4].ventes[0].prixNatPortugalA = 55.0;
statePort.moisData[4].ventes[0].lotsNatPortugalB = 500;
statePort.moisData[4].ventes[0].prixNatPortugalB = 60.0;

const resPort = sim.simulateAllMonths(statePort);
const m3Res = resPort.moisResults[3];
const m4Res = resPort.moisResults[4];

// Vérification de la commande M3
assert.strictEqual(m3Res.montantCommandePlanchePortugalA, 16000 * 1.53, "Montant commande Planche Portugal A = 24 480 €");
assert.strictEqual(m3Res.montantCommandePlanchePortugalB, 16000 * 1.95, "Montant commande Planche Portugal B = 31 200 €");
assert.strictEqual(m3Res.montantCommandeLiegePortugal, 140000 * 0.43, "Montant commande Liège Portugal = 60 200 €");

// Vérification des réceptions en M4
assert.strictEqual(m4Res.stockPlanchesPortugalAEntrantKg, 16000, "Livraison M4 Planche Portugal A = 16 000 kg");
assert.strictEqual(m4Res.cmpPlanchePortugalAKg, 1.53, "CMP Planche Portugal A = 1.53 €/kg");
assert.strictEqual(m4Res.stockPlanchesPortugalBEntrantKg, 16000, "Livraison M4 Planche Portugal B = 16 000 kg");
assert.strictEqual(m4Res.cmpPlanchePortugalBKg, 1.95, "CMP Planche Portugal B = 1.95 €/kg");
assert.strictEqual(m4Res.livraisonRecueKg, 140000, "Livraison M4 Liège Portugal = 140 000 kg");

// Vérification des coûts unitaires des lots naturels portugais
assert(Math.abs(m4Res.cmpNatPortugalALot - 15.60) < 1e-4, "Coût direct lot Nat Portugal A = 15.60 € (10x1.53 + 0.30)");
assert(Math.abs(m4Res.cmpNatPortugalBLot - 19.80) < 1e-4, "Coût direct lot Nat Portugal B = 19.80 € (10x1.95 + 0.30)");

// Vérification des stocks de fin M4
assert.strictEqual(m4Res.stockPlanchesPortugalAFinKg, 6000, "Stock restant Planche Portugal A = 6 000 kg");
assert.strictEqual(m4Res.stockNatPortugalAFinLots, 500, "Stock restant bouchons Nat Portugal A = 500 lots (1000 produits - 500 vendus)");

// Vérification de la marge distributeur pour le Portugal
const boussolePortA = sim.calcMargeDistributeur('Portugal A', 55.0);
const boussolePortB = sim.calcMargeDistributeur('Portugal B', 60.0);
const boussolePortC = sim.calcMargeDistributeur('Portugal C', 65.0);

assert.strictEqual(boussolePortA.isPortugal, true, "Type Portugal identifié");
assert(Math.abs(boussolePortA.coutDirectFabricant - 15.60) < 1e-4, "Coût direct fabricant Portugal A = 15.60 €");
assert(Math.abs(boussolePortA.margeBruteFabricant - 39.40) < 1e-4, "Marge brute fabricant Portugal A à 55€ = 39.40 € / lot");
assert(Math.abs(boussolePortB.coutDirectFabricant - 19.80) < 1e-4, "Coût direct fabricant Portugal B = 19.80 €");
assert(Math.abs(boussolePortC.coutDirectFabricant - 24.10) < 1e-4, "Coût direct fabricant Portugal C = 24.10 €");

console.log("Validation du Producteur Portugais réussie :");
console.log("- Planches Portugal A : Base 1.80€ -> Palier 16k à 1.53€ -> Coût direct lot = " + boussolePortA.coutDirectFabricant.toFixed(2) + " € (Marge à 55€ : +" + boussolePortA.margeBruteFabricant.toFixed(2) + " €)");
console.log("- Planches Portugal B : Base 2.30€ -> Palier 16k à 1.95€ -> Coût direct lot = " + boussolePortB.coutDirectFabricant.toFixed(2) + " € (Marge à 60€ : +" + boussolePortB.margeBruteFabricant.toFixed(2) + " €)");
console.log("- Planches Portugal C : Base 2.80€ -> Palier 16k à 2.38€ -> Coût direct lot = " + boussolePortC.coutDirectFabricant.toFixed(2) + " € (Marge à 65€ : +" + boussolePortC.margeBruteFabricant.toFixed(2) + " €)");
console.log("- Liège Portugal : Base 0.50€ -> Palier 140k à 0.43€");

console.log("\n Tous les tests du moteur mathématique (8 mois), tubage, séparation Espagne/Maroc/Portugal, enchères M5, boussole et trieuse sont passés avec succès !");



