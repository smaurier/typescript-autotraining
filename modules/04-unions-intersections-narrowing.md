---
titre: Unions, intersections et narrowing
cours: 00-typescript
notions: [union types (A | B), intersection types (A & B), narrowing par typeof, narrowing par instanceof, narrowing par in, narrowing par égalité, narrowing par truthiness, discriminated unions (tag commun), exhaustiveness checking avec never, type guards utilisateur (predicate is)]
outcomes: [modéliser un état avec une union discriminée, narrower une union avec la technique adaptée, garantir l'exhaustivité d'un switch avec never]
prerequis: [03-objets-interfaces-types]
next: 05-classes-et-heritage
libs: [{ name: typescript, version: "^5" }]
tribuzen: état d'une Invitation modélisé en union discriminée, type Notification en variantes, narrowing exhaustif du back-office TribuZen
last-reviewed: 2026-07
---

# Unions, intersections et narrowing

> **Outcomes — tu sauras FAIRE :** modéliser un état métier avec une union discriminée, narrower une union avec la technique adaptée (`typeof`, `instanceof`, `in`, égalité, truthiness), garantir l'exhaustivité d'un traitement avec `never`.
> **Difficulté :** :star::star:

## 1. Cas concret d'abord

Tu reprends le back-office TribuZen. Un collègue a modélisé l'invitation d'un membre à une tribu comme ceci :

```typescript
// invitation.ts — AVANT (modélisation à plat, dangereuse)
interface Invitation {
  status: string;          // "pending" | "accepted" | "expired" ... on ne sait pas
  memberId?: string;       // rempli SEULEMENT si acceptée
  expiredAt?: Date;        // rempli SEULEMENT si expirée
}

function afficherInvitation(inv: Invitation): string {
  // On veut le memberId quand c'est accepté... mais TS ne garantit rien
  return `Membre : ${inv.memberId.toUpperCase()}`;
  //                    ^^^^^^^^^ inv.memberId est string | undefined → crash possible
}
```

**Trois problèmes immédiats :**

1. `status: string` autorise n'importe quelle chaîne — `"acceptd"` (typo) compile sans broncher.
2. `memberId` et `expiredAt` sont optionnels *en permanence* — TS ne sait pas qu'ils dépendent du `status`. Impossible de lire `inv.memberId` en sécurité.
3. Rien ne force à traiter *tous* les statuts. Un nouveau statut ajouté plus tard passera inaperçu.

Ce module modélise cet état correctement avec une **union discriminée**, puis narrow chaque cas de façon sûre et exhaustive. C'est le pattern central de TypeScript pour représenter « une valeur qui est dans exactement un état parmi plusieurs ».

---

## 2. Théorie complète, concise

### 2.1 Union types (`A | B`)

Une **union** décrit une valeur qui peut être de **plusieurs types**, un seul à la fois.

```typescript
let identifiant: string | number;
identifiant = "abc-123"; // OK
identifiant = 42;         // OK
// identifiant = true;    // Erreur : boolean n'est pas dans l'union
```

Contrainte clé : sur une union non narrowée, tu ne peux accéder qu'aux **membres communs** à tous les types.

```typescript
function longueurOuValeur(x: string | number): number {
  // x.toUpperCase() → Erreur : toUpperCase n'existe pas sur number
  return typeof x === "string" ? x.length : x; // il FAUT narrower d'abord
}
```

### 2.2 Intersection types (`A & B`)

Une **intersection** combine plusieurs types : la valeur doit satisfaire **tous** en même temps. C'est l'outil de composition (revu au module 03).

```typescript
type Horodatable = { creeLe: Date };
type Identifiable = { id: string };

// Doit avoir creeLe ET id
type Entite = Horodatable & Identifiable;

const e: Entite = { id: "abc", creeLe: new Date() }; // les deux requis
```

> **Union vs intersection — ne pas confondre :**
> - `A | B` = « **soit** A, **soit** B » → moins de propriétés garanties (les communes).
> - `A & B` = « A **et** B à la fois » → plus de propriétés garanties (toutes).
> - Intersection de primitifs incompatibles = `never` : `string & number` n'a aucune valeur possible.

### 2.3 Narrowing : le principe

