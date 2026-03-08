# Screencast 10 — Utility types : usage et reimplementation

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/10-utility-types.md`
- **Lab associe** : Lab 10
- **Prerequis** : Screencast 06 (generics de base)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/10-utility-types.ts` pret a etre cree
- [ ] Documentation TypeScript ouverte en reference (optionnel)

## Script

### [00:00-04:00] Partial, Required et Readonly

> TypeScript fournit un ensemble de types utilitaires integres qui transforment des types existants. Dans ce screencast, nous allons les utiliser puis les reimplementer de zero pour comprendre comment ils fonctionnent.

**Action** : Creer le fichier `src/10-utility-types.ts`.

```typescript
// Interface de base pour nos exemples
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: "admin" | "user";
}

// Partial<T> — rend toutes les proprietes optionnelles
type PartialUser = Partial<User>;
// Equivalent a :
// { id?: string; name?: string; email?: string; age?: number; role?: "admin" | "user" }

function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

const alice: User = { id: "1", name: "Alice", email: "a@b.com", age: 30, role: "admin" };
const updated = updateUser(alice, { age: 31, email: "new@b.com" });

// Required<T> — rend toutes les proprietes requises
interface Config {
  host?: string;
  port?: number;
  ssl?: boolean;
}

type FullConfig = Required<Config>;
// { host: string; port: number; ssl: boolean } — plus rien d'optionnel

// Readonly<T> — rend toutes les proprietes en lecture seule
type FrozenUser = Readonly<User>;
const frozen: FrozenUser = { ...alice };
// frozen.name = "Bob"; // Erreur ! readonly

// Reimplementation depuis zero
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

type MyRequired<T> = {
  [K in keyof T]-?: T[K];  // -? enleve l'optionalite
};

type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

**Action** : Survoler `PartialUser` et `FullConfig` pour montrer les types resolus. Puis montrer que les reimplementations produisent le meme type.

> La syntaxe `[K in keyof T]` est un mapped type — elle itere sur chaque cle de T. Le `?` ajoute l'optionalite, `-?` la retire, et `readonly` ajoute l'immutabilite. C'est la base de tous les utility types.

### [04:00-08:30] Pick, Omit et Record

> Ces trois types sont parmi les plus utilises au quotidien.

**Action** : Ajouter le code suivant.

```typescript
// Pick<T, K> — selectionne certaines proprietes
type UserPreview = Pick<User, "id" | "name">;
// { id: string; name: string }

function displayPreview(user: UserPreview): string {
  return `${user.id}: ${user.name}`;
}

// Omit<T, K> — exclut certaines proprietes
type UserWithoutRole = Omit<User, "role" | "id">;
// { name: string; email: string; age: number }

function createUser(data: Omit<User, "id">): User {
  return { ...data, id: crypto.randomUUID() };
}

// Record<K, V> — cree un objet avec des cles de type K et des valeurs de type V
type UserMap = Record<string, User>;

const users: UserMap = {
  "u-1": alice,
};

// Record avec des cles specifiques
type RolePermissions = Record<User["role"], string[]>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  user: ["read"],
};

// Reimplementation
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type MyOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type MyRecord<K extends PropertyKey, V> = {
  [P in K]: V;
};
```

**Action** : Survoler `UserPreview` et `UserWithoutRole` pour verifier les types. Montrer que `MyPick` et `Pick` sont equivalents.

> `Pick` selectionne, `Omit` exclut, `Record` cree. La reimplementation de `Omit` est interessante : elle utilise `as` pour filtrer les cles — c'est un key remapping, un concept que nous approfondirons plus tard.

### [08:30-13:00] Extract, Exclude, NonNullable et ReturnType

> Ces types operent sur les unions et les fonctions.

**Action** : Ajouter le code suivant.

```typescript
// Exclude<T, U> — enleve les types de T qui sont assignables a U
type AllTypes = string | number | boolean | null | undefined;
type NonNull = Exclude<AllTypes, null | undefined>;
// string | number | boolean

// Extract<T, U> — garde seulement les types de T assignables a U
type Primitives = Extract<AllTypes, string | number>;
// string | number

// NonNullable<T> — enleve null et undefined
type SafeValue = NonNullable<string | null | undefined>;
// string

// ReturnType<T> — extrait le type de retour d'une fonction
function fetchUsers(): Promise<User[]> {
  return Promise.resolve([alice]);
}

type FetchResult = ReturnType<typeof fetchUsers>;
// Promise<User[]>

