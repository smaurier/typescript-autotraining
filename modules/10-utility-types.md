---
titre: Utility types intégrés
cours: 00-typescript
notions: [Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, NonNullable, ReturnType, Parameters, Awaited, InstanceType, dériver un type plutôt que le dupliquer, composer plusieurs utility types]
outcomes: [dériver un type depuis un type source au lieu de le redéclarer, choisir le bon utility type pour un besoin, composer plusieurs utility types en une transformation]
prerequis: [09-modules-et-resolution]
next: 11-conditional-types
libs: [{ name: typescript, version: "^5" }]
tribuzen: types dérivés du domaine (CreateMemberDto, MemberUpdate, MemberSummary, table de permissions par rôle) construits depuis tribuzen/types
last-reviewed: 2026-07
---

# Utility types intégrés

> **Outcomes — tu sauras FAIRE :** dériver un type depuis un type source au lieu de le redéclarer, choisir le bon utility type pour un besoin donné, composer plusieurs utility types en une seule transformation.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu branches le formulaire d'ajout de membre de l'admin TribuZen. La source de vérité existe déjà, posée au module 00 dans `tribuzen/types` :

```typescript
// tribuzen/types/index.ts — source unique du domaine
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string; // ISO 8601, posé par le serveur
}
```

Un collègue a écrit trois types à la main pour le front, le formulaire de création et la vue liste :

```typescript
// ❌ AVANT — trois types recopiés à la main
interface CreateMemberDto {
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
}

interface MemberUpdate {
  familyId?: string;
  name?: string;
  role?: "admin" | "parent" | "enfant";
}

interface MemberSummary {
  id: string;
  name: string;
}
```

**Trois problèmes immédiats :**
1. Le jour où `Member` gagne un champ `avatarUrl`, ces trois types ne bougent pas → divergence silencieuse entre le formulaire et le vrai modèle.
2. L'union `"admin" | "parent" | "enfant"` est recopiée deux fois. Ajouter un rôle `"guest"` oblige à corriger trois endroits.
3. Rien ne garantit que `CreateMemberDto` retire bien `id` et `createdAt` — un humain a décidé, à la main, ce que la BDD génère.

Ce module remplace ces recopies par des **dérivations** : un seul type source, des variantes calculées automatiquement.

---

## 2. Théorie complète, concise

### 2.1 L'idée directrice — dériver, ne pas dupliquer

Un utility type est un type générique fourni par TypeScript qui **transforme un type existant** en un autre. Le principe DRY, appliqué au niveau des types : au lieu de réécrire une variante d'un type, tu la calcules depuis la source. Quand la source change, toutes les variantes suivent.

```typescript
import type { Member } from "@/types";

// Une seule source. Toute variante en découle.
type CreateMemberDto = Omit<Member, "id" | "createdAt">;
type MemberUpdate = Partial<CreateMemberDto>;
type MemberSummary = Pick<Member, "id" | "name">;
```

Ces trois lignes remplacent les trois interfaces recopiées du cas concret — et restent correctes automatiquement si `Member` évolue.

### 2.2 Transformer les clés d'un objet — Partial, Required, Readonly

Ces trois-là parcourent **toutes les clés** d'un type objet et changent leur modificateur.

```typescript
type Partial<T>  = { [P in keyof T]?: T[P] };   // toutes optionnelles
type Required<T> = { [P in keyof T]-?: T[P] };  // toutes obligatoires (-? retire le ?)
type Readonly<T> = { readonly [P in keyof T]: T[P] }; // toutes en lecture seule
```

`[P in keyof T]` est un **mapped type** : « pour chaque clé `P` de `T` ». C'est exactement le mécanisme que détaille le module 12 — ici, retiens juste que ces utility types itèrent sur les clés.

```typescript
interface Member { id: string; name: string; role: string; createdAt: string; }

type MemberDraft   = Partial<Member>;   // { id?: string; name?: string; ... }
type MemberStrict  = Required<Member>;  // tout obligatoire
type MemberFrozen  = Readonly<Member>;  // aucune réassignation possible
```

