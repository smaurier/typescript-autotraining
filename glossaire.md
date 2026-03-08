# Glossaire TypeScript

## A

### `any`

Type qui desactive totalement la verification de type. Une variable `any` peut recevoir et etre assignee a n'importe quel type sans erreur. Son usage est fortement deconseille car il supprime les garanties offertes par TypeScript.

```ts
let valeur: any = 42;
valeur = "texte"; // aucune erreur
valeur.methodeInexistante(); // aucune erreur a la compilation
```

### Ambient Declaration

Declaration ambiante permettant de decrire a TypeScript la forme d'une valeur qui existe deja a l'execution (variable globale, bibliotheque JavaScript externe) sans fournir d'implementation. On utilise le mot-cle `declare`.

```ts
declare const API_URL: string;
declare function fetchData(url: string): Promise<unknown>;
```

### Assertion Function

Fonction dont la signature indique a TypeScript qu'elle leve une exception si une condition n'est pas remplie. Apres son appel, le compilateur restreint (narrow) le type en consequence.

```ts
function assertEstNombre(val: unknown): asserts val is number {
  if (typeof val !== "number") throw new Error("Pas un nombre");
}

const x: unknown = 42;
assertEstNombre(x);
x.toFixed(2); // x est desormais `number`
```

### `Awaited`

Type utilitaire qui extrait le type final d'une `Promise`, meme si celle-ci est imbriquee. Utile pour obtenir le type de retour reel d'une fonction asynchrone.

```ts
type A = Awaited<Promise<Promise<string>>>; // string
```

## B

### Branded Type

Technique qui consiste a ajouter une propriete fictive (un "tag") a un type primitif pour le distinguer d'un autre type structurellement identique. Cela permet de creer des types nominaux dans un systeme structurel.

```ts
type UserId = number & { readonly __brand: unique symbol };
type OrderId = number & { readonly __brand: unique symbol };

function getUser(id: UserId) { /* ... */ }
const orderId = 10 as OrderId;
// getUser(orderId); // Erreur : OrderId n'est pas assignable a UserId
```

## C

### Callback

Fonction passee en argument a une autre fonction pour etre appelee ulterieurement. En TypeScript, le type du callback est explicitement annote pour garantir la surete des parametres et du retour.

```ts
function appliquer(valeurs: number[], cb: (n: number) => string): string[] {
  return valeurs.map(cb);
}
```

### Class

Construction orientee objet regroupant proprietes et methodes. TypeScript ajoute aux classes JavaScript le typage des membres, les modificateurs d'acces (`public`, `private`, `protected`), les classes abstraites et l'implementation d'interfaces.

```ts
class Animal {
  constructor(public nom: string) {}
  parler(): string {
    return `${this.nom} fait du bruit.`;
  }
}
```

### Conditional Type

Type qui s'evalue differemment selon une condition portant sur un autre type, a l'aide de la syntaxe `T extends U ? X : Y`. C'est le pendant des expressions ternaires, mais au niveau des types.

```ts
type EstChaine<T> = T extends string ? true : false;
type R1 = EstChaine<"hello">; // true
type R2 = EstChaine<42>;      // false
```

### `const` assertion

Assertion (`as const`) qui demande a TypeScript de considerer une valeur comme la plus etroite (narrow) possible : les proprietes deviennent `readonly`, les tableaux deviennent des tuples readonly et les valeurs litterales ne sont pas elargies.

```ts
const config = { port: 3000, host: "localhost" } as const;
// typeof config : { readonly port: 3000; readonly host: "localhost" }
```

### Contravariance

Propriete d'un type generique `F<T>` pour lequel, si `A` est un sous-type de `B`, alors `F<B>` est un sous-type de `F<A>` (la relation est inversee). En TypeScript, les parametres de fonction sont contravariants lorsque `strictFunctionTypes` est active.

```ts
type Handler<T> = (value: T) => void;
// Handler<Animal> est assignable a Handler<Chat> ? Non (contravariance)
```

### Covariance

Propriete d'un type generique `F<T>` pour lequel, si `A` est un sous-type de `B`, alors `F<A>` est un sous-type de `F<B>` (la relation est preservee). Les types de retour de fonction et les proprietes en lecture seule sont covariants.

```ts
type Producteur<T> = () => T;
// Producteur<Chat> est assignable a Producteur<Animal> (covariance)
```

## D

