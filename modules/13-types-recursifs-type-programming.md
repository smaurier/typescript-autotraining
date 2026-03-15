# 13 — Types récursifs & Type-Level Programming

> **Duree estimee** : 6 heures
> **Difficulte** : 5/5
> **Prérequis** : Conditional types, infer, mapped types, template literal types, tuples
> **Objectifs** :
> - Comprendre et créer des types récursifs
> - Maîtriser l'arithmetique au niveau des types
> - Parser des chaines au niveau du système de types
> - Connaître les limites de récursion de TypeScript
> - Explorer le type-level programming comme discipline

---

> **⚠️ Ce module est un cran au-dessus.** C'est normal de galerer ici. Si tu bloques plus de 20 min, relis la théorie du module précédent. Si après 45 min c'est toujours flou, passe au module suivant et reviens plus tard — certains concepts prennent des jours a decanter.

## Introduction

Le **type-level programming** consiste à écrire des programmes qui s'executent **au moment de la compilation**, dans le système de types. TypeScript, bien qu'il ne soit pas concu pour cela, possede un système de types suffisamment puissant pour permettre des calculs complexes.

### Analogie

Imaginez que vous ecrivez un livre (votre programme). Le **type-level programming**, c'est comme écrire des regles de grammaire et d'orthographe si sophistiquees que le correcteur orthographique peut non seulement vérifier votre texte, mais aussi **générer de nouveaux mots** selon des regles complexes, vérifier la coherence logique de votre recit, et même résoudre des equations mathematiques — tout cela avant que quiconque ne lise le livre.

---

## Types récursifs : les fondamentaux

### Qu'est-ce qu'un type récursif ?

Un type récursif est un type qui se **référence lui-même** dans sa définition. C'est l'équivalent au niveau des types d'une fonction recursive.

```typescript
// Un arbre binaire : chaque noeud contient une valeur
// et peut avoir un sous-arbre gauche et un sous-arbre droit
type ArbreBinaire<T> = {
  valeur: T;
  gauche: ArbreBinaire<T> | null;
  droite: ArbreBinaire<T> | null;
};

const arbre: ArbreBinaire<number> = {
  valeur: 10,
  gauche: {
    valeur: 5,
    gauche: { valeur: 2, gauche: null, droite: null },
    droite: { valeur: 7, gauche: null, droite: null },
  },
  droite: {
    valeur: 15,
    gauche: null,
    droite: { valeur: 20, gauche: null, droite: null },
  },
};
```

### Liste chainee typee

```typescript
// Une liste chainee : chaque element pointe vers le suivant
type ListeChainee<T> = {
  valeur: T;
  suivant: ListeChainee<T> | null;
};

const liste: ListeChainee<string> = {
  valeur: "premier",
  suivant: {
    valeur: "deuxieme",
    suivant: {
      valeur: "troisieme",
      suivant: null,
    },
  },
};

// Version avec des types differents pour chaque element (type-safe)
type ListeHeterogene<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? { valeur: Premier; suivant: Reste extends [] ? null : ListeHeterogene<Reste> }
    : null;

type MaListe = ListeHeterogene<[string, number, boolean]>;
// {
//   valeur: string;
//   suivant: {
//     valeur: number;
//     suivant: {
//       valeur: boolean;
//       suivant: null;
//     };
//   };
// }
```

### JSON récursif

```typescript
// Le type JSON est naturellement recursif
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [cle: string]: JsonValue };

// Valide
const exemple: JsonValue = {
  nom: "Alice",
  age: 30,
  adresses: [
    {
      rue: "123 rue Principale",
      coordonnees: {
        lat: 48.8566,
        lng: 2.3522,
      },
    },
  ],
  actif: true,
  supprime: null,
};

// Invalide (les fonctions ne sont pas du JSON)
// const mauvais: JsonValue = { fn: () => {} }; // Erreur
```

---

## Recursive conditional types

### Aplatir un type profondement imbrique

