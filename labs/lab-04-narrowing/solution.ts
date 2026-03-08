// =============================================================================
// Lab 04 — Narrowing (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertThrows, summary } = createTestRunner('Lab 04 — Narrowing');

// =============================================================================
// Exercice 1 : typeof narrowing
// =============================================================================

function formater(valeur: string | number | boolean | undefined): string {
  if (typeof valeur === 'string') {
    return `"${valeur}"`;
  }
  if (typeof valeur === 'number') {
    return valeur.toFixed(2);
  }
  if (typeof valeur === 'boolean') {
    return valeur ? 'oui' : 'non';
  }
  return 'indefini';
}

function additionnerFlexible(a: string | number, b: string | number): string | number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }
  return `${a}${b}`;
}

// =============================================================================
// Exercice 2 : instanceof narrowing
// =============================================================================

class Erreur {
  constructor(public message: string, public code: number) {}
}

class ErreurReseau extends Erreur {
  constructor(message: string, public url: string) {
    super(message, 503);
  }
}

class ErreurValidation extends Erreur {
  constructor(message: string, public champ: string) {
    super(message, 400);
  }
}

function decrireErreur(erreur: Erreur): string {
  if (erreur instanceof ErreurReseau) {
    return `Erreur reseau sur ${erreur.url}: ${erreur.message}`;
  }
  if (erreur instanceof ErreurValidation) {
    return `Erreur de validation du champ ${erreur.champ}: ${erreur.message}`;
  }
  return `Erreur ${erreur.code}: ${erreur.message}`;
}

// =============================================================================
// Exercice 3 : Discriminated unions — Formes geometriques
// =============================================================================

interface Cercle {
  type: 'cercle';
  rayon: number;
}

interface Rectangle {
  type: 'rectangle';
  largeur: number;
  hauteur: number;
}

interface Triangle {
  type: 'triangle';
  base: number;
  hauteur: number;
}

type Forme = Cercle | Rectangle | Triangle;

function calculerAire(forme: Forme): number {
  switch (forme.type) {
    case 'cercle':
      return Math.PI * forme.rayon ** 2;
    case 'rectangle':
      return forme.largeur * forme.hauteur;
    case 'triangle':
      return (forme.base * forme.hauteur) / 2;
  }
}

function calculerPerimetre(forme: Forme): number {
  switch (forme.type) {
    case 'cercle':
      return 2 * Math.PI * forme.rayon;
    case 'rectangle':
      return 2 * (forme.largeur + forme.hauteur);
    case 'triangle':
      return forme.base + forme.hauteur + Math.sqrt(forme.base ** 2 + forme.hauteur ** 2);
  }
}

// =============================================================================
// Exercice 4 : Type guards personnalises
// =============================================================================

interface Voiture {
  marque: string;
  chevaux: number;
  portes: number;
}

interface Moto {
  marque: string;
  chevaux: number;
  cylindres: number;
}

type Vehicule = Voiture | Moto;

function estVoiture(vehicule: Vehicule): vehicule is Voiture {
  return 'portes' in vehicule;
}

function estMoto(vehicule: Vehicule): vehicule is Moto {
  return 'cylindres' in vehicule;
}

function decrireVehicule(vehicule: Vehicule): string {
  if (estVoiture(vehicule)) {
    return `${vehicule.marque} - ${vehicule.chevaux}ch - ${vehicule.portes} portes`;
  }
  return `${vehicule.marque} - ${vehicule.chevaux}ch - ${vehicule.cylindres} cylindres`;
}

// =============================================================================
// Exercice 5 : Reponses API avec discriminated unions
// =============================================================================

interface ReponseChargement {
  statut: 'chargement';
}

interface ReponseSucces<T> {
  statut: 'succes';
  donnees: T;
}

interface ReponseErreur {
  statut: 'erreur';
  message: string;
  code: number;
}

