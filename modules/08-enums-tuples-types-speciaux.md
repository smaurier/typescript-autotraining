---
titre: Enums, tuples et types spéciaux
cours: 00-typescript
notions: [enums numériques, enums string, const enum, pièges runtime et tree-shaking des enums, erasableSyntaxOnly TS 5.8, as const plus union de littéraux, tuples, labeled tuples, éléments optionnels et rest, variadic tuples, readonly tuples, type object, type accolades vides, rappel unknown et never]
outcomes: [choisir en connaissance de cause entre enum et as const plus union, typer un tuple avec labels rest et readonly, distinguer object des accolades vides et de unknown]
prerequis: [07-generics-avances]
next: 09-modules-et-resolution
libs: [{ name: typescript, version: "^5" }]
tribuzen: MemberRole en as const union, position [lat, lng] typée et helper variadic pour l'admin TribuZen
last-reviewed: 2026-07
---

# Enums, tuples et types spéciaux

> **Outcomes — tu sauras FAIRE :** choisir en connaissance de cause entre un `enum` et un `as const` + union de littéraux, typer un tuple avec labels / rest / `readonly`, distinguer `object`, `{}`, `unknown` et `never`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu ouvres `tribuzen/types/index.ts` et tu tombes sur le rôle d'un membre :

```ts
export type MemberRole = "admin" | "parent" | "enfant";
```

Un collègue venu de C# ou de Java propose de « faire propre » et de remplacer ça par un enum :

```ts
// La proposition — familière, mais lourde de conséquences
export enum MemberRole {
  Admin = "admin",
  Parent = "parent",
  Enfant = "enfant",
}
```

À première vue c'est équivalent. En réalité, ce petit changement :

1. **ajoute du JavaScript dans le bundle** — l'enum génère un objet à l'exécution, l'union non ;
2. **casse le build sous `--erasableSyntaxOnly`** (TS 5.8) et sous le type-stripping natif de Node — l'enum n'est pas « effaçable » ;
3. **change la façon d'écrire les valeurs partout** : `MemberRole.Admin` au lieu de la chaîne `"admin"` reçue telle quelle d'une API.

Ce module te donne les critères pour trancher ce débat honnêtement — enum vs `as const` + union — et couvre au passage les tuples et les types spéciaux (`object`, `{}`, rappel `unknown`/`never`) que tu croiseras dans le même fichier de types.

---

## 2. Théorie complète, concise

### 2.1 Enums numériques

Par défaut, un `enum` est numérique : les membres reçoivent `0, 1, 2…` automatiquement.

```ts
enum Direction {
  Nord, // 0
  Est,  // 1
  Sud,  // 2
  Ouest, // 3
}

const d: Direction = Direction.Nord;
console.log(d);            // 0
console.log(Direction[2]); // "Sud"  — reverse mapping (numérique uniquement)
```

Deux propriétés à retenir :

- **Existe au runtime** : `enum` compile en un vrai objet JavaScript.
- **Reverse mapping** : l'objet contient `{0:"Nord", Nord:0, ...}`, d'où `Direction[2] === "Sud"`. C'est aussi ce qui double la taille de l'objet généré.

Piège classique : les valeurs numériques sont **implicites**. Insérer un membre au milieu décale tout ce qui suit — un `2` sérialisé en base ne veut soudain plus dire la même chose.

### 2.2 Enums string

Les enums string exigent une valeur explicite par membre. **Pas** de reverse mapping.

```ts
enum InvitationStatus {
  Pending = "pending",
  Accepted = "accepted",
  Expired = "expired",
  Revoked = "revoked",
}
```

Ils règlent le problème des valeurs implicites (chaque membre est nommé) et sont lisibles dans les logs. Mais ils **existent toujours au runtime** et restent soumis aux pièges de la section 2.4.

### 2.3 `const enum`

Un `const enum` est **inliné** à la compilation : chaque usage est remplacé par sa valeur littérale, aucun objet n'est généré.

```ts
const enum Priorite {
  Basse = 0,
  Haute = 2,
}

const p = Priorite.Haute;
// émis en JS : const p = 2;  — l'objet `Priorite` n'existe pas
```

C'est le plus léger… mais le plus fragile :