> `Readonly` est **superficiel** : il fige les clés de premier niveau, pas leur contenu profond (un tableau reste `push`-able). Vu au module 03, rappelé au piège #3.

### 2.3 Sélectionner ou retirer des clés — Pick et Omit

`Pick` garde une liste de clés ; `Omit` retire une liste de clés. Pour `Pick`, `K` est contraint aux clés existantes, donc une faute de frappe est une erreur de compilation.

```typescript
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

Note que `Omit` est **lui-même dérivé** de `Pick` + `Exclude` : les utility types se construisent les uns sur les autres.

```typescript
type MemberSummary   = Pick<Member, "id" | "name">;        // garde 2 clés
type CreateMemberDto = Omit<Member, "id" | "createdAt">;    // retire 2 clés
```

**Pick ou Omit ?** Choisis la liste la plus courte à écrire :

| Situation | Utilise |
|---|---|
| Type large, tu veux **peu** de clés | `Pick` |
| Type large, tu veux **presque tout** sauf 1-2 clés | `Omit` |

### 2.4 Construire un dictionnaire — Record

`Record<K, V>` fabrique un type objet dont les clés sont l'union `K` et les valeurs le type `V`. Utile pour les tables de correspondance.

```typescript
type Record<K extends keyof any, V> = { [P in K]: V };
```

Le gain fort : si `K` est une **union fermée**, TypeScript **exige toutes les clés** — impossible d'en oublier une.

```typescript
type MemberRole = Member["role"]; // "admin" | "parent" | "enfant" — dérivé, pas recopié
type Permission = "read" | "write" | "invite" | "delete";

// Chaque rôle DOIT avoir sa liste — oublier "enfant" ne compile pas
const PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin:  ["read", "write", "invite", "delete"],
  parent: ["read", "write", "invite"],
  enfant: ["read"],
};
```

`Member["role"]` est un **indexed access type** : on lit le type d'une propriété. On dérive ainsi l'union des rôles depuis la source au lieu de la retaper.

### 2.5 Filtrer une union — Exclude et Extract

Ces deux-là ne travaillent **pas sur les clés d'un objet** mais sur les **membres d'une union**. C'est la confusion n°1 (piège #1).

```typescript
type Exclude<T, U> = T extends U ? never : T; // retire de T ce qui est dans U
type Extract<T, U> = T extends U ? T : never; // garde de T ce qui est dans U
```

Ce sont des **conditional types distributifs** : TypeScript teste chaque membre de l'union séparément, puis recompose. C'est le cœur du module 11.

```typescript
type MemberRole = "admin" | "parent" | "enfant";

type ManagerRole = Exclude<MemberRole, "enfant">;          // "admin" | "parent"
type EnfantOnly   = Extract<MemberRole, "enfant" | "guest">; // "enfant"
```

Décomposition mentale de `Exclude<"admin" | "parent" | "enfant", "enfant">` :
`("admin" extends "enfant" ? never : "admin") | (... "parent" ...) | ("enfant" extends "enfant" ? never : "enfant")`
= `"admin" | "parent" | never` = `"admin" | "parent"`.

### 2.6 Nettoyer null/undefined — NonNullable

`NonNullable<T>` retire `null` et `undefined` d'une union. C'est un cas particulier d'`Exclude`.

```typescript
type NonNullable<T> = T & {};
// équivalent conceptuel : Exclude<T, null | undefined>
```

```typescript
type MaybeName = string | null | undefined;
type SureName = NonNullable<MaybeName>; // string

// Dériver le type d'une propriété nullable rendue certaine après un garde
type Members = Member[] | null;
type PresentMembers = NonNullable<Members>; // Member[]
```

### 2.7 Inspecter fonctions et classes — Parameters, ReturnType, Awaited, InstanceType

Ce groupe **extrait des types depuis une signature** existante, via le mot-clé `infer` (module 11). On ne les écrit jamais à la main : on les lit depuis le code réel.

```typescript
type Parameters<T extends (...a: any) => any>  = T extends (...a: infer P) => any ? P : never;
type ReturnType<T extends (...a: any) => any>  = T extends (...a: any) => infer R ? R : any;
type InstanceType<T extends abstract new (...a: any) => any> =
  T extends abstract new (...a: any) => infer R ? R : any;
