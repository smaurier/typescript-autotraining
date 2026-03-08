// =============================================================================
// Lab 02 — Fonctions (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 02 — Fonctions');

// =============================================================================
// Exercice 1 : Signatures de base
// =============================================================================

function additionner(a: number, b: number): number {
  return a + b;
}

function estVide(chaine: string): boolean {
  return chaine.length === 0;
}

function afficherMessage(message: string): void {
  console.log(message);
}

// =============================================================================
// Exercice 2 : Parametres optionnels et par defaut
// =============================================================================

function nomComplet(nom: string, titre?: string): string {
  if (titre) {
    return `${titre} ${nom}`;
  }
  return nom;
}

function calculerPrix(prix: number, quantite: number = 1): number {
  return prix * quantite;
}

function direBonjour(nom: string, langue: string = 'fr', formel?: boolean): string {
  const salutation = langue === 'en'
    ? (formel ? `Good day, ${nom}.` : `Hi ${nom}!`)
    : (formel ? `Bonjour, ${nom}.` : `Salut ${nom} !`);
  return salutation;
}

// =============================================================================
// Exercice 3 : Parametres rest
// =============================================================================

function somme(...nombres: number[]): number {
  return nombres.reduce((acc, n) => acc + n, 0);
}

function joindre(separateur: string, ...elements: string[]): string {
  return elements.join(separateur);
}

// =============================================================================
// Exercice 4 : Surcharges (overloads)
// =============================================================================

function convertir(valeur: string): number;
function convertir(valeur: number): string;
function convertir(valeur: string | number): string | number {
  if (typeof valeur === 'string') {
    return parseFloat(valeur);
  }
  return String(valeur);
}

function chercher(items: string[], cle: string): string | undefined;
function chercher(items: number[], cle: number): number | undefined;
function chercher(items: (string | number)[], cle: string | number): string | number | undefined {
  return items.find((item) => item === cle);
}

// =============================================================================
// Exercice 5 : Callbacks
// =============================================================================

function pourChaqueNom(noms: string[], callback: (nom: string) => void): void {
  noms.forEach(callback);
}

function appliquerTransformation(nombres: number[], transformateur: (n: number) => number): number[] {
  return nombres.map(transformateur);
}

function filtrer(nombres: number[], predicat: (n: number) => boolean): number[] {
  return nombres.filter(predicat);
}

// =============================================================================
// Exercice 6 : Fonctions d'ordre superieur
// =============================================================================

function multiplierPar(facteur: number): (x: number) => number {
  return (x: number) => x * facteur;
}

function composer(
  f: (x: number) => number,
  g: (x: number) => number
): (x: number) => number {
  return (x: number) => f(g(x));
}

// =============================================================================
// Exercice 7 : Type predicates
// =============================================================================

interface Chat {
  type: 'chat';
  nom: string;
  ronronne: boolean;
}

interface Chien {
  type: 'chien';
  nom: string;
  race: string;
}

type Animal = Chat | Chien;

function estChat(animal: Animal): animal is Chat {
  return animal.type === 'chat';
}

function estString(valeur: unknown): valeur is string {
  return typeof valeur === 'string';
}

