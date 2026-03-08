// =============================================================================
// Lab 01 — Premiers types
// =============================================================================
// Objectifs :
//   - Annoter des variables avec les types primitifs
//   - Corriger des erreurs de typage
//   - Comprendre l'inference et les types litteraux
//   - Utiliser unknown au lieu de any
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, summary } = createTestRunner('Lab 01 — Premiers types');

// =============================================================================
// Exercice 1 : Annotations de base
// Annotez chaque variable avec le bon type primitif.
// =============================================================================

// TODO: Annotez ces variables avec le type correct (string, number, boolean)
let prenom = 'Alice';
let age = 30;
let estActif = true;

// TODO: Annotez cette variable comme un tableau de nombres
let scores = [10, 20, 30];

// =============================================================================
// Exercice 2 : Correction d'erreurs
// Chaque fonction ci-dessous contient une erreur de typage.
// Corrigez-les pour que le code compile et les tests passent.
// =============================================================================

// TODO: Corrigez le type de retour de cette fonction
// Actuellement elle retourne une string au lieu d'un number
function doubler(x: number): number {
  // TODO: Corrigez l'implementation pour retourner un nombre, pas une string
  return x.toString() as any;
}

// TODO: Corrigez le type du parametre
// La fonction doit accepter un string et retourner sa longueur
function longueur(texte: any): number {
  return texte.length;
}

// =============================================================================
// Exercice 3 : Inference vs annotation
// Pour chaque variable, indiquez si TypeScript peut inferer le type
// correctement ou si une annotation est necessaire.
// =============================================================================

// TODO: Laissez TypeScript inferer le type (pas d'annotation)
// Quelle est le type infere ?
const messageBienvenue = 'Bonjour tout le monde';

// TODO: Ici, une annotation est necessaire car la variable est
// initialisee plus tard. Ajoutez le type correct.
let resultat: any; // <-- Remplacez 'any' par le bon type
resultat = 42;

// TODO: Annotez ce tableau qui contiendra des strings
let prenoms: any[]; // <-- Remplacez 'any[]' par le bon type
prenoms = ['Alice', 'Bob', 'Charlie'];

// =============================================================================
// Exercice 4 : let vs const — inference
// Observez la difference d'inference entre let et const
// =============================================================================

// Avec const, TypeScript infere un type litteral
const direction = 'nord';
// typeof direction === "nord" (type litteral)

// Avec let, TypeScript infere un type elargi
let directionVariable = 'nord';
// typeof directionVariable === string

// TODO: Creez une variable constante 'statusCode' avec la valeur 200
// TypeScript doit inferer le type litteral 200 (pas number)
// const statusCode = ???
const statusCode = undefined as any; // <-- Remplacez par la bonne valeur

// TODO: Creez une variable let 'currentStatus' avec la valeur 'actif'
// TypeScript doit inferer le type string (pas "actif")
// let currentStatus = ???
let currentStatus = undefined as any; // <-- Remplacez par la bonne valeur

// =============================================================================
// Exercice 5 : Types litteraux
// Creez des variables avec des types litteraux precis.
// =============================================================================

// TODO: Creez un type qui n'accepte que 'rouge', 'vert', ou 'bleu'
// type Couleur = ???
type Couleur = any; // <-- Remplacez par le bon type

// TODO: Creez une fonction qui accepte uniquement une Couleur
// et retourne son code hexadecimal
function codeHexa(couleur: any): string {
  // TODO: Implementez avec un switch ou des if
  // rouge -> '#FF0000', vert -> '#00FF00', bleu -> '#0000FF'
  return '';
}

// =============================================================================
// Exercice 6 : unknown vs any
// Remplacez 'any' par 'unknown' et ajoutez le narrowing necessaire.
// =============================================================================

// TODO: Changez le type du parametre de 'any' a 'unknown'
// et ajoutez les verifications de type necessaires
function traiterValeur(valeur: any): string {
  // TODO: Ajoutez le narrowing pour gerer string, number, et boolean
  // Si string : retourner la valeur en majuscules
  // Si number : retourner le nombre converti en string
  // Si boolean : retourner 'vrai' ou 'faux'
  // Sinon : retourner 'type inconnu'
  return String(valeur);
}

// =============================================================================
// Exercice 7 : Fonctions de base
// Annotez les parametres et le type de retour de chaque fonction.
// =============================================================================

// TODO: Ajoutez les annotations de type aux parametres et au retour
function saluer(nom: any, formel: any): any {
  if (formel) {
    return `Bonjour, ${nom}. Comment allez-vous ?`;
  }
  return `Salut ${nom} !`;
}

// TODO: Ajoutez les annotations de type (parametre optionnel)
function creerMessage(texte: any, auteur: any): any {
  if (auteur) {
    return `${texte} — ${auteur}`;
  }
  return texte;
}

// =============================================================================
// Exercice 8 : Unions de types simples
// Utilisez des unions pour accepter plusieurs types.
// =============================================================================

// TODO: Creez un type 'Identifiant' qui peut etre un string ou un number
type Identifiant = any; // <-- Remplacez par le bon type

// TODO: Implementez cette fonction qui formate un identifiant
// Si c'est un number, ajoutez le prefixe 'ID-'
// Si c'est un string, retournez-le en majuscules
function formaterIdentifiant(id: any): string {
  // TODO: Implementez avec du narrowing typeof
  return '';
}

// =============================================================================
// Tests — Ne modifiez pas cette section
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
