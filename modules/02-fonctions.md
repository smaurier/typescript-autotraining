---
titre: Typer les fonctions
cours: 00-typescript
notions: [paramètres et type de retour, paramètres optionnels et par défaut, rest parameters, function types et call signatures, surcharges (overloads), this typé, contextual typing des callbacks, void return dans les callbacks, type guards (x is T), assertion functions (asserts x is T)]
outcomes: [typer entièrement une fonction (paramètres, optionnels, défaut, rest, retour), écrire et lire des surcharges et des call signatures, protéger le code avec des type guards et des assertion functions]
prerequis: [01-types-primitifs-et-inference]
next: 03-objets-interfaces-types
libs: [{ name: typescript, version: "^5" }]
tribuzen: couche invitations et gardes de type du domaine membres — inviteMember, isActiveMember, callbacks de filtrage des familles
last-reviewed: 2026-07
---

# Typer les fonctions

> **Outcomes — tu sauras FAIRE :** typer entièrement une fonction (paramètres, optionnels, défaut, rest, retour), écrire et lire des surcharges et des call signatures, sécuriser le flux de types avec des type guards (`x is T`) et des assertion functions (`asserts x is T`).
> **Difficulté :** :star::star:

## 1. Cas concret d'abord

Tu reprends le service `members` de l'admin TribuZen. Un collègue a écrit la fonction d'invitation d'un membre dans une famille. Elle « marche » à l'exécution, mais TypeScript ne t'aide en rien :

```ts
// members.service.ts — AVANT typage
function inviteMember(email, role) {
  return {
    email: email,
    role: role || "member",
    token: crypto.randomUUID(),
    status: "pending",
  };
}

// Plus loin, on filtre les membres actifs pour leur envoyer une notif
function notifyActive(members, send) {
  const active = members.filter((m) => m.status === "active");
  active.forEach((m) => send(m));
}
```

**Quatre problèmes que le compilateur ne voit pas :**

1. `email` et `role` sont implicitement `any` (`noImplicitAny` hurlerait en strict) — on peut appeler `inviteMember(42, true)` sans erreur.
2. `role || "member"` accepte n'importe quelle chaîne comme rôle — `inviteMember("a@b.c", "superadmin")` passe alors que ce rôle n'existe pas.
3. Le type de retour n'est pas contraint — si demain on oublie `token`, aucun appelant n'est prévenu.
4. Dans `notifyActive`, `m` est `any` : `m.status === "active"` ne *rétrécit* rien, et `send` peut être appelé avec un membre qui n'est pas réellement actif.

Ce module te donne les outils pour transformer ce code en contrat vérifié : signatures précises, `Role` fermé, un **type guard** `isActiveMember` qui prouve au compilateur qu'un membre est actif, et des callbacks typés.

---

## 2. Théorie complète, concise

### 2.1 Paramètres et type de retour

TypeScript **n'infère jamais** le type des paramètres d'une fonction (il ignore avec quoi elle sera appelée). Il faut donc les annoter. Le type de retour, lui, est inférable — mais on l'annote sur les fonctions exportées ou complexes pour figer le contrat.

```ts
// Contrat explicite : deux number en entrée, un number en sortie
function add(a: number, b: number): number {
  return a + b;
}

// Retour inféré (number) — acceptable sur une fonction interne courte
function double(n: number) {
  return n * 2;
}

// add("10", 20);   // ❌ Argument of type 'string' is not assignable to 'number'
// add(10);         // ❌ Expected 2 arguments, but got 1
```

Annoter le retour attrape les erreurs **dans** la fonction, pas seulement chez l'appelant :

```ts
function priceTTC(ht: number): number {
  // return `${ht * 1.2}`; // ❌ 'string' is not assignable to 'number' — détecté ICI
  return ht * 1.2;
}
```

### 2.2 Paramètres optionnels (`?`)

Un paramètre optionnel peut être omis. Son type devient `T | undefined`, et **il doit suivre** les paramètres obligatoires.