type ReponseAPI<T> = ReponseChargement | ReponseSucces<T> | ReponseErreur;

function traiterReponse<T>(reponse: ReponseAPI<T>): string {
  switch (reponse.statut) {
    case 'chargement':
      return 'Chargement en cours...';
    case 'succes':
      return `Succes: ${JSON.stringify(reponse.donnees)}`;
    case 'erreur':
      return `Erreur ${reponse.code}: ${reponse.message}`;
  }
}

// =============================================================================
// Exercice 6 : Verification exhaustive avec never
// =============================================================================

type Jour = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

function estJourTravaille(jour: Jour): boolean {
  switch (jour) {
    case 'lundi':
    case 'mardi':
    case 'mercredi':
    case 'jeudi':
    case 'vendredi':
      return true;
    case 'samedi':
    case 'dimanche':
      return false;
    default:
      return assertNever(jour);
  }
}

function assertNever(valeur: never): never {
  throw new Error(`Valeur inattendue : ${valeur}`);
}

type Saison = 'printemps' | 'ete' | 'automne' | 'hiver';

function moisParSaison(saison: Saison): string[] {
  switch (saison) {
    case 'printemps':
      return ['mars', 'avril', 'mai'];
    case 'ete':
      return ['juin', 'juillet', 'aout'];
    case 'automne':
      return ['septembre', 'octobre', 'novembre'];
    case 'hiver':
      return ['decembre', 'janvier', 'fevrier'];
    default:
      return assertNever(saison);
  }
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 04 — Narrowing\n');

  // --- Exercice 1 ---
  await test('Ex1 — formater string', () => {
    assertEqual(formater('hello'), '"hello"');
  });

  await test('Ex1 — formater number', () => {
    assertEqual(formater(3.14159), '3.14');
  });

  await test('Ex1 — formater boolean', () => {
    assertEqual(formater(true), 'oui');
    assertEqual(formater(false), 'non');
  });

  await test('Ex1 — formater undefined', () => {
    assertEqual(formater(undefined), 'indefini');
  });

  await test('Ex1 — additionnerFlexible deux numbers', () => {
    assertEqual(additionnerFlexible(3, 4), 7);
  });

  await test('Ex1 — additionnerFlexible avec string', () => {
    assertEqual(additionnerFlexible('hello', ' world'), 'hello world');
    assertEqual(additionnerFlexible(3, ' fois'), '3 fois');
  });

  // --- Exercice 2 ---
  await test('Ex2 — decrireErreur reseau', () => {
    const err = new ErreurReseau('timeout', 'https://api.test.fr');
    assertEqual(decrireErreur(err), 'Erreur reseau sur https://api.test.fr: timeout');
  });

  await test('Ex2 — decrireErreur validation', () => {
    const err = new ErreurValidation('champ requis', 'email');
    assertEqual(decrireErreur(err), 'Erreur de validation du champ email: champ requis');
  });

  await test('Ex2 — decrireErreur generique', () => {
    const err = new Erreur('erreur inconnue', 500);
    assertEqual(decrireErreur(err), 'Erreur 500: erreur inconnue');
  });

  // --- Exercice 3 ---
  await test('Ex3 — aire cercle', () => {
    const cercle: Cercle = { type: 'cercle', rayon: 5 };
    const aire = calculerAire(cercle);
    assert(Math.abs(aire - Math.PI * 25) < 0.001, `Aire attendue ~78.54, obtenue ${aire}`);
  });

  await test('Ex3 — aire rectangle', () => {
    const rect: Rectangle = { type: 'rectangle', largeur: 4, hauteur: 6 };
    assertEqual(calculerAire(rect), 24);
  });

  await test('Ex3 — aire triangle', () => {
    const tri: Triangle = { type: 'triangle', base: 10, hauteur: 5 };
    assertEqual(calculerAire(tri), 25);
  });

  await test('Ex3 — perimetre cercle', () => {
    const cercle: Cercle = { type: 'cercle', rayon: 5 };
    const perimetre = calculerPerimetre(cercle);
    assert(Math.abs(perimetre - 2 * Math.PI * 5) < 0.001, `Perimetre attendu ~31.42, obtenu ${perimetre}`);
  });

  await test('Ex3 — perimetre rectangle', () => {
    const rect: Rectangle = { type: 'rectangle', largeur: 4, hauteur: 6 };
    assertEqual(calculerPerimetre(rect), 20);
  });

  // --- Exercice 4 ---
  await test('Ex4 — estVoiture', () => {
    const voiture: Vehicule = { marque: 'Renault', chevaux: 110, portes: 5 };
    const moto: Vehicule = { marque: 'Yamaha', chevaux: 95, cylindres: 2 };
    assertEqual(estVoiture(voiture), true);
    assertEqual(estVoiture(moto), false);
  });

  await test('Ex4 — estMoto', () => {
    const moto: Vehicule = { marque: 'Yamaha', chevaux: 95, cylindres: 2 };
    assertEqual(estMoto(moto), true);
  });

  await test('Ex4 — decrireVehicule voiture', () => {
    const voiture: Vehicule = { marque: 'Renault', chevaux: 110, portes: 5 };
    assertEqual(decrireVehicule(voiture), 'Renault - 110ch - 5 portes');
  });

  await test('Ex4 — decrireVehicule moto', () => {
    const moto: Vehicule = { marque: 'Yamaha', chevaux: 95, cylindres: 2 };
    assertEqual(decrireVehicule(moto), 'Yamaha - 95ch - 2 cylindres');
  });

  // --- Exercice 5 ---
  await test('Ex5 — traiterReponse chargement', () => {
    const reponse: ReponseAPI<unknown> = { statut: 'chargement' };
    assertEqual(traiterReponse(reponse), 'Chargement en cours...');
  });

  await test('Ex5 — traiterReponse succes', () => {
    const reponse: ReponseAPI<{ id: number; nom: string }> = {
      statut: 'succes',
      donnees: { id: 1, nom: 'Alice' },
    };
    assertEqual(traiterReponse(reponse), 'Succes: {"id":1,"nom":"Alice"}');
  });

  await test('Ex5 — traiterReponse erreur', () => {
    const reponse: ReponseAPI<unknown> = { statut: 'erreur', message: 'Non trouve', code: 404 };
    assertEqual(traiterReponse(reponse), 'Erreur 404: Non trouve');
  });

  // --- Exercice 6 ---
  await test('Ex6 — jours travailles', () => {
    assertEqual(estJourTravaille('lundi'), true);
    assertEqual(estJourTravaille('mercredi'), true);
    assertEqual(estJourTravaille('vendredi'), true);
  });

  await test('Ex6 — jours de repos', () => {
    assertEqual(estJourTravaille('samedi'), false);
    assertEqual(estJourTravaille('dimanche'), false);
  });

  await test('Ex6 — moisParSaison printemps', () => {
    const mois = moisParSaison('printemps');
    assertEqual(mois.length, 3);
    assert(mois.includes('mars'), 'mars attendu');
    assert(mois.includes('avril'), 'avril attendu');
    assert(mois.includes('mai'), 'mai attendu');
  });

  await test('Ex6 — moisParSaison ete', () => {
    const mois = moisParSaison('ete');
    assertEqual(mois.length, 3);
    assert(mois.includes('juin'), 'juin attendu');
  });

  await test('Ex6 — moisParSaison automne', () => {
    const mois = moisParSaison('automne');
    assertEqual(mois.length, 3);
    assert(mois.includes('septembre'), 'septembre attendu');
  });

  await test('Ex6 — moisParSaison hiver', () => {
    const mois = moisParSaison('hiver');
    assertEqual(mois.length, 3);
    assert(mois.includes('decembre'), 'decembre attendu');
  });

  summary();
}

main();
