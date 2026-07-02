---
titre: Generics fondamentaux
cours: 00-typescript
notions: [fonctions génériques, inférence des paramètres de type, contraintes extends, defaults de paramètre de type, generics sur interfaces types et classes, keyof et accès indexé, const type parameters]
outcomes: [écrire une fonction générique dont TypeScript infère les types, contraindre un paramètre de type avec extends et keyof, rendre un type ou une classe réutilisable via un paramètre de type]
prerequis: [05-classes-et-heritage]
next: 07-generics-avances
libs: [{ name: typescript, version: "^5" }]
tribuzen: types et helpers réutilisables du domaine TribuZen (ApiResponse, getById, Repository) rendus génériques
last-reviewed: 2026-07
---

# Generics fondamentaux

> **Outcomes — tu sauras FAIRE :** écrire une fonction générique dont TypeScript infère les types, contraindre un paramètre de type avec `extends` et `keyof`, rendre un type ou une classe réutilisable via un paramètre de type.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu travailles sur la couche data de l'admin TribuZen. Ton API renvoie toujours la même enveloppe : soit `data`, soit `error`. Un collègue a écrit un type par entité, et un helper `getById` par entité :

```ts
// data/api.ts — AVANT generics
interface MemberResponse {
  data: Member | null;
  error: string | null;
}
interface FamilyResponse {
  data: Family | null;
  error: string | null;
}
interface EventResponse {
  data: Event | null;
  error: string | null;
}
// ... un type par entité, tous identiques sauf le champ data

function getMemberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}
function getFamilyById(families: Family[], id: string): Family | undefined {
  return families.find((f) => f.id === id);
}
// ... un helper par entité, tous identiques sauf le type
```

**Trois problèmes immédiats :**
1. `MemberResponse`, `FamilyResponse`, `EventResponse` sont le **même type** copié 3 fois — seul le type de `data` change.
2. `getMemberById` et `getFamilyById` ont le **même corps** — seul le type des paramètres change.
3. Chaque nouvelle entité (`Comment`, `Notification`…) impose de recopier un type et un helper de plus.

La duplication n'est pas cosmétique : elle **désynchronise**. Le jour où l'enveloppe API gagne un champ `status`, il faut le rajouter dans 8 endroits — et on en oubliera un.

Ce module donne l'outil qui écrit **une seule fois** ce qui varie seulement par le type : les **generics**.

---

## 2. Théorie complète, concise

### 2.1 Le problème que les generics résolvent

Sans generics, pour écrire « le premier élément d'un tableau, quel que soit son type », tu n'as que deux options, **toutes deux mauvaises** :

```ts
// ❌ Option A — une fonction par type : duplication
function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstString(arr: string[]): string | undefined { return arr[0]; }

// ❌ Option B — any : on perd tout le typage
function first(arr: any[]): any { return arr[0]; }
const x = first([1, 2, 3]); // x est any → x.toUpperCase() compile alors que c'est un number
```

Un **generic** dit : « je ne connais pas encore le type, mais au moment de l'appel TypeScript le déduira, et le gardera ». C'est un **paramètre de type** : comme une fonction prend des valeurs en paramètre, une fonction générique prend un **type** en paramètre.

```ts
// ✅ Une seule fonction, typage conservé
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const a = first([1, 2, 3]);       // T inféré = number  → a : number | undefined
const b = first(["x", "y"]);      // T inféré = string  → b : string | undefined
```

`<T>` est un nom de paramètre de type. `T` est une convention (`T`ype), mais un nom explicite (`<Item>`, `<Entity>`) est parfaitement valide et souvent plus lisible.

### 2.2 Fonctions génériques et inférence des paramètres de type

On place le paramètre de type entre chevrons, **juste avant les parenthèses** :

```ts
function identity<T>(value: T): T {
  return value;
}
```

Dans l'immense majorité des cas, tu **n'écris pas** le type à l'appel : TypeScript l'**infère** depuis l'argument.

```ts
const a = identity("hello");   // T inféré = string
const b = identity(42);         // T inféré = number
```

Tu peux le **forcer explicitement** quand l'inférence ne suffit pas (souvent : tableau vide, ou type plus large voulu) :

```ts
const c = identity<string>("hello");   // T forcé = string
const empty = first<number>([]);        // sans forçage, T serait unknown
```

