# 07 — Generics — Patterns avances & Variadics

> **Duree estimee** : 5 heures
> **Difficulte** : 3/5
> **Prérequis** : Module 06 (Generics fondamentaux, contraintes, keyof, acces indexes)
> **Objectifs** :
>
> - Comprendre les types tuples variadiques et leurs applications
> - Maîtriser l'inference avancee avec `infer` dans les generics
> - Typer des fonctions d'ordre superieur (higher-order functions)
> - Implementer le currying et le builder pattern de manière type-safe
> - Exploiter la distributivite dans les types conditionnels génériques
> - Créer des contraintes recursives
> - Utiliser les branded types (types opaques) pour renforcer la sécurité

---

## Introduction — Pourquoi aller plus loin que les generics de base ?

### Le problème qu'on cherche à résoudre

Le module 06 t'a appris a écrire des generics solides. Mais dans la vraie vie, on tombe vite sur des besoins plus subtils :

- typer une fonction qui enchaine plusieurs transformations
- récupérer automatiquement les paramètres ou le type de retour d'une fonction
- construire des API fluides sans perdre le typage au fil des appels
- empêcher certains mélanges de valeurs pourtant "compatibles" au runtime

Avec les generics de base, on arrive vite a des types soit trop vagues, soit trop répétitifs.

### La solution : des patterns avancés

Les generics avances servent a faire passer TypeScript de "je vérifie quelques types" a "je modélise précisément les relations entre les types".

Autrement dit : on ne dit plus seulement "cette valeur est un tableau". On dit aussi "ce tableau garde exactement cet ordre d'arguments", ou "ce type de retour doit être extrait automatiquement", ou encore "ces deux valeurs ont la même forme mais n'ont pas le droit d'être confondues".

### Analogie : de l'artisan au maitre horloger

Si les generics fondamentaux sont les outils d'un artisan, les generics avances sont ceux d'un horloger : tout est plus fin, plus précis, et chaque piece doit s'emboiter exactement au bon endroit.

### Comment aborder ce module

Dans ce module, il faut moins raisonner en termes de "valeurs" et davantage en termes de "relations entre types".

- les tuples variadiques servent a conserver la forme exacte d'une liste d'arguments
- `infer` sert a extraire un sous-type enfoui dans un autre
- les builders et le currying montrent comment garder l'information de type au fil de plusieurs étapes
- les branded types servent a distinguer des valeurs qui ont la même représentation mais pas le même sens

> 💡 **Conseil de lecture** : ne cherche pas a tout mémoriser d'un coup. Cherche d'abord a comprendre le problème concret que chaque pattern résout.

---

## Types tuples variadiques

Introduits dans TypeScript 4.0, les **variadic tuple types** permettent de manipuler des tuples de manière générique, en concatenant, en decoupant et en transformant leurs éléments.

### Pourquoi c'est utile en pratique ?

Un tuple variadique devient utile dès que l'ordre exact des éléments compte autant que leur type.

Cas typiques :

- préserver les paramètres d'une fonction wrapper
- typer un `pipe`, un `compose`, un `curry` ou un `bind`
- transformer un tuple sans perdre la position de chaque élément

> 💡 **Repère simple** : `T[]` dit "j'ai des éléments de type T". Un tuple dit "j'ai précisément tel élément, puis tel autre, dans cet ordre".

### Concatenation de tuples

```typescript
// Concatener deux tuples
type Concat<A extends readonly unknown[], B extends readonly unknown[]> = [...A, ...B];

type Resultat1 = Concat<[string, number], [boolean]>;
// [string, number, boolean]

type Resultat2 = Concat<[1, 2], [3, 4, 5]>;
// [1, 2, 3, 4, 5]

type Resultat3 = Concat<[], [string]>;
// [string]
```

### Fonction avec spread générique

Ici, `...A` et `...B` veulent dire : "reprends la forme exacte de ces deux tuples", pas simplement "deux tableaux quelconques".

```typescript
// Fonction qui fusionne les arguments de deux fonctions
function fusionnerArgs<A extends unknown[], B extends unknown[]>(
  argsA: [...A],
  argsB: [...B]
): [...A, ...B] {
  return [...argsA, ...argsB];
}

const fusionne = fusionnerArgs([1, "hello"], [true, 42]);
// type: [number, string, boolean, number]
// valeur: [1, "hello", true, 42]
```

### Premier et reste d'un tuple

```typescript
// Extraire le premier element et le reste
type Premier<T extends readonly unknown[]> = T extends [infer P, ...unknown[]] ? P : never;
type Reste<T extends readonly unknown[]> = T extends [unknown, ...infer R] ? R : never;

type T1 = Premier<[string, number, boolean]>; // string
type T2 = Reste<[string, number, boolean]>;   // [number, boolean]
type T3 = Premier<[]>;                         // never
type T4 = Reste<[string]>;                     // []
```

### Dernier élément d'un tuple

```typescript
type Dernier<T extends readonly unknown[]> = T extends [...unknown[], infer D] ? D : never;

type D1 = Dernier<[string, number, boolean]>; // boolean
type D2 = Dernier<[string]>;                   // string
type D3 = Dernier<[]>;                         // never
```

