# Lab 03 — Objets et interfaces : le domaine TribuZen

> **Outcome :** à la fin, tu sais modéliser le fichier fondateur `tribuzen/types/index.ts` (`Family`, `Member` base+admin, `Post`, `Invitation`) avec `readonly`, propriétés optionnelles, `extends` et `Record`, et prouver au compilateur que les objets mal formés sont refusés.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:03` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:03` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

---

## Lire avant (une lecture bornée, pas le module entier)

Module [`03-objets-interfaces-types.md`](../../modules/03-objets-interfaces-types.md), **une fois**, puis on ferme :
- §2.2 `interface` vs `type` · §2.3 optionnels et `readonly` · §2.4 index signatures et `Record`
- §2.5 `extends` vs intersection · §2.8 structural typing · §2.9 excess property checks
- §4 pièges #2 (`readonly` ne gèle pas le contenu), #3 (excess check qui « disparaît »), #4 (typage nominal attendu)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 21/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

Tu poses la **source unique de vérité** du domaine TribuZen : un seul fichier de types importé partout ensuite (front React, API NestJS). Cahier des charges **exact** :

1. **`MemberRole`** — union fermée `"admin" | "parent" | "enfant"`.
2. **`InvitationStatus`** — union fermée `"pending" | "accepted" | "expired" | "revoked"`.
3. **`Family`** — `id` et `createdAt` en `readonly`, `name` requis, `motto?` et `coverUrl?` optionnels, `memberIds: string[]`.
4. **`MemberBase`** — `id` + `familyId` en `readonly`, `displayName`, `role: MemberRole`, `email?`, `avatarUrl?`, `joinedAt: Date`.
5. **`AdminMember`** — `extends MemberBase`, restreint `role` à `"admin"`, ajoute `canInvite: boolean` et `canRemoveMembers: boolean`.
6. **`Member`** — union `MemberBase | AdminMember`.
7. **`Post`** — champs d'identité `readonly` (`id`, `familyId`, `authorId`, `createdAt`), `body`, `editedAt?`, `reactions: Record<string, number>`.
8. **`Invitation`** — `readonly id`, `readonly token`, `readonly familyId`, `readonly invitedByMemberId`, `email`, `status: InvitationStatus`, `expiresAt: Date`, `acceptedByMemberId?`.

**Contraintes :**
- Aucun `any`. Aucun `role: string` libre — le rôle passe par `MemberRole`.
- Tout identifiant/date de création est `readonly`.
- **Pas de gap-fill** : tu écris chaque type depuis une feuille blanche.
- La preuve = `npx tsc --noEmit` passe, et les objets « pièges » (fin du fichier de test) produisent bien une erreur quand on les décommente.

### Starter minimal

```bash
mkdir tribuzen-types-lab && cd tribuzen-types-lab
npm init -y
npm i -D typescript tsx
npx tsc --init --strict
```

Crée deux fichiers :

```
tribuzen-types-lab/
  types.ts   ← à écrire : les 8 déclarations ci-dessus
  check.ts   ← à écrire : objets valides + objets pièges (commentés) qui DOIVENT échouer
```

Vérifie en continu avec `npx tsc --noEmit`, puis exécute la partie runtime avec `npx tsx check.ts`.

---

## Étapes (en friction)

1. **Écris les deux unions** `MemberRole` et `InvitationStatus` avec `type` — demande-toi pourquoi pas `interface`.
2. **Écris `Family`** — place `readonly` sur `id` et `createdAt` uniquement. Ajoute `motto?`/`coverUrl?`.
3. **Écris `MemberBase`** puis **`AdminMember extends MemberBase`** — restreins `role` à `"admin"` dans l'admin.
4. **Déclare `Member`** comme union des deux.
5. **Écris `Post`** avec `reactions: Record<string, number>` et `editedAt?`.
6. **Écris `Invitation`** avec ses 4 `readonly` et `status: InvitationStatus`.
7. **Dans `check.ts`** : construis un objet valide de chaque type. Puis ajoute 4 objets « pièges » **en commentaire** — décommente-les un par un pour vérifier que `tsc` refuse : (a) un `role: "amdin"`, (b) une réassignation `family.id = ...`, (c) une propriété en trop sur un littéral, (d) un `AdminMember` sans `canInvite`.

---

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:03         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:03       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/types.ts`, **types uniquement** (aucune valeur : l'oracle vérifie que le module n'exporte rien à l'exécution). Exports attendus : `MemberRole`, `InvitationStatus`, `Family`, `MemberBase`, `AdminMember`, `Member`, `Post`, `Invitation` — cahier des charges exact dans l'énoncé (points 1 à 8). Les objets pièges (a), (c), (d) de l'énoncé sont dans l'oracle sous `@ts-expect-error` : ils DOIVENT être refusés.

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : les deux unions fermées exactes ; chaque `readonly` de l'énoncé refuse l'affectation (`id`, `createdAt`, `familyId`, `authorId`, `token`) ; les optionnels sont `T | undefined` ; `AdminMember` est assignable à `MemberBase`, restreint `role` à `"admin"`, ajoute deux booléens ; `Member` = `MemberBase | AdminMember` ; `Post.reactions` = `Record<string, number>` ; les objets valides de l'énoncé compilent ; les pièges (a) typo de rôle, (c) propriété en trop via spread, (d) admin incomplet sont refusés.
- **Runtime** : `Object.keys(import("@lab/types"))` est vide — un fichier de types ne pèse rien à l'exécution.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduire de mémoire en 25 minutes, sans rouvrir ce corrigé ni le module :**

1. Ajoute une interface **`Comment`** attachée à un `Post` : `readonly id`, `readonly postId`, `readonly authorId`, `body`, `createdAt: Date`. Ajoute `comments: Comment[]` à `Post`.
2. Rends **immuable en profondeur** la liste `memberIds` de `Family` (interdire `push`) — trouve la bonne syntaxe.
3. Compose une interface **`AuditFields`** (`readonly createdAt: Date`, `updatedAt: Date`) et fais que `Post` en hérite via `extends` au lieu de redéclarer `createdAt`.
4. Écris un `Record<MemberRole, boolean>` nommé `DEFAULT_PERMISSIONS` — le compilateur doit t'obliger à couvrir **exactement** les 3 rôles.

**Critère de réussite :** `npx tsc --noEmit` passe ; retirer une clé de `DEFAULT_PERMISSIONS` provoque une erreur ; `family.memberIds.push(...)` est refusé.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce fichier est la fondation du domaine :

```
tribuzen/src/
  types/
    index.ts   ← Family, Member (MemberBase → AdminMember), Post, Invitation, MemberRole, InvitationStatus
```

**Différences par rapport au lab :**
- Les mêmes types seront **importés** par les composants du cours React (`MemberCard`, `FamilyPanel`) et par les DTO du cours NestJS — d'où l'exigence « source unique de vérité ».
- `Member` (l'union) servira de base au **narrowing** du module 04 (distinguer un admin d'un membre standard par `role`).
- Certaines dates (`createdAt`) seront des `string` ISO côté API JSON puis reconverties en `Date` côté front — le lab utilise `Date` directement pour rester simple.

**Commit cible :**
```
feat(types): domaine TribuZen — Family, Member, Post, Invitation (source de vérité)
```
