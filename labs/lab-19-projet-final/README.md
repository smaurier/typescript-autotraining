# Lab 19 — Projet final : le domaine TribuZen typé de bout en bout

> **Outcome :** à la fin, tu as le noyau typé de TribuZen — entités, schémas zod, ids
> brandés, DTO dérivés, `Result` — et un `ApiClient` générique qui valide chaque réponse à la
> frontière et ne lève JAMAIS d'exception. C'est le **dernier lab** du cours : il assemble
> zod (ids brandés), unions discriminées + `assertNever`, utility types, generics contraints.
> **Vrai outil :** TypeScript 7 (`strict` + `noUncheckedIndexedAccess` +
> `exactOptionalPropertyTypes`) + `zod` + vitest 5 en mode typecheck.
> **Feedback :** `npm run lab:19` depuis `00-typescript/labs` — RED tant que `src/` ne
> satisfait pas l'oracle (17 tests). `npm run solution:19` prouve l'oracle.

## Lire avant (une lecture bornée)

Relis les modules 09 (barrel/imports), 10 (utility types), 04 (narrowing/`assertNever`) —
pas de module dédié : ce lab assemble le parcours entier, sans rien introduire de neuf.

## Énoncé

Deux fichiers, `src/types.ts` et `src/apiClient.ts`. Lis les commentaires en tête de chacun.

**`types.ts`** — la source unique de vérité :
1. `MemberSchema`/`FamilySchema`/`PostSchema` (zod), id brandé (`z.string().uuid().brand<"XxxId">()`).
2. `Member`/`Family`/`Post` dérivés via `z.infer` — jamais réécrits à la main.
3. `MemberId`/`FamilyId`/`PostId` dérivés par indexed access (`Member["id"]`).
4. `Invitation` (union discriminée sur `status`) + `assertNever`.
5. `CreateMemberDto`/`MemberSummary`/`MemberPatch` dérivés (`Omit`/`Pick`/mapped type maison).
6. `Result<T, E>` + `ok`/`err` + `ApiError` (union discriminée sur `kind`).

**`apiClient.ts`** — le SDK générique :
7. `ApiClient<Schemas>.get(resource, id)` : `fetchFn` injecté → `!res.ok` → `unknown` →
   `safeParse` → `Result`. Jamais de `throw` qui remonte à l'appelant.

**Le piège à éviter.** N'introduis pas de `Brand<>` maison à côté de celui de zod — deux
symboles de marque différents pour le "même" concept sont INCOMPATIBLES entre eux, même si
les deux s'appellent `MemberId`. Une seule source de marque : `.brand()` de zod.

**Piège annexe (config).** `noUncheckedIndexedAccess` rend `schemas[resource]` possiblement
`undefined` pour TS, même quand `resource: K extends keyof Schemas & string` garantit que la
clé existe — une assertion `!` locale est légitime ici, la garantie vient du type générique.

## Étapes (en friction)

1. `npm run lab:19` : RED.
2. `types.ts` : schémas zod brandés → types dérivés → ids dérivés → `Invitation` +
   `assertNever` → DTO dérivés → `Result`/`ok`/`err`/`ApiError`.
3. `apiClient.ts` : `get` avec les trois branches d'erreur puis le succès.

## Vérifier

```bash
cd 00-typescript/labs
npm run lab:19
npm run check:19
```

**Ce que l'oracle vérifie (17 tests)**

Runtime : validation zod (accepte/rejette) ; `assertNever` lève toujours ; `ok`/`err`
construisent le bon variant ; `ApiClient.get` — panne réseau, HTTP en échec, validation
échouée, succès — les quatre chemins retournent un `Result`, jamais un `throw`. Types :
`MemberId` brandé (un `FamilyId` ou une chaîne brute refusés) ; `CreateMemberDto` refuse
`id` ; `MemberSummary` refuse un champ en trop ; `MemberPatch` exige `id`, le reste
optionnel ; l'exhaustivité d'`Invitation` forcée par `assertNever` (un cas manquant dans un
`switch` casse la compilation) ; `Result` discrimine correctement `value`/`error` ;
`ApiClient.get` refuse une ressource absente de la carte de schémas.

## Application TribuZen

C'est littéralement le geste : publier `@tribuzen/domain` (ce fichier `types.ts`, packagé),
consommé tel quel par `tribuzen-api` (validation des payloads entrants) ET le front
(`ApiClient` typé de bout en bout). Commit sur `smaurier/tribuzen` :
`feat(domain): noyau typé publié — schémas zod brandés, Result, ApiClient générique`.
