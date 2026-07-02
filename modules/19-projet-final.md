---
titre: Projet final — le domaine TribuZen typé de bout en bout
cours: 00-typescript
notions: [architecture de types, source unique de vérité, branded types pour les identifiants, dérivation de DTO avec les utility types, mapped type de patch, conditional type d'extraction, validation à la frontière avec zod, Result à la place des exceptions, SDK client générique (ApiClient), declaration file (.d.ts), tsconfig strict, récapitulatif du parcours]
outcomes: [concevoir un fichier de types source unique pour un domaine entier, valider une donnée externe à la frontière avec zod puis la relier à un type branded, construire un client d'API générique et type-safe qui renvoie un Result]
prerequis: [18-patterns-de-conception]
next: fin-du-parcours
libs: [{ name: typescript, version: "^5" }, { name: zod, version: "^3" }]
tribuzen: livrable final — tribuzen/types/index.ts source unique + ApiClient générique validant à la frontière avec zod et renvoyant un Result
last-reviewed: 2026-07
---

# Projet final — le domaine TribuZen typé de bout en bout

> **Outcomes — tu sauras FAIRE :** concevoir un fichier de types *source unique* pour un domaine entier, valider une donnée externe à la frontière avec zod puis la relier à un type *branded*, construire un client d'API générique et type-safe qui renvoie un `Result` plutôt que de lancer des exceptions.
> **Difficulté :** :star::star::star::star::star:

## 1. Cas concret d'abord

C'est le dernier module. Objectif : rassembler **tout** le parcours dans un vrai livrable — le noyau typé de TribuZen, réutilisé par le front (cours React) et par l'API (cours NestJS).

Aujourd'hui, l'état du projet est le pire scénario possible : les types du domaine sont **redéfinis à trois endroits**, et les données de l'API entrent dans l'app sans aucun contrôle.

```typescript
// front/api.ts — la donnée réseau entre en `any`, personne ne la vérifie
async function chargerMembre(id: string) {
  const res = await fetch(`/api/members/${id}`);
  return res.json(); // Promise<any> — TypeScript ne sait RIEN de ce qui revient
}

// front/MemberCard.tsx — re-typé à la main, incompatible avec l'API
interface Member { id: string; name: string; role: string } // "role" libre

// front/adminGuard.ts — encore une autre forme, un id est un string quelconque
function peutInviter(m: { id: string; isAdmin: boolean }) { /* ... */ }
```

**Quatre problèmes, chacun résolu par un module du cours :**

1. Pas de source unique — chaque fichier redéclare `Member` à sa façon (modules 03, 10).
2. `id: string` et `role: string` acceptent n'importe quoi : on peut passer un `postId` là où on attend un `memberId`, ou écrire `"amdin"` (modules 04, 18 — branded types).
3. `res.json()` renvoie `any` : une réponse malformée de l'API traverse toute l'app avant de crasher au pire endroit (module 18 — validation, zod).
4. Une erreur réseau lance une exception invisible dans les types (module 18 — `Result`).

Ce module construit le livrable qui règle les quatre : **`tribuzen/types/index.ts`** (la source unique) et un **`ApiClient` générique** qui valide chaque réponse à la frontière et renvoie un `Result`. Rien de neuf conceptuellement — on **assemble** ce que tu sais déjà.

---

## 2. Théorie complète, concise — méthodologie d'architecture de types

Pas de nouveau concept ici : une **méthode** pour architecturer les types d'un domaine réel, module par module.

### 2.1 Étape 1 — une source unique de vérité (modules 03, 09)

La règle fondatrice : **une entité, une définition, un fichier**. Tout le reste (front, API, tests) *importe* depuis là et n'en re-déclare jamais la forme.

```typescript
// tribuzen/types/index.ts — LA référence. Importée partout, jamais dupliquée.
// interface pour les entités (module 03), type pour unions/alias.
export interface Family {
  readonly id: FamilyId;
  readonly createdAt: Date;
  name: string;
  motto?: string;
  memberIds: readonly MemberId[];
}
```

Le barrel `index.ts` (module 09) rend l'import stable : `import type { Member } from "@/tribuzen/types"`.

### 2.2 Étape 2 — des identifiants *branded* (modules 04, 18)

`id: string` laisse mélanger un id de membre et un id de post. Un **branded type** crée un type nominal : structurellement un `string`, mais incompatible avec un autre brand.

**Décision d'architecture du livrable : une seule source de brand.** Comme les entités sont déjà validées par zod à la frontière (§2.5), on utilise le brand de zod (`.brand<"MemberId">()`) comme *unique* mécanisme et on **dérive** les alias d'id du schéma. On n'introduit **pas** de `Brand<>` maison en parallèle : le brand zod repose sur le symbole `z.BRAND`, distinct du `unique symbol` d'un brand maison — deux marques concurrentes produiraient des types nominaux **non assignables** entre eux.

```typescript
// Les ids se DÉRIVENT des schémas zod (voir §2.5) — pas de Brand<> maison ici.
export type MemberId = Member["id"]; // string & z.BRAND<"MemberId">
export type FamilyId = Family["id"];
export type PostId   = Post["id"];

// On ne peut pas passer un MemberId là où un PostId est attendu — même si les deux
// sont des string au runtime. Le compilateur les traite comme distincts.
```

Le brand n'existe **qu'à la compilation** : au runtime, c'est un `string` nu. La seule fabrique légitime d'une valeur branded est la validation zod à la frontière (§2.5) — jamais un `as`.

### 2.3 Étape 3 — dériver les DTO plutôt que les redéclarer (modules 10, 12)

Le type de création, de mise à jour, de résumé se **dérivent** de l'entité. Les redéclarer = duplication qui divergera.

```typescript
// module 10 — utility types intégrés
export type CreateMemberDto = Omit<Member, "id" | "joinedAt">; // le serveur génère id + date
export type MemberSummary   = Pick<Member, "id" | "displayName" | "role">;

// module 12 — mapped type maison : un "patch" = toutes les clés optionnelles SAUF l'id
export type Patch<T extends { id: unknown }> =
  { id: T["id"] } & { [K in keyof Omit<T, "id">]?: T[K] };

export type MemberPatch = Patch<Member>; // { id: MemberId } & { displayName?: ...; role?: ... }
```

Si `Member` gagne un champ, `CreateMemberDto`, `MemberSummary` et `MemberPatch` se mettent à jour **tout seuls**.

### 2.4 Étape 4 — un conditional type utile pour le SDK (module 11)

Un **conditional type** avec `infer` extrait un type depuis un autre. Pour le SDK, on veut récupérer le type d'entité derrière une réponse API :

```typescript
// module 11 — extrait T de ApiResponse<T>
export type EntityOf<R> = R extends ApiResponse<infer T> ? T : never;

export interface ApiResponse<T> {
  readonly data: T;
  readonly requestId: string;
}
// EntityOf<ApiResponse<Member>> === Member
```

### 2.5 Étape 5 — valider à la frontière avec zod (module 18)

Le point le plus important. Toute donnée **externe** (fetch, `localStorage`, formulaire) entre en `unknown`. On la fait passer par un **schéma zod** qui, en cas de succès, la *raffine* vers le type du domaine — brand compris.

```typescript
import { z } from "zod";

// Le schéma zod EST la définition runtime ; z.infer en dérive le type statique.
export const MemberSchema = z.object({
  id: z.string().uuid().brand<"MemberId">(), // brand zod (symbole z.BRAND) — SEULE source de marque
  familyId: z.string().uuid().brand<"FamilyId">(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "parent", "enfant"]),
  email: z.string().email().optional(),
  joinedAt: z.coerce.date(),
});

// Une seule source : le type se DÉRIVE du schéma (pas l'inverse)
export type Member = z.infer<typeof MemberSchema>;
// Member.id est bien MemberId (branded), role est "admin" | "parent" | "enfant"
```

`schema.safeParse(donnees)` renvoie `{ success: true; data }` ou `{ success: false; error }` — jamais d'exception. C'est la seule porte par laquelle une donnée devient un `Member` de confiance.

### 2.6 Étape 6 — `Result` à la place des exceptions (module 18)

Une opération faillible (réseau, validation) renvoie un `Result<T, E>` : l'erreur est **dans le type**, l'appelant est obligé de la traiter.

```typescript
export type Result<T, E> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly erreur: E };

export const ok  = <T>(valeur: T): Result<T, never> => ({ ok: true, valeur });
export const err = <E>(erreur: E): Result<never, E> => ({ ok: false, erreur });

// Erreurs du domaine, en union discriminée (module 04)
export type ApiError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number }
  | { kind: "validation"; issues: z.ZodIssue[] };
```

### 2.7 Étape 7 — le SDK générique `ApiClient` (modules 06, 07)

On rassemble tout dans **un client générique**, paramétré par une *carte de schémas* `{ resource → schéma zod }`. Chaque méthode infère le type de retour depuis la carte — un seul client, type-safe pour toutes les ressources.

```typescript
class ApiClient<Schemas extends Record<string, z.ZodType>> {
  constructor(private baseUrl: string, private schemas: Schemas) {}

  async get<K extends keyof Schemas & string>(
    resource: K,
    id: string,
  ): Promise<Result<z.infer<Schemas[K]>, ApiError>> {
    // ... fetch → safeParse → ok/err (corrigé complet en §3)
  }
}
```

`get("members", id)` renvoie `Result<Member, ApiError>` sans annotation : `z.infer<Schemas["members"]>` fait le travail. Ajouter une ressource = ajouter une entrée dans la carte.

### 2.8 Étape 8 — un declaration file `.d.ts` (module 16)

Les variables d'environnement (`import.meta.env`) sont `any` par défaut. Un fichier `.d.ts` **augmente** leur type pour typer l'URL de l'API — sans générer de JavaScript.

```typescript
// tribuzen/types/env.d.ts — ambient, aucun export, purement des types
interface ImportMetaEnv {
  readonly VITE_TRIBUZEN_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 2.9 Étape 9 — un tsconfig strict qui garantit tout (module 17)

Rien de ce qui précède ne tient sans le compilateur en mode strict. Le `tsconfig` est la police d'assurance.

```jsonc
{
  "compilerOptions": {
    "strict": true,                     // active strictNullChecks, noImplicitAny, etc.
    "noUncheckedIndexedAccess": true,   // schemas[resource] devient T | undefined
    "exactOptionalPropertyTypes": true, // email?: string ≠ email: string | undefined
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true         // impose import type pour les types
  }
}
```

> **Le fil qui relie tout :** la donnée entre en `unknown` → zod la valide et lui pose un *brand* → elle devient un type du domaine (source unique) → transportée dans un `Result` → exposée par un SDK générique → le tout garanti par un `tsconfig` strict. Chaque flèche est un module du parcours.

---

## 3. Worked examples — construction guidée du livrable

### Exemple 1 — `tribuzen/types/index.ts`, la source unique complète

On construit le fichier fondateur, dans l'ordre des dépendances : marques → schémas zod → types dérivés → DTO → Result → erreurs.

```typescript
// ═══════════════════════════════════════════════════════════════════
//  tribuzen/types/index.ts — SOURCE UNIQUE du domaine TribuZen
//  Importé par le front (React), l'API (NestJS) et les tests. Jamais dupliqué.
// ═══════════════════════════════════════════════════════════════════
import { z } from "zod";

// ─── 1. Schémas zod = définition runtime + UNIQUE source de brand (module 18) ─
// Décision d'archi : une seule marque dans tout le livrable = le brand zod
// (symbole z.BRAND). Pas de Brand<> maison concurrent — deux symboles de brand
// distincts produiraient des types nominaux NON assignables entre eux.
export const MemberSchema = z.object({
  id: z.string().uuid().brand<"MemberId">(),
  familyId: z.string().uuid().brand<"FamilyId">(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "parent", "enfant"]),
  email: z.string().email().optional(),
  joinedAt: z.coerce.date(), // accepte une string ISO venue du JSON et la convertit en Date
});

export const FamilySchema = z.object({
  id: z.string().uuid().brand<"FamilyId">(),
  createdAt: z.coerce.date(),
  name: z.string().min(1),
  motto: z.string().optional(),
  memberIds: z.array(z.string().uuid().brand<"MemberId">()).readonly(),
});

export const PostSchema = z.object({
  id: z.string().uuid().brand<"PostId">(),
  authorId: z.string().uuid().brand<"MemberId">(),
  createdAt: z.coerce.date(),
  body: z.string(),
  editedAt: z.coerce.date().optional(),
  reactions: z.record(z.string(), z.number()), // clés emoji dynamiques (module 03)
});

// ─── 3. Types du domaine, DÉRIVÉS des schémas (z.infer) ─────────────
export type Member = z.infer<typeof MemberSchema>; // id: MemberId, role: union fermée
export type Family = z.infer<typeof FamilySchema>;
export type Post   = z.infer<typeof PostSchema>;
export type MemberRole = Member["role"];           // "admin" | "parent" | "enfant"

// Alias d'id : DÉRIVÉS des types (donc du même brand zod). Aucune redéfinition.
export type MemberId = Member["id"]; // string & z.BRAND<"MemberId">
export type FamilyId = Family["id"];
export type PostId   = Post["id"];

// ─── 4. Invitation : union discriminée (module 04) ─────────────────
export type Invitation =
  | { status: "pending"; token: string; sentAt: Date }
  | { status: "accepted"; token: string; acceptedByMemberId: MemberId; acceptedAt: Date }
  | { status: "expired"; token: string; expiredAt: Date };

export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// ─── 5. DTO dérivés (modules 10 + 12) ──────────────────────────────
export type CreateMemberDto = Omit<Member, "id" | "joinedAt">;
export type MemberSummary   = Pick<Member, "id" | "displayName" | "role">;

// mapped type maison : patch partiel sauf l'id (module 12)
export type Patch<T extends { id: unknown }> =
  { id: T["id"] } & { [K in keyof Omit<T, "id">]?: T[K] };
export type MemberPatch = Patch<Member>;

// ─── 6. Enveloppe API + conditional type d'extraction (module 11) ──
export interface ApiResponse<T> {
  readonly data: T;
  readonly requestId: string;
}
export type EntityOf<R> = R extends ApiResponse<infer T> ? T : never;

// ─── 7. Result + erreurs du domaine (modules 04 + 18) ──────────────
export type Result<T, E> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly erreur: E };

