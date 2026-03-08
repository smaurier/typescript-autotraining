# Screencast 18 — Design patterns TypeScript : Result, Builder, pipe et EventEmitter

## Informations
- **Duree estimee** : 20-25 min
- **Module** : `modules/18-patterns.md`
- **Lab associe** : Lab 18
- **Prerequis** : Screencast 07 (generics avances), Screencast 11 (conditional types)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/18-patterns.ts` pret a etre cree
- [ ] `tsx` installe pour executer les exemples

## Script

### [00:00-05:00] Pattern Result : gestion d'erreurs sans exceptions

> Les exceptions sont le mecanisme classique de gestion d'erreurs, mais elles ont un defaut : elles ne sont pas visibles dans le systeme de types. Le pattern Result rend les erreurs explicites et typees. C'est le pattern le plus important de ce screencast.

**Action** : Creer le fichier `src/18-patterns.ts`.

```typescript
// Pattern Result : Success ou Failure, jamais d'exception

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Fonctions utilitaires pour creer des resultats
function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Utilisation : parsing d'un JSON
function safeJsonParse<T>(json: string): Result<T, string> {
  try {
    return Ok(JSON.parse(json));
  } catch (e) {
    return Err(`JSON invalide : ${(e as Error).message}`);
  }
}

const result = safeJsonParse<{ name: string }>('{"name": "Alice"}');

if (result.ok) {
  console.log(result.value.name); // "Alice" — type: { name: string }
} else {
  console.error(result.error);    // type: string
}

// Erreurs typees specifiques
type ValidationError = { field: string; message: string };
type DatabaseError = { code: number; detail: string };
type AppError = ValidationError | DatabaseError;

interface UserInput {
  name: string;
  email: string;
}

function validateUser(input: unknown): Result<UserInput, ValidationError> {
  if (typeof input !== "object" || input === null) {
    return Err({ field: "root", message: "Objet attendu" });
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    return Err({ field: "name", message: "Nom requis" });
  }
  if (typeof obj.email !== "string" || !obj.email.includes("@")) {
    return Err({ field: "email", message: "Email invalide" });
  }
  return Ok({ name: obj.name, email: obj.email });
}

// Chainage de Results
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) return Ok(fn(result.value));
  return result;
}

function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (result.ok) return fn(result.value);
  return result;
}

const parsed = safeJsonParse<UserInput>('{"name": "Bob", "email": "bob@test.com"}');
const validated = flatMap(parsed, (data) => validateUser(data));
const greeting = map(validated, (user) => `Bienvenue, ${user.name} !`);

console.log(greeting);
```

**Action** : Montrer que le compilateur force a verifier `ok` avant d'acceder a `value` ou `error`. Executer le code.

> Le pattern Result force l'appelant a gerer les deux cas — succes et echec. Contrairement aux exceptions, les erreurs sont visibles dans la signature de la fonction. C'est le standard dans des langages comme Rust et Go.

### [05:00-10:30] Pattern Builder type-safe

> Le pattern Builder guide la construction d'un objet complexe etape par etape, avec une validation a la compilation.

**Action** : Ajouter le code suivant.

```typescript
// Builder avec validation de completude au niveau des types

interface HttpRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
}

type RequiredFields = "method" | "url";

class RequestBuilder<Filled extends string = never> {
  private config: Partial<HttpRequest> = {
    headers: {},
    timeout: 5000,
  };

  method(m: HttpRequest["method"]): RequestBuilder<Filled | "method"> {
    this.config.method = m;
    return this as any;
  }

  url(u: string): RequestBuilder<Filled | "url"> {
    this.config.url = u;
    return this as any;
  }

  header(key: string, value: string): this {
    this.config.headers![key] = value;
    return this;
  }

  body(b: string): this {
    this.config.body = b;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  // build() n'est disponible que si tous les champs requis sont remplis
  build(
    this: RequestBuilder<RequiredFields>
  ): HttpRequest {
    return this.config as HttpRequest;
  }
}

// Usage correct
const request = new RequestBuilder()
  .method("POST")
  .url("https://api.example.com/users")
  .header("Content-Type", "application/json")
  .body(JSON.stringify({ name: "Alice" }))
  .timeout(3000)
  .build();

console.log(request);

// Erreur si on oublie un champ requis
// new RequestBuilder().url("/api").build();
// Erreur : Property 'build' does not exist on type 'RequestBuilder<"url">'
```

**Action** : Tenter d'appeler `.build()` sans `.method()` et montrer l'erreur.

> Le type `Filled` accumule les noms des champs remplis a chaque etape. La methode `build()` exige que `Filled` contienne tous les `RequiredFields`. Le compilateur garantit a la construction que toutes les etapes obligatoires ont ete franchies.

### [10:30-16:00] Pattern pipe : composition de fonctions

> Le pattern pipe permet de composer des fonctions de maniere lisible et type-safe.

**Action** : Ajouter le code suivant.

```typescript
// Pipe : composer des fonctions de gauche a droite

// Version simple avec surcharges
function pipe<A, B>(value: A, fn1: (a: A) => B): B;
function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
function pipe<A, B, C, D, E>(
  value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E
): E;
function pipe(value: any, ...fns: Function[]): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}

