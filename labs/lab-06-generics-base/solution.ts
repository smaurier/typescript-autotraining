// =============================================================================
// Lab 06 — Generics (base) (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 06 — Generics (base)');

// =============================================================================
// Exercice 1 : Fonction identity generique
// =============================================================================

function identite<T>(valeur: T): T {
  return valeur;
}

function premierElement<T>(tableau: T[]): T | undefined {
  return tableau[0];
}

function dernierElement<T>(tableau: T[]): T | undefined {
  return tableau[tableau.length - 1];
}

// =============================================================================
// Exercice 2 : Stack<T> — Pile generique
// =============================================================================

class Stack<T> {
  private elements: T[] = [];

  push(element: T): void {
    this.elements.push(element);
  }

  pop(): T {
    if (this.estVide) {
      throw new Error('La pile est vide');
    }
    return this.elements.pop()!;
  }

  peek(): T {
    if (this.estVide) {
      throw new Error('La pile est vide');
    }
    return this.elements[this.elements.length - 1];
  }

  get taille(): number {
    return this.elements.length;
  }

  get estVide(): boolean {
    return this.elements.length === 0;
  }

  vider(): void {
    this.elements = [];
  }

  versTableau(): T[] {
    return [...this.elements];
  }
}

// =============================================================================
// Exercice 3 : Cache generique
// =============================================================================

interface EntreeCache<T> {
  valeur: T;
  expiration: number;
}

class Cache<T> {
  private donnees: Map<string, EntreeCache<T>> = new Map();

  definir(cle: string, valeur: T, dureeMs: number): void {
    this.donnees.set(cle, {
      valeur,
      expiration: Date.now() + dureeMs,
    });
  }

  obtenir(cle: string): T | undefined {
    const entree = this.donnees.get(cle);
    if (!entree) {
      return undefined;
    }
    if (Date.now() > entree.expiration) {
      this.donnees.delete(cle);
      return undefined;
    }
    return entree.valeur;
  }

  get taille(): number {
    return this.donnees.size;
  }

  supprimer(cle: string): boolean {
    return this.donnees.delete(cle);
  }

  vider(): void {
    this.donnees.clear();
  }
}

// =============================================================================
// Exercice 4 : Contraintes generiques
// =============================================================================

function fusionner<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

interface AvecLongueur {
  length: number;
}

function afficherLongueur<T extends AvecLongueur>(valeur: T): string {
  return `${valeur} a une longueur de ${valeur.length}`;
}

function minimum<T extends string | number>(a: T, b: T): T {
  return a < b ? a : b;
}

// =============================================================================
// Exercice 5 : keyof et lookup types
// =============================================================================

function obtenirPropriete<T, K extends keyof T>(obj: T, cle: K): T[K] {
  return obj[cle];
}

function definirPropriete<T, K extends keyof T>(obj: T, cle: K, valeur: T[K]): T {
  return { ...obj, [cle]: valeur };
}

function sousEnsemble<T, K extends keyof T>(obj: T, cles: K[]): Pick<T, K> {
  const resultat = {} as Pick<T, K>;
  for (const cle of cles) {
    resultat[cle] = obj[cle];
  }
  return resultat;
}

// =============================================================================
// Exercice 6 : Factory generique
// =============================================================================

interface Identifiable {
  id: number;
}

function creerEntite<T extends Identifiable>(id: number, donnees: Omit<T, 'id'>): T {
  return { id, ...donnees } as T;
}

class Registre<T extends Identifiable> {
  private entites: Map<number, T> = new Map();

  ajouter(entite: T): void {
    this.entites.set(entite.id, entite);
  }

  obtenir(id: number): T | undefined {
    return this.entites.get(id);
  }

  supprimer(id: number): boolean {
    return this.entites.delete(id);
  }

  lister(): T[] {
    return Array.from(this.entites.values());
  }

  get taille(): number {
    return this.entites.size;
  }
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 06 — Generics (base)\n');

  // --- Exercice 1 ---
  await test('Ex1 — identite avec string', () => {
    assertEqual(identite('bonjour'), 'bonjour');
  });

  await test('Ex1 — identite avec number', () => {
    assertEqual(identite(42), 42);
  });

  await test('Ex1 — premierElement', () => {
    assertEqual(premierElement([10, 20, 30]), 10);
    assertEqual(premierElement(['a', 'b']), 'a');
    assertEqual(premierElement([]), undefined);
  });

  await test('Ex1 — dernierElement', () => {
    assertEqual(dernierElement([10, 20, 30]), 30);
    assertEqual(dernierElement(['a', 'b']), 'b');
    assertEqual(dernierElement([]), undefined);
  });

  // --- Exercice 2 ---
  await test('Ex2 — Stack push et taille', () => {
    const pile = new Stack<number>();
    assertEqual(pile.taille, 0);
    assertEqual(pile.estVide, true);
    pile.push(1);
    pile.push(2);
    pile.push(3);
    assertEqual(pile.taille, 3);
    assertEqual(pile.estVide, false);
  });

  await test('Ex2 — Stack pop', () => {
    const pile = new Stack<string>();
    pile.push('a');
    pile.push('b');
    pile.push('c');
    assertEqual(pile.pop(), 'c');
    assertEqual(pile.pop(), 'b');
    assertEqual(pile.taille, 1);
  });