export const ok  = <T>(valeur: T): Result<T, never> => ({ ok: true, valeur });
export const err = <E>(erreur: E): Result<never, E> => ({ ok: false, erreur });

export type ApiError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number }
  | { kind: "validation"; issues: z.ZodIssue[] };
```

**Ce que ce fichier garantit :**
- Une entité, une définition. Le front et l'API importent `Member` — impossible qu'ils divergent.
- `Member.id` est `MemberId` : le passer à une fonction attendant `PostId` ne compile pas.
- `CreateMemberDto` / `MemberPatch` suivent `Member` automatiquement (dérivation, pas copie).
- Le type `Member` **dérive** du schéma zod : la validation runtime et le type statique ne peuvent pas se désynchroniser.

### Exemple 2 — `ApiClient<T>`, le SDK générique qui valide et renvoie un Result

On assemble le client. Il ne connaît aucune ressource en dur : on lui passe la **carte de schémas**, il en infère tout.

```typescript
// ═══════════════════════════════════════════════════════════════════
//  tribuzen/sdk/ApiClient.ts — client générique type-safe
// ═══════════════════════════════════════════════════════════════════
import { z } from "zod";
import {
  MemberSchema, FamilySchema, PostSchema,
  assertNever,
  type Result, type ApiError, ok, err,
} from "@/tribuzen/types";

