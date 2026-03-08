// =============================================================================
// Lab 13 — Programmation au niveau des types (SOLUTION)
// =============================================================================
// Objectifs :
//   - Recursion au niveau des types
//   - Arithmetique via tuples
//   - Parseur de chaines type-level
//   - Types d'arbres recursifs
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 13 — Programmation au niveau des types');

// =============================================================================
// Exercice 1 : Length<T>
// =============================================================================

type Length<T extends readonly unknown[]> = T['length'];

type _L0 = Length<[]>;           // 0
type _L3 = Length<[1, 2, 3]>;   // 3
type _L5 = Length<[string, number, boolean, null, undefined]>; // 5

// =============================================================================
// Exercice 2 : BuildTuple<N>
// =============================================================================

type BuildTuple<N extends number, Acc extends unknown[] = []> =
  Acc['length'] extends N
    ? Acc
    : BuildTuple<N, [...Acc, unknown]>;

type _BT0 = BuildTuple<0>;  // []
type _BT3 = BuildTuple<3>;  // [unknown, unknown, unknown]

// =============================================================================
// Exercice 3 : Add<A, B>
// =============================================================================

type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]['length'] extends infer R extends number
    ? R
    : never;

type _A1 = Add<2, 3>;    // 5
type _A2 = Add<0, 0>;    // 0
type _A3 = Add<10, 7>;   // 17

// =============================================================================
// Exercice 4 : Subtract<A, B>
// =============================================================================

type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest]
    ? Rest['length']
    : never;

type _S1 = Subtract<5, 3>;   // 2
type _S2 = Subtract<10, 0>;  // 10
type _S3 = Subtract<7, 7>;   // 0

// =============================================================================
// Exercice 5 : ParseSingleDigit<S>
// =============================================================================

type DigitMap = {
  '0': [];
  '1': [1];
  '2': [1, 1];
  '3': [1, 1, 1];
  '4': [1, 1, 1, 1];
  '5': [1, 1, 1, 1, 1];
  '6': [1, 1, 1, 1, 1, 1];
  '7': [1, 1, 1, 1, 1, 1, 1];
  '8': [1, 1, 1, 1, 1, 1, 1, 1];
  '9': [1, 1, 1, 1, 1, 1, 1, 1, 1];
};
type Digit = keyof DigitMap;

type ParseSingleDigit<S extends string> =
  S extends Digit
    ? DigitMap[S]['length']
    : never;

type _P1 = ParseSingleDigit<'0'>; // 0
type _P2 = ParseSingleDigit<'5'>; // 5
type _P3 = ParseSingleDigit<'9'>; // 9

// =============================================================================
// Exercice 6 : Split<S, Sep>
// =============================================================================

type Split<S extends string, Sep extends string> =
  S extends `${infer Head}${Sep}${infer Tail}`
    ? [Head, ...Split<Tail, Sep>]
    : S extends ''
      ? []
      : [S];

type _SP1 = Split<'a-b-c', '-'>;     // ['a', 'b', 'c']
type _SP2 = Split<'hello', ''>;       // ['h', 'e', 'l', 'l', 'o']
type _SP3 = Split<'one', '-'>;        // ['one']

// =============================================================================
// Exercice 7 : TreeNode et Depth
// =============================================================================

type TreeNode<T> = {
  value: T;
  left: TreeNode<T> | null;
  right: TreeNode<T> | null;
};

type Leaf<T> = {
  value: T;
  left: null;
  right: null;
};

function depth<T>(node: TreeNode<T> | null): number {
  if (node === null) return 0;
  return 1 + Math.max(depth(node.left), depth(node.right));
}

function flatten<T>(node: TreeNode<T> | null): T[] {
  if (node === null) return [];
  return [...flatten(node.left), node.value, ...flatten(node.right)];
}

function mapTree<T, U>(node: TreeNode<T> | null, fn: (value: T) => U): TreeNode<U> | null {
  if (node === null) return null;
  return {
    value: fn(node.value),
    left: mapTree(node.left, fn),
    right: mapTree(node.right, fn),
  };
}

// =============================================================================
// Exercice 8 : IsEqual (donne)
// =============================================================================

type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