Plusieurs paramètres de type sont indépendants et inférés séparément :

```ts
function mapValue<In, Out>(value: In, fn: (v: In) => Out): Out {
  return fn(value);
}
const len = mapValue("hello", (s) => s.length); // In = string, Out = number → len : number
```

> **Règle de lecture :** le paramètre de type est déclaré une fois (`<T>`), puis **réutilisé** dans les paramètres et le retour. C'est le lien qui garantit que « ce qui entre » et « ce qui sort » partagent le même type.

### 2.3 Contraintes avec `extends`

Par défaut `<T>` accepte **tout**. Dès que le corps de la fonction utilise une propriété (`.length`, `.id`…), il faut **contraindre** `T` pour promettre au compilateur que cette propriété existe.

```ts
// T doit AU MINIMUM avoir une propriété length: number
function longer<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longer("abc", "de");        // ✅ string a .length
longer([1, 2], [3]);         // ✅ array a .length
// longer(1, 2);             // ❌ number n'a pas .length
```

`extends` ici ne signifie pas « hériter » : il signifie **« est assignable à »**, autrement dit « respecte au minimum ce contrat ». Une contrainte peut être une interface :

```ts
interface BaseEntity {
  id: string;
}
function getById<T extends BaseEntity>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id); // .id garanti par la contrainte
}
```

Sans `extends BaseEntity`, `item.id` ne compilerait pas : rien ne garantit que `T` a un `id`.

### 2.4 Defaults de paramètre de type

Comme un paramètre de fonction peut avoir une valeur par défaut, un paramètre de type peut avoir un **type par défaut** avec `=` :

```ts
// Si on ne précise pas T, il vaut string
interface Box<T = string> {
  value: T;
}
const b1: Box = { value: "hi" };       // T = string (défaut)
const b2: Box<number> = { value: 42 }; // T = number (précisé)
```

On combine contrainte **et** défaut. La contrainte vient toujours avant le défaut :

```ts
// T doit être un objet ; à défaut c'est Record<string, unknown>
interface Cache<T extends object = Record<string, unknown>> {
  entries: Map<string, T>;
}
```

### 2.5 Generics sur interfaces, types et classes

Le paramètre de type se place **après le nom** — même principe qu'une fonction.

```ts
// Interface générique
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Alias de type générique
type Pair<A, B> = { first: A; second: B };

// Classe générique — un « moule » : on choisit le type au new
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  get size(): number { return this.items.length; }
}

const numbers = new Stack<number>();
numbers.push(10);
// numbers.push("x"); // ❌ string non assignable à number
```

Écrit **une fois**, `ApiResponse<T>` sert pour `ApiResponse<Member>`, `ApiResponse<Family[]>`, `ApiResponse<Event>`… C'est exactement la duplication du cas concret qui disparaît.

### 2.6 `keyof` et accès indexé `T[K]`

`keyof T` produit l'**union des clés** de `T` (sous forme de littéraux de chaîne). `T[K]` est l'**accès indexé** : le **type de la valeur** à la clé `K`.

```ts
interface Member {
  id: string;
  name: string;
  age: number;
}
type MemberKey = keyof Member;        // "id" | "name" | "age"
type NameType = Member["name"];        // string
```

