# Screencast 19 — Projet final : construire ts-toolkit

## Informations
- **Duree estimee** : 25-30 min
- **Module** : `modules/19-projet-final.md`
- **Lab associe** : Lab 19 (projet complet)
- **Prérequis** : Tous les screencasts précédents (00 a 18)

## Setup
- [ ] VS Code ouvert avec un dossier vide `ts-toolkit/`
- [ ] Terminal intégré ouvert
- [ ] Node.js et npm installes
- [ ] Tous les concepts des screencasts précédents maitrises
- [ ] Connexion internet pour les installations npm

## Script

### [00:00-05:00] Initialisation du projet ts-toolkit

> Dans ce dernier screencast, nous allons construire ensemble une librairie TypeScript complete : `ts-toolkit`. Elle combinera les patterns Result, les utility types, un event bus type-safe et des validateurs. Nous appliquerons tout ce que nous avons appris.

**Action** : Initialiser le projet depuis zero.

```bash
mkdir ts-toolkit && cd ts-toolkit
npm init -y
npm install -D typescript tsx vitest
npx tsc --init
```

**Action** : Configurer `tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Action** : Créer la structure de dossiers.

```
ts-toolkit/
  src/
    result.ts       — Pattern Result
    validator.ts    — Schema de validation
    event-bus.ts    — EventEmitter type-safe
    pipe.ts         — Composition de fonctions
    types.ts        — Utility types customs
    index.ts        — Barrel file
  tests/
    result.test.ts
    validator.test.ts
  package.json
  tsconfig.json
```

> Notre librairie aura cinq modules. Chacun utilise des concepts vus dans les screencasts précédents. Commencons par le coeur : le module Result.

### [05:00-11:00] Module Result et module Pipe

> Implementons le module Result avec des méthodes de chainage.

**Action** : Créer `src/result.ts`.

```typescript
// src/result.ts

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

**Action** : Créer `src/pipe.ts`.

```typescript
// src/pipe.ts

export function pipe<A, B>(value: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(
  value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D
): D;
export function pipe<A, B, C, D, E>(
  value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E
): E;
export function pipe<A, B, C, D, E, F>(
  value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D,
  fn4: (d: D) => E, fn5: (e: E) => F
): F;
export function pipe(value: unknown, ...fns: Function[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}

export function compose<A, B>(fn1: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
export function compose<A, B, C, D>(
  fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D
): (a: A) => D;
export function compose(...fns: Function[]): Function {
  return (value: unknown) => fns.reduce((acc, fn) => fn(acc), value);
}
```

**Action** : Montrer les surcharges pour le pipe et la compose.

> Le module Result couvre toutes les operations : création avec `Ok`/`Err`, chainage avec `map`/`flatMap`, unwrap pour extraire la valeur, et `tryCatch` pour convertir des exceptions en Results. Le module pipe offre la composition fonctionnelle.

### [11:00-17:00] Module Validator type-safe

> Le validateur utilise les generics et les types conditionnels pour inferer le type de sortie à partir du schema.

**Action** : Créer `src/validator.ts`.