- **Incompatible avec `isolatedModules`** (Babel, esbuild, Vite, SWC) : ces outils compilent fichier par fichier et ne peuvent pas inliner une valeur définie ailleurs.
- **Incompatible avec `--erasableSyntaxOnly`** (voir 2.4) : c'est une construction qui n'est pas purement effaçable.
- Pas de reverse mapping, pas d'itération.

En pratique, dès qu'un projet utilise Vite/esbuild (le cas quasi général en 2026), `const enum` est à éviter.

### 2.4 Les pièges des enums (le cœur du débat)

**Piège runtime / bundle.** Un `enum` (numérique ou string) génère du code. Multiplié par des dizaines d'enums, ça pèse.

```ts
enum InvitationStatus { Pending = "pending", Accepted = "accepted" }

// compile (grosso modo) en :
var InvitationStatus;
(function (InvitationStatus) {
  InvitationStatus["Pending"] = "pending";
  InvitationStatus["Accepted"] = "accepted";
})(InvitationStatus || (InvitationStatus = {}));
```

**Piège tree-shaking.** Cet objet-IIFE n'est pas « pur » aux yeux des bundlers : même si tu n'utilises qu'un membre, l'objet entier est souvent conservé. Une union de littéraux, elle, disparaît totalement à l'émission (coût runtime = zéro).

**Piège `erasableSyntaxOnly` (TS 5.8, 2025).** Node peut désormais exécuter du TypeScript en *effaçant* les types (type-stripping) sans les transformer. Or un `enum` ne s'efface pas — il faut le *transformer* en objet. Le flag `--erasableSyntaxOnly` interdit donc toute syntaxe non effaçable :

```ts
// Sous --erasableSyntaxOnly :
enum Role { Admin, User }
// ❌ error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

Sont aussi interdits : `const enum`, les `namespace` avec code runtime, et les propriétés-paramètres de constructeur. Message clair de l'écosystème : **l'union de littéraux devient le défaut recommandé.**

**Piège d'assignabilité (enum numérique).** Un enum numérique accepte n'importe quel nombre :

```ts
enum Niveau { Bas, Haut }
const n: Niveau = 99; // ✅ accepté ! 99 n'est pourtant aucun membre
```

### 2.5 `as const` + union de littéraux — l'alternative

Le pattern qui remplace l'enum sans son bagage runtime :

```ts
// 1. Un objet figé (readonly, valeurs littérales préservées)
export const MEMBER_ROLE = {
  Admin: "admin",
  Parent: "parent",
  Enfant: "enfant",
} as const;

// 2. Le type union dérivé de l'objet
export type MemberRole = typeof MEMBER_ROLE[keyof typeof MEMBER_ROLE];
// => "admin" | "parent" | "enfant"
```

Décorticage de `typeof MEMBER_ROLE[keyof typeof MEMBER_ROLE]` :

- `typeof MEMBER_ROLE` → le type `{ readonly Admin: "admin"; readonly Parent: "parent"; readonly Enfant: "enfant" }`.
- `keyof typeof MEMBER_ROLE` → `"Admin" | "Parent" | "Enfant"`.
- l'accès indexé `[...]` → l'union des **valeurs** : `"admin" | "parent" | "enfant"`.

Ce que tu gagnes :

| Critère | `enum` | `as const` + union |
|---|---|---|
| Coût runtime / bundle | objet généré | **zéro** (le type s'efface) |
| Tree-shakable | non (sauf const, fragile) | **oui** |
| `erasableSyntaxOnly` / type-stripping Node | ❌ interdit | ✅ compatible |
| Valeur d'API (`"admin"`) utilisable directement | non (`Role.Admin`) | **oui** |
| Itérer sur les valeurs au runtime | oui | oui (`Object.values(MEMBER_ROLE)`) |
| Reverse mapping numérique | oui | non |
| Une seule déclaration (type ET valeur) | oui | non (objet + type) |

**Honnêteté d'audit — quand un enum reste défendable :**

- Tu as besoin du **reverse mapping numérique** (rare, souvent une odeur de code).
- Tu maintiens une **grosse base historique** déjà pleine d'enums : la cohérence prime sur la micro-optimisation.
- Ton toolchain n'active ni `isolatedModules` ni `erasableSyntaxOnly` et l'équipe préfère la déclaration unique enum.

Ce n'est donc pas « enum = mal ». C'est : **par défaut, préfère `as const` + union** ; l'enum est un choix à justifier, pas un réflexe. Si tu n'as même pas besoin de l'objet runtime, une simple union suffit :

```ts
export type MemberRole = "admin" | "parent" | "enfant";
```

### 2.6 Tuples

Un **tuple** est un tableau à longueur fixe où chaque position a son propre type.

```ts
let position: [number, number] = [48.8566, 2.3522]; // [lat, lng]
const lat = position[0]; // number
// position[2];          // ❌ pas d'élément à l'index 2

