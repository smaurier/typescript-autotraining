# Lab 12 — Mapped types et template literal types

> **Outcome :** à la fin, tu sais reconstruire `Partial`/`Readonly` à la main, puis dériver `Nullable`, `Getters` et des noms d'événements depuis une forme du domaine TribuZen, sans jamais recopier de champs.
> **Vrai outil :** le compilateur TypeScript (`tsc --noEmit`) — le type-checker EST le test. Pas de harnais simulé, pas de test-runner auto-correcteur.
> **Feedback :** le coach valide en session. Le seul juge intermédiaire est `tsc` : aucune erreur = les types sont corrects.

## Énoncé

On part de la forme métier `MemberBase` (déjà définie dans `tribuzen/types`). Tu vas produire, **par dérivation uniquement**, quatre types utilitaires et vérifier leur exactitude avec des lignes d'assertion au niveau des types (pas de tests d'exécution).

Forme de départ (rappel — ne la recopie pas, importe-la) :

```ts
// tribuzen/types/index.ts (extrait)
export type MemberRole = "admin" | "parent" | "enfant";

export interface MemberBase {
  readonly id: string;
  readonly familyId: string;
  displayName: string;
  role: MemberRole;
  email?: string;      // optionnel
  avatarUrl?: string;  // optionnel
  joinedAt: Date;
}
```

Starter minimal (crée `exercise.ts` avec ce contenu, puis remplace chaque `// TODO`) :

```ts
import type { MemberBase } from "@/types";

// Assertion de type au niveau compilation : Expect<Equal<A, B>>.
// Si A ≠ B, la ligne Expect<...> provoque une erreur tsc. C'est notre "test".
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// TODO 1 — PartialMaison<T> : chaque clé optionnelle (réimplémente Partial)
// TODO 2 — ReadonlyMaison<T> : chaque clé en lecture seule (réimplémente Readonly)
// TODO 3 — Nullable<T> : chaque valeur devient `T[K] | null`
// TODO 4 — Getters<T> : chaque clé K devient `get{Capitalize<K>}: () => T[K]`
// TODO 5 — MemberEventName : "onJoin" | "onLeave" | "onRoleChange"
//          à partir de type MemberEvent = "join" | "leave" | "roleChange"
```

## Étapes (en friction)

1. Écris `PartialMaison<T>` et `ReadonlyMaison<T>` de mémoire, **sans** regarder le module. Vérifie avec :
   ```ts
   type _P = Expect<Equal<PartialMaison<{ a: number }>, { a?: number }>>;
   type _R = Expect<Equal<ReadonlyMaison<{ a: number }>, { readonly a: number }>>;
   ```
2. Écris `Nullable<T>` et applique-le : `type MemberDraft = Nullable<MemberBase>`.
3. Écris `Getters<T>` avec `as` + `Capitalize`. Bute volontairement une fois sur `Capitalize<K>` sans `string &` pour voir l'erreur, puis corrige.
4. Déclare `MemberEvent` et dérive `MemberEventName` avec un template literal.
5. Lance `npx tsc --noEmit exercise.ts`. Objectif : **zéro erreur**. Chaque `Expect<...>` qui compile prouve un type correct.

## Corrigé complet commenté

```ts
import type { MemberBase } from "@/types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// ── TODO 1 — Partial réimplémenté ────────────────────────────────────
// Le ? après [K in keyof T] AJOUTE le modificateur optionnel à chaque clé.
type PartialMaison<T> = { [K in keyof T]?: T[K] };

// ── TODO 2 — Readonly réimplémenté ───────────────────────────────────
// readonly devant [K in keyof T] rend chaque propriété en lecture seule.
type ReadonlyMaison<T> = { readonly [K in keyof T]: T[K] };

// ── TODO 3 — Nullable ────────────────────────────────────────────────
// On ne touche ni aux clés ni aux modificateurs : on élargit la valeur.
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Application domaine : état d'édition, jamais recopié depuis MemberBase.
type MemberDraft = Nullable<MemberBase>;

// ── TODO 4 — Getters ─────────────────────────────────────────────────
// as remappe la clé ; `string & K` garde la part string (Capitalize l'exige).
// PIÈGE homomorphe : un mapped type qui itère `[K in keyof T]` — MÊME avec un
// remapping `as` — reste HOMOMORPHE et PRÉSERVE les modificateurs de T. Sans
// neutralisation, `getEmail` hériterait du `?` de `email?` (→ optionnel) et
// `getId`/`getFamilyId` du `readonly` de `id`/`familyId`. On les retire avec
// `-readonly` (préfixe) et `-?` (suffixe) pour des getters uniformes.
type Getters<T> = {
  -readonly [K in keyof T as `get${Capitalize<string & K>}`]-?: () => T[K];
};

type MemberGetters = Getters<MemberBase>;

// ── TODO 5 — Noms d'événements ───────────────────────────────────────
type MemberEvent = "join" | "leave" | "roleChange";
// Le template literal + Capitalize se distribuent sur l'union de littéraux.
type MemberEventName = `on${Capitalize<MemberEvent>}`;

// ── Assertions de type (nos "tests", vérifiés par tsc) ────────────────
type _P = Expect<Equal<PartialMaison<{ a: number }>, { a?: number }>>;
type _R = Expect<Equal<ReadonlyMaison<{ a: number }>, { readonly a: number }>>;
type _N = Expect<Equal<MemberDraft["displayName"], string | null>>;
type _NRole = Expect<Equal<MemberDraft["role"], MemberBase["role"] | null>>;
type _G = Expect<Equal<MemberGetters["getDisplayName"], () => string>>;
// email est optionnel dans MemberBase → sa valeur inclut undefined
type _GEmail = Expect<Equal<MemberGetters["getEmail"], () => string | undefined>>;
type _E = Expect<Equal<MemberEventName, "onJoin" | "onLeave" | "onRoleChange">>;
```

> **Pourquoi pas de `console.log` ?** Ces types n'existent qu'à la compilation : ils sont effacés à l'exécution. Le seul feedback pertinent est celui de `tsc`. Une ligne `Expect<...>` qui compile = assertion satisfaite ; sinon `tsc` pointe la ligne fautive.

## Variante J+30 (fading)

Refais le lab **de mémoire, en 20 minutes**, avec deux contraintes ajoutées :

1. Ajoute `Setters<T>` : `set{Capitalize<K>}: (v: T[K]) => void`, mais **uniquement pour les clés non-`readonly`** (`id` et `familyId` doivent être exclus). Indice : combine un test `readonly` maison avec le remapping vers `never`.
2. Ajoute `MemberEventHandlers` = un objet dont les clés sont `MemberEventName` et chaque valeur `(memberId: string) => void`, dérivé directement de `MemberEvent` (pas de recopie des trois noms).

Vérifie encore avec `tsc --noEmit` et des `Expect<...>`. Aucune erreur = réussi.

## Application TribuZen

Porte ces types dans le vrai produit `smaurier/tribuzen` :

- `tribuzen/src/types/drafts.ts` : exporte `Nullable<T>`, puis `MemberDraft` et `FamilyDraft` dérivés — l'écran d'édition consomme ces types.
- `tribuzen/src/types/accessors.ts` : exporte `Getters<T>` et `MemberGetters` pour la couche présentation en lecture seule.
- `tribuzen/src/types/member.ts` : ajoute `MemberEvent`, `MemberEventName` et `MemberEventHandlers` ; branche-les sur le bus d'événements de la famille.

Commit suggéré sur `smaurier/tribuzen` : `feat(types): dérive drafts, getters et events membre via mapped + template literal`.
