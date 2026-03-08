// =============================================================================
// Lab 03 — Objets et Interfaces (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 03 — Objets et Interfaces');

// =============================================================================
// Exercice 1 : Interfaces de base
// =============================================================================

interface User {
  id: number;
  nom: string;
  email: string;
  age: number;
}

interface Product {
  id: number;
  nom: string;
  prix: number;
  categorie: string;
}

const utilisateur: User = {
  id: 1,
  nom: 'Alice Dupont',
  email: 'alice@example.fr',
  age: 30,
};

const produit: Product = {
  id: 101,
  nom: 'Clavier mecanique',
  prix: 89.99,
  categorie: 'Informatique',
};

// =============================================================================
// Exercice 2 : Proprietes optionnelles
// =============================================================================

interface Adresse {
  rue: string;
  ville: string;
  codePostal: string;
  pays?: string;
  complement?: string;
}

const adresseSansPays: Adresse = {
  rue: '12 rue de la Paix',
  ville: 'Paris',
  codePostal: '75002',
};

const adresseComplete: Adresse = {
  rue: '5 avenue des Champs-Elysees',
  ville: 'Paris',
  codePostal: '75008',
  pays: 'France',
  complement: 'Batiment A, 3eme etage',
};

// =============================================================================
// Exercice 3 : Readonly
// =============================================================================

interface Config {
  readonly apiUrl: string;
  readonly port: number;
  readonly debug: boolean;
}

const config: Config = {
  apiUrl: 'https://api.example.fr',
  port: 3000,
  debug: true,
};

interface Point {
  readonly x: number;
  readonly y: number;
}

function deplacerPoint(point: Point, dx: number, dy: number): Point {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

// =============================================================================
// Exercice 4 : Extension d'interfaces
// =============================================================================

interface Entite {
  id: number;
  creeLe: Date;
  misAJourLe: Date;
}

interface UserAvance extends Entite {
  nom: string;
  email: string;
  role: 'admin' | 'utilisateur' | 'moderateur';
}

interface AdminUser extends UserAvance {
  permissions: string[];
}

const maintenant = new Date();
const admin: AdminUser = {
  id: 1,
  creeLe: maintenant,
  misAJourLe: maintenant,
  nom: 'Super Admin',
  email: 'admin@example.fr',
  role: 'admin',
  permissions: ['lire', 'ecrire', 'supprimer', 'gerer_utilisateurs'],
};

// =============================================================================
// Exercice 5 : Index signatures
// =============================================================================

interface Dictionnaire {
  [cle: string]: string;
}

const dictionnaire: Dictionnaire = {
  bonjour: 'hello',
  merci: 'thank you',
  chat: 'cat',
  chien: 'dog',
};

interface ScoreBoard {
  [joueur: string]: number;
  readonly meilleurScore: number;
}

function meilleurJoueur(scores: Record<string, number>): string {
  let meilleur = '';
  let max = -Infinity;
  for (const [joueur, score] of Object.entries(scores)) {
    if (score > max) {
      max = score;
      meilleur = joueur;
    }
  }
  return meilleur;
}

// =============================================================================
// Exercice 6 : Typage structurel
// =============================================================================

interface Coordonnees {
  x: number;
  y: number;
}

interface Coordonnees3D {
  x: number;
  y: number;
  z: number;
}

function distanceOrigine(point: Coordonnees): number {
  return Math.sqrt(point.x ** 2 + point.y ** 2);
}

// =============================================================================
// Exercice 7 : Modelisation d'une commande
// =============================================================================

interface LigneCommande {
  produit: Product;
  quantite: number;
  readonly sousTotal: number;
}

interface Commande {
  readonly id: number;
  client: User;
  lignes: LigneCommande[];
  readonly total: number;
  statut: 'en_attente' | 'validee' | 'expediee' | 'livree';
}

function calculerTotal(lignes: LigneCommande[]): number {
  return lignes.reduce((acc, ligne) => acc + ligne.sousTotal, 0);
}

function creerCommande(id: number, client: User, lignes: LigneCommande[]): Commande {
  return {
    id,
    client,
    lignes,
    total: calculerTotal(lignes),
    statut: 'en_attente',
  };
}

// =============================================================================
// Tests
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
    const p: Point = { x: 1, y: 2 };
    const p2 = deplacerPoint(p, 3, 4);
    assertEqual(p2.x, 4);
    assertEqual(p2.y, 6);
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
    const p: Coordonnees = { x: 3, y: 4 };
    assertEqual(distanceOrigine(p), 5);
  });

  await test('Ex6 — distanceOrigine avec point 3D (structurel)', () => {
    const p3d: Coordonnees3D = { x: 3, y: 4, z: 5 };
    assertEqual(distanceOrigine(p3d), 5);
  });

  // --- Exercice 7 ---
  await test('Ex7 — calculerTotal', () => {
    const lignes: LigneCommande[] = [
      { produit: { id: 1, nom: 'A', prix: 10, categorie: 'X' }, quantite: 2, sousTotal: 20 },
      { produit: { id: 2, nom: 'B', prix: 5, categorie: 'Y' }, quantite: 3, sousTotal: 15 },
    ];
    assertEqual(calculerTotal(lignes), 35);
  });

  await test('Ex7 — creerCommande', () => {
    const client: User = { id: 1, nom: 'Alice', email: 'alice@test.fr', age: 30 };
    const lignes: LigneCommande[] = [
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