### Declaration File

Fichier portant l'extension `.d.ts` qui contient uniquement des declarations de type sans implementation. Il permet a TypeScript de comprendre le typage d'une bibliotheque JavaScript existante.

```ts
// types/ma-lib.d.ts
declare module "ma-lib" {
  export function calculer(x: number): number;
}
```

### Decorator

Fonction speciale (fonctionnalite experimentale, stabilisee en TypeScript 5+ pour les classes) qui peut observer ou modifier une classe, une methode, un accesseur ou une propriete. Les decorateurs utilisent la syntaxe `@`.

```ts
function Log(_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Appel de ${propertyKey}`);
    return original.apply(this, args);
  };
}
```

### Discriminated Union

Union de types objets partageant une propriete commune (le discriminant) dont la valeur litterale est differente pour chaque membre. Cela permet un narrowing exhaustif via `switch` ou `if`.

```ts
type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "carre"; cote: number };

function aire(f: Forme): number {
  switch (f.type) {
    case "cercle": return Math.PI * f.rayon ** 2;
    case "carre": return f.cote ** 2;
  }
}
```

### Distributive Conditional Type

Comportement des types conditionnels lorsqu'ils sont appliques a un type union nu (naked type parameter). Le type conditionnel est alors evalue pour chaque membre de l'union puis les resultats sont reunis.

```ts
type SansNull<T> = T extends null | undefined ? never : T;
type R = SansNull<string | null | number>; // string | number
```

### Duck Typing

Voir **Structural Typing**. Principe selon lequel un objet est considere compatible avec un type s'il possede les proprietes requises, independamment de sa classe ou de sa declaration. "Si ca marche comme un canard, c'est un canard."

## E

### Enum

Structure qui definit un ensemble de constantes nommees. TypeScript propose des enums numeriques, des enums de chaines et des `const enum` (resolus a la compilation).

```ts
enum Direction {
  Haut = "HAUT",
  Bas = "BAS",
  Gauche = "GAUCHE",
  Droite = "DROITE",
}
const d: Direction = Direction.Haut;
```

### ESM (ECMAScript Modules)

Systeme de modules standardise par ECMAScript utilisant `import` et `export`. TypeScript le prend en charge nativement et peut emettre du code ESM en configurant `"module": "ESNext"` (ou similaire) dans le `tsconfig.json`.

```ts
// math.ts
export function addition(a: number, b: number): number {
  return a + b;
}
// app.ts
import { addition } from "./math.js";
```

### Excess Property Checking

Verification supplementaire effectuee par TypeScript lorsqu'un objet litteral est directement assigne a un type : les proprietes qui ne font pas partie du type cible sont signalees comme erreurs. Cette verification ne s'applique pas aux valeurs passees par reference.

```ts
interface Config { port: number }
// const c: Config = { port: 3000, debug: true }; // Erreur : 'debug' n'existe pas dans Config
const obj = { port: 3000, debug: true };
const c: Config = obj; // OK, pas de verification supplementaire
```

### `extends`

Mot-cle polyvalent en TypeScript. Il sert a l'heritage de classes et d'interfaces, mais aussi dans les types conditionnels pour tester si un type est assignable a un autre, et dans les contraintes de generiques.

```ts
// Contrainte generique
function longueur<T extends { length: number }>(val: T): number {
  return val.length;
}
```

### `Extract`

Type utilitaire qui extrait d'une union les membres assignables a un type donne. C'est l'inverse de `Exclude`.

```ts
type T = Extract<"a" | "b" | "c" | 1, string>; // "a" | "b" | "c"
```

## G

### Generic

Parametre de type permettant d'ecrire du code reutilisable tout en preservant l'information de type. Les generiques sont definis entre chevrons (`<T>`) et peuvent etre contraints avec `extends`.

```ts
function identite<T>(valeur: T): T {
  return valeur;
}
const n = identite(42);    // n : number
const s = identite("abc"); // s : string
```

## H

### Higher-Order Type

Type qui prend un autre type en parametre et produit un nouveau type, a la maniere d'une fonction d'ordre superieur sur les valeurs. Les types mappes et les types conditionnels en sont les mecanismes principaux dans TypeScript.

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
```

## I

### Indexed Access Type

Type obtenu en accedant a la propriete d'un autre type avec la syntaxe entre crochets. Permet d'extraire le type d'une propriete specifique.