```typescript
// Aplatir un type tableau profondement imbrique
type AplatirProfond<T> =
  T extends readonly (infer E)[]
    ? AplatirProfond<E>
    : T;

type A1 = AplatirProfond<number[][][][]>;    // number
type A2 = AplatirProfond<string[][]>;         // string
type A3 = AplatirProfond<boolean>;            // boolean

// Aplatir un tuple a un seul niveau
type AplatirTuple<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends any[]
      ? [...Premier, ...AplatirTuple<Reste>]
      : [Premier, ...AplatirTuple<Reste>]
    : [];

type AT1 = AplatirTuple<[1, [2, 3], [4, 5]]>;
// [1, 2, 3, 4, 5]

// Aplatir un tuple profondement (multi-niveaux)
type AplatirTupleProfond<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends any[]
      ? [...AplatirTupleProfond<Premier>, ...AplatirTupleProfond<Reste>]
      : [Premier, ...AplatirTupleProfond<Reste>]
    : [];

type ATP1 = AplatirTupleProfond<[1, [2, [3, [4]]]]>;
// [1, 2, 3, 4]
```

### Inverser un tuple

```typescript
type Inverser<T extends any[]> =
  T extends [infer Premier, ...infer Reste]
    ? [...Inverser<Reste>, Premier]
    : [];

type I1 = Inverser<[1, 2, 3, 4, 5]>;
// [5, 4, 3, 2, 1]

type I2 = Inverser<["a", "b", "c"]>;
// ["c", "b", "a"]

type I3 = Inverser<[]>;
// []
```

### Longueur d'un tuple

```typescript
// La propriete "length" d'un tuple est un nombre literal
type Longueur<T extends any[]> = T["length"];

type L1 = Longueur<[1, 2, 3]>;     // 3
type L2 = Longueur<["a", "b"]>;     // 2
type L3 = Longueur<[]>;              // 0

// Compter recursivement (equivalent, mais montrant le principe)
type CompterRecursif<T extends any[], Acc extends any[] = []> =
  T extends [any, ...infer Reste]
    ? CompterRecursif<Reste, [...Acc, any]>
    : Acc["length"];

type CR1 = CompterRecursif<[1, 2, 3, 4]>; // 4
```

---

## Arithmetique au niveau des types

TypeScript ne supporte pas les operations arithmetiques nativement au niveau des types. Mais on peut les **simuler** en utilisant des tuples comme representation des nombres.

### Le principe : les nombres comme tuples

```typescript
// Le nombre N est represente par un tuple de longueur N
// 0 = []
// 1 = [any]
// 2 = [any, any]
// 3 = [any, any, any]
// etc.

// Creer un tuple de longueur N
type ConstruireTuple<
  N extends number,
  Acc extends any[] = []
> =
  Acc["length"] extends N
    ? Acc
    : ConstruireTuple<N, [...Acc, any]>;

type T0 = ConstruireTuple<0>;  // []
type T3 = ConstruireTuple<3>;  // [any, any, any]
type T5 = ConstruireTuple<5>;  // [any, any, any, any, any]
```

### Addition

```typescript
// Addition : concatener deux tuples et prendre la longueur
type Additionner<A extends number, B extends number> =
  [...ConstruireTuple<A>, ...ConstruireTuple<B>]["length"] & number;

type Somme1 = Additionner<3, 4>;   // 7
type Somme2 = Additionner<10, 5>;  // 15
type Somme3 = Additionner<0, 0>;   // 0
type Somme4 = Additionner<1, 99>;  // 100
```

### Soustraction

```typescript
// Soustraction : retirer des elements du debut d'un tuple
type Soustraire<A extends number, B extends number> =
  ConstruireTuple<A> extends [...ConstruireTuple<B>, ...infer Reste]
    ? Reste["length"]
    : never; // Resultat negatif non supporte

type Diff1 = Soustraire<10, 3>;  // 7
type Diff2 = Soustraire<5, 5>;   // 0
type Diff3 = Soustraire<100, 1>; // 99
// type Diff4 = Soustraire<3, 10>; // never (negatif)
```

