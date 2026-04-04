// =============================================================================
// Lab 18 — Patterns TypeScript avances
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
// Monade de resultat pour gerer les erreurs sans exceptions
// =============================================================================

// TODO: Definir le type Result<T, E> comme union discriminee
// Ok<T> : { ok: true, value: T }
// Err<E> : { ok: false, error: E }

interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

type Result<T, E> = Ok<T> | Err<E>;

// TODO: Implementer les constructeurs ok() et err()
function ok<T>(value: T): Result<T, never> {
  // TODO: retourner un Ok<T>
  return {} as any; // <-- remplacez
}

function err<E>(error: E): Result<never, E> {
  // TODO: retourner un Err<E>
  return {} as any; // <-- remplacez
}

// TODO: Implementer map sur Result
// Si Ok, appliquer fn a la valeur. Si Err, propager l'erreur.
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  // TODO: implementer
  return {} as any; // <-- remplacez
}

// TODO: Implementer flatMap (aussi appele chain ou bind)
// Si Ok, appliquer fn qui retourne un nouveau Result.
function flatMapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  // TODO: implementer
  return {} as any; // <-- remplacez
}

// TODO: Implementer unwrap
// Si Ok, retourner la valeur. Si Err, lever une Error.
function unwrapResult<T, E>(result: Result<T, E>): T {
  // TODO: implementer
  throw new Error('Non implemente'); // <-- remplacez
}

// TODO: Implementer unwrapOr
// Si Ok, retourner la valeur. Si Err, retourner la valeur par defaut.
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  // TODO: implementer
  return defaultValue; // <-- remplacez
}

// TODO: Implementer mapError
// Si Err, appliquer fn a l'erreur. Si Ok, propager la valeur.
function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  // TODO: implementer
  return {} as any; // <-- remplacez
}

// TODO: Implementer tryCatch qui encapsule une fonction pouvant lever une erreur
function tryCatch<T>(fn: () => T): Result<T, Error> {
  // TODO: try/catch et retourner ok ou err
  return {} as any; // <-- remplacez
}

// =============================================================================
// Exercice 2 : pipe() — Composition de fonctions type-safe
// =============================================================================

// TODO: Implementer pipe avec des overloads pour 1 a 5 fonctions
// pipe(value, fn1) => fn1(value)
// pipe(value, fn1, fn2) => fn2(fn1(value))
// etc.

// TODO: Declarer les overloads
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
// Exercice 3 : EventEmitter type-safe
// =============================================================================

// TODO: Definir le type EventMap comme contrainte pour les evenements
type EventMap = Record<string, unknown[]>;

// TODO: Implementer TypedEventEmitter<Events extends EventMap>
class TypedEventEmitter<Events extends EventMap> {
  // TODO: stocker les listeners dans une Map
  private listeners = new Map<keyof Events, Array<(...args: any[]) => void>>();

  // TODO: Implementer on(event, listener)
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO: ajouter le listener pour cet evenement
    return this; // <-- remplacez
  }

  // TODO: Implementer off(event, listener)
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO: retirer le listener
    return this; // <-- remplacez
  }

  // TODO: Implementer emit(event, ...args)
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    // TODO: appeler tous les listeners de cet evenement
    // Retourner true si au moins un listener a ete appele
    return false; // <-- remplacez
  }

  // TODO: Implementer once(event, listener) — ecouter une seule fois
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    // TODO: envelopper le listener pour qu'il se retire apres le premier appel
    return this; // <-- remplacez
  }

  // TODO: Implementer listenerCount(event)
  listenerCount<K extends keyof Events>(event: K): number {
    // TODO: retourner le nombre de listeners
    return 0; // <-- remplacez
  }

  // TODO: Implementer removeAllListeners(event?)
  removeAllListeners<K extends keyof Events>(event?: K): this {
    // TODO: supprimer tous les listeners, ou seulement ceux de l'evenement
    return this; // <-- remplacez
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

const LegacyUser = function (_this: LegacyUserInstance, _name: string) {
  // TODO: initialiser name sur this
} as unknown as LegacyUserConstructor;

interface AdminUserInstance extends LegacyUserInstance {
  role: 'admin';
  canManageUsers(): boolean;
}

type AdminUserConstructor = new (name: string) => AdminUserInstance;

const AdminUser = function (_this: AdminUserInstance, _name: string) {
  // TODO: appeler LegacyUser et definir role = 'admin'
} as unknown as AdminUserConstructor;

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
    assertEqual(result, 60); // [2,4] -> [20,40] -> 60
  });

  await test('pipe avec quatre fonctions', () => {
    const result = pipe(
      'hello world',
      (s) => s.split(' '),
      (arr) => arr.map((w) => w[0].toUpperCase() + w.slice(1)),
      (arr) => arr.join(' '),
      (s) => s.length
    );
    assertEqual(result, 11); // "Hello World".length
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
    assertEqual(count, 1); // pas incremente
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
