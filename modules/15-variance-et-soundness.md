---
titre: Variance et soundness
cours: 00-typescript
notions: [covariance contravariance invariance bivariance, variance des fonctions params contravariants retour covariant, strictFunctionTypes, bivariance des méthodes, covariance des tableaux mutables, zones unsound assumées any assertions index access, annotations de variance in out TS 4.7, praticité contre soundness]
outcomes: [déterminer la variance d un paramètre de type selon sa position entrée ou sortie, expliquer pourquoi strictFunctionTypes rend les paramètres contravariants et pourquoi les méthodes restent bivariantes, repérer et neutraliser une assignation unsound sur un tableau mutable, annoter la variance d un générique avec in et out et lire l erreur quand elle ne correspond pas]
prerequis: [14-decorateurs-metadata]
next: 16-declaration-files-augmentation
libs: [{ name: typescript, version: "^5" }]
tribuzen: bus d événements et handlers typés de l admin TribuZen — variance des Handler et des tableaux de membres
last-reviewed: 2026-07
---

# Variance et soundness

> **Outcomes — tu sauras FAIRE :** déterminer la variance d'un paramètre de type selon sa position (entrée / sortie), expliquer pourquoi `strictFunctionTypes` rend les paramètres contravariants et pourquoi les méthodes restent bivariantes, repérer et neutraliser une assignation *unsound* sur un tableau mutable, annoter la variance d'un générique avec `in`/`out`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu reprends le bus d'événements de l'admin TribuZen. Il notifie les modules abonnés (audit log, badges, e-mails) quand un membre change. Un collègue a écrit ceci — **ça compile, et ça a planté en prod hier soir.**

```ts
interface Member {
  id: string;
  name: string;
}

interface AdminMember extends Member {
  permissions: string[]; // un admin a des droits, un membre normal non
}

// Le bus stocke des handlers qui reçoivent un AdminMember
type Handler<T> = (payload: T) => void;

const adminHandlers: Handler<AdminMember>[] = [];

function onAdminEvent(h: Handler<AdminMember>) {
  adminHandlers.push(h);
}

// Un handler écrit pour n'importe quel Member — accepté sans broncher
const logMember: Handler<Member> = (m) => console.log(`event: ${m.name}`);
onAdminEvent(logMember); // OK ✅ (et c'est SÛR, on verra pourquoi)

// ── Ailleurs, quelqu'un fait l'inverse ──────────────────────────
const memberHandlers: Handler<Member>[] = [];

function onMemberEvent(h: Handler<Member>) {
  memberHandlers.push(h);
}

const notifyAdmins: Handler<AdminMember> = (a) => {
  a.permissions.forEach((p) => console.log(p)); // lit .permissions
};

// onMemberEvent(notifyAdmins); // ❌ Erreur avec strictFunctionTypes — heureusement
```

Deux assignations qui semblent symétriques. **L'une est sûre, l'autre est un bug.** Et le crash de prod venait d'un troisième cas — un tableau — qui, lui, compile *malgré* le danger. Ce module te donne la grille de lecture pour dire, sans exécuter, laquelle est laquelle.

> **Audit d'abord.** Devant une assignation de types qui « passe » ou « ne passe pas » de façon surprenante, la question n'est jamais « le compilateur a-t-il un bug ». C'est : *où le paramètre de type est-il lu (sortie), où est-il écrit (entrée), et cette assignation respecte-t-elle la direction imposée par ces positions ?*

---

## 2. Théorie complète, concise

### 2.1 Le vocabulaire : quatre variances

La **variance** décrit comment le sous-typage d'un paramètre `T` se propage à un type générique `F<T>`. On part toujours de la relation de base : `AdminMember` est un **sous-type** de `Member` (il a tout `Member` + `permissions`). Note `Sub <: Super`.

