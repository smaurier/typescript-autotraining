---
titre: Types primitifs et inference
cours: 00-typescript
notions: [types primitifs string number boolean null undefined symbol bigint, inference de types, annoter vs laisser inferer, any vs unknown, void et never, literal types, assertion as et non-null bang, operateur satisfies]
outcomes: [choisir le bon type primitif pour chaque donnee, decider quand annoter et quand laisser TypeScript inferer, remplacer any par unknown avec narrowing, utiliser satisfies pour valider un objet sans perdre l inference]
prerequis: [00-prerequis-et-introduction]
next: 02-fonctions
libs: [{ name: typescript, version: "^5" }]
tribuzen: typage des donnees de base d'un Member (id, name, email, age, isActive) et de la config runtime de l'admin TribuZen
last-reviewed: 2026-07
---

# Types primitifs et inference

> **Outcomes — tu sauras FAIRE :** choisir le bon type primitif pour chaque donnee, décider quand annoter vs laisser TypeScript inférer, remplacer `any` par `unknown` avec narrowing, valider un objet de config avec `satisfies` sans perdre l'inférence.
> **Difficulté :** :star:

## 1. Cas concret d'abord

Tu démarres l'admin TribuZen. Un collègue a récupéré la liste des membres depuis l'API et t'a laissé ce code :

```typescript
// membres.ts — AVANT typage
async function chargerMembres() {
  const reponse = await fetch("/api/members");
  const data: any = await reponse.json();

  return data.map((m: any) => ({
    id: m.id,
    name: m.name,
    age: m.age,
    isActive: m.actif,   // typo silencieuse : l'API renvoie `active`, pas `actif`
  }));
}

const membres = await chargerMembres();
console.log(membres[0].naem);   // typo : `naem` au lieu de `name` — aucune erreur
```

**Trois problèmes que `any` a laissé passer :**
1. `m.actif` n'existe pas (l'API renvoie `active`) — `isActive` sera `undefined` partout, en silence.
2. `membres[0].naem` est une faute de frappe — `any` désactive toute vérification, aucun rouge dans l'éditeur.
3. Rien ne garantit que `age` est un `number` : si l'API renvoie `"30"`, les calculs suivants seront faux.

Ce module te donne les briques — types primitifs, inférence, `unknown`, `satisfies` — pour que le compilateur attrape ces trois bugs **avant** l'exécution.

---

## 2. Théorie complète, concise

### 2.1 Les sept types primitifs

TypeScript reprend les primitives de JavaScript et leur ajoute une vérification statique.

| Type | Décrit | Exemple de valeur |
|---|---|---|
| `string` | chaînes de caractères | `"Alice"`, `` `bonjour ${nom}` `` |
| `number` | entiers et flottants (un seul type) | `42`, `3.14`, `-7`, `NaN`, `Infinity` |
| `boolean` | vrai ou faux | `true`, `false` |
| `null` | absence **intentionnelle** de valeur | `null` |
| `undefined` | valeur pas encore définie | `undefined` |
| `bigint` | entiers au-delà de `Number.MAX_SAFE_INTEGER` | `9007199254740991n` |
| `symbol` | identifiant unique | `Symbol("id")` |

```typescript
const name: string = "Alice";
const age: number = 30;
const isActive: boolean = true;

// number est un seul type : entiers, flottants et valeurs spéciales
const prix = 19.99;
const million = 1_000_000;   // underscore = séparateur visuel
console.log(0.1 + 0.2);       // 0.30000000000000004 — flottants IEEE 754
```

`null` et `undefined` sont **distincts** dès que `strictNullChecks` est actif (inclus dans `strict: true`, le défaut de tout `tsconfig` sérieux) :

```typescript
let membreConnecte: string | null = null;   // rien pour l'instant, volontairement
membreConnecte = "Alice";                     // connexion
membreConnecte = null;                        // déconnexion

let brouillon: string | undefined;            // déclaré, pas encore initialisé
```

> **Convention.** `undefined` = « pas encore renseigné » ; `null` = « intentionnellement vide ». Beaucoup d'équipes n'utilisent que `undefined` pour simplifier.

`bigint` et `symbol` sont rares au quotidien :

