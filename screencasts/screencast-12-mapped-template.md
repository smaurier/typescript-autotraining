# Screencast 12 — Mapped types, template literals et key remapping

## Informations
- **Duree estimee** : 20-25 min
- **Module** : `modules/12-mapped-template.md`
- **Lab associe** : Lab 12
- **Prerequis** : Screencast 11 (conditional types)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/12-mapped-template.ts` pret a etre cree
- [ ] Bonne comprehension de `keyof`, generics et conditional types

## Script

### [00:00-04:30] Mapped types fondamentaux

> Les mapped types permettent de transformer un type en iterant sur ses cles. C'est le mecanisme derriere `Partial`, `Readonly` et `Required`. Dans ce screencast, nous allons aller bien plus loin.

**Action** : Creer le fichier `src/12-mapped-template.ts`.

```typescript
// Mapped type de base : iterer sur les cles
type Stringify<T> = {
  [K in keyof T]: string;
};

interface User {
  id: number;
  name: string;
  active: boolean;
}

type StringifiedUser = Stringify<User>;
// { id: string; name: string; active: string }

// Mapped type avec transformation de valeur
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// {
//   getId: () => number;
//   getName: () => string;
//   getActive: () => boolean;
// }

// Mapped type avec modification de mutabilite et optionalite
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type Concrete<T> = {
  [K in keyof T]-?: T[K];
};

// Mapper les valeurs avec un conditional type
type NullableValues<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = NullableValues<User>;
// { id: number | null; name: string | null; active: boolean | null }
```

**Action** : Survoler `UserGetters` pour montrer les proprietes renommees avec les prefixes `get`.

> La syntaxe `[K in keyof T]` est le coeur des mapped types. On peut modifier les cles (avec `as`), les valeurs, l'optionalite (`?` / `-?`) et la mutabilite (`readonly` / `-readonly`).

### [04:30-10:00] Key remapping avec as

> TypeScript 4.1 a introduit le key remapping : la possibilite de transformer les noms de cles lors du mapping.

**Action** : Ajouter le code suivant.

```typescript
// Key remapping : transformer les cles avec "as"

// Prefixer toutes les cles
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}_${string & K}`]: T[K];
};

type PrefixedUser = Prefixed<User, "user">;
// { user_id: number; user_name: string; user_active: boolean }

// Filtrer les cles par type de valeur
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type StringProps = OnlyStrings<User>;
// { name: string } — seule propriete dont la valeur est string

// Filtrer par type de cle
type OnlyMethods<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
};

class UserService {
  name = "UserService";
  version = 1;
  findById(id: string): User | null { return null; }
  create(data: Partial<User>): User { return {} as User; }
  delete(id: string): void {}
}

type ServiceMethods = OnlyMethods<UserService>;
// { findById: (id: string) => User | null; create: ...; delete: ... }

// Exclure certaines cles
type WithoutId<T> = {
  [K in keyof T as K extends "id" ? never : K]: T[K];
};

type UserWithoutId = WithoutId<User>;
// { name: string; active: boolean }

// Creer des setters a partir d'un type
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type UserSetters = Setters<User>;
// {
//   setId: (value: number) => void;
//   setName: (value: string) => void;
//   setActive: (value: boolean) => void;
// }

// Combiner getters et setters
type GettersAndSetters<T> = Getters<T> & Setters<T>;

type UserAccessors = GettersAndSetters<User>;
```

**Action** : Survoler `ServiceMethods` pour montrer que seules les methodes restent. Montrer `UserSetters` avec les noms de cles transformes.

> Le key remapping avec `as` est extremement flexible. La cle `never` supprime la propriete, un template literal transforme le nom, et un conditional type filtre selon le type de la valeur. C'est ainsi que des librairies comme Prisma generent des types a partir d'un schema.

### [10:00-16:00] Template literal types

> Les template literal types permettent de manipuler des chaines au niveau des types. Combines avec les mapped types, ils sont redoutablement puissants.

**Action** : Ajouter le code suivant.