| Variance | Règle | Direction |
|---|---|---|
| **Covariance** | `Sub <: Super` ⟹ `F<Sub> <: F<Super>` | préservée |
| **Contravariance** | `Sub <: Super` ⟹ `F<Super> <: F<Sub>` | inversée |
| **Invariance** | `F<Sub>` et `F<Super>` incompatibles dans les deux sens | aucune |
| **Bivariance** | les deux directions acceptées (unsound, historique) | les deux |

Le mécanisme sous-jacent : **où `T` apparaît-il dans `F` ?**
- `T` en **position de sortie** (ce que le type *produit* / renvoie / expose en lecture) → **covariant**.
- `T` en **position d'entrée** (ce que le type *consomme* / accepte en paramètre / écrit) → **contravariant**.
- `T` dans **les deux** → **invariant**.

### 2.2 Position de sortie → covariance

Un producteur de `T` reste utilisable là où on attend un producteur d'un type plus général.

```ts
type Producer<T> = () => T;

const getAdmin: Producer<AdminMember> = () => ({ id: "1", name: "Zoe", permissions: [] });
const getMember: Producer<Member> = getAdmin; // ✅ covariance
// Logique : on attend « quelque chose qui produit un Member ».
// Recevoir « quelque chose qui produit un AdminMember » est plus précis → sûr.
```

Idem pour une propriété lue : `{ readonly value: T }` est covariant en `T`. `Promise<T>` est covariant (`T` sort via `.then`/`await`).

### 2.3 Position d'entrée → contravariance

Un consommateur de `T` reste utilisable là où on attend un consommateur d'un type plus **spécifique**. C'est le sens qui surprend.

```ts
type Consumer<T> = (x: T) => void;

const handleAnyMember: Consumer<Member> = (m) => console.log(m.name);
const handleAdmin: Consumer<AdminMember> = handleAnyMember; // ✅ contravariance
// Logique : on attend un handler qui saura traiter un AdminMember.
// Un handler qui gère TOUT Member sait forcément gérer un AdminMember (c'en est un).
// L'inverse serait faux : un handler qui lit .permissions ne survit pas à un Member nu.
```

C'est exactement le cas concret : `Handler<Member>` est assignable à `Handler<AdminMember>` (sûr), mais **pas** l'inverse.

### 2.4 Position d'entrée ET sortie → invariance

Dès que `T` est à la fois lu et écrit, les deux exigences se contredisent et rien n'est assignable.

```ts
interface Box<T> {
  value: T;           // sortie → covariant
  set(next: T): void; // entrée → contravariant
}
// Box<AdminMember> et Box<Member> : incompatibles dans les deux sens → INVARIANT
```

`Map<K, V>` est invariant (`get` sort `V`, `set` entre `V`). `Array<T>` **devrait** l'être (il a `push`/`[i] =` en entrée et `[i]`/`pop` en sortie)… mais TS le traite comme covariant. C'est le point suivant.

### 2.5 Variance des fonctions et `strictFunctionTypes`

Une signature `(arg: A) => R` compose deux variances :
- le **paramètre `A` est contravariant** ;
- le **retour `R` est covariant**.

```ts
type Fn<A, R> = (arg: A) => R;
// Fn est contravariant en A, covariant en R.

const f: Fn<Member, AdminMember> = (m) => ({ ...m, permissions: [] });
const g: Fn<AdminMember, Member> = f; // ✅ A élargi (contra), R rétréci (co)
```

Le flag **`strictFunctionTypes`** (inclus dans `strict: true`) est ce qui **active la contravariance stricte** des paramètres de fonction. Sans lui, les paramètres sont *bivariants* — plus permissif, mais unsound. C'est l'un des flags qui attrape le plus de bugs de callback silencieux.

```ts
// SANS strictFunctionTypes : bivariance des paramètres → ceci compilerait à tort
//   const bad: Consumer<Member> = handleAdmin; // handleAdmin lit .permissions !
//   bad({ id: "2", name: "Bob" }); // crash : permissions undefined
// AVEC strictFunctionTypes : rejeté à la compilation. C'est ce qu'on veut.
```

### 2.6 Le trou historique : la bivariance des méthodes

