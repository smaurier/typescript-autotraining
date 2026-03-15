# 11 — Conditional Types & infer

> **Duree estimee** : 5 heures
> **Difficulte** : 4/5
> **Prérequis** : Generics, utility types, unions, intersections
> **Objectifs** :
> - Comprendre le fonctionnement des conditional types
> - Maîtriser le mot-clé `infer` pour extraire des sous-types
> - Comprendre la distribution des conditional types
> - Implementer des types utilitaires avances

---

## Introduction

Les **conditional types** sont l'équivalent des instructions `if/else` au niveau des types. Ils permettent de choisir un type en fonction d'une condition, ce qui ouvre la porte à une programmation de types extremement puissante.

### Analogie

Imaginez un **aiguillage de train** : selon les caracteristiques du train (type, destination, poids), l'aiguillage l'oriente sur une voie ou une autre. Les conditional types font la même chose avec les types : selon qu'un type satisfait une condition, on obtient un type ou un autre.

---

## Syntaxe de base

### La forme fondamentale

```typescript
// Syntaxe : T extends U ? X : Y
// Si T est assignable a U, le type est X, sinon Y

type EstChaine<T> = T extends string ? true : false;

type Test1 = EstChaine<string>;   // true
type Test2 = EstChaine<number>;   // false
type Test3 = EstChaine<"hello">;  // true (un literal string est un string)
```

### Avec des generics

```typescript
// Un type conditionnel generique tres utile
type SiTableau<T> = T extends any[] ? "tableau" : "autre";

type R1 = SiTableau<string[]>;   // "tableau"
type R2 = SiTableau<number>;     // "autre"
type R3 = SiTableau<[1, 2, 3]>;  // "tableau" (un tuple est un tableau)

// Conditionnel avec des types plus complexes
type EstFonction<T> = T extends (...args: any[]) => any ? true : false;

type F1 = EstFonction<() => void>;           // true
type F2 = EstFonction<(x: number) => string>; // true
type F3 = EstFonction<string>;                // false
```

### Conditionnel imbrique

```typescript
// On peut imbriquer les conditionnels comme des if/else if/else
type TypeDe<T> =
  T extends string ? "chaine" :
  T extends number ? "nombre" :
  T extends boolean ? "booleen" :
  T extends undefined ? "undefined" :
  T extends null ? "null" :
  T extends any[] ? "tableau" :
  T extends (...args: any[]) => any ? "fonction" :
  "objet";

type T1 = TypeDe<string>;       // "chaine"
type T2 = TypeDe<42>;           // "nombre"
type T3 = TypeDe<true>;         // "booleen"
type T4 = TypeDe<number[]>;     // "tableau"
type T5 = TypeDe<() => void>;   // "fonction"
type T6 = TypeDe<{ a: 1 }>;     // "objet"
```

---

## Conditional types distributifs

### Le comportement par defaut

Quand un conditional type est applique à une **union**, il se **distribue** automatiquement sur chaque membre de l'union. C'est l'un des comportements les plus importants (et parfois deroutants) de TypeScript.

```typescript
type EstChaine<T> = T extends string ? true : false;

// Avec une union, le conditionnel est applique a CHAQUE membre
type R = EstChaine<string | number>;
// Se decompose en :
// EstChaine<string> | EstChaine<number>
// = true | false
// = boolean  (car true | false = boolean)
```

### Comment la distribution fonctionne étape par étape

```typescript
// Prenons Exclude comme exemple
type Exclude<T, U> = T extends U ? never : T;

type Resultat = Exclude<"a" | "b" | "c" | "d", "a" | "c">;

// Etape 1 : Distribution sur chaque membre de T
// = ("a" extends "a" | "c" ? never : "a")
// | ("b" extends "a" | "c" ? never : "b")
// | ("c" extends "a" | "c" ? never : "c")
// | ("d" extends "a" | "c" ? never : "d")

// Etape 2 : Evaluation de chaque branche
// = never | "b" | never | "d"

// Etape 3 : Simplification (never disparait des unions)
// = "b" | "d"
```

### Analogie de la distribution

Imaginez un **tapis roulant dans une usine** : chaque élément de l'union passe individuellement devant un capteur (la condition `extends`), et selon le résultat, il est envoye dans un bac ou un autre. A la fin, on reunit tous les éléments des bacs pour former la nouvelle union.