### Application : typer une fonction `pipe`

La fonction `pipe` est un pattern fonctionnel classique. Typer cette fonction correctement est un excellent exercice de types variadiques.

```typescript
// Version simplifiee avec deux fonctions
function pipe<A, B, C>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C
): C {
  return fn2(fn1(valeur));
}

const resultat = pipe(
  "  Hello World  ",
  (s) => s.trim(),           // string -> string
  (s) => s.split(" ").length // string -> number
);
// resultat: number = 2

// Version avec 3 fonctions
function pipe3<A, B, C, D>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): D {
  return fn3(fn2(fn1(valeur)));
}

const resultat2 = pipe3(
  10,
  (n) => n * 2,          // number -> number
  (n) => `Valeur: ${n}`, // number -> string
  (s) => s.length         // string -> number
);
// resultat2: number = 10
```

### Prepend — ajouter un élément au debut d'un tuple

```typescript
type Prepend<E, T extends readonly unknown[]> = [E, ...T];

type P1 = Prepend<string, [number, boolean]>; // [string, number, boolean]
type P2 = Prepend<0, [1, 2, 3]>;             // [0, 1, 2, 3]

// Fonction utilitaire
function prepend<E, T extends unknown[]>(element: E, tuple: [...T]): [E, ...T] {
  return [element, ...tuple];
}

const t = prepend("debut", [1, true, "fin"]);
// type: [string, number, boolean, string]
// valeur: ["debut", 1, true, "fin"]
```

---

## Inference avancee avec `infer`

Le mot-clé `infer` dans les types conditionnels permet d'**extraire** des types depuis des structures complexes. C'est l'outil le plus puissant du système de types de TypeScript.

### Comment lire `infer` simplement ?

Lis `infer` comme : "si la forme correspond, capture la partie qui m'intéresse".

Exemple mental :

- `T extends (...args: any[]) => infer R`
- signifie : "si `T` ressemble a une fonction, appelle `R` son type de retour"

Le point important est que `infer` ne fonctionne jamais seul : il fonctionne a l'intérieur d'un pattern a reconnaître.

### Extraire le type de retour d'une fonction

```typescript
// TypeScript fournit deja ReturnType<T>, mais voici comment le recreer :
type MonReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = MonReturnType<() => string>;           // string
type R2 = MonReturnType<(x: number) => boolean>; // boolean
type R3 = MonReturnType<typeof Math.max>;         // number
```

### Extraire les types des paramètres

```typescript
// Recreer Parameters<T>
type MesParametres<T> = T extends (...args: infer P) => any ? P : never;

type P1 = MesParametres<(a: string, b: number) => void>; // [string, number]
type P2 = MesParametres<() => void>;                       // []

// Extraire le premier parametre
type PremierParam<T> = T extends (premier: infer P, ...rest: any[]) => any ? P : never;

type PP1 = PremierParam<(a: string, b: number) => void>; // string
type PP2 = PremierParam<() => void>;                       // never
```

### Extraire le type d'une promesse

Cet exemple montre une idée centrale du module : on peut combiner `infer` **et** la récursion. Tant qu'on retrouve une `Promise<...>`, on continue a dérouler.

```typescript
// Unwrap une Promise (recursif pour les promesses imbriquees)
type Unwrap<T> = T extends Promise<infer U> ? Unwrap<U> : T;

type U1 = Unwrap<Promise<string>>;                 // string
type U2 = Unwrap<Promise<Promise<number>>>;         // number
type U3 = Unwrap<Promise<Promise<Promise<boolean>>>>; // boolean
type U4 = Unwrap<string>;                           // string (pas une promesse)
```

### Extraire les types d'un tableau

```typescript
// Extraire le type des elements d'un tableau
type ElementDe<T> = T extends readonly (infer E)[] ? E : never;

type E1 = ElementDe<string[]>;      // string
type E2 = ElementDe<[1, "a", true]>; // 1 | "a" | true
type E3 = ElementDe<number>;        // never
```

### Infer dans les template literal types

```typescript
// Extraire des parties d'une chaine
type ExtraireRoute<T extends string> =
  T extends `/${infer Segment}/${infer Reste}`
    ? { segment: Segment; reste: Reste }
    : T extends `/${infer Segment}`
    ? { segment: Segment; reste: "" }
    : never;

type Route1 = ExtraireRoute<"/utilisateurs/profil">;
// { segment: "utilisateurs"; reste: "profil" }

type Route2 = ExtraireRoute<"/accueil">;
// { segment: "accueil"; reste: "" }

// Extraire les parametres d'une route
type ParametresRoute<T extends string> =
  T extends `${string}:${infer Param}/${infer Reste}`
    ? Param | ParametresRoute<`/${Reste}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params1 = ParametresRoute<"/users/:id/posts/:postId">;
// "id" | "postId"