```ts
interface Utilisateur { nom: string; age: number }
type Age = Utilisateur["age"]; // number
```

### Inference

Capacite de TypeScript a deduire automatiquement le type d'une expression sans annotation explicite. Le compilateur analyse le contexte (valeur de retour, assignation, etc.) pour determiner le type le plus precis possible.

```ts
const x = 42;          // TypeScript infere `number`
const y = [1, "a"];    // TypeScript infere `(string | number)[]`
```

### `infer`

Mot-cle utilisable uniquement dans la branche `extends` d'un type conditionnel. Il permet de capturer (inferer) un type inconnu pour le reutiliser dans la branche `true`.

```ts
type TypeRetour<T> = T extends (...args: any[]) => infer R ? R : never;
type R = TypeRetour<() => string>; // string
```

### Interface

Declaration de la forme d'un objet : ses proprietes, leurs types et les signatures de methodes. Contrairement aux alias de type, les interfaces peuvent etre etendues par declaration merging et sont ouvertes a l'extension.

```ts
interface Vehicule {
  marque: string;
  vitesseMax: number;
  demarrer(): void;
}
```

### Intersection

Combinaison de plusieurs types en un seul a l'aide de l'operateur `&`. Le type resultant possede toutes les proprietes de chaque type constitutif.

```ts
type Nomme = { nom: string };
type Age = { age: number };
type Personne = Nomme & Age;
// Personne a les proprietes `nom` ET `age`
```

### Invariance

Propriete d'un type generique `F<T>` qui n'est ni covariant ni contravariant : `F<A>` n'est assignable a `F<B>` que si `A` et `B` sont strictement identiques. Un champ mutable est invariant car il est a la fois lu et ecrit.

## K

### `keyof`

Operateur de type qui produit une union des noms de proprietes (cles) d'un type objet. Tres utile en combinaison avec les types indexes et les generiques.

```ts
interface Produit { nom: string; prix: number }
type CleProduit = keyof Produit; // "nom" | "prix"

function lire<T, K extends keyof T>(obj: T, cle: K): T[K] {
  return obj[cle];
}
```

## L

### Literal Type

Type qui represente une valeur unique et exacte plutot qu'une categorie large. Les types litteraux peuvent etre des chaines, des nombres ou des booleens specifiques.

```ts
type Direction = "nord" | "sud" | "est" | "ouest";
let d: Direction = "nord"; // OK
// d = "haut"; // Erreur
```

## M

### Mapped Type

Type qui transforme chaque propriete d'un type existant en appliquant une transformation. Il itere sur les cles avec `in keyof` et peut modifier le type des valeurs ou les modificateurs (`readonly`, `?`).

```ts
type Optionnel<T> = { [K in keyof T]?: T[K] };
type LectureSeule<T> = { readonly [K in keyof T]: T[K] };
```

### Module Augmentation

Technique qui permet d'ajouter des declarations a un module existant (y compris un module tiers) sans modifier son code source. On utilise `declare module` dans un fichier `.d.ts` ou `.ts`.

```ts
// augmentation de express
declare module "express" {
  interface Request {
    userId?: string;
  }
}
```

### Module Resolution

Strategie utilisee par TypeScript pour trouver le fichier correspondant a une instruction `import`. Les deux strategies principales sont `node` (resolution Node.js classique) et `bundler` (TypeScript 5+). La configuration se fait via `moduleResolution` dans `tsconfig.json`.

## N

### Namespace

Mecanisme historique de TypeScript (anciennement "modules internes") permettant de regrouper du code sous un nom qualifie pour eviter les collisions. Aujourd'hui, les modules ESM sont generalement preferes.

```ts
namespace Geometrie {
  export function aireCercle(r: number): number {
    return Math.PI * r ** 2;
  }
}
Geometrie.aireCercle(5);
```

### Narrowing

Processus par lequel TypeScript affine un type large en un type plus precis a l'interieur d'un bloc de code, grace a des verifications de controle de flux (`typeof`, `instanceof`, type guards, assertions, etc.).

```ts
function afficher(val: string | number) {
  if (typeof val === "string") {
    console.log(val.toUpperCase()); // val est `string` ici
  } else {
    console.log(val.toFixed(2));    // val est `number` ici
  }
}
```

### `never`

