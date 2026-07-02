# Lab 19 — Projet final : le domaine TribuZen typé de bout en bout

> **Outcome :** à la fin, tu sais concevoir un fichier de types *source unique* pour un domaine (entités, schémas zod, ids brandés, DTO dérivés, `Result`) et construire un `ApiClient` générique qui valide chaque réponse à la frontière et renvoie un `Result`.
> **Vrai outil :** compilateur TypeScript (`tsc --noEmit`) + `zod` + exécution `npx tsx`. Aucun harnais de test simulé.
> **Feedback :** le coach valide en session — la vérité, c'est ce que dit le compilateur (`tsc`), pas un runner auto-correcteur.

---

## Énoncé

C'est le **dernier lab** du cours. Tu assembles tout le parcours en un vrai livrable : le noyau typé de TribuZen, réutilisable par le front et l'API.

Tu vas produire deux fichiers, **écrits de zéro** (pas de gap-fill) :

1. **`types/index.ts`** — la source unique de vérité :
   - ids **brandés** : `FamilyId`, `MemberId`, `PostId` ;
   - schémas **zod** `MemberSchema`, `FamilySchema`, `PostSchema` — et les types `Member`/`Family`/`Post` **dérivés** avec `z.infer` ;
   - `Invitation` en **union discriminée** + `assertNever` ;
   - DTO **dérivés** : `CreateMemberDto` (`Omit`), `MemberSummary` (`Pick`), `MemberPatch` (mapped type maison) ;
   - `Result<T, E>` + `ok`/`err` + `ApiError` (union discriminée : `network` / `http` / `validation`).

2. **`sdk/ApiClient.ts`** — le client **générique** `ApiClient<Schemas>` :
   - paramétré par une carte `{ ressource → schéma zod }` ;
   - `get(resource, id)` fait `fetch` → `unknown` → `safeParse` → `Result` ;
   - toute erreur (réseau, HTTP, validation) devient une variante d'`ApiError` — **jamais** de `throw`.

### Starter minimal

```bash
mkdir lab-19-projet-final && cd lab-19-projet-final
npm init -y
npm install zod
npm install -D typescript tsx
npx tsc --init --strict
```

Ajoute à `tsconfig.json` (les options qui font tenir tout le reste — module 17) :

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"]           // DOM pour fetch/Response
  }
}
```

Crée `types/index.ts` avec ce squelette (à compléter) :

```typescript
import { z } from "zod";

// TODO 1 — MemberSchema / FamilySchema / PostSchema (zod, avec .brand — UNIQUE source de marque)
// TODO 2 — Member / Family / Post dérivés via z.infer
// TODO 3 — Alias d'id dérivés : MemberId = Member["id"], FamilyId, PostId (pas de Brand<> maison)
// TODO 4 — Invitation (union discriminée) + assertNever
// TODO 5 — CreateMemberDto (Omit) / MemberSummary (Pick) / Patch<T> + MemberPatch
// TODO 6 — Result<T, E> + ok / err + ApiError (union discriminée)
```

Et `sdk/ApiClient.ts` :

```typescript
// TODO 7 — class ApiClient<Schemas extends Record<string, z.ZodType>>
//          get<K>(resource, id): Promise<Result<z.infer<Schemas[K]>, ApiError>>
//          fetch (try/catch → network) → !res.ok (http) → unknown → safeParse (validation) → ok
```

Lance la vérification de types en continu :

```bash
npx tsc --noEmit --watch
```

Le lab est réussi quand `tsc` ne signale **aucune** erreur, que `api.get("dragons", …)` **refuse** de compiler (ressource inconnue), et qu'un `switch (r.erreur.kind)` sans le cas `"validation"` **échoue** (preuve de l'exhaustivité).

---

## Étapes (en friction)

1. **Schémas zod** — modélise `MemberSchema` avec `.brand<"MemberId">()` sur l'id (**unique** source de marque du livrable), `z.enum` pour `role`, `.optional()` pour `email`, `z.coerce.date()` pour les dates. Idem `Family` et `Post`.
2. **Types dérivés** — `export type Member = z.infer<typeof MemberSchema>`. Vérifie au survol que `Member.id` est bien `… & BRAND<"MemberId">` et `role` la union fermée. **N'écris pas** l'interface à la main.
3. **Alias d'id** — dérive `MemberId = Member["id"]`, `FamilyId`, `PostId` des types (donc du même brand zod). N'introduis **pas** de `Brand<>` maison : ce serait un second symbole de brand, incompatible. Vérifie qu'une fonction `f(id: PostId)` **refuse** un `MemberId`.
4. **Invitation + assertNever** — union discriminée sur `status`, chaque variante avec ses champs propres, et l'util `assertNever`.
5. **DTO dérivés** — `CreateMemberDto = Omit<…>`, `MemberSummary = Pick<…>`, puis le mapped type `Patch<T>` et `MemberPatch`. Vérifie que `MemberPatch` a `id` requis et le reste optionnel.
6. **Result + ApiError** — le type `Result`, les constructeurs `ok`/`err`, l'union `ApiError` à trois variantes.
7. **ApiClient générique** — la classe, la contrainte `K extends keyof Schemas & string`, l'enchaînement `try/catch` → `res.ok` → `unknown` → `safeParse`. Aucun `throw`, aucun `any`.
8. **Preuve** — instancie le client avec la carte de schémas, appelle `get`, narrow le `Result`, et prouve les deux garanties : ressource inconnue rejetée, `switch` non exhaustif rejeté.

---

## Corrigé complet commenté

### `types/index.ts`

```typescript
// ═══════════════════════════════════════════════════════════════════
//  types/index.ts — SOURCE UNIQUE du domaine TribuZen (corrigé lab 19)
// ═══════════════════════════════════════════════════════════════════
import { z } from "zod";

