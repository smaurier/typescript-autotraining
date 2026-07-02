---
titre: Conditional types et infer
cours: 00-typescript
notions: [conditional types, infer, distributive conditional types, désactiver la distribution avec un tuple, conditional types imbriqués, reconstruire les utility types du module 10]
outcomes: [lire et écrire un type T extends U ? X : Y, extraire un sous-type avec infer, prévoir et contrôler la distribution sur les unions, reconstruire ReturnType et Exclude à la main]
prerequis: [10-utility-types]
next: 12-mapped-types-template-literals
libs: [{ name: typescript, version: "^5" }]
tribuzen: types de la couche API TribuZen (Unwrap du payload, MemberEvent discriminé, rôles distribués)
last-reviewed: 2026-07
---

# Conditional types et infer

> **Outcomes — tu sauras FAIRE :** lire et écrire un conditional type `T extends U ? X : Y`, extraire un sous-type avec `infer`, prévoir et contrôler la distribution sur les unions, reconstruire `ReturnType` et `Exclude` à la main.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu branches le front TribuZen sur l'API. Toutes les réponses HTTP sont enveloppées dans la même structure :

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

// Endpoints réels de TribuZen
type GetMemberResponse = ApiResponse<{ id: string; name: string; role: 'admin' | 'member' }>;
type GetFamilyResponse = ApiResponse<{ id: string; name: string; memberCount: number }>;
```

Dans le store, tu ne veux jamais manipuler l'enveloppe : tu veux **juste le `data`**. Écrire à la main chaque payload est une duplication qui va dériver dès que l'API change :

```ts
// ❌ Duplication : ce type recopie le contenu de ApiResponse au lieu de le dériver
type Member = { id: string; name: string; role: 'admin' | 'member' };
// Si l'API ajoute un champ, ce type ment silencieusement.
```

Ce qu'on veut vraiment, c'est un opérateur de type qui prend `ApiResponse<X>` et **rend `X`**, quel que soit `X` :

```ts
type Member = Unwrap<GetMemberResponse>;
// { id: string; name: string; role: 'admin' | 'member' }  — dérivé, jamais recopié
```

`Unwrap<T>` n'est pas un utility type fourni par TypeScript. Pour l'écrire, il faut deux outils : un **conditional type** (choisir un type selon un test) et `infer` (capturer le type enveloppé). C'est exactement le programme de ce module.

---

## 2. Théorie complète, concise

### 2.1 La forme fondamentale — `T extends U ? X : Y`

Un conditional type est un `if / else` au niveau des types. Il se lit en trois morceaux :

- `T extends U` — « est-ce que `T` est **assignable** à `U` ? » (même relation que pour affecter une valeur)
- `? X` — si oui, le type résultat est `X`
- `: Y` — sinon, c'est `Y`

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<'hello'>;  // true  — un littéral string EST un string
```

Conseil qui change tout : **lis chaque conditional type à voix haute en français**. Tant que tu ne sais pas le paraphraser, il reste opaque.

### 2.2 Conditional types imbriqués — la chaîne `else if`

On chaîne les conditionnels comme un `if / else if / else`. TypeScript évalue **de haut en bas** et s'arrête à la première branche vraie.

```ts
type TypeName<T> =
  T extends string  ? 'string'  :
  T extends number  ? 'number'  :
  T extends boolean ? 'boolean' :
  T extends undefined ? 'undefined' :
  T extends Function ? 'function' :
  'object';

type T1 = TypeName<'x'>;        // 'string'
type T2 = TypeName<42>;         // 'number'
type T3 = TypeName<() => void>; // 'function'
type T4 = TypeName<{ a: 1 }>;   // 'object'
```

L'ordre compte : il faut aller **du plus spécifique au plus général** (voir Piège #3).

### 2.3 `infer` — capturer un sous-type

`infer R` déclare une **variable de type** à l'intérieur de la clause `extends`. Tu proposes une *forme cible* ; si `T` correspond, TypeScript **remplit `R`** avec la pièce manquante. Sinon, on tombe dans la branche `else`.

Image mentale : `infer` est un **trou dans un puzzle**. Tu présentes `T` au puzzle ; s'il s'emboîte, le morceau qui manquait devient `R`.