Type qui represente l'ensemble vide : aucune valeur n'est de type `never`. Il apparait dans les fonctions qui ne retournent jamais (exception, boucle infinie) et comme resultat d'intersections impossibles. Il est utile pour la verification d'exhaustivite.

```ts
function erreur(msg: string): never {
  throw new Error(msg);
}
```

### Non-Null Assertion

Operateur postfixe `!` qui indique au compilateur qu'une expression n'est ni `null` ni `undefined`. Il supprime la verification de nullite sans effectuer de verification a l'execution.

```ts
const element = document.getElementById("app")!;
// element est de type HTMLElement (et non HTMLElement | null)
```

### Nullable

Se dit d'un type qui inclut `null` et/ou `undefined` comme valeurs possibles. En mode strict (`strictNullChecks`), `null` et `undefined` sont des types distincts et ne sont pas assignables aux autres types sans union explicite.

```ts
let nom: string | null = null;
nom = "Alice";
```

## O

### `Omit`

Type utilitaire qui construit un nouveau type en excluant un ou plusieurs cles d'un type existant. C'est l'inverse de `Pick`.

```ts
interface Utilisateur { id: number; nom: string; email: string }
type SansEmail = Omit<Utilisateur, "email">;
// { id: number; nom: string }
```

### Opaque Type

Synonyme de **Branded Type** dans l'ecosysteme TypeScript. Type dont la structure interne est volontairement masquee pour empecher les substitutions accidentelles entre types structurellement identiques.

### Optional

Propriete ou parametre marque avec `?`, indiquant qu'il peut etre absent (`undefined`). TypeScript traite les proprietes optionnelles comme pouvant etre `undefined` (et `void` pour les parametres manquants).

```ts
interface Options {
  debug?: boolean;
  port?: number;
}
function init(opts: Options = {}) { /* ... */ }
```

### Override

Mot-cle (`override`) introduit dans TypeScript 4.3 qui signale explicitement qu'une methode redefinit une methode de la classe parente. Si la methode parente n'existe pas, une erreur de compilation est levee, ce qui previent les fautes de frappe.

```ts
class Base {
  saluer() { return "Bonjour"; }
}
class Derivee extends Base {
  override saluer() { return "Salut"; }
}
```

## P

### Parameter Properties

Raccourci syntaxique dans le constructeur d'une classe qui declare et initialise automatiquement une propriete en prefixant le parametre avec un modificateur d'acces (`public`, `private`, `protected`) ou `readonly`.

```ts
class Personne {
  constructor(public nom: string, private age: number) {}
  // equivalent a : this.nom = nom; this.age = age;
}
```

### `Partial`

Type utilitaire qui rend toutes les proprietes d'un type optionnelles. Utile pour les operations de mise a jour partielle.

```ts
interface Config { host: string; port: number; debug: boolean }
function mettreAJour(config: Config, patch: Partial<Config>): Config {
  return { ...config, ...patch };
}
```

### Phantom Type

Type generique dont le parametre de type n'est utilise dans aucune propriete a l'execution, mais sert uniquement a distinguer des valeurs au niveau du systeme de types. Proche du Branded Type.

```ts
type Monnaie<T extends string> = number & { __monnaie: T };
type EUR = Monnaie<"EUR">;
type USD = Monnaie<"USD">;
const prix: EUR = 10 as EUR;
// const total: USD = prix; // Erreur
```

### `Pick`

Type utilitaire qui construit un nouveau type en ne conservant qu'un sous-ensemble de cles d'un type existant.

```ts
interface Utilisateur { id: number; nom: string; email: string }
type Resume = Pick<Utilisateur, "id" | "nom">;
// { id: number; nom: string }
```

### Project References

Fonctionnalite de TypeScript permettant de decouper un projet volumineux en plusieurs sous-projets (`tsconfig.json` distincts) avec des dependances explicites. Cela ameliore les temps de compilation incrementale et la structuration du code.

```json
// tsconfig.json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" }
  ]
}
```

## R

### `readonly`

Modificateur qui empeche la reassignation d'une propriete apres l'initialisation. Il s'applique aux proprietes d'interfaces, de classes, de types mappes et aux tableaux (`ReadonlyArray<T>` ou `readonly T[]`).

```ts
interface Point {
  readonly x: number;
  readonly y: number;
}
const p: Point = { x: 1, y: 2 };
// p.x = 5; // Erreur : propriete en lecture seule
```

### `Record`

