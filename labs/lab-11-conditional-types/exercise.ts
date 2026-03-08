// =============================================================================
// Lab 11 — Conditional Types
// =============================================================================
// Objectifs :
//   - Types conditionnels avec infer
//   - Flatten, UnpackPromise, IsEqual, IsNever
//   - Assertions de type au niveau compilation
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertType, summary } = createTestRunner('Lab 11 — Conditional Types');

// =============================================================================
// Helper : Assertion de type compile-time
// Ce type retourne true si A et B sont exactement le meme type
// =============================================================================

// On vous fournit ce helper pour les tests de type
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// =============================================================================
// Exercice 1 : Types conditionnels de base
// Implementez des types conditionnels simples avec extends et infer.
// =============================================================================

// TODO: Implementez IsString<T> — retourne true si T est un string, false sinon
// type IsString<T> = ???
type IsString<T> = any; // <-- Remplacez

// TODO: Implementez IsArray<T> — retourne true si T est un tableau, false sinon
// type IsArray<T> = ???
type IsArray<T> = any; // <-- Remplacez

// TODO: Implementez Flatten<T> — si T est un tableau, extrait le type des elements
// Flatten<string[]> = string
// Flatten<number[][]> = number[] (un seul niveau)
// Flatten<string> = string (pas un tableau, retourne tel quel)
//
// Indice : utilisez infer pour extraire le type des elements
// type Flatten<T> = ???
type Flatten<T> = any; // <-- Remplacez

// TODO: Implementez UnpackPromise<T> — extrait le type contenu dans une Promise
// UnpackPromise<Promise<string>> = string
// UnpackPromise<Promise<Promise<number>>> = Promise<number> (un seul niveau)
// UnpackPromise<number> = number (pas une Promise, retourne tel quel)
//
// type UnpackPromise<T> = ???
type UnpackPromise<T> = any; // <-- Remplacez

// TODO: Implementez DeepUnpackPromise<T> — extrait recursivement le type des Promises
// DeepUnpackPromise<Promise<Promise<string>>> = string
// DeepUnpackPromise<number> = number
//
// type DeepUnpackPromise<T> = ???
type DeepUnpackPromise<T> = any; // <-- Remplacez

// Fonctions de verification a l'execution
function flatten<T>(value: T): Flatten<T> {
  // TODO: Si value est un tableau, retournez le premier element
  // Sinon retournez value tel quel
  if (Array.isArray(value)) {
    return value[0] as any;
  }
  return value as any;
}

async function unpackPromise<T>(value: T): Promise<UnpackPromise<T>> {
  // TODO: Si value est une Promise, awaiter et retourner le resultat
  // Sinon retourner value tel quel
  if (value instanceof Promise) {
    return (await value) as any;
  }
  return value as any;
}

// =============================================================================
// Exercice 2 : Egalite et types avances
// Implementez des types plus sophistiques.
// =============================================================================

// TODO: Implementez IsNever<T> — retourne true si T est never, false sinon
// Attention : never est distribue dans les conditional types !
// Un simple T extends never ne fonctionne pas comme attendu.
// Indice : wrappez T dans un tuple [T] extends [never]
//
// type IsNever<T> = ???
type IsNever<T> = any; // <-- Remplacez

// TODO: Implementez IsUnion<T> — retourne true si T est un type union
// Indice : comparez T avec la distribution de T
// Un truc : si T se distribue differemment de [T], c'est une union
//
// type IsUnion<T, Copy = T> = ???
type IsUnion<T, Copy = T> = any; // <-- Remplacez

// TODO: Implementez ToArray<T> — convertit T en T[] si ce n'est pas deja un tableau
// Si T est deja un tableau, le retourne tel quel
// ToArray<string> = string[]
// ToArray<number[]> = number[]
//
// type ToArray<T> = ???
type ToArray<T> = any; // <-- Remplacez

// TODO: Implementez NonDistributive<T> — wrappez T pour empecher la distribution
// et verifiez que le type est un string OU number (pas distribue)
// NonDistributive<string | number> devrait etre true car (string | number) extends (string | number)
// En mode distributif, on obtiendrait true | true = true aussi, mais la difference
// apparait avec des cas plus subtils.
//
// On va tester avec un cas concret :
// type WrapInArray<T> = T extends any ? T[] : never;
// -> WrapInArray<string | number> = string[] | number[] (distribue)
//
// type WrapInArrayNonDist<T> = [T] extends [any] ? T[] : never;
// -> WrapInArrayNonDist<string | number> = (string | number)[] (non distribue)