### Quand la distribution se produit-elle ?

La distribution ne se produit **que** quand :
1. Le type conditionnel utilise un **paramètre de type générique nu** (naked type parameter)
2. Ce paramètre est directement teste avec `extends`

```typescript
// Distribution : T est un parametre generique nu
type Distributif<T> = T extends string ? "oui" : "non";
type R1 = Distributif<string | number>; // "oui" | "non"

// PAS de distribution : T est enveloppe dans un tuple
type NonDistributif<T> = [T] extends [string] ? "oui" : "non";
type R2 = NonDistributif<string | number>; // "non"
// Car [string | number] n'est PAS assignable a [string]
```

---

## Empecher la distribution

### Avec la technique du tuple

```typescript
// Parfois on veut evaluer l'union ENTIERE, pas chaque membre
type EstJamais<T> = T extends never ? true : false;

// Probleme : avec never (union vide), le conditionnel ne s'execute jamais
type R1 = EstJamais<never>; // never (pas true !)

// Solution : envelopper dans un tuple pour empecher la distribution
type EstVraimentJamais<T> = [T] extends [never] ? true : false;

type R2 = EstVraimentJamais<never>;    // true
type R3 = EstVraimentJamais<string>;   // false
```

### Exemple pratique : vérifier si un type est une union

```typescript
// Ce type detecte si T est un type union
type EstUnion<T, Copie = T> =
  T extends unknown
    ? [Copie] extends [T]
      ? false
      : true
    : never;

// Comment ca marche :
// Si T = string | number, la distribution donne :
//   (string extends unknown ? [string | number] extends [string] ? false : true)
// | (number extends unknown ? [string | number] extends [number] ? false : true)
// = true | true = true

// Si T = string (pas une union) :
//   string extends unknown ? [string] extends [string] ? false : true
// = false

type U1 = EstUnion<string | number>;  // true
type U2 = EstUnion<string>;           // false
type U3 = EstUnion<1 | 2 | 3>;        // true
```

---

## Le mot-clé `infer`

### Principe

Le mot-clé `infer` permet de **capturer** (extraire) un sous-type a l'interieur d'une condition `extends`. C'est comme declarer une variable de type qui sera automatiquement remplie par TypeScript.

### Analogie

Pensez a `infer` comme à un **trou dans un puzzle** : vous presentez votre type au puzzle (la condition `extends`), et si la forme correspond, TypeScript remplit le trou avec le type qui manquait.

### Syntaxe de base

```typescript
// infer R declare une "variable de type" R dans la branche true
type ExtraireRetour<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = ExtraireRetour<() => string>;           // string
type R2 = ExtraireRetour<(x: number) => boolean>; // boolean
type R3 = ExtraireRetour<string>;                  // never (pas une fonction)
```

---

## Usages courants de `infer`

### Extraire le type de retour d'une fonction

```typescript
// C'est exactement l'implementation de ReturnType<T>
type MonReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

function calculer(a: number, b: number): { somme: number; produit: number } {
  return { somme: a + b, produit: a * b };
}

type Resultat = MonReturnType<typeof calculer>;
// { somme: number; produit: number }
```

### Extraire les paramètres d'une fonction

```typescript
// Implementation de Parameters<T>
type MonParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

function enregistrer(nom: string, age: number, actif: boolean): void {}

type Params = MonParameters<typeof enregistrer>;
// [nom: string, age: number, actif: boolean]

// Extraire un parametre specifique
type PremierParam<T extends (...args: any) => any> =
  T extends (premier: infer P, ...reste: any) => any ? P : never;

type P1 = PremierParam<typeof enregistrer>; // string
```

### Extraire le type d'élément d'un tableau

```typescript
// Extraire le type des elements d'un tableau
type ElementDe<T> = T extends (infer E)[] ? E : never;

type E1 = ElementDe<string[]>;        // string
type E2 = ElementDe<number[]>;        // number
type E3 = ElementDe<(string | number)[]>; // string | number

// Version plus robuste qui gere aussi les tableaux readonly
type ElementDeRobuste<T> =
  T extends readonly (infer E)[] ? E : never;

type E4 = ElementDeRobuste<readonly string[]>; // string
```

### Extraire le contenu d'une Promise