### Multiplication (via récursion)

```typescript
// Multiplication : additionner A, B fois
type Multiplier<
  A extends number,
  B extends number,
  Acc extends any[] = []
> =
  B extends 0
    ? Acc["length"] & number
    : Multiplier<
        A,
        Soustraire<B, 1> & number,
        [...Acc, ...ConstruireTuple<A>]
      >;

type Produit1 = Multiplier<3, 4>;   // 12
type Produit2 = Multiplier<5, 5>;   // 25
type Produit3 = Multiplier<7, 0>;   // 0
type Produit4 = Multiplier<2, 10>;  // 20
```

### Comparaison

```typescript
// Verifier si A est inferieur a B
type EstInferieur<A extends number, B extends number> =
  ConstruireTuple<A> extends [...ConstruireTuple<B>, ...infer _]
    ? false
    : A extends B
    ? false
    : true;

type LT1 = EstInferieur<3, 5>;   // true
type LT2 = EstInferieur<5, 3>;   // false
type LT3 = EstInferieur<3, 3>;   // false

// Verifier si A est egal a B
type EstEgal<A extends number, B extends number> =
  A extends B ? (B extends A ? true : false) : false;

// Minimum et Maximum
type Min<A extends number, B extends number> =
  EstInferieur<A, B> extends true ? A : B;

type Max<A extends number, B extends number> =
  EstInferieur<A, B> extends true ? B : A;

type Min1 = Min<3, 7>;  // 3
type Max1 = Max<3, 7>;  // 7
```

### Range : générer une sequence de nombres

```typescript
// Generer un tuple [0, 1, 2, ..., N-1]
type Range<
  N extends number,
  Acc extends number[] = []
> =
  Acc["length"] extends N
    ? Acc
    : Range<N, [...Acc, Acc["length"]]>;

type R5 = Range<5>;   // [0, 1, 2, 3, 4]
type R3 = Range<3>;   // [0, 1, 2]
type R0 = Range<0>;   // []

// Convertir en union
type RangeUnion<N extends number> = Range<N>[number];

type RU5 = RangeUnion<5>; // 0 | 1 | 2 | 3 | 4
```

---

## String parsing au niveau des types

### Parser une chaine en tokens

```typescript
// Decouper une chaine par un separateur
type Split<S extends string, Sep extends string> =
  S extends `${infer Debut}${Sep}${infer Fin}`
    ? [Debut, ...Split<Fin, Sep>]
    : S extends ""
    ? []
    : [S];

type Mots = Split<"bonjour le monde", " ">;
// ["bonjour", "le", "monde"]

type Segments = Split<"/api/utilisateurs/123", "/">;
// ["", "api", "utilisateurs", "123"]
```

### Joindre un tuple en chaine

```typescript
// L'inverse de Split : joindre un tuple avec un separateur
type Join<
  T extends string[],
  Sep extends string
> =
  T extends []
    ? ""
    : T extends [infer Premier extends string]
    ? Premier
    : T extends [infer Premier extends string, ...infer Reste extends string[]]
    ? `${Premier}${Sep}${Join<Reste, Sep>}`
    : never;

type J1 = Join<["a", "b", "c"], "-">;   // "a-b-c"
type J2 = Join<["hello", "world"], " ">; // "hello world"
type J3 = Join<["seul"], ".">;           // "seul"
type J4 = Join<[], ",">;                  // ""
```

### Remplacer dans une chaine

```typescript
// Remplacer toutes les occurrences d'un pattern
type RemplaceAll<
  S extends string,
  Chercher extends string,
  Remplacer extends string
> =
  S extends `${infer Debut}${Chercher}${infer Fin}`
    ? RemplaceAll<`${Debut}${Remplacer}${Fin}`, Chercher, Remplacer>
    : S;

type R1 = RemplaceAll<"hello world", "o", "0">;
// "hell0 w0rld"

type R2 = RemplaceAll<"aaa", "a", "bb">;
// Attention : boucle infinie potentielle si Remplacer contient Chercher !
// En pratique TypeScript detecte et limite la recursion
```