type Params2 = ParametresRoute<"/articles/:slug">;
// "slug"
```

### Analogie : `infer` comme un detecteur de rayons X

`infer` est comme un **appareil a rayons X** pour les types : il permet de voir "a l'interieur" d'un type complexe et d'en extraire les composants caches. La ou on ne voyait qu'une boite noire, `infer` revele la structure interne.

---

## Fonctions d'ordre superieur typees

Les fonctions d'ordre superieur (qui prennent ou retournent des fonctions) sont courantes en programmation fonctionnelle. Les generics permettent de les typer correctement.

### Fonction `debounce` typee

```typescript
// debounce : retarde l'execution d'une fonction
function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delaiMs: number
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delaiMs);
  };
}

// La fonction retournee conserve le typage des parametres
const rechercherDebounced = debounce(
  (terme: string, page: number) => {
    console.log(`Recherche: "${terme}" — page ${page}`);
  },
  300
);

rechercherDebounced("TypeScript", 1); // OK
// rechercherDebounced(42);            // ERREUR : attendu (string, number)
```

### Fonction `memoize` typee

```typescript
// memoize : met en cache les resultats d'une fonction
function memoize<TArgs extends unknown[], TRetour>(
  fn: (...args: TArgs) => TRetour
): (...args: TArgs) => TRetour {
  const cache = new Map<string, TRetour>();

  return (...args: TArgs): TRetour => {
    const cle = JSON.stringify(args);
    if (cache.has(cle)) {
      console.log(`[Cache] Resultat en cache pour ${cle}`);
      return cache.get(cle)!;
    }

    const resultat = fn(...args);
    cache.set(cle, resultat);
    return resultat;
  };
}

// Utilisation
const factorielle = memoize((n: number): number => {
  console.log(`Calcul de factorielle(${n})`);
  if (n <= 1) return 1;
  return n * factorielle(n - 1);
});

console.log(factorielle(5));  // Calcul... puis 120
console.log(factorielle(5));  // [Cache] puis 120
console.log(factorielle(3));  // [Cache] puis 6 (calcule lors de factorielle(5))
```

### Fonction `retry` typee

```typescript
// retry : reessaye une fonction async en cas d'echec
async function retry<TArgs extends unknown[], TRetour>(
  fn: (...args: TArgs) => Promise<TRetour>,
  maxTentatives: number = 3,
  delaiMs: number = 1000
): Promise<(...args: TArgs) => Promise<TRetour>> {

  return async (...args: TArgs): Promise<TRetour> => {
    let dernierErreur: Error | undefined;

    for (let tentative = 1; tentative <= maxTentatives; tentative++) {
      try {
        return await fn(...args);
      } catch (erreur) {
        dernierErreur = erreur as Error;
        console.log(`Tentative ${tentative}/${maxTentatives} echouee: ${dernierErreur.message}`);

        if (tentative < maxTentatives) {
          await new Promise((resolve) => setTimeout(resolve, delaiMs));
        }
      }
    }

    throw dernierErreur;
  };
}
```

---

## Currying type-safe

Le **currying** transforme une fonction a N arguments en une chaine de N fonctions a 1 argument. Typer cela correctement est un exercice avance.

### Currying simple

```typescript
// Currying pour 2 arguments
function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}

const additionner = (a: number, b: number): number => a + b;
const additionnerCurried = curry2(additionner);

const ajouter5 = additionnerCurried(5); // (b: number) => number
console.log(ajouter5(3));                // 8
console.log(ajouter5(10));               // 15

// Currying pour 3 arguments
function curry3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (a: A) => (b: B) => (c: C) => R {
  return (a: A) => (b: B) => (c: C) => fn(a, b, c);
}

const volume = (l: number, w: number, h: number): number => l * w * h;
const volumeCurried = curry3(volume);

const boite10x5 = volumeCurried(10)(5); // (h: number) => number
console.log(boite10x5(2));               // 100
console.log(boite10x5(3));               // 150
```

### Currying générique avance

```typescript
// Type recursif pour le currying
type Curry<TParams extends unknown[], TRetour> =
  TParams extends [infer Premier, ...infer Reste]
    ? Reste extends []
      ? (arg: Premier) => TRetour
      : (arg: Premier) => Curry<Reste, TRetour>
    : TRetour;

// Exemple de type resultat
type TestCurry = Curry<[string, number, boolean], void>;
// (arg: string) => (arg: number) => (arg: boolean) => void

