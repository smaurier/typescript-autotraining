# Lab 09 — Modules ES et résolution

> **Outcome :** à la fin, tu sais construire un barrel `types/index.ts` qui mélange
> correctement des re-exports de **types** (`export type`) et de **valeurs** (`export`),
> sous `verbatimModuleSyntax` — et un service qui consomme UNIQUEMENT ce barrel, jamais les
> fichiers internes.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict` + `verbatimModuleSyntax`) + vitest 5 en
> mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et
> tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:09` depuis `00-typescript/labs` — RED tant que
> `src/types/index.ts` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche
> (GO/FIX/STOP). La solution de référence vit dans `solution/` : `npm run solution:09` prouve
> que l'oracle est juste, tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`09-modules-et-resolution.md`](../../modules/09-modules-et-resolution.md), **une
fois**, puis on ferme :
- §2.3 re-export et barrel files · §2.4 `import type` / `export type` · §2.5
  `verbatimModuleSyntax`
- §4 piège #1 (`import type` n'est pas cosmétique)

⛔ **Pas §3 Worked examples avant ton GREEN** (Exemple 1 = ce lab, résolu).

## Énoncé

Le dossier `src/types/` contient quatre fichiers déjà écrits et corrects : `family.ts`,
`member.ts`, `event.ts` (des TYPES purs — interfaces, alias) et `roles.ts` (une VALEUR — un
`const ROLES` avec de vraies données au runtime). `src/services/familyService.ts` est donné
et déjà correct : il importe TOUT depuis `../types` (le barrel), jamais les fichiers
internes directement.

Ta mission : écrire `src/types/index.ts`, le barrel, vide pour l'instant. Tant qu'il est
vide, rien ne compile en aval — c'est le point de départ.

Contraintes (le tsconfig de ce lab impose `verbatimModuleSyntax: true`) :
1. `Family`, `Member`, `Role`, `Event` sont des types purs → `export type { ... }`.
2. `ROLES` est une valeur → `export { ROLES }`, SANS `type`.
3. Se tromper dans le sens « oublier `type` sur un type pur » laisse une ligne d'import
   inutile dans le JS émis (piège #1 — pas d'erreur de compilation, mais un bug de bundle).
4. Se tromper dans l'autre sens (`export type { ROLES }`) est une **erreur de compilation**
   sous `verbatimModuleSyntax` : TS refuse de type-exporter un identifiant qui n'est pas un
   type.

## Étapes (en friction)

1. `npm run lab:09` : RED (« has no exported member » partout — le barrel est vide).
2. Écris les trois lignes `export type { ... } from './...'` pour Family, Member+Role, Event.
3. Écris la ligne `export { ROLES } from './roles'` — sans `type`.
4. `npm run check:09` : `tsc` seul, si tu veux isoler une erreur de compilation avant de
   relancer l'oracle complet.

## Vérifier

```bash
cd 00-typescript/labs
npm install
npm run lab:09
npm run check:09
```

**Contrat attendu par l'oracle**

`src/types/index.ts` doit re-exporter : `Family`, `Member`, `Role`, `Event` (type-only) et
`ROLES` (valeur normale). Rien d'autre à écrire — `family.ts`, `member.ts`, `event.ts`,
`roles.ts` et `familyService.ts` sont déjà corrects et ne se modifient pas.

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `Family`/`Member`/`Event` ont exactement leurs champs (un champ manquant est
  refusé) ; `Role` est l'union exacte des trois littéraux (`"root"` refusé) ; `ROLES` a le
  type `readonly ["admin", "parent", "enfant"]` — une VALEUR typée, pas juste un type ;
  `estUnRoleValide` est un vrai type-guard qui narrow une chaîne en `Role`.
- **Runtime** : `ROLES` existe réellement (`["admin","parent","enfant"]`) ; `estUnRoleValide`
  accepte les trois rôles connus, rejette le reste ; `creerFamilleVide` retourne la forme
  exacte ; `nomsDesMembres` extrait les noms dans l'ordre ; `evenementsAVenir` filtre le
  passé et trie par date croissante.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un
échec : ton barrel est trop permissif à cet endroit.

## Variante J+30 (fading)

Reprends à froid, **en 15 minutes** :

1. Ajoute un cinquième fichier `types/invitation.ts` avec un type `InvitationStatus =
   'pending' | 'accepted' | 'declined'` ET une valeur `DEFAULT_STATUS: InvitationStatus`.
   Ajoute les DEUX au barrel, chacun avec le bon mode d'export.
2. Sans relire le module, explique à voix haute pourquoi `export type { ROLES }` planterait
   la compilation — pas juste "parce que c'est écrit comme ça".

## Application TribuZen

Porte le résultat dans le vrai dépôt :

- `tribuzen/types/index.ts` : barrel type-only pour `Family`/`Member`/`Role`/`Event`, plus
  toute constante métier partagée (rôles, statuts) exportée en valeur normale à côté.
- Vérifie `npx tsc --noEmit` avec `verbatimModuleSyntax: true` actif.
- Commit sur `smaurier/tribuzen` :
  `feat(types): barrel types/index.ts type-only + ROLES exporté en valeur`.
