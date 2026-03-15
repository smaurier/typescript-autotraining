# 12 — Mapped Types & Template Literal Types

> **Duree estimee** : 5 heures
> **Difficulte** : 4/5
> **Prerequis** : Generics, conditional types, infer, keyof, unions
> **Objectifs** :
> - Maitriser les mapped types et leurs modificateurs
> - Comprendre le key remapping avec `as`
> - Utiliser les template literal types pour manipuler des chaines au niveau des types
> - Combiner mapped types et template literals pour des transformations avancees

---

> **⚠️ Ce module est un cran au-dessus.** C'est normal de galerer ici. Si tu bloques plus de 20 min, relis la theorie du module precedent. Si apres 45 min c'est toujours flou, passe au module suivant et reviens plus tard — certains concepts prennent des jours a decanter.

## Introduction

Les **mapped types** et les **template literal types** sont deux mecanismes complementaires :
- Les **mapped types** permettent de transformer la structure d'un type objet (ajouter/retirer des modificateurs, renommer des cles, filtrer des proprietes)
- Les **template literal types** permettent de manipuler des types string (construction, decomposition, transformation)

### Analogie

Pensez aux mapped types comme a une **machine de duplication avec modification** : vous inserez un plan de maison (un type objet), et la machine produit un nouveau plan ou chaque piece a ete modifiee selon vos instructions (agrandie, verrouillée, renommee...).

Les template literal types, eux, sont comme un **jeu de Scrabble** : vous assemblez des lettres et des mots pour former de nouveaux mots, avec des regles de transformation (majuscules, minuscules, etc.).

---

## Mapped Types : les bases

### Syntaxe fondamentale

```typescript
// Un mapped type itere sur les cles d'un type
type MonMappedType<T> = {
  [K in keyof T]: T[K];
};

// C'est un "identity" mapped type : il reproduit le type a l'identique
// Mais on peut modifier la valeur, la cle, ou les modificateurs
```

### Modifier les valeurs

```typescript
interface Utilisateur {
  nom: string;
  age: number;
  actif: boolean;
  email: string;
}

// Transformer toutes les valeurs en string
type ToutEnString<T> = {
  [K in keyof T]: string;
};

type UtilisateurString = ToutEnString<Utilisateur>;
// { nom: string; age: string; actif: string; email: string }

// Envelopper chaque valeur dans un tableau
type EnTableau<T> = {
  [K in keyof T]: T[K][];
};

type UtilisateurTableaux = EnTableau<Utilisateur>;
// { nom: string[]; age: number[]; actif: boolean[]; email: string[] }

// Envelopper chaque valeur dans une Promise
type EnPromise<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type UtilisateurAsync = EnPromise<Utilisateur>;
// { nom: Promise<string>; age: Promise<number>; ... }

// Creer des getters
type Getters<T> = {
  [K in keyof T]: () => T[K];
};

type UtilisateurGetters = Getters<Utilisateur>;
// { nom: () => string; age: () => number; ... }
```

---

## Les modificateurs : readonly et optionnel

### Ajouter des modificateurs

```typescript
// Ajouter readonly a toutes les proprietes
type ToutReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
// C'est exactement l'implementation de Readonly<T>

// Ajouter le modificateur optionnel
type ToutOptionnel<T> = {
  [K in keyof T]?: T[K];
};
// C'est exactement l'implementation de Partial<T>

// Combiner les deux
type ReadonlyOptionnel<T> = {
  readonly [K in keyof T]?: T[K];
};

interface Config {
  hote: string;
  port: number;
  debug: boolean;
}

type ConfigGelee = ReadonlyOptionnel<Config>;
// {
//   readonly hote?: string;
//   readonly port?: number;
//   readonly debug?: boolean;
// }
```

### Supprimer des modificateurs avec `-`

