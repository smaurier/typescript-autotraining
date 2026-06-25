// =============================================================================
// Lab 10 — Utility Types
// =============================================================================
// Objectifs :
//   - Reimplementer Partial, Required, Readonly, Pick, Omit, Record
//   - Comprendre les mapped types
//   - Combiner les utility types
// =============================================================================

import { createTestRunner } from "../test-utils.ts";
const { test, assert, assertEqual, assertDeepEqual, assertType, summary } =
  createTestRunner("Lab 10 — Utility Types");

// =============================================================================
// Interface de test utilisee dans tous les exercices
// =============================================================================

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  age: number;
  actif: boolean;
}

// =============================================================================
// Exercice 1 : Reimplementation de base (mapped types)
// Reimplementez les utility types natifs en utilisant les mapped types.
// =============================================================================

// TODO: Implementez MyPartial<T> — rend toutes les proprietes optionnelles
// Equivalent de Partial<T>
// Indice : utilisez [K in keyof T]?: T[K]
//
// type MyPartial<T> = ???
type MyPartial<T> = { [K in keyof T]?: T[K] }; // <-- Remplacez

// TODO: Implementez MyRequired<T> — rend toutes les proprietes obligatoires
// Equivalent de Required<T>
// Indice : utilisez le modificateur -? pour retirer l'optionalite
//
// type MyRequired<T> = ???
type MyRequired<T> = { [K in keyof T]-?: T[K] }; // <-- Remplacez

// TODO: Implementez MyReadonly<T> — rend toutes les proprietes readonly
// Equivalent de Readonly<T>
//
// type MyReadonly<T> = ???
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }; // <-- Remplacez

// Fonctions de test pour verifier le comportement a l'execution
function makePartial<T>(obj: T): MyPartial<T> {
  // TODO: Retournez une copie partielle (vide est valide pour Partial)
  return {} as any;
}

function makeRequired<T>(obj: T): MyRequired<T> {
  // TODO: Retournez l'objet type comme Required
  return obj as any;
}

function makeReadonly<T>(obj: T): MyReadonly<T> {
  // TODO: Retournez un objet gele (Object.freeze)
  return Object.freeze(obj) as any;
}

// =============================================================================
// Exercice 2 : Reimplementation avancee
// Types avec des parametres de cles.
// =============================================================================

// TODO: Implementez MyPick<T, K> — extrait un sous-ensemble de proprietes
// Equivalent de Pick<T, K>
// Indice : K doit etre contraint a keyof T
//
// type MyPick<T, K extends keyof T> = ???
type MyPick<T, K extends keyof T> = { [P in K]: T[P] }; // <-- Remplacez

// TODO: Implementez MyOmit<T, K> — retire un sous-ensemble de proprietes
// Equivalent de Omit<T, K>
// Indice : utilisez Exclude pour filtrer les cles, puis un mapped type
//
// type MyOmit<T, K extends keyof T> = ???
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>; // <-- Remplacez

// TODO: Implementez MyRecord<K, V> — cree un type avec les cles K et les valeurs V
// Equivalent de Record<K, V>
//
// type MyRecord<K extends string | number | symbol, V> = ???
type MyRecord<K extends string | number | symbol, V> = { [P in K]: V }; // <-- Remplacez

// TODO: Implementez MyExclude<T, U> — retire les types de T qui sont assignables a U
// Equivalent de Exclude<T, U>
// Indice : utilisez un conditional type distributif
//
// type MyExclude<T, U> = ???
type MyExclude<T, U> = T extends U ? never : T; // <-- Remplacez

// TODO: Implementez MyExtract<T, U> — extrait les types de T qui sont assignables a U
// Equivalent de Extract<T, U>
//
// type MyExtract<T, U> = any; // <-- Remplacez
type MyExtract<T, U> = T extends U ? T : never; // <-- Remplacez

