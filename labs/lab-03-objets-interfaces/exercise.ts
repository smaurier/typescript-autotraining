// =============================================================================
// Lab 03 — Objets et Interfaces
// =============================================================================
// Objectifs :
//   - Modeliser des entites avec des interfaces
//   - Extension, readonly, index signatures
//   - Typage structurel
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 03 — Objets et Interfaces');

// =============================================================================
// Exercice 1 : Interfaces de base
// Definissez les interfaces User et Product.
// =============================================================================

// TODO: Definissez l'interface User avec les proprietes :
//   - id: number
//   - nom: string
//   - email: string
//   - age: number

// TODO: Definissez l'interface Product avec les proprietes :
//   - id: number
//   - nom: string
//   - prix: number
//   - categorie: string

// TODO: Creez un objet 'utilisateur' qui respecte l'interface User
const utilisateur: any = {};

// TODO: Creez un objet 'produit' qui respecte l'interface Product
const produit: any = {};

// =============================================================================
// Exercice 2 : Proprietes optionnelles
// Ajoutez des proprietes optionnelles a vos interfaces.
// =============================================================================

// TODO: Definissez l'interface Adresse avec :
//   - rue: string
//   - ville: string
//   - codePostal: string
//   - pays: string (optionnel, par defaut on suppose France)
//   - complement: string (optionnel)

// TODO: Creez une adresse sans les champs optionnels
const adresseSansPays: any = {};

// TODO: Creez une adresse avec tous les champs
const adresseComplete: any = {};

// =============================================================================
// Exercice 3 : Readonly
// Utilisez readonly pour proteger certaines proprietes.
// =============================================================================

// TODO: Definissez l'interface Config avec des proprietes readonly :
//   - readonly apiUrl: string
//   - readonly port: number
//   - readonly debug: boolean

// TODO: Creez un objet config
const config: any = {};

// TODO: Definissez l'interface Point avec x et y en readonly
//   - readonly x: number
//   - readonly y: number

// TODO: Implementez une fonction 'deplacerPoint' qui prend un Point
// et des deltas (dx, dy) et retourne un NOUVEAU Point (sans modifier l'original)
function deplacerPoint(point: any, dx: number, dy: number): any {
  // TODO: Retournez un nouveau point
  return {};
}

// =============================================================================
// Exercice 4 : Extension d'interfaces
// Creez des hierarchies d'interfaces avec extends.
// =============================================================================

// TODO: Definissez l'interface de base Entite avec :
//   - id: number
//   - creeLe: Date
//   - misAJourLe: Date

// TODO: Definissez UserAvance qui etend Entite avec :
//   - nom: string
//   - email: string
//   - role: 'admin' | 'utilisateur' | 'moderateur'

// TODO: Definissez AdminUser qui etend UserAvance avec :
//   - permissions: string[]

// TODO: Creez un objet admin qui respecte AdminUser
const maintenant = new Date();
const admin: any = {};

// =============================================================================
// Exercice 5 : Index signatures
// Creez des objets avec des cles dynamiques.
// =============================================================================

// TODO: Definissez l'interface Dictionnaire avec une index signature
//   - Cle: string, Valeur: string
//   [cle: string]: string

// TODO: Creez un dictionnaire francais-anglais
const dictionnaire: any = {};

// TODO: Definissez l'interface ScoreBoard avec :
//   - une index signature [joueur: string]: number
//   - une propriete readonly 'meilleurScore': number

// TODO: Implementez une fonction qui retourne le joueur avec le meilleur score
function meilleurJoueur(scores: Record<string, number>): string {
  // TODO: Trouvez le joueur avec le score le plus eleve
  return '';
}

// =============================================================================
// Exercice 6 : Typage structurel
// Comprendre la compatibilite structurelle de TypeScript.
// =============================================================================

// TODO: Definissez ces deux interfaces SEPAREMENT (pas d'extends)
// interface Coordonnees { x: number; y: number }
// interface Coordonnees3D { x: number; y: number; z: number }

// TODO: Implementez cette fonction qui accepte un objet avec x et y
// Grace au typage structurel, un Coordonnees3D devrait aussi etre accepte
function distanceOrigine(point: any): number {
  // TODO: Calculez la distance par rapport a l'origine (0,0)
  // Formule : Math.sqrt(x^2 + y^2)
  return 0;
}

// =============================================================================
// Exercice 7 : Modelisation d'une commande
// Combinez toutes les notions pour modeliser un systeme de commandes.
// =============================================================================

// TODO: Definissez l'interface LigneCommande avec :
//   - produit: Product (reutilisez votre interface de l'Ex1)
//   - quantite: number
//   - readonly sousTotal: number

// TODO: Definissez l'interface Commande avec :
//   - readonly id: number
//   - client: User (reutilisez votre interface de l'Ex1)
//   - lignes: LigneCommande[]
//   - readonly total: number
//   - statut: 'en_attente' | 'validee' | 'expediee' | 'livree'