// Awaited déballe récursivement une Promise
```

```typescript
function createMember(dto: CreateMemberDto): Member { /* ... */ return {} as Member; }

type CreateArgs   = Parameters<typeof createMember>;      // [dto: CreateMemberDto]
type FirstArg     = Parameters<typeof createMember>[0];   // CreateMemberDto
type CreateResult = ReturnType<typeof createMember>;      // Member

// Awaited déballe la valeur résolue d'une Promise
async function fetchMember(id: string): Promise<Member> { return {} as Member; }
type Fetched = Awaited<ReturnType<typeof fetchMember>>;   // Member (pas Promise<Member>)

// InstanceType : le type d'instance obtenu avec `new`
class MemberRepository { findAll(): Member[] { return []; } }
type Repo = InstanceType<typeof MemberRepository>;        // MemberRepository
```

Pourquoi c'est précieux : quand une fonction ou une lib tierce n'exporte pas son type de retour, tu le **dérives** de la signature au lieu de le retaper — et il reste synchronisé si la fonction change.

### 2.8 Composer plusieurs utility types

La vraie force apparaît en enchaînant. Chaque utility renvoie un type, donc on les emboîte.

```typescript
// « tout sauf id/createdAt, et tout optionnel » — patch d'update propre
type MemberPatch = Partial<Omit<Member, "id" | "createdAt">>;

// « le résultat d'une fonction async, sans sa clé technique »
type PublicMember = Omit<Awaited<ReturnType<typeof fetchMember>>, "familyId">;
```

Lis-les **de l'intérieur vers l'extérieur** : `Omit` d'abord, puis `Partial` par-dessus.

---

## 3. Worked examples

### Exemple 1 — Remplacer les trois types recopiés par des dérivations (TribuZen)

On reprend le cas concret et on le corrige entièrement.

```typescript
// ─── tribuzen/types/index.ts — SOURCE UNIQUE (ne pas redéclarer ailleurs) ───
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string; // ISO 8601
}

// ─── features/member/member.dto.ts — TOUT est dérivé ───────────────────────
import type { Member } from "@/types";

// 1) DTO de création : le client n'envoie ni id (BDD) ni createdAt (serveur)
export type CreateMemberDto = Omit<Member, "id" | "createdAt">;
//    => { familyId: string; name: string; role: "admin" | "parent" | "enfant" }

// 2) Update partiel : mêmes champs éditables que la création, tous optionnels
export type MemberUpdate = Partial<CreateMemberDto>;
//    => { familyId?: ...; name?: ...; role?: ... }

// 3) Résumé pour la vue liste : seulement l'identité affichée
export type MemberSummary = Pick<Member, "id" | "name">;
//    => { id: string; name: string }

// 4) Rôle dérivé (pas recopié) + table de permissions exhaustive
export type MemberRole = Member["role"];
export type Permission = "read" | "write" | "invite" | "delete";

export const PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin:  ["read", "write", "invite", "delete"],
  parent: ["read", "write", "invite"],
  enfant: ["read"],
  // oublier une clé de MemberRole = erreur de compilation → sécurité gratuite
};
```

**Le test de vérité :** ajoute `avatarUrl: string` à `Member`. Sans rien toucher d'autre, `CreateMemberDto` et `MemberUpdate` gagnent `avatarUrl`, `MemberSummary` l'ignore, `PERMISSIONS` reste valide. Les trois interfaces recopiées du départ, elles, seraient devenues fausses en silence.

### Exemple 2 — Dériver un type depuis une fonction existante

Un service renvoie un objet complexe qu'on ne veut pas retaper.

```typescript
import type { Member } from "@/types";

// Fonction réelle du service — sa forme de retour peut évoluer
async function loadFamilyDashboard(familyId: string) {
  return {
    members: [] as Member[],
    postCount: 0,
    lastActivity: new Date().toISOString(),
  };
}