Le combo canonique `<T, K extends keyof T>` type une fonction d'accès sûre — impossible de demander une clé qui n'existe pas :

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const m: Member = { id: "1", name: "Ana", age: 30 };
const n = getProp(m, "name"); // K = "name" → retour : string
const a = getProp(m, "age");  // K = "age"  → retour : number
// getProp(m, "email");       // ❌ "email" n'est pas une clé de Member
```

Le retour `T[K]` s'adapte à la clé passée : `string` pour `"name"`, `number` pour `"age"`. C'est un accès 100 % type-safe.

### 2.7 `const` type parameters (TS 5.0)

Par défaut, TypeScript **élargit** (widening) les littéraux inférés : un tableau devient `string[]`, un `"admin"` devient `string`. Pour conserver le type littéral, le caller devait ajouter `as const`.

```ts
function makeRoute<T>(segments: T) {
  return segments;
}
const r = makeRoute(["members", "list"]); // T = string[] → littéraux perdus
```

Depuis **TS 5.0**, préfixer le paramètre de type par `const` demande à TypeScript d'inférer comme si le caller avait écrit `as const` — sans qu'il ait à le faire :

```ts
function makeRoute<const T>(segments: T) {
  return segments;
}
const r = makeRoute(["members", "list"]);
// T = readonly ["members", "list"]  → tuple readonly de littéraux, sans `as const`
```

C'est précieux pour les helpers qui doivent **retenir les valeurs exactes** (routes, colonnes, clés de config) au lieu de les élargir. La contrainte se combine : `<const T extends readonly string[]>`.

> **À jour TS 5.x :** `const` type parameters (5.0) est stable et largement utilisé dans les libs typées (routers, ORM, form builders). Le module 07 va plus loin (types conditionnels, `infer`, variadics).

---

## 3. Worked examples

### Exemple 1 — De 3 types dupliqués à `ApiResponse<T>` + `getById` (TribuZen)

Reprise directe du cas concret. On supprime la duplication du §1.

```ts
// domain/entities.ts ────────────────────────────────────────────
export interface BaseEntity {
  id: string;
}
// `Member`/`role` ci-dessous = entités de démo pour illustrer les generics —
// distinctes du domaine canonique `@/types` (MemberRole = "admin" | "parent" | "enfant").
export interface Member extends BaseEntity {
  name: string;
  role: "admin" | "mod" | "member";
}
export interface Family extends BaseEntity {
  label: string;
}

// data/api.ts ───────────────────────────────────────────────────
// UN seul type d'enveloppe, générique. Remplace MemberResponse,
// FamilyResponse, EventResponse... tous identiques sauf `data`.
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Réussite typée : data présent, error null
function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}
// Échec typé : data null, error présent
function fail<T>(message: string): ApiResponse<T> {
  return { data: null, error: message };
}

// UN seul helper d'accès, contraint à « quelque chose qui a un id ».
// Remplace getMemberById, getFamilyById, getEventById...
export function getById<T extends BaseEntity>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

// Utilisation ────────────────────────────────────────────────────
const members: Member[] = [
  { id: "1", name: "Ana", role: "admin" },
  { id: "2", name: "Bo", role: "member" },
];

const found = getById(members, "1"); // T inféré = Member → found : Member | undefined
console.log(found?.role);            // "admin", 100 % typé

const res: ApiResponse<Member> = found ? ok(found) : fail("Membre introuvable");
if (res.data) {
  console.log(res.data.name); // TypeScript sait que data est un Member
}
```

**Ce que les generics apportent ici :**
- L'enveloppe API vit dans **un** type. Ajouter un champ `status` = une seule ligne, propagée partout.
- `getById` fonctionne pour **toute** entité qui a un `id` (contrainte `BaseEntity`), tout en gardant le type exact au retour (`Member`, `Family`…).
- Aucune perte de typage : `found` est `Member | undefined`, pas `any`.

### Exemple 2 — `Repository<T>` générique (pas à pas)

Le pattern repository encapsule le stockage d'entités. Générique, il s'écrit **une fois** pour toutes les entités.

```ts
import type { BaseEntity, Member } from "./domain/entities";

// T contraint : le repository a besoin d'un id pour indexer.
class Repository<T extends BaseEntity> {
  // Étape 1 — stockage interne typé par T
  private store = new Map<string, T>();

  // Étape 2 — lecture
  findAll(): T[] {
    return [...this.store.values()];
  }
  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  // Étape 3 — création : Omit<T, "id"> = T sans le champ id
  // (l'id est généré ici, pas fourni par l'appelant)
  create(input: Omit<T, "id">): T {
    const entity = { ...input, id: crypto.randomUUID() } as T;
    this.store.set(entity.id, entity);
    return entity;
  }

  // Étape 4 — mise à jour : Partial<T> = tous les champs optionnels
  update(id: string, patch: Partial<T>): T | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id }; // id reste stable
    this.store.set(id, updated);
    return updated;
  }

  // Étape 5 — suppression
  remove(id: string): boolean {
    return this.store.delete(id);
  }
}

