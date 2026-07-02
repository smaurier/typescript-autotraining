# Lab 10 — Utility types : dériver la couche Member de TribuZen

> **Outcome :** à la fin, tu sais dériver tout un jeu de types (DTO, update, résumé, table de permissions) depuis une source unique avec les utility types intégrés, sans jamais redéclarer la forme du domaine.
> **Vrai outil :** compilateur TypeScript (`tsc --noEmit`) sur un vrai fichier `.ts`. Pas de harnais simulé.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

On te donne la source unique du domaine. **Tu n'as pas le droit de la modifier, ni de redéclarer `Member` ailleurs.** Tout doit être **dérivé**.

Starter — crée `src/member.dto.ts` :

```typescript
// ─── SOURCE UNIQUE — ne pas toucher, ne pas recopier ───────────────
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string; // ISO 8601
}

// ─── À TOI : dérive tout ce qui suit avec des utility types ────────

// 1) CreateMemberDto : Member sans id ni createdAt (générés par le serveur)
// export type CreateMemberDto = ...

// 2) MemberUpdate : mêmes champs éditables que la création, tous optionnels
// export type MemberUpdate = ...

// 3) MemberSummary : uniquement id + name (vue liste)
// export type MemberSummary = ...

// 4) MemberRole : l'union des rôles, DÉRIVÉE de Member (pas recopiée)
// export type MemberRole = ...

// 5) PERMISSIONS : une liste de Permission par rôle, exhaustive
// export type Permission = "read" | "write" | "invite" | "delete";
// export const PERMISSIONS: ... = { ... };
```

Contrainte de vérification finale : le fichier doit compiler avec `npx tsc --noEmit --strict src/member.dto.ts`, et les objets de test (voir étapes) doivent être acceptés/rejetés comme prévu.

## Étapes (en friction)

1. Dérive `CreateMemberDto` avec `Omit`. Vérifie en écrivant un objet valide **sans** `id` ni `createdAt`, puis un objet **avec** `id` : le second doit être refusé.
2. Dérive `MemberUpdate` en composant `Partial` sur `CreateMemberDto` (pas sur `Member` — on ne veut pas rendre `id` optionnel-éditable). Écris un patch qui ne change que `name`.
3. Dérive `MemberSummary` avec `Pick`. Écris la fonction `toSummary(m: Member): MemberSummary`.
4. Dérive `MemberRole` avec un indexed access `Member["role"]`. **Ne tape pas l'union à la main.**
5. Construis `PERMISSIONS` typé `Record<MemberRole, Permission[]>`. Supprime volontairement la clé `enfant` et observe l'erreur de compilation — puis remets-la.
6. Bonus : ajoute `avatarUrl: string` à `Member`, relance `tsc`, et vérifie que `CreateMemberDto`/`MemberUpdate` l'ont gagné automatiquement, sans autre changement.

## Corrigé complet commenté

```typescript
// ─── src/member.dto.ts ─────────────────────────────────────────────
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string;
}

// 1) Omit retire les clés générées côté serveur → contrat d'entrée du client
export type CreateMemberDto = Omit<Member, "id" | "createdAt">;
//    { familyId: string; name: string; role: "admin" | "parent" | "enfant" }

// 2) Partial COMPOSÉ sur CreateMemberDto (pas sur Member) : on ne rend
//    optionnels que les champs éditables, jamais id/createdAt.
export type MemberUpdate = Partial<CreateMemberDto>;
//    { familyId?: ...; name?: ...; role?: ... }

// 3) Pick garde uniquement l'identité affichée en liste
export type MemberSummary = Pick<Member, "id" | "name">;

// La fonction consomme et produit des types dérivés, jamais recopiés
export function toSummary(m: Member): MemberSummary {
  return { id: m.id, name: m.name };
}

// 4) Indexed access : l'union des rôles est DÉRIVÉE de la source.
//    Ajouter un rôle dans Member met à jour MemberRole partout.
export type MemberRole = Member["role"]; // "admin" | "parent" | "enfant"

// 5) Record<MemberRole, Permission[]> impose une entrée par rôle.
//    Retirer une clé = erreur "Property 'enfant' is missing".
export type Permission = "read" | "write" | "invite" | "delete";

export const PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin:  ["read", "write", "invite", "delete"],
  parent: ["read", "write", "invite"],
  enfant: ["read"],
};

// ─── Vérifications (doivent compiler / échouer comme indiqué) ───────
const ok: CreateMemberDto = { familyId: "f1", name: "Alice", role: "parent" };
// @ts-expect-error — id est interdit dans le DTO de création
const ko: CreateMemberDto = { id: "m1", familyId: "f1", name: "Alice", role: "parent" };

const patch: MemberUpdate = { name: "Alice D." }; // ✅ champ unique, le reste optionnel
```

Vérification : `npx tsc --noEmit --strict src/member.dto.ts`. Le fichier compile ; retirer le `// @ts-expect-error` fait échouer la compilation (preuve que `id` est bien rejeté).

## Variante J+30 (fading)

Refais le fichier **de mémoire, en 15 minutes, source seule sous les yeux**, en ajoutant deux contraintes :
- Un type `MemberPatch` qui autorise l'édition de **tout sauf `familyId`** (un membre ne change pas de famille), tous champs optionnels. Indice : composer `Partial` + `Omit`, en retirant aussi `id` et `createdAt`.
- Un type `ReadonlyMember` figé de premier niveau, et une phrase en commentaire expliquant pourquoi `member.role = ...` échoue mais pas une mutation profonde d'un éventuel tableau interne.

## Application TribuZen

Porte ce fichier dans le vrai produit :
- `tribuzen/types/index.ts` reste la **source unique** (n'y ajoute `createdAt` qu'une fois).
- Crée `tribuzen/src/features/member/member.dto.ts` avec `CreateMemberDto`, `MemberUpdate`, `MemberSummary` **importés-dérivés** de `tribuzen/types` (aucune redéclaration de `Member`).
- Crée `tribuzen/src/features/member/member.permissions.ts` avec `MemberRole`, `Permission`, `PERMISSIONS`.
- Commit sur `smaurier/tribuzen` : `feat(member): dériver DTO/update/summary + table de permissions depuis les types du domaine`.