### Compter les caracteres d'une chaine

```typescript
// Longueur d'une chaine au niveau des types
type LongueurChaine<
  S extends string,
  Acc extends any[] = []
> =
  S extends `${infer _}${infer Reste}`
    ? LongueurChaine<Reste, [...Acc, any]>
    : Acc["length"];

type LC1 = LongueurChaine<"hello">;    // 5
type LC2 = LongueurChaine<"bonjour">;  // 7
type LC3 = LongueurChaine<"">;          // 0
```

### Trim (supprimer les espaces)

```typescript
// Supprimer les espaces au debut
type TrimDebut<S extends string> =
  S extends ` ${infer Reste}` ? TrimDebut<Reste> :
  S extends `\t${infer Reste}` ? TrimDebut<Reste> :
  S extends `\n${infer Reste}` ? TrimDebut<Reste> :
  S;

// Supprimer les espaces a la fin
type TrimFin<S extends string> =
  S extends `${infer Reste} ` ? TrimFin<Reste> :
  S extends `${infer Reste}\t` ? TrimFin<Reste> :
  S extends `${infer Reste}\n` ? TrimFin<Reste> :
  S;

// Trim complet
type Trim<S extends string> = TrimDebut<TrimFin<S>>;

type T1 = Trim<"  hello  ">;     // "hello"
type T2 = Trim<"\t bonjour \n">; // "bonjour"
```

---

## Type-level JSON parser (simplifie)

C'est un des exemples les plus impressionnants de type-level programming : un parser JSON qui fonctionne entièrement au niveau des types.

```typescript
// Parser un nombre
type ParseNombre<S extends string> =
  S extends `${infer N extends number}` ? N : never;

type PN1 = ParseNombre<"42">;    // 42
type PN2 = ParseNombre<"3.14">;  // 3.14

// Parser un booleen
type ParseBooleen<S extends string> =
  S extends "true" ? true :
  S extends "false" ? false :
  never;

// Parser null
type ParseNull<S extends string> =
  S extends "null" ? null : never;

// Parser une chaine JSON (entre guillemets)
type ParseChaineJSON<S extends string> =
  S extends `"${infer Contenu}"` ? Contenu : never;

// Parser une valeur simple
type ParseValeur<S extends string> =
  Trim<S> extends `"${infer _}"` ? ParseChaineJSON<Trim<S>> :
  Trim<S> extends "true" ? true :
  Trim<S> extends "false" ? false :
  Trim<S> extends "null" ? null :
  ParseNombre<Trim<S>> extends never ? never :
  ParseNombre<Trim<S>>;

// Tests
type V1 = ParseValeur<'"hello"'>;  // "hello"
type V2 = ParseValeur<"42">;       // 42
type V3 = ParseValeur<"true">;     // true
type V4 = ParseValeur<"null">;     // null
```

> **Note** : Un parser JSON complet au niveau des types est possible mais extremement complexe (des centaines de lignes). L'exemple ci-dessus montre les principes de base. Pour voir une implementation complete, consultez les projets comme `type-challenges` sur GitHub.

---

## Type-level state machines

### Machine a états typee

