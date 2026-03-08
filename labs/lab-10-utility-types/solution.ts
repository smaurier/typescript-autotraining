// =============================================================================
// Lab 10 — Utility Types (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertType, summary } = createTestRunner('Lab 10 — Utility Types');

// =============================================================================
// Interface de test
// =============================================================================

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  age: number;
  actif: boolean;
}

// =============================================================================
// Exercice 1 : Reimplementation de base
// =============================================================================

// Rend toutes les proprietes optionnelles
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Rend toutes les proprietes obligatoires
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// Rend toutes les proprietes readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

function makePartial<T>(obj: T): MyPartial<T> {
  return { ...obj };
}

function makeRequired<T>(obj: T): MyRequired<T> {
  return obj as MyRequired<T>;
}

function makeReadonly<T>(obj: T): MyReadonly<T> {
  return Object.freeze({ ...obj }) as MyReadonly<T>;
}

// =============================================================================
// Exercice 2 : Reimplementation avancee
// =============================================================================

// Extrait un sous-ensemble de proprietes
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Retire un sous-ensemble de proprietes
type MyOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// Cree un type dictionnaire
type MyRecord<K extends string | number | symbol, V> = {
  [P in K]: V;
};

// Retire les types de T assignables a U
type MyExclude<T, U> = T extends U ? never : T;

// Extrait les types de T assignables a U
type MyExtract<T, U> = T extends U ? T : never;

// Retire null et undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

function pickFields<T, K extends keyof T>(obj: T, keys: K[]): MyPick<T, K> {
  const result = {} as MyPick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

function omitFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): MyOmit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as unknown as MyOmit<T, K>;
}

// =============================================================================
// Exercice 3 : Combinaisons et usage pratique
// =============================================================================

// CreateUserInput : pas d'id, age et actif optionnels
type CreateUserInput = Omit<Utilisateur, 'id' | 'age' | 'actif'> & Partial<Pick<Utilisateur, 'age' | 'actif'>>;

// UpdateUserInput : id obligatoire, le reste optionnel
type UpdateUserInput = Pick<Utilisateur, 'id'> & Partial<Omit<Utilisateur, 'id'>>;

// UserSummary : uniquement id, nom et actif
type UserSummary = Pick<Utilisateur, 'id' | 'nom' | 'actif'>;

// ReadonlyUser : tout en readonly
type ReadonlyUser = Readonly<Utilisateur>;

let nextUserId = 1;

function createUser(input: CreateUserInput): Utilisateur {
  return {
    id: nextUserId++,
    nom: input.nom,
    email: input.email,
    age: input.age ?? 0,
    actif: input.actif ?? true,
  };
}

function updateUser(current: Utilisateur, update: UpdateUserInput): Utilisateur {
  return {
    ...current,
    ...update,
  };
}