// On DÉRIVE le type au lieu de le réécrire : suit la fonction automatiquement
type Dashboard = Awaited<ReturnType<typeof loadFamilyDashboard>>;
//    => { members: Member[]; postCount: number; lastActivity: string }

// Un composant consomme le type dérivé, jamais une copie manuelle
function renderDashboard(data: Dashboard): void {
  console.log(`${data.members.length} membres, ${data.postCount} posts`);
}

// Et on peut composer encore : le résumé des membres du dashboard
type DashboardMemberSummary = Pick<Dashboard["members"][number], "id" | "name">;
//    Dashboard["members"][number] = le type d'un élément du tableau = Member
```

Pas à pas : `ReturnType` sort `Promise<{...}>`, `Awaited` déballe la Promise, `["members"][number]` lit le type d'un élément du tableau, `Pick` garde deux clés. Quatre transformations enchaînées, zéro type recopié.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire qu'Exclude/Extract marchent sur les clés d'un objet

```typescript
interface Member { id: string; name: string; role: string; }

// ❌ Exclude ne connaît pas les objets — ceci ne retire PAS la clé id
type Wrong = Exclude<Member, "id">; // = Member (l'objet n'est pas assignable à "id")

// ✅ Pour retirer une clé d'un objet → Omit
type Right = Omit<Member, "id">; // { name: string; role: string }
```

**Discrimination :** `Omit`/`Pick` opèrent sur les **clés d'un objet** ; `Exclude`/`Extract` opèrent sur les **membres d'une union**. `Omit` utilise d'ailleurs `Exclude` en interne pour filtrer `keyof T` — mais c'est `Omit` que tu appelles sur un objet.

### PIÈGE #2 — Recopier une union au lieu de la dériver

```typescript
// ❌ L'union des rôles retapée à la main → dérive dès qu'on ajoute un rôle
type MemberRole = "admin" | "parent" | "enfant";

// ✅ Dérivée de la source via indexed access — toujours synchronisée
type MemberRoleOk = Member["role"];
```

**Règle :** si une union existe déjà dans un type, dérive-la (`T["clé"]`, `keyof T`) plutôt que de la copier.

### PIÈGE #3 — Attendre une immutabilité profonde de Readonly

```typescript
interface Family { name: string; members: Member[]; }
const f: Readonly<Family> = { name: "Durand", members: [] };

f.name = "Martin";            // ❌ erreur — bien protégé au 1er niveau
f.members.push({} as Member); // ✅ compile ! le tableau interne n'est PAS figé
```

`Readonly` (comme `readonly`) est **superficiel**. Pour figer en profondeur il faut un `DeepReadonly` récursif (module 13) — l'utility natif ne le fait pas.

### PIÈGE #4 — `Omit` accepte des clés inexistantes silencieusement

```typescript
// Omit<T, K> contraint K à keyof any (string | number | symbol), PAS à keyof T
type Oops = Omit<Member, "roel">; // pas d'erreur ! faute de frappe non détectée → = Member
```

Contrairement à `Pick` (dont `K extends keyof T` refuse une clé inconnue), `Omit` tolère une clé qui n'existe pas. Relis toujours les noms de clés passés à `Omit` — le compilateur ne t'avertira pas.

---

## 5. Ancrage TribuZen

Ce module produit la **couche des types dérivés** du domaine, tous construits depuis `tribuzen/types` (source unique posée au module 00). Aucun de ces types ne redéclare la forme du domaine : ils la transforment.

- **`CreateMemberDto = Omit<Member, "id" | "createdAt">`** — le contrat d'entrée du formulaire React d'ajout de membre et du endpoint `POST /members` (NestJS, cours 05). Le client n'envoie jamais `id` ni `createdAt`.
- **`MemberUpdate = Partial<CreateMemberDto>`** — le corps du `PATCH /members/:id` : mêmes champs éditables, tous optionnels.
- **`MemberSummary = Pick<Member, "id" | "name">`** — la charge utile allégée de la liste des membres et des menus de sélection.
- **`Record<MemberRole, Permission[]>`** — la table `PERMISSIONS` du guard d'autorisation : exhaustivité des rôles garantie par le compilateur.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  types/
    index.ts                    # source unique : interface Member (+ createdAt)
  src/features/member/
    member.dto.ts               # CreateMemberDto, MemberUpdate, MemberSummary (dérivés)
    member.permissions.ts       # MemberRole, Permission, PERMISSIONS (Record)
```