```typescript
// Extraire le type a l'interieur d'une Promise
type DecompresserPromise<T> =
  T extends Promise<infer C> ? C : T;

type P1 = DecompresserPromise<Promise<string>>;  // string
type P2 = DecompresserPromise<Promise<number[]>>; // number[]
type P3 = DecompresserPromise<string>;             // string (pas une Promise)

// Version recursive pour les Promises imbriquees
type DecompresserPromiseProfond<T> =
  T extends Promise<infer C>
    ? DecompresserPromiseProfond<C>
    : T;

type P4 = DecompresserPromiseProfond<Promise<Promise<Promise<string>>>>;
// string
```

### Extraire des types à partir de structures complexes

```typescript
// Extraire le type de la propriete "data" si elle existe
type ExtraireDonnees<T> =
  T extends { data: infer D } ? D : never;

type D1 = ExtraireDonnees<{ data: string[]; status: number }>;
// string[]

type D2 = ExtraireDonnees<{ data: { nom: string }; erreur: null }>;
// { nom: string }

type D3 = ExtraireDonnees<{ status: number }>;
// never (pas de propriete "data")

// Extraire les types de cle et valeur d'un Map
type ExtraireCleValeur<T> =
  T extends Map<infer K, infer V> ? { cle: K; valeur: V } : never;

type MV = ExtraireCleValeur<Map<string, number>>;
// { cle: string; valeur: number }
```

---

## Infer dans les template literal types

```typescript
// Extraire des parties d'une chaine
type ExtrairePrefixe<T extends string> =
  T extends `${infer Prefixe}-${string}` ? Prefixe : never;

type Pref1 = ExtrairePrefixe<"btn-primary">;  // "btn"
type Pref2 = ExtrairePrefixe<"card-header">;   // "card"
type Pref3 = ExtrairePrefixe<"simple">;         // never

// Extraire les deux parties
type Decouper<T extends string> =
  T extends `${infer Gauche}-${infer Droite}`
    ? { gauche: Gauche; droite: Droite }
    : never;

type D1 = Decouper<"hello-world">;
// { gauche: "hello"; droite: "world" }

// Parser un chemin d'URL
type ExtraireRoute<T extends string> =
  T extends `/${infer Segment}/${infer Reste}`
    ? [Segment, ...ExtraireRouteArray<Reste>]
    : T extends `/${infer Segment}`
    ? [Segment]
    : T extends `${infer Segment}/${infer Reste}`
    ? [Segment, ...ExtraireRouteArray<Reste>]
    : [T];

type ExtraireRouteArray<T extends string> = ExtraireRoute<T>;

type Route1 = ExtraireRoute<"/api/utilisateurs/123">;
// ["api", "utilisateurs", "123"]
```

---

## Pattern matching avance avec infer

### Inferrer dans les tuples

```typescript
// Premier et dernier element d'un tuple
type Premier<T extends any[]> =
  T extends [infer P, ...any[]] ? P : never;

type Dernier<T extends any[]> =
  T extends [...any[], infer D] ? D : never;

type SaufPremier<T extends any[]> =
  T extends [any, ...infer R] ? R : never;

type SaufDernier<T extends any[]> =
  T extends [...infer R, any] ? R : never;

// Tests
type P = Premier<[1, 2, 3]>;         // 1
type D = Dernier<[1, 2, 3]>;         // 3
type SP = SaufPremier<[1, 2, 3]>;    // [2, 3]
type SD = SaufDernier<[1, 2, 3]>;    // [1, 2]

// Inverser un tuple
type Inverser<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? [...Inverser<Reste>, Premier]
    : [];

type Inv = Inverser<[1, 2, 3, 4]>; // [4, 3, 2, 1]
```

### Inferrer dans les types d'objets

```typescript
// Extraire les cles dont les valeurs sont des fonctions
type ClesMethodes<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

interface MonService {
  nom: string;
  version: number;
  demarrer(): void;
  arreter(): void;
  configurer(opts: object): boolean;
}

type Methodes = ClesMethodes<MonService>;
// "demarrer" | "arreter" | "configurer"

// Extraire uniquement les methodes dans un nouveau type
type SeulementMethodes<T> = Pick<T, ClesMethodes<T>>;

type ServiceMethodes = SeulementMethodes<MonService>;
// {
//   demarrer(): void;
//   arreter(): void;
//   configurer(opts: object): boolean;
// }
```