```typescript
// Definir les etats et transitions d'une machine a etats
interface Transitions {
  eteint: "allumer";
  allume: "eteindre" | "mettre_en_veille";
  veille: "reveiller" | "eteindre";
}

// Le type de l'action suivante depend de l'etat actuel
type ActionsSuivantes<Etat extends keyof Transitions> = Transitions[Etat];

type A1 = ActionsSuivantes<"eteint">;  // "allumer"
type A2 = ActionsSuivantes<"allume">;  // "eteindre" | "mettre_en_veille"
type A3 = ActionsSuivantes<"veille">;  // "reveiller" | "eteindre"

// Definir les transitions d'etat
type EtatSuivant<
  Etat extends keyof Transitions,
  Action extends ActionsSuivantes<Etat>
> =
  Etat extends "eteint"
    ? Action extends "allumer" ? "allume" : never
  : Etat extends "allume"
    ? Action extends "eteindre" ? "eteint"
    : Action extends "mettre_en_veille" ? "veille"
    : never
  : Etat extends "veille"
    ? Action extends "reveiller" ? "allume"
    : Action extends "eteindre" ? "eteint"
    : never
  : never;

// Verifier une sequence de transitions
type VerifierSequence<
  Etat extends keyof Transitions,
  Actions extends string[]
> =
  Actions extends [infer Premiere, ...infer Reste]
    ? Premiere extends ActionsSuivantes<Etat>
      ? Reste extends string[]
        ? VerifierSequence<EtatSuivant<Etat, Premiere & ActionsSuivantes<Etat>> & keyof Transitions, Reste>
        : EtatSuivant<Etat, Premiere & ActionsSuivantes<Etat>>
      : never // Action invalide dans cet etat
    : Etat; // Fin de la sequence, retourne l'etat final

// Tests
type Seq1 = VerifierSequence<"eteint", ["allumer", "mettre_en_veille", "reveiller"]>;
// "allume"

type Seq2 = VerifierSequence<"eteint", ["allumer", "eteindre"]>;
// "eteint"
```

### Machine a états avec une classe

```typescript
// Implementation runtime avec verification au niveau des types
class MachineEtat<Etat extends keyof Transitions> {
  constructor(private etat: Etat) {}

  transition<Action extends ActionsSuivantes<Etat>>(
    action: Action
  ): MachineEtat<EtatSuivant<Etat, Action> & keyof Transitions> {
    // Logique de transition runtime
    const nouvelEtat = this.calculerNouvelEtat(action);
    return new MachineEtat(nouvelEtat) as any;
  }

  private calculerNouvelEtat(action: string): any {
    const transitions: Record<string, Record<string, string>> = {
      eteint: { allumer: "allume" },
      allume: { eteindre: "eteint", mettre_en_veille: "veille" },
      veille: { reveiller: "allume", eteindre: "eteint" },
    };
    return transitions[this.etat as string]?.[action];
  }

  obtenirEtat(): Etat {
    return this.etat;
  }
}

// Utilisation type-safe
const machine = new MachineEtat("eteint");
const allume = machine.transition("allumer");
// allume est de type MachineEtat<"allume">

const enVeille = allume.transition("mettre_en_veille");
// enVeille est de type MachineEtat<"veille">

// Erreur de compilation ! "allumer" n'est pas une action valide depuis "veille"
// enVeille.transition("allumer");
```

---

## Limites de récursion TypeScript

### La profondeur maximale

TypeScript impose une **limite de récursion** pour éviter les boucles infinies et les temps de compilation excessifs.

```typescript
// TypeScript supporte environ 1000 niveaux de recursion pour les types
// Mais en pratique, il est recommande de rester sous 50-100 niveaux

// Ce type atteindra la limite si N est trop grand
type GrandTuple<N extends number, Acc extends any[] = []> =
  Acc["length"] extends N
    ? Acc
    : GrandTuple<N, [...Acc, any]>;

// OK
type T50 = GrandTuple<50>;   // Fonctionne

// Potentiellement problematique pour de tres grandes valeurs
// type T10000 = GrandTuple<10000>; // Peut echouer
```

### Tail-call optimization

Depuis TypeScript 4.5, les types récursifs beneficient d'une **optimisation tail-call** dans certains cas. Cela signifie que si la récursion est en position terminale, TypeScript peut gérer une profondeur beaucoup plus grande.

