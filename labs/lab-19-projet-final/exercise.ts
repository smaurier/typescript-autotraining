// =============================================================================
// Lab 19 — Projet final : Mini-framework utilitaire complet
// =============================================================================
// Objectifs :
//   - Combiner les notions des labs precedents
//   - Result<T, E>, EventEmitter, pipe(), schema validation
//   - Creer une API coherente et type-safe
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertIncludes, summary } = createTestRunner('Lab 19 — Projet final');

// =============================================================================
// Partie 1 : Result<T, E> — Monade de resultat
// =============================================================================

interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

type Result<T, E> = Ok<T> | Err<E>;

// TODO: Implementer ok et err
function ok<T>(value: T): Result<T, never> {
  // TODO
  return {} as any; // <-- remplacez
}

function err<E>(error: E): Result<never, E> {
  // TODO
  return {} as any; // <-- remplacez
}

// TODO: Implementer une classe ResultChain<T, E> qui permet le chainage fluide
class ResultChain<T, E> {
  constructor(private result: Result<T, E>) {}

  // TODO: map — transformer la valeur si Ok
  map<U>(fn: (value: T) => U): ResultChain<U, E> {
    // TODO
    return new ResultChain({} as any); // <-- remplacez
  }

  // TODO: flatMap — chainer avec une fonction retournant un Result
  flatMap<U>(fn: (value: T) => Result<U, E>): ResultChain<U, E> {
    // TODO
    return new ResultChain({} as any); // <-- remplacez
  }

  // TODO: mapError — transformer l'erreur si Err
  mapError<F>(fn: (error: E) => F): ResultChain<T, F> {
    // TODO
    return new ResultChain({} as any); // <-- remplacez
  }

  // TODO: unwrap — extraire la valeur ou lever une erreur
  unwrap(): T {
    // TODO
    throw new Error('Non implemente'); // <-- remplacez
  }

  // TODO: unwrapOr — extraire la valeur ou retourner un defaut
  unwrapOr(defaultValue: T): T {
    // TODO
    return defaultValue; // <-- remplacez
  }

  // TODO: match — pattern matching sur Ok/Err
  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    // TODO
    return {} as any; // <-- remplacez
  }

  // Getter pour acceder au Result interne
  get inner(): Result<T, E> {
    return this.result;
  }
}

// TODO: Fonction helper pour creer un ResultChain
function resultOf<T, E>(result: Result<T, E>): ResultChain<T, E> {
  return new ResultChain(result);
}

// =============================================================================
// Partie 2 : TypedEventEmitter
// =============================================================================

type EventMap = Record<string, unknown[]>;

// TODO: Implementer TypedEventEmitter<Events>
class TypedEventEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Array<(...args: any[]) => void>>();

  // TODO: on — enregistrer un listener
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: off — retirer un listener
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: emit — emettre un evenement
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    // TODO
    return false; // <-- remplacez
  }

  // TODO: once — ecouter une seule fois
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: listenerCount
  listenerCount<K extends keyof Events>(event: K): number {
    // TODO
    return 0; // <-- remplacez
  }
}

// =============================================================================
// Partie 3 : pipe() — Composition de fonctions
// =============================================================================

// TODO: pipe avec overloads
function pipe<A, B>(value: A, fn1: (a: A) => B): B;
function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
function pipe<A, B, C, D, E>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
function pipe<A, B, C, D, E, F>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): F;
function pipe(value: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown {
  // TODO: appliquer les fonctions en sequence
  return value; // <-- remplacez
}

// =============================================================================
// Partie 4 : Schema Validation
// =============================================================================

// Types de base pour les schemas
type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface SchemaField {
  type: SchemaType;
  required?: boolean;
  minLength?: number;   // pour string
  maxLength?: number;   // pour string
  min?: number;         // pour number
  max?: number;         // pour number
  items?: Schema;       // pour array
  properties?: Record<string, SchemaField>; // pour object
}

interface Schema {
  [key: string]: SchemaField;
}

interface ValidationError {
  field: string;
  message: string;
}

// TODO: Implementer la fonction validate
// Elle retourne un Result<T, ValidationError[]>
function validate<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  schema: Schema
): Result<T, ValidationError[]> {
  // TODO: valider chaque champ du schema
  // - Verifier le type
  // - Verifier required
  // - Verifier minLength/maxLength pour les strings
  // - Verifier min/max pour les numbers
  // Retourner ok(data as T) si valide, err(errors) sinon
  return {} as any; // <-- remplacez
}

// TODO: Implementer un builder de schema pour une API plus fluide
class SchemaBuilder {
  private schema: Schema = {};

  // TODO: string — ajouter un champ string
  string(name: string, options?: { required?: boolean; minLength?: number; maxLength?: number }): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: number — ajouter un champ number
  number(name: string, options?: { required?: boolean; min?: number; max?: number }): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: boolean — ajouter un champ boolean
  boolean(name: string, options?: { required?: boolean }): this {
    // TODO
    return this; // <-- remplacez
  }

