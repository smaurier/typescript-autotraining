# 08 — Enums, Tuples & Types speciaux (never, unknown, void)

> **Duree estimee** : 4 heures
> **Difficulte** : 2/5
> **Prérequis** : Modules 01 a 07 (types de base, fonctions, interfaces, unions, classes, generics)
> **Objectifs** :
>
> - Maîtriser les enums numériques, string et const
> - Savoir quand utiliser les enums vs les unions de litteraux
> - Comprendre les tuples, tuples readonly et tuples nommes
> - Maîtriser le type `never` et son role dans l'exhaustivite
> - Utiliser `unknown` comme alternative securisee a `any`
> - Distinguer `void`, `undefined` et `null`
> - Decouvrir `symbol` et `unique symbol`
> - Pratiquer les assertions de types avancees

---

## Introduction — Pourquoi ces types existent-ils ?

### Le problème qu'on cherche à résoudre

Les types vus jusque-la couvrent la majorité des cas, mais pas tous. Certaines situations demandent des outils plus précis :

- représenter une liste fermée de valeurs possibles
- décrire un tableau dont l'ordre et la taille comptent vraiment
- exprimer qu'une valeur est inconnue pour l'instant
- exprimer qu'un cas est impossible
- distinguer une fonction qui ne retourne rien d'une fonction qui retourne réellement une valeur

Sans ces types spéciaux, on finit par utiliser des types trop larges, donc moins sûrs.

### La solution : des types spécialisés

Ce module présente justement ces outils particuliers :

- les `enum` pour nommer un ensemble de constantes
- les tuples pour dire "a l'index 0 j'ai ceci, a l'index 1 j'ai cela"
- `unknown` pour rester prudent face a une donnée non vérifiée
- `never` pour représenter l'impossible
- `void` pour modéliser l'absence de valeur utile

### Analogie : les roles dans un theatre

Chaque type spécial joue un role précis dans la pièce qu'est ton programme :

- `never` : l'acteur qui ne monte jamais sur scène
- `unknown` : l'acteur masqué dont il faut vérifier l'identité
- `void` : l'acteur silencieux qui agit sans rien rendre d'utile
- `any` : l'acteur qui improvise tout, donc qu'on contrôle mal

> 🎯 **Ce qu'il faut retenir** : ces types ne sont pas "exotiques". Ils servent a exprimer des cas réels que les types classiques décrivent mal.

---

## Les Enums

Les **enums** (enumerations) permettent de définir un ensemble de constantes nommees. Ils existent à la fois au niveau des types ET au niveau des valeurs (ils generent du code JavaScript).

### Enums numériques

Par defaut, les enums sont numériques. Les valeurs commencent a 0 et s'incrementent automatiquement.

```typescript
// Enum numerique basique
enum Direction {
  Nord, // 0
  Est, // 1
  Sud, // 2
  Ouest, // 3
}

const maDirection: Direction = Direction.Nord;
console.log(maDirection); // 0
console.log(Direction.Sud); // 2
console.log(Direction[2]); // "Sud" (reverse mapping)

// Enum avec valeurs personnalisees
enum CodeHTTP {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}

function traiterReponse(code: CodeHTTP): string {
  switch (code) {
    case CodeHTTP.OK:
      return "Succes !";
    case CodeHTTP.NotFound:
      return "Ressource introuvable.";
    case CodeHTTP.InternalServerError:
      return "Erreur serveur.";
    default:
      return `Code : ${code}`;
  }
}

console.log(traiterReponse(CodeHTTP.OK)); // "Succes !"
console.log(traiterReponse(CodeHTTP.NotFound)); // "Ressource introuvable."
```

### Enums string

Les enums string necessitent une valeur explicite pour chaque membre. Ils n'ont pas de reverse mapping.

```typescript
enum Couleur {
  Rouge = "ROUGE",
  Vert = "VERT",
  Bleu = "BLEU",
  Jaune = "JAUNE",
  Blanc = "BLANC",
  Noir = "NOIR",
}

enum Taille {
  XS = "extra-small",
  S = "small",
  M = "medium",
  L = "large",
  XL = "extra-large",
}

interface Vetement {
  nom: string;
  couleur: Couleur;
  taille: Taille;
  prix: number;
}

const tshirt: Vetement = {
  nom: "T-shirt basique",
  couleur: Couleur.Bleu,
  taille: Taille.M,
  prix: 19.99,
};

// Les enums string sont lisibles dans les logs
console.log(tshirt.couleur); // "BLEU"
console.log(tshirt.taille); // "medium"
```

### Enums heterogenes (deconseilles)

```typescript
// Possible mais deconseille : melange de types
enum Melange {
  Non = 0,
  Oui = "OUI",
}
// Evitez ce pattern : il rend le code confus
```

### `const enum`

Les `const enum` sont **complètement effaces** à la compilation. Ils sont remplaces par leurs valeurs litterales, ce qui elimine le surpoids a l'exécution.