```typescript
// Version SANS tail-call optimization
// Le resultat est construit en "empilant" les appels
type InverserSans<T extends any[]> =
  T extends [infer P, ...infer R]
    ? [...InverserSans<R>, P]  // L'appel recursif n'est PAS en position terminale
    : [];                       // car le spread [..., P] est apres

// Version AVEC tail-call optimization (accumulateur)
type InverserAvec<T extends any[], Acc extends any[] = []> =
  T extends [infer P, ...infer R]
    ? InverserAvec<R, [P, ...Acc]>  // L'appel recursif EST en position terminale
    : Acc;

// Les deux donnent le meme resultat, mais la version avec accumulateur
// supporte des tuples beaucoup plus grands
type Test1 = InverserSans<[1, 2, 3, 4, 5]>;  // [5, 4, 3, 2, 1]
type Test2 = InverserAvec<[1, 2, 3, 4, 5]>;   // [5, 4, 3, 2, 1]
```

### Techniques pour optimiser la récursion

```typescript
// 1. Utiliser un accumulateur (tail-call)
type CompterAvecAcc<T extends any[], Acc extends any[] = []> =
  T extends [any, ...infer R]
    ? CompterAvecAcc<R, [...Acc, any]>
    : Acc["length"];

// 2. Diviser pour regner (quand applicable)
// Au lieu de traiter un element a la fois, traiter par paires
type LongueurOptimisee<T extends any[]> =
  T extends { length: infer L extends number } ? L : never;

// 3. Utiliser les types natifs quand possible
// Preferer T["length"] a un compteur recursif maison
```

---

## Comparaison avec Haskell et le type-level programming

### Analogies avec la programmation fonctionnelle

Le type-level programming en TypeScript partage beaucoup de concepts avec Haskell :

```typescript
// Haskell : data List a = Nil | Cons a (List a)
// TypeScript :
type Liste<T> =
  | { tag: "vide" }
  | { tag: "element"; valeur: T; suivant: Liste<T> };

// Haskell : map :: (a -> b) -> [a] -> [b]
// TypeScript (au niveau des types) :
type MapperTuple<T extends any[], F extends Record<any, any>> =
  T extends [infer Premier, ...infer Reste]
    ? [Premier extends keyof F ? F[Premier] : never, ...MapperTuple<Reste, F>]
    : [];

// Mapping de types
type Correspondances = {
  "chaine": string;
  "nombre": number;
  "booleen": boolean;
};

type Resultat = MapperTuple<["chaine", "nombre", "booleen"], Correspondances>;
// [string, number, boolean]
```

### Ce que TypeScript ne peut pas faire (facilement)

```typescript
// 1. Les nombres negatifs au niveau des types
// Il n'y a pas de representant natif pour les nombres negatifs

// 2. La recursion infinie
// TypeScript impose des limites strictes de recursion

// 3. Les types dependants complets
// On ne peut pas avoir un type qui depend d'une valeur runtime
// (sauf via des workarounds comme les branded types)

// 4. Les HKTs (Higher-Kinded Types) natifs
// TypeScript ne supporte pas nativement les types de types
// On peut les simuler avec des workarounds :
interface TypeConstructeur {
  type: unknown;
}

interface TableauConstructeur extends TypeConstructeur {
  type: this["type"] extends infer T ? T[] : never;
}

// Mais c'est verbeux et limité
```

---

## Exercices puzzles

### Exercice 1 : Fibonacci au niveau des types

Implementez le calcul de Fibonacci au niveau des types.

<details>
<summary>Solution</summary>

```typescript
// Fibonacci avec des tuples comme representation des nombres
type Fibonacci<
  N extends number,
  Precedent extends any[] = [],        // F(n-2), demarre a 0
  Courant extends any[] = [any],       // F(n-1), demarre a 1
  Compteur extends any[] = []          // Compteur de 0 a N
> =
  Compteur["length"] extends N
    ? Precedent["length"]
    : Fibonacci<
        N,
        Courant,                         // Le nouveau precedent = ancien courant
        [...Precedent, ...Courant],      // Le nouveau courant = somme
        [...Compteur, any]               // Incrementer le compteur
      >;

type Fib0 = Fibonacci<0>;   // 0
type Fib1 = Fibonacci<1>;   // 1
type Fib2 = Fibonacci<2>;   // 1
type Fib3 = Fibonacci<3>;   // 2
type Fib4 = Fibonacci<4>;   // 3
type Fib5 = Fibonacci<5>;   // 5
type Fib6 = Fibonacci<6>;   // 8
type Fib7 = Fibonacci<7>;   // 13
type Fib8 = Fibonacci<8>;   // 21
type Fib10 = Fibonacci<10>; // 55
```
</details>