```ts
function greet(name: string, title?: string): string {
  // title est string | undefined — on doit le rétrécir avant usage
  return title ? `Bonjour ${title} ${name}` : `Bonjour ${name}`;
}

greet("Dupont");          // "Bonjour Dupont"
greet("Dupont", "Mme");   // "Bonjour Mme Dupont"

// function bad(a?: string, b: number) {} // ❌ optionnel avant obligatoire
```

### 2.3 Paramètres par défaut (`=`)

Une valeur par défaut rend le paramètre optionnel **sans** ajouter `undefined` au type : dans le corps, le paramètre est toujours de type plein.

```ts
function priceTTC(ht: number, vat: number = 0.2): number {
  return ht * (1 + vat); // vat est number, jamais undefined
}

priceTTC(100);      // 120 — défaut appliqué
priceTTC(100, 0);   // 100 — 0 est falsy mais explicitement passé, donc respecté
priceTTC(100, undefined); // 120 — undefined déclenche le défaut
```

Différence clé avec `?` :

| | `x?: T` | `x: T = valeur` |
|---|---|---|
| Type dans le corps | `T \| undefined` | `T` |
| Si omis | `undefined` | `valeur` |
| Il faut vérifier `undefined` | oui | non |

### 2.4 Rest parameters (`...args`)

Un rest parameter collecte un nombre variable d'arguments dans un tableau (ou un tuple). Il est toujours **en dernier**.

```ts
function sum(...nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3); // 6
sum();        // 0

// Rest après un paramètre fixe
function log(level: string, ...messages: string[]): void {
  messages.forEach((m) => console.log(`[${level}] ${m}`));
}

// Rest typé par un tuple = arité fixe et types positionnels
function point(...coords: [number, number]): { x: number; y: number } {
  return { x: coords[0], y: coords[1] };
}
// point(1);        // ❌ Expected 2 arguments
```

### 2.5 Function types et call signatures

On peut nommer le type d'une fonction, puis l'appliquer à des variables. Les types des paramètres sont alors **inférés depuis le type** (contextual typing) : plus besoin de les réécrire.

```ts
// Function type via un alias
type BinaryOp = (a: number, b: number) => number;

const add: BinaryOp = (a, b) => a + b;      // a, b inférés en number
const sub: BinaryOp = (a, b) => a - b;

// Call signature dans une interface — permet d'ajouter des propriétés
interface Formatter {
  (value: number): string;   // signature d'appel
  locale: string;            // ET une propriété
}

const eur: Formatter = (v) => `${v.toFixed(2)} €`;
eur.locale = "fr-FR";
```

> Une **call signature** (`(args): ret` dans une interface) sert quand la fonction porte aussi des propriétés (ex. `middleware.priority`). Sinon, un simple function type `(a) => b` suffit.

### 2.6 Surcharges (overloads)

Une surcharge déclare **plusieurs signatures publiques** pour une même fonction, quand le type de retour dépend du type d'entrée. On écrit les signatures, puis **une seule implémentation** dont la signature (plus large) n'est pas visible de l'extérieur.

```ts
// Signatures publiques — les plus spécifiques en premier
function parseInput(value: string): number;
function parseInput(value: number): string;

// Signature d'implémentation (invisible aux appelants) + corps
function parseInput(value: string | number): number | string {
  return typeof value === "string" ? Number(value) : String(value);
}

const n = parseInput("42"); // number (pas number | string)
const s = parseInput(42);   // string
// parseInput(true);        // ❌ aucune surcharge ne correspond
```

Règles : (1) les surcharges précèdent l'implémentation ; (2) la signature d'implémentation doit être **compatible avec toutes** les surcharges ; (3) TS teste les surcharges **de haut en bas** et prend la première qui matche — d'où « spécifique d'abord ». En pratique moderne, préférer une **union** ou un **générique** quand c'est possible ; réserver les overloads aux cas où le retour change vraiment selon l'entrée.