  await test('Ex2 — Stack peek', () => {
    const pile = new Stack<number>();
    pile.push(42);
    assertEqual(pile.peek(), 42);
    assertEqual(pile.taille, 1);
  });

  await test('Ex2 — Stack pop sur pile vide', () => {
    const pile = new Stack<number>();
    assertThrows(() => pile.pop());
  });

  await test('Ex2 — Stack versTableau', () => {
    const pile = new Stack<number>();
    pile.push(1);
    pile.push(2);
    pile.push(3);
    assertDeepEqual(pile.versTableau(), [1, 2, 3]);
  });

  await test('Ex2 — Stack vider', () => {
    const pile = new Stack<number>();
    pile.push(1);
    pile.push(2);
    pile.vider();
    assertEqual(pile.taille, 0);
    assertEqual(pile.estVide, true);
  });

  // --- Exercice 3 ---
  await test('Ex3 — Cache definir et obtenir', () => {
    const cache = new Cache<string>();
    cache.definir('nom', 'Alice', 10000);
    assertEqual(cache.obtenir('nom'), 'Alice');
  });

  await test('Ex3 — Cache cle inexistante', () => {
    const cache = new Cache<number>();
    assertEqual(cache.obtenir('inexistant'), undefined);
  });

  await test('Ex3 — Cache expiration', () => {
    const cache = new Cache<string>();
    cache.definir('temp', 'valeur', 1);
    const debut = Date.now();
    while (Date.now() - debut < 5) { /* attente active */ }
    assertEqual(cache.obtenir('temp'), undefined);
  });

  await test('Ex3 — Cache supprimer', () => {
    const cache = new Cache<string>();
    cache.definir('cle', 'valeur', 10000);
    assertEqual(cache.supprimer('cle'), true);
    assertEqual(cache.obtenir('cle'), undefined);
    assertEqual(cache.supprimer('inexistant'), false);
  });

  await test('Ex3 — Cache vider', () => {
    const cache = new Cache<number>();
    cache.definir('a', 1, 10000);
    cache.definir('b', 2, 10000);
    cache.vider();
    assertEqual(cache.taille, 0);
  });

  // --- Exercice 4 ---
  await test('Ex4 — fusionner objets', () => {
    const resultat = fusionner({ nom: 'Alice' }, { age: 30 });
    assertEqual(resultat.nom, 'Alice');
    assertEqual(resultat.age, 30);
  });

  await test('Ex4 — afficherLongueur string', () => {
    assertEqual(afficherLongueur('hello'), 'hello a une longueur de 5');
  });

  await test('Ex4 — afficherLongueur tableau', () => {
    assertEqual(afficherLongueur([1, 2, 3]), '1,2,3 a une longueur de 3');
  });

  await test('Ex4 — minimum nombres', () => {
    assertEqual(minimum(5, 3), 3);
    assertEqual(minimum(1, 8), 1);
  });

  await test('Ex4 — minimum strings', () => {
    assertEqual(minimum('banane', 'abricot'), 'abricot');
  });

  // --- Exercice 5 ---
  await test('Ex5 — obtenirPropriete', () => {
    const obj = { nom: 'Alice', age: 30, ville: 'Paris' };
    assertEqual(obtenirPropriete(obj, 'nom'), 'Alice');
    assertEqual(obtenirPropriete(obj, 'age'), 30);
  });

  await test('Ex5 — definirPropriete', () => {
    const obj = { nom: 'Alice', age: 30 };
    const nouveau = definirPropriete(obj, 'age', 31);
    assertEqual(nouveau.age, 31);
    assertEqual(obj.age, 30);
  });

  await test('Ex5 — sousEnsemble', () => {
    const obj = { nom: 'Alice', age: 30, ville: 'Paris', email: 'alice@test.fr' };
    const partiel = sousEnsemble(obj, ['nom', 'email']);
    assertEqual(partiel.nom, 'Alice');
    assertEqual(partiel.email, 'alice@test.fr');
    assertEqual((partiel as any).age, undefined);
  });

  // --- Exercice 6 ---
  await test('Ex6 — creerEntite', () => {
    interface Utilisateur { id: number; nom: string; email: string; }
    const user = creerEntite<Utilisateur>(1, { nom: 'Alice', email: 'alice@test.fr' });
    assertEqual(user.id, 1);
    assertEqual(user.nom, 'Alice');
  });

  await test('Ex6 — Registre ajouter et obtenir', () => {
    const registre = new Registre<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    registre.ajouter({ id: 2, nom: 'Bob' });
    assertEqual(registre.obtenir(1)?.nom, 'Alice');
    assertEqual(registre.taille, 2);
  });

  await test('Ex6 — Registre supprimer', () => {
    const registre = new Registre<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    assertEqual(registre.supprimer(1), true);
    assertEqual(registre.obtenir(1), undefined);
    assertEqual(registre.taille, 0);
  });

  await test('Ex6 — Registre lister', () => {
    const registre = new Registre<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    registre.ajouter({ id: 2, nom: 'Bob' });
    const liste = registre.lister();
    assertEqual(liste.length, 2);
  });

  summary();
}

main();
