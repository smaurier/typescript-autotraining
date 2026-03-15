# Screencast 07 — Generics avances : variadic tuples, branded types et builder

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/07-generics-avances.md`
- **Lab associe** : Lab 07
- **Prérequis** : Screencast 06 (generics de base)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/07-generics-avances.ts` pret a etre créé
- [ ] `tsx` installe pour exécuter les exemples

## Script

### [00:00-04:00] Variadic tuple types

> Dans ce screencast, nous allons explorer des patterns génériques avances. Commencons par les variadic tuples, introduits en TypeScript 4.0, qui permettent de manipuler des tuples de taille variable.

**Action** : Créer le fichier `src/07-generics-avances.ts`.

```typescript
// Variadic tuple types
// Spread dans les types de tuples
type Prepend<H, T extends unknown[]> = [H, ...T];

type A = Prepend<string, [number, boolean]>;
// type A = [string, number, boolean]

type Append<T extends unknown[], E> = [...T, E];

type B = Append<[string, number], boolean>;
// type B = [string, number, boolean]

// Concatenation de tuples
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];

type C = Concat<[1, 2], [3, 4]>;
// type C = [1, 2, 3, 4]

// Application concrete : typer une fonction "head" et "tail"
function head<T extends [unknown, ...unknown[]]>(arr: T): T[0] {
  return arr[0];
}

function tail<T extends [unknown, ...unknown[]]>(
  arr: T
): T extends [unknown, ...infer Rest] ? Rest : never {
  const [, ...rest] = arr;
  return rest as any;
}

const tuple = [1, "hello", true] as const;
const h = head(tuple); // type: 1
const t = tail(tuple);  // type: readonly ["hello", true]

console.log(h); // 1
console.log(t); // ["hello", true]
```

**Action** : Survoler les types `A`, `B`, `C` pour montrer les types resolus.

> Les variadic tuples permettent de decrire des operations sur des tuples sans connaître leur taille a l'avance. C'est la base de patterns comme le typage de `pipe` ou `compose`.

### [04:00-09:00] Branded types (types nominaux)

> TypeScript est structurel, mais parfois on veut distinguer des types qui ont la même forme. Les branded types resolvent ce problème.

**Action** : Ajouter le code suivant.

```typescript
// Probleme : des types structurellement identiques mais semantiquement differents
type UserId_Bad = string;
type OrderId_Bad = string;

function getUser(id: UserId_Bad): void { /* ... */ }
function getOrder(id: OrderId_Bad): void { /* ... */ }

// Rien n'empeche de passer un OrderId la ou on attend un UserId !
const orderId: OrderId_Bad = "order-123";
getUser(orderId); // Pas d'erreur... mais c'est un bug !

// Solution : branded types
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type Email = Brand<string, "Email">;

// Fonctions de creation (smart constructors)
function createUserId(id: string): UserId {
  // Validation possible ici
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

function createEmail(email: string): Email {
  if (!email.includes("@")) {
    throw new Error("Email invalide");
  }
  return email as Email;
}

// Maintenant les types sont distincts
function getUserById(id: UserId): void {
  console.log(`Recherche utilisateur : ${id}`);
}

function getOrderById(id: OrderId): void {
  console.log(`Recherche commande : ${id}`);
}

const userId = createUserId("u-001");
const orderIdSafe = createOrderId("o-001");

getUserById(userId);        // OK
getOrderById(orderIdSafe);  // OK
// getUserById(orderIdSafe); // Erreur ! OrderId n'est pas UserId
// getUserById("u-001");     // Erreur ! string n'est pas UserId
```

**Action** : Decommenter les deux dernières lignes pour montrer les erreurs.

> Le champ `__brand` n'existe pas a l'exécution — c'est purement une astuce au niveau des types. Mais elle force a passer par les fonctions de création, ce qui ajoute une couche de sécurité et de validation.

### [09:00-14:00] Builder pattern type-safe

> Le builder pattern est un cas d'usage parfait pour les generics avances. Voyons comment rendre un builder entièrement type-safe.

**Action** : Ajouter le code suivant.