```typescript
const grand: bigint = 9007199254740991n + 1n;  // suffixe n ; ne se mélange pas avec number
const cle: symbol = Symbol("id");               // chaque Symbol() est unique, même description
```

### 2.2 L'inférence — TypeScript devine le type

Tu n'as pas besoin d'écrire le type quand la valeur le trahit. TypeScript le **déduit**.

```typescript
const name = "Alice";   // inféré : "Alice" (literal, voir 2.3)
let age = 30;           // inféré : number
const noms = ["a", "b"]; // inféré : string[]
const membre = { id: "1", age: 30 }; // inféré : { id: string; age: number }
```

### 2.3 `let` vs `const` change l'inférence

`const` ne peut pas être réassigné → TypeScript infère le type **literal** (le plus précis).
`let` peut changer → TypeScript **élargit** vers le type général.

```typescript
const couleur = "rouge";  // type : "rouge"   (literal)
let couleur2 = "rouge";   // type : string    (élargi, car réassignable)

const code = 200;         // type : 200
let code2 = 200;          // type : number
```

### 2.4 Quand annoter, quand laisser inférer

Règle d'or : **laisse inférer quand c'est évident, annote quand c'est ambigu ou contractuel.**

```typescript
// Laisser inférer (annoter = bruit) :
const age = 30;                 // number, évident
const actif = age > 18;         // boolean, évident

// Annoter (obligatoire ou utile) :
function ttc(ht: number, tva: number): number {  // paramètres : TOUJOURS annotés
  return ht * (1 + tva);
}
let resultat: number;           // variable non initialisée : annotation obligatoire
const statut: "actif" | "inactif" = "actif";  // sinon inféré string, trop large
```

À annoter systématiquement : les **paramètres de fonction** (TS ne peut pas les deviner) et le **retour des fonctions exportées** (contrat public). Le reste, laisse-le inférer.

### 2.5 Literal types

Un literal type n'accepte qu'**une seule valeur précise**. Combinés en union, ils remplacent les « chaînes magiques » :

```typescript
let direction: "nord" | "sud" | "est" | "ouest";
direction = "nord";  // OK
// direction = "haut"; // Erreur : Type '"haut"' is not assignable

type Role = "admin" | "mod" | "member";  // l'éditeur autocomplète les 3 valeurs
```

### 2.6 `any` — le type à fuir

`any` **désactive** toute vérification et se propage comme un virus :

```typescript
function traiter(donnees: any) {
  const x = donnees.valeur;   // x est any
  return x * 2;               // toujours any — la sécurité est perdue en aval
}
const y = traiter({ valeur: 42 }); // y est any → contamine tout le code appelant
```

`any` surgit souvent sans qu'on le demande : `JSON.parse()` renvoie `any`, un paramètre sans type sous `noImplicitAny` désactivé, un import `.js` sans déclarations.

### 2.7 `unknown` — l'alternative sûre

`unknown` accepte lui aussi n'importe quelle valeur, mais **interdit toute opération** tant que tu n'as pas prouvé le type (narrowing) :

```typescript
let valeur: unknown = JSON.parse('{"port": 3000}');
// valeur.port;        // Erreur : 'valeur' is of type 'unknown'

if (typeof valeur === "object" && valeur !== null && "port" in valeur) {
  // ici TypeScript sait que valeur a une propriété port
}

// Cas quotidien : catch renvoie unknown en strict
try {
  risque();
} catch (err: unknown) {
  if (err instanceof Error) console.error(err.message); // narrowing obligatoire
}
```

| `any` | `unknown` |
|---|---|
| accepte tout | accepte tout |
| permet **toute** opération | interdit toute opération avant narrowing |
| se propage silencieusement | force la vérification |
| dangereux, à éviter | sûr, à préférer |

### 2.8 `void` et `never`

`void` = la fonction ne retourne **rien d'utile**. `never` = la fonction ne retourne **jamais** (throw ou boucle infinie).

```typescript
function log(msg: string): void {
  console.log(msg);   // pas de return de valeur
}

function planter(msg: string): never {
  throw new Error(msg);  // ne rend jamais la main
}
```

