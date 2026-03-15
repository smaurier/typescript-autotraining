# Screencast 11 — Types conditionnels, infer et distributivite

## Informations
- **Duree estimee** : 20-25 min
- **Module** : `modules/11-conditional-types.md`
- **Lab associe** : Lab 11
- **Prérequis** : Screencast 10 (utility types)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/11-conditional.ts` pret a etre créé
- [ ] Bonne comprehension des generics et de `keyof`

## Script

### [00:00-04:30] Introduction aux types conditionnels

> Les types conditionnels sont l'équivalent du `if/else` au niveau des types. Ils permettent de créer des types qui changent en fonction d'une condition. C'est l'un des mécanismes les plus puissants — et les plus deroutants — de TypeScript.

**Action** : Créer le fichier `src/11-conditional.ts`.

```typescript
// Syntaxe de base : T extends U ? X : Y
// "Si T est assignable a U, alors le type est X, sinon Y"

type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<"hello">;  // true ("hello" extends string)

// Exemple concret : aplatir un type
type Flatten<T> = T extends Array<infer U> ? U : T;

type D = Flatten<string[]>;    // string
type E = Flatten<number[][]>;  // number[] (un seul niveau)
type F = Flatten<string>;      // string (pas un tableau)

// Conditional type dans une fonction
function process<T extends string | number>(
  value: T
): T extends string ? string : number {
  if (typeof value === "string") {
    return value.toUpperCase() as any;
  }
  return (value * 2) as any;
}

const r1 = process("hello"); // type: string
const r2 = process(42);       // type: number
```

**Action** : Survoler les types `A` a `F` pour montrer les types resolus. Expliquer la syntaxe ternaire au niveau des types.

> La syntaxe est identique a l'operateur ternaire JavaScript, mais elle opere au niveau des types. `T extends U` est la condition — elle vérifié si T est assignable a U.

### [04:30-10:00] Le mot-clé infer

> `infer` est le mécanisme qui permet d'extraire un type a l'interieur d'un conditional type. C'est comme une capture de groupe dans une regex.

**Action** : Ajouter le code suivant.

```typescript
// infer : "capturer" un type dans un pattern

// Extraire le type de retour d'une fonction
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = MyReturnType<() => string>;           // string
type R2 = MyReturnType<(x: number) => boolean>; // boolean
type R3 = MyReturnType<string>;                  // never

// Extraire le type des parametres
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never;

type P1 = FirstParam<(name: string, age: number) => void>; // string
type P2 = FirstParam<() => void>;                            // never

// Extraire le type d'element d'une Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type U1 = UnwrapPromise<Promise<string>>;  // string
type U2 = UnwrapPromise<Promise<number[]>>; // number[]
type U3 = UnwrapPromise<string>;            // string

// Deep unwrap : deballer recursivement
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;

type DU1 = DeepUnwrap<Promise<Promise<Promise<string>>>>; // string

// infer dans des structures complexes
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }
```

**Action** : Survoler `Params` pour montrer l'extraction des paramètres de route. C'est un usage concret impressionnant.

> `infer` permet de "deconstruire" un type. On peut extraire le type de retour d'une fonction, l'élément d'un tableau, le contenu d'une Promise, ou même parser des template literals. C'est la base de librairies comme Zod et tRPC.

### [10:00-15:30] Distributivite

> Quand un conditional type recoit une union, il se distribue sur chaque membre. C'est un comportement crucial à comprendre.

**Action** : Ajouter le code suivant.

```typescript
// Distributivite des conditional types
type ToArray<T> = T extends any ? T[] : never;

// Avec une union, le type se distribue :
type G = ToArray<string | number>;
// = ToArray<string> | ToArray<number>
// = string[] | number[]
// PAS (string | number)[]

// Preuve :
type Distributed = string[] | number[];      // ce qu'on obtient
type NotDistributed = (string | number)[];   // ce qu'on pourrait attendre

// Pour eviter la distribution : encadrer avec des crochets
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never;

type H = ToArrayNoDistribute<string | number>;
// = (string | number)[]  — pas de distribution

// La distribution en pratique : Exclude et Extract
type MyExclude<T, U> = T extends U ? never : T;

type I = MyExclude<"a" | "b" | "c", "a" | "c">;
// Distribue :
// = ("a" extends "a" | "c" ? never : "a")
// | ("b" extends "a" | "c" ? never : "b")
// | ("c" extends "a" | "c" ? never : "c")
// = never | "b" | never
// = "b"