```typescript
// Supprimer readonly (rendre mutable)
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface Point {
  readonly x: number;
  readonly y: number;
}

type PointMutable = Mutable<Point>;
// { x: number; y: number }  -- plus de readonly

// Supprimer le modificateur optionnel (rendre obligatoire)
type ToutObligatoire<T> = {
  [K in keyof T]-?: T[K];
};
// C'est exactement l'implementation de Required<T>

interface Preferences {
  theme?: string;
  langue?: string;
  notifications?: boolean;
}

type PreferencesCompletes = ToutObligatoire<Preferences>;
// { theme: string; langue: string; notifications: boolean }

// Ajouter explicitement avec `+` (c'est le comportement par defaut)
type ExpliciteReadonly<T> = {
  +readonly [K in keyof T]+?: T[K];
};
// Equivalent a readonly + optionnel
```

---

## Key Remapping avec `as`

### Syntaxe

Depuis TypeScript 4.1, on peut **renommer les cles** dans un mapped type grace a `as`.

```typescript
// Syntaxe : [K in keyof T as NouvelleClé]: T[K]
type RenommerCles<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Personne {
  nom: string;
  age: number;
  email: string;
}

type PersonneGetters = RenommerCles<Personne>;
// {
//   getNom: () => string;
//   getAge: () => number;
//   getEmail: () => string;
// }
```

### Renommer avec des prefixes et suffixes

```typescript
// Creer des setters
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (valeur: T[K]) => void;
};

type PersonneSetters = Setters<Personne>;
// {
//   setNom: (valeur: string) => void;
//   setAge: (valeur: number) => void;
//   setEmail: (valeur: string) => void;
// }

// Creer des handlers d'evenements
type EvenementHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    ancienneValeur: T[K],
    nouvelleValeur: T[K]
  ) => void;
};

type PersonneHandlers = EvenementHandlers<Personne>;
// {
//   onNomChange: (ancienneValeur: string, nouvelleValeur: string) => void;
//   onAgeChange: (ancienneValeur: number, nouvelleValeur: number) => void;
//   onEmailChange: (ancienneValeur: string, nouvelleValeur: string) => void;
// }
```

### Filtrer des cles avec `as` et `never`

Le remapping avec `as` permet aussi de **filtrer** des cles : si le nouveau nom est `never`, la propriete est exclue.

```typescript
// Garder uniquement les proprietes de type string
type ProprietesString<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixte {
  nom: string;
  age: number;
  email: string;
  actif: boolean;
  ville: string;
}

type SeulementStrings = ProprietesString<Mixte>;
// { nom: string; email: string; ville: string }

// Exclure les proprietes dont le nom commence par un underscore
type SansPrives<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

interface AvecPrives {
  nom: string;
  _id: number;
  email: string;
  _cache: Map<string, any>;
}

type Public = SansPrives<AvecPrives>;
// { nom: string; email: string }

// Garder uniquement les methodes
type SeulementMethodes<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// Garder uniquement les proprietes (pas les methodes)
type SeulementProprietes<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

---

## Mapped types avances

### Transformer les cles en minuscules/majuscules

```typescript
type ClesEnMajuscules<T> = {
  [K in keyof T as Uppercase<string & K>]: T[K];
};

interface ApiReponse {
  userId: number;
  userName: string;
  userEmail: string;
}

type ReponseMajuscules = ClesEnMajuscules<ApiReponse>;
// { USERID: number; USERNAME: string; USEREMAIL: string }
```

### Creer un type avec getters ET setters

```typescript
type GettersEtSetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (valeur: T[K]) => void;
};

interface Dimensions {
  largeur: number;
  hauteur: number;
}

type DimensionsAccesseurs = GettersEtSetters<Dimensions>;
// {
//   getLargeur: () => number;
//   getHauteur: () => number;
// } & {
//   setLargeur: (valeur: number) => void;
//   setHauteur: (valeur: number) => void;
// }
```

### DeepReadonly et DeepPartial avec mapped types

```typescript
// DeepReadonly recursif
type DeepReadonly<T> =
  T extends Function
    ? T
    : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// DeepPartial recursif
type DeepPartial<T> =
  T extends Function
    ? T
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

// DeepRequired recursif
type DeepRequired<T> =
  T extends Function
    ? T
    : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