// ─── TODO 1 — Schémas zod : définition runtime + UNIQUE source de brand ──
// Décision d'archi : une seule marque dans tout le livrable = le brand zod.
// .brand<"MemberId">() est un brand type-only (symbole z.BRAND) : rien n'est
// posé au runtime (la valeur reste un string nu), et ce symbole est DISTINCT du
// `unique symbol` d'un Brand<> maison → on n'en introduit pas en parallèle.
export const MemberSchema = z.object({
  id: z.string().uuid().brand<"MemberId">(),
  familyId: z.string().uuid().brand<"FamilyId">(),
  displayName: z.string().min(1),
  role: z.enum(["admin", "parent", "enfant"]),
  email: z.string().email().optional(),
  joinedAt: z.coerce.date(), // une string ISO du JSON devient un Date
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

// ─── TODO 2 — Types dérivés (z.infer) : une seule source ───────────
export type Member = z.infer<typeof MemberSchema>; // id: MemberId, role: union fermée
export type Family = z.infer<typeof FamilySchema>;
export type Post   = z.infer<typeof PostSchema>;
export type MemberRole = Member["role"];           // "admin" | "parent" | "enfant"

// ─── TODO 3 — Alias d'id : DÉRIVÉS des types (même brand zod, aucune redéfinition) ─
export type MemberId = Member["id"]; // string & z.BRAND<"MemberId">
export type FamilyId = Family["id"];
export type PostId   = Post["id"];

// ─── TODO 4 — Invitation : union discriminée (module 04) ───────────
export type Invitation =
  | { status: "pending"; token: string; sentAt: Date }
  | { status: "accepted"; token: string; acceptedByMemberId: MemberId; acceptedAt: Date }
  | { status: "expired"; token: string; expiredAt: Date };

// Reçoit never : atteignable seulement si tous les cas sont gérés → filet d'exhaustivité.
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// ─── TODO 5 — DTO dérivés (modules 10 + 12) ────────────────────────
export type CreateMemberDto = Omit<Member, "id" | "joinedAt">; // serveur génère id + date
export type MemberSummary   = Pick<Member, "id" | "displayName" | "role">;

// mapped type maison : id requis, tout le reste optionnel (patch partiel).
export type Patch<T extends { id: unknown }> =
  { id: T["id"] } & { [K in keyof Omit<T, "id">]?: T[K] };
export type MemberPatch = Patch<Member>;

// ─── TODO 6 — Result + erreurs du domaine (modules 04 + 18) ────────
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

### `sdk/ApiClient.ts`

```typescript
// ═══════════════════════════════════════════════════════════════════
//  sdk/ApiClient.ts — client générique type-safe (corrigé lab 19)
// ═══════════════════════════════════════════════════════════════════
import { z } from "zod";
import {
  MemberSchema, FamilySchema, PostSchema,
  assertNever,
  type Result, type ApiError, ok, err,
} from "../types/index.js"; // barrel — source unique, jamais redéclarée ici

// TODO 7 — Schemas = carte { ressource → schéma zod }. Générique (modules 06/07).
export class ApiClient<Schemas extends Record<string, z.ZodType>> {
  constructor(
    private readonly baseUrl: string,
    private readonly schemas: Schemas,
  ) {}

  // K contraint aux clés de la carte ; le retour est inféré depuis le schéma.
  async get<K extends keyof Schemas & string>(
    resource: K,
    id: string,
  ): Promise<Result<z.infer<Schemas[K]>, ApiError>> {
    // 1. Réseau : l'exception fetch devient une erreur DANS le type
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/${resource}/${id}`);
    } catch (e) {
      return err({ kind: "network", message: e instanceof Error ? e.message : String(e) });
    }

    // 2. Statut HTTP
    if (!res.ok) return err({ kind: "http", status: res.status });

    // 3. Frontière : la donnée entre en unknown, JAMAIS en any
    const json: unknown = await res.json();

    // 4. noUncheckedIndexedAccess : schemas[resource] est ZodType | undefined
    const schema = this.schemas[resource];
    if (!schema) return err({ kind: "http", status: 404 });

    // 5. Validation zod → jamais d'exception, un Result explicite
    const parsed = schema.safeParse(json);
    if (!parsed.success) return err({ kind: "validation", issues: parsed.error.issues });

    // 6. parsed.data porte déjà les brands (validé par zod) → cast interne légitime
    return ok(parsed.data as z.infer<Schemas[K]>);
  }
}

