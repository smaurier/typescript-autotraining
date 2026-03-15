# Screencast 13 — Programmation au niveau des types : récursion et puzzles

## Informations
- **Duree estimee** : 20-25 min
- **Module** : `modules/13-type-programming.md`
- **Lab associe** : Lab 13
- **Prérequis** : Screencast 11 (conditional types), Screencast 12 (mapped types)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/13-type-programming.ts` pret a etre créé
- [ ] Patience et curiosite (les types deviennent complexes !)

## Script

### [00:00-04:30] Types récursifs

> Le système de types de TypeScript est Turing-complet — on peut theoriquement calculer n'importe quoi au niveau des types. Dans ce screencast, nous allons explorer la récursion de types, l'arithmetique au niveau des types, et résoudre des puzzles.

**Action** : Créer le fichier `src/13-type-programming.ts`.

```typescript
// Types recursifs de base : structures de donnees

// Liste chainee
type LinkedList<T> = {
  value: T;
  next: LinkedList<T> | null;
};

const list: LinkedList<number> = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: null,
    },
  },
};

// Arbre binaire
type BinaryTree<T> = {
  value: T;
  left: BinaryTree<T> | null;
  right: BinaryTree<T> | null;
};

// JSON recursif
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const config: JsonValue = {
  name: "app",
  version: 1,
  features: ["auth", "api"],
  database: {
    host: "localhost",
    port: 5432,
    options: {
      ssl: true,
      pool: [1, 5, 10],
    },
  },
};

// Deep Partial recursif
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[K]>
    : T[K];
};

interface Config {
  server: {
    host: string;
    port: number;
    ssl: { enabled: boolean; cert: string };
  };
}

type PartialConfig = DeepPartial<Config>;
// Toutes les proprietes sont optionnelles, meme les imbriquees
```

**Action** : Survoler `PartialConfig` pour montrer le type resolu avec toutes les propriétés optionnelles en profondeur.

> Les types récursifs referent a eux-memes dans leur définition. C'est naturel pour les structures de donnees comme les arbres et les listes chainees. `DeepPartial` est un utility type récursif très utilise en pratique.

### [04:30-10:30] Arithmetique au niveau des types

> On peut faire de l'arithmetique au niveau des types en utilisant la longueur des tuples.

**Action** : Ajouter le code suivant.

```typescript
// L'astuce : utiliser la longueur d'un tuple comme nombre

// Creer un tuple de N elements
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Tuple3 = BuildTuple<3>;  // [unknown, unknown, unknown]
type Tuple5 = BuildTuple<5>;  // [unknown, unknown, unknown, unknown, unknown]

// Addition : concatener deux tuples
type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]["length"];

type Sum = Add<3, 4>;  // 7
type Sum2 = Add<10, 5>; // 15

// Soustraction : enlever des elements d'un tuple
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest]
    ? Rest["length"]
    : never;

type Diff = Subtract<10, 3>; // 7
type Diff2 = Subtract<5, 5>; // 0

// Comparaison
type IsGreaterThan<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest]
    ? Rest extends []
      ? false
      : true
    : false;

type GT1 = IsGreaterThan<5, 3>;  // true
type GT2 = IsGreaterThan<3, 5>;  // false
type GT3 = IsGreaterThan<5, 5>;  // false

// Multiplication (recursive)
type Multiply<A extends number, B extends number, Acc extends unknown[] = []> =
  B extends 0
    ? Acc["length"]
    : Multiply<A, Subtract<B, 1> & number, [...Acc, ...BuildTuple<A>]>;

type Product = Multiply<3, 4>; // 12
type Product2 = Multiply<5, 6>; // 30
```

**Action** : Survoler `Sum`, `Diff` et `Product` pour montrer les résultats calcules à la compilation.

> C'est fascinant : on fait des calculs mathematiques sans aucun code runtime — tout est resolu à la compilation. La limite est la profondeur de récursion (environ 1000 pour les tuples). Ce n'est pas utile au quotidien, mais ça montre la puissance du système de types.

### [10:30-16:00] Manipulation avancee de tuples

> Les tuples sont la structure de donnees clé pour la programmation au niveau des types.

**Action** : Ajouter le code suivant.

```typescript
// Longueur d'un tuple
type Length<T extends unknown[]> = T["length"];

type L1 = Length<[1, 2, 3]>;   // 3
type L2 = Length<[]>;           // 0

// Reverse d'un tuple
type Reverse<T extends unknown[]> =
  T extends [infer First, ...infer Rest]
    ? [...Reverse<Rest>, First]
    : [];

type Rev = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]