`strictFunctionTypes` ne s'applique **qu'aux propriétés de type fonction**, pas aux **méthodes** déclarées avec la syntaxe `méthode(x): void`. Les méthodes restent **bivariantes**, volontairement, pour compatibilité rétroactive (sinon `Array<T>`, `Promise<T>`, les handlers du DOM… casseraient partout).

```ts
interface PropStyle<T> {
  handle: (x: T) => void; // PROPRIÉTÉ fonction → contravariant (strict)
}
interface MethodStyle<T> {
  handle(x: T): void;     // MÉTHODE → BIVARIANT (trou assumé)
}

// MethodStyle<Member> accepte un handle(AdminMember) — unsound, mais toléré.
```

C'est *pourquoi* `arr.push` (une méthode) ne bloque pas les assignations dangereuses de tableaux.

### 2.7 Les zones *unsound* assumées de TypeScript

TS n'est **pas** un système *sound* : le compilateur dit parfois « OK » sur du code qui plantera. C'est un **choix de design** — soundness totale = ergonomie insupportable. Les cinq trous à connaître :

1. **Covariance des tableaux mutables** — `AdminMember[]` assignable à `Member[]`, puis `push` d'un `Member` nu corrompt le tableau.
2. **Assertions `as`** — tu mens au compilateur ; il te croit.
3. **Accès par index** — `Record<string, X>[k]` est typé `X` même si la clé n'existe pas (sauf `noUncheckedIndexedAccess`).
4. **`any`** — désactive tout contrôle, se propage silencieusement.
5. **Bivariance des méthodes** (§2.6).

```ts
// Trou n°1 — le plus courant, et l'origine du crash du §1
const admins: AdminMember[] = [{ id: "1", name: "Zoe", permissions: ["ban"] }];
const members: Member[] = admins;          // ✅ covariance des tableaux
members.push({ id: "2", name: "Bob" });    // ✅ compile… mais Bob n'a pas .permissions
admins[1].permissions.length;              // 💥 undefined au runtime
```

**Parade** : `readonly`. Un `readonly AdminMember[]` n'a pas de `push`/index-set, donc sa covariance devient *sûre*.

```ts
const safe: readonly Member[] = admins; // ✅ et sûr : aucune mutation possible
// safe.push(...) // ❌ n'existe pas sur readonly
```

### 2.8 Annotations de variance `in` / `out` (TS 4.7+)

Depuis TypeScript 4.7, on peut **annoter explicitement** la variance d'un paramètre de type. TS l'infère déjà tout seul ; l'annotation sert à (1) documenter l'intention, (2) **faire échouer la compilation si l'usage ne correspond pas**, (3) accélérer la vérification sur de gros graphes de types.

```ts
type Emitter<out T> = { next(): T };            // out = covariant (T en sortie)
type Sink<in T> = { push(x: T): void };         // in  = contravariant (T en entrée)
type Channel<in out T> = { next(): T; push(x: T): void }; // in out = invariant

// Le garde-fou : l'annotation est VÉRIFIÉE
// type Wrong<out T> = { push(x: T): void };
//   ^ Erreur TS2636 : Type 'Wrong<T>' is not assignable... 'T' is declared as
//     covariant (out) mais utilisé en position contravariante.
```

> `out` = **out**put = sortie = covariant. `in` = **in**put = entrée = contravariant. Le mnémotechnique est dans le mot.

---

## 3. Worked examples

### Exemple 1 — Auditer les trois assignations du cas concret

Reprenons `Member` / `AdminMember` et raisonnons *sans exécuter*, uniquement par position.