### Exercice 2 : Inverser une chaine au niveau des types

Creez un type `InverserChaine<S>` qui inverse une chaine.

<details>
<summary>Solution</summary>

```typescript
// Version simple (sans accumulateur)
type InverserChaineSimple<S extends string> =
  S extends `${infer Premier}${infer Reste}`
    ? `${InverserChaineSimple<Reste>}${Premier}`
    : "";

// Version avec accumulateur (tail-call optimized)
type InverserChaine<
  S extends string,
  Acc extends string = ""
> =
  S extends `${infer Premier}${infer Reste}`
    ? InverserChaine<Reste, `${Premier}${Acc}`>
    : Acc;

// Tests
type IC1 = InverserChaine<"hello">;    // "olleh"
type IC2 = InverserChaine<"abc">;      // "cba"
type IC3 = InverserChaine<"a">;        // "a"
type IC4 = InverserChaine<"">;          // ""
type IC5 = InverserChaine<"TypeScript">; // "tpircSepyT"
```
</details>

### Exercice 3 : Type-level FizzBuzz

Implementez FizzBuzz au niveau des types pour les nombres de 1 a N.

<details>
<summary>Solution</summary>

```typescript
// Helpers : divisibilite par 3 et 5
// On utilise la soustraction repetee

type EstDivisiblePar3<N extends number, Acc extends any[] = ConstruireTuple<N>> =
  Acc extends [any, any, any, ...infer Reste]
    ? Reste["length"] extends 0
      ? true
      : EstDivisiblePar3<Reste["length"], Reste>
    : Acc["length"] extends 0
    ? true
    : false;

type EstDivisiblePar5<N extends number, Acc extends any[] = ConstruireTuple<N>> =
  Acc extends [any, any, any, any, any, ...infer Reste]
    ? Reste["length"] extends 0
      ? true
      : EstDivisiblePar5<Reste["length"], Reste>
    : Acc["length"] extends 0
    ? true
    : false;

// FizzBuzz pour un seul nombre
type FizzBuzzUnique<N extends number> =
  EstDivisiblePar3<N> extends true
    ? EstDivisiblePar5<N> extends true
      ? "FizzBuzz"
      : "Fizz"
    : EstDivisiblePar5<N> extends true
    ? "Buzz"
    : N;

// Generer la sequence FizzBuzz de 1 a N
type FizzBuzz<
  N extends number,
  Compteur extends any[] = [any],   // Commence a 1
  Acc extends any[] = []
> =
  Compteur["length"] extends Additionner<N, 1>
    ? Acc
    : FizzBuzz<
        N,
        [...Compteur, any],
        [...Acc, FizzBuzzUnique<Compteur["length"]>]
      >;

// Test
type FB15 = FizzBuzz<15>;
// [1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz"]
```
</details>

### Exercice 4 : Deep Get type-safe

Creez un type qui permet d'acceder à une valeur profondement imbriquee de manière type-safe.

<details>
<summary>Solution</summary>