// TODO: Implementez MyNonNullable<T> — retire null et undefined de T
// Equivalent de NonNullable<T>
//
// type MyNonNullable<T> = ???
type MyNonNullable<T> = T & {}; // <-- Remplacez

// Fonctions pour tester Pick et Omit a l'execution
function pickFields<T, K extends keyof T>(obj: T, keys: K[]): MyPick<T, K> {
  // TODO: Retournez un nouvel objet avec uniquement les cles specifiees
  const result = {} as any;
  keys.forEach((key) => (result[key] = obj[key]));
  return result;
}

function omitFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): MyOmit<T, K> {
  // TODO: Retournez un nouvel objet sans les cles specifiees
  const result = { ...obj } as any;
  keys.forEach((key) => delete result[key]);
  return result;
}

// =============================================================================
// Exercice 3 : Combinaisons et usage pratique
// Combinez les utility types pour des cas d'usage reels.
// =============================================================================

// TODO: Creez un type CreateUserInput qui est comme Utilisateur mais :
// - Sans le champ 'id' (genere automatiquement)
// - Avec 'age' et 'actif' optionnels
// Indice : combinez Omit et Partial de maniere creative
//
// type CreateUserInput = ???
type CreateUserInput = Pick<Utilisateur, "id"> &
  Partial<Omit<Utilisateur, "id">>; // <-- Remplacez

// TODO: Creez un type UpdateUserInput qui est comme Utilisateur mais :
// - 'id' est obligatoire (pour identifier l'utilisateur)
// - Tous les autres champs sont optionnels
//
// type UpdateUserInput = ???
type UpdateUserInput = Pick<Utilisateur, "id"> &
  Partial<Omit<Utilisateur, "id">>;

// TODO: Creez un type UserSummary qui ne contient que 'id', 'nom' et 'actif'
//
// type UserSummary = ???
type UserSummary = Pick<Utilisateur, "id" | "nom" | "actif">; // <-- Remplacez

// TODO: Implementez createUser qui prend un CreateUserInput et retourne un Utilisateur
function createUser(input: CreateUserInput): Utilisateur {
  // TODO: Generez un id, et fournissez des valeurs par defaut pour age (0) et actif (true)
  const id = Date.now();
  const age = 0;
  const actif = true;
  return { age, actif, ...input, id } as any;
}

// TODO: Implementez updateUser qui applique une mise a jour partielle
function updateUser(
  current: Utilisateur,
  update: UpdateUserInput,
): Utilisateur {
  // TODO: Fusionnez les champs de update dans current (si id correspond)
  if (current.id === update.id) {
    return { ...current, ...update };
  }
  return { current } as any;
}

// TODO: Implementez toSummary qui extrait un resume d'un Utilisateur
function toSummary(user: Utilisateur): UserSummary {
  // TODO: Retournez uniquement id, nom et actif
  return { id: user.id, nom: user.nom, actif: user.actif } as any;
}