```ts
// « Si T a la forme (…args) => quelque chose, capture ce quelque chose dans R »
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = ReturnOf<() => string>;            // string
type R2 = ReturnOf<(x: number) => boolean>;  // boolean
type R3 = ReturnOf<number>;                  // never  — pas une fonction, la forme ne colle pas
```

Trois règles à retenir sur `infer` :

1. `infer` ne s'utilise **que** dans la clause `extends` d'un conditional type.
2. Il ne « devine dans le vide » jamais : il faut lui proposer une forme (`Promise<infer C>`, `(infer E)[]`, `{ data: infer D }`, …).
3. La variable inférée n'existe que dans la branche `? X` (le `true`), pas dans le `: Y`.

Quelques formes cibles courantes :

```ts
type ElementOf<T>  = T extends (infer E)[] ? E : never;            // élément d'un tableau
type Awaited1<T>   = T extends Promise<infer C> ? C : T;           // contenu d'une Promise
type DataOf<T>     = T extends { data: infer D } ? D : never;      // propriété data
type FirstArg<T>   = T extends (a: infer P, ...r: any[]) => any ? P : never; // 1er paramètre

type E = ElementOf<string[]>;                 // string
type C = Awaited1<Promise<number[]>>;         // number[]
type D = DataOf<{ data: boolean; ok: 1 }>;    // boolean
```

`infer` peut aussi être **récursif** : on rappelle le type sur la partie capturée.

```ts
// Déballe des Promises imbriquées jusqu'au fond (comme le vrai Awaited)
type DeepAwait<T> = T extends Promise<infer C> ? DeepAwait<C> : T;

type X = DeepAwait<Promise<Promise<Promise<string>>>>; // string
```

### 2.4 Distributive conditional types — le comportement sur les unions

Point le plus important du module. Quand un conditional type est appliqué à une **union** *via un paramètre de type nu*, il se **distribue** : TypeScript applique le test à **chaque membre séparément**, puis **ré-unit** les résultats.

Image mentale : un **tapis roulant**. Chaque membre de l'union passe devant le capteur `extends` un par un, atterrit dans un bac, et à la fin on recolle tous les bacs en une nouvelle union.

```ts
type IsString<T> = T extends string ? true : false;

type R = IsString<string | number>;
// se décompose en :  IsString<string> | IsString<number>
//                  =  true            | false
//                  =  boolean
```

« Paramètre de type **nu** » (*naked type parameter*) = le paramètre est testé **directement**, sans emballage. C'est la condition de déclenchement de la distribution.

Application phare : `Exclude`, qui retire des membres d'une union, **repose entièrement** sur la distribution.

```ts
type MyExclude<T, U> = T extends U ? never : T;

type Roles = 'admin' | 'moderator' | 'member' | 'guest';
type Privileged = MyExclude<Roles, 'member' | 'guest'>;

// Distribution, membre par membre :
//   ('admin'     extends 'member' | 'guest' ? never : 'admin')      -> 'admin'
// | ('moderator' extends 'member' | 'guest' ? never : 'moderator')  -> 'moderator'
// | ('member'    extends 'member' | 'guest' ? never : 'member')     -> never
// | ('guest'     extends 'member' | 'guest' ? never : 'guest')      -> never
// = 'admin' | 'moderator' | never | never
// = 'admin' | 'moderator'   (never disparaît des unions)
```

Deux corollaires à graver :

- `never` est l'**union vide**. Un conditional distributif sur `never` ne tourne « sur rien » → le résultat est `never`, pas la branche `false`.
- `never` s'**absorbe** dans une union (`X | never = X`). C'est ce qui rend `Exclude` propre.

### 2.5 Désactiver la distribution — l'astuce du tuple `[T] extends [U]`

Parfois on veut tester l'union **en bloc**, pas membre par membre. On emballe les deux côtés dans un tuple d'un élément : le paramètre n'est plus « nu », donc **pas de distribution**.

```ts
type Naked<T>   = T   extends string ? 'oui' : 'non';
type Wrapped<T> = [T] extends [string] ? 'oui' : 'non';

type A = Naked<string | number>;   // 'oui' | 'non'  — distribué sur chaque membre
type B = Wrapped<string | number>; // 'non'          — [string | number] n'est pas assignable à [string]
```