// Implementation (simplifiee pour illustrer le concept)
function curry<TParams extends unknown[], TRetour>(
  fn: (...args: TParams) => TRetour
): Curry<TParams, TRetour> {
  const curried = (...args: unknown[]): unknown => {
    if (args.length >= fn.length) {
      return fn(...(args as TParams));
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  };
  return curried as Curry<TParams, TRetour>;
}

// Utilisation
const formaterMessage = (prenom: string, nom: string, age: number): string =>
  `${prenom} ${nom} a ${age} ans`;

const formaterCurried = curry(formaterMessage);
// type: (arg: string) => (arg: string) => (arg: number) => string

const formaterDupont = formaterCurried("Jean")("Dupont");
// type: (arg: number) => string

console.log(formaterDupont(30)); // "Jean Dupont a 30 ans"
console.log(formaterDupont(25)); // "Jean Dupont a 25 ans"
```

---

## Builder pattern type-safe

Le builder pattern permet de construire des objets complexes étape par étape. Avec les generics, on peut s'assurer que toutes les étapes obligatoires sont effectuees **au moment de la compilation**.

```typescript
// Les proprietes requises et leur type
interface ConfigServeur {
  hote: string;
  port: number;
  protocole: "http" | "https";
  timeout?: number;
  journalisation?: boolean;
}

// Type qui suit les proprietes deja definies
type BuilderState = {
  hote: boolean;
  port: boolean;
  protocole: boolean;
};

class ServeurBuilder<TEtat extends BuilderState = { hote: false; port: false; protocole: false }> {
  private config: Partial<ConfigServeur> = {};

  hote(hote: string): ServeurBuilder<TEtat & { hote: true }> {
    this.config.hote = hote;
    return this as any;
  }

  port(port: number): ServeurBuilder<TEtat & { port: true }> {
    this.config.port = port;
    return this as any;
  }

  protocole(protocole: "http" | "https"): ServeurBuilder<TEtat & { protocole: true }> {
    this.config.protocole = protocole;
    return this as any;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  journalisation(activer: boolean): this {
    this.config.journalisation = activer;
    return this;
  }

  // `construire` n'est disponible que si toutes les proprietes requises sont definies
  construire(
    this: ServeurBuilder<{ hote: true; port: true; protocole: true }>
  ): ConfigServeur {
    return this.config as ConfigServeur;
  }
}

// Utilisation correcte
const serveur = new ServeurBuilder()
  .hote("localhost")
  .port(3000)
  .protocole("https")
  .timeout(5000)
  .journalisation(true)
  .construire(); // OK : toutes les proprietes requises sont definies

console.log(serveur);

// Utilisation incorrecte :
// const serveurIncomplet = new ServeurBuilder()
//   .hote("localhost")
//   .construire(); // ERREUR : port et protocole manquants
```

### Analogie : la checklist du pilote

Le builder type-safe est comme la **checklist d'un pilote d'avion** avant le decollage. Chaque étape cochee debloque la suivante, et le decollage (`.construire()`) n'est autorise que lorsque toutes les verifications obligatoires sont effectuees.

---

## Retour conditionnel générique

Les generics peuvent etre combines avec des types conditionnels pour que le type de retour d'une fonction depende du type de l'argument.

```typescript
// Le type de retour depend du type d'entree
function convertir<T extends string | number | boolean>(
  valeur: T
): T extends string ? number : T extends number ? string : boolean {
  if (typeof valeur === "string") {
    return parseFloat(valeur) as any;
  }
  if (typeof valeur === "number") {
    return valeur.toString() as any;
  }
  return !valeur as any;
}

const a = convertir("42");    // type: number
const b = convertir(42);      // type: string
const c = convertir(true);    // type: boolean

console.log(a); // 42
console.log(b); // "42"
console.log(c); // false
```

### Exemple : réponse API conditionnelle

```typescript
// Le format de la reponse depend du parametre `format`
interface DonneesUtilisateur {
  id: number;
  nom: string;
  email: string;
}

type FormatReponse = "json" | "csv" | "xml";

type ReponseSelonFormat<F extends FormatReponse> =
  F extends "json" ? DonneesUtilisateur[]
  : F extends "csv" ? string
  : F extends "xml" ? Document
  : never;

async function chargerUtilisateurs<F extends FormatReponse>(
  format: F
): Promise<ReponseSelonFormat<F>> {
  const donnees: DonneesUtilisateur[] = [
    { id: 1, nom: "Alice", email: "alice@mail.com" },
    { id: 2, nom: "Bob", email: "bob@mail.com" },
  ];

  if (format === "json") {
    return donnees as ReponseSelonFormat<F>;
  }
  if (format === "csv") {
    const lignes = donnees.map((d) => `${d.id},${d.nom},${d.email}`);
    return ("id,nom,email\n" + lignes.join("\n")) as ReponseSelonFormat<F>;
  }
  // Pour xml, on retournerait un Document...
  throw new Error(`Format non supporte : ${format}`);
}

// TypeScript connait le type de retour exact
async function demo() {
  const json = await chargerUtilisateurs("json"); // DonneesUtilisateur[]
  const csv = await chargerUtilisateurs("csv");   // string

  console.log(json[0].nom); // "Alice" — OK, c'est un tableau d'objets
  console.log(csv.split("\n").length); // OK, c'est un string
}
```

---

## Distributivite dans les generics

Quand un type conditionnel est applique à un type union, il se **distribue** sur chaque membre de l'union. Ce comportement est fondamental à comprendre.

### Comportement distributif

```typescript
// Type conditionnel simple
type EstString<T> = T extends string ? "oui" : "non";

// Avec un type simple
type Test1 = EstString<string>;  // "oui"
type Test2 = EstString<number>;  // "non"

// Avec un type UNION : le conditionnel se distribue
type Test3 = EstString<string | number>;
// Equivalent a : EstString<string> | EstString<number>
// = "oui" | "non"

// Autre exemple
type ExclureNull<T> = T extends null | undefined ? never : T;

type T1 = ExclureNull<string | null | number | undefined>;
// Distribue : ExclureNull<string> | ExclureNull<null> | ExclureNull<number> | ExclureNull<undefined>
// = string | never | number | never
// = string | number
```

### Empecher la distributivite

Parfois on ne veut PAS de distributivite. On enveloppe alors le type dans un tuple.

```typescript
// Distributif
type EstTableau<T> = T extends any[] ? "oui" : "non";
type D1 = EstTableau<string[] | number>; // "oui" | "non" (distribue)

// Non-distributif (en enveloppant dans un tuple)
type EstTableauStrict<T> = [T] extends [any[]] ? "oui" : "non";
type D2 = EstTableauStrict<string[] | number>; // "non" (evalue comme un tout)
type D3 = EstTableauStrict<string[]>;           // "oui"
```

### Analogie : le tri postal

La distributivite est comme un **centre de tri postal** : si vous envoyez un paquet contenant plusieurs lettres (union), chaque lettre est triee individuellement. Pour traiter le paquet comme un tout, il faut le mettre dans un carton (tuple).

---

## Contraintes recursives

Les types génériques peuvent se referer a eux-memes, ce qui permet de decrire des structures arborescentes ou imbriquees.

### Arbre générique

```typescript
// Noeud d'un arbre generique
interface Noeud<T> {
  valeur: T;
  enfants: Noeud<T>[];
}

// Fonctions utilitaires pour les arbres
function creerFeuille<T>(valeur: T): Noeud<T> {
  return { valeur, enfants: [] };
}

function creerNoeud<T>(valeur: T, ...enfants: Noeud<T>[]): Noeud<T> {
  return { valeur, enfants };
}

// Parcourir l'arbre en profondeur
function parcourirProfondeur<T>(noeud: Noeud<T>, fn: (valeur: T, profondeur: number) => void, profondeur: number = 0): void {
  fn(noeud.valeur, profondeur);
  for (const enfant of noeud.enfants) {
    parcourirProfondeur(enfant, fn, profondeur + 1);
  }
}

// Transformer chaque valeur de l'arbre
function transformerArbre<T, U>(noeud: Noeud<T>, fn: (valeur: T) => U): Noeud<U> {
  return {
    valeur: fn(noeud.valeur),
    enfants: noeud.enfants.map((enfant) => transformerArbre(enfant, fn)),
  };
}

// Utilisation : arbre de fichiers
const arbre = creerNoeud("src",
  creerNoeud("composants",
    creerFeuille("Bouton.tsx"),
    creerFeuille("Formulaire.tsx"),
    creerNoeud("ui",
      creerFeuille("Modal.tsx"),
      creerFeuille("Tooltip.tsx")
    )
  ),
  creerNoeud("pages",
    creerFeuille("Accueil.tsx"),
    creerFeuille("Contact.tsx")
  ),
  creerFeuille("index.ts")
);

parcourirProfondeur(arbre, (val, prof) => {
  console.log(`${"  ".repeat(prof)}${val}`);
});
```

### JSON type récursif

```typescript
// Definition recursive du type JSON
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [cle: string]: JSONValue };

// Cette definition est auto-referentielle : JSONValue peut contenir
// des tableaux de JSONValue ou des objets avec des valeurs JSONValue

const donnees: JSONValue = {
  nom: "Alice",
  age: 30,
  actif: true,
  adresse: {
    rue: "12 rue de la Paix",
    ville: "Paris",
    coordonnees: [48.8566, 2.3522],
  },
  tags: ["admin", "premium"],
  supprime: null,
};
```

### DeepReadonly récursif

```typescript
// Rendre un objet profondement immutable
type DeepReadonly<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonly<E>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface Etat {
  utilisateur: {
    nom: string;
    preferences: {
      theme: string;
      langue: string;
      notifications: boolean[];
    };
  };
  articles: { id: number; titre: string }[];
}

type EtatImmutable = DeepReadonly<Etat>;
// Toutes les proprietes, meme imbriquees, sont readonly

const etat: EtatImmutable = {
  utilisateur: {
    nom: "Alice",
    preferences: {
      theme: "sombre",
      langue: "fr",
      notifications: [true, false, true],
    },
  },
  articles: [{ id: 1, titre: "Article 1" }],
};

// etat.utilisateur.nom = "Bob";                      // ERREUR : readonly
// etat.utilisateur.preferences.theme = "clair";      // ERREUR : readonly
// etat.articles.push({ id: 2, titre: "Article 2" }); // ERREUR : readonly array
```

### DeepPartial récursif

```typescript
// Rendre toutes les proprietes optionnelles en profondeur
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// Utile pour les mises a jour partielles
function mettreAJourProfond<T extends object>(
  cible: T,
  modifications: DeepPartial<T>
): T {
  const resultat = { ...cible };

  for (const cle in modifications) {
    const valeur = modifications[cle];
    if (valeur !== undefined && typeof valeur === "object" && !Array.isArray(valeur)) {
      (resultat as any)[cle] = mettreAJourProfond(
        (cible as any)[cle],
        valeur as any
      );
    } else if (valeur !== undefined) {
      (resultat as any)[cle] = valeur;
    }
  }

  return resultat;
}

const config = {
  serveur: {
    hote: "localhost",
    port: 3000,
    ssl: { actif: false, certificat: "" },
  },
  base: { url: "mongodb://localhost", nom: "app" },
};

const configModifiee = mettreAJourProfond(config, {
  serveur: { ssl: { actif: true } }, // On ne modifie que ssl.actif
});

console.log(configModifiee.serveur.ssl.actif); // true
console.log(configModifiee.serveur.port);       // 3000 (inchange)
```

---

## Generic overload patterns

Les overloads génériques permettent de créer des fonctions avec des signatures multiples et type-safe.

```typescript
// Overloads generiques pour une fonction `rechercher`
function rechercher<T>(tableau: T[], predicat: (elem: T) => boolean): T[];
function rechercher<T>(tableau: T[], cle: keyof T, valeur: T[keyof T]): T[];
function rechercher<T>(
  tableau: T[],
  predicatOuCle: ((elem: T) => boolean) | keyof T,
  valeur?: T[keyof T]
): T[] {
  if (typeof predicatOuCle === "function") {
    return tableau.filter(predicatOuCle as (elem: T) => boolean);
  }
  return tableau.filter((elem) => elem[predicatOuCle as keyof T] === valeur);
}

const produits = [
  { nom: "Clavier", categorie: "peripherique", prix: 50 },
  { nom: "Souris", categorie: "peripherique", prix: 30 },
  { nom: "Ecran", categorie: "affichage", prix: 300 },
];

// Overload 1 : avec un predicat
const chers = rechercher(produits, (p) => p.prix > 40);

// Overload 2 : avec une cle et une valeur
const peripheriques = rechercher(produits, "categorie", "peripherique");
```

---

## Branded Types / Types opaques

Les **branded types** (où types opaques) permettent de créer des types qui sont structurellement identiques à un type de base mais **incompatibles** entre eux. Cela empeche de melanger des valeurs qui ont le même type sous-jacent mais des significations différentes.

### Le problème

```typescript
// Sans branded types : tout est juste `string`
function envoyerEmail(utilisateurId: string, emailId: string): void {
  // ...
}

const userId = "user_123";
const emailId = "email_456";

// DANGER : on peut inverser les arguments par erreur !
envoyerEmail(emailId, userId); // Aucune erreur TypeScript...
```

### La solution : branded types

```typescript
// Declarer un symbole unique pour chaque "marque"
declare const __brand: unique symbol;

// Type generique pour les branded types
type Brand<T, TMarque extends string> = T & { readonly [__brand]: TMarque };

// Types marques
type UtilisateurId = Brand<string, "UtilisateurId">;
type EmailId = Brand<string, "EmailId">;
type ArticleId = Brand<string, "ArticleId">;

// Fonctions de creation (les seuls points d'entree)
function creerUtilisateurId(id: string): UtilisateurId {
  // On pourrait ajouter de la validation ici
  if (!id.startsWith("user_")) {
    throw new Error("L'ID utilisateur doit commencer par 'user_'");
  }
  return id as UtilisateurId;
}

function creerEmailId(id: string): EmailId {
  if (!id.startsWith("email_")) {
    throw new Error("L'ID email doit commencer par 'email_'");
  }
  return id as EmailId;
}

// Fonctions qui utilisent les types marques
function envoyerEmailTypeSafe(utilisateurId: UtilisateurId, emailId: EmailId): void {
  console.log(`Envoi de l'email ${emailId} a l'utilisateur ${utilisateurId}`);
}

const userId = creerUtilisateurId("user_123");
const emailId = creerEmailId("email_456");

envoyerEmailTypeSafe(userId, emailId);         // OK
// envoyerEmailTypeSafe(emailId, userId);       // ERREUR : types incompatibles !
// envoyerEmailTypeSafe("user_123", emailId);   // ERREUR : string n'est pas UtilisateurId
```

### Branded types numériques

```typescript
type EUR = Brand<number, "EUR">;
type USD = Brand<number, "USD">;
type Celsius = Brand<number, "Celsius">;
type Fahrenheit = Brand<number, "Fahrenheit">;

function eur(montant: number): EUR {
  return montant as EUR;
}

function usd(montant: number): USD {
  return montant as USD;
}

function additionnerEUR(a: EUR, b: EUR): EUR {
  return (a + b) as EUR;
}

const prix1 = eur(10);
const prix2 = eur(20);
const prixUSD = usd(15);

const total = additionnerEUR(prix1, prix2); // OK : 30 EUR
// const erreur = additionnerEUR(prix1, prixUSD); // ERREUR : USD n'est pas EUR !
```

### Analogie : les etiquettes de bagages

Les branded types sont comme des **etiquettes de bagages a l'aeroport**. Deux valises peuvent etre physiquement identiques (même type sous-jacent), mais l'etiquette (la marque) indique leur destination. Cela empeche de les mettre dans le mauvais avion.

---

## Pratique

### Exercice 1 : Type `Flatten` récursif

Creez un type utilitaire `Flatten<T>` qui "aplatit" un type tableau imbrique. Par exemple, `Flatten<number[][]>` devrait donner `number[]`.

<details>
<summary>Solution</summary>

```typescript
// Flatten retire un niveau d'imbrication de tableau
type Flatten<T> = T extends (infer E)[] ? Flatten<E> : T;

// Tests
type F1 = Flatten<number[]>;        // number
type F2 = Flatten<number[][]>;      // number
type F3 = Flatten<string[][][]>;    // string
type F4 = Flatten<boolean>;         // boolean (pas un tableau)

// Version qui aplatit un seul niveau
type FlattenUnNiveau<T> = T extends (infer E)[] ? E : T;

type FU1 = FlattenUnNiveau<number[]>;     // number
type FU2 = FlattenUnNiveau<number[][]>;   // number[]
type FU3 = FlattenUnNiveau<string[][][]>; // string[][]

// Fonction avec le type Flatten
function aplatir<T>(tableau: T[][]): T[] {
  return tableau.reduce<T[]>((acc, curr) => [...acc, ...curr], []);
}

const imbrique = [[1, 2], [3, 4], [5]];
const plat = aplatir(imbrique); // number[]
console.log(plat); // [1, 2, 3, 4, 5]
```

</details>

### Exercice 2 : Fonction `pluck` type-safe avec chemins profonds

Creez une version avancee de `pluck` qui supporte les chemins profonds (ex: `"adresse.ville"`).

<details>
<summary>Solution</summary>

```typescript
// Type pour les chemins d'acces profonds
type CheminProfond<T, Prefixe extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: K | `${K}.${CheminProfond<T[K], "">}`;
    }[keyof T & string]
  : never;