// TODO: Creez un type ReadonlyUser qui est un Utilisateur entierement readonly
type ReadonlyUser = Readonly<Utilisateur>; // <-- Remplacez

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log("\n🧪 Lab 10 — Utility Types\n");

  // --- Exercice 1 : Reimplementation de base ---
  await test("Ex1 — MyPartial rend tout optionnel", () => {
    const partial = makePartial<Utilisateur>({
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    });
    // Un objet vide est un Partial valide
    const empty: MyPartial<Utilisateur> = {};
    assert(true, "MyPartial compile correctement");
  });

  await test("Ex1 — MyRequired rend tout obligatoire", () => {
    interface PartialUser {
      nom?: string;
      email?: string;
    }
    const required: MyRequired<PartialUser> = {
      nom: "Alice",
      email: "a@b.com",
    };
    assertEqual(required.nom, "Alice");
    assertEqual(required.email, "a@b.com");
  });

  await test("Ex1 — MyReadonly gele l'objet", () => {
    const user = {
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    };
    const frozen = makeReadonly(user);
    assertEqual((frozen as any).nom, "Alice");
    // Object.freeze empeche les modifications a l'execution
    try {
      (frozen as any).nom = "Bob";
    } catch {
      // En mode strict, Object.freeze lance une erreur
    }
    assertEqual((frozen as any).nom, "Alice");
  });

  // --- Exercice 2 : Reimplementation avancee ---
  await test("Ex2 — MyPick extrait les bonnes proprietes", () => {
    const user: Utilisateur = {
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    };
    const picked = pickFields(user, ["nom", "email"]);
    assertEqual(picked.nom, "Alice");
    assertEqual(picked.email, "a@b.com");
    assertEqual(Object.keys(picked).length, 2);
  });

  await test("Ex2 — MyOmit retire les bonnes proprietes", () => {
    const user = {
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    } as Record<string, unknown>;
    const omitted = omitFields(user, ["email", "age"]);
    assertEqual(omitted.nom, "Alice");
    assertEqual(Object.keys(omitted).length, 3);
    assert(!("email" in omitted), "email ne doit pas etre present");
    assert(!("age" in omitted), "age ne doit pas etre present");
  });

  await test("Ex2 — MyRecord cree un dictionnaire type", () => {
    type Statut = "actif" | "inactif" | "suspendu";
    const labels: MyRecord<Statut, string> = {
      actif: "Actif",
      inactif: "Inactif",
      suspendu: "Suspendu",
    };
    assertEqual(labels.actif, "Actif");
    assertEqual(labels.suspendu, "Suspendu");
  });

  await test("Ex2 — MyExclude retire les types", () => {
    type Original = "a" | "b" | "c" | "d";
    type Resultat = MyExclude<Original, "a" | "c">;
    const val: Resultat = "b";
    assertEqual(val, "b");
  });

  await test("Ex2 — MyExtract extrait les types", () => {
    type Original = string | number | boolean;
    type Resultat = MyExtract<Original, string | boolean>;
    const s: Resultat = "hello";
    const b: Resultat = true;
    assert(typeof s === "string", "string extrait");
    assert(typeof b === "boolean", "boolean extrait");
  });

  await test("Ex2 — MyNonNullable retire null et undefined", () => {
    type Original = string | null | undefined | number;
    type Resultat = MyNonNullable<Original>;
    const s: Resultat = "hello";
    const n: Resultat = 42;
    assertEqual(typeof s, "string");
    assertEqual(typeof n, "number");
  });

  // --- Exercice 3 : Combinaisons ---
  await test("Ex3 — createUser avec valeurs par defaut", () => {
    const user = createUser({ nom: "Alice", email: "alice@example.com" });
    assert(user.id > 0, "id doit etre genere");
    assertEqual(user.nom, "Alice");
    assertEqual(user.email, "alice@example.com");
    assertEqual(user.age, 0);
    assertEqual(user.actif, true);
  });

  await test("Ex3 — createUser avec valeurs explicites", () => {
    const user = createUser({
      nom: "Bob",
      email: "bob@example.com",
      age: 25,
      actif: false,
    });
    assertEqual(user.nom, "Bob");
    assertEqual(user.age, 25);
    assertEqual(user.actif, false);
  });

  await test("Ex3 — updateUser modifie les champs specifies", () => {
    const original: Utilisateur = {
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    };
    const updated = updateUser(original, { id: 1, nom: "Alice Dupont" });
    assertEqual(updated.nom, "Alice Dupont");
    assertEqual(updated.email, "a@b.com");
    assertEqual(updated.age, 30);
  });

  await test("Ex3 — toSummary extrait le resume", () => {
    const user: Utilisateur = {
      id: 1,
      nom: "Alice",
      email: "a@b.com",
      age: 30,
      actif: true,
    };
    const summary_data = toSummary(user);
    assertEqual(summary_data.id, 1);
    assertEqual(summary_data.nom, "Alice");
    assertEqual(summary_data.actif, true);
    assertEqual(Object.keys(summary_data).length, 3);
  });

  summary();
}

main();