```typescript
// src/validator.ts

import { Result, Ok, Err } from "./result.js";

// Types de schema
interface StringSchema { readonly type: "string"; readonly minLength?: number; readonly maxLength?: number }
interface NumberSchema { readonly type: "number"; readonly min?: number; readonly max?: number }
interface BooleanSchema { readonly type: "boolean" }
interface ArraySchema<T extends Schema> { readonly type: "array"; readonly items: T }
interface ObjectSchema<T extends Record<string, Schema>> { readonly type: "object"; readonly properties: T }

type Schema = StringSchema | NumberSchema | BooleanSchema | ArraySchema<any> | ObjectSchema<any>;

// Inferer le type TypeScript depuis un schema
type Infer<S extends Schema> =
  S extends StringSchema ? string :
  S extends NumberSchema ? number :
  S extends BooleanSchema ? boolean :
  S extends ArraySchema<infer T> ? Infer<T>[] :
  S extends ObjectSchema<infer T> ? { [K in keyof T]: Infer<T[K] & Schema> } :
  never;

// Builders de schema
export const s = {
  string(opts?: Omit<StringSchema, "type">): StringSchema {
    return { type: "string", ...opts };
  },
  number(opts?: Omit<NumberSchema, "type">): NumberSchema {
    return { type: "number", ...opts };
  },
  boolean(): BooleanSchema {
    return { type: "boolean" };
  },
  array<T extends Schema>(items: T): ArraySchema<T> {
    return { type: "array", items };
  },
  object<T extends Record<string, Schema>>(properties: T): ObjectSchema<T> {
    return { type: "object", properties };
  },
};

// Fonction de validation
export function validate<S extends Schema>(
  schema: S,
  data: unknown
): Result<Infer<S>, string> {
  switch (schema.type) {
    case "string": {
      if (typeof data !== "string") return Err(`Attendu string, recu ${typeof data}`);
      if (schema.minLength && data.length < schema.minLength) {
        return Err(`Longueur min ${schema.minLength}, recu ${data.length}`);
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        return Err(`Longueur max ${schema.maxLength}, recu ${data.length}`);
      }
      return Ok(data as Infer<S>);
    }
    case "number": {
      if (typeof data !== "number") return Err(`Attendu number, recu ${typeof data}`);
      if (schema.min !== undefined && data < schema.min) return Err(`Min ${schema.min}, recu ${data}`);
      if (schema.max !== undefined && data > schema.max) return Err(`Max ${schema.max}, recu ${data}`);
      return Ok(data as Infer<S>);
    }
    case "boolean": {
      if (typeof data !== "boolean") return Err(`Attendu boolean, recu ${typeof data}`);
      return Ok(data as Infer<S>);
    }
    case "array": {
      if (!Array.isArray(data)) return Err(`Attendu array, recu ${typeof data}`);
      for (let i = 0; i < data.length; i++) {
        const r = validate(schema.items, data[i]);
        if (!r.ok) return Err(`[${i}]: ${r.error}`);
      }
      return Ok(data as Infer<S>);
    }
    case "object": {
      if (typeof data !== "object" || data === null) return Err(`Attendu object, recu ${typeof data}`);
      const result: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const r = validate(propSchema as Schema, (data as Record<string, unknown>)[key]);
        if (!r.ok) return Err(`${key}: ${r.error}`);
        result[key] = r.ok ? r.value : undefined;
      }
      return Ok(result as Infer<S>);
    }
    default:
      return Err("Schema inconnu");
  }
}
```

**Action** : Montrer l'utilisation du validateur.

```typescript
// Utilisation du validateur
const userSchema = s.object({
  name: s.string({ minLength: 1 }),
  age: s.number({ min: 0, max: 150 }),
  active: s.boolean(),
  tags: s.array(s.string()),
});

// Le type est automatiquement infere !
type UserFromSchema = Infer<typeof userSchema>;
// { name: string; age: number; active: boolean; tags: string[] }

const result = validate(userSchema, {
  name: "Alice",
  age: 30,
  active: true,
  tags: ["admin", "dev"],
});

if (result.ok) {
  // result.value est automatiquement type comme UserFromSchema
  console.log(result.value.name);
  console.log(result.value.tags);
}
```

**Action** : Survoler `result.value` pour montrer le type infere.

> Le validateur infere le type TypeScript directement depuis le schema. C'est exactement le pattern utilise par Zod. La magie vient du type `Infer` qui transforme recursivement le schema en type TypeScript.

### [17:00-22:00] Module EventBus et barrel file

> Assemblons le EventBus et le point d'entree.

**Action** : Créer `src/event-bus.ts`.

```typescript
// src/event-bus.ts

type EventMap = Record<string, unknown>;
type Handler<T> = (payload: T) => void;

export class EventBus<Events extends EventMap> {
  private handlers = new Map<string, Set<Function>>();

  on<K extends string & keyof Events>(
    event: K,
    handler: Handler<Events[K]>
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  once<K extends string & keyof Events>(
    event: K,
    handler: Handler<Events[K]>
  ): void {
    const unsub = this.on(event, ((payload: Events[K]) => {
      handler(payload);
      unsub();
    }) as Handler<Events[K]>);
  }

  emit<K extends string & keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }

  off<K extends string & keyof Events>(event: K): void {
    this.handlers.delete(event);
  }

  clear(): void {
    this.handlers.clear();
  }
}
```

**Action** : Créer `src/types.ts` avec des utility types custom.

```typescript
// src/types.ts — Utility types customs

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[K]>
    : T[K];
};

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
```

**Action** : Créer `src/index.ts` (barrel file).

```typescript
// src/index.ts — Point d'entree de la librairie

export { Result, Ok, Err, isOk, isErr, map, flatMap, mapError, unwrap, unwrapOr, tryCatch, tryCatchAsync } from "./result.js";
export { pipe, compose } from "./pipe.js";
export { s, validate } from "./validator.js";
export type { Schema } from "./validator.js";
export { EventBus } from "./event-bus.js";
export type { DeepPartial, DeepReadonly, PartialBy, RequiredBy, Brand, Prettify, StrictOmit, ValueOf, Entries } from "./types.js";
```