// TODO: Implementez WrapInArray (distributif)
// type WrapInArray<T> = ???
type WrapInArray<T> = any; // <-- Remplacez

// TODO: Implementez WrapInArrayNonDist (non distributif)
// type WrapInArrayNonDist<T> = ???
type WrapInArrayNonDist<T> = any; // <-- Remplacez

// =============================================================================
// Exercice 3 : Types conditionnels pratiques
// Implementez des types utilitaires avances.
// =============================================================================

// TODO: Implementez ReturnTypeOf<T> — extrait le type de retour d'une fonction
// Equivalent de ReturnType<T> natif
// ReturnTypeOf<() => string> = string
// ReturnTypeOf<(x: number) => boolean> = boolean
//
// type ReturnTypeOf<T> = ???
type ReturnTypeOf<T> = any; // <-- Remplacez

// TODO: Implementez ParametersOf<T> — extrait les types des parametres en tuple
// Equivalent de Parameters<T> natif
// ParametersOf<(a: string, b: number) => void> = [string, number]
//
// type ParametersOf<T> = ???
type ParametersOf<T> = any; // <-- Remplacez

// TODO: Implementez FirstParameter<T> — extrait le type du premier parametre
// FirstParameter<(a: string, b: number) => void> = string
// FirstParameter<() => void> = never (pas de parametre)
//
// type FirstParameter<T> = ???
type FirstParameter<T> = any; // <-- Remplacez

// TODO: Implementez PromisifyFunction<T> — transforme une fonction pour qu'elle
// retourne une Promise de son type de retour original
// PromisifyFunction<(x: number) => string> = (x: number) => Promise<string>
//
// type PromisifyFunction<T> = ???
type PromisifyFunction<T> = any; // <-- Remplacez

// TODO: Implementez PromisifyAll<T> — applique PromisifyFunction a toutes les
// methodes d'un objet
// PromisifyAll<{ foo(): string; bar(x: number): boolean }>
//   = { foo(): Promise<string>; bar(x: number): Promise<boolean> }
//
// type PromisifyAll<T> = ???
type PromisifyAll<T> = any; // <-- Remplacez