// DeepMutable recursif
type DeepMutable<T> =
  T extends Function
    ? T
    : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T;

// Test
interface AppConfig {
  serveur: {
    readonly hote: string;
    readonly port: number;
    ssl: {
      readonly actif: boolean;
      readonly certificat?: string;
    };
  };
  logs?: {
    niveau?: "debug" | "info" | "error";
    fichier?: string;
  };
}

type ConfigMutable = DeepMutable<AppConfig>;
// Plus aucun readonly, meme en profondeur

type ConfigComplete = DeepRequired<AppConfig>;
// Plus aucun optionnel, meme en profondeur
```

---

## Template Literal Types

### Syntaxe de base

Les template literal types utilisent la meme syntaxe que les template strings de JavaScript, mais au niveau des types.

```typescript
// Type literal simple
type Salutation = `Bonjour ${string}`;

const s1: Salutation = "Bonjour Alice";   // OK
const s2: Salutation = "Bonjour monde";   // OK
// const s3: Salutation = "Au revoir";     // Erreur !

// Avec des unions, on obtient toutes les combinaisons
type Couleur = "rouge" | "vert" | "bleu";
type Taille = "petit" | "moyen" | "grand";

type ClasseCSS = `${Couleur}-${Taille}`;
// "rouge-petit" | "rouge-moyen" | "rouge-grand"
// | "vert-petit" | "vert-moyen" | "vert-grand"
// | "bleu-petit" | "bleu-moyen" | "bleu-grand"
// = 9 combinaisons au total !
```

### Types utilitaires pour les chaines

TypeScript fournit quatre utility types pour transformer les chaines au niveau des types :

```typescript
// Uppercase : convertir en majuscules
type U1 = Uppercase<"hello">;      // "HELLO"
type U2 = Uppercase<"bonjour">;    // "BONJOUR"

// Lowercase : convertir en minuscules
type L1 = Lowercase<"HELLO">;      // "hello"
type L2 = Lowercase<"BONJOUR">;    // "bonjour"

// Capitalize : premiere lettre en majuscule
type C1 = Capitalize<"hello">;     // "Hello"
type C2 = Capitalize<"bonjour">;   // "Bonjour"

// Uncapitalize : premiere lettre en minuscule
type UC1 = Uncapitalize<"Hello">;   // "hello"
type UC2 = Uncapitalize<"Bonjour">; // "bonjour"

// Ces types sont distribues sur les unions
type Mois = "janvier" | "fevrier" | "mars";
type MoisMaj = Capitalize<Mois>;
// "Janvier" | "Fevrier" | "Mars"
```

### Pattern inference avec template literals et infer

```typescript
// Extraire des parties d'une chaine
type ExtrairePrefixeSuffixe<T extends string> =
  T extends `${infer Prefixe}_${infer Suffixe}`
    ? { prefixe: Prefixe; suffixe: Suffixe }
    : never;

type R1 = ExtrairePrefixeSuffixe<"user_name">;
// { prefixe: "user"; suffixe: "name" }

type R2 = ExtrairePrefixeSuffixe<"btn_primary_large">;
// { prefixe: "btn"; suffixe: "primary_large" }

// Convertir camelCase en snake_case (simplifie)
type CamelVersSnake<T extends string> =
  T extends `${infer Debut}${infer Lettre}${infer Fin}`
    ? Lettre extends Uppercase<Lettre>
      ? Lettre extends Lowercase<Lettre>
        ? `${Debut}${Lettre}${CamelVersSnake<Fin>}`
        : `${Debut}_${Lowercase<Lettre>}${CamelVersSnake<Fin>}`
      : `${Debut}${Lettre}${CamelVersSnake<Fin>}`
    : T;

type S1 = CamelVersSnake<"nomUtilisateur">;  // "nom_utilisateur"
type S2 = CamelVersSnake<"dateDeNaissance">;  // "date_de_naissance"
```

---

## Combinaisons puissantes : Mapped Types + Template Literals

### Pattern d'event handlers

```typescript
// Generer automatiquement des handlers pour chaque propriete
type PropHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    callback: (ancienne: T[K], nouvelle: T[K]) => void
  ) => void;
};