Le **narrowing** est le processus par lequel TypeScript **réduit** une union à un type plus précis grâce à une vérification à l'exécution. TS suit le flux du code (*control flow analysis*).

```typescript
function traiter(valeur: string | number | null): string {
  if (valeur === null) return "vide";
  // ici : string | number (null éliminé)
  if (typeof valeur === "string") return valeur.toUpperCase();
  // ici : number (string éliminé)
  return valeur.toFixed(2);
}
```

Cinq techniques à connaître.

**a) `typeof` — types primitifs**

```typescript
function formater(v: string | number | boolean): string {
  if (typeof v === "string") return `"${v}"`;    // v : string
  if (typeof v === "number") return v.toFixed(2); // v : number
  return v ? "vrai" : "faux";                      // v : boolean
}
// typeof renvoie : "string" | "number" | "boolean" | "undefined"
//                | "object" | "function" | "symbol" | "bigint"
// Piège JS : typeof null === "object"
```

**b) `instanceof` — instances de classes**

```typescript
function messageErreur(e: Error | string): string {
  if (e instanceof TypeError) return `Type : ${e.message}`; // e : TypeError
  if (e instanceof Error) return `Erreur : ${e.message}`;    // e : Error
  return e;                                                  // e : string
}
```

**c) `in` — présence d'une propriété**

```typescript
type Voiture = { marque: string; portes: number };
type Moto = { marque: string; cylindree: number };

function decrire(v: Voiture | Moto): string {
  if ("portes" in v) return `${v.marque}, ${v.portes} portes`; // v : Voiture
  return `${v.marque}, ${v.cylindree}cc`;                       // v : Moto
}
```

**d) Égalité (`===`, `==`)**

```typescript
function longueur(t: string | null | undefined): number {
  if (t == null) return 0; // == null capture null ET undefined → t : null | undefined
  return t.length;         // t : string
}
```

**e) Truthiness (piège fréquent)**

```typescript
function afficher(n: number | null): void {
  if (n) console.log(n * 2);
  // ATTENTION : 0 est falsy → n === 0 tombe dans le else (bug)
  // Correct pour les nombres : if (n !== null)
}
// Valeurs falsy : false, 0, -0, 0n, "", null, undefined, NaN
```

### 2.4 Discriminated unions — LE pattern central

Une **union discriminée** (*tagged union*) est une union d'objets partageant une propriété commune littérale — le **discriminant** (ou *tag*). TypeScript s'en sert pour narrower automatiquement.

```typescript
// Chaque variante porte un tag littéral : le champ `status`
type Invitation =
  | { status: "pending" }
  | { status: "accepted"; memberId: string }
  | { status: "expired"; expiredAt: Date };

function resumer(inv: Invitation): string {
  switch (inv.status) {
    case "pending":
      return "Invitation en attente"; // inv : { status: "pending" }
    case "accepted":
      return `Acceptée par ${inv.memberId}`; // inv a memberId, garanti
    case "expired":
      return `Expirée le ${inv.expiredAt.toLocaleDateString("fr")}`;
  }
}
```

Ce que le discriminant apporte, que la version « à plat » du §1 n'avait pas :

1. **Narrowing automatique** — dans `case "accepted"`, `memberId` existe (plus de `?`).
2. **Impossible de mal construire** — `{ status: "accepted" }` sans `memberId` ne compile pas.
3. **Zéro cast** — pas de `as`, pas de `!`.

> Règle : le discriminant doit être un **type littéral** (`"pending"`, `1`, `true`), identique de nom sur toutes les variantes. `status: string` ne discrimine pas.

### 2.5 Exhaustiveness checking avec `never`

Le type `never` représente « ce qui ne peut jamais arriver ». On l'exploite pour **forcer** le traitement de toutes les variantes : si tous les cas sont gérés, le `default` reçoit `never`. Ajouter une variante sans la traiter casse la compilation.

```typescript
function resumer(inv: Invitation): string {
  switch (inv.status) {
    case "pending":  return "En attente";
    case "accepted": return `Acceptée (${inv.memberId})`;
    case "expired":  return "Expirée";
    default:
      // Si tous les cas sont couverts, inv est `never` ici.
      const _exhaustif: never = inv;
      return _exhaustif;
  }
}

// Si on ajoute plus tard :
//   | { status: "revoked"; revokedBy: string }
// Alors `const _exhaustif: never = inv` échoue :
//   Type '{ status: "revoked"; ... }' is not assignable to type 'never'
// → le compilateur te FORCE à gérer "revoked" partout où tu traites Invitation.
```