**Règle d'or du produit :** un fichier de features n'écrit jamais `interface Member { ... }`. Il fait `import type { Member } from "@/types"` puis dérive. Une seule forme du domaine, partout.

---

## 6. Points clés

1. Un utility type transforme un type existant — on dérive une variante au lieu de la redéclarer (DRY au niveau type).
2. `Partial` / `Required` / `Readonly` changent le modificateur de **toutes** les clés (optionnel, obligatoire, lecture seule).
3. `Pick` garde des clés, `Omit` en retire ; choisir selon la liste la plus courte à écrire.
4. `Record<K, V>` bâtit un dictionnaire ; avec une union fermée en `K`, l'exhaustivité des clés est vérifiée à la compilation.
5. `Exclude` / `Extract` filtrent une **union**, pas les clés d'un objet ; `NonNullable` retire `null`/`undefined`.
6. `Parameters` / `ReturnType` / `Awaited` / `InstanceType` extraient des types depuis une signature — on les lit du code réel, jamais recopiés.
7. Dériver une union avec `Member["role"]` ou `keyof T` évite la duplication ; on compose les utility types en les emboîtant (lecture de l'intérieur vers l'extérieur).
8. Pièges : `Readonly` est superficiel ; `Omit` ne vérifie pas l'existence des clés ; `Exclude` ne marche pas sur les objets.

---

## 7. Seeds Anki

```
Quel utility type retire des clés d'un objet, et lequel les filtre dans une union ?|Omit<T, K> retire des clés d'un objet (interne : Pick + Exclude sur keyof T). Exclude<T, U> filtre des membres d'une union. Exclude ne retire pas une clé d'objet.
Comment dériver le type CreateMemberDto qui retire id et createdAt de Member ?|type CreateMemberDto = Omit<Member, "id" | "createdAt">. On dérive de la source unique, on ne redéclare pas les champs à la main.
Comment obtenir un type d'update partiel à partir de CreateMemberDto ?|type MemberUpdate = Partial<CreateMemberDto> — Partial rend toutes les clés optionnelles. On compose deux utility types (Partial sur Omit).
Que garantit Record<MemberRole, Permission[]> quand MemberRole est une union fermée ?|L'exhaustivité : le compilateur exige une entrée pour CHAQUE rôle de l'union. Oublier une clé est une erreur de compilation.
Pourquoi préférer Member["role"] à retaper "admin" | "parent" | "enfant" ?|Member["role"] (indexed access) dérive l'union de la source : elle reste synchronisée si les rôles changent. La recopie diverge silencieusement.
Comment obtenir le type de valeur résolue d'une fonction async sans le réécrire ?|Awaited<ReturnType<typeof fn>> : ReturnType sort Promise<X>, Awaited déballe en X. Types dérivés de la signature, jamais recopiés.
Readonly<T> protège-t-il le contenu d'un tableau interne ?|Non, Readonly est superficiel : il fige les clés de 1er niveau mais un tableau interne reste push-able. L'immutabilité profonde demande un DeepReadonly récursif.
Quelle différence de sûreté entre Pick<T, K> et Omit<T, K> sur les clés passées ?|Pick contraint K à keyof T : une clé inconnue est refusée. Omit contraint K à keyof any : une faute de frappe passe sans erreur (renvoie T inchangé).
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-10-utility-types/README.md`. Dériver toute la couche de types Member de TribuZen (`CreateMemberDto`, `MemberUpdate`, `MemberSummary`, `PERMISSIONS`) depuis une source unique, sans jamais redéclarer la forme du domaine. Corrigé complet + variante J+30.