// Type pour obtenir le type a un chemin profond
type TypeAuChemin<T, Chemin extends string> =
  Chemin extends `${infer Cle}.${infer Reste}`
    ? Cle extends keyof T
      ? TypeAuChemin<T[Cle], Reste>
      : never
    : Chemin extends keyof T
    ? T[Chemin]
    : never;

// Implementation
function accederProfond<T extends object, C extends CheminProfond<T>>(
  objet: T,
  chemin: C
): TypeAuChemin<T, C & string> {
  const segments = (chemin as string).split(".");
  let courant: any = objet;
  for (const segment of segments) {
    courant = courant[segment];
  }
  return courant;
}

// Test
interface Employe {
  nom: string;
  adresse: {
    rue: string;
    ville: string;
    pays: {
      nom: string;
      code: string;
    };
  };
  competences: string[];
}

const employe: Employe = {
  nom: "Alice",
  adresse: {
    rue: "12 rue de la Paix",
    ville: "Paris",
    pays: { nom: "France", code: "FR" },
  },
  competences: ["TypeScript", "React"],
};

const ville = accederProfond(employe, "adresse.ville"); // string
const codePays = accederProfond(employe, "adresse.pays.code"); // string
console.log(ville);     // "Paris"
console.log(codePays);  // "FR"
```

</details>

### Exercice 3 : EventEmitter type-safe avec generics

Creez un emetteur d'événements générique ou les types des événements et de leurs donnees sont verifies à la compilation.

<details>
<summary>Solution</summary>

```typescript
// Definition des evenements et de leurs types de donnees
interface EvenementsApp {
  "utilisateur:connecte": { id: string; nom: string };
  "utilisateur:deconnecte": { id: string };
  "article:cree": { id: number; titre: string; auteur: string };
  "article:supprime": { id: number };
  "erreur": { message: string; code: number };
}