// Utilisation : on choisit l'entité au new, tout le reste est typé
const memberRepo = new Repository<Member>();
const created = memberRepo.create({ name: "Cléo", role: "mod" });
// create attend Omit<Member, "id"> → { name, role }, pas d'id à fournir
memberRepo.update(created.id, { role: "admin" }); // Partial<Member> → role seul OK
console.log(memberRepo.findById(created.id)?.role); // "admin"
```

**Fading — variante à faire seul (J+30) :** ajoute une méthode `findBy<K extends keyof T>(key: K, value: T[K]): T[]` qui filtre les entités dont `entity[key] === value`. Elle réutilise le combo `keyof` + `T[K]` du §2.6.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Utiliser `any` là où un generic est requis

```ts
// ❌ any : la fonction « marche » mais casse le typage en aval
function first(arr: any[]): any { return arr[0]; }
const n = first([1, 2, 3]);
n.toUpperCase(); // compile — crash au runtime (n est un number)

// ✅ generic : le type traverse la fonction
function firstOk<T>(arr: T[]): T | undefined { return arr[0]; }
const m = firstOk([1, 2, 3]); // m : number | undefined
// m.toUpperCase();            // ❌ refusé à la compilation
```

**Règle :** `any` **efface** le type, un generic le **transporte**. Si un `any` sert juste à « accepter plusieurs types tout en gardant le lien entrée/sortie », c'est un generic qu'il faut.

### PIÈGE #2 — Confondre `extends` (héritage) et `extends` (contrainte)

```ts
class Animal {}
class Dog extends Animal {}          // extends = héritage de classe

function f<T extends BaseEntity>() {} // extends = contrainte de type
```

Même mot-clé, deux sens. Dans `<T extends X>`, `extends` signifie **« T est assignable à X »** (respecte le contrat), pas « T hérite de X ». Un `string` « extends » `{ length: number }` sans qu'il y ait la moindre classe.

### PIÈGE #3 — Contrainte manquante quand on accède à une propriété

```ts
// ❌ T non contraint : item.id n'est pas garanti
function getByIdBad<T>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id); // Erreur : 'id' n'existe pas sur T
}

// ✅ contrainte : on promet que T a un id
function getByIdGood<T extends BaseEntity>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
```

**Signal :** dès que le corps d'une fonction générique lit `t.quelqueChose`, il faut une contrainte qui garantit `quelqueChose`.

### PIÈGE #4 — Attendre un type littéral sans `const` type parameter (ou `as const`)

```ts
function tag<T>(value: T): T { return value; }
const role = tag("admin"); // T = string (élargi) — "admin" perdu

// ✅ TS 5.0 : const type parameter conserve le littéral
function tagConst<const T>(value: T): T { return value; }
const role2 = tagConst("admin"); // T = "admin"
```

**Piège fréquent :** on croit récupérer `"admin"` mais on a `string`. Soit le caller écrit `tag("admin" as const)`, soit — mieux — l'auteur de la fonction déclare `<const T>` une fois pour tous les appelants.

### PIÈGE #5 — Spécifier explicitement un type que l'inférence donnait déjà

```ts
// ❌ Bruit : redondant, l'inférence suffit
const a = identity<string>("hello");

// ✅ Laisser inférer ; ne forcer que si nécessaire (tableau vide, type plus large)
const b = identity("hello");
const c = first<number>([]); // ici le forçage est justifié
```

**Règle :** n'écris le type explicite `<...>` que quand l'inférence échoue ou donne un type trop large. Sinon c'est du bruit.

---

## 5. Ancrage TribuZen

Les generics sont la colonne vertébrale de la couche data de TribuZen. Trois briques concrètes, toutes écrites **une seule fois** :

**`ApiResponse<T>`** (`src/data/api.ts`) — l'enveloppe unique de toutes les réponses serveur. `ApiResponse<Member>`, `ApiResponse<Family[]>`, `ApiResponse<Event>` réutilisent le même contrat `{ data, error }`. Ajouter un champ transverse (`status`, `requestId`) se fait à un seul endroit.

**`getById<T extends BaseEntity>(items, id)`** (`src/data/helpers.ts`) — le sélecteur d'entité par identifiant, valable pour toute entité du domaine (toutes étendent `BaseEntity` qui impose `id: string`). Un seul helper remplace `getMemberById`, `getFamilyById`, `getEventById`.

**`Repository<T extends BaseEntity>`** (`src/data/Repository.ts`) — le dépôt CRUD en mémoire (puis branché sur Prisma au module BDD). `new Repository<Member>()`, `new Repository<Family>()` : la même classe, typée précisément à l'instanciation. `create` utilise `Omit<T, "id">`, `update` utilise `Partial<T>` — les utility types du module 10 s'appuient directement sur ce paramètre `T`.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/
  domain/
    entities.ts        # BaseEntity, Member, Family, Event
  data/
    api.ts             # ApiResponse<T>, ok<T>, fail<T>
    helpers.ts         # getById<T extends BaseEntity>
    Repository.ts      # Repository<T extends BaseEntity>
```

