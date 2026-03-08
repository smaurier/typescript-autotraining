// =============================================================================
// Lab 07 — Generics avances (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 07 — Generics avances');

// =============================================================================
// Exercice 1 : Builder pattern type-safe
// =============================================================================

interface User {
  name: string;
  email: string;
  age?: number;
}

// Types marqueurs pour tracker les champs renseignes
type HasName = { __hasName: true };
type HasEmail = { __hasEmail: true };

class UserBuilder<State = {}> {
  private data: Partial<User> = {};

  setName(name: string): UserBuilder<State & HasName> {
    this.data.name = name;
    return this as unknown as UserBuilder<State & HasName>;
  }

  setEmail(email: string): UserBuilder<State & HasEmail> {
    this.data.email = email;
    return this as unknown as UserBuilder<State & HasEmail>;
  }

  setAge(age: number): UserBuilder<State> {
    this.data.age = age;
    return this;
  }

  // build() n'est disponible que quand State contient HasName & HasEmail
  build(this: UserBuilder<HasName & HasEmail>): User {
    const self = this as unknown as UserBuilder<State>;
    const data = (self as any).data as Partial<User>;
    return {
      name: data.name!,
      email: data.email!,
      age: data.age,
    };
  }
}

// =============================================================================
// Exercice 2 : Branded types
// =============================================================================

// Type utilitaire pour creer des types brandes
type Brand<T, B extends string> = T & { __brand: B };

// Types brandes pour les devises
type USD = Brand<number, 'USD'>;
type EUR = Brand<number, 'EUR'>;

function usd(amount: number): USD {
  return amount as USD;
}

function eur(amount: number): EUR {
  return amount as EUR;
}

function addUSD(a: USD, b: USD): USD {
  return ((a as number) + (b as number)) as USD;
}

function addEUR(a: EUR, b: EUR): EUR {
  return ((a as number) + (b as number)) as EUR;
}

function eurToUsd(amount: EUR, rate: number): USD {
  return ((amount as number) * rate) as USD;
}

// =============================================================================
// Exercice 3 : Variadic tuples
// =============================================================================

// Concat : fusionne deux tuples en un seul
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];

function concat<A extends unknown[], B extends unknown[]>(
  a: [...A],
  b: [...B]
): Concat<A, B> {
  return [...a, ...b] as Concat<A, B>;
}

// Head : premier element d'un tuple
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;

// Tail : tous les elements sauf le premier
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;

function head<T extends [unknown, ...unknown[]]>(tuple: T): Head<T> {
  return tuple[0] as Head<T>;
}

function tail<T extends [unknown, ...unknown[]]>(tuple: T): Tail<T> {
  const [, ...rest] = tuple;
  return rest as Tail<T>;
}

// Last : dernier element d'un tuple
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

function last<T extends [...unknown[], unknown]>(tuple: T): Last<T> {
  return tuple[tuple.length - 1] as Last<T>;
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 07 — Generics avances\n');

  // --- Exercice 1 : Builder pattern ---
  await test('Ex1 — Builder avec tous les champs obligatoires', () => {
    const user = new UserBuilder()
      .setName('Alice')
      .setEmail('alice@example.com')
      .build();
    assertEqual(user.name, 'Alice');
    assertEqual(user.email, 'alice@example.com');
  });

  await test('Ex1 — Builder avec champ optionnel age', () => {
    const user = new UserBuilder()
      .setName('Bob')
      .setEmail('bob@example.com')
      .setAge(25)
      .build();
    assertEqual(user.name, 'Bob');
    assertEqual(user.email, 'bob@example.com');
    assertEqual(user.age, 25);
  });

  await test('Ex1 — Builder dans un ordre different', () => {
    const user = new UserBuilder()
      .setEmail('charlie@example.com')
      .setName('Charlie')
      .build();
    assertEqual(user.name, 'Charlie');
    assertEqual(user.email, 'charlie@example.com');
  });

  // --- Exercice 2 : Branded types ---
  await test('Ex2 — Creation de USD et EUR', () => {
    const dollars = usd(100);
    const euros = eur(85);
    assertEqual(dollars as number, 100);
    assertEqual(euros as number, 85);
  });

  await test('Ex2 — Addition de memes devises', () => {
    const total = addUSD(usd(50), usd(30));
    assertEqual(total as number, 80);
    const totalEur = addEUR(eur(40), eur(20));
    assertEqual(totalEur as number, 60);
  });

  await test('Ex2 — Conversion EUR vers USD', () => {
    const euros = eur(100);
    const dollars = eurToUsd(euros, 1.1);
    assertEqual(dollars as number, 110);
  });

  // --- Exercice 3 : Variadic tuples ---
  await test('Ex3 — Concat de deux tuples', () => {
    const result = concat([1, 2] as [number, number], ['a', 'b'] as [string, string]);
    assertDeepEqual(result, [1, 2, 'a', 'b']);
  });

  await test('Ex3 — Concat avec tuple vide', () => {
    const result = concat([] as [], [1, 2, 3] as [number, number, number]);
    assertDeepEqual(result, [1, 2, 3]);
  });

  await test('Ex3 — Head du tuple', () => {
    const result = head([1, 'deux', true] as [number, string, boolean]);
    assertEqual(result, 1);
  });

  await test('Ex3 — Tail du tuple', () => {
    const result = tail([1, 'deux', true] as [number, string, boolean]);
    assertDeepEqual(result, ['deux', true]);
  });

  await test('Ex3 — Last du tuple', () => {
    const result = last([1, 'deux', true] as [number, string, boolean]);
    assertEqual(result, true);
  });

  await test('Ex3 — Concat preserv le typage', () => {
    const result = concat(['hello'] as [string], [42] as [number]);
    assertDeepEqual(result, ['hello', 42]);
  });

  summary();
}

main();