// Emetteur d'evenements generique
class EmetteurTypeSafe<TEvenements extends Record<string, any>> {
  private ecouteurs = new Map<keyof TEvenements, Set<Function>>();

  // S'abonner a un evenement
  sur<K extends keyof TEvenements>(
    evenement: K,
    ecouteur: (donnees: TEvenements[K]) => void
  ): () => void {
    if (!this.ecouteurs.has(evenement)) {
      this.ecouteurs.set(evenement, new Set());
    }
    this.ecouteurs.get(evenement)!.add(ecouteur);

    // Retourne une fonction de desabonnement
    return () => {
      this.ecouteurs.get(evenement)?.delete(ecouteur);
    };
  }

  // S'abonner pour un seul evenement
  uneFois<K extends keyof TEvenements>(
    evenement: K,
    ecouteur: (donnees: TEvenements[K]) => void
  ): void {
    const desabonner = this.sur(evenement, (donnees) => {
      desabonner();
      ecouteur(donnees);
    });
  }

  // Emettre un evenement
  emettre<K extends keyof TEvenements>(
    evenement: K,
    donnees: TEvenements[K]
  ): void {
    const ecouteurs = this.ecouteurs.get(evenement);
    if (ecouteurs) {
      for (const ecouteur of ecouteurs) {
        ecouteur(donnees);
      }
    }
  }