function toSummary(user: Utilisateur): UserSummary {
  return {
    id: user.id,
    nom: user.nom,
    actif: user.actif,
  };
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 10 — Utility Types\n');

  // --- Exercice 1 : Reimplementation de base ---
  await test('Ex1 — MyPartial rend tout optionnel', () => {
    const partial = makePartial<Utilisateur>({
      id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true
    });
    const empty: MyPartial<Utilisateur> = {};
    assert(true, 'MyPartial compile correctement');
  });

  await test('Ex1 — MyRequired rend tout obligatoire', () => {
    interface PartialUser {
      nom?: string;
      email?: string;
    }
    const required: MyRequired<PartialUser> = { nom: 'Alice', email: 'a@b.com' };
    assertEqual(required.nom, 'Alice');
    assertEqual(required.email, 'a@b.com');
  });

  await test('Ex1 — MyReadonly gele l\'objet', () => {
    const user = { id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true };
    const frozen = makeReadonly(user);
    assertEqual((frozen as any).nom, 'Alice');
    try {
      (frozen as any).nom = 'Bob';
    } catch {
      // En mode strict, Object.freeze lance une erreur
    }
    assertEqual((frozen as any).nom, 'Alice');
  });

  // --- Exercice 2 : Reimplementation avancee ---
  await test('Ex2 — MyPick extrait les bonnes proprietes', () => {
    const user: Utilisateur = { id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true };
    const picked = pickFields(user, ['nom', 'email']);
    assertEqual(picked.nom, 'Alice');
    assertEqual(picked.email, 'a@b.com');
    assertEqual(Object.keys(picked).length, 2);
  });

  await test('Ex2 — MyOmit retire les bonnes proprietes', () => {
    const user = { id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true } as Record<string, unknown>;
    const omitted = omitFields(user, ['email', 'age']);
    assertEqual(omitted.nom, 'Alice');
    assertEqual(Object.keys(omitted).length, 3);
    assert(!('email' in omitted), 'email ne doit pas etre present');
    assert(!('age' in omitted), 'age ne doit pas etre present');
  });

  await test('Ex2 — MyRecord cree un dictionnaire type', () => {
    type Statut = 'actif' | 'inactif' | 'suspendu';
    const labels: MyRecord<Statut, string> = {
      actif: 'Actif',
      inactif: 'Inactif',
      suspendu: 'Suspendu',
    };
    assertEqual(labels.actif, 'Actif');
    assertEqual(labels.suspendu, 'Suspendu');
  });

  await test('Ex2 — MyExclude retire les types', () => {
    type Original = 'a' | 'b' | 'c' | 'd';
    type Resultat = MyExclude<Original, 'a' | 'c'>;
    const val: Resultat = 'b';
    assertEqual(val, 'b');
  });

  await test('Ex2 — MyExtract extrait les types', () => {
    type Original = string | number | boolean;
    type Resultat = MyExtract<Original, string | boolean>;
    const s: Resultat = 'hello';
    const b: Resultat = true;
    assert(typeof s === 'string', 'string extrait');
    assert(typeof b === 'boolean', 'boolean extrait');
  });

  await test('Ex2 — MyNonNullable retire null et undefined', () => {
    type Original = string | null | undefined | number;
    type Resultat = MyNonNullable<Original>;
    const s: Resultat = 'hello';
    const n: Resultat = 42;
    assertEqual(typeof s, 'string');
    assertEqual(typeof n, 'number');
  });

  // --- Exercice 3 : Combinaisons ---
  await test('Ex3 — createUser avec valeurs par defaut', () => {
    const user = createUser({ nom: 'Alice', email: 'alice@example.com' });
    assert(user.id > 0, 'id doit etre genere');
    assertEqual(user.nom, 'Alice');
    assertEqual(user.email, 'alice@example.com');
    assertEqual(user.age, 0);
    assertEqual(user.actif, true);
  });

  await test('Ex3 — createUser avec valeurs explicites', () => {
    const user = createUser({ nom: 'Bob', email: 'bob@example.com', age: 25, actif: false });
    assertEqual(user.nom, 'Bob');
    assertEqual(user.age, 25);
    assertEqual(user.actif, false);
  });

  await test('Ex3 — updateUser modifie les champs specifies', () => {
    const original: Utilisateur = { id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true };
    const updated = updateUser(original, { id: 1, nom: 'Alice Dupont' });
    assertEqual(updated.nom, 'Alice Dupont');
    assertEqual(updated.email, 'a@b.com');
    assertEqual(updated.age, 30);
  });

  await test('Ex3 — toSummary extrait le resume', () => {
    const user: Utilisateur = { id: 1, nom: 'Alice', email: 'a@b.com', age: 30, actif: true };
    const summary_data = toSummary(user);
    assertEqual(summary_data.id, 1);
    assertEqual(summary_data.nom, 'Alice');
    assertEqual(summary_data.actif, true);
    assertEqual(Object.keys(summary_data).length, 3);
  });

  summary();
}

main();