---

## Implementations classiques

### IsEqual : vérifier si deux types sont identiques

```typescript
// Implementation robuste de IsEqual
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

type EQ1 = IsEqual<string, string>;     // true
type EQ2 = IsEqual<string, number>;     // false
type EQ3 = IsEqual<{ a: 1 }, { a: 1 }>; // true
type EQ4 = IsEqual<{ a: 1 }, { a: 2 }>; // false

// Attention aux cas subtils
type EQ5 = IsEqual<any, string>;         // false
type EQ6 = IsEqual<any, any>;            // true
type EQ7 = IsEqual<never, never>;        // true
type EQ8 = IsEqual<unknown, any>;        // false
```

### Flatten : aplatir un type tableau/tuple

```typescript
// Aplatir un niveau de tableau
type Flatten<T> =
  T extends (infer E)[] ? E : T;

type F1 = Flatten<string[]>;   // string
type F2 = Flatten<number[][]>; // number[]
type F3 = Flatten<string>;     // string

// Aplatir recursivement (Deep Flatten)
type DeepFlatten<T> =
  T extends (infer E)[]
    ? DeepFlatten<E>
    : T;

type DF1 = DeepFlatten<number[][][][]>; // number
type DF2 = DeepFlatten<string[][]>;     // string

// Aplatir un tuple
type FlattenTuple<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends any[]
      ? [...FlattenTuple<Premier>, ...FlattenTuple<Reste>]
      : [Premier, ...FlattenTuple<Reste>]
    : [];

type FT = FlattenTuple<[1, [2, 3], [4, [5, 6]]]>;
// [1, 2, 3, 4, [5, 6]]  -- un seul niveau
```

### UnpackPromise récursif

```typescript
// Version complete qui gere les Promises imbriquees et les unions
type UnpackPromise<T> =
  T extends Promise<infer U>
    ? UnpackPromise<U>
    : T;

type UP1 = UnpackPromise<Promise<string>>;                    // string
type UP2 = UnpackPromise<Promise<Promise<number>>>;           // number
type UP3 = UnpackPromise<Promise<Promise<Promise<boolean>>>>; // boolean
type UP4 = UnpackPromise<string>;                              // string

// Version qui fonctionne aussi avec les PromiseLike
type UnpackPromiseLike<T> =
  T extends PromiseLike<infer U>
    ? UnpackPromiseLike<U>
    : T;
```

---

## Cas d'usage réels

### Typage d'un event emitter

```typescript
// Definir les evenements possibles
interface Evenements {
  connexion: { utilisateurId: string; timestamp: Date };
  deconnexion: { utilisateurId: string; raison: string };
  message: { de: string; contenu: string };
  erreur: { code: number; message: string };
}

// Type conditionnel pour obtenir le handler d'un evenement
type HandlerEvenement<T extends keyof Evenements> =
  (donnees: Evenements[T]) => void;

// Classe avec typage complet grace aux conditional types
class Emetteur<E extends Record<string, any>> {
  private ecouteurs: Partial<Record<keyof E, Function[]>> = {};

  sur<K extends keyof E>(
    evenement: K,
    handler: (donnees: E[K]) => void
  ): void {
    if (!this.ecouteurs[evenement]) {
      this.ecouteurs[evenement] = [];
    }
    this.ecouteurs[evenement]!.push(handler);
  }

  emettre<K extends keyof E>(evenement: K, donnees: E[K]): void {
    this.ecouteurs[evenement]?.forEach((fn) => fn(donnees));
  }
}

const emetteur = new Emetteur<Evenements>();

// Autocompletion et verification de type complete
emetteur.sur("connexion", (donnees) => {
  // donnees est type { utilisateurId: string; timestamp: Date }
  console.log(`Connexion de ${donnees.utilisateurId}`);
});

emetteur.sur("message", (donnees) => {
  // donnees est type { de: string; contenu: string }
  console.log(`${donnees.de}: ${donnees.contenu}`);
});
```

### Typage conditionnel pour un ORM