```typescript
const enum Priorite {
  Basse = 0,
  Moyenne = 1,
  Haute = 2,
  Critique = 3,
}

const p = Priorite.Haute;
// A la compilation, TypeScript genere simplement :
// const p = 2;
// Pas d'objet `Priorite` genere en JavaScript

function estUrgent(priorite: Priorite): boolean {
  return priorite >= Priorite.Haute;
}

console.log(estUrgent(Priorite.Critique)); // true
console.log(estUrgent(Priorite.Basse)); // false
```

> **Attention** : les `const enum` ne supportent pas le reverse mapping et ne fonctionnent pas bien avec `--isolatedModules` (utilise par Babel, Vite, etc.). Preferez les objets `as const` dans ce cas.

### Enums ambiants (declare enum)

Les enums ambiants sont utilises pour decrire des enums qui existent déjà dans le runtime (par exemple, venant d'une bibliotheque externe).

```typescript
// Fichier .d.ts ou ambient declaration
declare enum DirectionExterne {
  Haut = "UP",
  Bas = "DOWN",
  Gauche = "LEFT",
  Droite = "RIGHT",
}

// Utilisation dans le code
function deplacer(direction: DirectionExterne): void {
  // TypeScript verifie le type, mais l'enum doit exister au runtime
  console.log(`Deplacement : ${direction}`);
}
```

### Enums vs unions de litteraux

La question revient souvent : quand utiliser un enum et quand utiliser une union de litteraux ?

```typescript
// Option 1 : Enum
enum StatutCommande {
  EnAttente = "EN_ATTENTE",
  Validee = "VALIDEE",
  Expediee = "EXPEDIEE",
  Livree = "LIVREE",
  Annulee = "ANNULEE",
}

// Option 2 : Union de litteraux
type StatutCommandeUnion =
  | "EN_ATTENTE"
  | "VALIDEE"
  | "EXPEDIEE"
  | "LIVREE"
  | "ANNULEE";

// Option 3 : Objet as const (recommande dans beaucoup de cas)
const STATUT_COMMANDE = {
  EnAttente: "EN_ATTENTE",
  Validee: "VALIDEE",
  Expediee: "EXPEDIEE",
  Livree: "LIVREE",
  Annulee: "ANNULEE",
} as const;

type StatutCommandeConst =
  (typeof STATUT_COMMANDE)[keyof typeof STATUT_COMMANDE];
// "EN_ATTENTE" | "VALIDEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE"
```

#### Tableau comparatif

| Critere                    | Enum             | Union litterale  | Objet `as const` |
| -------------------------- | ---------------- | ---------------- | ---------------- |
| Existe au runtime          | Oui              | Non              | Oui              |
| Taille du bundle           | Plus grand       | Zero             | Petit            |
| Reverse mapping            | Oui (numérique)  | Non              | Non              |
| Tree-shakable              | Non (sauf const) | Oui              | Oui              |
| Iteration sur les valeurs  | Oui              | Non (au runtime) | Oui              |
| Compatible isolatedModules | Partiel          | Oui              | Oui              |

> **Recommandation** : Pour les nouveaux projets, preferez les **unions de litteraux** ou les **objets `as const`**. N'utilisez les enums que si vous avez besoin du reverse mapping ou de la valeur au runtime de manière spécifique.

---

## Les Tuples

Les **tuples** sont des tableaux a **longueur fixe** dont chaque position à un **type spécifique**. Contrairement aux tableaux classiques (`string[]`), les tuples declarent le type exact de chaque élément.

### Tuples basiques

```typescript
// Declaration d'un tuple
let coordonnees: [number, number] = [48.8566, 2.3522]; // latitude, longitude

// Chaque position a son propre type
let utilisateur: [string, number, boolean] = ["Alice", 30, true];

const nom: string = utilisateur[0]; // OK : string
const age: number = utilisateur[1]; // OK : number
const actif: boolean = utilisateur[2]; // OK : boolean

// utilisateur[3]; // ERREUR : Tuple type '[string, number, boolean]' of length '3' has no element at index '3'

// Destructuring
const [nomU, ageU, actifU] = utilisateur;
// nomU: string, ageU: number, actifU: boolean
```

### Tuples avec éléments optionnels

```typescript
// Le troisieme element est optionnel
type ReponseAPI = [number, string, object?];

const succes: ReponseAPI = [200, "OK", { data: "..." }];
const erreur: ReponseAPI = [404, "Not Found"]; // OK : le troisieme est optionnel

// Tuple avec rest element
type StringEtNombres = [string, ...number[]];
const valeurs: StringEtNombres = ["total", 1, 2, 3, 4, 5]; // OK
```

### Tuples readonly

Les tuples `readonly` empechent toute modification après création.

```typescript
// Tuple readonly
const point: readonly [number, number] = [10, 20];
// point[0] = 30; // ERREUR : Cannot assign to '0' because it is a read-only property
// point.push(30); // ERREUR : Property 'push' does not exist on type 'readonly [number, number]'

// Alternative avec as const
const couleurRGB = [255, 128, 0] as const;
// type: readonly [255, 128, 0] — les valeurs exactes sont preservees

// Fonction qui retourne un tuple readonly
function creerPoint(x: number, y: number): readonly [number, number] {
  return [x, y] as const;
}

const p = creerPoint(5, 10);
// p est readonly [number, number]
```

### Tuples nommes (labeled tuples)

Depuis TypeScript 4.0, les tuples peuvent avoir des **noms** pour chaque élément, ameliorant la lisibilite.

```typescript
// Tuples nommes — les noms apparaissent dans l'IDE et les messages d'erreur
type Coordonnees = [latitude: number, longitude: number];
type Intervalle = [debut: Date, fin: Date];
type PersonneInfo = [prenom: string, nom: string, age: number];

// Les noms aident la documentation mais n'affectent pas le typage
function distance(pointA: Coordonnees, pointB: Coordonnees): number {
  const [latA, lonA] = pointA;
  const [latB, lonB] = pointB;

  // Formule de Haversine simplifiee
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((latB - latA) * Math.PI) / 180;
  const dLon = ((lonB - lonA) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latA * Math.PI) / 180) *
      Math.cos((latB * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const paris: Coordonnees = [48.8566, 2.3522];
const lyon: Coordonnees = [45.764, 4.8357];
console.log(`Distance Paris-Lyon : ${distance(paris, lyon).toFixed(0)} km`);
```

### Tuples avec rest au milieu

```typescript
// Rest au debut
type AvecDernier = [...string[], number];
const a: AvecDernier = ["a", "b", "c", 42]; // OK
const b: AvecDernier = [42]; // OK aussi

// Rest au milieu (TypeScript 4.2+)
type Sandwich = [string, ...number[], string];
const s: Sandwich = ["debut", 1, 2, 3, "fin"]; // OK
```

---

## Le type `never`

`never` est le **type du bas** (bottom type) dans la hiérarchie des types TypeScript. Il represente quelque chose qui **ne peut jamais se produire**. Aucune valeur n'est de type `never`.

### Fonctions qui ne retournent jamais

```typescript
// Fonction qui lance toujours une erreur
function erreurFatale(message: string): never {
  throw new Error(message);
}

// Fonction avec une boucle infinie
function boucleInfinie(): never {
  while (true) {
    // ne se termine jamais
  }
}

// Utilisation : la fonction ne retourne jamais
function validerAge(age: number): number {
  if (age < 0 || age > 150) {
    erreurFatale(`Age invalide : ${age}`); // Apres cette ligne, le code est inaccessible
    // TypeScript sait que le code ci-dessous ne sera jamais execute
  }
  return age;
}
```

### `never` et l'exhaustivite

L'utilisation la plus puissante de `never` est la **vérification d'exhaustivite** dans les switch/if.

```typescript
type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "rectangle"; largeur: number; hauteur: number }
  | { type: "triangle"; base: number; hauteur: number };

function aire(forme: Forme): number {
  switch (forme.type) {
    case "cercle":
      return Math.PI * forme.rayon ** 2;
    case "rectangle":
      return forme.largeur * forme.hauteur;
    case "triangle":
      return (forme.base * forme.hauteur) / 2;
    default: {
      // Si on a oublie un cas, `forme` n'est PAS de type `never`
      // et cette ligne provoque une erreur de compilation
      const _exhaustif: never = forme;
      return _exhaustif;
    }
  }
}

// Si on ajoute un nouveau type de forme :
// type Forme = ... | { type: "pentagone"; ... };
// TypeScript signalera une erreur dans le default car
// `{ type: "pentagone"; ... }` n'est pas assignable a `never`
```

### Fonction helper pour l'exhaustivite

```typescript
// Fonction utilitaire reutilisable
function exhaustif(valeur: never, message?: string): never {
  throw new Error(message ?? `Cas non gere : ${JSON.stringify(valeur)}`);
}

type Evenement =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; touche: string }
  | { type: "scroll"; deltaY: number };

function traiterEvenement(evt: Evenement): string {
  switch (evt.type) {
    case "click":
      return `Click en (${evt.x}, ${evt.y})`;
    case "keypress":
      return `Touche pressee : ${evt.touche}`;
    case "scroll":
      return `Scroll de ${evt.deltaY}px`;
    default:
      return exhaustif(evt); // Garantit l'exhaustivite
  }
}
```

### `never` dans les types conditionnels

`never` est souvent utilise dans les types conditionnels pour **filtrer** des types.

```typescript
// Filtrer les proprietes d'un certain type
type ProprietesDeType<T, TType> = {
  [K in keyof T]: T[K] extends TType ? K : never;
}[keyof T];

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  age: number;
  actif: boolean;
}

type PropsString = ProprietesDeType<Utilisateur, string>;
// "nom" | "email"

type PropsNumber = ProprietesDeType<Utilisateur, number>;
// "id" | "age"

type PropsBoolean = ProprietesDeType<Utilisateur, boolean>;
// "actif"

// Extraire un sous-objet avec uniquement les proprietes string
type SousObjetString = Pick<Utilisateur, ProprietesDeType<Utilisateur, string>>;
// { nom: string; email: string }
```

### Analogie : `never` comme le zero en mathematiques

`never` est comme le **zero** en mathematiques pour la multiplication :

- `T | never` = `T` (union avec `never` ne change rien, comme `n + 0 = n`)
- `T & never` = `never` (intersection avec `never` donne `never`, comme `n * 0 = 0`)

C'est l'élément **absorbant** de l'intersection et l'élément **neutre** de l'union.

---

## Le type `unknown`

`unknown` est le **type du haut** (top type). Toute valeur peut etre assignee a `unknown`, mais on ne peut rien faire avec une valeur `unknown` sans la **restreindre** (narrowing) d'abord.

### `unknown` vs `any`

```typescript
// `any` — le cow-boy : tout est permis (DANGEREUX)
let valeurAny: any = "Bonjour";
valeurAny.methodeInexistante(); // PAS d'erreur TypeScript ! Crash au runtime.
valeurAny.trim(); // PAS d'erreur, meme si c'est un nombre
const n: number = valeurAny; // PAS d'erreur, assignation directe

// `unknown` — le prudent : rien n'est permis sans verification
let valeurUnknown: unknown = "Bonjour";
// valeurUnknown.trim();          // ERREUR : 'valeurUnknown' is of type 'unknown'
// const m: number = valeurUnknown; // ERREUR : Type 'unknown' is not assignable to type 'number'

// Il FAUT d'abord verifier le type
if (typeof valeurUnknown === "string") {
  console.log(valeurUnknown.trim()); // OK : TypeScript sait que c'est un string
}
```

### Narrowing avec `unknown`

```typescript
function traiterValeur(valeur: unknown): string {
  // Narrowing par typeof
  if (typeof valeur === "string") {
    return `String de longueur ${valeur.length}`;
  }

  if (typeof valeur === "number") {
    return `Nombre : ${valeur.toFixed(2)}`;
  }

  if (typeof valeur === "boolean") {
    return valeur ? "Vrai" : "Faux";
  }

  // Narrowing par instanceof
  if (valeur instanceof Date) {
    return `Date : ${valeur.toLocaleDateString("fr-FR")}`;
  }

  if (valeur instanceof Error) {
    return `Erreur : ${valeur.message}`;
  }

  // Narrowing par verification de structure
  if (typeof valeur === "object" && valeur !== null && "nom" in valeur) {
    return `Objet avec nom : ${(valeur as { nom: string }).nom}`;
  }

  // Tableau
  if (Array.isArray(valeur)) {
    return `Tableau de ${valeur.length} elements`;
  }

  if (valeur === null) {
    return "null";
  }

  if (valeur === undefined) {
    return "undefined";
  }

  return `Type inconnu : ${typeof valeur}`;
}

// Tests
console.log(traiterValeur("hello")); // "String de longueur 5"
console.log(traiterValeur(3.14159)); // "Nombre : 3.14"
console.log(traiterValeur(true)); // "Vrai"
console.log(traiterValeur(new Date())); // "Date : 08/03/2026"
console.log(traiterValeur({ nom: "Alice" })); // "Objet avec nom : Alice"
```

### `unknown` dans la gestion d'erreurs

```typescript
// Le type de l'erreur dans un catch est `unknown` (depuis TS 4.4)
async function chargerDonnees(url: string): Promise<unknown> {
  try {
    const reponse = await fetch(url);
    if (!reponse.ok) {
      throw new Error(`HTTP ${reponse.status} : ${reponse.statusText}`);
    }
    return await reponse.json();
  } catch (erreur: unknown) {
    // On ne peut pas faire `erreur.message` directement !
    if (erreur instanceof Error) {
      console.error(`Erreur : ${erreur.message}`);
    } else if (typeof erreur === "string") {
      console.error(`Erreur : ${erreur}`);
    } else {
      console.error("Erreur inconnue", erreur);
    }
    throw erreur;
  }
}

// Fonction utilitaire pour extraire le message d'une erreur
function messageErreur(erreur: unknown): string {
  if (erreur instanceof Error) return erreur.message;
  if (typeof erreur === "string") return erreur;
  if (typeof erreur === "object" && erreur !== null && "message" in erreur) {
    return String((erreur as { message: unknown }).message);
  }
  return "Erreur inconnue";
}
```

### Type guard personnalise avec `unknown`

```typescript
// Interface pour la validation
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
}

// Type guard qui valide la structure d'un objet unknown
function estUtilisateur(valeur: unknown): valeur is Utilisateur {
  if (typeof valeur !== "object" || valeur === null) return false;

  const obj = valeur as Record<string, unknown>;

  return (
    typeof obj.id === "number" &&
    typeof obj.nom === "string" &&
    typeof obj.email === "string"
  );
}

// Utilisation avec des donnees externes (API, JSON, etc.)
function traiterReponseAPI(donnees: unknown): Utilisateur[] {
  if (!Array.isArray(donnees)) {
    throw new Error("Les donnees doivent etre un tableau");
  }

  const utilisateurs: Utilisateur[] = [];

  for (const element of donnees) {
    if (estUtilisateur(element)) {
      utilisateurs.push(element); // Type-safe grace au type guard
    } else {
      console.warn("Element invalide ignore :", element);
    }
  }

  return utilisateurs;
}
```

### Analogie : `unknown` comme un colis non identifie

`unknown` est comme un **colis non identifie** a l'aeroport. Avant de l'ouvrir ou de l'utiliser, il faut le **scanner** (type guard) pour s'assurer qu'il ne contient rien de dangereux. Contrairement a `any`, qui serait un colis que tout le monde ouvre sans precaution.

---

## `void` vs `undefined` vs `null`

Ces trois types sont souvent confondus. Voici leurs différences.

### `void`

`void` represente l'absence de valeur de retour d'une fonction. Une fonction `void` peut retourner `undefined` implicitement.

```typescript
// Fonction qui ne retourne rien
function afficherMessage(msg: string): void {
  console.log(msg);
  // Pas de `return` explicite — c'est OK
}

// On peut aussi retourner `undefined` explicitement
function rien(): void {
  return undefined; // OK
  // return null;   // ERREUR (sauf avec --strictNullChecks desactive)
  // return "abc";  // ERREUR
}

// void dans les callbacks : signifie "le retour est ignore"
type Callback = (valeur: string) => void;

// Le callback PEUT retourner une valeur, mais elle sera ignoree
const cb: Callback = (v) => {
  console.log(v);
  return 42; // OK ! Le retour est simplement ignore
};

// C'est pourquoi forEach fonctionne avec des callbacks qui retournent des valeurs
[1, 2, 3].forEach((n) => n * 2); // Le retour de la callback est ignore
```

### `undefined`

`undefined` est un type qui ne contient que la valeur `undefined`.

```typescript
let x: undefined = undefined;

// Difference entre `void` et `undefined` dans les fonctions
function retourneVoid(): void {
  // OK : ne retourne rien
}

function retourneUndefined(): undefined {
  return undefined; // OBLIGATOIRE : doit retourner explicitement undefined
}

// Dans les proprietes optionnelles
interface Config {
  theme?: string; // theme?: string | undefined
}

const c: Config = {};
console.log(c.theme); // undefined
```

### `null`

`null` represente une absence **intentionnelle** de valeur.

```typescript
// Recherche qui peut ne rien trouver
function trouverUtilisateur(id: number): Utilisateur | null {
  const utilisateurs: Utilisateur[] = [
    { id: 1, nom: "Alice", email: "alice@mail.com" },
  ];
  return utilisateurs.find((u) => u.id === id) ?? null;
}

const resultat = trouverUtilisateur(99);
if (resultat !== null) {
  console.log(resultat.nom); // OK : TypeScript sait que ce n'est pas null
}

// Optional chaining avec null
console.log(resultat?.nom); // undefined si null
console.log(resultat?.nom ?? "Inconnu"); // "Inconnu" si null
```

### Convention : `null` vs `undefined`

| Situation                          | Recommandation    |
| ---------------------------------- | ----------------- |
| Propriété optionnelle              | `undefined` (`?`) |
| Absence de résultat intentionnelle | `null`            |
| Paramètre non fourni               | `undefined`       |
| Valeur pas encore initialisee      | `undefined`       |
| Valeur volontairement vide         | `null`            |

---

## `symbol` et `unique symbol`

Le type `symbol` represente des valeurs uniques et immuables, souvent utilisees comme clés de propriétés.

### `symbol` basique

```typescript
// Creer des symboles
const s1 = Symbol("description");
const s2 = Symbol("description");

console.log(s1 === s2); // false — chaque Symbol est unique

// Utiliser comme cle de propriete
const CLE_PRIVEE = Symbol("cle_privee");
const METHODE_INTERNE = Symbol("methode_interne");

class Service {
  [CLE_PRIVEE]: string = "donnee secrete";

  [METHODE_INTERNE](): void {
    console.log("Methode interne appelee");
  }

  public traiter(): void {
    console.log(this[CLE_PRIVEE]);
    this[METHODE_INTERNE]();
  }
}

const svc = new Service();
svc.traiter(); // OK
// On ne peut pas acceder a [CLE_PRIVEE] sans reference au symbole
```

### `unique symbol`

`unique symbol` est un sous-type de `symbol` qui represente un symbole spécifique. Il ne peut etre utilise qu'avec `const` ou `readonly static`.

```typescript
// `unique symbol` — chaque declaration est un type unique
const ID: unique symbol = Symbol("id");
const NOM: unique symbol = Symbol("nom");

// Utile pour les branded types
interface Identifiant {
  readonly [ID]: string;
}

function creerIdentifiant(valeur: string): Identifiant {
  return { [ID]: valeur } as Identifiant;
}

// Utilisation dans les enums simules
const TypeAnimal = {
  Chat: Symbol("Chat"),
  Chien: Symbol("Chien"),
  Oiseau: Symbol("Oiseau"),
} as const;

type TypeAnimalKey = keyof typeof TypeAnimal;
```

---

## Assertions de types avancees

Les assertions de types permettent de dire a TypeScript "fais-moi confiance, je sais ce que je fais". A utiliser avec precaution.

### Assertion simple avec `as`

```typescript
// Assertion basique
const valeur: unknown = "Bonjour";
const longueur = (valeur as string).length; // 7

// Assertion sur un element du DOM
const bouton = document.getElementById("monBouton") as HTMLButtonElement;
bouton.disabled = true;

// Alternative : assertion non-null avec `!`
const element = document.querySelector(".classe")!; // Assert que ce n'est pas null
```

### Double assertion (a éviter si possible)

Quand TypeScript refuse une assertion directe parce que les types sont trop différents, on peut passer par `unknown`.

```typescript
// TypeScript refuse ceci :
// const x = "hello" as number; // ERREUR : types trop differents

// Double assertion : passe par unknown
const x = "hello" as unknown as number; // Pas d'erreur mais DANGEREUX

// Cas legitime : quand on connait mieux le type que TypeScript
interface ReponseServeur {
  data: unknown;
  status: number;
}

interface DonneesUtilisateur {
  id: number;
  nom: string;
}

function traiter(reponse: ReponseServeur): DonneesUtilisateur {
  // On sait que data est un DonneesUtilisateur grace au contrat API
  return reponse.data as DonneesUtilisateur;
}
```

### `satisfies` (TypeScript 4.9+)

L'operateur `satisfies` vérifié qu'une valeur correspond à un type **sans elargir** le type de la variable.

```typescript
type Couleurs = "rouge" | "vert" | "bleu";
type CouleurOuRGB = Couleurs | [number, number, number];

// Sans satisfies : le type est elargi
const palette1: Record<string, CouleurOuRGB> = {
  primaire: "rouge",
  secondaire: [0, 128, 0],
  fond: "bleu",
};
// palette1.primaire est de type CouleurOuRGB (on perd l'info que c'est "rouge")

// Avec satisfies : le type precis est conserve
const palette2 = {
  primaire: "rouge",
  secondaire: [0, 128, 0] as [number, number, number],
  fond: "bleu",
} satisfies Record<string, CouleurOuRGB>;

// palette2.primaire est de type "rouge" (pas CouleurOuRGB)
// palette2.secondaire est de type [number, number, number]

palette2.primaire.toUpperCase(); // OK : TypeScript sait que c'est un string
// palette2.secondaire.toUpperCase(); // ERREUR : c'est un tuple, pas un string
```

### Assertion avec `as const`

```typescript
// Sans as const
const directions = ["nord", "sud", "est", "ouest"];
// type: string[]

// Avec as const
const directionsConst = ["nord", "sud", "est", "ouest"] as const;
// type: readonly ["nord", "sud", "est", "ouest"]

// Utile pour extraire un type union
type Direction = (typeof directionsConst)[number];
// "nord" | "sud" | "est" | "ouest"

// Objet as const
const CONFIG = {
  API_URL: "https://api.example.com",
  TIMEOUT: 5000,
  MODES: ["dev", "staging", "prod"],
} as const;

type Mode = (typeof CONFIG.MODES)[number]; // "dev" | "staging" | "prod"
```

---

## Pratique

### Exercice 1 : Exhaustivite avec `never`

Creez un système de gestion de formes geometriques avec vérification d'exhaustivite. Commencez avec 3 formes, puis ajoutez une 4e et observez l'erreur.

<details>
<summary>Solution</summary>

```typescript
// Definir les formes
type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "rectangle"; largeur: number; hauteur: number }
  | { type: "triangle"; base: number; hauteur: number };

// Helper d'exhaustivite
function casNonGere(valeur: never): never {
  throw new Error(`Cas non gere : ${JSON.stringify(valeur)}`);
}

function calculerAire(forme: Forme): number {
  switch (forme.type) {
    case "cercle":
      return Math.PI * forme.rayon ** 2;
    case "rectangle":
      return forme.largeur * forme.hauteur;
    case "triangle":
      return (forme.base * forme.hauteur) / 2;
    default:
      return casNonGere(forme); // Garantit l'exhaustivite
  }
}

function decrire(forme: Forme): string {
  switch (forme.type) {
    case "cercle":
      return `Cercle de rayon ${forme.rayon}`;
    case "rectangle":
      return `Rectangle ${forme.largeur}x${forme.hauteur}`;
    case "triangle":
      return `Triangle de base ${forme.base} et hauteur ${forme.hauteur}`;
    default:
      return casNonGere(forme);
  }
}

// Test
const formes: Forme[] = [
  { type: "cercle", rayon: 5 },
  { type: "rectangle", largeur: 4, hauteur: 6 },
  { type: "triangle", base: 3, hauteur: 8 },
];

formes.forEach((f) => {
  console.log(`${decrire(f)} — Aire: ${calculerAire(f).toFixed(2)}`);
});

// Maintenant, ajoutez { type: "losange"; diag1: number; diag2: number }
// a l'union Forme et observez les erreurs dans casNonGere
```

</details>

### Exercice 2 : Parseur JSON type-safe avec `unknown`

Creez une fonction qui parse du JSON en toute sécurité et valide la structure attendue.

<details>
<summary>Solution</summary>

```typescript
// Type de resultat pour le parsing
type ResultatParsing<T> =
  | { succes: true; donnees: T }
  | { succes: false; erreur: string };

// Fonction de parsing generique
function parserJSON<T>(
  json: string,
  validateur: (valeur: unknown) => valeur is T,
): ResultatParsing<T> {
  try {
    const parsed: unknown = JSON.parse(json);

    if (validateur(parsed)) {
      return { succes: true, donnees: parsed };
    }

    return {
      succes: false,
      erreur: "Les donnees ne correspondent pas au schema attendu.",
    };
  } catch (e: unknown) {
    const message =
      e instanceof SyntaxError
        ? `JSON invalide : ${e.message}`
        : "Erreur inconnue lors du parsing";
    return { succes: false, erreur: message };
  }
}

// Validateurs
interface Produit {
  id: number;
  nom: string;
  prix: number;
  enStock: boolean;
}

function estProduit(valeur: unknown): valeur is Produit {
  if (typeof valeur !== "object" || valeur === null) return false;
  const obj = valeur as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.nom === "string" &&
    typeof obj.prix === "number" &&
    typeof obj.enStock === "boolean"
  );
}

function estTableauDeProduits(valeur: unknown): valeur is Produit[] {
  return Array.isArray(valeur) && valeur.every(estProduit);
}

// Tests
const jsonValide =
  '{"id": 1, "nom": "Clavier", "prix": 49.99, "enStock": true}';
const jsonInvalide = '{"id": "abc", "nom": "Souris"}';
const jsonMalForme = "{id: 1}";

console.log(parserJSON(jsonValide, estProduit));
// { succes: true, donnees: { id: 1, nom: "Clavier", prix: 49.99, enStock: true } }

console.log(parserJSON(jsonInvalide, estProduit));
// { succes: false, erreur: "Les donnees ne correspondent pas..." }

console.log(parserJSON(jsonMalForme, estProduit));
// { succes: false, erreur: "JSON invalide : ..." }

const jsonTableau =
  '[{"id":1,"nom":"A","prix":10,"enStock":true},{"id":2,"nom":"B","prix":20,"enStock":false}]';
console.log(parserJSON(jsonTableau, estTableauDeProduits));
// { succes: true, donnees: [{...}, {...}] }
```

</details>

### Exercice 3 : Système de configuration avec tuples et enums

Creez un système de configuration d'application utilisant des enums, tuples et `as const`.

<details>
<summary>Solution</summary>

```typescript
// Enums pour les options de configuration
const Environnement = {
  Dev: "development",
  Staging: "staging",
  Prod: "production",
} as const;
type Environnement = (typeof Environnement)[keyof typeof Environnement];

const NiveauLog = {
  Debug: 0,
  Info: 1,
  Warn: 2,
  Error: 3,
  Silent: 4,
} as const;
type NiveauLog = (typeof NiveauLog)[keyof typeof NiveauLog];

// Tuple pour les regles de validation
type RegleValidation = [
  champ: string,
  type: "string" | "number" | "boolean",
  obligatoire: boolean,
  defaut?: unknown,
];

// Configuration avec types stricts
interface ConfigApp {
  environnement: Environnement;
  port: number;
  niveauLog: NiveauLog;
  baseUrl: string;
  fonctionnalites: readonly string[];
}

// Regles de validation
const REGLES: readonly RegleValidation[] = [
  ["environnement", "string", true],
  ["port", "number", true, 3000],
  ["niveauLog", "number", false, NiveauLog.Info],
  ["baseUrl", "string", true],
] as const;

// Configurations pre-definies
const CONFIGS = {
  dev: {
    environnement: Environnement.Dev,
    port: 3000,
    niveauLog: NiveauLog.Debug,
    baseUrl: "http://localhost:3000",
    fonctionnalites: ["debug-panel", "hot-reload", "mock-api"],
  },
  staging: {
    environnement: Environnement.Staging,
    port: 8080,
    niveauLog: NiveauLog.Info,
    baseUrl: "https://staging.example.com",
    fonctionnalites: ["analytics", "error-tracking"],
  },
  prod: {
    environnement: Environnement.Prod,
    port: 80,
    niveauLog: NiveauLog.Error,
    baseUrl: "https://www.example.com",
    fonctionnalites: ["analytics", "error-tracking", "cdn"],
  },
} as const satisfies Record<string, ConfigApp>;

type EnvDisponible = keyof typeof CONFIGS;

// Fonction pour obtenir une config type-safe
function obtenirConfig(env: EnvDisponible): ConfigApp {
  return CONFIGS[env];
}

// Fonction de log respectant le niveau
function log(config: ConfigApp, niveau: NiveauLog, message: string): void {
  if (niveau >= config.niveauLog) {
    const niveaux = ["DEBUG", "INFO", "WARN", "ERROR", "SILENT"];
    console.log(`[${niveaux[niveau]}] ${message}`);
  }
}

// Test
const config = obtenirConfig("dev");
log(config, NiveauLog.Debug, "Demarrage en mode dev"); // Affiche
log(config, NiveauLog.Error, "Erreur critique"); // Affiche

const configProd = obtenirConfig("prod");
log(configProd, NiveauLog.Debug, "Ceci est du debug"); // N'affiche PAS (niveau trop bas)
log(configProd, NiveauLog.Error, "Erreur en prod"); // Affiche
```

</details>

### Exercice 4 : Convertisseur de types avec `unknown` et narrowing

Creez un convertisseur universel qui transforme une valeur `unknown` en différents types cibles.

<details>
<summary>Solution</summary>

```typescript
type TypeCible = "string" | "number" | "boolean" | "date" | "array";

type ResultatConversion<T extends TypeCible> = T extends "string"
  ? string
  : T extends "number"
    ? number
    : T extends "boolean"
      ? boolean
      : T extends "date"
        ? Date
        : T extends "array"
          ? unknown[]
          : never;

function convertir<T extends TypeCible>(
  valeur: unknown,
  cible: T,
): ResultatConversion<T> | null {
  try {
    switch (cible) {
      case "string": {
        if (valeur === null || valeur === undefined) return null;
        return String(valeur) as ResultatConversion<T>;
      }
      case "number": {
        if (typeof valeur === "number") return valeur as ResultatConversion<T>;
        if (typeof valeur === "string") {
          const n = Number(valeur);
          return (isNaN(n) ? null : n) as ResultatConversion<T>;
        }
        if (typeof valeur === "boolean")
          return (valeur ? 1 : 0) as ResultatConversion<T>;
        return null;
      }
      case "boolean": {
        if (typeof valeur === "boolean") return valeur as ResultatConversion<T>;
        if (typeof valeur === "string") {
          if (valeur.toLowerCase() === "true" || valeur === "1")
            return true as ResultatConversion<T>;
          if (valeur.toLowerCase() === "false" || valeur === "0")
            return false as ResultatConversion<T>;
        }
        if (typeof valeur === "number")
          return (valeur !== 0) as ResultatConversion<T>;
        return null;
      }
      case "date": {
        if (valeur instanceof Date) return valeur as ResultatConversion<T>;
        if (typeof valeur === "string" || typeof valeur === "number") {
          const d = new Date(valeur);
          return (isNaN(d.getTime()) ? null : d) as ResultatConversion<T>;
        }
        return null;
      }
      case "array": {
        if (Array.isArray(valeur)) return valeur as ResultatConversion<T>;
        if (typeof valeur === "string") {
          try {
            return JSON.parse(valeur) as ResultatConversion<T>;
          } catch {
            return [valeur] as ResultatConversion<T>;
          }
        }
        return [valeur] as ResultatConversion<T>;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Tests type-safe
const s = convertir(42, "string"); // string | null — "42"
const n = convertir("3.14", "number"); // number | null — 3.14
const b = convertir("true", "boolean"); // boolean | null — true
const d = convertir("2024-01-15", "date"); // Date | null
const a = convertir("[1,2,3]", "array"); // unknown[] | null

console.log(s); // "42"
console.log(n); // 3.14
console.log(b); // true
console.log(d); // Date object
console.log(a); // [1, 2, 3]
```

</details>

---

## Récapitulatif

| Type / Concept     | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `enum` numérique   | Ensemble de constantes numériques auto-incrementees        |
| `enum` string      | Ensemble de constantes string explicites                   |
| `const enum`       | Enum efface à la compilation (inline)                      |
| Union de litteraux | Alternative legere aux enums (`"a" \| "b" \| "c"`)         |
| `as const`         | Fige les valeurs comme litterales et readonly              |
| Tuple              | Tableau a longueur et types fixes par position             |
| Tuple readonly     | Tuple immutable                                            |
| Tuple nomme        | Tuple avec des labels pour chaque position                 |
| `never`            | Type du bas — aucune valeur possible                       |
| Exhaustivite       | Utiliser `never` pour vérifier que tous les cas sont geres |
| `unknown`          | Type du haut sécurisé — nécessité du narrowing             |
| `void`             | Absence de valeur de retour                                |
| `symbol`           | Valeur unique et immuable                                  |
| `unique symbol`    | Symbole spécifique lie à une declaration `const`           |
| `satisfies`        | Vérification de type sans elargissement                    |

---

## Pour aller plus loin

Dans le **Module 09**, nous aborderons les **Modules, Namespaces et Resolution** — comment organiser votre code TypeScript en modules, gérer les imports/exports, configurer la résolution de modules dans tsconfig, et travailler avec des declarations ambiantes.

[Continuer vers le Module 09 : Modules, Namespaces & Resolution →](./09-modules-et-resolution.md)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé

1. **Screencast** : [screencast 08 enums tuples](../screencasts/screencast-08-enums-tuples.md)
2. **Lab** : [lab-08-enums-tuples](../labs/lab-08-enums-tuples/README)
3. **Visualisation** : [Hiérarchie des types](../visualizations/type-hierarchy.html)
4. **Quiz** : [quiz 08 enums tuples](../quizzes/quiz-08-enums-tuples.html)
   :::
