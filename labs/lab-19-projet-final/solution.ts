// =============================================================================
// Lab 19 — Projet final : Mini-framework utilitaire complet (SOLUTION)
// =============================================================================
// Objectifs :
//   - Combiner les notions des labs precedents
//   - Result<T, E>, EventEmitter, pipe(), schema validation
//   - Creer une API coherente et type-safe
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertIncludes, summary } = createTestRunner('Lab 19 — Projet final');

// =============================================================================
// Partie 1 : Result<T, E>
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

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

class ResultChain<T, E> {
  constructor(private result: Result<T, E>) {}

  map<U>(fn: (value: T) => U): ResultChain<U, E> {
    if (this.result.ok) {
      return new ResultChain(ok(fn(this.result.value)));
    }
    return new ResultChain(this.result as unknown as Result<U, E>);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): ResultChain<U, E> {
    if (this.result.ok) {
      return new ResultChain(fn(this.result.value));
    }
    return new ResultChain(this.result as unknown as Result<U, E>);
  }

  mapError<F>(fn: (error: E) => F): ResultChain<T, F> {
    if (!this.result.ok) {
      return new ResultChain(err(fn(this.result.error)));
    }
    return new ResultChain(this.result as unknown as Result<T, F>);
  }

  unwrap(): T {
    if (this.result.ok) {
      return this.result.value;
    }
    throw new Error(String(this.result.error));
  }

  unwrapOr(defaultValue: T): T {
    if (this.result.ok) {
      return this.result.value;
    }
    return defaultValue;
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    if (this.result.ok) {
      return handlers.ok(this.result.value);
    }
    return handlers.err(this.result.error);
  }

  get inner(): Result<T, E> {
    return this.result;
  }
}

function resultOf<T, E>(result: Result<T, E>): ResultChain<T, E> {
  return new ResultChain(result);
}

// =============================================================================
// Partie 2 : TypedEventEmitter
// =============================================================================

type EventMap = Record<string, unknown[]>;

class TypedEventEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Array<(...args: any[]) => void>>();

  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener as (...args: any[]) => void);
    this.listeners.set(event, existing);
    return this;
  }

  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const existing = this.listeners.get(event);
    if (existing) {
      const index = existing.indexOf(listener as (...args: any[]) => void);
      if (index !== -1) {
        existing.splice(index, 1);
      }
    }
    return this;
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const existing = this.listeners.get(event);
    if (!existing || existing.length === 0) {
      return false;
    }
    const copy = [...existing];
    for (const listener of copy) {
      listener(...args);
    }
    return true;
  }

  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const wrapper = (...args: Events[K]) => {
      this.off(event, wrapper as (...args: Events[K]) => void);
      listener(...args);
    };
    this.on(event, wrapper as (...args: Events[K]) => void);
    return this;
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}

// =============================================================================
// Partie 3 : pipe()
// =============================================================================

function pipe<A, B>(value: A, fn1: (a: A) => B): B;
function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
function pipe<A, B, C, D, E>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
function pipe<A, B, C, D, E, F>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): F;
function pipe(value: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}

// =============================================================================
// Partie 4 : Schema Validation
// =============================================================================

type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface SchemaField {
  type: SchemaType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  items?: Schema;
  properties?: Record<string, SchemaField>;
}

interface Schema {
  [key: string]: SchemaField;
}

interface ValidationError {
  field: string;
  message: string;
}

function validate<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  schema: Schema
): Result<T, ValidationError[]> {
  const errors: ValidationError[] = [];

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];

    // Verifier champ requis
    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push({ field: fieldName, message: `Le champ "${fieldName}" est requis` });
      continue;
    }

    // Si le champ est absent et non requis, passer
    if (value === undefined || value === null) {
      continue;
    }

    // Verifier le type
    const actualType = typeof value;
    if (fieldSchema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({ field: fieldName, message: `Le champ "${fieldName}" devrait etre un tableau` });
        continue;
      }
    } else if (actualType !== fieldSchema.type) {
      errors.push({
        field: fieldName,
        message: `Le champ "${fieldName}" devrait etre de type ${fieldSchema.type}, recu ${actualType}`,
      });
      continue;
    }

    // Verifications specifiques aux strings
    if (fieldSchema.type === 'string' && typeof value === 'string') {
      if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
        errors.push({
          field: fieldName,
          message: `Le champ "${fieldName}" doit avoir au moins ${fieldSchema.minLength} caracteres`,
        });
      }
      if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
        errors.push({
          field: fieldName,
          message: `Le champ "${fieldName}" doit avoir au plus ${fieldSchema.maxLength} caracteres`,
        });
      }
    }

    // Verifications specifiques aux numbers
    if (fieldSchema.type === 'number' && typeof value === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push({
          field: fieldName,
          message: `Le champ "${fieldName}" doit etre >= ${fieldSchema.min}`,
        });
      }
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors.push({
          field: fieldName,
          message: `Le champ "${fieldName}" doit etre <= ${fieldSchema.max}`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }
  return ok(data as T);
}

class SchemaBuilder {
  private schema: Schema = {};

  string(name: string, options?: { required?: boolean; minLength?: number; maxLength?: number }): this {
    this.schema[name] = {
      type: 'string',
      required: options?.required ?? false,
      minLength: options?.minLength,
      maxLength: options?.maxLength,
    };
    return this;
  }

  number(name: string, options?: { required?: boolean; min?: number; max?: number }): this {
    this.schema[name] = {
      type: 'number',
      required: options?.required ?? false,
      min: options?.min,
      max: options?.max,
    };
    return this;
  }

  boolean(name: string, options?: { required?: boolean }): this {
    this.schema[name] = {
      type: 'boolean',
      required: options?.required ?? false,
    };
    return this;
  }

  build(): Schema {
    return { ...this.schema };
  }

  validate<T extends Record<string, unknown>>(data: Record<string, unknown>): Result<T, ValidationError[]> {
    return validate<T>(data, this.build());
  }
}

function schema(): SchemaBuilder {
  return new SchemaBuilder();
}

// =============================================================================
// Partie 5 : Integration
// =============================================================================

interface AppEvents extends EventMap {
  'user:created': [user: { id: string; name: string; email: string }];
  'user:validated': [user: { id: string; name: string; email: string }];
  'user:error': [errors: ValidationError[]];
  'log': [level: string, message: string];
}

const userSchema: Schema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  email: { type: 'string', required: true, minLength: 5 },
  age: { type: 'number', required: false, min: 0, max: 150 },
};

interface UserService {
  createUser(data: Record<string, unknown>): Result<{ id: string; name: string; email: string }, ValidationError[]>;
  readonly events: TypedEventEmitter<AppEvents>;
}

let userIdCounter = 0;

function createUserService(): UserService {
  const events = new TypedEventEmitter<AppEvents>();

  return {
    createUser(data: Record<string, unknown>) {
      const validationResult = validate<{ name: string; email: string; age?: number }>(data, userSchema);

      if (!validationResult.ok) {
        events.emit('user:error', validationResult.error);
        return validationResult as Result<never, ValidationError[]>;
      }

      const user = {
        id: `user_${++userIdCounter}`,
        name: validationResult.value.name as string,
        email: validationResult.value.email as string,
      };

      events.emit('user:validated', user);
      events.emit('user:created', user);

      return ok(user);
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
      assertEqual(result.error.length, 2);
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