```typescript
// Simuler un ORM avec des types conditionnels
interface Schema {
  utilisateur: {
    id: number;
    nom: string;
    email: string;
    age: number;
  };
  article: {
    id: number;
    titre: string;
    contenu: string;
    auteurId: number;
  };
  commentaire: {
    id: number;
    texte: string;
    articleId: number;
    auteurId: number;
  };
}

// Type conditionnel : selon l'operation, les champs obligatoires changent
type OperationBDD<
  Table extends keyof Schema,
  Op extends "creer" | "lire" | "modifier" | "supprimer"
> =
  Op extends "creer" ? Omit<Schema[Table], "id"> :
  Op extends "lire" ? Schema[Table] :
  Op extends "modifier" ? Partial<Omit<Schema[Table], "id">> & { id: number } :
  Op extends "supprimer" ? Pick<Schema[Table], "id"> :
  never;

// Utilisation
type CreerUtilisateur = OperationBDD<"utilisateur", "creer">;
// { nom: string; email: string; age: number }

type LireUtilisateur = OperationBDD<"utilisateur", "lire">;
// { id: number; nom: string; email: string; age: number }

type ModifierUtilisateur = OperationBDD<"utilisateur", "modifier">;
// { id: number; nom?: string; email?: string; age?: number }

type SupprimerArticle = OperationBDD<"article", "supprimer">;
// { id: number }
```

### Infer pour un système de validation

```typescript
// Definir des schemas de validation
type SchemaValidation =
  | { type: "chaine"; minLongueur?: number; maxLongueur?: number }
  | { type: "nombre"; min?: number; max?: number }
  | { type: "booleen" }
  | { type: "tableau"; element: SchemaValidation }
  | { type: "objet"; proprietes: Record<string, SchemaValidation> };

// Type conditionnel qui infere le type TypeScript a partir du schema
type InfererType<S extends SchemaValidation> =
  S extends { type: "chaine" } ? string :
  S extends { type: "nombre" } ? number :
  S extends { type: "booleen" } ? boolean :
  S extends { type: "tableau"; element: infer E extends SchemaValidation }
    ? InfererType<E>[]
  : S extends { type: "objet"; proprietes: infer P }
    ? P extends Record<string, SchemaValidation>
      ? { [K in keyof P]: InfererType<P[K] & SchemaValidation> }
      : never
  : never;

// Utilisation
type MonSchema = {
  type: "objet";
  proprietes: {
    nom: { type: "chaine"; minLongueur: 2 };
    age: { type: "nombre"; min: 0; max: 150 };
    actif: { type: "booleen" };
    tags: { type: "tableau"; element: { type: "chaine" } };
  };
};

type TypeInfere = InfererType<MonSchema>;
// {
//   nom: string;
//   age: number;
//   actif: boolean;
//   tags: string[];
// }
```

---

## Astuces et pieges courants

### Piege 1 : la distribution avec `never`

```typescript
// never est l'union vide, donc un conditional distributif ne s'execute jamais
type Piege<T> = T extends string ? "oui" : "non";
type R = Piege<never>; // never (PAS "non" !)

// Solution : desactiver la distribution
type PiegeCorrige<T> = [T] extends [string] ? "oui" : "non";
type R2 = PiegeCorrige<never>; // "non"
```

### Piege 2 : `any` satisfait les deux branches

```typescript
type TestAny<T> = T extends string ? "chaine" : "autre";
type R = TestAny<any>; // "chaine" | "autre" (les DEUX !)

// Solution : detecter any explicitement
type EstAny<T> = 0 extends (1 & T) ? true : false;
type A1 = EstAny<any>;     // true
type A2 = EstAny<string>;  // false
type A3 = EstAny<unknown>; // false
```

### Piege 3 : l'ordre des conditions compte

```typescript
// Mauvais ordre : any[] extends any est true !
type MauvaisOrdre<T> =
  T extends any ? "anything" :
  T extends string ? "chaine" :
  never;
// Toujours "anything" car tout est assignable a any

// Bon ordre : du plus specifique au plus general
type BonOrdre<T> =
  T extends string ? "chaine" :
  T extends number ? "nombre" :
  T extends any[] ? "tableau" :
  "autre";
```

### Astuce : infer dans la même position avec contrainte