// Fonctions de test a l'execution
function getReturnType<T extends (...args: any[]) => any>(fn: T): ReturnTypeOf<T> {
  // TODO: Appelez la fonction sans arguments et retournez le resultat
  // (pour les tests, on passe des fonctions sans parametres)
  return fn() as any;
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 11 — Conditional Types\n');

  // --- Exercice 1 : Types conditionnels de base ---
  await test('Ex1 — IsString detecte les strings', () => {
    type T1 = Expect<Equal<IsString<string>, true>>;
    type T2 = Expect<Equal<IsString<number>, false>>;
    type T3 = Expect<Equal<IsString<'hello'>, true>>;
    assert(true, 'IsString compile correctement');
  });

  await test('Ex1 — IsArray detecte les tableaux', () => {
    type T1 = Expect<Equal<IsArray<string[]>, true>>;
    type T2 = Expect<Equal<IsArray<number>, false>>;
    type T3 = Expect<Equal<IsArray<[1, 2, 3]>, true>>;
    assert(true, 'IsArray compile correctement');
  });

  await test('Ex1 — Flatten extrait le type des elements', () => {
    type T1 = Expect<Equal<Flatten<string[]>, string>>;
    type T2 = Expect<Equal<Flatten<number[][]>, number[]>>;
    type T3 = Expect<Equal<Flatten<string>, string>>;
    assert(true, 'Flatten compile correctement');
  });

  await test('Ex1 — Flatten fonctionne a l\'execution', () => {
    assertEqual(flatten([1, 2, 3]), 1);
    assertEqual(flatten('hello'), 'hello');
    assertEqual(flatten([true, false]), true);
  });

  await test('Ex1 — UnpackPromise extrait le type de la Promise', () => {
    type T1 = Expect<Equal<UnpackPromise<Promise<string>>, string>>;
    type T2 = Expect<Equal<UnpackPromise<Promise<number>>, number>>;
    type T3 = Expect<Equal<UnpackPromise<number>, number>>;
    assert(true, 'UnpackPromise compile correctement');
  });

  await test('Ex1 — UnpackPromise fonctionne a l\'execution', async () => {
    const result1 = await unpackPromise(Promise.resolve('hello'));
    assertEqual(result1, 'hello');
    const result2 = await unpackPromise(42);
    assertEqual(result2, 42);
  });

  await test('Ex1 — DeepUnpackPromise deballe recursivement', () => {
    type T1 = Expect<Equal<DeepUnpackPromise<Promise<Promise<string>>>, string>>;
    type T2 = Expect<Equal<DeepUnpackPromise<Promise<number>>, number>>;
    type T3 = Expect<Equal<DeepUnpackPromise<boolean>, boolean>>;
    assert(true, 'DeepUnpackPromise compile correctement');
  });

  // --- Exercice 2 : Egalite et types avances ---
  await test('Ex2 — IsNever detecte never', () => {
    type T1 = Expect<Equal<IsNever<never>, true>>;
    type T2 = Expect<Equal<IsNever<string>, false>>;
    type T3 = Expect<Equal<IsNever<undefined>, false>>;
    type T4 = Expect<Equal<IsNever<null>, false>>;
    assert(true, 'IsNever compile correctement');
  });

  await test('Ex2 — IsUnion detecte les unions', () => {
    type T1 = Expect<Equal<IsUnion<string | number>, true>>;
    type T2 = Expect<Equal<IsUnion<string>, false>>;
    type T3 = Expect<Equal<IsUnion<'a' | 'b' | 'c'>, true>>;
    assert(true, 'IsUnion compile correctement');
  });

  await test('Ex2 — ToArray convertit en tableau si necessaire', () => {
    type T1 = Expect<Equal<ToArray<string>, string[]>>;
    type T2 = Expect<Equal<ToArray<number[]>, number[]>>;
    type T3 = Expect<Equal<ToArray<boolean>, boolean[]>>;
    assert(true, 'ToArray compile correctement');
  });

  await test('Ex2 — Distribution vs non-distribution', () => {
    // Distributif : string | number -> string[] | number[]
    type T1 = Expect<Equal<WrapInArray<string | number>, string[] | number[]>>;
    // Non distributif : string | number -> (string | number)[]
    type T2 = Expect<Equal<WrapInArrayNonDist<string | number>, (string | number)[]>>;
    assert(true, 'Distribution compile correctement');
  });

  // --- Exercice 3 : Types conditionnels pratiques ---
  await test('Ex3 — ReturnTypeOf extrait le type de retour', () => {
    type T1 = Expect<Equal<ReturnTypeOf<() => string>, string>>;
    type T2 = Expect<Equal<ReturnTypeOf<(x: number) => boolean>, boolean>>;
    type T3 = Expect<Equal<ReturnTypeOf<() => void>, void>>;
    assert(true, 'ReturnTypeOf compile correctement');
  });

  await test('Ex3 — ReturnTypeOf fonctionne a l\'execution', () => {
    const result1 = getReturnType(() => 'hello');
    assertEqual(result1, 'hello');
    const result2 = getReturnType(() => 42);
    assertEqual(result2, 42);
  });

  await test('Ex3 — ParametersOf extrait les parametres', () => {
    type T1 = Expect<Equal<ParametersOf<(a: string, b: number) => void>, [a: string, b: number]>>;
    type T2 = Expect<Equal<ParametersOf<() => void>, []>>;
    assert(true, 'ParametersOf compile correctement');
  });

  await test('Ex3 — FirstParameter extrait le premier parametre', () => {
    type T1 = Expect<Equal<FirstParameter<(a: string, b: number) => void>, string>>;
    type T2 = Expect<Equal<FirstParameter<(x: boolean) => void>, boolean>>;
    type T3 = Expect<Equal<FirstParameter<() => void>, never>>;
    assert(true, 'FirstParameter compile correctement');
  });

  await test('Ex3 — PromisifyFunction transforme le retour en Promise', () => {
    type T1 = Expect<Equal<PromisifyFunction<(x: number) => string>, (x: number) => Promise<string>>>;
    type T2 = Expect<Equal<PromisifyFunction<() => boolean>, () => Promise<boolean>>>;
    assert(true, 'PromisifyFunction compile correctement');
  });

  await test('Ex3 — PromisifyAll transforme toutes les methodes', () => {
    interface Original {
      greet(name: string): string;
      add(a: number, b: number): number;
    }
    type Promisified = PromisifyAll<Original>;
    type T1 = Expect<Equal<Promisified['greet'], (name: string) => Promise<string>>>;
    type T2 = Expect<Equal<Promisified['add'], (a: number, b: number) => Promise<number>>>;
    assert(true, 'PromisifyAll compile correctement');
  });

  summary();
}

main();