  // TODO: build — retourner le schema
  build(): Schema {
    // TODO
    return {}; // <-- remplacez
  }

  // TODO: validate — valider directement avec le schema construit
  validate<T extends Record<string, unknown>>(data: Record<string, unknown>): Result<T, ValidationError[]> {
    return validate<T>(data, this.build());
  }
}

// TODO: Fonction helper pour creer un SchemaBuilder
function schema(): SchemaBuilder {
  return new SchemaBuilder();
}

// =============================================================================
// Partie 5 : Integration — Combiner tous les composants
// =============================================================================

// Definition des evenements pour une application
interface AppEvents extends EventMap {
  'user:created': [user: { id: string; name: string; email: string }];
  'user:validated': [user: { id: string; name: string; email: string }];
  'user:error': [errors: ValidationError[]];
  'log': [level: string, message: string];
}

// Schema de validation pour un utilisateur
const userSchema: Schema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  email: { type: 'string', required: true, minLength: 5 },
  age: { type: 'number', required: false, min: 0, max: 150 },
};

// TODO: Implementer createUserService qui combine :
//   - Validation avec le schema
//   - Emission d'evenements
//   - Result pour la gestion d'erreurs
interface UserService {
  createUser(data: Record<string, unknown>): Result<{ id: string; name: string; email: string }, ValidationError[]>;
  readonly events: TypedEventEmitter<AppEvents>;
}

