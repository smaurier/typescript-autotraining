// =============================================================================
// Lab 07 — Generics avances
// =============================================================================
// Objectifs :
//   - Builder pattern type-safe avec generics
//   - Branded types (types nominaux)
//   - Variadic tuples
// =============================================================================

import { createTestRunner } from "../test-utils.ts";
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } =
  createTestRunner("Lab 07 — Generics avances");

// =============================================================================
// Exercice 1 : Builder pattern type-safe
// Creez un builder pour construire un objet User.
// Le builder doit garantir au niveau du TYPE que les champs obligatoires
// (name et email) sont renseignes avant de pouvoir appeler build().
//
// Astuce : utilisez un parametre de type generique pour tracker quels
// champs ont ete definis, et rendez build() disponible uniquement quand
// tous les champs requis sont presents.
// =============================================================================

interface User {
  name: string;
  email: string;
  age?: number;
}

// TODO: Definissez un type HasName et HasEmail pour tracker les champs renseignes
// Exemple : type HasName = { __hasName: true };
// type HasName = ???
// type HasEmail = ???

type HasName = { hasName: true };
type HasEmail = { hasEmail: true };

// TODO: Implementez la classe UserBuilder<State>
// - setName(name: string) doit retourner un builder avec HasName dans le state
// - setEmail(email: string) doit retourner un builder avec HasEmail dans le state
// - setAge(age: number) doit retourner le builder (optionnel, pas dans le state)
// - build() doit etre disponible UNIQUEMENT quand State extends HasName & HasEmail
//
// class UserBuilder<State = {}> {
//   private data: Partial<User> = {};
//
//   setName(name: string): UserBuilder<State & ???> {
//     // TODO
//   }
//
//   setEmail(email: string): UserBuilder<State & ???> {
//     // TODO
//   }
//
//   setAge(age: number): UserBuilder<State> {
//     // TODO
//   }
//
//   // TODO: build() ne doit etre appelable que si State extends HasName & HasEmail
//   build(this: UserBuilder<HasName & HasEmail & Record<string, unknown>>): User {
//     // TODO
//   }
// }
class UserBuilder<State = {}> {
  private data: Partial<User> = {};

  setName(_name: string): any {
    // TODO: Implementez setName
    return this;
  }

  setEmail(_email: string): any {
    // TODO: Implementez setEmail
    return this;
  }

  setAge(_age: number): any {
    // TODO: Implementez setAge
    return this;
  }

  build(): User {
    // TODO: Implementez build (doit retourner un User complet)
    return {} as User;
  }
}

// =============================================================================
// Exercice 2 : Branded types
// Creez des types "brandes" pour USD et EUR afin d'empecher le melange
// accidentel de devises dans les calculs.
//
// Un branded type utilise un champ fictif (symbol ou string unique)
// pour rendre deux types structurellement incompatibles.
// =============================================================================

// TODO: Definissez un type Brand<T, B> qui ajoute un champ __brand a T
// type Brand<T, B extends string> = ???

// TODO: Definissez les types USD et EUR comme des nombres brandes
// type USD = ???
// type EUR = ???
type USD = number; // <-- Remplacez par le bon type brande
type EUR = number; // <-- Remplacez par le bon type brande

// TODO: Implementez les fonctions de creation qui "marquent" les valeurs
function usd(amount: number): USD {
  // TODO: Retournez le montant avec le brand USD
  return amount as any;
}

function eur(amount: number): EUR {
  // TODO: Retournez le montant avec le brand EUR
  return amount as any;
}

// TODO: Implementez addUSD qui n'accepte QUE des USD
function addUSD(a: USD, b: USD): USD {
  // TODO: Additionnez deux montants USD
  return 0 as any;
}

// TODO: Implementez addEUR qui n'accepte QUE des EUR
function addEUR(a: EUR, b: EUR): EUR {
  // TODO: Additionnez deux montants EUR
  return 0 as any;
}

// TODO: Implementez une fonction de conversion
function eurToUsd(amount: EUR, rate: number): USD {
  // TODO: Convertissez EUR en USD avec le taux donne
  return 0 as any;
}

// =============================================================================
// Exercice 3 : Variadic tuples
// Implementez des operations type-safe sur les tuples en utilisant
// les variadic tuple types de TypeScript 4.0+
// =============================================================================

// TODO: Implementez un type Concat<A, B> qui concatene deux tuples
// type Concat<A extends unknown[], B extends unknown[]> = ???
type Concat<A extends unknown[], B extends unknown[]> = unknown[]; // <-- Remplacez

