// =============================================================================
// Lab 01 — Premiers types (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, summary } = createTestRunner('Lab 01 — Premiers types');

// =============================================================================
// Exercice 1 : Annotations de base
// =============================================================================

let prenom: string = 'Alice';
let age: number = 30;
let estActif: boolean = true;
let scores: number[] = [10, 20, 30];

// =============================================================================
// Exercice 2 : Correction d'erreurs
// =============================================================================

// Corrige : retourne bien un nombre (x * 2 au lieu de x.toString())
function doubler(x: number): number {
  return x * 2;
}

// Corrige : le parametre est type string au lieu de any
function longueur(texte: string): number {
  return texte.length;
}

// =============================================================================
// Exercice 3 : Inference vs annotation
// =============================================================================

// TypeScript infere "Bonjour tout le monde" (type litteral car const)
const messageBienvenue = 'Bonjour tout le monde';

// Annotation necessaire car initialisee plus tard
let resultat: number;
resultat = 42;

// Annotation pour un tableau de strings
let prenoms: string[];
prenoms = ['Alice', 'Bob', 'Charlie'];

// =============================================================================
// Exercice 4 : let vs const — inference
// =============================================================================

const direction = 'nord';
let directionVariable = 'nord';

// const -> type litteral 200
const statusCode = 200;

// let -> type string
let currentStatus = 'actif';

// =============================================================================
// Exercice 5 : Types litteraux
// =============================================================================

type Couleur = 'rouge' | 'vert' | 'bleu';

function codeHexa(couleur: Couleur): string {
  switch (couleur) {
    case 'rouge':
      return '#FF0000';
    case 'vert':
      return '#00FF00';
    case 'bleu':
      return '#0000FF';
  }
}

// =============================================================================
// Exercice 6 : unknown vs any
// =============================================================================

function traiterValeur(valeur: unknown): string {
  if (typeof valeur === 'string') {
    return valeur.toUpperCase();
  }
  if (typeof valeur === 'number') {
    return String(valeur);
  }
  if (typeof valeur === 'boolean') {
    return valeur ? 'vrai' : 'faux';
  }
  return 'type inconnu';
}

// =============================================================================
// Exercice 7 : Fonctions de base
// =============================================================================

function saluer(nom: string, formel: boolean): string {
  if (formel) {
    return `Bonjour, ${nom}. Comment allez-vous ?`;
  }
  return `Salut ${nom} !`;
}

function creerMessage(texte: string, auteur?: string): string {
  if (auteur) {
    return `${texte} — ${auteur}`;
  }
  return texte;
}

// =============================================================================
// Exercice 8 : Unions de types simples
// =============================================================================

type Identifiant = string | number;

function formaterIdentifiant(id: Identifiant): string {
  if (typeof id === 'number') {
    return `ID-${id}`;
  }
  return id.toUpperCase();
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 01 — Premiers types\n');

  // --- Exercice 1 ---
  await test('Ex1 — prenom est une string', () => {
    assertEqual(typeof prenom, 'string');
    assertEqual(prenom, 'Alice');
  });

  await test('Ex1 — age est un number', () => {
    assertEqual(typeof age, 'number');
    assertEqual(age, 30);
  });

  await test('Ex1 — estActif est un boolean', () => {
    assertEqual(typeof estActif, 'boolean');
    assertEqual(estActif, true);
  });

  await test('Ex1 — scores est un tableau de nombres', () => {
    assert(Array.isArray(scores), 'scores doit etre un tableau');
    assertEqual(scores.length, 3);
    assertEqual(scores[0], 10);
  });

  // --- Exercice 2 ---
  await test('Ex2 — doubler retourne un nombre', () => {
    const resultat = doubler(5);
    assertEqual(typeof resultat, 'number');
    assertEqual(resultat, 10);
  });

  await test('Ex2 — longueur accepte un string', () => {
    assertEqual(longueur('Bonjour'), 7);
    assertEqual(longueur(''), 0);
  });

  // --- Exercice 3 ---
  await test('Ex3 — messageBienvenue est infere', () => {
    assertEqual(messageBienvenue, 'Bonjour tout le monde');
  });

  await test('Ex3 — resultat est un number', () => {
    assertEqual(typeof resultat, 'number');
    assertEqual(resultat, 42);
  });

  await test('Ex3 — prenoms est un tableau de strings', () => {
    assert(Array.isArray(prenoms), 'prenoms doit etre un tableau');
    assertEqual(prenoms[0], 'Alice');
  });

  // --- Exercice 4 ---
  await test('Ex4 — statusCode vaut 200', () => {
    assertEqual(statusCode, 200);
  });

  await test('Ex4 — currentStatus vaut "actif"', () => {
    assertEqual(currentStatus, 'actif');
  });

  // --- Exercice 5 ---
  await test('Ex5 — codeHexa retourne les bons codes', () => {
    assertEqual(codeHexa('rouge'), '#FF0000');
    assertEqual(codeHexa('vert'), '#00FF00');
    assertEqual(codeHexa('bleu'), '#0000FF');
  });

  // --- Exercice 6 ---
  await test('Ex6 — traiterValeur avec string', () => {
    assertEqual(traiterValeur('bonjour'), 'BONJOUR');
  });

  await test('Ex6 — traiterValeur avec number', () => {
    assertEqual(traiterValeur(42), '42');
  });

  await test('Ex6 — traiterValeur avec boolean', () => {
    assertEqual(traiterValeur(true), 'vrai');
    assertEqual(traiterValeur(false), 'faux');
  });

  await test('Ex6 — traiterValeur avec autre type', () => {
    assertEqual(traiterValeur(null), 'type inconnu');
  });

  // --- Exercice 7 ---
  await test('Ex7 — saluer informel', () => {
    assertEqual(saluer('Alice', false), 'Salut Alice !');
  });

  await test('Ex7 — saluer formel', () => {
    assertEqual(saluer('Alice', true), 'Bonjour, Alice. Comment allez-vous ?');
  });

  await test('Ex7 — creerMessage sans auteur', () => {
    assertEqual(creerMessage('Hello', undefined), 'Hello');
  });

  await test('Ex7 — creerMessage avec auteur', () => {
    assertEqual(creerMessage('Hello', 'Bob'), 'Hello — Bob');
  });

  // --- Exercice 8 ---
  await test('Ex8 — formaterIdentifiant avec number', () => {
    assertEqual(formaterIdentifiant(123), 'ID-123');
  });

  await test('Ex8 — formaterIdentifiant avec string', () => {
    assertEqual(formaterIdentifiant('abc'), 'ABC');
  });

  summary();
}

main();