// TODO: Implementez cette fonction qui cree une commande
function creerCommande(id: number, client: any, lignes: any[]): any {
  // TODO: Calculez le total a partir des lignes
  // Retournez un objet Commande complet avec statut 'en_attente'
  return {};
}

// TODO: Implementez cette fonction qui calcule le montant total
function calculerTotal(lignes: any[]): number {
  // TODO: Sommez les sous-totaux de chaque ligne
  return 0;
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 03 — Objets et Interfaces\n');

  // --- Exercice 1 ---
  await test('Ex1 — utilisateur respecte User', () => {
    assertEqual(typeof utilisateur.id, 'number');
    assertEqual(typeof utilisateur.nom, 'string');
    assertEqual(typeof utilisateur.email, 'string');
    assertEqual(typeof utilisateur.age, 'number');
  });

  await test('Ex1 — produit respecte Product', () => {
    assertEqual(typeof produit.id, 'number');
    assertEqual(typeof produit.nom, 'string');
    assertEqual(typeof produit.prix, 'number');
    assertEqual(typeof produit.categorie, 'string');
  });

  // --- Exercice 2 ---
  await test('Ex2 — adresse sans champs optionnels', () => {
    assertEqual(typeof adresseSansPays.rue, 'string');
    assertEqual(typeof adresseSansPays.ville, 'string');
    assertEqual(typeof adresseSansPays.codePostal, 'string');
    assertEqual(adresseSansPays.pays, undefined);
  });

  await test('Ex2 — adresse complete', () => {
    assertEqual(typeof adresseComplete.rue, 'string');
    assertEqual(typeof adresseComplete.pays, 'string');
    assertEqual(typeof adresseComplete.complement, 'string');
  });

  // --- Exercice 3 ---
  await test('Ex3 — config a les bonnes valeurs', () => {
    assertEqual(typeof config.apiUrl, 'string');
    assertEqual(typeof config.port, 'number');
    assertEqual(typeof config.debug, 'boolean');
  });

  await test('Ex3 — deplacerPoint retourne un nouveau point', () => {
    const p = { x: 1, y: 2 };
    const p2 = deplacerPoint(p, 3, 4);
    assertEqual(p2.x, 4);
    assertEqual(p2.y, 6);
    // L'original ne doit pas etre modifie
    assertEqual(p.x, 1);
    assertEqual(p.y, 2);
  });

  // --- Exercice 4 ---
  await test('Ex4 — admin respecte AdminUser', () => {
    assertEqual(typeof admin.id, 'number');
    assert(admin.creeLe instanceof Date, 'creeLe doit etre une Date');
    assert(admin.misAJourLe instanceof Date, 'misAJourLe doit etre une Date');
    assertEqual(typeof admin.nom, 'string');
    assertEqual(typeof admin.email, 'string');
    assertEqual(admin.role, 'admin');
    assert(Array.isArray(admin.permissions), 'permissions doit etre un tableau');
    assert(admin.permissions.length > 0, 'permissions ne doit pas etre vide');
  });

  // --- Exercice 5 ---
  await test('Ex5 — dictionnaire contient des traductions', () => {
    assertEqual(typeof dictionnaire.bonjour, 'string');
    assert(Object.keys(dictionnaire).length >= 3, 'Le dictionnaire doit contenir au moins 3 mots');
  });

  await test('Ex5 — meilleurJoueur trouve le meilleur', () => {
    const scores = { Alice: 100, Bob: 250, Charlie: 180 };
    assertEqual(meilleurJoueur(scores), 'Bob');
  });

  // --- Exercice 6 ---
  await test('Ex6 — distanceOrigine avec point 2D', () => {
    const p = { x: 3, y: 4 };
    assertEqual(distanceOrigine(p), 5);
  });

  await test('Ex6 — distanceOrigine avec point 3D (structurel)', () => {
    const p3d = { x: 3, y: 4, z: 5 };
    assertEqual(distanceOrigine(p3d), 5);
  });

  // --- Exercice 7 ---
  await test('Ex7 — calculerTotal', () => {
    const lignes = [
      { produit: { id: 1, nom: 'A', prix: 10, categorie: 'X' }, quantite: 2, sousTotal: 20 },
      { produit: { id: 2, nom: 'B', prix: 5, categorie: 'Y' }, quantite: 3, sousTotal: 15 },
    ];
    assertEqual(calculerTotal(lignes), 35);
  });

  await test('Ex7 — creerCommande', () => {
    const client = { id: 1, nom: 'Alice', email: 'alice@test.fr', age: 30 };
    const lignes = [
      { produit: { id: 1, nom: 'Clavier', prix: 50, categorie: 'Informatique' }, quantite: 1, sousTotal: 50 },
      { produit: { id: 2, nom: 'Souris', prix: 25, categorie: 'Informatique' }, quantite: 2, sousTotal: 50 },
    ];
    const commande = creerCommande(1, client, lignes);
    assertEqual(commande.id, 1);
    assertEqual(commande.client.nom, 'Alice');
    assertEqual(commande.total, 100);
    assertEqual(commande.statut, 'en_attente');
    assertEqual(commande.lignes.length, 2);
  });

  summary();
}

main();