Version réutilisable, à placer dans un util :

```typescript
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}
// usage : default: return assertNever(inv);
```

C'est le filet de sécurité qui transforme « bug silencieux en prod » en « erreur de compilation ».

### 2.6 Type guards utilisateur (rappel module 02)

Quand la vérification est trop complexe pour `typeof`/`in`, on écrit une fonction dont le type de retour est un **predicate** `param is Type`. TS narrow quand elle renvoie `true`.

```typescript
type Notification =
  | { kind: "email"; to: string; subject: string }
  | { kind: "push"; deviceId: string; title: string };

// Type guard sur une variante précise de l'union
function estEmail(n: Notification): n is Extract<Notification, { kind: "email" }> {
  return n.kind === "email";
}

const notifs: Notification[] = [/* ... */];
const emails = notifs.filter(estEmail); // type : { kind: "email"; ... }[]
```

Sans le predicate `is`, `filter` renverrait `Notification[]` (pas de narrowing). Le guard combine le pouvoir du narrowing avec la réutilisabilité d'une fonction. À réserver aux cas que le narrowing intégré ne couvre pas : validation de données `unknown` venant d'une API, filtres, etc.

---

## 3. Worked examples

### Exemple 1 — Modéliser l'état d'une Invitation (TribuZen)

Reprise du cas concret du §1, corrigé de bout en bout.

```typescript
// ─── src/types/invitation.ts ────────────────────────────────────
// Union discriminée : chaque état porte EXACTEMENT les champs qui le concernent
export type Invitation =
  | { status: "pending"; sentAt: Date }
  | { status: "accepted"; memberId: string; acceptedAt: Date }
  | { status: "expired"; expiredAt: Date };

// ─── src/utils/assert.ts ────────────────────────────────────────
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// ─── src/features/invitation/resumerInvitation.ts ───────────────
import type { Invitation } from "@/types/invitation";
import { assertNever } from "@/utils/assert";

export function resumerInvitation(inv: Invitation): string {
  switch (inv.status) {
    case "pending":
      // inv : { status: "pending"; sentAt: Date }
      return `En attente depuis le ${inv.sentAt.toLocaleDateString("fr")}`;

    case "accepted":
      // inv : { status: "accepted"; memberId: string; acceptedAt: Date }
      // memberId est GARANTI ici — plus de `?`, plus de crash possible
      return `Acceptée par ${inv.memberId}`;

    case "expired":
      // inv : { status: "expired"; expiredAt: Date }
      return `Expirée le ${inv.expiredAt.toLocaleDateString("fr")}`;

    default:
      // Exhaustivité : si on ajoute un statut sans le gérer, ceci ne compile plus
      return assertNever(inv);
  }
}

// ─── Utilisation ────────────────────────────────────────────────
const inv: Invitation = {
  status: "accepted",
  memberId: "usr-42",
  acceptedAt: new Date(),
};
console.log(resumerInvitation(inv)); // "Acceptée par usr-42"

// Impossible de mal construire :
// const faux: Invitation = { status: "accepted" };
// → Erreur : property 'memberId' is missing
```

**Ce que ce découpage apporte :** chaque variante n'a que ses champs légitimes ; le compilateur garantit qu'on lit `memberId` seulement quand l'invitation est acceptée ; l'ajout d'un statut futur est signalé par `assertNever`.

### Exemple 2 — Un type Notification et son envoi exhaustif

Union de variantes hétérogènes, avec narrowing par le tag `kind`.