```ts
type Handler<T> = (payload: T) => void; // T en ENTRÉE → contravariant

// (a) Handler<Member> là où on attend Handler<AdminMember>
const logMember: Handler<Member> = (m) => console.log(m.name);
const asAdminHandler: Handler<AdminMember> = logMember;
//    ^ Attendu : contravariant. Member est le SUPER-type d'AdminMember.
//      Contravariance : Handler<Super> <: Handler<Sub>. Donc Handler<Member> <: Handler<AdminMember>.
//      => ASSIGNATION SÛRE. Quand le bus l'appelle avec un AdminMember,
//         logMember ne lit que .name, présent sur AdminMember. Aucun risque. ✅

// (b) Handler<AdminMember> là où on attend Handler<Member>
const notifyAdmins: Handler<AdminMember> = (a) => a.permissions.forEach(() => {});
// const asMemberHandler: Handler<Member> = notifyAdmins;
//    ^ Contravariance exige Handler<Super> <: Handler<Sub>. Ici on demande
//      Handler<Sub(AdminMember)> <: Handler<Super(Member)> : direction INTERDITE.
//      => Rejeté par strictFunctionTypes. Et heureusement : le bus l'appellerait
//         avec un Member nu, .permissions serait undefined → crash. ❌ (bien bloqué)

// (c) AdminMember[] là où on attend Member[]
const admins: AdminMember[] = [{ id: "1", name: "Zoe", permissions: [] }];
const asMembers: Member[] = admins;
//    ^ Tableau = covariant (trou de soundness). ACCEPTÉ.
//      MAIS asMembers.push({ id, name }) insère un Member nu dans `admins`.
//      => compile, plante au runtime. C'est le VRAI bug. On le neutralise en §4.
```

Verdict d'audit : (a) sûr et utile, (b) correctement bloqué, (c) accepté mais **unsound** — le seul des trois à surveiller.

### Exemple 2 — Rendre le bus d'événements sûr avec `in`/`out`

On veut un bus où l'on *émet* des événements (sortie) et où l'on *enregistre* des handlers (entrée), chacun annoté pour que TS refuse tout mésusage.

```ts
// Le type d'événement est produit par le bus → covariant → out
interface MemberEvent<out T extends Member> {
  readonly type: string;
  readonly payload: T;
}

// Un handler consomme un événement → contravariant → in
type EventHandler<in T extends Member> = (event: MemberEvent<T>) => void;

class EventBus<T extends Member> {
  private handlers: EventHandler<T>[] = [];

  // enregistrer un handler plus GÉNÉRAL est sûr (contravariance)
  subscribe(h: EventHandler<T>): void {
    this.handlers.push(h);
  }

  emit(event: MemberEvent<T>): void {
    // copie readonly : on empêche un handler de muter la liste des handlers
    for (const h of this.handlers) h(event);
  }
}

const adminBus = new EventBus<AdminMember>();

// ✅ handler générique Member : accepté (contravariance) et sûr
const audit: EventHandler<Member> = (e) => console.log("audit", e.payload.name);
adminBus.subscribe(audit);

// ❌ handler qui exige AdminMember, branché sur un bus qui pourrait émettre moins :
// const admins = new EventBus<Member>();
// admins.subscribe((e: MemberEvent<AdminMember>) => e.payload.permissions);
//   -> rejeté : EventHandler<AdminMember> n'est pas assignable à EventHandler<Member>.
```

Ce que les annotations apportent : si un jour quelqu'un ajoute une méthode `push(x: T)` dans `MemberEvent<out T>`, la compilation **échoue immédiatement** (TS2636) au lieu de laisser passer un `MemberEvent` devenu invariant.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que la contravariance est « à l'envers de la logique »

Beaucoup lisent « `Handler<Member>` marche là où on veut `Handler<AdminMember>` » comme un bug. C'est l'inverse : c'est **la seule direction sûre**.

```ts
// Intuition fausse : « AdminMember est plus précis, donc Handler<AdminMember> devrait passer partout »
// Réalité : un handler doit ACCEPTER ce qu'on lui donne. Plus il accepte large, plus il est réutilisable.
const generic: Handler<Member> = (m) => console.log(m.name);      // accepte tout Member
const specific: Handler<AdminMember> = (a) => a.permissions.pop(); // exige un admin
// generic peut remplacer specific (sûr). specific NE PEUT PAS remplacer generic (dangereux).
```