// Fonctions utilitaires pures
const trim = (s: string) => s.trim();
const toLowerCase = (s: string) => s.toLowerCase();
const split = (sep: string) => (s: string) => s.split(sep);
const join = (sep: string) => (arr: string[]) => arr.join(sep);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const mapArray = <T, U>(fn: (item: T) => U) => (arr: T[]) => arr.map(fn);

// Composition type-safe
const slugify = (input: string) =>
  pipe(
    input,
    trim,
    toLowerCase,
    split(" "),
    join("-")
  );

console.log(slugify("  Hello World  ")); // "hello-world"

const titleCase = (input: string) =>
  pipe(
    input,
    trim,
    toLowerCase,
    split(" "),
    mapArray(capitalize),
    join(" ")
  );

console.log(titleCase("  hello world example  ")); // "Hello World Example"

// Pipeline operator (pas encore en TypeScript, mais bientot ?)
// "  Hello World  " |> trim |> toLowerCase |> split(" ") |> join("-")
```

**Action** : Survoler chaque etape intermediaire dans le pipe pour montrer la propagation des types.

> Chaque fonction dans le pipe recoit le type de retour de la precedente. Les surcharges garantissent que le type est correct a chaque etape. En attendant le pipeline operator (`|>`), cette approche est la plus propre pour la composition fonctionnelle.

### [16:00-21:00] Pattern EventEmitter type-safe

> Construisons un EventEmitter entierement type-safe.

**Action** : Ajouter le code suivant.

```typescript
// EventEmitter type-safe avec generics et mapped types

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventCallback<T> = (payload: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  private listeners = new Map<string, Set<Function>>();

  on<K extends EventKey<Events>>(
    event: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retourne une fonction de desinscription
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  once<K extends EventKey<Events>>(
    event: K,
    callback: EventCallback<Events[K]>
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      callback(payload);
      unsubscribe();
    });
  }

  emit<K extends EventKey<Events>>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  removeAllListeners<K extends EventKey<Events>>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Definition des evenements de l'application
interface AppEvents {
  "user:login": { userId: string; timestamp: Date };
  "user:logout": { userId: string };
  "cart:add": { productId: string; quantity: number };
  "cart:remove": { productId: string };
  "order:placed": { orderId: string; total: number };
}

// Utilisation
const bus = new TypedEventEmitter<AppEvents>();

// Autocompletion sur le nom de l'evenement ET sur le payload
bus.on("user:login", (payload) => {
  console.log(`${payload.userId} connecte a ${payload.timestamp}`);
});

bus.on("cart:add", (payload) => {
  console.log(`Produit ${payload.productId} x${payload.quantity} ajoute`);
});

// Erreurs de type :
// bus.on("user:login", (payload) => {
//   console.log(payload.productId); // Erreur : productId n'existe pas sur user:login
// });
// bus.emit("cart:add", { productId: "p-1" }); // Erreur : quantity manquant

bus.emit("user:login", { userId: "u-1", timestamp: new Date() });
bus.emit("cart:add", { productId: "p-1", quantity: 2 });
```

**Action** : Montrer l'autocompletion du nom d'evenement, puis l'autocompletion du payload dans le callback.

### [21:00-24:00] Recapitulatif

> Resumons les quatre patterns.

```typescript
// Resume des patterns TypeScript :
//
// 1. Result<T, E>
//    - Erreurs explicites dans le systeme de types
//    - Force la gestion des cas succes/echec
//    - Chainable avec map/flatMap
//
// 2. Builder
//    - Construction etape par etape
//    - Validation de completude a la compilation
//    - API fluent avec retour this
//
// 3. pipe()
//    - Composition de fonctions de gauche a droite
//    - Types propages automatiquement
//    - Encourage les fonctions pures
//
// 4. TypedEventEmitter
//    - Evenements types : nom ET payload
//    - Autocompletion dans les callbacks
//    - Desinscription type-safe
```

> Ces quatre patterns exploitent les generics, les conditional types et les discriminated unions pour offrir une experience developpeur exceptionnelle. Ils sont utilises dans les librairies modernes comme Zod (Result), Prisma (Builder), fp-ts (pipe) et mitt (EventEmitter). Dans le prochain screencast, nous les assemblerons dans un projet complet.

## Points d'attention pour l'enregistrement
- Le pattern Result est le plus important — prendre le temps sur le chainage
- Le Builder doit montrer l'erreur quand on oublie un champ obligatoire
- Le pipe necessite de montrer la propagation des types etape par etape
- L'EventEmitter doit montrer l'autocompletion en action (screencast = visuel)
- Executer chaque pattern pour montrer qu'il fonctionne aussi a l'execution