interface EtatFormulaire {
  nom: string;
  email: string;
  age: number;
}

type FormulaireHandlers = PropHandlers<EtatFormulaire>;
// {
//   onNomChange: (callback: (ancienne: string, nouvelle: string) => void) => void;
//   onEmailChange: (callback: (ancienne: string, nouvelle: string) => void) => void;
//   onAgeChange: (callback: (ancienne: number, nouvelle: number) => void) => void;
// }
```

### Creer des cles CSS-like

```typescript
// Generer des proprietes CSS typees
type Direction = "top" | "right" | "bottom" | "left";
type ProprieteMarge = `margin-${Direction}`;
// "margin-top" | "margin-right" | "margin-bottom" | "margin-left"

type ProprietePadding = `padding-${Direction}`;
type ProprieteBordure = `border-${Direction}`;

// Creer un type pour un objet de styles
type Styles = {
  [K in ProprieteMarge | ProprietePadding]?: string;
};

const mesStyles: Styles = {
  "margin-top": "10px",
  "padding-left": "20px",
  // "margin-center": "5px", // Erreur ! Pas une direction valide
};
```

### Convertir les cles d'un objet d'un format a un autre

```typescript
// Transformer les cles camelCase en SCREAMING_SNAKE_CASE pour des constantes
type VersScreamingSnake<S extends string> =
  S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
      ? `${Uppercase<T>}${VersScreamingSnake<U>}`
      : `${Uppercase<T>}_${VersScreamingSnake<U>}`
    : S;

type SnakeTest = VersScreamingSnake<"nomUtilisateur">;
// "NOM_UTILISATEUR"

// Appliquer la transformation aux cles d'un objet
type ObjetEnConstantes<T> = {
  [K in keyof T as VersScreamingSnake<string & K>]: T[K];
};

interface ActionsApp {
  ajouterUtilisateur: string;
  supprimerArticle: string;
  mettreAJour: string;
}

type Constantes = ObjetEnConstantes<ActionsApp>;
// {
//   AJOUTER_UTILISATEUR: string;
//   SUPPRIMER_ARTICLE: string;
//   METTRE_A_JOUR: string; // Simplifie ici
// }
```

---

## Path Types : acceder a des proprietes imbriquees

### Construire un type de chemins d'acces

```typescript
// Generer toutes les cles d'acces possibles en notation pointee
type CheminsPossibles<T, Prefixe extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? T[K] extends any[]
      ? `${Prefixe}${K}` | `${Prefixe}${K}.${number}`
      : `${Prefixe}${K}` | CheminsPossibles<T[K], `${Prefixe}${K}.`>
    : `${Prefixe}${K}`;
}[keyof T & string];

interface Formulaire {
  utilisateur: {
    nom: string;
    adresse: {
      rue: string;
      ville: string;
      codePostal: string;
    };
  };
  produits: string[];
}

type Chemins = CheminsPossibles<Formulaire>;
// "utilisateur"
// | "utilisateur.nom"
// | "utilisateur.adresse"
// | "utilisateur.adresse.rue"
// | "utilisateur.adresse.ville"
// | "utilisateur.adresse.codePostal"
// | "produits"
// | `produits.${number}`
```

### Obtenir le type d'une valeur a partir d'un chemin

```typescript
// Obtenir le type d'une valeur en suivant un chemin
type ObtenirParChemin<T, Chemin extends string> =
  Chemin extends `${infer Cle}.${infer Reste}`
    ? Cle extends keyof T
      ? ObtenirParChemin<T[Cle], Reste>
      : never
    : Chemin extends keyof T
    ? T[Chemin]
    : never;

// Tests
type V1 = ObtenirParChemin<Formulaire, "utilisateur.nom">;
// string

type V2 = ObtenirParChemin<Formulaire, "utilisateur.adresse.ville">;
// string

type V3 = ObtenirParChemin<Formulaire, "utilisateur.adresse">;
// { rue: string; ville: string; codePostal: string }

