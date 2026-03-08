// =============================================================================
// Lab 06 — Generics (base)
// =============================================================================
// Objectifs :
//   - Classes et fonctions generiques
//   - Contraintes avec extends, keyof
//   - Cache generique, factory generique
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 06 — Generics (base)');

// =============================================================================
// Exercice 1 : Fonction identity generique
// La fonction generique la plus fondamentale.
// =============================================================================

// TODO: Implementez une fonction generique 'identite' qui prend un argument
// de type T et retourne ce meme argument avec le meme type
// function identite<T>(valeur: T): T { ... }
function identite(valeur: any): any {
  // TODO: Implementez
  return valeur;
}

// TODO: Implementez une fonction generique 'premierElement' qui prend
// un tableau de T et retourne le premier element (T | undefined)
function premierElement(tableau: any[]): any {
  // TODO: Implementez
  return undefined;
}

// TODO: Implementez une fonction generique 'dernierElement' qui prend
// un tableau de T et retourne le dernier element (T | undefined)
function dernierElement(tableau: any[]): any {
  // TODO: Implementez
  return undefined;
}

// =============================================================================
// Exercice 2 : Stack<T> — Pile generique
// Implementez une structure de donnees pile (LIFO).
// =============================================================================

// TODO: Creez la classe generique Stack<T> avec :
//   - propriete privee 'elements': T[]
//   - methode 'push(element: T)': void — ajoute un element au sommet
//   - methode 'pop()': T — retire et retourne l'element au sommet
//     (lance une Error si la pile est vide)
//   - methode 'peek()': T — retourne l'element au sommet sans le retirer
//     (lance une Error si la pile est vide)
//   - getter 'taille': number — retourne le nombre d'elements
//   - getter 'estVide': boolean — retourne true si la pile est vide
//   - methode 'vider()': void — vide la pile
//   - methode 'versTableau()': T[] — retourne une copie du tableau interne

// class Stack<T> { ... }

// =============================================================================
// Exercice 3 : Cache generique
// Creez un systeme de cache avec expiration.
// =============================================================================

// TODO: Creez l'interface EntreeCache<T> avec :
//   - valeur: T
//   - expiration: number (timestamp en ms)

// TODO: Creez la classe generique Cache<T> avec :
//   - propriete privee 'donnees': Map<string, EntreeCache<T>>
//   - methode 'definir(cle: string, valeur: T, dureeMs: number)': void
//     — stocke la valeur avec un timestamp d'expiration
//   - methode 'obtenir(cle: string)': T | undefined
//     — retourne la valeur si elle existe et n'a pas expire, sinon undefined
//     — supprime les entrees expirees
//   - getter 'taille': number — nombre d'entrees (y compris expirees)
//   - methode 'supprimer(cle: string)': boolean — supprime une entree
//   - methode 'vider()': void — vide le cache

// class Cache<T> { ... }

// =============================================================================
// Exercice 4 : Contraintes generiques
// Utilisez extends pour contraindre les types acceptes.
// =============================================================================

// TODO: Creez une fonction generique 'fusionner' qui prend deux objets
// et retourne un nouvel objet qui combine les proprietes des deux
// Contrainte : les deux parametres doivent etre des objets (extends object)
function fusionner(obj1: any, obj2: any): any {
  // TODO: Utilisez le spread operator
  return {};
}

// TODO: Creez une interface 'AvecLongueur' avec une propriete 'length: number'
// Puis creez une fonction generique 'afficherLongueur' contrainte a AvecLongueur
// qui retourne "{valeur} a une longueur de {length}"
function afficherLongueur(valeur: any): string {
  // TODO: Implementez avec la contrainte
  return '';
}

// TODO: Creez une fonction generique 'minimum' qui accepte des valeurs
// qui implementent une comparaison (extends { valueOf(): number })
// et retourne la plus petite des deux
// Pour simplifier, contraignez T a string | number
function minimum(a: any, b: any): any {
  // TODO: Implementez
  return undefined;
}

// =============================================================================
// Exercice 5 : keyof et lookup types
// Accedez aux proprietes de maniere type-safe.
// =============================================================================

// TODO: Creez une fonction generique 'obtenirPropriete' qui prend :
//   - un objet de type T
//   - une cle de type K (contrainte a keyof T)
//   et retourne la valeur T[K]
function obtenirPropriete(obj: any, cle: string): any {
  // TODO: Implementez
  return undefined;
}

// TODO: Creez une fonction generique 'definirPropriete' qui prend :
//   - un objet de type T
//   - une cle de type K (contrainte a keyof T)
//   - une valeur de type T[K]
//   et retourne un nouvel objet avec la propriete mise a jour
function definirPropriete(obj: any, cle: string, valeur: any): any {
  // TODO: Implementez (retournez un nouvel objet, ne modifiez pas l'original)
  return {};
}

// TODO: Creez une fonction generique 'sousEnsemble' qui prend :
//   - un objet de type T
//   - un tableau de cles K[]
//   et retourne un nouvel objet ne contenant que les cles specifiees
function sousEnsemble(obj: any, cles: string[]): any {
  // TODO: Implementez
  return {};
}

// =============================================================================
// Exercice 6 : Factory generique
// Creez des objets de maniere generique.
// =============================================================================

// TODO: Creez une interface 'Identifiable' avec :
//   - id: number

