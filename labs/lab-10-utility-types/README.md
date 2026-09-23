# Lab 10 — Utility types : dériver la couche Member de TribuZen

> **Outcome :** à la fin, tu sais dériver tout un jeu de types (DTO, update, résumé, table de
> permissions) depuis une source unique avec les utility types intégrés, sans jamais
> redéclarer la forme du domaine.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck.
> **Feedback :** `npm run lab:10` depuis `00-typescript/labs` — RED tant que
> `src/memberDto.ts` ne satisfait pas l'oracle. `npm run solution:10` prouve l'oracle.

## Lire avant (une lecture bornée)

Module [`10-utility-types.md`](../../modules/10-utility-types.md), une fois :
- `Omit`, `Pick`, `Partial`, indexed access (`T["clé"]`), `Record<K, V>` exhaustif.

## Énoncé

`Member` (dans `src/memberDto.ts`) est la SOURCE UNIQUE du domaine — tu ne la modifies pas,
tu ne la recopies pas. Lis les commentaires en tête du fichier. Dérive :

1. `CreateMemberDto` — `Member` sans `id` ni `createdAt` (générés serveur). `Omit`.
2. `MemberUpdate` — les mêmes champs éditables que `CreateMemberDto`, tous optionnels.
   `Partial` **sur `CreateMemberDto`**, pas sur `Member` (`id` ne doit jamais devenir
   optionnel-éditable).
3. `MemberSummary` — uniquement `id` + `name`. `Pick`.
4. `MemberRole` — l'union des rôles, par indexed access `Member["role"]`. Ne tape jamais
   l'union à la main : si `Member.role` change, `MemberRole` doit suivre tout seul.
5. `PERMISSIONS` — `Record<MemberRole, Permission[]>`, exhaustif par construction (un rôle
   manquant ne compile pas).
6. `toSummary` — projette un `Member` vers son `MemberSummary`.

**Le piège à éviter.** Un type hand-tapé qui *ressemble* au bon résultat compile aussi bien
qu'un type dérivé — l'oracle vérifie la FORME, pas la technique. Mais seul `Member["role"]`
suit automatiquement un futur changement de `Member.role` ; une union recopiée à la main
non.

## Étapes (en friction)

1. `npm run lab:10` : RED.
2. `CreateMemberDto`, `MemberUpdate`, `MemberSummary`, `MemberRole` : un utility type chacun.
3. `PERMISSIONS` : un rôle par clé, au moins une permission chacun.
4. `toSummary` : deux champs, rien d'autre.

## Vérifier

```bash
cd 00-typescript/labs
npm run lab:10
npm run check:10
```

**Ce que l'oracle vérifie**

Types : `CreateMemberDto` refuse `id` ; `MemberUpdate` accepte un patch vide ou partiel,
refuse `id` ; `MemberSummary` refuse un champ en trop ; `MemberRole` refuse `"root"` ;
`Record<MemberRole, Permission[]>` refuse une table à laquelle il manque un rôle.
Runtime : `toSummary` projette exactement `id`/`name` ; `PERMISSIONS` a les trois rôles,
chacun avec au moins `"read"`.

## Variante J+30 (fading)

Ajoute `avatarUrl: string` à `Member` et relance l'oracle : `CreateMemberDto`/`MemberUpdate`
doivent gagner le champ automatiquement, sans autre changement — si ce n'est pas le cas,
un des types a été redéclaré à la main plutôt que dérivé.

## Application TribuZen

Même geste sur le vrai `tribuzen/types/member.ts` : `CreateMemberDto`, `MemberUpdate`,
`MemberSummary`, `PERMISSIONS` dérivés de `Member`, jamais redéclarés. Commit :
`feat(types): DTO Member dérivés du domaine (Omit/Pick/Partial/indexed access)`.