type MyExtract<T, U> = T extends U ? T : never;

type J = MyExtract<string | number | boolean, string | boolean>;
// = string | boolean

// Distribution avec des generics vs sans
type IsNever<T> = T extends never ? true : false;
type K = IsNever<never>; // never ! (pas true — c'est un piege)

// Pourquoi ? never est une union vide, la distribution ne produit rien
// Solution :
type IsNeverFixed<T> = [T] extends [never] ? true : false;
type L = IsNeverFixed<never>; // true
```

**Action** : Montrer le type `K` qui est `never` au lieu de `true`, puis montrer la correction avec `IsNeverFixed`.

> La distributivite est le piege numéro un des conditional types. Retenez cette regle : quand le type teste est un paramètre de type nu (bare type parameter) et qu'il recoit une union, le conditional type se distribue. Encadrez avec `[T]` pour l'empecher.

### [15:30-20:30] Patterns avances avec infer et conditionnels

> Combinons tout ce que nous avons vu pour des patterns avances.

**Action** : Ajouter le code suivant.

```typescript
// Pattern : rendre certaines proprietes optionnelles
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface User2 {
  id: string;
  name: string;
  email: string;
  age: number;
}

type CreateUserInput = PartialBy<User2, "id" | "age">;
// { name: string; email: string; id?: string; age?: number }

// Pattern : extraire les types de methodes d'une classe
type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

class UserService {
  name = "UserService";
  findById(id: string): User2 | null { return null; }
  create(data: Omit<User2, "id">): User2 { return {} as User2; }
  delete(id: string): void {}
}

type Methods = MethodNames<UserService>;
// "findById" | "create" | "delete" (exclut "name")

// Pattern : type-safe event emitter
type EventMap = {
  login: { userId: string; timestamp: Date };
  logout: { userId: string };
  error: { message: string; code: number };
};

type EventHandler<T> = (payload: T) => void;

class TypedEmitter<Events extends Record<string, any>> {
  private handlers = new Map<string, Function[]>();

  on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const existing = this.handlers.get(event as string) || [];
    existing.push(handler);
    this.handlers.set(event as string, existing);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const handlers = this.handlers.get(event as string) || [];
    handlers.forEach((h) => h(payload));
  }
}

const emitter = new TypedEmitter<EventMap>();

emitter.on("login", (payload) => {
  // payload est automatiquement { userId: string; timestamp: Date }
  console.log(`Login: ${payload.userId}`);
});

// emitter.on("login", (payload) => {
//   console.log(payload.code); // Erreur ! 'code' n'existe pas sur login
// });

emitter.emit("error", { message: "Oops", code: 500 }); // OK
// emitter.emit("error", { message: "Oops" }); // Erreur : 'code' manquant
```

**Action** : Montrer l'autocompletion du premier argument de `on()` (les noms d'événements) et du payload dans le callback.

### [20:30-24:00] Exercice récapitulatif et conclusion

> Terminons par un exercice de synthese.

```typescript
// Exercice : creer un type qui extrait les types de retour de toutes
// les methodes d'un objet

type MethodReturnTypes<T> = {
  [K in MethodNames<T>]: T[K] extends (...args: any[]) => infer R ? R : never;
};

type ServiceReturns = MethodReturnTypes<UserService>;
// {
//   findById: User2 | null;
//   create: User2;
//   delete: void;
// }
```

**Action** : Construire ce type pas a pas en decomposant chaque étape.

> En résumé : les conditional types, `infer` et la distributivite forment le moteur de la meta-programmation en TypeScript. Avec ces outils, vous pouvez créer des abstractions de types aussi expressives que du code runtime. Mais attention à la complexite : un type trop complexe devient illisible. Privilegiez toujours la clarte.

## Points d'attention pour l'enregistrement
- La distributivite est le point le plus delicat : utiliser des exemples concrets pas a pas
- Le piege `IsNever<never>` est celebre — bien prendre le temps de l'expliquer
- L'exemple du `TypedEmitter` est très motivant — montrer l'autocompletion en action
- Decomposer `ExtractRouteParams` étape par étape pour ne pas perdre le spectateur
- Rappeler que ces concepts seront utilises dans les screencasts suivants