// ─── Démonstration ─────────────────────────────────────────────────
const api = new ApiClient("https://api.tribuzen.app", {
  members: MemberSchema,
  families: FamilySchema,
  posts: PostSchema,
});

async function demo() {
  const r = await api.get("members", "5f9d1e00-0000-4000-8000-000000000000");
  if (r.ok) {
    // r.valeur : Member de confiance (validé, brands posés)
    console.log("Membre :", r.valeur.displayName, r.valeur.role);
  } else {
    // switch exhaustif : retirer un case fait échouer la compilation
    switch (r.erreur.kind) {
      case "network":    console.error("Réseau :", r.erreur.message); break;
      case "http":       console.error("HTTP", r.erreur.status); break;
      case "validation": console.error("Payload invalide :", r.erreur.issues); break;
      default:           assertNever(r.erreur);
    }
  }

  // api.get("dragons", "1"); // ❌ "dragons" n'est pas une clé de la carte de schémas
}

demo();
```

**Pourquoi ce corrigé est correct :**
- **Source unique** : `Member`/`Family`/`Post` dérivent de leur schéma zod (`z.infer`) ; le SDK les importe, ne les redéclare pas. Ajouter un champ = un seul endroit à toucher.
- **Brands infalsifiables** : `id: MemberId` n'est assignable ni à `PostId` ni à un `string` nu ; la seule fabrique légitime est `safeParse` à la frontière.
- **Frontière étanche** : `res.json()` est `unknown` → seul `safeParse` le laisse devenir un type du domaine ; `noUncheckedIndexedAccess` force à gérer un schéma absent.
- **Zéro exception** : réseau KO, HTTP, payload invalide → trois variantes d'`ApiError` dans un `Result`, traitées exhaustivement via `assertNever`.
- **Générique** : un seul `ApiClient` sert toutes les ressources ; `get("members", …)` infère `Member` sans annotation.

---

## Variante J+30 (fading)

**Même livrable, contraintes ajoutées — reproduire de mémoire, sans rouvrir ce corrigé ni le module, en 40 minutes :**

1. Ajoute une méthode `list<K>(resource, page)` qui renvoie `Result<z.infer<Schemas[K]>[], ApiError>` : la réponse est un **tableau** à valider (`z.array(schema).safeParse(...)`), pas un objet unique.
2. Ajoute une méthode `create<K>(resource, dto)` qui **envoie** (`POST`) puis valide la réponse. Contrainte : le `dto` doit être typé sans l'`id` (le serveur le génère) — réutilise le pattern `Omit`/`Patch`, sans redéclarer de type à la main.
3. Ajoute une variante `{ kind: "timeout" }` à `ApiError` et **laisse le compilateur te forcer** à la gérer dans le `switch` de la démo (grâce à `assertNever`).

**Critère de réussite :** `tsc --noEmit` passe au vert ; `list` et `create` restent génériques (aucune ressource en dur) ; retirer un `case` de l'`ApiError` refait échouer la compilation.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce livrable est le **noyau** réutilisé par tous les cours suivants :

```
tribuzen/
  tsconfig.json            # strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
  types/
    index.ts               # SOURCE UNIQUE : entités, schémas zod, ids brandés, DTO, Result
    env.d.ts               # augmentation ImportMetaEnv (.d.ts, aucun JS émis — module 16)
  sdk/
    ApiClient.ts           # ApiClient<Schemas> générique
```

**Différences par rapport au lab :**
- L'URL de l'API vient de `import.meta.env.VITE_TRIBUZEN_API_URL`, typée par `types/env.d.ts` (declaration file, module 16) — pas une string en dur.
- Le front (cours React) importe `Member` pour `MemberCard`, l'API (cours NestJS) importe `CreateMemberDto` pour ses endpoints : la **même** source unique, deux consommateurs.
- Les schémas zod servent aussi à fabriquer des **fixtures de test** valides (`MemberSchema.parse(fixture)`), garantissant que les mocks respectent le domaine réel.

**Commit cible :**
```
feat(types): source unique du domaine — entités + schémas zod + ids brandés + Result
feat(sdk): ApiClient générique validant à la frontière (zod) et renvoyant un Result
```

---

> **Fin du parcours TypeScript.** Ce lab est l'aboutissement du fil-rouge : de `string`/`number` (lab 01) jusqu'à un SDK générique validant à la frontière. Le `tribuzen/types` produit ici irrigue les cours JS Runtime, React et NestJS à venir.
