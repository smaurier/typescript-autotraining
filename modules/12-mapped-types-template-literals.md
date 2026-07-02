---
titre: Mapped types et template literal types
cours: 00-typescript
notions: [mapped type, modificateurs readonly et optionnel, plus et moins devant les modificateurs, key remapping avec as, filtrage de clés via never, template literal types, intrinsic string types Uppercase Lowercase Capitalize Uncapitalize, combiner mapped template et conditional, reconstruire Partial et Readonly]
outcomes: [écrire un mapped type qui transforme valeurs et modificateurs, renommer et filtrer des clés avec as, construire des noms de types avec les template literal types, combiner mapped conditional et template pour générer une API typée]
prerequis: [11-conditional-types]
next: 13-types-recursifs-type-programming
libs: [{ name: typescript, version: "^5" }]
tribuzen: types dérivés du domaine (Getters, Nullable, noms d'événements membre) dans tribuzen/types
last-reviewed: 2026-07
---

# Mapped types et template literal types

> **Outcomes — tu sauras FAIRE :** écrire un mapped type qui transforme valeurs et modificateurs, renommer et filtrer des clés avec `as`, construire des noms de types avec les template literal types, combiner mapped + conditional + template pour générer une API typée.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu attaques la couche formulaires de TribuZen. Un collègue veut un état d'édition de membre où **chaque champ peut être `null`** tant qu'il n'est pas rempli, plus un objet de **getters** (`getDisplayName`, `getEmail`) pour l'affichage. Il l'a écrit à la main :

```ts
import type { MemberBase } from "@/types";

// ❌ Recopié champ par champ depuis MemberBase — se désynchronise au moindre ajout
interface MemberDraft {
  id: string | null;
  familyId: string | null;
  displayName: string | null;
  role: "admin" | "parent" | "enfant" | null;
  email: string | null;
  avatarUrl: string | null;
  joinedAt: Date | null;
}

interface MemberGetters {
  getId: () => string;
  getFamilyId: () => string;
  getDisplayName: () => string;
  getRole: () => "admin" | "parent" | "enfant";
  getEmail: () => string | undefined;
  getAvatarUrl: () => string | undefined;
  getJoinedAt: () => Date;
}
```

**Trois problèmes immédiats :**
1. `MemberDraft` recopie `MemberBase`. Le jour où on ajoute `phone` à `MemberBase`, `MemberDraft` ne le sait pas — le type ment.
2. `MemberGetters` a fallu retaper chaque nom capitalisé à la main (`getDisplayName`…) — source d'erreurs.
3. Aucun lien entre ces types et `MemberBase` : rien ne garantit qu'ils restent alignés.

Ce module te donne les outils pour **dériver** ces deux types de `MemberBase` en une ligne chacun, et rester synchronisé automatiquement.

---

## 2. Théorie complète, concise

### 2.1 Le mapped type : une boucle sur les clés

Un mapped type parcourt les clés d'un type objet et produit une nouvelle propriété pour chacune. La lecture des trois morceaux :

- `keyof T` = l'union de toutes les clés de `T`
- `K in keyof T` = « pour chaque clé `K` »
- `T[K]` = le type de la valeur associée à `K` (indexed access)

```ts
// Identity : reproduit T à l'identique. La brique de base.
type Identique<T> = {
  [K in keyof T]: T[K];
};
```

À partir de cette boucle, on peut changer **trois choses indépendantes** : la valeur (`T[K]`), les modificateurs (`readonly`, `?`), et le nom de la clé (via `as`, section 2.4).

### 2.2 Transformer la valeur

Les clés restent identiques ; seul le type de la valeur change.

```ts
interface Membre {
  nom: string;
  age: number;
  actif: boolean;
}

// Envelopper chaque valeur dans une Promise
type EnPromise<T> = { [K in keyof T]: Promise<T[K]> };
// { nom: Promise<string>; age: Promise<number>; actif: Promise<boolean> }

// Rendre chaque valeur nullable — le cœur de MemberDraft
type Nullable<T> = { [K in keyof T]: T[K] | null };
// { nom: string | null; age: number | null; actif: boolean | null }
```

### 2.3 Les modificateurs : readonly et optionnel

On peut **ajouter** ou **retirer** `readonly` et `?`. `+` ajoute (comportement par défaut, souvent implicite), `-` retire.

```ts
// Ajouter readonly à tout → c'est l'implémentation exacte de Readonly<T>
type ReadonlyMaison<T> = { readonly [K in keyof T]: T[K] };

// Ajouter ? à tout → c'est l'implémentation exacte de Partial<T>
type PartialMaison<T> = { [K in keyof T]?: T[K] };

// Retirer readonly (rendre mutable)
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Retirer ? (rendre obligatoire) → c'est Required<T>
type RequiredMaison<T> = { [K in keyof T]-?: T[K] };

// Combiner : ajout explicite avec +, équivalent readonly + optionnel
type Gelee<T> = { +readonly [K in keyof T]+?: T[K] };
```

> `+readonly` et `+?` sont rarement écrits car c'est le défaut. Le `-` est ce qui compte en pratique : c'est le seul moyen d'enlever un modificateur hérité.

### 2.4 Key remapping avec `as`

Depuis TypeScript 4.1, la clause `as` **renomme** la clé produite. La forme est `[K in keyof T as NouvelleClé]`. C'est là que les template literal types (section 2.6) entrent en jeu pour fabriquer le nouveau nom.

```ts
// Préfixer chaque clé avec "get" et la capitaliser
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Personne { nom: string; age: number }
type PersonneGetters = Getters<Personne>;
// { getNom: () => string; getAge: () => number }
```

Le `string & K` est nécessaire : `keyof T` peut inclure `string | number | symbol`, or `Capitalize` n'accepte que des `string`. L'intersection `string & K` réduit `K` à sa part string.

### 2.5 Filtrer des clés en remappant vers `never`

Si la clause `as` produit `never`, la propriété **disparaît**. Combiné à un conditional type, c'est un filtre de clés.

```ts
// Ne garder que les propriétés dont la valeur est une string
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

interface Mixte { nom: string; age: number; ville: string }
type SeulementStrings = PickByType<Mixte, string>;
// { nom: string; ville: string }

// Exclure les clés qui commencent par un underscore
type SansPrives<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};
```

> **À retenir :** avec `as`, une clé peut être renommée **ou** supprimée (`never`). C'est le seul mécanisme de filtrage de clés au niveau des mapped types.

### 2.6 Template literal types

Même syntaxe que les template strings JS, mais au niveau des types. On concatène des types string.

```ts
type Salutation = `Bonjour ${string}`;
const ok: Salutation = "Bonjour Alice";     // OK
// const ko: Salutation = "Au revoir";       // Erreur

// Distribution sur les unions → produit litéral cartésien
type Couleur = "rouge" | "bleu";
type Etat = "actif" | "inactif";
type Classe = `${Couleur}-${Etat}`;
// "rouge-actif" | "rouge-inactif" | "bleu-actif" | "bleu-inactif"
```

### 2.7 Intrinsic string types

TypeScript fournit quatre transformateurs de string au niveau des types, distribués sur les unions :

```ts
type A = Uppercase<"join">;      // "JOIN"
type B = Lowercase<"JOIN">;      // "join"
type C = Capitalize<"join">;     // "Join"
type D = Uncapitalize<"Join">;   // "join"

type Events = "join" | "leave";
type OnEvents = `on${Capitalize<Events>}`;   // "onJoin" | "onLeave"
```

### 2.8 Combiner mapped + template + conditional

La puissance réelle : un mapped type qui remappe les clés via un template literal, en filtrant via un conditional. Exemple — générer des handlers `on…Change` uniquement pour les champs (pas les méthodes) :

```ts
type ChangeHandlers<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : `on${Capitalize<string & K>}Change`]: (nouvelle: T[K]) => void;
};
```

C'est exactement le pattern qu'on appliquera à TribuZen en section 5.

---

## 3. Worked examples

### Exemple 1 — Reconstruire Partial et Readonly, puis résoudre le cas concret

On répare le cas d'ouverture en **dérivant** `MemberDraft` et `MemberGetters` de `MemberBase`.

```ts
import type { MemberBase } from "@/types";

// ─── Briques maison (pour comprendre les utilitaires natifs) ─────────
// Partial<T> réécrit : chaque clé devient optionnelle.
type PartialMaison<T> = { [K in keyof T]?: T[K] };
// Readonly<T> réécrit : chaque clé devient en lecture seule.
type ReadonlyMaison<T> = { readonly [K in keyof T]: T[K] };

// ─── 1. MemberDraft dérivé, jamais recopié ───────────────────────────
type Nullable<T> = { [K in keyof T]: T[K] | null };

type MemberDraft = Nullable<MemberBase>;
// Chaque champ de MemberBase devient `... | null`.
// Ajoute `phone` à MemberBase → MemberDraft.phone: string | null apparaît seul.

// ─── 2. MemberGetters dérivé via as + Capitalize ─────────────────────
type Getters<T> = {
  // `string & K` : garde seulement la part string de la clé,
  // requis car Capitalize<> n'accepte pas number | symbol.
  // `-readonly` + `-?` : un mapped type qui itère `[K in keyof T]` reste
  // HOMOMORPHE même avec un remapping `as`, donc il PRÉSERVE les modificateurs
  // de T. Sans neutralisation, `getId`/`getFamilyId` seraient `readonly` (hérité
  // de `id`/`familyId`) et `getEmail`/`getAvatarUrl` optionnels (hérité du `?`).
  // On les retire pour des getters uniformes et obligatoires.
  -readonly [K in keyof T as `get${Capitalize<string & K>}`]-?: () => T[K];
};

type MemberGetters = Getters<MemberBase>;
// {
//   getId: () => string;
//   getFamilyId: () => string;
//   getDisplayName: () => string;
//   getRole: () => MemberRole;
//   getEmail: () => string | undefined;   // email était optionnel → T[K] inclut undefined,
//                                          // mais la propriété getEmail est requise (grâce à -?)
//   getAvatarUrl: () => string | undefined;
//   getJoinedAt: () => Date;
// }
```

**Ce que ça apporte :** une seule source de vérité (`MemberBase`). Les deux types dérivés se mettent à jour tout seuls. Zéro recopie, zéro désynchronisation.

### Exemple 2 — Filtrer les clés puis générer des event handlers (fading)

On veut, à partir d'un état de formulaire, générer **un handler par champ éditable**, en excluant les identifiants `readonly`. On combine remapping, template literal et conditional.

```ts
// Garde uniquement les clés dont la valeur n'est pas une fonction,
// et remappe chacune en `on…Change`.
type FieldChangeHandlers<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : `on${Capitalize<string & K>}Change`]: (
    ancienne: T[K],
    nouvelle: T[K],
  ) => void;
};

interface EtatFormulaire {
  nom: string;
  email: string;
  age: number;
  valider(): boolean; // méthode → doit être exclue
}

type FormHandlers = FieldChangeHandlers<EtatFormulaire>;
// {
//   onNomChange: (ancienne: string, nouvelle: string) => void;
//   onEmailChange: (ancienne: string, nouvelle: string) => void;
//   onAgeChange: (ancienne: number, nouvelle: number) => void;
//   // valider est absent : Function → never → clé supprimée
// }
```

Étapes de lecture, dans l'ordre où TypeScript les évalue :
1. `K in keyof T` : boucle sur `nom | email | age | valider`.
2. `T[K] extends Function ? never : …` : `valider` part vers `never`.
3. Sinon on construit le nom : `` `on${Capitalize<string & K>}Change` `` → `onNomChange`, etc.
4. La valeur devient `(ancienne, nouvelle) => void` typée avec `T[K]`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `Capitalize<K>` directement, sans `string & K`

```ts
// ❌ K peut être string | number | symbol ; Capitalize n'accepte que string
type Getters<T> = { [K in keyof T as `get${Capitalize<K>}`]: () => T[K] };
//                                              ~ Erreur : K non assignable à string

// ✅ On intersecte avec string pour ne garder que la part string
type GettersOk<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
```

**Pourquoi :** `keyof` d'un objet inclut potentiellement `number` (index numériques) et `symbol`. `string & K` élimine ces cas ; les clés non-string sont alors ignorées du résultat.

### PIÈGE #2 — Confondre `-?` (retirer optionnel) et `?` (ajouter)

```ts
interface Prefs { theme?: string; langue?: string }

// ? AJOUTE l'optionnel (ici déjà optionnel → sans effet visible)
type EncoreOptionnel = { [K in keyof Prefs]?: Prefs[K] };

// -? RETIRE l'optionnel → rend obligatoire (et retire aussi `| undefined`)
type Obligatoire = { [K in keyof Prefs]-?: Prefs[K] };
// { theme: string; langue: string }
```

**Signal :** si tu veux « forcer tous les champs remplis », c'est `-?`, pas `?`. Le `?` seul ne peut qu'ajouter.

### PIÈGE #3 — Croire que `as never` filtre les valeurs

```ts
// as agit sur la CLÉ, pas sur la valeur.
// never en position de clé supprime la propriété ; en position de valeur, non.
type A<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] }; // filtre les clés ✅
type B<T> = { [K in keyof T]: T[K] extends string ? T[K] : never };      // garde la clé, valeur = never ❌
```

Dans `B`, toutes les clés restent ; les non-strings prennent juste la valeur `never` (inhabitable). Pour **supprimer** une clé, le `never` doit être dans le `as`.

### PIÈGE #4 — Template literal sur un type `string` large

```ts
type Prefixe<T extends string> = `on${T}`;
type X = Prefixe<string>;   // `on${string}` — pas une union finie, juste un pattern
type Y = Prefixe<"click" | "hover">; // "onclick" | "onhover" — union finie
```

**Pourquoi :** un template literal ne « déplie » en union que si l'entrée est une **union de littéraux**. Sur le type `string` large, il reste un motif ouvert. C'est voulu, mais surprend quand on attendait une énumération.

---

## 5. Ancrage TribuZen

Ces transformations dérivent des types utilitaires depuis les formes du domaine, dans `tribuzen/types`. Le principe : **ne jamais recopier une forme**, la dériver.

**`Nullable<T>`** — état d'édition. `type MemberDraft = Nullable<MemberBase>` sert l'écran de création/édition de membre où chaque champ vaut `null` tant que non saisi. Idem `type FamilyDraft = Nullable<Family>`.

**`Getters<T>`** — accès en lecture pour l'affichage. `Getters<MemberBase>` produit `getDisplayName`, `getEmail`, `getRole`… via `` `get${Capitalize<string & K>}` ``. Utilisé par la couche présentation qui n'expose que des lectures.

**Noms d'événements membre** — le bus d'événements de la famille émet `onJoin`, `onLeave`, `onRoleChange`. On les type depuis une union `MemberEvent`, garantissant qu'aucun nom hors nomenclature ne circule :

```ts
// tribuzen/types (extrait cible)
export type MemberEvent = "join" | "leave" | "roleChange";

// Noms d'événements typés : "onJoin" | "onLeave" | "onRoleChange"
export type MemberEventName = `on${Capitalize<MemberEvent>}`;

// Map handler par événement, payload typé sur le membre concerné
export type MemberEventHandlers = {
  [E in MemberEvent as `on${Capitalize<E>}`]: (memberId: string) => void;
};
```

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/types/
  member.ts        # MemberBase, MemberEvent, MemberEventName
  drafts.ts        # Nullable, MemberDraft, FamilyDraft
  accessors.ts     # Getters, MemberGetters
```

---

## 6. Points clés

1. Un mapped type `{ [K in keyof T]: … }` est une boucle sur les clés ; on peut transformer valeur, modificateurs et nom indépendamment.
2. Les modificateurs se pilotent avec `readonly`/`?` (ajout) et `-readonly`/`-?` (retrait) ; `+` est l'ajout explicite, rarement écrit.
3. `Partial` = `{ [K in keyof T]?: T[K] }`, `Readonly` = `{ readonly [K in keyof T]: T[K] }`, `Required` = `-?` — tous des mapped types.
4. `as` renomme une clé ; produire `never` via `as` **supprime** la propriété (filtrage de clés).
5. Les template literal types concatènent des string au niveau des types et se distribuent sur les unions de littéraux.
6. `Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize` transforment les string-types ; combinés à `as`, ils fabriquent des noms comme `getEmail` ou `onJoin`.
7. Toujours écrire `Capitalize<string & K>` dans un remapping : `keyof T` n'est pas garanti `string`.

---

## 7. Seeds Anki

```
Comment lit-on les trois morceaux d'un mapped type { [K in keyof T]: T[K] } ?|keyof T = union des clés de T ; K in keyof T = pour chaque clé K ; T[K] = type de la valeur associée (indexed access). C'est une boucle sur les propriétés.
Quelle est l'implémentation maison de Partial<T> et de Readonly<T> ?|Partial<T> = { [K in keyof T]?: T[K] } (ajoute ?). Readonly<T> = { readonly [K in keyof T]: T[K] } (ajoute readonly). Ce sont des mapped types de base.
À quoi servent les modificateurs -readonly et -? dans un mapped type ?|Ils RETIRENT un modificateur hérité : -readonly rend mutable, -? rend obligatoire (implémentation de Required). Le - est le seul moyen d'enlever readonly ou l'optionnel.
Comment renomme-t-on une clé dans un mapped type, et comment en supprime-t-on une ?|Avec la clause as : [K in keyof T as NouvelleClé]. Si le nom produit est never, la propriété est supprimée — c'est le mécanisme de filtrage de clés.
Pourquoi écrit-on Capitalize<string & K> plutôt que Capitalize<K> dans un remapping ?|keyof T peut valoir string | number | symbol, or Capitalize n'accepte que des string. string & K réduit K à sa part string ; les clés non-string sont ignorées.
Que produit `on${Capitalize<"join" | "leave">}` ?|"onJoin" | "onLeave". Les intrinsic string types (Capitalize) et les template literals se distribuent sur les unions de littéraux.
Comment générer, depuis un type T, des handlers on…Change uniquement pour les champs non-méthodes ?|Mapped + conditional + template : { [K in keyof T as T[K] extends Function ? never : `on${Capitalize<string & K>}Change`]: (v: T[K]) => void }. Le never filtre les méthodes.
Un template literal type sur le type string large déplie-t-il une union ?|Non. `on${string}` reste un motif ouvert. Le dépliage en union finie n'a lieu que sur une union de littéraux, ex. "click" | "hover" → "onclick" | "onhover".
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-12-mapped-template/README.md`. Reconstruire `Partial`/`Readonly` maison, puis dériver `Nullable`, `Getters` et les noms d'événements membre depuis `MemberBase` — corrigé complet inline, variante J+30, application TribuZen.