  // Nombre d'ecouteurs pour un evenement
  nbEcouteurs<K extends keyof TEvenements>(evenement: K): number {
    return this.ecouteurs.get(evenement)?.size ?? 0;
  }
}

// Utilisation
const bus = new EmetteurTypeSafe<EvenementsApp>();

// Les types sont verifies !
bus.sur("utilisateur:connecte", (data) => {
  // data est de type { id: string; nom: string }
  console.log(`${data.nom} s'est connecte (ID: ${data.id})`);
});

bus.sur("article:cree", (data) => {
  // data est de type { id: number; titre: string; auteur: string }
  console.log(`Nouvel article "${data.titre}" par ${data.auteur}`);
});

const desabonnerErreur = bus.sur("erreur", (data) => {
  console.error(`[Erreur ${data.code}] ${data.message}`);
});

// Emettre des evenements (types verifies)
bus.emettre("utilisateur:connecte", { id: "user_1", nom: "Alice" });
bus.emettre("article:cree", { id: 1, titre: "Mon article", auteur: "Alice" });

// bus.emettre("utilisateur:connecte", { id: 42 }); // ERREUR : id doit etre string, nom manquant
// bus.emettre("inconnu", {});                       // ERREUR : evenement inconnu

desabonnerErreur(); // Se desabonner
```

</details>

### Exercice 4 : Branded types pour une application financiere

Creez un système de types marques pour une application financiere qui empeche de melanger les devises.

<details>
<summary>Solution</summary>

```typescript
// Symbole de marque
declare const __devise: unique symbol;