function createUserService(): UserService {
  // TODO: creer un emitter et retourner le service
  const events = new TypedEventEmitter<AppEvents>();

  return {
    createUser(data: Record<string, unknown>) {
      // TODO:
      // 1. Valider les donnees avec userSchema
      // 2. Si valide, creer un id, emettre 'user:validated' et 'user:created'
      // 3. Si invalide, emettre 'user:error' et retourner l'erreur
      return {} as any; // <-- remplacez
    },
    events,
  };
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 19 — Projet final\n');

  // ===================== Tests Result =====================

  await test('ResultChain: map devrait transformer la valeur', () => {
    const result = resultOf(ok(5)).map((x) => x * 2).unwrap();
    assertEqual(result, 10);
  });

  await test('ResultChain: flatMap devrait chainer', () => {
    const safeDivide = (a: number, b: number): Result<number, string> =>
      b === 0 ? err('Division par zero') : ok(a / b);

    const result = resultOf(ok(10) as Result<number, string>)
      .flatMap((x) => safeDivide(x, 2))
      .unwrap();
    assertEqual(result, 5);
  });

  await test('ResultChain: match devrait dispatcher', () => {
    const result1 = resultOf(ok(42) as Result<number, string>).match({
      ok: (v) => `Valeur: ${v}`,
      err: (e) => `Erreur: ${e}`,
    });
    assertEqual(result1, 'Valeur: 42');

    const result2 = resultOf(err('oops') as Result<number, string>).match({
      ok: (v) => `Valeur: ${v}`,
      err: (e) => `Erreur: ${e}`,
    });
    assertEqual(result2, 'Erreur: oops');
  });

  await test('ResultChain: unwrapOr devrait retourner le defaut', () => {
    const result = resultOf(err('oops') as Result<number, string>).unwrapOr(0);
    assertEqual(result, 0);
  });

  await test('ResultChain: mapError devrait transformer l\'erreur', () => {
    const result = resultOf(err('oops') as Result<number, string>)
      .mapError((e) => `Erreur transformee: ${e}`)
      .match({
        ok: () => '',
        err: (e) => e,
      });
    assertEqual(result, 'Erreur transformee: oops');
  });

  await test('ResultChain: chainage complexe', () => {
    const result = resultOf(ok('42') as Result<string, string>)
      .map((s) => parseInt(s, 10))
      .flatMap((n) => (isNaN(n) ? err('NaN') : ok(n)))
      .map((n) => n * 2)
      .unwrap();
    assertEqual(result, 84);
  });

  // ===================== Tests EventEmitter =====================

  await test('EventEmitter: on + emit', () => {
    const emitter = new TypedEventEmitter<AppEvents>();
    let received = '';
    emitter.on('log', (level, message) => {
      received = `[${level}] ${message}`;
    });
    emitter.emit('log', 'info', 'Demarrage');
    assertEqual(received, '[info] Demarrage');
  });

  await test('EventEmitter: once', () => {
    const emitter = new TypedEventEmitter<AppEvents>();
    let count = 0;
    emitter.once('log', () => { count++; });
    emitter.emit('log', 'info', 'Premier');
    emitter.emit('log', 'info', 'Deuxieme');
    assertEqual(count, 1);
  });

  // ===================== Tests pipe() =====================

  await test('pipe: transformation complete', () => {
    const result = pipe(
      '  42  ',
      (s) => s.trim(),
      (s) => parseInt(s, 10),
      (n) => n * 2,
      (n) => `Resultat: ${n}`
    );
    assertEqual(result, 'Resultat: 84');
  });

  // ===================== Tests Schema Validation =====================

  await test('validate: donnees valides', () => {
    const data = { name: 'Alice', email: 'alice@example.com', age: 30 };
    const result = validate(data, userSchema);
    assert(result.ok === true, 'Devrait etre valide');
  });

  await test('validate: champ requis manquant', () => {
    const data = { email: 'alice@example.com' };
    const result = validate(data, userSchema);
    assert(result.ok === false, 'Devrait etre invalide');
    if (!result.ok) {
      assert(result.error.length > 0, 'Devrait avoir des erreurs');
      assert(result.error.some((e) => e.field === 'name'), 'Devrait mentionner name');
    }
  });

  await test('validate: type incorrect', () => {
    const data = { name: 123, email: 'alice@example.com' };
    const result = validate(data, userSchema);
    assert(result.ok === false, 'Devrait etre invalide');
    if (!result.ok) {
      assert(result.error.some((e) => e.field === 'name'), 'Devrait mentionner name');
    }
  });

  await test('validate: minLength non respecte', () => {
    const data = { name: 'A', email: 'alice@example.com' };
    const result = validate(data, userSchema);
    assert(result.ok === false, 'Devrait etre invalide');
    if (!result.ok) {
      assert(result.error.some((e) => e.field === 'name'), 'Devrait mentionner name');
    }
  });

  await test('validate: min/max pour number', () => {
    const data = { name: 'Alice', email: 'alice@example.com', age: -5 };
    const result = validate(data, userSchema);
    assert(result.ok === false, 'Devrait etre invalide');
    if (!result.ok) {
      assert(result.error.some((e) => e.field === 'age'), 'Devrait mentionner age');
    }
  });

  await test('validate: champ optionnel absent est OK', () => {
    const data = { name: 'Alice', email: 'alice@example.com' };
    const result = validate(data, userSchema);
    assert(result.ok === true, 'Devrait etre valide sans age');
  });

  // --- Tests SchemaBuilder ---

  await test('SchemaBuilder: construction et validation', () => {
    const s = schema()
      .string('username', { required: true, minLength: 3 })
      .number('age', { required: true, min: 18 })
      .boolean('active', { required: false });

    const validData = { username: 'alice', age: 25, active: true };
    const result = s.validate(validData);
    assert(result.ok === true, 'Devrait etre valide');
  });

  await test('SchemaBuilder: validation echouee', () => {
    const s = schema()
      .string('username', { required: true, minLength: 3 })
      .number('age', { required: true, min: 18 });

    const invalidData = { username: 'ab', age: 15 };
    const result = s.validate(invalidData);
    assert(result.ok === false, 'Devrait etre invalide');
    if (!result.ok) {
      assertEqual(result.error.length, 2); // username trop court + age trop petit
    }
  });

  // ===================== Tests Integration =====================

  await test('UserService: creation avec donnees valides', () => {
    const service = createUserService();
    const logs: string[] = [];
    service.events.on('user:created', (user) => {
      logs.push(`Cree: ${user.name}`);
    });
    service.events.on('user:validated', (user) => {
      logs.push(`Valide: ${user.name}`);
    });

    const result = service.createUser({
      name: 'Alice',
      email: 'alice@example.com',
      age: 30,
    });

    assert(result.ok === true, 'Devrait reussir');
    if (result.ok) {
      assertEqual(result.value.name, 'Alice');
      assertEqual(result.value.email, 'alice@example.com');
      assert(result.value.id.length > 0, 'Devrait avoir un id');
    }
    assertIncludes(logs, 'Valide: Alice');
    assertIncludes(logs, 'Cree: Alice');
  });

  await test('UserService: creation avec donnees invalides', () => {
    const service = createUserService();
    const errorLogs: ValidationError[][] = [];
    service.events.on('user:error', (errors) => {
      errorLogs.push(errors);
    });

    const result = service.createUser({
      name: 'A',
      email: 'ab',
    });

    assert(result.ok === false, 'Devrait echouer');
    if (!result.ok) {
      assert(result.error.length > 0, 'Devrait avoir des erreurs');
    }
    assertEqual(errorLogs.length, 1);
  });

  await test('UserService: integration pipe + Result', () => {
    const service = createUserService();

    const result = pipe(
      { name: 'Bob', email: 'bob@example.com', age: 25 } as Record<string, unknown>,
      (data) => service.createUser(data),
      (res) => resultOf(res).map((user) => `Bienvenue ${user.name} !`).unwrapOr('Echec')
    );

    assertEqual(result, 'Bienvenue Bob !');
  });

  await test('UserService: integration pipe + Result avec erreur', () => {
    const service = createUserService();

    const result = pipe(
      { name: 'A' } as Record<string, unknown>,
      (data) => service.createUser(data),
      (res) => resultOf(res).map((user) => `Bienvenue ${user.name} !`).unwrapOr('Inscription echouee')
    );

    assertEqual(result, 'Inscription echouee');
  });

  summary();
}

main();