### [22:00-27:00] Tests et compilation

> Ecrivons quelques tests pour valider notre librairie.

**Action** : Créer `tests/result.test.ts`.

```typescript
// tests/result.test.ts
import { describe, it, expect } from "vitest";
import { Ok, Err, map, flatMap, unwrap, unwrapOr, tryCatch } from "../src/result.js";

describe("Result", () => {
  it("Ok contient une valeur", () => {
    const result = Ok(42);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBe(42);
  });

  it("Err contient une erreur", () => {
    const result = Err("oops");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe("oops");
  });

  it("map transforme la valeur d'un Ok", () => {
    const result = map(Ok(5), (n) => n * 2);
    expect(result).toEqual({ ok: true, value: 10 });
  });

  it("map ne transforme pas un Err", () => {
    const result = map(Err("oops"), (n: number) => n * 2);
    expect(result).toEqual({ ok: false, error: "oops" });
  });

  it("flatMap chaine les Results", () => {
    const divide = (a: number, b: number) =>
      b === 0 ? Err("Division par zero") : Ok(a / b);

    const result = flatMap(Ok(10), (n) => divide(n, 2));
    expect(result).toEqual({ ok: true, value: 5 });

    const error = flatMap(Ok(10), (n) => divide(n, 0));
    expect(error).toEqual({ ok: false, error: "Division par zero" });
  });

  it("unwrap retourne la valeur ou lance", () => {
    expect(unwrap(Ok(42))).toBe(42);
    expect(() => unwrap(Err(new Error("boom")))).toThrow("boom");
  });

  it("unwrapOr retourne la valeur ou le defaut", () => {
    expect(unwrapOr(Ok(42), 0)).toBe(42);
    expect(unwrapOr(Err("oops"), 0)).toBe(0);
  });

  it("tryCatch capture les exceptions", () => {
    const success = tryCatch(() => JSON.parse('{"a": 1}'));
    expect(success.ok).toBe(true);

    const failure = tryCatch(() => JSON.parse("{invalid}"));
    expect(failure.ok).toBe(false);
  });
});
```

**Action** : Exécuter les tests.

```bash
npx vitest run
```

**Action** : Compiler la librairie.

```bash
npx tsc

# Verifier les fichiers generes
ls dist/
```

**Action** : Montrer les fichiers `.js`, `.d.ts` et `.js.map` generes.

### [27:00-29:30] Récapitulatif final

> Faisons le bilan de tout ce que nous avons utilise dans ce projet.

```typescript
// Concepts utilises dans ts-toolkit :
//
// Screencast 00 : Setup du projet, tsconfig.json
// Screencast 01 : Types primitifs dans les signatures
// Screencast 02 : Surcharges de fonctions (pipe)
// Screencast 03 : Interfaces et typage structurel (schemas)
// Screencast 04 : Discriminated unions (Result ok/error)
// Screencast 05 : Classes (EventBus)
// Screencast 06 : Generics (tous les modules)
// Screencast 07 : Branded types, builder
// Screencast 08 : Tuples (pipe), never (exhaustive checks)
// Screencast 09 : Modules ESM, barrel files
// Screencast 10 : Utility types (DeepPartial, etc.)
// Screencast 11 : Conditional types, infer (Infer<Schema>)
// Screencast 12 : Mapped types (utility types custom)
// Screencast 16 : Declaration files (.d.ts generes)
// Screencast 17 : tsconfig.json configuration
// Screencast 18 : Patterns Result, pipe, EventEmitter
```

> Felicitations ! Vous venez de construire une librairie TypeScript complete en utilisant pratiquement tous les concepts du cours. `ts-toolkit` inclut un système Result pour la gestion d'erreurs, un validateur de schema avec inference automatique, un EventBus type-safe, des fonctions pipe/compose, et des utility types. Vous avez les outils pour écrire du TypeScript professionnel. La prochaine étape : explorez Zod, tRPC et Prisma pour voir ces patterns a l'echelle industrielle.

## Points d'attention pour l'enregistrement
- C'est le screencast le plus long — garder un rythme soutenu mais pas precipite
- Taper le code en direct autant que possible pour montrer l'autocompletion
- Le module Validator est le plus impressionnant visuellement — prendre le temps sur `Infer`
- Exécuter les tests pour montrer que tout fonctionne a l'exécution
- Terminer sur une note d'encouragement — c'est la conclusion du cours
- Vérifier que la compilation passe sans erreur avant l'enregistrement