```typescript
// Split une chaine par "."
type SplitChemin<S extends string> =
  S extends `${infer Cle}.${infer Reste}`
    ? [Cle, ...SplitChemin<Reste>]
    : [S];

// Naviguer recursivement dans un type
type NaviguerType<T, Chemin extends string[]> =
  Chemin extends [infer Premier, ...infer Reste]
    ? Premier extends keyof T
      ? Reste extends string[]
        ? NaviguerType<T[Premier], Reste>
        : T[Premier]
      : Premier extends `${number}`
      ? T extends (infer E)[]
        ? Reste extends string[]
          ? NaviguerType<E, Reste>
          : E
        : never
      : never
    : T;

// Type final
type DeepGet<T, Chemin extends string> = NaviguerType<T, SplitChemin<Chemin>>;

// Test
interface BaseDeDonnees {
  utilisateurs: {
    profil: {
      nom: string;
      contact: {
        email: string;
        telephones: string[];
      };
    };
    preferences: {
      theme: "clair" | "sombre";
      langue: string;
    };
  }[];
}

type T1 = DeepGet<BaseDeDonnees, "utilisateurs">;
// { profil: ...; preferences: ... }[]

type T2 = DeepGet<BaseDeDonnees, "utilisateurs.0.profil.nom">;
// string

type T3 = DeepGet<BaseDeDonnees, "utilisateurs.0.profil.contact.email">;
// string

type T4 = DeepGet<BaseDeDonnees, "utilisateurs.0.preferences.theme">;
// "clair" | "sombre"
```
</details>

### Exercice 5 : Permutations d'un tuple

Creez un type qui généré toutes les permutations d'un tuple.

<details>
<summary>Solution</summary>

```typescript
// Retirer un element d'un tuple par index
type Retirer<T extends any[], E> =
  T extends [infer Premier, ...infer Reste]
    ? Premier extends E
      ? Reste
      : [Premier, ...Retirer<Reste, E>]
    : [];

// Generer toutes les permutations
type Permutations<T extends any[], Acc extends any[] = []> =
  T["length"] extends 0
    ? [Acc]
    : T[number] extends infer E
    ? E extends E // Distribution sur chaque element
      ? Permutations<Retirer<T, E>, [...Acc, E]>
      : never
    : never;

// Test
type P1 = Permutations<[1, 2]>;
// [[1, 2], [2, 1]]

type P2 = Permutations<[1, 2, 3]>;
// [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]

// Attention : le nombre de permutations est N!, donc
// pour N = 4 on obtient 24 types, N = 5 donne 120 types, etc.
// Ne pas depasser N = 6-7 pour eviter les problemes de performance.
```
</details>

---

## Résumé

### Concepts maitrises

| Concept | Description |
|---------|-------------|
| Types récursifs | Types qui se referencent eux-memes |
| Arbres et listes | Structures de donnees recursives |
| Arithmetique type-level | Addition, soustraction via tuples |
| String parsing | Decomposer et transformer des chaines |
| State machines | Vérifier des sequences de transitions |
| Tail-call optimization | Accumulateur pour récursion profonde |

### Regles d'or du type-level programming

1. **Representez les nombres par des tuples** pour l'arithmetique
2. **Utilisez un accumulateur** pour la tail-call optimization
3. **Restez sous 50-100 niveaux** de récursion en pratique
4. **Testez incrementalement** : chaque type intermédiaire separement
5. **Evitez la complexite inutile** : le type-level programming est puissant mais difficile a maintenir
6. **Documentez abondamment** : les types complexes sont incomprehensibles sans explication

### Quand utiliser le type-level programming ?

- **Oui** : Libraries, frameworks, outils de validation, ORMs
- **Non** : Code metier simple, applications CRUD basiques
- **Avec prudence** : Quand la complexite du type dépasse celle du code runtime

---

## Pour aller plus loin

Le prochain module, **[14 — Decorateurs & Metadata (Stage 3)](./14-decorateurs-metadata.md)**, change de registre et explore les decorateurs — une fonctionnalite qui combine le runtime et le système de types pour de la metaprogrammation elegante.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 13 type programming](../screencasts/screencast-13-type-programming.md)
2. **Lab** : [lab-13-type-programming](../labs/lab-13-type-programming/README)
3. **Quiz** : [quiz 13 type programming](../quizzes/quiz-13-type-programming.html)
:::