// TODO: Creez une fonction generique 'creerEntite' qui :
//   - prend un id (number) et des donnees partielles (Omit<T, 'id'>)
//   - retourne un objet de type T
//   Contrainte : T extends Identifiable
function creerEntite(id: number, donnees: any): any {
  // TODO: Implementez
  return {};
}

// TODO: Creez une classe generique 'Registre<T extends Identifiable>' avec :
//   - propriete privee 'entites': Map<number, T>
//   - methode 'ajouter(entite: T)': void
//   - methode 'obtenir(id: number)': T | undefined
//   - methode 'supprimer(id: number)': boolean
//   - methode 'lister()': T[]
//   - getter 'taille': number

// class Registre<T extends Identifiable> { ... }

// =============================================================================
// Tests — Ne modifiez pas cette section
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
    const pile = new (Stack as any)<number>();
    assertEqual(pile.taille, 0);
    assertEqual(pile.estVide, true);
    pile.push(1);
    pile.push(2);
    pile.push(3);
    assertEqual(pile.taille, 3);
    assertEqual(pile.estVide, false);
  });

  await test('Ex2 — Stack pop', () => {
    const pile = new (Stack as any)<string>();
    pile.push('a');
    pile.push('b');
    pile.push('c');
    assertEqual(pile.pop(), 'c');
    assertEqual(pile.pop(), 'b');
    assertEqual(pile.taille, 1);
  });

  await test('Ex2 — Stack peek', () => {
    const pile = new (Stack as any)<number>();
    pile.push(42);
    assertEqual(pile.peek(), 42);
    assertEqual(pile.taille, 1); // peek ne retire pas l'element
  });

  await test('Ex2 — Stack pop sur pile vide', () => {
    const pile = new (Stack as any)<number>();
    assertThrows(() => pile.pop());
  });

  await test('Ex2 — Stack versTableau', () => {
    const pile = new (Stack as any)<number>();
    pile.push(1);
    pile.push(2);
    pile.push(3);
    assertDeepEqual(pile.versTableau(), [1, 2, 3]);
  });

  await test('Ex2 — Stack vider', () => {
    const pile = new (Stack as any)<number>();
    pile.push(1);
    pile.push(2);
    pile.vider();
    assertEqual(pile.taille, 0);
    assertEqual(pile.estVide, true);
  });

  // --- Exercice 3 ---
  await test('Ex3 — Cache definir et obtenir', () => {
    const cache = new (Cache as any)<string>();
    cache.definir('nom', 'Alice', 10000);
    assertEqual(cache.obtenir('nom'), 'Alice');
  });

  await test('Ex3 — Cache cle inexistante', () => {
    const cache = new (Cache as any)<number>();
    assertEqual(cache.obtenir('inexistant'), undefined);
  });

  await test('Ex3 — Cache expiration', () => {
    const cache = new (Cache as any)<string>();
    cache.definir('temp', 'valeur', 1); // expire dans 1ms
    // Attendre un peu pour que l'entree expire
    const debut = Date.now();
    while (Date.now() - debut < 5) { /* attente active */ }
    assertEqual(cache.obtenir('temp'), undefined);
  });

  await test('Ex3 — Cache supprimer', () => {
    const cache = new (Cache as any)<string>();
    cache.definir('cle', 'valeur', 10000);
    assertEqual(cache.supprimer('cle'), true);
    assertEqual(cache.obtenir('cle'), undefined);
    assertEqual(cache.supprimer('inexistant'), false);
  });

  await test('Ex3 — Cache vider', () => {
    const cache = new (Cache as any)<number>();
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
    assertEqual(obj.age, 30); // original non modifie
  });

  await test('Ex5 — sousEnsemble', () => {
    const obj = { nom: 'Alice', age: 30, ville: 'Paris', email: 'alice@test.fr' };
    const partiel = sousEnsemble(obj, ['nom', 'email']);
    assertEqual(partiel.nom, 'Alice');
    assertEqual(partiel.email, 'alice@test.fr');
    assertEqual(partiel.age, undefined);
  });

  // --- Exercice 6 ---
  await test('Ex6 — creerEntite', () => {
    interface Utilisateur { id: number; nom: string; email: string; }
    const user = creerEntite<Utilisateur>(1, { nom: 'Alice', email: 'alice@test.fr' });
    assertEqual(user.id, 1);
    assertEqual(user.nom, 'Alice');
  });

  await test('Ex6 — Registre ajouter et obtenir', () => {
    const registre = new (Registre as any)<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    registre.ajouter({ id: 2, nom: 'Bob' });
    assertEqual(registre.obtenir(1)?.nom, 'Alice');
    assertEqual(registre.taille, 2);
  });

  await test('Ex6 — Registre supprimer', () => {
    const registre = new (Registre as any)<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    assertEqual(registre.supprimer(1), true);
    assertEqual(registre.obtenir(1), undefined);
    assertEqual(registre.taille, 0);
  });

  await test('Ex6 — Registre lister', () => {
    const registre = new (Registre as any)<{ id: number; nom: string }>();
    registre.ajouter({ id: 1, nom: 'Alice' });
    registre.ajouter({ id: 2, nom: 'Bob' });
    const liste = registre.lister();
    assertEqual(liste.length, 2);
  });

  summary();
}

// Declarations necessaires pour que les tests compilent
declare var Stack: any;
declare var Cache: any;
declare var Registre: any;

main();