// Flatten un tuple (un niveau)
type FlattenTuple<T extends unknown[]> =
  T extends [infer First, ...infer Rest]
    ? First extends unknown[]
      ? [...First, ...FlattenTuple<Rest>]
      : [First, ...FlattenTuple<Rest>]
    : [];

type Flat = FlattenTuple<[[1, 2], [3, 4], [5]]>;
// [1, 2, 3, 4, 5]

// Unique : supprimer les doublons
type Includes<T extends unknown[], U> =
  T extends [infer First, ...infer Rest]
    ? Equal<First, U> extends true
      ? true
      : Includes<Rest, U>
    : false;

// Helper : verifier l'egalite exacte de deux types
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type Unique<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer First, ...infer Rest]
    ? Includes<Acc, First> extends true
      ? Unique<Rest, Acc>
      : Unique<Rest, [...Acc, First]>
    : Acc;

type Uniq = Unique<[1, 2, 3, 2, 1, 4]>;
// [1, 2, 3, 4]
```

**Action** : Survoler `Rev`, `Flat` et `Uniq` pour montrer les types resolus.

> Ces manipulations de tuples sont la base de type-challenges et de librairies avancees. La technique clé est toujours la même : pattern matching avec `infer`, decomposition en `First` et `Rest`, et récursion.

### [16:00-21:00] Puzzles de types

> Resolvons quelques puzzles classiques de type-challenges.

**Action** : Ajouter le code suivant.

```typescript
// Puzzle 1 : TrimLeft — supprimer les espaces a gauche d'un string
type TrimLeft<S extends string> =
  S extends ` ${infer Rest}` | `\n${infer Rest}` | `\t${infer Rest}`
    ? TrimLeft<Rest>
    : S;

type Trimmed = TrimLeft<"  hello  ">;  // "hello  "

// Puzzle 2 : Split — decouper une chaine
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

type Parts = Split<"a-b-c-d", "-">;  // ["a", "b", "c", "d"]

// Puzzle 3 : Join — inverse de Split
type Join<T extends string[], D extends string> =
  T extends []
    ? ""
    : T extends [infer First extends string]
      ? First
      : T extends [infer First extends string, ...infer Rest extends string[]]
        ? `${First}${D}${Join<Rest, D>}`
        : never;

type Joined = Join<["a", "b", "c"], "-">; // "a-b-c"

// Puzzle 4 : ReplaceAll au niveau des types
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;

type Replaced = ReplaceAll<"hello world hello", "hello", "hi">;
// "hi world hi"

// Puzzle 5 : Type-safe path accessor
type Get<T, Path extends string> =
  Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? Get<T[Key], Rest>
      : never
    : Path extends keyof T
      ? T[Path]
      : never;

interface NestedObj {
  user: {
    name: string;
    address: {
      city: string;
      zip: number;
    };
  };
}

type City = Get<NestedObj, "user.address.city">;  // string
type Zip = Get<NestedObj, "user.address.zip">;    // number
type Bad = Get<NestedObj, "user.phone">;           // never
```

**Action** : Decomposer chaque puzzle en montrant la résolution pas a pas.

### [21:00-24:00] Limites et bonnes pratiques

> Avant de conclure, parlons des limites.

```typescript
// Limites de la programmation au niveau des types :
//
// 1. Profondeur de recursion : ~50 pour les types conditionnels,
//    ~1000 pour les tuples
//
// 2. Performance : les types tres complexes ralentissent VS Code
//    et la compilation
//
// 3. Messages d'erreur : deviennent illegibles avec des types profonds
//
// 4. Maintenabilite : un collegue doit pouvoir comprendre le type
//
// Quand utiliser ces techniques :
// - Librairies publiques (DX pour les utilisateurs)
// - Validation de schemas (Zod, io-ts)
// - ORM type-safe (Prisma, Drizzle)
// - Routage type-safe (tRPC, Hono)
//
// Quand NE PAS les utiliser :
// - Code applicatif quotidien
// - Quand un type simple suffit
// - Quand ca rend le code illisible
```

> En résumé : TypeScript est un langage de programmation au niveau des types. Les types récursifs, l'arithmetique de tuples et le pattern matching avec `infer` permettent des abstractions impressionnantes. Mais utilisez ces pouvoirs avec sagesse — la complexite au niveau des types doit servir la simplicite au niveau du code.

## Points d'attention pour l'enregistrement
- Les puzzles sont le coeur du screencast — les decomposer pas a pas
- Montrer les types resolus à chaque étape intermédiaire
- L'arithmetique de tuples est spectaculaire mais academic — le mentionner
- `Equal<A, B>` est un helper non trivial — ne pas s'attarder sur son implementation
- Mentionner type-challenges.github.io pour ceux qui veulent aller plus loin