// Combiner pour une fonction get typee
function obtenir<T, C extends CheminsPossibles<T> & string>(
  objet: T,
  chemin: C
): ObtenirParChemin<T, C> {
  const cles = chemin.split(".");
  let resultat: any = objet;
  for (const cle of cles) {
    resultat = resultat[cle];
  }
  return resultat;
}

const formulaire: Formulaire = {
  utilisateur: {
    nom: "Alice",
    adresse: { rue: "123 rue Principale", ville: "Paris", codePostal: "75001" },
  },
  produits: ["stylo", "cahier"],
};

const ville = obtenir(formulaire, "utilisateur.adresse.ville");
// TypeScript sait que ville est de type string
```

---

## Patterns avances

### Builder pattern type avec mapped types

```typescript
// Creer un builder type-safe
type Builder<T, Remplis extends keyof T = never> = {
  [K in keyof T as K extends Remplis ? never : K extends string ? `avec${Capitalize<K>}` : never]:
    (valeur: T[K]) => Builder<T, Remplis | K>;
} & (
  [Exclude<keyof T, Remplis>] extends [never]
    ? { construire: () => T }
    : {}
);

// Simplifie pour l'exemple, en pratique on utilise une implementation
// a base de Proxy ou de classes

interface Maison {
  adresse: string;
  surface: number;
  chambres: number;
  garage: boolean;
}

// Le builder n'expose "construire" que quand TOUTES les proprietes sont remplies
// Cela garantit au niveau des types qu'on ne peut pas construire un objet incomplet
```

### Discriminated union helpers

```typescript
// Extraire le type d'un membre specifique d'une discriminated union
type ExtraireVariante<
  Union,
  Tag extends string,
  Valeur extends string
> = Union extends { [K in Tag]: Valeur } ? Union : never;

type Action =
  | { type: "AJOUTER"; payload: { nom: string } }
  | { type: "SUPPRIMER"; payload: { id: number } }
  | { type: "MODIFIER"; payload: { id: number; nom: string } };

type ActionAjouter = ExtraireVariante<Action, "type", "AJOUTER">;
// { type: "AJOUTER"; payload: { nom: string } }

// Generer un handler map type-safe
type ActionHandlers<A extends { type: string }> = {
  [T in A["type"]]: (action: Extract<A, { type: T }>) => void;
};

const handlers: ActionHandlers<Action> = {
  AJOUTER: (action) => {
    // action.payload est type { nom: string }
    console.log(`Ajout de ${action.payload.nom}`);
  },
  SUPPRIMER: (action) => {
    // action.payload est type { id: number }
    console.log(`Suppression de l'ID ${action.payload.id}`);
  },
  MODIFIER: (action) => {
    // action.payload est type { id: number; nom: string }
    console.log(`Modification de ${action.payload.id}: ${action.payload.nom}`);
  },
};
```

### Mapper des tuples

```typescript
// Les mapped types fonctionnent aussi sur les tuples
type TupleEnPromises<T extends any[]> = {
  [K in keyof T]: Promise<T[K]>;
};

type Original = [string, number, boolean];
type Promisifie = TupleEnPromises<Original>;
// [Promise<string>, Promise<number>, Promise<boolean>]

// Cela permet de typer Promise.all correctement
async function toutCharger<T extends any[]>(
  promesses: [...TupleEnPromises<T>]
): Promise<T> {
  return Promise.all(promesses) as any;
}

// Utilisation
async function exemple() {
  const [nom, age, actif] = await toutCharger<[string, number, boolean]>([
    Promise.resolve("Alice"),
    Promise.resolve(30),
    Promise.resolve(true),
  ]);
  // nom: string, age: number, actif: boolean
}
```

---

## Pratique : Exercices

### Exercice 1 : Creer un type `Nullable<T>`

Creez un type `Nullable<T>` qui rend toutes les proprietes de `T` potentiellement `null`.

<details>
<summary>Solution</summary>

```typescript
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Test
interface Profil {
  nom: string;
  age: number;
  photo: string;
}

type ProfilNullable = Nullable<Profil>;
// {
//   nom: string | null;
//   age: number | null;
//   photo: string | null;
// }