```typescript
// ─── src/types/notification.ts ──────────────────────────────────
export type Notification =
  | { kind: "email"; to: string; subject: string; body: string }
  | { kind: "sms"; phone: string; message: string }
  | { kind: "push"; deviceId: string; title: string; body: string };

// ─── src/features/notification/envoyer.ts ───────────────────────
import type { Notification } from "@/types/notification";
import { assertNever } from "@/utils/assert";

export function envoyer(n: Notification): string {
  switch (n.kind) {
    case "email":
      // n : variante email → to, subject, body disponibles
      return `Email à ${n.to} — « ${n.subject} »`;
    case "sms":
      // n : variante sms → phone, message disponibles
      return `SMS au ${n.phone} — ${n.message}`;
    case "push":
      // n : variante push → deviceId, title, body disponibles
      return `Push vers ${n.deviceId} — ${n.title}`;
    default:
      return assertNever(n);
  }
}

// Type guard réutilisable pour filtrer une variante précise
export function estPush(
  n: Notification,
): n is Extract<Notification, { kind: "push" }> {
  return n.kind === "push";
}

const file: Notification[] = [
  { kind: "email", to: "a@tribu.zen", subject: "Bienvenue", body: "..." },
  { kind: "push", deviceId: "dev-1", title: "Nouveau membre", body: "..." },
];

// Grâce au predicate `is`, pushOnly est typé { kind: "push"; ... }[]
const pushOnly = file.filter(estPush);
console.log(pushOnly.length); // 1
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Discriminant non littéral

```typescript
// ❌ status: string ne discrimine PAS — pas de narrowing par variante
type Inv = { status: string; memberId?: string };
function f(i: Inv) {
  if (i.status === "accepted") {
    // i.memberId reste string | undefined — TS ne relie pas status et memberId
  }
}

// ✅ Union de types littéraux — le tag relie chaque variante à ses champs
type InvOk =
  | { status: "pending" }
  | { status: "accepted"; memberId: string };
```

**Règle :** un discriminant doit être une union de **littéraux** (`"a" | "b"`), pas `string`.

### PIÈGE #2 — Truthiness sur `0` ou `""`

```typescript
// ❌ 0 et "" sont falsy → traités comme "absents" à tort
function badge(n: number | null): string {
  if (!n) return "aucun"; // n === 0 renvoie "aucun" — BUG
  return `${n} notifs`;
}

// ✅ Comparer explicitement à null/undefined
function badgeOk(n: number | null): string {
  if (n === null) return "aucun";
  return `${n} notifs`; // 0 → "0 notifs", correct
}
```

**Règle :** pour narrower un `number` ou un `string` nullable, teste `=== null`/`=== undefined`, jamais la truthiness.

### PIÈGE #3 — Oublier le `default` avec `never`

```typescript
// ❌ Sans exhaustiveness, un statut ajouté plus tard passe silencieusement
function label(inv: Invitation): string {
  switch (inv.status) {
    case "pending":  return "En attente";
    case "accepted": return "Acceptée";
    // "expired" oublié → renvoie undefined à l'exécution, AUCUNE erreur TS
  }
  return "?";
}

// ✅ default avec assertNever → erreur de compilation si un cas manque
function labelOk(inv: Invitation): string {
  switch (inv.status) {
    case "pending":  return "En attente";
    case "accepted": return "Acceptée";
    case "expired":  return "Expirée";
    default:         return assertNever(inv);
  }
}
```

**Règle :** toute exhaustion d'union discriminée finit par `default: return assertNever(x)`.

### PIÈGE #4 — Confondre `|` et `&`

```typescript
// ❌ On veut « admin OU membre », on écrit une intersection
type Role = { admin: true } & { membre: true };
// Role exige les DEUX à la fois — rarement l'intention

// ✅ Union pour « l'un ou l'autre »
type RoleOk = { type: "admin" } | { type: "membre" };
```

**Règle :** `|` = alternative (états mutuellement exclusifs), `&` = fusion (cumul de contraintes).

---

## 5. Ancrage TribuZen

Le back-office TribuZen manipule plusieurs entités qui sont « dans un état parmi N » — cas d'école pour les unions discriminées.

**`Invitation`** (`src/types/invitation.ts`) — une invitation à rejoindre une tribu passe par `pending` → `accepted` (avec `memberId`) ou `expired` (avec `expiredAt`). Modélisée en union discriminée sur `status`, chaque écran (liste des invitations, badge de relance, page membre) narrow le statut avant d'afficher — impossible de lire `memberId` sur une invitation encore en attente.

**`Notification`** (`src/types/notification.ts`) — les notifications (email de bienvenue, SMS de rappel, push « nouveau membre ») sont une union sur `kind`. Le service d'envoi (`envoyer`) fait un `switch (n.kind)` terminé par `assertNever` : ajouter un canal (ex. `"webhook"`) provoque une erreur de compilation dans le service tant qu'il n'est pas géré.

**Exhaustivité systématique** — chaque `switch` sur une union discriminée du produit se termine par `assertNever`, via l'util partagé `src/utils/assert.ts`. C'est la convention TribuZen : aucun état métier ne peut être ajouté sans que le compilateur ne réclame son traitement partout.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/src/
  types/
    invitation.ts       # union discriminée sur status
    notification.ts     # union discriminée sur kind
  utils/
    assert.ts           # assertNever(x: never): never
  features/
    invitation/resumerInvitation.ts
    notification/envoyer.ts
```