// Type de montant marque par une devise
type Montant<TDevise extends string> = number & { readonly [__devise]: TDevise };

// Devises supportees
type EUR = Montant<"EUR">;
type USD = Montant<"USD">;
type GBP = Montant<"GBP">;

// Constructeurs
function eur(montant: number): EUR { return montant as EUR; }
function usd(montant: number): USD { return montant as USD; }
function gbp(montant: number): GBP { return montant as GBP; }

// Operations type-safe (meme devise uniquement)
function additionner<T extends string>(a: Montant<T>, b: Montant<T>): Montant<T> {
  return ((a as number) + (b as number)) as Montant<T>;
}

function soustraire<T extends string>(a: Montant<T>, b: Montant<T>): Montant<T> {
  return ((a as number) - (b as number)) as Montant<T>;
}

function multiplier<T extends string>(montant: Montant<T>, facteur: number): Montant<T> {
  return ((montant as number) * facteur) as Montant<T>;
}

// Conversion entre devises (passage explicite)
interface TauxChange {
  de: string;
  vers: string;
  taux: number;
}

function convertir<TDe extends string, TVers extends string>(
  montant: Montant<TDe>,
  tauxChange: number,
  _versDevise: TVers
): Montant<TVers> {
  return ((montant as number) * tauxChange) as Montant<TVers>;
}

// Test
const salaire = eur(3000);
const prime = eur(500);
const total = additionner(salaire, prime); // EUR
console.log(`Total: ${total} EUR`); // 3500 EUR

const prixUS = usd(100);
// const erreur = additionner(salaire, prixUS); // ERREUR : EUR et USD incompatibles

const prixConverti = convertir(prixUS, 0.92, "EUR" as const);
// Maintenant prixConverti est un EUR
const totalAvecConversion = additionner(salaire, prixConverti); // OK !
console.log(`Total avec conversion: ${totalAvecConversion} EUR`);
```

</details>

---

## Récapitulatif

| Concept                      | Description                                                        |
|------------------------------|--------------------------------------------------------------------|
| Variadic tuple types         | Manipuler des tuples generiquement (`[...A, ...B]`)               |
| `infer`                      | Extraire un type depuis une structure dans un conditionnel         |
| Higher-order generics        | Typer les fonctions qui prennent/retournent des fonctions          |
| Currying type-safe           | Transformer `f(a, b, c)` en `f(a)(b)(c)` avec types preserves     |
| Builder type-safe            | Forcer les étapes obligatoires au moment de la compilation         |
| Retour conditionnel          | Le type de retour depend du type d'entree                          |
| Distributivite               | Les conditionnels se distribuent sur les unions                    |
| Contraintes recursives       | Types qui se referencent eux-memes (arbres, DeepReadonly)          |
| Overloads génériques         | Signatures multiples avec types différents                         |
| Branded types                | Types nominaux pour empecher les melanges                          |

---

## Pour aller plus loin

Dans le **Module 08**, nous explorerons les **Enums, Tuples et Types speciaux** (`never`, `unknown`, `void`). Ces types jouent des roles spécifiques dans le système de types de TypeScript et sont essentiels pour écrire du code robuste et expressif.

[Continuer vers le Module 08 : Enums, Tuples & Types speciaux →](./08-enums-tuples-types-speciaux.md)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 07 generics avances](../screencasts/screencast-07-generics-avances.md)
2. **Lab** : [lab-07-generics-avances](../labs/lab-07-generics-avances/README)
3. **Visualisation** : [Generics Flow](../visualizations/generics-flow.html)
4. **Quiz** : [quiz 07 generics avances](../quizzes/quiz-07-generics-avances.html)
:::