// Schemas = carte { nom de ressource → schéma zod }. Générique (modules 06/07).
export class ApiClient<Schemas extends Record<string, z.ZodType>> {
  constructor(
    private readonly baseUrl: string,
    private readonly schemas: Schemas,
  ) {}

  // K est contraint aux clés de la carte ; le retour est inféré depuis le schéma.
  async get<K extends keyof Schemas & string>(
    resource: K,
    id: string,
  ): Promise<Result<z.infer<Schemas[K]>, ApiError>> {
    // 1. Réseau — toute exception fetch devient une erreur DANS le type
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/${resource}/${id}`);
    } catch (e) {
      return err({ kind: "network", message: e instanceof Error ? e.message : String(e) });
    }

    // 2. Statut HTTP
    if (!res.ok) return err({ kind: "http", status: res.status });

    // 3. Frontière : la donnée entre en `unknown`, jamais en `any`
    const json: unknown = await res.json();

    // 4. Validation zod — noUncheckedIndexedAccess oblige à gérer l'absence
    const schema = this.schemas[resource];
    if (!schema) return err({ kind: "http", status: 404 });

    const parsed = schema.safeParse(json);
    if (!parsed.success) return err({ kind: "validation", issues: parsed.error.issues });

    // 5. parsed.data est typé z.infer<Schemas[K]> avec les brands posés. On l'emballe.
    return ok(parsed.data as z.infer<Schemas[K]>);
  }
}

// ─── Instanciation : une carte, toutes les ressources typées ───────
const api = new ApiClient("https://api.tribuzen.app", {
  members: MemberSchema,
  families: FamilySchema,
  posts: PostSchema,
});

// ─── Utilisation : narrowing du Result, zéro cast côté appelant ────
const r = await api.get("members", "5f9d…"); // Result<Member, ApiError>
if (r.ok) {
  // r.valeur est un Member de CONFIANCE : validé à la frontière, brands posés
  console.log(r.valeur.displayName, r.valeur.role);
} else {
  // erreur exhaustive (module 04) — le compilateur force les 3 cas
  switch (r.erreur.kind) {
    case "network":    console.error("Réseau :", r.erreur.message); break;
    case "http":       console.error("HTTP", r.erreur.status); break;
    case "validation": console.error("Payload invalide", r.erreur.issues); break;
    default:           assertNever(r.erreur);
  }
}

// api.get("dragons", "1"); // ❌ "dragons" n'est pas une clé de la carte de schémas
```

**Pourquoi ce SDK est l'aboutissement du cours :**
- **Générique** (06/07) : un seul `ApiClient` sert toutes les ressources ; `get` infère `Member`, `Family` ou `Post` selon la clé.
- **Frontière étanche** (18) : `res.json()` est `unknown`, pas `any` ; seul `safeParse` le laisse devenir un type du domaine.
- **Pas d'exception** (18) : réseau KO, HTTP 500, payload invalide → trois variantes d'un `Result`, traitées exhaustivement (04).
- **Source unique** (03) : les schémas et types viennent de `tribuzen/types` — le SDK n'en redéfinit aucun.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Déclarer le type À CÔTÉ du schéma zod (double source)

```typescript
// ❌ Deux sources qui vont diverger : on ajoutera un champ au schéma, pas au type
export const MemberSchema = z.object({ id: z.string(), displayName: z.string() });
export interface Member { id: string; displayName: string } // copie manuelle

// ✅ Une seule source : le type DÉRIVE du schéma
export const MemberSchema = z.object({ id: z.string(), displayName: z.string() });
export type Member = z.infer<typeof MemberSchema>;
```

**Règle :** quand une entité a un schéma runtime, le type statique se dérive avec `z.infer`. On n'écrit jamais les deux à la main.

### PIÈGE #2 — Fabriquer un branded id avec un simple `as`

```typescript
// ❌ Le cast contourne toute vérification : un id invalide devient "de confiance"
const id = "pas-un-uuid" as MemberId; // compile, mais mensonge total

// ✅ La seule fabrique légitime d'un brand : la validation zod à la frontière
const parsed = MemberSchema.shape.id.safeParse(valeurExterne);
const id = parsed.success ? parsed.data : /* gérer l'erreur */ undefined;
```

**Règle :** un brand se **gagne** par validation, il ne se **force** pas par assertion. Le `as` interne au SDK (`parsed.data as ...`) est acceptable car la donnée vient *de zod*, déjà validée.

### PIÈGE #3 — Laisser `res.json()` en `any`

```typescript
// ❌ any se propage : json.displayNam (typo) ne lève AUCUNE erreur
const json = await res.json();          // any
return json as Member;                  // mensonge : rien n'a été vérifié

// ✅ unknown force à valider avant tout accès
const json: unknown = await res.json();
const parsed = MemberSchema.safeParse(json);
```

**Règle :** toute donnée externe est `unknown` jusqu'à ce qu'un schéma l'ait validée. `any` à la frontière annule le bénéfice de tout le fichier de types.

### PIÈGE #4 — `throw` dans le SDK au lieu d'un `Result`

```typescript
// ❌ L'exception est invisible dans la signature : l'appelant l'oublie
async function get(id: string): Promise<Member> {
  const res = await fetch(`/members/${id}`);
  if (!res.ok) throw new Error("HTTP"); // rien dans le type ne le signale
  return res.json();
}

// ✅ Result : l'erreur est dans le type de retour, impossible de l'ignorer
async function get(id: string): Promise<Result<Member, ApiError>> { /* ok/err */ }
```

**Règle :** une opération faillible expose son échec dans son type (`Result`), pas via une exception que les types passent sous silence.

### PIÈGE #5 — Redéclarer un DTO au lieu de le dériver

```typescript
// ❌ CreateMemberDto recopié à la main : divergera de Member au premier champ ajouté
interface CreateMemberDto { familyId: string; displayName: string; role: string }

// ✅ Dérivation : suit Member automatiquement (module 10)
type CreateMemberDto = Omit<Member, "id" | "joinedAt">;
```

**Règle :** un type qui « ressemble » à une entité doit se **dériver** d'elle (`Omit`, `Pick`, `Partial`, mapped type), jamais être recopié.

---

## 5. Ancrage TribuZen

Ce module **est** le livrable TribuZen — l'aboutissement du fil-rouge. Tout ce qu'on a construit module après module converge ici en un noyau réutilisable par les cours suivants.

**`tribuzen/types/index.ts`** — la source unique de vérité. `Family`, `Member`, `Post`, `Invitation`, leurs schémas zod, les ids brandés, les DTO dérivés, `Result` et `ApiError`. Le cours React importe `Member` pour typer `MemberCard` ; le cours NestJS importe `CreateMemberDto` pour typer un endpoint ; les tests importent les schémas pour fabriquer des fixtures valides. Aucun de ces consommateurs ne redéfinit une forme.

**`tribuzen/sdk/ApiClient.ts`** — le client générique qui alimente le front. Chaque écran (`FamilyPage`, `MemberPanel`) appelle `api.get("members", id)` et narrow le `Result` : impossible d'afficher une donnée non validée, impossible d'ignorer une erreur réseau.

**`tribuzen/types/env.d.ts`** — le declaration file qui type `import.meta.env.VITE_TRIBUZEN_API_URL`, passé au constructeur de `ApiClient`.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  tsconfig.json            # strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
  types/
    index.ts               # SOURCE UNIQUE : entités, schémas zod, ids brandés, DTO, Result
    env.d.ts               # augmentation ImportMetaEnv (.d.ts, aucun JS émis)
  sdk/
    ApiClient.ts           # ApiClient<Schemas> générique, valide + renvoie Result
```

**Récapitulatif du parcours — où chaque module atterrit dans le livrable :**

| Module | Notion | Dans le livrable |
|---|---|---|
| 01–02 | primitifs, fonctions, inférence | signatures de `ok`/`err`, méthodes du SDK |
| 03 | interfaces, `readonly`, `Record` | `Family`, `Member`, `Post` ; `reactions: Record` |
| 04 | unions discriminées, `never` | `Invitation`, `ApiError`, `assertNever` |
| 05 | classes | `class ApiClient` |
| 06–07 | generics | `ApiClient<Schemas>`, `Result<T, E>`, `Patch<T>` |
| 08 | tuples / littéraux | `role: z.enum([...])` → union de littéraux |
| 09 | modules, barrel | `import … from "@/tribuzen/types"` |
| 10 | utility types | `Omit`, `Pick` → DTO dérivés |
| 11 | conditional types | `EntityOf<R>` avec `infer` |
| 12 | mapped types | `Patch<T>` (clés optionnelles sauf `id`) |
| 16 | declaration files | `env.d.ts` augmente `ImportMetaEnv` |
| 17 | tsconfig strict | `strict`, `noUncheckedIndexedAccess` |
| 18 | branded types, `Result`, zod | ids brandés, `Result`, validation frontière |

---

## 6. Points clés

1. **Source unique de vérité** : une entité se définit une seule fois dans `tribuzen/types` ; front, API et tests l'importent sans jamais la redéclarer.
2. Les **branded types** rendent les identifiants nominaux — un `MemberId` n'est pas assignable à un `PostId`, bien que tous deux soient des `string`. Dans le livrable, **une seule marque** : le brand zod (`.brand<"MemberId">()`, symbole `z.BRAND`) ; les alias d'id (`MemberId = Member["id"]`) en sont dérivés, jamais un `Brand<>` maison concurrent.
3. Quand une entité a un schéma runtime, on **dérive** le type statique avec `z.infer` : jamais deux sources à maintenir.
4. Les DTO (`CreateMemberDto`, `MemberSummary`, `MemberPatch`) se **dérivent** de l'entité (`Omit`, `Pick`, mapped type) au lieu d'être recopiés.
5. Toute donnée externe entre en **`unknown`** et ne devient un type du domaine qu'après un **`safeParse`** zod à la frontière.
6. Une opération faillible renvoie un **`Result<T, E>`** : l'erreur est dans le type de retour, traitée exhaustivement, jamais lancée en exception silencieuse.
7. Un **SDK générique** `ApiClient<Schemas>` infère le type de chaque ressource depuis une carte de schémas — un seul client type-safe pour tout le domaine.
8. Un **`.d.ts`** augmente des types ambiants (`ImportMetaEnv`) sans émettre de JavaScript ; un **tsconfig strict** est la condition qui fait tenir l'ensemble.

---

## 7. Seeds Anki

```
Qu'est-ce qu'une « source unique de vérité » pour les types d'un domaine ?|Un fichier (ex. tribuzen/types/index.ts) où chaque entité est définie une seule fois. Front, API et tests l'importent au lieu de redéclarer la forme, ce qui empêche toute divergence.
Pourquoi brander les identifiants (Brand<string, "MemberId">) ?|Pour les rendre nominaux : structurellement des string, mais incompatibles entre eux. Le compilateur refuse de passer un MemberId là où un PostId est attendu, ce que id: string autoriserait.
Faut-il écrire à la main le type ET le schéma zod d'une entité ?|Non : quand une entité a un schéma runtime, on dérive le type statique avec z.infer<typeof Schema>. Deux sources à la main divergent (on ajoute un champ à l'une, pas à l'autre).
Comment fabriquer légitimement une valeur branded (ex. un MemberId) ?|Par validation à la frontière (safeParse zod avec .brand<...>), qui « gagne » le brand. Un simple `as MemberId` contourne toute vérification et fabrique un mensonge de type.
Pourquoi res.json() doit-il être typé unknown et pas any ?|any se propage et désactive toute vérification (une typo sur un champ ne lève rien). unknown force à valider (safeParse) avant tout accès, ce qui est le seul moyen d'obtenir un type de confiance.
Pourquoi un SDK renvoie-t-il Result<T, E> plutôt que de throw ?|Parce que l'exception est invisible dans la signature : l'appelant l'oublie. Result met l'échec dans le type de retour, obligeant à le traiter (réseau, HTTP, validation) de façon exhaustive.
Comment un ApiClient générique reste-t-il type-safe pour toutes les ressources ?|Il est paramétré par une carte { ressource → schéma zod } ; get<K> contraint K aux clés de la carte et infère le retour via z.infer<Schemas[K]>. Ajouter une ressource = ajouter une entrée, sans nouveau code.
À quoi sert un fichier .d.ts comme env.d.ts dans ce projet ?|À augmenter des types ambiants (ex. ImportMetaEnv pour typer VITE_TRIBUZEN_API_URL) sans émettre de JavaScript. Combiné à un tsconfig strict, il complète la couverture de types sans code runtime.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-19-projet-final/README.md`. Construire de zéro le livrable final — `tribuzen/types/index.ts` (source unique : entités, schémas zod, ids brandés, DTO dérivés, `Result`) puis l'`ApiClient` générique qui valide à la frontière et renvoie un `Result`. Corrigé complet, variante J+30 et portage dans `smaurier/tribuzen` inclus.

---

## Fin du parcours

> Bravo — c'est le **dernier module** du cours TypeScript. Tu as construit, brique par brique, le noyau typé de TribuZen : de `string` et `number` (module 01) jusqu'à un SDK générique validant à la frontière (ce module). La suite du curriculum (JS Runtime, React, NestJS…) **réutilise** ce `tribuzen/types` — le travail fait ici irrigue tous les cours à venir.