const [x, y] = position; // destructuring typé
```

**Labeled tuples (TS 4.0+).** Des noms de position, purement documentaires (ils n'ajoutent aucune contrainte), mais visibles dans l'IDE et les erreurs :

```ts
type LatLng = [lat: number, lng: number];
type Intervalle = [debut: Date, fin: Date];
```

**Éléments optionnels et rest :**

```ts
type Reponse = [status: number, message: string, payload?: unknown];
const ok: Reponse = [200, "OK", { id: 1 }];
const ko: Reponse = [404, "Not Found"]; // payload omis

type Ligne = [label: string, ...valeurs: number[]];
const l: Ligne = ["total", 1, 2, 3]; // 1 label puis n nombres
```

### 2.7 Variadic tuples

Depuis TS 4.0, un rest `...T` peut être **générique** et placé n'importe où. C'est ce qui permet de typer précisément `concat`, `curry`, `zip`, etc.

```ts
// Ajoute un élément en tête en PRÉSERVANT les positions suivantes
type Prepend<H, T extends readonly unknown[]> = [H, ...T];

type A = Prepend<string, [number, boolean]>; // [string, number, boolean]

// Helper concret : concaténer deux tuples en gardant les types
function concat<T extends readonly unknown[], U extends readonly unknown[]>(
  a: [...T],
  b: [...U],
): [...T, ...U] {
  return [...a, ...b];
}

const r = concat([1, "a"] as [number, string], [true]); // [number, string, boolean]
```

Le rest au **milieu** est également permis :

```ts
type Sandwich = [string, ...number[], string];
const s: Sandwich = ["debut", 1, 2, "fin"];
```

### 2.8 `readonly` tuples

`readonly` interdit toute mutation ; les méthodes muables (`push`, `splice`…) disparaissent du type.

```ts
const point: readonly [number, number] = [10, 20];
// point[0] = 30;  // ❌ read-only
// point.push(1);  // ❌ push n'existe pas sur un readonly tuple

// as const produit un readonly tuple aux valeurs littérales
const rgb = [255, 128, 0] as const; // readonly [255, 128, 0]
```

À privilégier pour les valeurs qui ne doivent jamais bouger (une position figée, une constante géographique).

### 2.9 Types spéciaux : `object`, `{}`, rappel `unknown` / `never`

Trois types que l'on confond souvent.

**`object`** = « tout sauf un primitif » (pas `string`, `number`, `boolean`, `symbol`, `null`, `undefined`, `bigint`). Il accepte objets, tableaux et fonctions, mais on ne peut lire **aucune** propriété dessus sans narrowing.

```ts
function taille(o: object): number {
  return Object.keys(o).length; // OK
  // return o.length;           // ❌ 'length' n'existe pas sur 'object'
}
taille({ a: 1 }); // OK
taille([1, 2]);   // OK (un tableau est un object)
// taille("x");   // ❌ un string n'est pas un object
```

**`{}`** (type accolades vides) = « tout ce qui n'est ni `null` ni `undefined` ». **Contre-intuitif** : `{}` est *plus large* que `object`, il accepte aussi les primitifs.

```ts
let a: {} = "coucou"; // ✅ un string est assignable à {}
let b: {} = 42;       // ✅
// let c: {} = null;  // ❌ null exclu
```

`{}` n'est donc **pas** « un objet vide » : ne l'utilise pas pour dire « un objet ». Pour ça, préfère `Record<string, unknown>` (objet aux clés string, valeurs à narrower) ou une interface précise.

**Rappel `unknown` (top type)** — tout lui est assignable, mais on ne peut rien en faire sans narrowing. C'est le contrat sûr pour une donnée externe :

```ts
function messageErreur(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Erreur inconnue";
}
```

**Rappel `never` (bottom type)** — aucune valeur possible ; sert à prouver l'exhaustivité :

```ts
function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}
```

Résumé de la hiérarchie : `unknown` (le plus large) ⊃ `{}` ⊃ `object` ⊃ types précis ⊃ `never` (le plus étroit).

---

## 3. Worked examples

### Exemple 1 — `MemberRole` : enum vs `as const` (TribuZen)

On part de la proposition « enum » et on la convertit au pattern recommandé, en montrant le trade-off à chaque étape.

```ts
// ─── Version enum (ce qu'on veut éviter par défaut) ──────────────
export enum MemberRoleEnum {
  Admin = "admin",
  Parent = "parent",
  Enfant = "enfant",
}
// Émet un objet runtime + casse sous erasableSyntaxOnly.
// À l'usage, il FAUT passer par le membre :
const r1: MemberRoleEnum = MemberRoleEnum.Admin;
// Une chaîne "admin" venue d'une API n'est PAS directement un MemberRoleEnum.

