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

// 2. Potentiel de production du stock initial
const stockLiegeInit = 110000; // kg
const stockGrainsInit = 7500; // kg
const stockBouchonsInit = 3000; // lots

const grainsFromLiege = stockLiegeInit * 0.35; // 38 500 kg
const totalGrainsDispo = stockGrainsInit + grainsFromLiege; // 46 000 kg
const bouchonsFromGrains = totalGrainsDispo * 0.20; // 9 200 lots
const totalBouchonsPotentiel = stockBouchonsInit + bouchonsFromGrains; // 12 200 lots

console.log("Total lots de bouchons mobilisables en M1 :", totalBouchonsPotentiel, "lots");
assert.strictEqual(totalBouchonsPotentiel, 12200, "Le stock initial permet de mobiliser 12 200 lots");

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

// 5. Test P&L avec 10 000 lots vendus à 21 €
const volumeVendu = 10000;
const ca = volumeVendu * prixVenteMoyen; // 210 000 €
const coutProductionVendus = volumeVendu * coutDirect; // 90 000 €
const coutTransport = volumeVendu * transportMoyen; // 8 690 €
const coutMarketing = ca * 0.05; // 10 500 €
const margeBrute = ca - coutProductionVendus - coutTransport - coutMarketing; // 100 810 €
const resultatNet = margeBrute - chargesFixes;

console.log("Simulation Vente 10 000 lots à 21 € :");
console.log("  CA :", ca, "€");
console.log("  Marge sur coûts variables :", margeBrute.toFixed(0), "€");
console.log("  Charges fixes :", chargesFixes, "€");
console.log("  Résultat Net :", resultatNet.toFixed(0), "€");
assert(resultatNet > 0, "Le résultat net doit être positif avec 10 000 lots vendus");

console.log("\n Tous les tests du moteur mathématique sont passés avec succès !");