**Règle** : sur un paramètre, « accepter plus large » = « plus assignable ». Entrée = contravariant.

### PIÈGE #2 — Confondre propriété-fonction et méthode

Le même code change de sûreté selon la syntaxe. C'est le trou de la bivariance des méthodes.

```ts
interface WithProp { on: (x: Member) => void; } // contravariant strict
interface WithMethod { on(x: Member): void; }    // bivariant (toléré)

// Un on(x: AdminMember) est refusé sur WithProp, accepté sur WithMethod.
```

**Règle** : pour un vrai contrôle de variance sur un callback stocké, déclare-le en **propriété fonction** (`on: (x: T) => void`), pas en méthode.

### PIÈGE #3 — Faire confiance à un `Type[]` élargi

Assigner `AdminMember[]` à `Member[]` ne « convertit » rien : c'est le **même tableau**, deux vues. Muter par la vue élargie corrompt l'originale.

```ts
const admins: AdminMember[] = [{ id: "1", name: "Zoe", permissions: [] }];
const view: Member[] = admins;
view.push({ id: "2", name: "Bob" }); // compile
admins.forEach((a) => a.permissions.length); // 💥 sur Bob
```

**Règle** : dès qu'on passe un tableau « en lecture seule » à une frontière, type-le `readonly T[]` (ou `ReadonlyArray<T>`). La covariance redevient sûre et `push` disparaît de l'API.

### PIÈGE #4 — Prendre `in`/`out` pour de la config runtime

Les annotations de variance sont **purement statiques** : zéro impact sur le JS émis. Ce ne sont pas des modificateurs d'accès ni du readonly. Elles ne *forcent* pas la variance — elles **vérifient** que l'usage la respecte.

```ts
type C<out T> = { get(): T }; // n'émet rien, ne protège rien au runtime
// Si tu écris get(): T mais aussi set(x: T), l'annotation `out` casse la COMPILATION,
// elle n'empêche pas un `as any` de contourner au runtime.
```

**Règle** : `in`/`out` = documentation vérifiée + garde-fou de compilation, pas une garantie d'exécution.

### PIÈGE #5 — Croire que `strict: true` bouche tous les trous

`strict` active `strictFunctionTypes` (contravariance des paramètres) mais **ne** rend **pas** les tableaux invariants, ni les méthodes contravariantes, ni ne borne les index. Ces trous restent, par design.

```ts
// même avec strict:true, ceci compile :
const members: Member[] = admins;        // covariance tableau
const x: number = ({} as Record<string, number>)["absent"]; // index unsound
```

**Règle** : ajoute `noUncheckedIndexedAccess` pour le trou n°3, et `readonly` pour le trou n°1. `strict` ne les couvre pas.

---

## 5. Ancrage TribuZen

Le **bus d'événements de l'admin** (`src/core/event-bus.ts`) est l'endroit où la variance se joue en vrai. Quand un membre est promu, banni, ou change de famille, le bus diffuse un `MemberEvent` aux modules abonnés : journal d'audit, recalcul des badges, envoi d'e-mails.

- **Handlers contravariants** — le module audit s'abonne avec un `EventHandler<Member>` générique (il ne lit que `id` + `name`). Le module « permissions » veut un `EventHandler<AdminMember>`. Grâce à la contravariance, le handler audit est accepté sur le bus admin (sûr), mais un handler qui exige `.permissions` **ne peut pas** s'abonner à un bus de membres ordinaires — bloqué à la compilation. C'est exactement le bug du §1, désormais impossible.

- **Tableaux `readonly` aux frontières** — la liste des membres d'une famille (`Family.members`) est exposée en `readonly Member[]` aux composants d'affichage. Impossible d'y `push` un membre nu via une vue élargie : le trou n°1 est neutralisé là où des données réelles transitent.