// ─── Version as const + union (recommandée) ──────────────────────
export const MEMBER_ROLE = {
  Admin: "admin",
  Parent: "parent",
  Enfant: "enfant",
} as const;

// Le type union dérivé — source unique, zéro duplication de littéraux
export type MemberRole = typeof MEMBER_ROLE[keyof typeof MEMBER_ROLE];
// "admin" | "parent" | "enfant"

// 1) La valeur d'API est directement du bon type
function fromApi(raw: string): MemberRole | null {
  const values = Object.values(MEMBER_ROLE) as readonly string[];
  return values.includes(raw) ? (raw as MemberRole) : null;
}

// 2) On peut TOUJOURS itérer au runtime si besoin (menu déroulant admin)
const optionsSelect = Object.values(MEMBER_ROLE); // ["admin","parent","enfant"]

// 3) Exhaustivité gratuite avec l'union
function labelRole(role: MemberRole): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "parent":
      return "Parent";
    case "enfant":
      return "Enfant";
    default:
      // si on ajoute un rôle sans traiter le cas, TS refuse ici
      const _exhaustif: never = role;
      return _exhaustif;
  }
}

console.log(labelRole("admin")); // "Administrateur"
```

**Ce que la version `as const` apporte concrètement :**
- coût bundle nul (le type `MemberRole` s'efface à l'émission) ;
- compatible `erasableSyntaxOnly` / type-stripping Node ;
- la chaîne `"admin"` reçue d'une API est utilisable telle quelle ;
- on garde l'objet `MEMBER_ROLE` quand on a besoin d'itérer (select, seed).

### Exemple 2 — Position `[lat, lng]` et helper variadic (TribuZen)

Une famille TribuZen peut épingler des lieux (photo géolocalisée, point de rendez-vous). On type la position en tuple labellisé `readonly`, puis on écrit un helper variadic.

```ts
// ─── Position géographique figée ────────────────────────────────
// Labels lat/lng = lisibilité ; readonly = une coordonnée ne se mute pas.
export type LatLng = readonly [lat: number, lng: number];

const maison: LatLng = [45.7640, 4.8357]; // Lyon
// maison[0] = 0; // ❌ readonly — impossible de corrompre la latitude