```typescript
// Builder pattern type-safe avec tracking des champs remplis
interface QueryConfig {
  table: string;
  fields: string[];
  where: string;
  limit: number;
}

type BuilderState = {
  [K in keyof QueryConfig]?: true;
};

class QueryBuilder<State extends BuilderState = {}> {
  private config: Partial<QueryConfig> = {};

  from(table: string): QueryBuilder<State & { table: true }> {
    this.config.table = table;
    return this as any;
  }

  select(...fields: string[]): QueryBuilder<State & { fields: true }> {
    this.config.fields = fields;
    return this as any;
  }

  where(condition: string): QueryBuilder<State & { where: true }> {
    this.config.where = condition;
    return this as any;
  }

  limit(n: number): QueryBuilder<State & { limit: true }> {
    this.config.limit = n;
    return this as any;
  }

  // build() n'est disponible que si table et fields sont definis
  build(
    this: QueryBuilder<State & { table: true; fields: true }>
  ): string {
    const c = this.config as QueryConfig;
    let sql = `SELECT ${c.fields.join(", ")} FROM ${c.table}`;
    if (c.where) sql += ` WHERE ${c.where}`;
    if (c.limit) sql += ` LIMIT ${c.limit}`;
    return sql;
  }
}

// Usage correct
const query = new QueryBuilder()
  .from("users")
  .select("name", "email")
  .where("active = true")
  .limit(10)
  .build();

console.log(query);
// "SELECT name, email FROM users WHERE active = true LIMIT 10"

// Erreur a la compilation si on oublie from() ou select()
// new QueryBuilder().select("name").build();
// Erreur : Property 'build' does not exist...
```

**Action** : Montrer l'erreur quand on appelle `.build()` sans `.from()`. Montrer l'autocompletion à chaque étape de la chaine.

> Le type `State` accumule les champs remplis à chaque étape. La méthode `build()` vérifié à la compilation que les champs obligatoires sont presents. C'est un pattern puissant pour les API fluent.

### [14:00-17:30] Generics conditionnels et inference

> Combinons les generics avec les types conditionnels pour un apercu de ce que nous approfondirons plus tard.

**Action** : Ajouter le code suivant.

```typescript
// Generic avec type conditionnel
type ArrayOrSingle<T> = T extends unknown[] ? T : T[];

function ensureArray<T>(value: T): ArrayOrSingle<T> {
  if (Array.isArray(value)) {
    return value as ArrayOrSingle<T>;
  }
  return [value] as ArrayOrSingle<T>;
}

const arr1 = ensureArray("hello");   // type: string[]
const arr2 = ensureArray([1, 2, 3]); // type: number[]

// Pattern : extraire le type d'element d'un tableau
type ElementOf<T> = T extends (infer E)[] ? E : never;

type X = ElementOf<string[]>;   // string
type Y = ElementOf<number[]>;   // number
type Z = ElementOf<string>;     // never

// Pattern : rendre certaines proprietes requises
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

interface Options {
  host?: string;
  port?: number;
  ssl?: boolean;
}

type ServerOptions = RequireFields<Options, "host" | "port">;

const serverOpts: ServerOptions = {
  host: "localhost",
  port: 3000,
  // ssl est toujours optionnel
};
```

**Action** : Survoler `ServerOptions` pour montrer le type resolu.

### [17:30-19:30] Récapitulatif

> Faisons le point sur ce que nous avons couvert.

```typescript
// Resume des patterns avances
// 1. Variadic tuples : manipuler des tuples de taille variable
// 2. Branded types : distinguer des types structurellement identiques
// 3. Builder pattern : API fluent avec validation a la compilation
// 4. Generics conditionnels : types qui dependent d'autres types

// Ces patterns sont la base de librairies comme Zod, Prisma, tRPC
// qui offrent une experience developpeur exceptionnelle grace aux generics.
```

> En résumé : les generics avances transforment TypeScript d'un simple langage type en un veritable système de programmation au niveau des types. Les branded types ajoutent une sécurité nominale, le builder pattern valide les API à la compilation, et les types conditionnels ouvrent la voie à la meta-programmation. Les prochains screencasts approfondiront ces concepts.

## Points d'attention pour l'enregistrement
- Les variadic tuples sont abstraits — utiliser `as const` et montrer les types resolus
- Pour les branded types, bien expliquer le problème avant la solution
- Le builder pattern est l'exemple le plus concret — prendre le temps de montrer l'erreur de compilation
- Mentionner Zod, Prisma et tRPC comme exemples concrets de ces patterns en production
- Avertir que certains `as any` dans le builder sont nécessaires pour l'implementation interne
