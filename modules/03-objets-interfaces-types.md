---
titre: Objets, interfaces et types
cours: 00-typescript
notions: [forme d'un objet, interface vs type, propriétés optionnelles, readonly, index signatures, extends vs intersection, declaration merging, objets imbriqués, excess property checks, Record, structural typing]
outcomes: [choisir interface ou type selon le cas, modéliser une forme d'objet avec readonly et optionnels, composer des types par extension et intersection, expliquer le typage structurel de TypeScript]
prerequis: [02-fonctions]
next: 04-unions-intersections-narrowing
libs: [{ name: typescript, version: "^5" }]
tribuzen: interfaces cœur du domaine (Family, Member, Post, Invitation) dans tribuzen/types
last-reviewed: 2026-07
---

# Objets, interfaces et types

> **Outcomes — tu sauras FAIRE :** choisir `interface` ou `type` selon le cas, modéliser une forme d'objet avec `readonly` et propriétés optionnelles, composer des types par extension et intersection, expliquer le typage structurel de TypeScript.
> **Difficulté :** :star::star:

## 1. Cas concret d'abord

Tu démarres le domaine de TribuZen. Un collègue a « typé » les entités comme ça, éparpillé dans trois fichiers différents :

```typescript
// family.ts
const famille: { id: string; nom: string; membres: any[] } = { /* ... */ };

// member.ts — re-typé à la main, incompatible avec le précédent
function inviter(membre: { id: string; nom: string; role: string }) { /* ... */ }

// post.ts — encore une autre forme, le rôle est un string libre
const post = { id: "p1", auteur: "m1", texte: "Coucou", role: "amdin" }; // typo "amdin" non détectée
```

**Quatre problèmes immédiats :**

1. La **forme** de chaque entité est redéfinie à la main à chaque usage — aucune source de vérité.
2. `role: string` accepte `"amdin"` (faute de frappe) sans broncher — aucune contrainte.
3. `any[]` désactive tout typage sur les membres.
4. Rien n'empêche de **muter** un `id` par erreur (`famille.id = "autre"`).

Ce module te donne les outils — `interface`, `type`, `readonly`, propriétés optionnelles, `extends`, `Record` — pour définir **une seule fois** la forme de chaque entité, et laisser le compilateur refuser les objets mal formés. L'objectif : le fichier `tribuzen/types/index.ts` qui devient l'unique référence du domaine.

---

## 2. Théorie complète, concise

### 2.1 La « forme » d'un objet

En TypeScript, un type d'objet décrit sa **forme** (shape) : quelles propriétés existent et de quel type. On peut la déclarer inline, mais dès qu'elle est réutilisée on la nomme.

```typescript
// Inline — pratique pour un cas unique, illisible dès que ça grossit
function saluer(m: { displayName: string; role: string }): string {
  return `Salut ${m.displayName}`;
}

// Nommée — réutilisable, un seul endroit à faire évoluer
interface Member {
  displayName: string;
  role: string;
}
function saluer2(m: Member): string {
  return `Salut ${m.displayName}`;
}
```

### 2.2 `interface` vs `type` — les deux façons de nommer une forme

Les deux nomment une forme d'objet et sont **interchangeables pour ce cas**. La différence tient à ce que chacun sait faire EN PLUS.

```typescript
interface MemberI {
  id: string;
  displayName: string;
}

type MemberT = {
  id: string;
  displayName: string;
};
// Pour un simple objet, MemberI et MemberT sont équivalents à l'usage.
```

Ce que **seul `type`** peut faire :

```typescript
type Id = string | number;                         // union
type Role = "admin" | "parent" | "enfant";         // union de littéraux
type Point = [number, number];                     // tuple
type Handler = (e: Event) => void;                  // alias de fonction
type Partiel<T> = { [K in keyof T]?: T[K] };        // mapped type
```

Ce que **seul `interface`** peut faire :

```typescript
// Declaration merging : deux déclarations du même nom fusionnent (voir 2.6)
interface Window { tribuzenVersion: string; }
```

**Règle de choix pratique :**

| Tu définis… | Utilise |
|---|---|
| la forme d'un objet ou d'un contrat de service | `interface` |
| une union (`A \| B`), un tuple, un alias de primitif/fonction | `type` |
| un mapped/conditional type | `type` |
| un type qu'une lib tierce doit pouvoir augmenter | `interface` |
| en cas de doute sur un objet | `interface` (messages d'erreur plus lisibles) |

> Convention répandue (et celle de ce cours) : **`interface` pour les objets du domaine**, **`type` pour tout le reste** (unions, tuples, alias). C'est ce qu'on applique dans `tribuzen/types`.

### 2.3 Propriétés optionnelles et `readonly`

```typescript
interface MemberBase {
  readonly id: string;   // figé après création — la modifier est une erreur de compilation
  displayName: string;   // requise
  email?: string;        // optionnelle → type réel : string | undefined
}

const m: MemberBase = { id: "m1", displayName: "Alice" }; // email omis : OK
// m.id = "m2";        // ❌ Cannot assign to 'id', it is a read-only property
m.displayName = "Alice D."; // ✅ non readonly

// Accès à une optionnelle : penser au undefined
const domaine = m.email?.split("@")[1] ?? "inconnu";
```

**`readonly` est superficiel (shallow)** — il protège la référence, pas le contenu pointé :

```typescript
interface Family {
  readonly memberIds: string[];
}
const f: Family = { memberIds: ["m1"] };
// f.memberIds = [];      // ❌ réassignation interdite
f.memberIds.push("m2");   // ✅ le tableau lui-même reste mutable !

// Pour verrouiller le contenu : readonly string[] (ou ReadonlyArray<string>)
interface FamilyStrict {
  readonly memberIds: readonly string[];
}
```

### 2.4 Index signatures et `Record`

Une **index signature** décrit un objet aux **clés dynamiques** (inconnues à l'écriture) :

```typescript
interface ReactionMap {
  [emoji: string]: number; // n'importe quelle clé string → une valeur number
}
const r: ReactionMap = { "👍": 3, "❤️": 7 };
r["🎉"] = 1; // OK
```

`Record<K, V>` est le **utility type** qui fait la même chose, en plus concis, et permet de **fermer** l'ensemble des clés :

```typescript
type Reactions = Record<string, number>;              // clés ouvertes (= index signature)
type RolePerms = Record<"admin" | "parent", boolean>; // clés FERMÉES : exactement admin + parent
const perms: RolePerms = { admin: true, parent: false }; // ❌ si une clé manque ou est en trop
```

> Piège classique : l'accès par clé sur une index signature retourne le type déclaré **même si la clé n'existe pas** (`r["absent"]` est typé `number` mais vaut `undefined` au runtime). Active `noUncheckedIndexedAccess` dans `tsconfig` pour obtenir `number | undefined`.

### 2.5 Composition : `extends` vs intersection `&`

Deux façons d'ajouter des propriétés à une forme existante.

```typescript
// Avec interface → extends
interface MemberBase { id: string; displayName: string; }
interface AdminMember extends MemberBase {
  canInvite: boolean; // AdminMember = tout MemberBase + canInvite
}

// Avec type → intersection &
type MemberBaseT = { id: string; displayName: string };
type AdminMemberT = MemberBaseT & { canInvite: boolean };
```

Les deux produisent la même forme. Différences :

- `extends` **vérifie la compatibilité au moment de la déclaration** : si tu redéclares une propriété héritée avec un type incompatible, erreur immédiate et claire.
- `&` **fusionne** — en cas de conflit sur une propriété, le résultat peut devenir `never` silencieusement (`{ x: string } & { x: number }` → `x: never`).
- `interface extends` peut hériter de **plusieurs** interfaces : `interface C extends A, B {}`.

```typescript
// extends peut RESTREINDRE une propriété héritée vers un sous-type
interface AdminMember2 extends MemberBase {
  role: "admin"; // légal si MemberBase.role est un type plus large (ex: MemberRole)
}
```

### 2.6 Declaration merging (spécifique aux interfaces)

Déclarer **deux fois la même interface** les fusionne. Impossible avec `type` (qui lèverait « Duplicate identifier »).

```typescript
interface Config { apiUrl: string; }
interface Config { debug: boolean; }
// Config = { apiUrl: string; debug: boolean }

const c: Config = { apiUrl: "/api", debug: true };
```

Usage réel : **augmenter** un type d'une librairie (ex. ajouter une propriété à `Window`, à `process.env`, aux types Express). Voir module 16.

### 2.7 Objets imbriqués

Une propriété peut elle-même être une forme nommée — on compose des arbres de types :

```typescript
interface Address { city: string; zip: string; }
interface Contact { email: string; address?: Address; }
interface Company { name: string; contact: Contact; }

const co: Company = { name: "TribuZen", contact: { email: "hi@tribuzen.app" } };
const ville = co.contact.address?.city ?? "?"; // optional chaining sur l'imbriqué optionnel
```

### 2.8 Structural typing (duck typing) — LE concept clé

TypeScript est **structurel** : deux types sont compatibles si leurs **structures** le sont, **peu importe leur nom**. C'est l'opposé du typage *nominal* (Java, C#) où seul le nom déclaré compte.

```typescript
interface Cat { name: string; legs: number; }
interface Dog { name: string; legs: number; }

const rex: Dog = { name: "Rex", legs: 4 };
const asCat: Cat = rex; // ✅ même structure → compatible, malgré des noms différents
```

> « Si ça a `name: string` et `legs: number`, alors c'est assignable partout où on demande cette forme. » — le *duck typing*.

**Règle de compatibilité : la cible doit être un sous-ensemble de la source.** Un objet avec **plus** de propriétés est assignable à un type qui en demande **moins** :

```typescript
interface Point2D { x: number; y: number; }
interface Point3D { x: number; y: number; z: number; }

const p3: Point3D = { x: 1, y: 2, z: 3 };
const p2: Point2D = p3; // ✅ Point3D a tout ce que Point2D exige (+ z en bonus)
// const bad: Point3D = p2; // ❌ z manquant
```

### 2.9 Excess property checks

Exception au structural typing : quand on assigne un **objet littéral directement**, TypeScript refuse les propriétés **en trop** (filet contre les fautes de frappe).

```typescript
interface Options { color: string; size: number; }

// ❌ objet littéral direct → excess property check
// const o: Options = { color: "red", size: 42, extra: true };
//   Object literal may only specify known properties, 'extra' does not exist

// ✅ via une variable intermédiaire → structural typing normal, pas de check
const tmp = { color: "red", size: 42, extra: true };
const o: Options = tmp; // OK — tmp a color + size, le reste est ignoré

// ✅ satisfies (module 10) applique le check tout en gardant le type précis
const o2 = { color: "red", size: 42 } satisfies Options;
```

---

## 3. Worked examples

### Exemple 1 — Modéliser `Member` avec base + admin (extension)

Objectif : un membre a une base commune ; un admin a des capacités en plus. On veut `id` immuable, `email` optionnel, et un `role` contraint (pas de `string` libre).

```typescript
// 1. Le rôle est un ensemble fermé de valeurs → type union (pas interface)
type MemberRole = "admin" | "parent" | "enfant";

// 2. Forme commune → interface, id readonly, email optionnel
interface MemberBase {
  readonly id: string;
  readonly familyId: string;
  displayName: string;
  role: MemberRole;
  email?: string;         // un enfant peut ne pas en avoir
  joinedAt: Date;
}

// 3. Admin = base + capacités. extends AJOUTE sans réécrire.
interface AdminMember extends MemberBase {
  role: "admin";          // on restreint le champ hérité à la valeur littérale
  canInvite: boolean;
  canRemoveMembers: boolean;
}

// Usage
const enfant: MemberBase = {
  id: "m1",
  familyId: "f1",
  displayName: "Léa",
  role: "enfant",
  joinedAt: new Date(),
  // email omis : légal car optionnel
};

const chef: AdminMember = {
  id: "m2",
  familyId: "f1",
  displayName: "Alice",
  role: "admin",          // "parent" serait refusé : AdminMember.role = "admin"
  email: "alice@tribuzen.app",
  joinedAt: new Date(),
  canInvite: true,
  canRemoveMembers: true,
};

// enfant.id = "x";       // ❌ readonly
// chef.role = "parent";  // ❌ AdminMember.role est figé à "admin"
```

**Ce que le typage garantit ici :**
- `role` ne peut pas être `"amdin"` — le compilateur n'accepte que les 3 littéraux.
- `id`/`familyId` immuables : aucune ré-affectation accidentelle.
- `AdminMember` a **forcément** `canInvite`/`canRemoveMembers` — un admin mal construit ne compile pas.

### Exemple 2 — `Post` avec `Record`, optionnel, et excess check (fading)

```typescript
interface Post {
  readonly id: string;
  readonly authorId: string;
  readonly createdAt: Date;
  body: string;
  editedAt?: Date;                    // présent seulement si édité
  reactions: Record<string, number>;  // clés dynamiques (emoji) → compteur
}

const p: Post = {
  id: "p1",
  authorId: "m2",
  createdAt: new Date(),
  body: "Rendez-vous dimanche 🎉",
  reactions: { "👍": 2, "🎉": 5 },
};

// Édition : on remplit editedAt (optionnel)
const edited: Post = { ...p, body: "Rendez-vous samedi", editedAt: new Date() };

// Ajout d'une réaction — index signature permet une clé inconnue à l'écriture
edited.reactions["❤️"] = 1;

// ❌ Excess property check sur objet littéral direct :
// const bad: Post = { ...p, likes: 3 };
//   'likes' does not exist in type 'Post' — probablement un champ oublié/mal nommé
```

**Décisions de modélisation :**
- `editedAt?` plutôt que `editedAt: Date | null` : « absent » = jamais édité, plus simple à tester (`if (post.editedAt)`).
- `reactions: Record<string, number>` : on ne connaît pas les emojis à l'avance → clés ouvertes.
- Tous les champs d'identité en `readonly` : un post ne change ni d'id, ni d'auteur, ni de date de création.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Utiliser `type` puis vouloir le rouvrir (declaration merging)

```typescript
// ❌ On croit pouvoir « compléter » un type plus loin
type User = { id: string };
// type User = { name: string }; // Erreur : Duplicate identifier 'User'

// ✅ Si le besoin est d'augmenter à distance (lib, global) → interface
interface UserI { id: string; }
interface UserI { name: string; } // fusion OK
```
**Règle :** besoin de fusion/augmentation → `interface`. Sinon, `type` reste parfait.

### PIÈGE #2 — Croire que `readonly` gèle le contenu

```typescript
interface F { readonly tags: string[]; }
const f: F = { tags: ["a"] };
f.tags.push("b"); // ✅ !! readonly ne protège QUE la référence, pas le tableau
```
**Correct :** `readonly tags: readonly string[]` pour interdire aussi `push`/`pop`.

### PIÈGE #3 — S'étonner que l'excess property check « disparaisse »

```typescript
interface Opt { a: number; }
// const x: Opt = { a: 1, b: 2 };     // ❌ littéral direct → refusé
const raw = { a: 1, b: 2 };
const x: Opt = raw;                    // ✅ via variable → accepté (structural typing)
```
Ce n'est pas un bug : le check ne s'applique **qu'aux objets littéraux assignés directement**. La propriété `b` existe toujours au runtime — elle est juste invisible via le type `Opt`.

### PIÈGE #4 — Attendre un typage nominal

```typescript
interface Euros { amount: number; }
interface Dollars { amount: number; }
const prix: Euros = { amount: 10 };
const facture: Dollars = prix; // ✅ compile ! Même structure → interchangeables
```
TypeScript ne distingue **pas** deux formes identiques par leur nom. Pour créer des types réellement distincts (empêcher de mélanger euros et dollars), il faut un **branded type** (module 18) : `type Euros = number & { readonly __brand: "EUR" }`.

### PIÈGE #5 — Index signature trop permissive qui masque des erreurs

```typescript
interface Loose { name: string; [k: string]: unknown; }
const u: Loose = { name: "x", tpyo: 1 }; // ✅ compile — la typo passe !
```
Une index signature ouverte **désactive** l'excess property check. Ne l'ajoute que si les clés dynamiques sont réellement voulues (ex. `reactions`), pas « pour avoir la paix ».

---

## 5. Ancrage TribuZen

Ce module produit le fichier fondateur du domaine : **`tribuzen/types/index.ts`**, source unique de vérité importée partout (front, API mock, tests). Toutes les entités y sont modélisées avec les notions du module.

```
tribuzen/
  types/
    index.ts   ← Family, Member (MemberBase → AdminMember), Post, Invitation
```

**Décisions de modélisation appliquées :**

- **`Family`** — `readonly id` + `readonly createdAt` (identité figée), `motto?`/`coverUrl?` optionnels (l'utilisateur peut ne pas les renseigner), `memberIds: string[]`.
- **`Member`** — `interface MemberBase` (base commune) étendue par `interface AdminMember extends MemberBase` (capacités de gestion). Le `role` est un `type MemberRole` (union fermée) — impossible de saisir un rôle hors nomenclature. `Member` est l'union `MemberBase | AdminMember`, que le module 04 exploitera pour le narrowing.
- **`Post`** — champs d'identité `readonly`, `editedAt?` optionnel, `reactions: Record<string, number>` (index signature pour les emojis dynamiques).
- **`Invitation`** — `readonly token`, `status: InvitationStatus` (union `"pending" | "accepted" | "expired" | "revoked"`), `acceptedByMemberId?` rempli seulement à l'acceptation.

Pourquoi **interface** pour les entités et **type** pour les unions : les entités sont des objets susceptibles d'être étendus (`extends`) et augmentés (declaration merging côté API), tandis que rôles et statuts sont des ensembles fermés de valeurs — le terrain naturel de `type`.

Fichier cible dans `smaurier/tribuzen` : `src/types/index.ts` (mêmes définitions, importées par les composants du cours React et l'API du cours NestJS).

---

## 6. Points clés

1. Un type d'objet décrit sa **forme** ; on la nomme dès qu'elle est réutilisée (`interface` ou `type`).
2. `interface` et `type` sont **interchangeables pour un objet** ; convention : `interface` pour les entités, `type` pour unions/tuples/alias.
3. Seul `type` fait unions, tuples, alias de primitif/fonction, mapped/conditional types.
4. Seul `interface` fait le **declaration merging** (fusion de déclarations homonymes) — utile pour augmenter des types de libs.
5. `readonly` fige une propriété mais reste **superficiel** : le contenu d'un tableau/objet pointé reste mutable (utiliser `readonly T[]` pour le verrouiller).
6. `?` rend une propriété optionnelle (`T | undefined`) ; y accéder impose de gérer `undefined`.
7. Index signature `[k: string]: V` et `Record<K, V>` décrivent des clés dynamiques ; `Record<"a" | "b", V>` **ferme** l'ensemble des clés.
8. `extends` (interface) et `&` (type) composent des formes ; `extends` vérifie la compatibilité à la déclaration, `&` peut produire `never` en cas de conflit.
9. TypeScript est **structurel** : compatibilité par forme, pas par nom ; un objet avec plus de propriétés est assignable à un type qui en demande moins.
10. L'**excess property check** ne s'applique qu'aux objets littéraux assignés directement — pas via une variable intermédiaire.

---

## 7. Seeds Anki

```
Quand choisir `interface` plutôt que `type` en TypeScript ?|Pour la forme d'un objet ou d'un contrat, surtout s'il doit être étendu (extends) ou augmenté (declaration merging). `type` pour unions, tuples, alias de primitif/fonction, mapped/conditional types. Convention du cours : interface pour les entités, type pour le reste.
Qu'est-ce que le structural typing (duck typing) en TypeScript ?|Deux types sont compatibles si leurs structures le sont, peu importe leur nom. « name: string + legs: number » est assignable partout où cette forme est attendue, même si les interfaces s'appellent Cat et Dog.
Règle de compatibilité structurelle entre deux formes ?|La cible doit être un sous-ensemble de la source : un objet avec PLUS de propriétés est assignable à un type qui en demande MOINS. Point3D {x,y,z} est assignable à Point2D {x,y}, pas l'inverse.
Que protège exactement `readonly` sur une propriété tableau ?|Seulement la référence : on ne peut pas réassigner la propriété, mais on peut muter le contenu (push/pop). Pour verrouiller le contenu il faut `readonly T[]` (ReadonlyArray<T>).
Qu'est-ce que l'excess property check et quand s'applique-t-il ?|Le refus des propriétés en trop lors de l'assignation d'un objet LITTÉRAL directement à un type. Il ne s'applique pas si on passe par une variable intermédiaire (structural typing normal) ni avec une assertion `as`.
Différence entre `interface extends` et l'intersection `&` ?|Les deux composent des formes. `extends` vérifie la compatibilité dès la déclaration et donne des erreurs claires ; `&` fusionne et peut produire `never` en cas de conflit de propriété. Seul `extends` sert aussi à l'héritage multiple explicite d'interfaces.
Quelle fonctionnalité les interfaces ont et pas les type aliases ?|Le declaration merging : deux `interface Foo {}` du même nom fusionnent automatiquement. Deux `type Foo` du même nom lèvent « Duplicate identifier ». Utile pour augmenter Window, process.env, les types d'une lib.
Index signature vs Record<K, V> ?|`{ [k: string]: number }` et `Record<string, number>` sont équivalents pour des clés ouvertes. `Record<"admin" | "parent", boolean>` FERME l'ensemble des clés : toutes doivent être présentes, aucune en trop.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-03-objets-interfaces/README.md`. Modéliser de zéro le fichier `tribuzen/types/index.ts` (`Family`, `Member` base+admin, `Post`, `Invitation`) en appliquant `readonly`, propriétés optionnelles, `extends` et `Record`, puis vérifier au compilateur (`tsc --noEmit`) que les objets mal formés sont refusés.