```typescript
// Depuis TypeScript 4.7, on peut contraindre infer
type ExtraireNombres<T> =
  T extends (infer E extends number)[] ? E : never;

type N1 = ExtraireNombres<[1, 2, 3]>; // 1 | 2 | 3
type N2 = ExtraireNombres<[1, "a", 2]>; // never (pas un tableau de nombres)

// Avant 4.7, il fallait faire :
type ExtraireNombresAvant<T> =
  T extends (infer E)[]
    ? E extends number
      ? E
      : never
    : never;
```

---

## Pratique : Exercices

### Exercice 1 : ExtraireTypePromise

Creez un type `ExtraireTypePromise<T>` qui :
- Retourne le type interieur si c'est une `Promise`
- Fonctionne recursivement pour les `Promise` imbriquees
- Retourne `T` tel quel si ce n'est pas une `Promise`

<details>
<summary>Solution</summary>

```typescript
type ExtraireTypePromise<T> =
  T extends Promise<infer U>
    ? ExtraireTypePromise<U>  // Recursion pour les Promises imbriquees
    : T;

// Tests
type T1 = ExtraireTypePromise<Promise<string>>;
// string

type T2 = ExtraireTypePromise<Promise<Promise<number>>>;
// number

type T3 = ExtraireTypePromise<Promise<Promise<Promise<boolean>>>>;
// boolean

type T4 = ExtraireTypePromise<string>;
// string (pas une Promise, retourne tel quel)

type T5 = ExtraireTypePromise<Promise<string[]>>;
// string[]
```
</details>

### Exercice 2 : TypeRouteParams

Creez un type qui extrait les paramètres d'une route URL (`:param`) à partir d'une chaine.

Par exemple : `"/utilisateurs/:id/articles/:articleId"` doit donner `{ id: string; articleId: string }`.

<details>
<summary>Solution</summary>

```typescript
// Extraire les parametres d'une route
type ExtraireParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Reste}`
    ? { [K in Param | keyof ExtraireParams<Reste>]: string }
    : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

// Version plus propre avec un helper
type FusionnerParams<T> = T extends object
  ? { [K in keyof T]: T[K] }
  : never;

type RouteParams<T extends string> = FusionnerParams<ExtraireParams<T>>;

// Tests
type P1 = RouteParams<"/utilisateurs/:id">;
// { id: string }

type P2 = RouteParams<"/utilisateurs/:id/articles/:articleId">;
// { id: string; articleId: string }

type P3 = RouteParams<"/accueil">;
// {}

type P4 = RouteParams<"/api/:version/utilisateurs/:userId/posts/:postId">;
// { version: string; userId: string; postId: string }
```
</details>

### Exercice 3 : ConvertirEnAsync

Creez un type qui prend un type objet dont certaines propriétés sont des fonctions, et les transforme en fonctions asynchrones (retournant une Promise).

<details>
<summary>Solution</summary>

```typescript
// Convertir les fonctions d'un objet en fonctions async
type ConvertirEnAsync<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? R extends Promise<any>
      ? T[K]  // Deja async, on ne change rien
      : (...args: A) => Promise<R>
    : T[K];   // Pas une fonction, on ne change rien
};

// Test
interface ServiceSync {
  nom: string;
  obtenirUtilisateur(id: number): { nom: string; email: string };
  sauvegarder(donnees: object): boolean;
  chargerAsync(url: string): Promise<string>; // Deja async
}

type ServiceAsync = ConvertirEnAsync<ServiceSync>;
// {
//   nom: string;  // Inchange
//   obtenirUtilisateur(id: number): Promise<{ nom: string; email: string }>;
//   sauvegarder(donnees: object): Promise<boolean>;
//   chargerAsync(url: string): Promise<string>;  // Inchange (deja async)
// }
```
</details>

### Exercice 4 : Implementer un type Filter pour les tuples

Creez un type `Filtrer<T, Condition>` qui ne garde que les éléments d'un tuple qui satisfont une condition.

<details>
<summary>Solution</summary>

```typescript
// Filtrer les elements d'un tuple selon un type
type Filtrer<T extends any[], Condition> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends Condition
      ? [Premier, ...Filtrer<Reste, Condition>]
      : Filtrer<Reste, Condition>
    : [];

// Tests
type F1 = Filtrer<[1, "a", 2, "b", 3], string>;
// ["a", "b"]

type F2 = Filtrer<[1, "a", 2, "b", 3], number>;
// [1, 2, 3]