// TODO: Implementez une fonction concat qui concatene deux tuples
// avec le typage precis du resultat
function concat<A extends unknown[], B extends unknown[]>(
  a: [...A],
  b: [...B],
): Concat<A, B> {
  // TODO: Retournez la concatenation des deux tuples
  return [] as any;
}

// TODO: Implementez un type Head<T> qui extrait le premier element d'un tuple
// type Head<T extends unknown[]> = ???
type Head<T extends unknown[]> = unknown; // <-- Remplacez

// TODO: Implementez un type Tail<T> qui extrait tous les elements sauf le premier
// type Tail<T extends unknown[]> = ???
type Tail<T extends unknown[]> = unknown[]; // <-- Remplacez

// TODO: Implementez une fonction head qui retourne le premier element
function head<T extends [unknown, ...unknown[]]>(tuple: T): Head<T> {
  // TODO
  return undefined as any;
}

// TODO: Implementez une fonction tail qui retourne le reste du tuple
function tail<T extends [unknown, ...unknown[]]>(tuple: T): Tail<T> {
  // TODO
  return [] as any;
}

// TODO: Implementez un type Last<T> qui extrait le dernier element d'un tuple
// type Last<T extends unknown[]> = ???
type Last<T extends unknown[]> = unknown; // <-- Remplacez

// TODO: Implementez une fonction last
function last<T extends [...unknown[], unknown]>(tuple: T): Last<T> {
  // TODO
  return undefined as any;
}

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log("\n🧪 Lab 07 — Generics avances\n");

  // --- Exercice 1 : Builder pattern ---
  await test("Ex1 — Builder avec tous les champs obligatoires", () => {
    const user = new UserBuilder()
      .setName("Alice")
      .setEmail("alice@example.com")
      .build();
    assertEqual(user.name, "Alice");
    assertEqual(user.email, "alice@example.com");
  });

  await test("Ex1 — Builder avec champ optionnel age", () => {
    const user = new UserBuilder()
      .setName("Bob")
      .setEmail("bob@example.com")
      .setAge(25)
      .build();
    assertEqual(user.name, "Bob");
    assertEqual(user.email, "bob@example.com");
    assertEqual(user.age, 25);
  });

  await test("Ex1 — Builder dans un ordre different", () => {
    const user = new UserBuilder()
      .setEmail("charlie@example.com")
      .setName("Charlie")
      .build();
    assertEqual(user.name, "Charlie");
    assertEqual(user.email, "charlie@example.com");
  });

  // --- Exercice 2 : Branded types ---
  await test("Ex2 — Creation de USD et EUR", () => {
    const dollars = usd(100);
    const euros = eur(85);
    assertEqual(dollars as number, 100);
    assertEqual(euros as number, 85);
  });

  await test("Ex2 — Addition de memes devises", () => {
    const total = addUSD(usd(50), usd(30));
    assertEqual(total as number, 80);
    const totalEur = addEUR(eur(40), eur(20));
    assertEqual(totalEur as number, 60);
  });

  await test("Ex2 — Conversion EUR vers USD", () => {
    const euros = eur(100);
    const dollars = eurToUsd(euros, 1.1);
    assertEqual(dollars as number, 110);
  });

  // --- Exercice 3 : Variadic tuples ---
  await test("Ex3 — Concat de deux tuples", () => {
    const result = concat(
      [1, 2] as [number, number],
      ["a", "b"] as [string, string],
    );
    assertDeepEqual(result, [1, 2, "a", "b"]);
  });

  await test("Ex3 — Concat avec tuple vide", () => {
    const result = concat([] as [], [1, 2, 3] as [number, number, number]);
    assertDeepEqual(result, [1, 2, 3]);
  });

  await test("Ex3 — Head du tuple", () => {
    const result = head([1, "deux", true] as [number, string, boolean]);
    assertEqual(result, 1);
  });

  await test("Ex3 — Tail du tuple", () => {
    const result = tail([1, "deux", true] as [number, string, boolean]);
    assertDeepEqual(result, ["deux", true]);
  });

  await test("Ex3 — Last du tuple", () => {
    const result = last([1, "deux", true] as [number, string, boolean]);
    assertEqual(result, true);
  });

  await test("Ex3 — Concat preserv le typage", () => {
    const result = concat(["hello"] as [string], [42] as [number]);
    assertDeepEqual(result, ["hello", 42]);
  });

  summary();
}

main();