`never` sert aussi au **contrôle d'exhaustivité** (couvert au module 04 sur le narrowing) : assigner la variable à `never` dans le `default` d'un `switch` force à traiter tous les cas d'une union.

### 2.9 `as`, `!` et `satisfies`

Trois façons d'intervenir sur les types — de la plus risquée à la plus sûre.

**`as` (assertion)** — « fais-moi confiance, c'est ce type ». Aucune vérification runtime :

```typescript
const input = document.getElementById("email") as HTMLInputElement;
input.value = "a@b.c";   // sans le as, TS ne connaît pas .value
```

**`!` (non-null assertion)** — « ce n'est jamais `null`/`undefined` ». Promesse, pas contrôle :

```typescript
const app = document.getElementById("app")!;  // retire null du type... mais crashe si absent
```

`as` et `!` **mentent au compilateur** : ils font taire l'erreur sans rien garantir à l'exécution. À réserver au DOM que tu contrôles ou aux données déjà validées.

**`satisfies` (TS 4.9+)** — vérifie qu'une valeur est **compatible** avec un type, **sans écraser** l'inférence précise. Le meilleur des deux mondes :

```typescript
type Role = "admin" | "member";

// Avec annotation : on perd la précision
const roles1: Record<string, Role> = { alice: "admin" };
// roles1.alice est de type Role (union), les clés sont string

// Avec satisfies : validation ET précision conservées
const roles2 = {
  alice: "admin",
  bob: "member",
} satisfies Record<string, Role>;
// roles2.alice est "admin" (literal), les clés connues : "alice" | "bob"
roles2.alice.toUpperCase();  // OK — TS sait que c'est un string
```

`satisfies` attrape aussi les typos et valeurs invalides à la déclaration, tout en gardant l'autocomplétion sur les clés réelles :

```typescript
const palette = {
  rouge: "#f00",
  vert: "#0f0",
  bleu: [0, 0, 255],
} satisfies Record<string, string | [number, number, number]>;
// palette.rouge : "#f00" (literal string) → .toUpperCase() dispo
// palette.bleu  : [number, number, number] (tuple) → index dispo
```

| Outil | Effet | Vérification |
|---|---|---|
| `: Type` (annotation) | force le type, **perd** l'inférence précise | à la compilation |
| `as Type` | force le type, **pas** de contrôle profond | aucune (peut masquer un bug) |
| `satisfies Type` | **vérifie** sans changer le type inféré | à la compilation |

---

## 3. Worked examples

### Exemple 1 — Typer les données d'un Member depuis l'API (TribuZen)

Reprise du cas concret. On remplace `any` par `unknown` + narrowing, et on type le `Member`.

```typescript
// types/member.ts — le contrat de données
interface Member {
  id: string;        // string, jamais un number
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

// Type guard : valide la forme BRUTE renvoyée par l'API (elle expose `active`,
// pas `isActive`). On décrit la forme RÉSEAU, PAS encore le Member interne —
// un guard `x is Member` qui ne vérifie que `active` serait mensonger (piège #4).
type RawMember = {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
};

function isRawMember(x: unknown): x is RawMember {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.age === "number" &&
    typeof o.active === "boolean"
  );
}

async function chargerMembres(): Promise<Member[]> {
  const reponse = await fetch("/api/members");
  const data: unknown = await reponse.json();   // unknown, PAS any

  if (!Array.isArray(data)) {
    throw new Error("Réponse API invalide : tableau attendu");
  }

  return data
    .filter(isRawMember)             // → RawMember[] (forme réseau validée)
    .map((m) => ({                   // m : RawMember → plus aucun `as`
      id: m.id,
      name: m.name,
      email: m.email,
      age: m.age,
      isActive: m.active,            // mapping explicite active → isActive
    }));
}
```

