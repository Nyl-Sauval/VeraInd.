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
assert(Math.abs(res.allMonths.moisResults[2].cmpBouchonLot - 8.6281) < 0.02, "Le CMP blended en Mois 2 doit être ~8.63€");
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
const direct043 = sim.calcDirectCost(0.43);

assert(Math.abs(direct050 - 9.4285) < 0.01, "Coût direct liège 0.50€ = 9.43€");
assert(Math.abs(direct046 - 8.8571) < 0.01, "Coût direct liège 0.46€ = 8.86€");
assert(Math.abs(direct043 - 8.4286) < 0.01, "Coût direct liège 0.43€ = 8.43€");

const neutreM1 = sim.calcPrixNeutre(res.coutDirectLot, 10000, 0.95);
const neutreM2 = sim.calcPrixNeutre(direct043, 10000, 0.95);

console.log("Prix Neutre Mois 1 (Stock Départ 9.51€, 10k lots) :", neutreM1.toFixed(2), "€ / lot");
console.log("Prix Neutre Mois 2 (Liège 0.43€, 10k lots) :", neutreM2.toFixed(2), "€ / lot");

assert(Math.abs(neutreM1 - 21.07) < 0.03, "Prix neutre M1 doit être ~21.07€");
assert(Math.abs(neutreM2 - 19.93) < 0.02, "Prix neutre M2 doit être ~19.93€");

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
assert.strictEqual(allInstant[1].decaissementFournisseur, 64500, "En mode Instant, décaissement M1 = 64 500 € dès la commande");
assert.strictEqual(allInstant[2].decaissementFournisseur, 64500, "En mode Instant, décaissement M2 = 64 500 €");
assert(allInstant[1].tresorerieFinMois > 300000, "En mode Instant, trésorerie M1 > 300 000 € (très largement positive)");

// B. Test Mode Différé 30 jours après livraison (selon Guide Officiel)
const state30j = sim.getDefaultState();
state30j.reglementFournisseur = '30j';
const all30j = sim.simulateAllMonths(state30j).moisResults;
console.log("Mode 30j : Décaissement M1 =", all30j[1].decaissementFournisseur, "€ | Décaissement M3 =", all30j[3].decaissementFournisseur, "€");
assert.strictEqual(all30j[1].decaissementFournisseur, 0, "En mode 30j, décaissement M1 = 0 €");
assert.strictEqual(all30j[2].decaissementFournisseur, 0, "En mode 30j, décaissement M2 = 0 €");
assert.strictEqual(all30j[3].decaissementFournisseur, 64500, "En mode 30j, paiement en M3 à 30j de la livraison de M2 (64 500 €)");

console.log("\n Tous les tests du moteur mathématique, négociation et règlements fournisseur sont passés avec succès !");