Cas d'école : détecter `never`. Sans emballage, impossible (l'union vide ne déclenche rien).

```ts
type IsNeverBad<T>  = T   extends never ? true : false;
type IsNeverGood<T> = [T] extends [never] ? true : false;

type N1 = IsNeverBad<never>;   // never  ❌ (jamais true)
type N2 = IsNeverGood<never>;  // true   ✅
type N3 = IsNeverGood<string>; // false
```

Retiens la règle : **distribution voulue → paramètre nu ; test global → emballe dans `[ ]`.**

### 2.6 Reconstruire les utility types du module 10

Les utility types intégrés ne sont pas magiques : ce sont des conditional types + `infer` + mapped types. En savoir la source, c'est pouvoir en écrire des sur-mesure.

```ts
// ReturnType : capturer le type de retour d'une fonction
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

// Parameters : capturer le tuple des paramètres
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// Exclude : distribution (2.4)
type MyExclude2<T, U> = T extends U ? never : T;

// Extract : le complément d'Exclude
type MyExtract<T, U> = T extends U ? T : never;

// NonNullable : Exclude appliqué à null | undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

`ReturnType` / `Parameters` reposent sur `infer` ; `Exclude` / `Extract` / `NonNullable` reposent sur la distribution. Deux mécanismes, tout le module 10 « avancé » en découle.

---

## 3. Worked examples

### Exemple 1 — Écrire `Unwrap<T>` du cas concret, pas à pas

Objectif : `Unwrap<ApiResponse<X>>` doit rendre `X`.

**Étape 1 — la forme cible.** Une `ApiResponse<X>` a un champ `data: X`. On propose donc la forme `{ data: infer D }` et on capture `D`.

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

type Unwrap<T> = T extends { data: infer D } ? D : never;
```

**Étape 2 — tester la branche vraie.**

```ts
type GetMemberResponse = ApiResponse<{ id: string; name: string; role: 'admin' | 'member' }>;

type Member = Unwrap<GetMemberResponse>;
// { id: string; name: string; role: 'admin' | 'member' }
```

**Étape 3 — tester la branche fausse.** Un type sans `data` tombe dans le `else` :

```ts
type Nope = Unwrap<{ status: number }>; // never — pas de champ data
```

**Étape 4 — variante ciblée sur `ApiResponse`.** Si on veut refuser tout ce qui n'est pas exactement une `ApiResponse`, on resserre la forme cible :

```ts
type UnwrapApi<T> = T extends ApiResponse<infer D> ? D : never;

type Family = UnwrapApi<ApiResponse<{ id: string; memberCount: number }>>;
// { id: string; memberCount: number }
```

Les deux marchent ; `{ data: infer D }` est plus permissif (structural), `ApiResponse<infer D>` est plus intentionnel.

### Exemple 2 — `MemberEvent<T>` : mapper un nom d'événement vers son payload

TribuZen émet des événements membres. Selon le nom (`'invite'`, `'join'`, `'leave'`), le payload change. Un conditional type imbriqué relie le nom au bon type.

```ts
interface InviteEvent { email: string; invitedBy: string }
interface JoinEvent   { memberId: string; joinedAt: string }
interface LeaveEvent  { memberId: string; reason: string }

type MemberEvent<T extends string> =
  T extends 'invite' ? InviteEvent :
  T extends 'join'   ? JoinEvent   :
  T extends 'leave'  ? LeaveEvent  :
  never;

type P1 = MemberEvent<'invite'>; // InviteEvent
type P2 = MemberEvent<'leave'>;  // LeaveEvent
type P3 = MemberEvent<'ping'>;   // never — nom inconnu, verrouillé par le compilateur
```

Un handler typé en découle directement, sans `any` :

```ts
function onMemberEvent<T extends 'invite' | 'join' | 'leave'>(
  type: T,
  payload: MemberEvent<T>,
): void {
  // payload est resserré au bon type selon `type`
}

onMemberEvent('invite', { email: 'a@b.c', invitedBy: 'admin-1' }); // OK
// onMemberEvent('invite', { memberId: 'm1', reason: 'x' });       // ❌ erreur de type
```