**Ce que ce typage attrape désormais :**
- `membres[0].naem` → erreur de compilation (`naem` n'existe pas sur `Member`).
- une API qui renvoie `age: "30"` → l'élément est **filtré** par `isRawMember`, il ne pollue pas la liste.
- l'écart `active` (API) vs `isActive` (interne) est rendu **explicite** au lieu de produire un `undefined` silencieux.

### Exemple 2 — Config runtime avec `satisfies`

L'admin TribuZen a besoin d'une config d'environnement. On veut garantir sa forme **et** garder les valeurs littérales exactes.

```typescript
type Environnement = "development" | "staging" | "production";

interface AppConfig {
  env: Environnement;
  apiUrl: string;
  port: number;
  ssl: boolean;
}

// satisfies : vérifie la conformité SANS écraser l'inférence
const config = {
  env: "development",
  apiUrl: "http://localhost:3000",
  port: 3000,
  ssl: false,
} satisfies AppConfig;

// Grâce à satisfies :
config.env;                 // type : "development" (literal), pas Environnement
if (config.env === "development") { /* autocomplété et vérifié */ }
config.apiUrl.startsWith("http"); // OK — TS sait que c'est un string

// Une typo est attrapée à la déclaration :
// const mauvais = { env: "dev", apiUrl: "", port: 3000, ssl: false } satisfies AppConfig;
//                        ~~~~~ Erreur : "dev" n'est pas assignable à Environnement
```

Avec une simple annotation `const config: AppConfig = { ... }`, `config.env` serait du type large `Environnement` et on perdrait le fait qu'ici, précisément, c'est `"development"`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Utiliser `any` « juste pour avancer »

```typescript
// ❌ any éteint la vérification et se propage
function parse(json: string): any {
  return JSON.parse(json);
}
const port = parse('{"port":3000}').prot; // typo `prot` non détectée → undefined runtime

// ✅ unknown force à prouver le type avant usage
function parse(json: string): unknown {
  return JSON.parse(json);
}
```

**Pourquoi c'est faux :** `any` ne « type » rien, il **supprime** le typage. `unknown` conserve la sécurité en exigeant un narrowing.

### PIÈGE #2 — Croire que `as` ou `!` vérifient quelque chose

```typescript
const btn = document.getElementById("absent")!; // ! ne vérifie RIEN
btn.click(); // TypeError au runtime : btn est null

// ✅ vérification réelle
const btn2 = document.getElementById("absent");
if (btn2) btn2.click();
```

**Pourquoi c'est faux :** `as` et `!` agissent **seulement** à la compilation. Ils promettent, ils ne contrôlent pas. Si tu as un doute, `if` / narrowing.

### PIÈGE #3 — Confondre annotation et `satisfies`

```typescript
type Role = "admin" | "member";

const r1: Record<string, Role> = { alice: "admin" };
// r1.alice est de type Role — on a perdu le literal "admin"

const r2 = { alice: "admin" } satisfies Record<string, Role>;
r2.alice; // "admin" — literal conservé
```

**Pourquoi ça compte :** l'annotation **élargit** vers le type déclaré ; `satisfies` **vérifie** puis garde le type inféré, plus précis. Utilise `satisfies` pour les objets de config où tu veux à la fois validation et autocomplétion fine.

### PIÈGE #4 — Sur-annoter ce qui est déjà évident

```typescript
// ❌ bruit visuel : le type est déjà inféré
const prenom: string = "Alice";
const nombres: number[] = [1, 2, 3];

// ✅ laisse inférer
const prenom = "Alice";
const nombres = [1, 2, 3];
```

**Pourquoi c'est faux :** annoter une valeur évidente n'ajoute aucune sécurité et alourdit la lecture. Réserve les annotations aux paramètres, retours exportés et variables non initialisées.

### PIÈGE #5 — Oublier que `NaN` est un `number`

```typescript
const n: number = Number("abc"); // NaN — TypeScript est content, le type est number
console.log(n > 0);              // false, silencieusement
```

**Pourquoi c'est faux :** `NaN` et `Infinity` sont des `number` valides. Le type ne te protège pas d'une conversion ratée ; valide la donnée (`Number.isNaN`) après un `Number(...)` sur une entrée externe.

---

## 5. Ancrage TribuZen

Ce module pose la **couche de typage des données de base** de l'admin TribuZen.

**`Member`** (`src/types/member.ts`) — le contrat de base manipulé ici. `id`, `name`, `email` en `string` ; `age` en `number` ; `isActive` en `boolean`. Chaque vue (liste des membres, fiche membre, badge de rôle) part de ce type. Un `role: MemberRole` (`"admin" | "parent" | "enfant"`, la nomenclature canonique de `@/types`) en literal union garantit qu'aucun rôle hors nomenclature n'entre dans le système. *(Cette forme `Member` de démo — `age`/`isActive` — sert à illustrer les primitifs ; le `Member` canonique complet, `displayName`/`role`/`joinedAt`, est posé au module 03 comme source unique de vérité `@/types`.)*

**Chargement API** (`src/api/members.ts`) — les données réseau arrivent en `unknown`, jamais en `any`. Un type guard `isMember` fait le narrowing avant qu'elles n'entrent dans le state. C'est la frontière entre le monde non typé (le réseau) et le monde typé (l'app).