function distanceKm(a: LatLng, b: LatLng): number {
  const [latA, lngA] = a;
  const [latB, lngB] = b;
  const R = 6371;
  const dLat = ((latB - latA) * Math.PI) / 180;
  const dLng = ((lngB - lngA) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latA * Math.PI) / 180) *
      Math.cos((latB * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ─── Helper variadic : construire une "piste" typée ─────────────
// On veut un tuple [origine, ...étapes] où l'origine reste distincte
// des étapes suivantes, quel que soit leur nombre.
function itineraire<Etapes extends readonly LatLng[]>(
  origine: LatLng,
  ...etapes: Etapes
): [origine: LatLng, ...etapes: Etapes] {
  return [origine, ...etapes];
}

const trajet = itineraire(maison, [45.75, 4.85], [45.76, 4.84]);
// type inféré : [origine: LatLng, LatLng, LatLng] — l'arité est préservée

console.log(distanceKm(maison, trajet[1]).toFixed(2), "km");
```

**Points clés de l'exemple :**
- `readonly [lat: number, lng: number]` combine label (doc), position fixe (tuple) et immutabilité.
- le rest générique `...etapes: Etapes` **préserve l'arité** : le type de retour connaît le nombre exact d'étapes, contrairement à `LatLng[]` qui l'aurait effacé.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que « enum = plus propre » sans mesurer le coût

```ts
// ❌ Réflexe importé de C#/Java
enum Status { Pending = "pending", Done = "done" }
// Génère du runtime, casse erasableSyntaxOnly, force Status.Pending partout.

// ✅ Par défaut en TS moderne
type Status = "pending" | "done";
```

**Pourquoi c'est faux :** en TypeScript, l'union de littéraux est le mécanisme *natif* pour un ensemble fermé de valeurs. L'enum est une construction héritée qui ajoute du code. Le choix par défaut s'est inversé — l'enum se justifie, il ne va plus de soi.

### PIÈGE #2 — `const enum` dans un projet Vite/esbuild

```ts
// ❌ Sous isolatedModules (Vite, esbuild, SWC, Babel)
const enum Couleur { Rouge, Vert }
const c = Couleur.Rouge; // build cassé ou comportement incorrect
```

**Pourquoi c'est faux :** ces compilateurs traitent chaque fichier isolément et ne peuvent pas inliner une valeur définie ailleurs. `const enum` suppose une vue globale que seul `tsc` a. Correct : `as const` + union.

### PIÈGE #3 — Enum numérique qui accepte n'importe quel nombre

```ts
enum Niveau { Bas, Moyen, Haut }
const n: Niveau = 42; // ✅ accepté à tort — 42 n'est aucun membre
```

**Pourquoi c'est faux :** un enum numérique est assignable depuis `number`. On perd la garantie « valeur dans l'ensemble ». Une union `0 | 1 | 2` (ou de littéraux string) refuse `42`.

### PIÈGE #4 — Confondre `object`, `{}` et « objet »

```ts
let a: {} = "je suis un string"; // ✅ compile — {} accepte les primitifs !
let b: object = "x";             // ❌ un string n'est PAS un object
```

**Pourquoi c'est faux :** `{}` signifie « non `null`/`undefined` », pas « un objet ». Pour « un objet aux clés string », utilise `Record<string, unknown>` ; pour une forme précise, une interface. Réserve `object` au cas « n'importe quel non-primitif ».

### PIÈGE #5 — Perdre l'arité d'un tuple avec un rest non générique

```ts
// ❌ Le retour efface le nombre d'éléments
function pushFront(x: number, rest: number[]): number[] {
  return [x, ...rest]; // type: number[] — arité perdue
}

// ✅ Variadic tuple : l'arité et les positions sont conservées
function pushFront2<T extends readonly number[]>(x: number, rest: [...T]): [number, ...T] {
  return [x, ...rest];
}
```

**Pourquoi c'est faux :** `number[]` est un tableau de longueur inconnue ; `[number, ...T]` garde la structure exacte. Le variadic tuple est ce qui distingue un « tableau » d'un « tuple typé précisément ».

---

## 5. Ancrage TribuZen

Le fichier `tribuzen/types/index.ts` est la source unique de vérité des formes métier. Ce module y intervient à trois endroits.

**`MemberRole`** — aujourd'hui déclaré en union simple `"admin" | "parent" | "enfant"`. Dès qu'on a besoin d'itérer sur les rôles (peupler un `<select>` dans l'admin, générer des seeds), on passe au pattern `MEMBER_ROLE = {...} as const` + `type MemberRole = typeof MEMBER_ROLE[keyof typeof MEMBER_ROLE]`. On documente en commentaire *pourquoi* pas un enum : coût bundle nul, compat `erasableSyntaxOnly`, chaîne d'API directement typée. C'est le trade-off assumé du cas concret.

**`LatLng`** — nouveau type `readonly [lat: number, lng: number]` pour les lieux épinglés d'une famille (photo géolocalisée, point de rendez-vous). Labels pour la lisibilité, `readonly` parce qu'une coordonnée enregistrée ne se mute pas.

**Helper `itineraire` variadic** — dans les utilitaires de l'app (`tribuzen/lib/geo.ts`), pour composer une piste `[origine, ...étapes]` en préservant l'arité, réutilisable pour l'affichage d'un trajet sur carte.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  types/
    index.ts        # MemberRole (as const + union), LatLng
  lib/
    geo.ts          # distanceKm, itineraire (variadic tuple)
```

---

## 6. Points clés

1. Un `enum` (numérique ou string) existe au runtime : il génère du JavaScript et n'est pas gratuit dans le bundle.
2. Les enums numériques ont un reverse mapping et acceptent n'importe quel `number` — deux sources de bugs silencieux.
3. `const enum` est inliné mais incompatible avec `isolatedModules` (Vite/esbuild) et `erasableSyntaxOnly` — à éviter dans un projet moderne.
4. `--erasableSyntaxOnly` (TS 5.8) interdit enums, `const enum`, `namespace` runtime et propriétés-paramètres : le signal officiel que l'union de littéraux est le défaut.
5. `as const` + `typeof OBJ[keyof typeof OBJ]` reproduit un enum string sans coût runtime, tout en gardant l'objet pour itérer.
6. L'enum reste défendable pour du reverse mapping numérique ou une base historique cohérente — c'est un choix à justifier, pas un réflexe.
7. Un tuple fixe la longueur et le type par position ; les labels documentent, `?` rend optionnel, `...` ajoute un rest.
8. Un variadic tuple (`[H, ...T]` générique) préserve l'arité — indispensable pour typer `concat`, `curry`, `itineraire`.
9. `readonly [a, b]` interdit la mutation ; `as const` en produit un aux valeurs littérales.
10. `{}` = « non null/undefined » (accepte les primitifs), `object` = « non-primitif » ; ni l'un ni l'autre ne veut dire « un objet précis » — préfère `Record`/une interface.

---

## 7. Seeds Anki

```
Pourquoi préférer par défaut `as const` + union de littéraux à un enum en TypeScript ?|L'union a un coût runtime nul (le type s'efface à l'émission), est tree-shakable, compatible erasableSyntaxOnly/type-stripping Node, et la chaîne reçue d'une API est directement du bon type. L'enum génère un objet JS et impose Role.Membre partout.
Que fait le flag `--erasableSyntaxOnly` de TS 5.8 et qu'interdit-il ?|Il n'autorise que la syntaxe TypeScript purement effaçable (pour le type-stripping natif de Node). Il interdit donc les enums, const enum, les namespaces avec code runtime et les propriétés-paramètres de constructeur.
Comment dériver un type union à partir d'un objet figé `as const` ?|type X = typeof OBJ[keyof typeof OBJ]. keyof donne les clés, l'accès indexé donne l'union des valeurs. Avec `as const`, les valeurs sont des littéraux, pas string.
Quel piège spécifique ont les enums NUMÉRIQUES sur l'assignabilité ?|Ils sont assignables depuis n'importe quel number : `const n: Niveau = 42` compile même si 42 n'est aucun membre. Une union de littéraux refuse la valeur hors ensemble.
Pourquoi `const enum` casse-t-il sous Vite/esbuild/Babel ?|Ces outils compilent fichier par fichier (isolatedModules) et ne peuvent pas inliner une valeur définie dans un autre fichier, ce que const enum exige. Seul tsc a la vue globale nécessaire.
Qu'apporte un variadic tuple par rapport à un type tableau ?|Il préserve l'arité et les positions exactes : `[number, ...T]` garde la structure, alors que `number[]` efface la longueur. C'est ce qui permet de typer concat, curry, zip précisément.
Quelle est la différence entre le type `{}` et le type `object` ?|`{}` = tout sauf null/undefined (accepte AUSSI les primitifs comme string/number). `object` = tout sauf un primitif (objets, tableaux, fonctions). Aucun des deux ne signifie « un objet précis » : utiliser Record<string, unknown> ou une interface.
Comment un labeled readonly tuple type-t-il une position géographique figée ?|readonly [lat: number, lng: number] : les labels documentent (visibles IDE/erreurs), le tuple fixe l'ordre et l'arité, readonly interdit la mutation d'une coordonnée enregistrée.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-08-enums-tuples/README.md`. Convertir `MemberRole` d'un enum vers le pattern `as const` + union dans la vraie source de vérité TribuZen, typer une position `LatLng` et écrire un helper variadic — corrigé complet inline.