- **Annotations `in`/`out` sur les types partagés** — `MemberEvent<out T>` et `EventHandler<in T>` sont annotés dans le fichier de types partagé. Si un contributeur ajoute par erreur une méthode qui met `T` en entrée sur `MemberEvent`, la CI TypeScript échoue (TS2636) avant la revue.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/
  core/
    event-bus.ts        // EventBus<T>, subscribe/emit
    events.ts           // MemberEvent<out T>, EventHandler<in T>
  domain/
    member.ts           // Member, AdminMember
  features/
    family/
      FamilyMembers.tsx  // reçoit readonly Member[]
```

---

## 6. Points clés

1. La variance décrit comment le sous-typage de `T` se propage à `F<T>` ; elle se lit à la **position** de `T` : sortie → covariant, entrée → contravariant, les deux → invariant.
2. Une fonction est **contravariante en son paramètre** et **covariante en son retour** ; « accepter plus large en entrée » = « plus assignable ».
3. `strictFunctionTypes` (dans `strict`) active la contravariance stricte des **propriétés fonction** ; sans lui, les paramètres sont bivariants (unsound).
4. Les **méthodes** (`m(x): void`) restent **bivariantes** volontairement — trou historique pour ne pas casser `Array`, `Promise`, le DOM.
5. Les **tableaux mutables sont covariants** (unsound) : `Sub[]` → `Super[]` compile, mais `push` corrompt l'original ; parade = `readonly T[]`.
6. Zones unsound assumées de TS : covariance des tableaux, `as`, accès par index, `any`, bivariance des méthodes — TS choisit la praticité sur la soundness totale.
7. `in`/`out` (TS 4.7+) annotent la variance ; purement statiques, ils **vérifient** l'usage et échouent (TS2636) si `T` sort de la position déclarée.

---

## 7. Seeds Anki

```
Comment lit-on la variance d'un paramètre de type T dans F<T> ?|À sa position : T en sortie (lecture, retour, produit) → covariant ; T en entrée (paramètre, écriture, consommé) → contravariant ; T dans les deux → invariant.
Une fonction (arg: A) => R : quelle variance en A et en R ?|Contravariante en A (paramètre = entrée), covariante en R (retour = sortie). Donc élargir l'entrée et rétrécir le retour préserve l'assignabilité.
Handler<T> = (x: T) => void : Handler<Member> est-il assignable à Handler<AdminMember> (AdminMember <: Member) ?|Oui. Contravariance : Handler<Super> <: Handler<Sub>. Un handler qui gère tout Member gère forcément un AdminMember. L'inverse est rejeté (dangereux).
Que fait précisément le flag strictFunctionTypes ?|Il rend les paramètres des propriétés fonction contravariants (vérification stricte). Sans lui ils sont bivariants (permissif, unsound). Inclus dans strict:true. Ne s'applique PAS aux méthodes.
Pourquoi les méthodes (m(x): void) restent-elles bivariantes même en strict ?|Choix de compatibilité rétroactive : les rendre contravariantes casserait Array<T>, Promise<T>, les handlers du DOM. C'est un trou de soundness assumé.
Pourquoi Sub[] assignable à Super[] est-il unsound, et comment le neutraliser ?|Les tableaux mutables sont traités covariants ; via la vue Super[] on peut push un Super nu qui corrompt le tableau Sub original (crash au runtime). Parade : typer readonly T[] (plus de push/index-set).
Cite trois zones unsound assumées de TypeScript.|Covariance des tableaux mutables, assertions as, accès par index (Record[k] typé même si absent), any, bivariance des méthodes. TS privilégie la praticité sur la soundness totale.
À quoi servent les annotations in / out (TS 4.7) et que se passe-t-il si l'usage ne correspond pas ?|out = covariant (T en sortie), in = contravariant (T en entrée), in out = invariant. Purement statiques : elles documentent et VÉRIFIENT la variance ; si T apparaît dans une position contraire, erreur de compilation TS2636.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-15-variance/README.md`. Auditer les assignations de `Handler` et de tableaux du bus TribuZen, corriger le trou de covariance avec `readonly`, et annoter `in`/`out` sur les types d'événements — corrigé complet inclus.