---

## 6. Points clés

1. Un generic = un **paramètre de type** : il transporte le type à travers une fonction/type/classe au lieu de l'effacer comme `any`.
2. À l'appel, TypeScript **infère** le paramètre de type depuis les arguments ; on ne le force (`<...>`) que si l'inférence échoue ou élargit trop.
3. `<T extends X>` **contraint** `T` à respecter le contrat `X` (assignabilité) — nécessaire dès qu'on accède à une propriété de `T`.
4. `<T = Défaut>` donne un **type par défaut** ; contrainte et défaut se combinent : `<T extends object = Record<string, unknown>>`.
5. Interfaces, alias de types et classes se paramètrent pareil : `interface I<T>`, `type A<T>`, `class C<T>` — écrits une fois, réutilisés partout.
6. `keyof T` = union des clés ; `T[K]` = type de la valeur à la clé `K` ; le combo `<T, K extends keyof T>` type un accès de propriété 100 % sûr.
7. `const` type parameters (TS 5.0) : `<const T>` infère les **littéraux/tuples readonly** sans que l'appelant écrive `as const`.

---

## 7. Seeds Anki

```
Quelle est la différence entre un paramètre générique <T> et any ?|any efface le type (tout compile, rien n'est vérifié). <T> transporte le type à travers la fonction : le lien entre l'entrée et la sortie est conservé et vérifié.
Où place-t-on le paramètre de type dans une fonction générique, et qui décide de sa valeur ?|Entre chevrons juste avant les parenthèses : function f<T>(arg: T). La valeur est le plus souvent inférée par TypeScript depuis l'argument ; on ne la force (f<string>(...)) que si l'inférence échoue ou élargit trop.
Que signifie extends dans <T extends X> ? Est-ce de l'héritage ?|Non : c'est une contrainte d'assignabilité — « T respecte au minimum le contrat X ». Ex : string satisfait <T extends { length: number }> sans aucune classe ni héritage.
Pourquoi getById<T>(items, id) ne compile pas si on lit item.id, et comment corriger ?|Sans contrainte, rien ne garantit que T possède un id. On contraint : <T extends BaseEntity> où BaseEntity impose id: string. Le compilateur autorise alors item.id.
Que produisent keyof T et T[K] ? Que fait le combo <T, K extends keyof T> ?|keyof T = union des clés de T ; T[K] = type de la valeur à la clé K. Le combo <T, K extends keyof T> type un accès de propriété sûr : la clé doit exister, et le retour T[K] s'adapte à la clé passée.
Comment donner un type par défaut à un paramètre générique, et le combiner avec une contrainte ?|Avec = : interface Box<T = string>. Contrainte + défaut se combinent, contrainte d'abord : <T extends object = Record<string, unknown>>.
À quoi sert un const type parameter (TS 5.0) et comment l'écrit-on ?|<const T> : TypeScript infère les littéraux/tuples readonly comme si le caller avait écrit as const, sans qu'il ait à le faire. Ex : makeRoute<const T>(["a","b"]) infère readonly ["a","b"] au lieu de string[].
Pourquoi préférer ApiResponse<T> à un type de réponse par entité ?|Un type par entité duplique le même { data, error } et se désynchronise. ApiResponse<T> centralise l'enveloppe : un seul endroit à modifier, réutilisé pour ApiResponse<Member>, ApiResponse<Family[]>, etc.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-06-generics-base/README.md`. Construire de zéro les trois briques génériques de la couche data TribuZen — `ApiResponse<T>`, `getById<T extends BaseEntity>` et `Repository<T>` — avec `tsc`/`tsx` comme vrai outil, corrigé complet commenté et variante J+30.