### Exemple 3 (fading) — distribution sur une union de rôles

On veut, à partir de l'union des rôles TribuZen, ne garder que les rôles ayant des droits d'admin. On combine distribution (`Extract`) et un test sur une union cible.

```ts
type Role = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

// On garde owner | admin | moderator via la distribution
type StaffRole = Extract<Role, 'owner' | 'admin' | 'moderator'>;
// 'owner' | 'admin' | 'moderator'

// L'inverse : les rôles "simples" (non-staff)
type BasicRole = Exclude<Role, StaffRole>;
// 'member' | 'guest'
```

À toi de compléter mentalement : quel est le résultat de `Exclude<Role, 'guest'>` ? Déroule la distribution des 5 membres et vérifie que seul `'guest'` devient `never`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `never` en entrée d'un conditional distributif

```ts
type Label<T> = T extends string ? 'oui' : 'non';
type R = Label<never>; // never  ❌ (on attendait 'non')
```

**Pourquoi :** `never` est l'union vide ; la distribution ne tourne « sur aucun membre » → `never`. **Correct :** emballer pour tester en bloc.

```ts
type LabelFixed<T> = [T] extends [string] ? 'oui' : 'non';
type R2 = LabelFixed<never>; // 'non'
```

### PIÈGE #2 — `any` satisfait les DEUX branches

```ts
type Test<T> = T extends string ? 'string' : 'other';
type R = Test<any>; // 'string' | 'other'  — les deux à la fois
```

**Pourquoi :** `any` est assignable à tout ET tout lui est assignable, donc les deux branches « réussissent ». **Correct :** détecter `any` explicitement quand c'est un risque.

```ts
type IsAny<T> = 0 extends (1 & T) ? true : false;
type A1 = IsAny<any>;     // true
type A2 = IsAny<string>;  // false
type A3 = IsAny<unknown>; // false
```

### PIÈGE #3 — ordre des branches imbriquées inversé

```ts
// ❌ any en tête : tout matche, les branches suivantes sont mortes
type Bad<T> =
  T extends any    ? 'anything' :
  T extends string ? 'string' :
  never;
// toujours 'anything'

// ✅ du plus spécifique au plus général
type Good<T> =
  T extends string  ? 'string' :
  T extends number  ? 'number' :
  T extends any[]   ? 'array' :
  'other';
```

**Règle :** comme un `switch`, la première branche vraie gagne — place les cas larges en dernier.

### PIÈGE #4 — croire que `infer` fonctionne dans la branche `else`

```ts
// ❌ R n'existe pas dans la branche fausse
// type Broken<T> = T extends (...a: any[]) => infer R ? number : R;
//                                                                ^ R inconnu ici
```

**Pourquoi :** la variable inférée n'est visible que dans la branche `? X` (le `true`). Dans le `: Y`, elle n'a jamais été capturée. **Correct :** n'utiliser `R` que côté vrai.

### PIÈGE #5 — distribution non voulue qui « casse » une comparaison d'union

```ts
type SameShape<T> = T extends { id: string } ? true : false;
type R = SameShape<{ id: string } | { id: number }>;
// true | false = boolean  — distribué, alors qu'on voulait un verdict unique
```

**Correct :** si tu veux un seul verdict sur l'union entière, emballe :

```ts
type SameShapeAll<T> = [T] extends [{ id: string }] ? true : false;
```

---

## 5. Ancrage TribuZen

La couche API de TribuZen est le terrain naturel des conditional types — c'est là qu'on transforme des types « bruts serveur » en types « propres client ».

**`Unwrap<T>`** (`src/lib/api/types.ts`) — toutes les réponses HTTP sont des `ApiResponse<T>`. Le store et les hooks ne veulent que le `data`. `Unwrap` (Exemple 1) dérive le payload sans jamais recopier sa forme ; quand l'API évolue, les types du front suivent tout seuls.

**`MemberEvent<T>`** (`src/lib/events/member.ts`) — le bus d'événements membres (invitation, arrivée, départ) mappe chaque nom d'événement vers son payload via un conditional imbriqué (Exemple 2). Les handlers sont typés sans `any` et un nom d'événement inconnu devient `never`, donc rejeté à la compilation.