---

## 6. Points clés

1. Une **union** `A | B` = une valeur dans un seul type à la fois ; on n'accède qu'aux membres communs tant qu'on n'a pas narrowé.
2. Une **intersection** `A & B` = une valeur qui satisfait les deux ; `|` = alternative, `&` = cumul.
3. Le **narrowing** réduit une union via `typeof` (primitifs), `instanceof` (classes), `in` (propriété), égalité (`=== null`), truthiness (attention à `0`/`""`).
4. Une **union discriminée** partage un tag littéral commun (`status`, `kind`) — c'est LE pattern pour modéliser un état ; TS narrow automatiquement chaque variante.
5. Le discriminant doit être un **type littéral**, pas `string`, sinon pas de narrowing par variante.
6. L'**exhaustiveness checking** avec `never` (`default: return assertNever(x)`) transforme un cas oublié en erreur de compilation.
7. Un **type guard** `x is T` sert quand `typeof`/`in` ne suffisent pas (validation `unknown`, filtres) et rend le narrowing réutilisable.

---

## 7. Seeds Anki

```
Quelle est la différence entre une union (A | B) et une intersection (A & B) ?|Union = une valeur d'un seul des types à la fois, on n'accède qu'aux membres communs. Intersection = une valeur qui satisfait tous les types en même temps, cumul de toutes les propriétés.
Qu'est-ce qu'une union discriminée et à quoi sert le discriminant ?|Une union d'objets partageant une propriété commune de type littéral (le tag/discriminant, ex. status: "pending"). TypeScript s'en sert pour narrower automatiquement chaque variante dans un switch/if, et garantit que chaque variante n'a que ses champs légitimes.
Pourquoi status: string ne fonctionne-t-il pas comme discriminant ?|Un discriminant doit être une union de types littéraux (ex. "pending" | "accepted"). Avec status: string, TypeScript ne peut pas relier une valeur de status à un jeu de champs précis, donc aucun narrowing par variante n'a lieu.
Comment garantir qu'un switch traite tous les cas d'une union (exhaustiveness) ?|Ajouter un default qui assigne la valeur à never : const _x: never = valeur, ou return assertNever(valeur). Si un cas est oublié (ou une variante ajoutée plus tard), la valeur n'est plus never et la compilation échoue.
Quelles sont les cinq techniques de narrowing d'une union ?|typeof (primitifs), instanceof (instances de classes), in (présence d'une propriété), égalité (=== / == null), et truthiness (if (x)). Attention : la truthiness traite 0 et "" comme falsy.
Pourquoi if (n) est-il dangereux pour narrower un number | null ?|0 est une valeur falsy : if (n) est faux quand n === 0, donc le cas 0 tombe dans le else comme s'il était absent. Il faut comparer explicitement : if (n === null).
Quand écrire un type guard utilisateur (x is T) plutôt que d'utiliser typeof/in directement ?|Quand la vérification est trop complexe pour typeof/in (validation d'une donnée unknown venant d'une API), ou quand on veut réutiliser le narrowing, notamment dans un filter où seul un predicate is permet de narrower le type du tableau résultat.
Que représente le type never et pourquoi est-il utile en fin de switch ?|never est le type des valeurs qui ne peuvent jamais exister. En fin de switch exhaustif, la variable narrowée devient never ; l'assigner à never (ou la passer à assertNever) échoue à la compilation si un cas n'est pas géré, forçant le traitement de toutes les variantes.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-04-narrowing/README.md`. Modéliser l'état d'une `Invitation` TribuZen en union discriminée, narrower chaque cas et garantir l'exhaustivité avec `never` — corrigé complet inclus.