// Parameters<T> — extrait les types des parametres
type UpdateParams = Parameters<typeof updateUser>;
// [user: User, updates: Partial<User>]

// ConstructorParameters<T>
type DateParams = ConstructorParameters<typeof Date>;

// InstanceType<T>
type DateInstance = InstanceType<typeof Date>;
// Date

// Reimplementations
type MyExclude<T, U> = T extends U ? never : T;

type MyExtract<T, U> = T extends U ? T : never;

type MyNonNullable<T> = T extends null | undefined ? never : T;

type MyReturnType<T extends (...args: any[]) => any> =
  T extends (...args: any[]) => infer R ? R : never;

type MyParameters<T extends (...args: any[]) => any> =
  T extends (...args: infer P) => any ? P : never;
```

**Action** : Survoler chaque type pour montrer le resultat. Puis montrer que les reimplementations fonctionnent identiquement.

> Le mot-cle `infer` est magique : il permet a TypeScript de "deviner" un type dans un conditional type. `ReturnType` dit : "si T est une fonction qui retourne quelque chose, ce quelque chose est R". Nous approfondirons `infer` dans le screencast sur les conditional types.

### [13:00-17:00] Awaited, ThisType et types avances

> Voyons quelques utility types moins connus mais tres utiles.

**Action** : Ajouter le code suivant.

```typescript
// Awaited<T> — deballe les Promise (meme imbriquees)
type A = Awaited<Promise<string>>;             // string
type B = Awaited<Promise<Promise<number>>>;    // number
type C = Awaited<string | Promise<boolean>>;   // string | boolean

// Pratique avec les fonctions async
async function getData(): Promise<{ items: string[] }> {
  return { items: ["a", "b", "c"] };
}

type Data = Awaited<ReturnType<typeof getData>>;
// { items: string[] }

// Uppercase, Lowercase, Capitalize, Uncapitalize (template literal types)
type Upper = Uppercase<"hello">;       // "HELLO"
type Lower = Lowercase<"HELLO">;       // "hello"
type Cap = Capitalize<"hello">;        // "Hello"
type Uncap = Uncapitalize<"Hello">;    // "hello"

// Combinaison de utility types
type ReadonlyPartial<T> = Readonly<Partial<T>>;

type Draft<T> = {
  -readonly [K in keyof T]: T[K];
}; // Enleve readonly

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

const draft: Mutable<FrozenUser> = { ...alice };
draft.name = "Bob"; // OK — readonly a ete enleve
```

**Action** : Survoler chaque type `A`, `B`, `C` pour montrer le deballage des Promises.

### [17:00-19:30] Recapitulatif et tableau de reference

> Faisons un resume visuel de tous les utility types.

```typescript
// Tableau de reference des utility types
//
// Transformation d'objet :
//   Partial<T>          — toutes les proprietes optionnelles
//   Required<T>         — toutes les proprietes requises
//   Readonly<T>         — toutes les proprietes en lecture seule
//   Pick<T, K>          — garde certaines proprietes
//   Omit<T, K>          — enleve certaines proprietes
//   Record<K, V>        — cree un objet type
//
// Manipulation d'union :
//   Exclude<T, U>       — enleve des types d'une union
//   Extract<T, U>       — garde des types d'une union
//   NonNullable<T>      — enleve null et undefined
//
// Fonctions :
//   ReturnType<T>       — type de retour
//   Parameters<T>       — types des parametres
//   ConstructorParameters<T>
//   InstanceType<T>     — type d'instance d'une classe
//
// Promesses :
//   Awaited<T>          — deballe les Promise
//
// Chaines :
//   Uppercase<S>        — majuscules
//   Lowercase<S>        — minuscules
//   Capitalize<S>       — premiere lettre majuscule
//   Uncapitalize<S>     — premiere lettre minuscule
```

> En resume : les utility types de TypeScript sont construits avec trois mecanismes — les mapped types, les conditional types et `infer`. En les reimplementant, vous comprenez le systeme de types en profondeur. C'est la base pour creer vos propres utility types adaptes a vos besoins.

## Points d'attention pour l'enregistrement
- Toujours montrer le type "officiel" puis la reimplementation cote a cote
- Survoler les types resolus dans VS Code pour verifier visuellement
- L'explication de `infer` est un apercu — dire qu'on ira plus loin au screencast 11
- Le tableau final peut etre affiche en split screen comme aide-memoire
- Prendre le temps sur `Omit` avec key remapping — c'est la reimplementation la plus complexe