### 2.7 `this` typé

En JS, `this` dépend du **site d'appel**. TS permet de le contraindre via un **premier paramètre spécial `this`** — effacé à la compilation, jamais passé à l'appel.

```ts
interface Counter {
  value: number;
  increment(this: Counter): void;
}

const counter: Counter = {
  value: 0,
  increment(this: Counter) {
    this.value++; // this est garanti Counter
  },
};

counter.increment();            // ✅
const loose = counter.increment;
// loose();                     // ❌ The 'this' context ... is not assignable to 'Counter'
```

> Piège classique : les **arrow functions n'ont pas de `this` propre** (elles capturent celui de l'englobant). On ne peut donc pas y déclarer un paramètre `this`. Pour un handler qui a besoin du `this` dynamique (ex. `this` = l'élément DOM), utiliser une `function` classique.

### 2.8 Contextual typing des callbacks

Quand une fonction attend un callback, TS **infère les paramètres du callback** depuis la signature attendue. Tu n'as pas à les retyper.

```ts
function mapNumbers(nums: number[], fn: (n: number, i: number) => number): number[] {
  return nums.map(fn);
}

// n et i sont inférés (number) grâce au contextual typing — pas d'annotation
mapNumbers([1, 2, 3], (n, i) => n + i);
```

### 2.9 `void` de retour dans les callbacks

Subtilité essentielle : un callback typé `=> void` **autorise un retour de n'importe quel type** — la valeur est simplement ignorée. C'est ce qui rend `array.forEach` utilisable avec des méthodes qui renvoient une valeur.

```ts
type VoidCb = () => void;

const cb: VoidCb = () => 42; // ✅ le 42 est ignoré, pas d'erreur

const acc: number[] = [];
// push() renvoie un number, forEach attend () => void → OK grâce à cette règle
[1, 2, 3].forEach((n) => acc.push(n));
```

Attention : cette tolérance vaut pour un **type de callback** `=> void`. Une fonction déclarée directement `function f(): void` qui ferait `return 42` serait, elle, refusée.

### 2.10 Type guards — `x is T`

Un **type guard** (type predicate) est une fonction qui renvoie `boolean` et dont le type de retour `param is T` dit à TS : « si je renvoie `true`, alors `param` est un `T` ». Il rétrécit dans un `if` et **type correctement `.filter`**.

```ts
interface Cat { kind: "cat"; purrs: boolean; }
interface Dog { kind: "dog"; barks: boolean; }
type Animal = Cat | Dog;

function isCat(a: Animal): a is Cat {
  return a.kind === "cat";
}

function describe(a: Animal): string {
  if (isCat(a)) return a.purrs ? "ronronne" : "silencieux"; // a: Cat
  return a.barks ? "aboie" : "silencieux";                  // a: Dog (par élimination)
}

const animals: Animal[] = [/* ... */];
const cats: Cat[] = animals.filter(isCat); // Cat[] grâce au predicate
```

### 2.11 Assertion functions — `asserts x is T`

Une **assertion function** ne renvoie rien : elle **lève une erreur** si la condition est fausse. Après l'appel, TS considère la condition acquise pour le reste du bloc.

```ts
// Forme 1 : asserts <condition>
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Forme 2 : asserts x is T
function assertString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new Error("Attendu un string");
}

function handle(input: unknown): void {
  assertString(input);
  console.log(input.toUpperCase()); // input: string après l'assertion
}
```

`is` vs `asserts` :

| | `v is T` (guard) | `asserts v is T` (assertion) |
|---|---|---|
| Retour | `boolean` | rien (ou `throw`) |
| Usage | dans un `if` / `filter` | ligne d'assertion en amont |
| Si faux | branche `else` | exception levée |
| Effet | rétrécit dans les deux branches | rétrécit tout le code qui suit |

---

## 3. Worked examples

### Exemple 1 — Typer `inviteMember` (TribuZen)

Reprise du cas concret : on ferme le rôle, on contraint le retour, on gère le défaut.

```ts
// domain/roles.ts ────────────────────────────────────────────────
// NB : union de démo pour illustrer le typage des fonctions — distincte de
// la nomenclature canonique `MemberRole` de `@/types` ("admin" | "parent" | "enfant").
export type Role = "owner" | "admin" | "member" | "guest";

// domain/invitations.ts ──────────────────────────────────────────
export interface Invitation {
  email: string;
  role: Role;
  token: string;
  status: "pending"; // une invitation naît toujours "pending"
}

// members.service.ts ─────────────────────────────────────────────
import type { Role } from "./domain/roles";
import type { Invitation } from "./domain/invitations";

// role est optionnel AVEC défaut → dans le corps il est toujours Role
export function inviteMember(email: string, role: Role = "member"): Invitation {
  return {
    email,
    role,
    token: crypto.randomUUID(),
    status: "pending",
  };
}

inviteMember("a@tribuzen.app");            // role = "member"
inviteMember("b@tribuzen.app", "admin");   // role = "admin"
// inviteMember("c@tribuzen.app", "root"); // ❌ "root" n'est pas un Role
// inviteMember(42);                       // ❌ email doit être string
```

**Ce qu'on a gagné :** l'appelant ne peut plus passer un rôle inexistant, le retour est garanti conforme à `Invitation` (oublier `token` casserait la compilation), et `email` est vérifié.

### Exemple 2 — Type guard `isActiveMember` + callbacks typés

On veut filtrer les membres actifs d'une famille et notifier chacun. Un **type guard** prouve l'activité, des **callbacks typés** font le filtrage/mapping.

```ts
// domain/members.ts ──────────────────────────────────────────────
export interface Member {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "active" | "suspended";
  lastSeenAt?: string; // ISO — présent seulement si déjà connecté
}

// Sous-type prouvé : un membre actif a forcément un lastSeenAt
export interface ActiveMember extends Member {
  status: "active";
  lastSeenAt: string;
}

// Type guard : dit au compilateur "si true, c'est un ActiveMember"
export function isActiveMember(m: Member): m is ActiveMember {
  return m.status === "active" && m.lastSeenAt !== undefined;
}

// notifications.ts ───────────────────────────────────────────────
// Callback typé : reçoit un ActiveMember, ne renvoie rien d'utile (=> void)
type Notifier = (member: ActiveMember) => void;

export function notifyActive(members: Member[], send: Notifier): void {
  // filter(isActiveMember) rétrécit Member[] → ActiveMember[]
  const active = members.filter(isActiveMember);

  // dans forEach, m est ActiveMember : lastSeenAt est string (pas string | undefined)
  active.forEach((m) => send(m));
}

// Mapping typé par contextual typing — pas besoin d'annoter m
export function activeEmails(members: Member[]): string[] {
  return members.filter(isActiveMember).map((m) => m.email);
}
```

**Points de contrôle :**
- `members.filter(isActiveMember)` renvoie `ActiveMember[]`, pas `Member[]` : c'est le predicate qui le permet.
- Dans `send(m)`, `m.lastSeenAt` est `string` — le guard a supprimé le `| undefined`.
- `Notifier` renvoie `void` : le corps du callback peut faire `return sendEmail(...)` même si `sendEmail` renvoie un `Promise` ; la valeur est ignorée (voir Piège #3 pour la nuance async).

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `?` et `= valeur` sont interchangeables

```ts
function a(x?: number) {
  return x + 1; // ❌ 'x' is possibly 'undefined' — x est number | undefined
}

function b(x: number = 0) {
  return x + 1; // ✅ x est number dans le corps
}
```

**Règle :** `?` = « l'absence est un cas métier valide, je dois la gérer ». `= valeur` = « il y a un comportement par défaut, le corps travaille toujours avec une valeur ».

### PIÈGE #2 — Rendre la signature d'implémentation d'une surcharge « visible »

```ts
// ❌ On croit avoir 3 signatures utilisables — la ligne d'implémentation N'EN est PAS une
function fmt(v: number): string;
function fmt(v: number | string): string { // cette signature est INVISIBLE aux appelants
  return String(v);
}
// fmt("x"); // ❌ ne compile pas : seule (v: number) est publique

// ✅ Déclarer explicitement chaque variante publique
function fmt2(v: number): string;
function fmt2(v: string): string;
function fmt2(v: number | string): string {
  return String(v);
}
fmt2("x"); // ✅
```

**Règle :** la signature d'implémentation sert uniquement au corps ; seules les signatures déclarées au-dessus sont appelables.

### PIÈGE #3 — Callback `=> void` et fonctions async

La règle « `=> void` ignore le retour » est pratique, mais elle **masque les promesses non attendues**. Passer un callback `async` à un paramètre `=> void` compile, mais personne n'attend (`await`) la promesse.

```ts
type Notifier = (m: ActiveMember) => void;

// ✅ compile — mais l'erreur asynchrone est perdue (unhandled rejection)
const notifier: Notifier = async (m) => {
  await sendEmail(m.email); // si ça rejette, personne ne le voit
};
```

**Règle :** si tu dois attendre le callback, type-le `=> Promise<void>` (ou `=> void | Promise<void>`) et `await` chaque appel — ne compte pas sur `=> void` pour l'async.

### PIÈGE #4 — Type guard non fiable (le corps ment au type)

Un type guard n'est vérifié qu'à sa **signature**, pas à son corps. Si la condition retournée est fausse, TS te fait confiance… à tort.

```ts
// ❌ Le predicate promet ActiveMember mais ne vérifie PAS lastSeenAt
function isActiveBad(m: Member): m is ActiveMember {
  return m.status === "active"; // lastSeenAt peut être undefined !
}
// Plus tard : m.lastSeenAt.slice(0, 10) → crash runtime, 0 erreur TS

// ✅ Le corps couvre TOUTES les garanties du type cible
function isActiveGood(m: Member): m is ActiveMember {
  return m.status === "active" && m.lastSeenAt !== undefined;
}
```

**Règle :** un type guard est une promesse manuelle. Sa condition doit vérifier *toutes* les propriétés que le type cible garantit, sinon on réintroduit les crashs que le typage devait éviter.

---

## 5. Ancrage TribuZen

Ce module type la **couche invitations et gardes de type du domaine membres**, socle réutilisé par tout l'admin TribuZen.

**`inviteMember(email, role?)`** (`src/domain/members/invite.ts`) — appelée depuis l'écran « Inviter dans la famille ». Le `Role` fermé garantit qu'aucune UI ne peut créer une invitation avec un rôle hors nomenclature ; le retour `Invitation` garantit qu'un token est toujours généré avant envoi de l'email.

**`isActiveMember(m): m is ActiveMember`** (`src/domain/members/guards.ts`) — utilisé partout où l'on ne doit toucher que les membres actifs : liste des destinataires de notifications, calcul des sièges facturés, affichage du « dernier vu ». Le predicate transforme un `Member[]` brut (venu de l'API) en `ActiveMember[]` sûr d'un seul `.filter`.

**Callbacks typés (`Notifier`, mappers)** (`src/features/notifications/notify.ts`) — `notifyActive(members, send)` et `activeEmails(members)` s'appuient sur le contextual typing : les callbacks de `filter`/`map`/`forEach` reçoivent leurs types sans annotation, et `=> void` permet à `forEach` d'appeler des `send` qui renvoient une valeur.

**Assertion functions** (`src/lib/assert.ts`) — `assertDefined(value, name)` sécurise les frontières (réponses d'API, params d'URL) avant de descendre dans le domaine typé.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/
  domain/members/
    invite.ts       # inviteMember + Invitation + Role
    guards.ts       # isActiveMember (x is ActiveMember)
  features/notifications/
    notify.ts       # notifyActive, activeEmails (callbacks typés)
  lib/
    assert.ts       # assertDefined (asserts x is T)
```

---

## 6. Points clés

1. TS n'infère jamais les paramètres — on les annote toujours ; le retour est inférable mais s'annote sur les fonctions exportées/complexes.
2. `x?: T` donne `T | undefined` (à rétrécir) ; `x: T = v` donne `T` dans le corps (défaut appliqué, y compris quand on passe `undefined`).
3. `...args: T[]` collecte un nombre variable d'arguments, toujours en dernière position ; un tuple fige l'arité.
4. Un function type `(a) => b` type une variable ; une call signature dans une interface sert quand la fonction porte aussi des propriétés.
5. Les surcharges exposent plusieurs signatures ; la signature d'implémentation est invisible et doit être compatible avec toutes — spécifique d'abord, union/générique si possible.
6. Le paramètre `this` (premier, effacé à la compilation) contraint le contexte d'appel ; les arrow functions n'ont pas de `this` propre.
7. Un callback typé `=> void` ignore sa valeur de retour (base de `forEach`) — mais ne pas s'en servir pour de l'async non attendu.
8. `x is T` (guard, renvoie boolean, rétrécit dans `if`/`filter`) et `asserts x is T` (assertion, throw si faux, rétrécit la suite) sécurisent le flux de types ; le corps d'un guard doit vérifier toutes les garanties du type cible.

---

## 7. Seeds Anki

```
Pourquoi doit-on toujours annoter les paramètres d'une fonction en TypeScript ?|TS ne peut pas les inférer : il ignore avec quels arguments la fonction sera appelée. En mode strict, un paramètre non annoté est un any implicite (noImplicitAny). Le retour, lui, est inférable.
Quelle est la différence de type entre param?: T et param: T = valeur dans le corps ?|Avec ? le paramètre vaut T | undefined (il faut le rétrécir). Avec = valeur il vaut T : le défaut s'applique si on omet l'argument ou si on passe undefined.
Qu'est-ce qu'une surcharge (overload) et pourquoi la signature d'implémentation n'est-elle pas appelable ?|Une surcharge déclare plusieurs signatures publiques précises pour une fonction dont le retour dépend de l'entrée. La signature d'implémentation (plus large) sert uniquement au corps et reste invisible aux appelants.
À quoi sert le paramètre this dans une signature de fonction ?|C'est un premier paramètre spécial qui contraint le type de this au site d'appel. Il est effacé à la compilation et jamais passé. Les arrow functions n'ont pas de this propre et ne peuvent pas le déclarer.
Pourquoi un callback typé => void peut-il renvoyer une valeur sans erreur ?|Parce qu'un type de callback => void ignore la valeur de retour. C'est ce qui permet à array.forEach d'accepter des callbacks comme n => arr.push(n) où push renvoie un number.
Quelle est la différence entre x is T et asserts x is T ?|x is T est un type guard : renvoie boolean, s'utilise dans un if/filter, rétrécit dans les deux branches. asserts x is T est une assertion : ne renvoie rien, lève une erreur si faux, et rétrécit tout le code qui suit.
Quel est le danger d'un type guard dont le corps ne vérifie pas toutes les garanties du type cible ?|TS croit la signature sur parole sans vérifier le corps. Si la condition retournée est incomplète (ex. status === "active" sans vérifier lastSeenAt), on obtient un ActiveMember non fiable et un crash runtime sans aucune erreur de compilation.
Comment le contextual typing simplifie-t-il l'écriture des callbacks de filter/map ?|Quand la fonction attend un callback d'un type connu, TS infère les types des paramètres du callback depuis cette signature. On écrit (n, i) => ... sans réannoter n: number, i: number.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-02-fonctions/README.md`. Typer de zéro le service d'invitation TribuZen, écrire le type guard `isActiveMember` et les callbacks de notification, puis durcir le tout avec une assertion function.