type F3 = Filtrer<[true, 1, false, "hello", null], boolean>;
// [true, false]

type F4 = Filtrer<[1, 2, 3, 4, 5], 1 | 3 | 5>;
// [1, 3, 5]

// Version avec exclusion (garder tout SAUF la condition)
type FiltrerExclure<T extends any[], Condition> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends Condition
      ? FiltrerExclure<Reste, Condition>
      : [Premier, ...FiltrerExclure<Reste, Condition>]
    : [];

type FE1 = FiltrerExclure<[1, "a", 2, "b", 3], string>;
// [1, 2, 3]
```
</details>

### Exercice 5 : Implementer IsEqual

Implementez un type `IsEqual<A, B>` qui retourne `true` si et seulement si A et B sont exactement le même type.

<details>
<summary>Solution</summary>

```typescript
// La methode la plus robuste utilise des fonctions generiques
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// Pourquoi cette technique fonctionne ?
// TypeScript compare les deux fonctions generiques structurellement.
// Pour que les deux fonctions soient compatibles, les conditions
// T extends A et T extends B doivent etre equivalentes pour tout T.
// Cela ne fonctionne que si A et B sont exactement le meme type.

// Tests exhaustifs
type EQ1 = IsEqual<string, string>;       // true
type EQ2 = IsEqual<string, number>;       // false
type EQ3 = IsEqual<any, any>;             // true
type EQ4 = IsEqual<any, string>;          // false
type EQ5 = IsEqual<unknown, any>;         // false
type EQ6 = IsEqual<never, never>;         // true
type EQ7 = IsEqual<never, string>;        // false
type EQ8 = IsEqual<{ a: 1 }, { a: 1 }>;   // true
type EQ9 = IsEqual<{ a: 1 }, { a: 2 }>;   // false
type EQ10 = IsEqual<[1, 2], [1, 2]>;      // true
type EQ11 = IsEqual<[1, 2], [2, 1]>;      // false

// Attention : cette approche naive NE fonctionne PAS
type IsEqualNaif<A, B> =
  A extends B ? (B extends A ? true : false) : false;

// Contre-exemples :
type Naif1 = IsEqualNaif<any, string>;     // boolean (devrait etre false)
type Naif2 = IsEqualNaif<1 | 2, 1 | 2>;   // boolean (distribution !)
```
</details>

---

## Résumé

### Concepts clés

1. **Conditional types** : `T extends U ? X : Y` — le "if/else" du système de types
2. **Distribution** : les conditional types se distribuent automatiquement sur les unions
3. **Anti-distribution** : `[T] extends [U]` empeche la distribution
4. **`infer`** : permet de capturer un sous-type dans la branche `true`
5. **Imbrication** : les conditional types peuvent etre imbriques pour du pattern matching complexe

### Quand utiliser les conditional types ?

| Situation | Exemple |
|-----------|---------|
| Transformer un type selon sa forme | `T extends any[] ? ElementDe<T> : T` |
| Extraire des sous-types | `T extends Promise<infer U> ? U : T` |
| Filtrer des unions | `Exclude<T, null \| undefined>` |
| Pattern matching sur les types | Types imbriques avec `infer` |
| Construire des utility types | `ReturnType`, `Parameters`, etc. |

### Points importants

- La distribution est **automatique** et peut surprendre
- `never` dans un conditional distributif donne `never`
- `any` satisfait les deux branches simultanement
- `infer` ne peut etre utilise que dans la clause `extends` d'un conditional type
- L'ordre des conditions imbriquees compte : du plus spécifique au plus général

---

## Pour aller plus loin

Le prochain module, **[12 — Mapped Types & Template Literal Types](./12-mapped-types-template-literals.md)**, explore les mapped types et les template literal types, deux autres piliers du système de types avance de TypeScript qui, combines aux conditional types, permettent des transformations de types quasi illimitees.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 11 conditional types](../screencasts/screencast-11-conditional-types.md)
2. **Lab** : [lab-11-conditional-types](../labs/lab-11-conditional-types/README)
3. **Visualisation** : [Conditional Types](../visualizations/conditional-types.html)
4. **Quiz** : [quiz 11 conditional types](../quizzes/quiz-11-conditional-types.html)
:::