Type utilitaire qui construit un type objet dont les cles sont de type `K` et les valeurs de type `V`. Pratique pour definir des dictionnaires types.

```ts
type Roles = "admin" | "editeur" | "lecteur";
const permissions: Record<Roles, boolean> = {
  admin: true,
  editeur: true,
  lecteur: false,
};
```

### Recursive Type

Type qui se reference lui-meme dans sa definition, permettant de modeliser des structures de donnees arborescentes ou imbriquees a profondeur variable.

```ts
type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [cle: string]: Json };
```

### `Required`

Type utilitaire qui rend toutes les proprietes d'un type obligatoires, supprimant les modificateurs `?`. C'est l'inverse de `Partial`.

```ts
interface Options { debug?: boolean; port?: number }
type OptionsCompletes = Required<Options>;
// { debug: boolean; port: number }
```

### Rest Parameters

Parametres de reste permettant a une fonction d'accepter un nombre variable d'arguments. En TypeScript, le type est annote comme un tableau ou un tuple.

```ts
function somme(...nombres: number[]): number {
  return nombres.reduce((acc, n) => acc + n, 0);
}
somme(1, 2, 3); // 6
```

### Result Type

Patron de conception (non integre au langage) modelisant un resultat qui peut etre un succes ou un echec, comme alternative aux exceptions. On l'implemente souvent avec une union discriminee.

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function diviser(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "Division par zero" };
  return { ok: true, value: a / b };
}
```

### `ReturnType`

Type utilitaire qui extrait le type de retour d'un type de fonction.

```ts
function creerUtilisateur() {
  return { id: 1, nom: "Alice" };
}
type Utilisateur = ReturnType<typeof creerUtilisateur>;
// { id: number; nom: string }
```

## S

### `satisfies`

Operateur introduit dans TypeScript 4.9 qui verifie qu'une expression est compatible avec un type donne sans elargir le type infere. Contrairement a l'annotation de type, il preserve le type litteral le plus precis.

```ts
type Couleurs = Record<string, [number, number, number] | string>;
const palette = {
  rouge: [255, 0, 0],
  vert: "#00FF00",
} satisfies Couleurs;
// palette.rouge est infere comme [number, number, number], pas comme string | [...]
```

### Soundness

Propriete d'un systeme de types garantissant qu'aucune erreur de type ne survient a l'execution. TypeScript est volontairement **non sound** dans certains cas (comme les enums, la covariance des parametres de methode, `any`) afin de privilegier la pragmatisme et l'adoption progressive.

### Strict Mode

Ensemble d'options du compilateur (`"strict": true` dans `tsconfig.json`) qui active simultanement toutes les verifications strictes : `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `noImplicitAny`, `noImplicitThis`, etc. Fortement recommande pour tout nouveau projet.

### Structural Typing

Systeme de typage de TypeScript ou la compatibilite entre types est determinee par la structure (les proprietes et methodes presentes) et non par le nom ou la declaration explicite. Aussi appele duck typing.

```ts
interface Point { x: number; y: number }
const p = { x: 1, y: 2, z: 3 };
const point: Point = p; // OK : p a au moins x et y
```

### Surcharge (Overload)

Mecanisme permettant de definir plusieurs signatures pour une meme fonction, chacune avec des types de parametres et de retour differents. L'implementation unique doit etre compatible avec toutes les signatures.

```ts
function formater(val: string): string;
function formater(val: number): string;
function formater(val: string | number): string {
  return typeof val === "string" ? val.trim() : val.toFixed(2);
}
```

### Symbol

Type primitif JavaScript representant une valeur unique et immuable, souvent utilise comme cle de propriete. TypeScript prend en charge `symbol`, `unique symbol` (pour les symboles constants) et les symboles bien connus (`Symbol.iterator`, etc.).

```ts
const id: unique symbol = Symbol("id");
interface Entite {
  [id]: number;
}
```

## T

### Template Literal Type

Type construit a partir de template strings au niveau des types. Permet de generer des unions de chaines ou de composer des noms de proprietes de maniere typee.

```ts
type Evenement = "click" | "focus";
type Handler = `on${Capitalize<Evenement>}`;
// "onClick" | "onFocus"
```

### `tsconfig`

Fichier de configuration (`tsconfig.json`) a la racine d'un projet TypeScript. Il definit les options du compilateur (`compilerOptions`), les fichiers a inclure ou exclure, les references de projet, et d'autres parametres de build.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