// Version profonde
type DeepNullable<T> =
  T extends Function
    ? T
    : T extends object
    ? { [K in keyof T]: DeepNullable<T[K]> | null }
    : T | null;
```
</details>

### Exercice 2 : Transformer les cles d'un objet en camelCase

Creez un type qui transforme les cles snake_case d'un objet en camelCase.

<details>
<summary>Solution</summary>

```typescript
// Transformer une chaine snake_case en camelCase
type SnakeVersCamel<S extends string> =
  S extends `${infer Debut}_${infer Lettre}${infer Fin}`
    ? `${Debut}${Uppercase<Lettre>}${SnakeVersCamel<Fin>}`
    : S;

// Tests unitaires du type
type SC1 = SnakeVersCamel<"nom_utilisateur">;      // "nomUtilisateur"
type SC2 = SnakeVersCamel<"date_de_naissance">;     // "dateDeNaissance"
type SC3 = SnakeVersCamel<"id">;                     // "id"

// Appliquer aux cles d'un objet
type ObjetCamelCase<T> = {
  [K in keyof T as SnakeVersCamel<string & K>]: T[K];
};

// Test
interface ReponseAPI {
  user_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  is_active: boolean;
}

type ReponseCamel = ObjetCamelCase<ReponseAPI>;
// {
//   userId: number;
//   firstName: string;
//   lastName: string;
//   emailAddress: string;
//   isActive: boolean;
// }

// Version recursive (profonde)
type DeepCamelCase<T> =
  T extends Function
    ? T
    : T extends object
    ? { [K in keyof T as SnakeVersCamel<string & K>]: DeepCamelCase<T[K]> }
    : T;
```
</details>

### Exercice 3 : Creer un type `PickByType<T, V>`

Creez un type qui ne garde que les proprietes dont la valeur est du type `V`.

<details>
<summary>Solution</summary>

```typescript
// Filtrer les proprietes par type de valeur
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// Test
interface Entite {
  id: number;
  nom: string;
  description: string;
  compteur: number;
  actif: boolean;
  tags: string[];
}

type ChampsString = PickByType<Entite, string>;
// { nom: string; description: string }

type ChampsNumber = PickByType<Entite, number>;
// { id: number; compteur: number }

type ChampsBoolean = PickByType<Entite, boolean>;
// { actif: boolean }

// Version inverse : OmitByType
type OmitByType<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

type SansStrings = OmitByType<Entite, string>;
// { id: number; compteur: number; actif: boolean; tags: string[] }
```
</details>

### Exercice 4 : Generer des event names a partir d'un type

A partir d'un type objet, generez un type union de tous les event names possibles au format `"propriete:change"`.

<details>
<summary>Solution</summary>

```typescript
// Generer des event names
type EventNames<T> = {
  [K in keyof T & string]: `${K}:change`;
}[keyof T & string];

interface Compteur {
  valeur: number;
  label: string;
  actif: boolean;
}

type CompteurEvents = EventNames<Compteur>;
// "valeur:change" | "label:change" | "actif:change"

// Version plus complete avec le type de payload
type EventMap<T> = {
  [K in keyof T & string as `${K}:change`]: {
    propriete: K;
    ancienneValeur: T[K];
    nouvelleValeur: T[K];
  };
};

type CompteurEventMap = EventMap<Compteur>;
// {
//   "valeur:change": { propriete: "valeur"; ancienneValeur: number; nouvelleValeur: number };
//   "label:change": { propriete: "label"; ancienneValeur: string; nouvelleValeur: string };
//   "actif:change": { propriete: "actif"; ancienneValeur: boolean; nouvelleValeur: boolean };
// }

// Typer un emetteur d'evenements
class EmetteurType<T extends Record<string, any>> {
  private handlers: Partial<Record<string, Function[]>> = {};

  sur<K extends keyof EventMap<T> & string>(
    evenement: K,
    handler: (payload: EventMap<T>[K]) => void
  ): void {
    if (!this.handlers[evenement]) {
      this.handlers[evenement] = [];
    }
    this.handlers[evenement]!.push(handler);
  }
}