```typescript
// Template literal types de base
type Greeting = `Hello, ${string}`;
const g1: Greeting = "Hello, Alice";   // OK
const g2: Greeting = "Hello, Bob";     // OK
// const g3: Greeting = "Hi, Alice";   // Erreur

// Union dans un template literal
type Color = "red" | "green" | "blue";
type Size = "small" | "medium" | "large";
type Variant = `${Size}-${Color}`;
// "small-red" | "small-green" | "small-blue"
// | "medium-red" | "medium-green" | "medium-blue"
// | "large-red" | "large-green" | "large-blue"

// 9 combinaisons generees automatiquement !

// Parsing de template literals avec infer
type ExtractParam<S extends string> =
  S extends `${string}:${infer Param}` ? Param : never;

type P1 = ExtractParam<"/users/:id">;     // "id"
type P2 = ExtractParam<"/posts/:slug">;   // "slug"
type P3 = ExtractParam<"/about">;          // never

// Pattern plus complexe : extraire tous les parametres d'une route
type ParseRoute<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ParseRoute<`/${Rest}`>
    : S extends `${string}:${infer Param}`
      ? Param
      : never;

type RouteParams = ParseRoute<"/users/:userId/posts/:postId/comments/:commentId">;
// "userId" | "postId" | "commentId"

// Construire un objet de parametres a partir d'une route
type RouteObject<S extends string> = {
  [K in ParseRoute<S>]: string;
};

type UserPostParams = RouteObject<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

// Conversion de cas : camelCase vers snake_case
type CamelToSnake<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Tail extends Uncapitalize<Tail>
      ? `${Lowercase<Head>}${CamelToSnake<Tail>}`
      : `${Lowercase<Head>}_${CamelToSnake<Tail>}`
    : S;

type Snake1 = CamelToSnake<"firstName">;   // "first_name"
type Snake2 = CamelToSnake<"lastName">;     // "last_name"
type Snake3 = CamelToSnake<"createdAt">;    // "created_at"
```

**Action** : Survoler `Variant` pour montrer les 9 combinaisons. Puis montrer `RouteParams` et `UserPostParams`.

> Les template literal types generent des combinaisons cartesiennes avec les unions. Avec `infer`, on peut aussi parser des chaines. C'est du pattern matching au niveau des types.

### [16:00-21:00] Patterns avances et combinaisons

> Combinons mapped types et template literals pour des patterns realistes.

**Action** : Ajouter le code suivant.

```typescript
// Pattern : generer des event handlers types
interface AppEvents {
  userLogin: { userId: string };
  userLogout: { userId: string };
  pageView: { url: string; duration: number };
}

type EventHandlers<Events extends Record<string, any>> = {
  [K in keyof Events as `on${Capitalize<string & K>}`]: (
    payload: Events[K]
  ) => void;
};

type AppEventHandlers = EventHandlers<AppEvents>;
// {
//   onUserLogin: (payload: { userId: string }) => void;
//   onUserLogout: (payload: { userId: string }) => void;
//   onPageView: (payload: { url: string; duration: number }) => void;
// }

// Pattern : convertir les cles d'un objet en snake_case
type SnakeKeys<T> = {
  [K in keyof T as CamelToSnake<string & K>]: T[K];
};

interface ApiUser {
  firstName: string;
  lastName: string;
  emailAddress: string;
  createdAt: Date;
}

type SnakeApiUser = SnakeKeys<ApiUser>;
// {
//   first_name: string;
//   last_name: string;
//   email_address: string;
//   created_at: Date;
// }

// Pattern : deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
  };
}

type FrozenConfig = DeepReadonly<Config>;
// Toutes les proprietes, meme imbriquees, sont readonly
```

**Action** : Survoler `SnakeApiUser` pour montrer les cles converties. Puis survoler `FrozenConfig` pour montrer le readonly profond.

### [21:00-24:00] Recapitulatif et limites

> Resumons et parlons des limites.

```typescript
// Recapitulatif des outils :
//
// Mapped types :
//   [K in keyof T]         — iterer sur les cles
//   [K in keyof T as ...]  — transformer les cles (key remapping)
//   -readonly, -?           — modifier les modificateurs
//   T[K] extends ... ? ...  — transformer les valeurs conditionnellement
//
// Template literal types :
//   `${A}-${B}`             — combinaisons de chaines
//   `${string}:${infer P}` — parsing de chaines
//   Capitalize, Uppercase... — transformation de casse
//
// Limites :
// - La recursion a une profondeur limitee (~50 niveaux)
// - Les types trop complexes ralentissent la compilation
// - Les messages d'erreur deviennent cryptiques
// - Privilegier la lisibilite a la cleverness
```

> En resume : les mapped types et template literal types forment un duo extremement puissant pour la meta-programmation de types. Ils permettent de deriver automatiquement des types a partir d'autres types, d'assurer la coherence entre API et types, et de creer des experiences developpeur exceptionnelles. Mais gardez toujours a l'esprit la lisibilite — un type trop malin est un type inmaintenable.

## Points d'attention pour l'enregistrement
- Le key remapping avec `as` est le concept le plus important — prendre le temps
- Montrer les 9 combinaisons de `Variant` pour illustrer le produit cartesien
- Le parsing de routes est un exemple tres motivant — decomposer pas a pas
- `CamelToSnake` est complexe : l'expliquer caractere par caractere
- Prevenir que ces patterns sont puissants mais a utiliser avec moderation