### Tuple

Type tableau de longueur fixe ou chaque element a un type specifique a sa position. Les tuples peuvent inclure des elements optionnels, des elements rest et etre `readonly`.

```ts
type Coordonnee = [number, number];
type Nommee = [nom: string, x: number, y: number]; // labels nommes

const point: Coordonnee = [10, 20];
```

### Type Alias

Declaration introduite par le mot-cle `type` qui attribue un nom a n'importe quel type (primitif, union, intersection, fonction, tuple, etc.). Contrairement aux interfaces, les alias ne sont pas fusionnables par declaration merging.

```ts
type Identifiant = string | number;
type Transformateur<T> = (entree: T) => T;
```

### Type Assertion

Expression (`as Type` ou `<Type>`) qui indique au compilateur de traiter une valeur comme un type specifique. Ce n'est pas une conversion a l'execution ; il s'agit uniquement d'une indication au compilateur.

```ts
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
```

### Type Guard

Expression ou fonction qui permet a TypeScript de restreindre (narrow) le type d'une variable dans une branche conditionnelle. Les type guards integres sont `typeof`, `instanceof` et `in`. On peut aussi definir des type guards personnalises avec des predicats de type.

```ts
function estChaine(val: unknown): val is string {
  return typeof val === "string";
}
```

### Type Predicate

Annotation de retour d'une fonction de la forme `parametre is Type`. Elle indique a TypeScript que si la fonction retourne `true`, le parametre est du type specifie. C'est le mecanisme sous-jacent aux type guards personnalises.

```ts
function estTableau<T>(val: T | T[]): val is T[] {
  return Array.isArray(val);
}
```

### `typeof`

Operateur dual en TypeScript. En JavaScript, il retourne une chaine decrivant le type a l'execution. Au niveau des types TypeScript, `typeof variable` extrait le type d'une variable ou d'une propriete pour le reutiliser dans une annotation.

```ts
const config = { port: 3000, debug: true };
type Config = typeof config;
// { port: number; debug: boolean }
```

## U

### Union

Type representant une valeur pouvant etre l'un parmi plusieurs types, defini a l'aide de l'operateur `|`. Le narrowing est necessaire pour acceder aux membres specifiques a un type de l'union.

```ts
type Resultat = string | number | boolean;
function afficher(r: Resultat) {
  if (typeof r === "string") {
    console.log(r.toUpperCase());
  }
}
```

### `unknown`

Type sur qui represente n'importe quelle valeur, mais exige une verification de type avant toute utilisation. C'est l'alternative sure a `any` : on ne peut rien faire avec une valeur `unknown` tant qu'on ne l'a pas restreinte via un type guard ou une assertion.

```ts
function traiter(val: unknown) {
  // val.toUpperCase(); // Erreur
  if (typeof val === "string") {
    console.log(val.toUpperCase()); // OK apres narrowing
  }
}
```

### Utility Type

Ensemble de types generiques fournis nativement par TypeScript pour effectuer des transformations courantes sur les types : `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, `ReturnType`, `Extract`, `Exclude`, `NonNullable`, `Awaited`, etc.

```ts
type Lecture = Readonly<{ nom: string; age: number }>;
type SansNull = NonNullable<string | null | undefined>; // string
```

## V

### Variance

Concept decrivant comment la relation de sous-typage entre deux types se propage a travers un type generique. Les quatre variantes sont : covariance, contravariance, invariance et bivariance. TypeScript 4.7+ permet d'annoter la variance explicitement avec `in` et `out`.

```ts
interface Producteur<out T> {  // covariant
  produire(): T;
}
interface Consommateur<in T> {  // contravariant
  consommer(val: T): void;
}
```

### Variadic Tuple

Tuple utilisant l'operateur spread (`...`) avec un type generique pour representer un nombre variable d'elements types. Introduit dans TypeScript 4.0, il permet de concatener et transformer des tuples de maniere typee.

```ts
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type R = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]
```

### `void`

Type de retour d'une fonction qui n'a pas de valeur de retour significative. Contrairement a `never`, la fonction se termine bien mais on ne doit pas utiliser sa valeur de retour. En TypeScript, un callback de type `() => void` peut neanmoins retourner une valeur qui sera ignoree.

```ts
function loguer(message: string): void {
  console.log(message);
  // pas de return
}
```