type Assert<T extends true> = T;

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 13 — Programmation au niveau des types\n');

  // --- Tests Length ---
  await test('Length<[]> devrait etre 0', () => {
    type R = Assert<IsEqual<Length<[]>, 0>>;
    const len: Length<[]> = 0 as never;
    void len;
    assert(true);
  });

  await test('Length<[1,2,3]> devrait etre 3', () => {
    type R = Assert<IsEqual<Length<[1, 2, 3]>, 3>>;
    assert(true);
  });

  await test('Length<[string, number, boolean, null, undefined]> devrait etre 5', () => {
    type R = Assert<IsEqual<Length<[string, number, boolean, null, undefined]>, 5>>;
    assert(true);
  });

  // --- Tests BuildTuple ---
  await test('BuildTuple<0> devrait etre []', () => {
    type R = Assert<IsEqual<BuildTuple<0>, []>>;
    assert(true);
  });

  await test('BuildTuple<3> devrait etre [unknown, unknown, unknown]', () => {
    type R = Assert<IsEqual<BuildTuple<3>, [unknown, unknown, unknown]>>;
    assert(true);
  });

  // --- Tests Add ---
  await test('Add<2, 3> devrait etre 5', () => {
    type R = Assert<IsEqual<Add<2, 3>, 5>>;
    assert(true);
  });

  await test('Add<0, 0> devrait etre 0', () => {
    type R = Assert<IsEqual<Add<0, 0>, 0>>;
    assert(true);
  });

  await test('Add<10, 7> devrait etre 17', () => {
    type R = Assert<IsEqual<Add<10, 7>, 17>>;
    assert(true);
  });

  // --- Tests Subtract ---
  await test('Subtract<5, 3> devrait etre 2', () => {
    type R = Assert<IsEqual<Subtract<5, 3>, 2>>;
    assert(true);
  });

  await test('Subtract<10, 0> devrait etre 10', () => {
    type R = Assert<IsEqual<Subtract<10, 0>, 10>>;
    assert(true);
  });

  await test('Subtract<7, 7> devrait etre 0', () => {
    type R = Assert<IsEqual<Subtract<7, 7>, 0>>;
    assert(true);
  });

  // --- Tests ParseSingleDigit ---
  await test('ParseSingleDigit<"0"> devrait etre 0', () => {
    type R = Assert<IsEqual<ParseSingleDigit<'0'>, 0>>;
    assert(true);
  });

  await test('ParseSingleDigit<"5"> devrait etre 5', () => {
    type R = Assert<IsEqual<ParseSingleDigit<'5'>, 5>>;
    assert(true);
  });

  await test('ParseSingleDigit<"9"> devrait etre 9', () => {
    type R = Assert<IsEqual<ParseSingleDigit<'9'>, 9>>;
    assert(true);
  });

  // --- Tests Split ---
  await test('Split<"a-b-c", "-"> devrait etre ["a", "b", "c"]', () => {
    type R = Assert<IsEqual<Split<'a-b-c', '-'>, ['a', 'b', 'c']>>;
    assert(true);
  });

  await test('Split<"one", "-"> devrait etre ["one"]', () => {
    type R = Assert<IsEqual<Split<'one', '-'>, ['one']>>;
    assert(true);
  });

  // --- Tests TreeNode (runtime) ---
  await test('depth d\'une feuille devrait etre 1', () => {
    const leaf: TreeNode<number> = { value: 1, left: null, right: null };
    assertEqual(depth(leaf), 1);
  });

  await test('depth d\'un arbre a 3 niveaux', () => {
    const tree: TreeNode<number> = {
      value: 1,
      left: {
        value: 2,
        left: { value: 4, left: null, right: null },
        right: null,
      },
      right: {
        value: 3,
        left: null,
        right: null,
      },
    };
    assertEqual(depth(tree), 3);
  });

  await test('depth(null) devrait etre 0', () => {
    assertEqual(depth(null), 0);
  });

  await test('flatten devrait retourner un parcours in-order', () => {
    const tree: TreeNode<number> = {
      value: 2,
      left: { value: 1, left: null, right: null },
      right: { value: 3, left: null, right: null },
    };
    assertDeepEqual(flatten(tree), [1, 2, 3]);
  });

  await test('flatten d\'un arbre plus complexe', () => {
    const tree: TreeNode<number> = {
      value: 4,
      left: {
        value: 2,
        left: { value: 1, left: null, right: null },
        right: { value: 3, left: null, right: null },
      },
      right: {
        value: 6,
        left: { value: 5, left: null, right: null },
        right: { value: 7, left: null, right: null },
      },
    };
    assertDeepEqual(flatten(tree), [1, 2, 3, 4, 5, 6, 7]);
  });

  await test('mapTree devrait transformer chaque valeur', () => {
    const tree: TreeNode<number> = {
      value: 2,
      left: { value: 1, left: null, right: null },
      right: { value: 3, left: null, right: null },
    };
    const doubled = mapTree(tree, (v) => v * 2);
    assertDeepEqual(flatten(doubled), [2, 4, 6]);
  });

  await test('mapTree(null) devrait retourner null', () => {
    const result = mapTree(null, (v: number) => v * 2);
    assertEqual(result, null);
  });

  summary();
}

main();