**Distribution sur les rôles** (`src/lib/auth/roles.ts`) — l'union `Role` de TribuZen sert à dériver des sous-ensembles (`StaffRole`, `BasicRole`) avec `Extract` / `Exclude`, qui reposent tous deux sur la distribution (Exemple 3). Un seul point de vérité pour les rôles, des sous-ensembles dérivés.

**`Unwrap` + `infer` récursif** — pour les endpoints paginés (`ApiResponse<Paginated<T>>`), on empile deux extractions par `infer` pour atteindre l'élément de liste. Même mécanique que `DeepAwait` (2.3).

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/src/lib/
  api/
    types.ts        # ApiResponse<T>, Unwrap<T>, UnwrapApi<T>
  events/
    member.ts       # InviteEvent/JoinEvent/LeaveEvent, MemberEvent<T>
  auth/
    roles.ts        # Role, StaffRole, BasicRole (Extract/Exclude)
```

---

## 6. Points clés

1. Un conditional type `T extends U ? X : Y` est un `if / else` de types : `U` est le test d'assignabilité, `X` la branche vraie, `Y` la fausse.
2. On imbrique les conditionnels comme un `else if` ; la première branche vraie gagne, donc on ordonne du spécifique au général.
3. `infer R` capture un sous-type dans la clause `extends` en proposant une forme cible ; `R` n'existe que dans la branche vraie.
4. Appliqué à une union via un paramètre **nu**, un conditional se **distribue** : test membre par membre, puis ré-union des résultats.
5. `never` est l'union vide : en entrée distributive il donne `never`, et il s'absorbe dans les unions (`X | never = X`) — c'est le moteur d'`Exclude`.
6. Emballer les deux côtés dans un tuple (`[T] extends [U]`) **désactive** la distribution pour tester l'union en bloc.
7. `any` satisfait les deux branches à la fois ; détecte-le avec `0 extends (1 & T)` quand c'est risqué.
8. Les utility types du module 10 se reconstruisent : `ReturnType` / `Parameters` avec `infer`, `Exclude` / `Extract` / `NonNullable` avec la distribution.

---

## 7. Seeds Anki

```
Comment lire T extends U ? X : Y ?|Si T est assignable à U, le type résultat est X, sinon c'est Y. C'est un if/else au niveau des types.
À quoi sert le mot-clé infer et où peut-on l'utiliser ?|infer capture un sous-type en proposant une forme cible dans la clause extends d'un conditional type. La variable inférée n'existe que dans la branche vraie (? X), jamais dans le else.
Qu'est-ce que la distribution des conditional types ?|Quand un conditional s'applique à une union via un paramètre de type nu, il teste chaque membre séparément puis ré-unit les résultats. Ex : IsString<string | number> = true | false = boolean.
Comment désactiver la distribution d'un conditional type ?|En emballant les deux côtés dans un tuple d'un élément : [T] extends [U]. Le paramètre n'est plus nu, donc TypeScript teste l'union en bloc au lieu de membre par membre.
Pourquoi T extends string ? 'oui' : 'non' donne never pour T = never ?|never est l'union vide ; un conditional distributif ne tourne sur aucun membre et rend never. Correction : [T] extends [string] pour tester en bloc.
Comment reconstruire ReturnType<T> avec infer ?|type MyReturnType<T extends (...a:any)=>any> = T extends (...a:any) => infer R ? R : any. On capture le type de retour via infer R.
Comment reconstruire Exclude<T, U> et sur quel mécanisme repose-t-il ?|type MyExclude<T,U> = T extends U ? never : T. Il repose sur la distribution : chaque membre devient never s'il matche U, et never s'absorbe dans l'union résultat.
Pourquoi any satisfait-il les deux branches d'un conditional ?|any est assignable à tout et tout lui est assignable, donc T extends string réussit ET échoue. On détecte any avec 0 extends (1 & T) ? true : false.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-11-conditional-types/README.md`. Écrire `Unwrap<T>`, `MemberEvent<T>` et reconstruire `MyReturnType` / `MyExclude` à la main, puis contrôler la distribution sur une union de rôles.