const emetteur = new EmetteurType<Compteur>();
emetteur.sur("valeur:change", (payload) => {
  // payload est { propriete: "valeur"; ancienneValeur: number; nouvelleValeur: number }
  console.log(`Valeur: ${payload.ancienneValeur} -> ${payload.nouvelleValeur}`);
});
```
</details>

### Exercice 5 : Split d'une chaine en tuple

Creez un type `Split<S, Sep>` qui decoupe une chaine en un tuple de sous-chaines.

<details>
<summary>Solution</summary>

```typescript
// Decouper une chaine en tuple
type Split<
  S extends string,
  Sep extends string
> =
  S extends `${infer Debut}${Sep}${infer Fin}`
    ? [Debut, ...Split<Fin, Sep>]
    : S extends ""
    ? []
    : [S];

// Tests
type S1 = Split<"a.b.c", ".">;        // ["a", "b", "c"]
type S2 = Split<"hello world", " ">;   // ["hello", "world"]
type S3 = Split<"un-deux-trois", "-">; // ["un", "deux", "trois"]
type S4 = Split<"solo", ".">;          // ["solo"]
type S5 = Split<"", ".">;             // []

// Application : typer l'acces par chemin
type AccesParChemin<T, Chemin extends string[]> =
  Chemin extends [infer Premier, ...infer Reste]
    ? Premier extends keyof T
      ? Reste extends string[]
        ? AccesParChemin<T[Premier], Reste>
        : T[Premier]
      : never
    : T;

// Combiner Split et AccesParChemin
type Get<T, C extends string> = AccesParChemin<T, Split<C, ".">>;

interface Donnees {
  utilisateur: {
    profil: {
      nom: string;
      age: number;
    };
  };
}

type Nom = Get<Donnees, "utilisateur.profil.nom">; // string
type Age = Get<Donnees, "utilisateur.profil.age">; // number
```
</details>

---

## Resume

### Mapped Types

| Concept | Syntaxe | Effet |
|---------|---------|-------|
| Mapped type de base | `{ [K in keyof T]: ... }` | Itere sur les cles |
| Ajouter readonly | `{ readonly [K in keyof T]: ... }` | Proprietes en lecture seule |
| Retirer readonly | `{ -readonly [K in keyof T]: ... }` | Proprietes modifiables |
| Ajouter optionnel | `{ [K in keyof T]?: ... }` | Proprietes optionnelles |
| Retirer optionnel | `{ [K in keyof T]-?: ... }` | Proprietes obligatoires |
| Key remapping | `{ [K in keyof T as ...]: ... }` | Renommer les cles |
| Filtrer des cles | `as ... ? K : never` | Exclure des proprietes |

### Template Literal Types

| Type | Effet | Exemple |
|------|-------|---------|
| `` `${A}${B}` `` | Concatenation | `"hello" + "world"` |
| `Uppercase<T>` | Majuscules | `"hello"` -> `"HELLO"` |
| `Lowercase<T>` | Minuscules | `"HELLO"` -> `"hello"` |
| `Capitalize<T>` | Premiere majuscule | `"hello"` -> `"Hello"` |
| `Uncapitalize<T>` | Premiere minuscule | `"Hello"` -> `"hello"` |
| `infer` dans template | Pattern matching | Extraire des parties |

### Points cles

1. Les mapped types sont la base de `Partial`, `Required`, `Readonly`, `Pick`
2. Le key remapping avec `as` permet des renommages et filtrages puissants
3. Les template literal types generent automatiquement toutes les combinaisons d'unions
4. Combiner mapped types + template literals = transformations tres expressives
5. Les path types permettent un acces type-safe a des proprietes imbriquees

---

## Pour aller plus loin

Le prochain module, **[13 — Types recursifs & Type-Level Programming](./13-types-recursifs-type-programming.md)**, pousse ces concepts a l'extreme en explorant les types recursifs, l'arithmetique au niveau des types, et le parsing de chaines au niveau du systeme de types.