**Config runtime** (`src/config.ts`) — un objet `config` en `satisfies AppConfig` : validé à la compilation, mais les valeurs restent littérales (`env: "development"`), ce qui alimente l'autocomplétion et les vérifications `if (config.env === ...)`.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/
  types/member.ts     # interface Member (string/number/boolean)
  api/members.ts      # unknown + isMember() narrowing
  config.ts           # const config = { ... } satisfies AppConfig
```

---

## 6. Points clés

1. Les sept primitives : `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol` — `number` couvre entiers, flottants, `NaN` et `Infinity`.
2. `const` infère le type **literal** (`"rouge"`), `let` infère le type **élargi** (`string`).
3. Annote toujours les paramètres et les retours exportés ; laisse inférer le reste.
4. Les literal types en union (`"admin" | "member"`) remplacent les chaînes magiques et activent l'autocomplétion.
5. `any` supprime le typage et se propage ; `unknown` accepte tout mais exige un narrowing avant usage → préfère `unknown`.
6. `void` = pas de retour utile ; `never` = ne retourne jamais (throw / boucle infinie).
7. `as` et `!` forcent le type sans vérification runtime — à réserver au DOM contrôlé ou aux données déjà validées.
8. `satisfies` (TS 4.9+) valide un objet contre un type **sans** écraser l'inférence précise — idéal pour les objets de config.

---

## 7. Seeds Anki

```
Quelle est la différence d'inférence entre const et let sur une chaîne ?|const x = "a" est inféré au type literal "a" (jamais réassignable). let x = "a" est élargi à string (car réassignable).
Pourquoi préférer unknown à any ?|any supprime toute vérification et se propage silencieusement en aval. unknown accepte n'importe quelle valeur mais interdit toute opération tant qu'on n'a pas prouvé le type (narrowing) — la sécurité est conservée.
Quand faut-il annoter un type plutôt que laisser inférer ?|Toujours pour les paramètres de fonction et le retour des fonctions exportées, et pour les variables non initialisées. Sinon, laisser inférer quand la valeur rend le type évident.
Que fait l'opérateur satisfies et depuis quelle version ?|satisfies (TS 4.9+) vérifie qu'une valeur est compatible avec un type SANS écraser le type inféré, plus précis. On garde les literals et l'autocomplétion tout en attrapant typos et valeurs invalides.
Différence entre satisfies et une annotation de type sur un objet de config ?|Une annotation ": Type" élargit la valeur au type déclaré (on perd les literals). satisfies valide contre le type mais conserve le type inféré précis (literals, clés connues).
as et ! vérifient-ils quelque chose au runtime ?|Non. as (assertion) et ! (non-null) agissent uniquement à la compilation : ils forcent/promettent un type sans aucun contrôle à l'exécution. Un ! sur un getElementById absent crashe quand même.
Quelle est la différence entre void et never ?|void = la fonction ne retourne rien d'utile (elle rend la main). never = la fonction ne retourne jamais (elle throw ou boucle à l'infini).
NaN est de quel type en TypeScript ?|number. NaN et Infinity sont des number valides ; le type ne protège donc pas d'un Number("abc") raté — il faut valider avec Number.isNaN.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-01-premiers-types/README.md`. Typer un `Member` TribuZen (string/number/boolean), remplacer `any` par `unknown` + narrowing sur une réponse d'API, et valider une config avec `satisfies`.