function decrireAnimal(animal: Animal): string {
  if (estChat(animal)) {
    return `${animal.nom} est un chat qui ${animal.ronronne ? 'ronronne' : 'ne ronronne pas'}`;
  }
  return `${animal.nom} est un chien de race ${animal.race}`;
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 02 — Fonctions\n');

  // --- Exercice 1 ---
  await test('Ex1 — additionner', () => {
    assertEqual(additionner(3, 4), 7);
    assertEqual(additionner(-1, 1), 0);
  });

  await test('Ex1 — estVide', () => {
    assertEqual(estVide(''), true);
    assertEqual(estVide('hello'), false);
  });

  // --- Exercice 2 ---
  await test('Ex2 — nomComplet sans titre', () => {
    assertEqual(nomComplet('Dupont'), 'Dupont');
  });

  await test('Ex2 — nomComplet avec titre', () => {
    assertEqual(nomComplet('Dupont', 'Dr'), 'Dr Dupont');
  });

  await test('Ex2 — calculerPrix sans quantite', () => {
    assertEqual(calculerPrix(10), 10);
  });

  await test('Ex2 — calculerPrix avec quantite', () => {
    assertEqual(calculerPrix(10, 3), 30);
  });

  await test('Ex2 — direBonjour defauts', () => {
    assertEqual(direBonjour('Alice'), 'Salut Alice !');
  });

  await test('Ex2 — direBonjour en anglais formel', () => {
    assertEqual(direBonjour('Alice', 'en', true), 'Good day, Alice.');
  });

  // --- Exercice 3 ---
  await test('Ex3 — somme de nombres', () => {
    assertEqual(somme(1, 2, 3), 6);
    assertEqual(somme(10, 20), 30);
    assertEqual(somme(), 0);
  });

  await test('Ex3 — joindre avec separateur', () => {
    assertEqual(joindre('-', 'a', 'b', 'c'), 'a-b-c');
    assertEqual(joindre(', ', 'Alice', 'Bob'), 'Alice, Bob');
  });

  // --- Exercice 4 ---
  await test('Ex4 — convertir string en number', () => {
    assertEqual(convertir('42'), 42);
    assertEqual(convertir('3.14'), 3.14);
  });

  await test('Ex4 — convertir number en string', () => {
    assertEqual(convertir(42), '42');
    assertEqual(convertir(0), '0');
  });

  await test('Ex4 — chercher dans un tableau de strings', () => {
    assertEqual(chercher(['a', 'b', 'c'], 'b'), 'b');
    assertEqual(chercher(['a', 'b', 'c'], 'z'), undefined);
  });

  await test('Ex4 — chercher dans un tableau de numbers', () => {
    assertEqual(chercher([1, 2, 3], 2), 2);
    assertEqual(chercher([1, 2, 3], 5), undefined);
  });

  // --- Exercice 5 ---
  await test('Ex5 — pourChaqueNom avec callback', () => {
    const resultats: string[] = [];
    pourChaqueNom(['Alice', 'Bob'], (nom) => resultats.push(nom));
    assertDeepEqual(resultats, ['Alice', 'Bob']);
  });

  await test('Ex5 — appliquerTransformation', () => {
    const doubles = appliquerTransformation([1, 2, 3], (n) => n * 2);
    assertDeepEqual(doubles, [2, 4, 6]);
  });

  await test('Ex5 — filtrer avec predicat', () => {
    const pairs = filtrer([1, 2, 3, 4, 5], (n) => n % 2 === 0);
    assertDeepEqual(pairs, [2, 4]);
  });

  // --- Exercice 6 ---
  await test('Ex6 — multiplierPar', () => {
    const tripler = multiplierPar(3);
    assertEqual(tripler(5), 15);
    assertEqual(tripler(0), 0);
  });

  await test('Ex6 — composer', () => {
    const doubler = (x: number) => x * 2;
    const ajouter1 = (x: number) => x + 1;
    const doublerPuisAjouter1 = composer(ajouter1, doubler);
    assertEqual(doublerPuisAjouter1(5), 11);
  });

  // --- Exercice 7 ---
  await test('Ex7 — estChat type predicate', () => {
    const minou: Animal = { type: 'chat', nom: 'Minou', ronronne: true };
    const rex: Animal = { type: 'chien', nom: 'Rex', race: 'Berger' };
    assertEqual(estChat(minou), true);
    assertEqual(estChat(rex), false);
  });

  await test('Ex7 — estString type predicate', () => {
    assertEqual(estString('hello'), true);
    assertEqual(estString(42), false);
    assertEqual(estString(null), false);
  });

  await test('Ex7 — decrireAnimal chat', () => {
    const minou: Animal = { type: 'chat', nom: 'Minou', ronronne: true };
    assertEqual(decrireAnimal(minou), 'Minou est un chat qui ronronne');
  });

  await test('Ex7 — decrireAnimal chat qui ne ronronne pas', () => {
    const grumpy: Animal = { type: 'chat', nom: 'Grumpy', ronronne: false };
    assertEqual(decrireAnimal(grumpy), 'Grumpy est un chat qui ne ronronne pas');
  });

  await test('Ex7 — decrireAnimal chien', () => {
    const rex: Animal = { type: 'chien', nom: 'Rex', race: 'Berger' };
    assertEqual(decrireAnimal(rex), 'Rex est un chien de race Berger');
  });

  summary();
}

main();
