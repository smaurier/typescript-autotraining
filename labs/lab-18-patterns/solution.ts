// =============================================================================
// Lab 18 — Patterns TypeScript avances (SOLUTION)
// =============================================================================
// Objectifs :
//   - Implementer Result<T, E> (monade de resultat)
//   - Creer une fonction pipe() type-safe
//   - Implementer un EventEmitter generique type-safe
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertThrows, summary } = createTestRunner('Lab 18 — Patterns TypeScript avances');

// =============================================================================
// Exercice 1 : Result<T, E>
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

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

function flatMapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(String(result.error));
}

function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (result.ok) {
    return result;
  }
  return err(fn(result.error));
}

function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// =============================================================================
// Exercice 2 : pipe()
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
// Exercice 3 : TypedEventEmitter
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
    // Copie pour eviter les problemes si un listener se retire pendant l'iteration
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

  removeAllListeners<K extends keyof Events>(event?: K): this {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

// =============================================================================
// Types d'evenements pour les tests
// =============================================================================

interface ChatEvents extends EventMap {
  message: [sender: string, text: string];
  join: [username: string];
  leave: [username: string];
  error: [error: Error];
  typing: [username: string, isTyping: boolean];
}

// =============================================================================
// Exercice 4 : Rappel JS — prototypes et heritage prototypal
// =============================================================================

interface LegacyUserInstance {
  name: string;
  greet(): string;
}

type LegacyUserConstructor = new (name: string) => LegacyUserInstance;

const LegacyUser = function (this: LegacyUserInstance, name: string) {
  this.name = name;
} as unknown as LegacyUserConstructor;

(LegacyUser as unknown as { prototype: LegacyUserInstance }).prototype.greet = function (this: LegacyUserInstance): string {
  return `Bonjour ${this.name}`;
};

interface AdminUserInstance extends LegacyUserInstance {
  role: 'admin';
  canManageUsers(): boolean;
}

type AdminUserConstructor = new (name: string) => AdminUserInstance;

const AdminUser = function (this: AdminUserInstance, name: string) {
  (LegacyUser as unknown as (this: LegacyUserInstance, name: string) => void).call(this, name);
  this.role = 'admin';
} as unknown as AdminUserConstructor;

(AdminUser as unknown as { prototype: AdminUserInstance }).prototype = Object.create(
  (LegacyUser as unknown as { prototype: LegacyUserInstance }).prototype,
);
(AdminUser as unknown as { prototype: AdminUserInstance }).prototype.constructor = AdminUser;
(AdminUser as unknown as { prototype: AdminUserInstance }).prototype.canManageUsers = function (): boolean {
  return true;
};

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 18 — Patterns TypeScript avances\n');

  // ===================== Tests Result<T, E> =====================

  await test('ok() devrait creer un Ok', () => {
    const result = ok(42);
    assert(result.ok === true);
    assertEqual(result.value, 42);
  });

  await test('err() devrait creer un Err', () => {
    const result = err('erreur');
    assert(result.ok === false);
    assertEqual(result.error, 'erreur');
  });

  await test('mapResult sur Ok devrait transformer la valeur', () => {
    const result = mapResult(ok(5), (x) => x * 2);
    assert(result.ok === true);
    if (result.ok) assertEqual(result.value, 10);
  });

  await test('mapResult sur Err devrait propager l\'erreur', () => {
    const result = mapResult(err('oops') as Result<number, string>, (x) => x * 2);
    assert(result.ok === false);
    if (!result.ok) assertEqual(result.error, 'oops');
  });

  await test('flatMapResult devrait chainer les Result', () => {
    const safeDivide = (a: number, b: number): Result<number, string> =>
      b === 0 ? err('Division par zero') : ok(a / b);

    const result = flatMapResult(ok(10), (x) => safeDivide(x, 2));
    assert(result.ok === true);
    if (result.ok) assertEqual(result.value, 5);
  });

  await test('flatMapResult devrait propager l\'erreur', () => {
    const safeDivide = (a: number, b: number): Result<number, string> =>
      b === 0 ? err('Division par zero') : ok(a / b);

    const result = flatMapResult(ok(10), (x) => safeDivide(x, 0));
    assert(result.ok === false);
    if (!result.ok) assertEqual(result.error, 'Division par zero');
  });

  await test('unwrapResult devrait retourner la valeur pour Ok', () => {
    assertEqual(unwrapResult(ok(42)), 42);
  });

  await test('unwrapResult devrait lever une erreur pour Err', () => {
    let threw = false;
    try {
      unwrapResult(err('erreur'));
    } catch {
      threw = true;
    }
    assert(threw, 'Devrait lever une erreur');
  });

  await test('unwrapOr devrait retourner la valeur pour Ok', () => {
    assertEqual(unwrapOr(ok(42), 0), 42);
  });

  await test('unwrapOr devrait retourner le defaut pour Err', () => {
    assertEqual(unwrapOr(err('oops') as Result<number, string>, 0), 0);
  });

  await test('mapError devrait transformer l\'erreur', () => {
    const result = mapError(err('oops') as Result<number, string>, (e) => new Error(e));
    assert(result.ok === false);
    if (!result.ok) assert(result.error instanceof Error);
  });

  await test('tryCatch devrait capturer les erreurs', () => {
    const result = tryCatch(() => JSON.parse('invalid'));
    assert(result.ok === false);
    if (!result.ok) assert(result.error instanceof Error);
  });

  await test('tryCatch devrait retourner Ok pour un succes', () => {
    const result = tryCatch(() => JSON.parse('{"a": 1}'));
    assert(result.ok === true);
    if (result.ok) assertDeepEqual(result.value, { a: 1 });
  });

  // ===================== Tests pipe() =====================

  await test('pipe avec une fonction', () => {
    const result = pipe(5, (x) => x * 2);
    assertEqual(result, 10);
  });

  await test('pipe avec deux fonctions', () => {
    const result = pipe(
      '  hello  ',
      (s) => s.trim(),
      (s) => s.toUpperCase()
    );
    assertEqual(result, 'HELLO');
  });

  await test('pipe avec trois fonctions', () => {
    const result = pipe(
      [1, 2, 3, 4, 5],
      (arr) => arr.filter((x) => x % 2 === 0),
      (arr) => arr.map((x) => x * 10),
      (arr) => arr.reduce((sum, x) => sum + x, 0)
    );
    assertEqual(result, 60);
  });

  await test('pipe avec quatre fonctions', () => {
    const result = pipe(
      'hello world',
      (s) => s.split(' '),
      (arr) => arr.map((w) => w[0].toUpperCase() + w.slice(1)),
      (arr) => arr.join(' '),
      (s) => s.length
    );
    assertEqual(result, 11);
  });

  // ===================== Tests EventEmitter =====================

  await test('EventEmitter: on + emit devrait appeler le listener', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    let received = '';
    emitter.on('message', (sender, text) => {
      received = `${sender}: ${text}`;
    });
    emitter.emit('message', 'Alice', 'Bonjour');
    assertEqual(received, 'Alice: Bonjour');
  });

  await test('EventEmitter: emit devrait retourner true si des listeners existent', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    emitter.on('join', () => {});
    assert(emitter.emit('join', 'Alice'));
  });

  await test('EventEmitter: emit devrait retourner false sans listeners', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    assert(!emitter.emit('join', 'Alice'));
  });

  await test('EventEmitter: off devrait retirer un listener', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    let count = 0;
    const listener = () => { count++; };
    emitter.on('join', listener);
    emitter.emit('join', 'Alice');
    assertEqual(count, 1);
    emitter.off('join', listener);
    emitter.emit('join', 'Bob');
    assertEqual(count, 1);
  });

  await test('EventEmitter: once devrait appeler le listener une seule fois', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    let count = 0;
    emitter.once('join', () => { count++; });
    emitter.emit('join', 'Alice');
    emitter.emit('join', 'Bob');
    assertEqual(count, 1);
  });

  await test('EventEmitter: listenerCount devrait retourner le bon nombre', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    assertEqual(emitter.listenerCount('message'), 0);
    emitter.on('message', () => {});
    emitter.on('message', () => {});
    assertEqual(emitter.listenerCount('message'), 2);
  });

  await test('EventEmitter: removeAllListeners devrait tout supprimer', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    emitter.on('message', () => {});
    emitter.on('join', () => {});
    emitter.removeAllListeners();
    assertEqual(emitter.listenerCount('message'), 0);
    assertEqual(emitter.listenerCount('join'), 0);
  });

  await test('EventEmitter: removeAllListeners(event) devrait supprimer un seul evenement', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    emitter.on('message', () => {});
    emitter.on('join', () => {});
    emitter.removeAllListeners('message');
    assertEqual(emitter.listenerCount('message'), 0);
    assertEqual(emitter.listenerCount('join'), 1);
  });

  await test('EventEmitter: plusieurs listeners sur le meme evenement', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    const results: string[] = [];
    emitter.on('message', (sender, text) => results.push(`1: ${sender}`));
    emitter.on('message', (sender, text) => results.push(`2: ${text}`));
    emitter.emit('message', 'Alice', 'Salut');
    assertDeepEqual(results, ['1: Alice', '2: Salut']);
  });

  await test('EventEmitter: typing avec boolean', () => {
    const emitter = new TypedEventEmitter<ChatEvents>();
    let typingState = false;
    emitter.on('typing', (_user, isTyping) => {
      typingState = isTyping;
    });
    emitter.emit('typing', 'Alice', true);
    assert(typingState === true);
    emitter.emit('typing', 'Alice', false);
    assert(typingState === false);
  });

  await test('LegacyUser utilise une methode sur le prototype', () => {
    const user = new LegacyUser('Alice');
    assertEqual(user.greet(), 'Bonjour Alice');
    assertEqual(Object.prototype.hasOwnProperty.call(user, 'greet'), false);
    assertEqual(Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(user), 'greet'), true);
  });

  await test('AdminUser herite de LegacyUser', () => {
    const admin = new AdminUser('Bob');
    assert(admin instanceof AdminUser);
    assert(admin instanceof LegacyUser);
    assertEqual(admin.greet(), 'Bonjour Bob');
    assertEqual(admin.role, 'admin');
    assertEqual(admin.canManageUsers(), true);
  });

  summary();
}

main();
