// =============================================================================
// Lab 11 — Conditional Types (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertType, summary } = createTestRunner('Lab 11 — Conditional Types');

// =============================================================================
// Helper : Assertion de type compile-time
// =============================================================================

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// =============================================================================
// Exercice 1 : Types conditionnels de base
// =============================================================================

// Retourne true si T est un string
type IsString<T> = T extends string ? true : false;

// Retourne true si T est un tableau
type IsArray<T> = T extends unknown[] ? true : false;

// Extrait le type des elements d'un tableau (un seul niveau)
type Flatten<T> = T extends (infer U)[] ? U : T;

// Extrait le type contenu dans une Promise (un seul niveau)
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

// Extrait recursivement le type des Promises imbriquees
type DeepUnpackPromise<T> = T extends Promise<infer U> ? DeepUnpackPromise<U> : T;

function flatten<T>(value: T): Flatten<T> {
  if (Array.isArray(value)) {
    return value[0] as Flatten<T>;
  }
  return value as Flatten<T>;
}

async function unpackPromise<T>(value: T): Promise<UnpackPromise<T>> {
  if (value instanceof Promise) {
    return (await value) as UnpackPromise<T>;
  }
  return value as UnpackPromise<T>;
}

// =============================================================================
// Exercice 2 : Egalite et types avances
// =============================================================================

// Detecte never (attention a la distribution)
type IsNever<T> = [T] extends [never] ? true : false;

// Detecte les unions
// Astuce : on compare T (distribue) avec Copy (non distribue via [])
type IsUnion<T, Copy = T> =
  [T] extends [never]
    ? false
    : T extends Copy
      ? [Copy] extends [T]
        ? false
        : true
      : false;

// Convertit en tableau si ce n'est pas deja un tableau
type ToArray<T> = T extends unknown[] ? T : T[];

// Distributif : distribue sur les unions
type WrapInArray<T> = T extends any ? T[] : never;

// Non distributif : wrappe le type entier
type WrapInArrayNonDist<T> = [T] extends [any] ? T[] : never;

// =============================================================================
// Exercice 3 : Types conditionnels pratiques
// =============================================================================

// Extrait le type de retour d'une fonction
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

// Extrait les types des parametres en tuple
type ParametersOf<T> = T extends (...args: infer P) => any ? P : never;

// Extrait le type du premier parametre
type FirstParameter<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

// Transforme le type de retour d'une fonction en Promise
type PromisifyFunction<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

// Applique PromisifyFunction a toutes les methodes d'un objet
type PromisifyAll<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? PromisifyFunction<T[K]> : T[K];
};

function getReturnType<T extends (...args: any[]) => any>(fn: T): ReturnTypeOf<T> {
  return fn() as ReturnTypeOf<T>;
}

// =============================================================================
// Tests
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
    type T1 = Expect<Equal<WrapInArray<string | number>, string[] | number[]>>;
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
