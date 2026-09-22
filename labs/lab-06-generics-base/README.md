# Lab 06 — Generics fondamentaux

> **Outcome :** à la fin, tu sais rendre génériques les trois briques de la couche data TribuZen — `ApiResponse<T>`, `getById<T extends BaseEntity>` et `Repository<T>` — avec inférence, contrainte `extends` et accès `keyof`/`T[K]`.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:06` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:06` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`06-generics-fondamentaux.md`](../../modules/06-generics-fondamentaux.md), **une fois**, puis on ferme :
- §2.1 le problème que les generics résolvent · §2.2 fonctions génériques et inférence · §2.3 contraintes `extends`
- §2.5 generics sur interfaces et classes · §2.6 `keyof` et accès indexé `T[K]`
- §4 pièges #1 (`any` à la place d'un generic), #2 (`extends` héritage vs contrainte), #3 (contrainte manquante), #5 (type explicite que l'inférence donnait déjà)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab, résolu).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 22/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

Tu pars d'un fichier `data.ts` qui contient la duplication du cas concret du module : un type de réponse par entité, un helper `getById` par entité. Objectif : tout **dégénériciser** en trois briques réutilisables, sans perdre une once de typage.

Starter minimal (crée `data.ts` et colle ceci — c'est le point de départ à refactorer, pas un gap-fill) :

```ts
// data.ts — POINT DE DÉPART (à refactorer)
interface Member {
  id: string;
  name: string;
  role: "admin" | "mod" | "member";
}
interface Family {
  id: string;
  label: string;
}

// Duplication à supprimer : deux types identiques sauf `data`
interface MemberResponse {
  data: Member | null;
  error: string | null;
}
interface FamilyResponse {
  data: Family | null;
  error: string | null;
}

// Duplication à supprimer : deux helpers identiques sauf le type
function getMemberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}
function getFamilyById(families: Family[], id: string): Family | undefined {
  return families.find((f) => f.id === id);
}
```

Environnement (une fois) :

```bash
npm init -y
npm install -D typescript tsx
npx tsc --init --strict
```

## Étapes (en friction)

1. **`BaseEntity`** — Crée une interface `BaseEntity { id: string }`. Fais `Member` et `Family` l'étendre (`extends BaseEntity`).
2. **`ApiResponse<T>`** — Remplace `MemberResponse` et `FamilyResponse` par **une** interface générique `ApiResponse<T>` avec `data: T | null` et `error: string | null`. Écris deux helpers `ok<T>(data: T): ApiResponse<T>` et `fail<T>(msg: string): ApiResponse<T>`.
3. **`getById`** — Remplace les deux helpers par **une** fonction `getById<T extends BaseEntity>(items: T[], id: string): T | undefined`. Vérifie que sans la contrainte `extends BaseEntity`, `item.id` ne compile pas (enlève-la, observe l'erreur, remets-la).
4. **`Repository<T>`** — Écris une classe `Repository<T extends BaseEntity>` avec un `Map<string, T>` interne et `findAll`, `findById`, `create(input: Omit<T, "id">)`, `update(id, patch: Partial<T>)`, `remove(id)`.
5. **`keyof` bonus** — Ajoute `getProp<K extends keyof T>(id: string, key: K): T[K] | undefined` au repository : récupère l'entité puis retourne `entity[key]`.
6. **Vérifie** — `npx tsc --noEmit` doit passer sans erreur. Exécute un petit scénario avec `npx tsx data.ts` (crée un membre, mets-le à jour, relis-le).

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:06         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:06       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/data.ts` (le point de départ dupliqué est déjà dedans, à refactorer). Exports attendus :
- `interface BaseEntity { id: string }` · `Member extends BaseEntity` · `Family extends BaseEntity`
- `interface ApiResponse<T> { data: T | null; error: string | null }` · `ok<T>(data: T): ApiResponse<T>` · `fail<T>(message: string): ApiResponse<T>`
- `getById<T extends BaseEntity>(items: T[], id: string): T | undefined`
- `class Repository<T extends BaseEntity>` : `findAll(): T[]` · `findById(id): T | undefined` · `create(input: Omit<T, "id">): T` (id généré) · `update(id, patch: Partial<T>): T | undefined` · `remove(id): boolean` · `getProp<K extends keyof T>(id, key: K): T[K] | undefined`
- `MemberResponse`, `FamilyResponse`, `getMemberById`, `getFamilyById` doivent **disparaître**.

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `ApiResponse<Member>` et `ApiResponse<Family>` ont exactement la forme attendue ; `ok(m)` infère `ApiResponse<Member>` ; `getById` renvoie `T | undefined` précis et refuse un objet sans `id` ; `create` refuse un `id` fourni ; `getProp(id, "role")` renvoie `Member["role"] | undefined` et `"email"` est refusé ; `Repository<{ name: string }>` est refusé.
- **Runtime** : `ok`/`fail` produisent l'enveloppe ; `getById` retrouve membres et familles avec la même fonction ; `create` génère un id string unique ; `update` fusionne et conserve l'id, renvoie `undefined` sur inconnu ; `remove` true puis false ; `getProp` lit la bonne propriété.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

## Variante J+30 (fading)

Refais le lab **de mémoire, en 25 minutes**, avec ces contraintes ajoutées :
- Ajoute une entité `Event extends BaseEntity` et un `new Repository<Event>()` — la classe ne change pas d'une ligne (c'est le but).
- Ajoute au repository `findBy<K extends keyof T>(key: K, value: T[K]): T[]` qui retourne toutes les entités dont `entity[key] === value`. Réutilise le combo `keyof` + `T[K]`.
- Contrainte forte : n'écris **aucun** type explicite à l'appel de `getById` / `ok` — tout doit être inféré. Si tu dois écrire `<Member>`, c'est que la signature est à revoir.

## Application TribuZen

Porte les trois briques dans le vrai produit `smaurier/tribuzen` :

```
tribuzen/src/
  domain/entities.ts   → BaseEntity, Member, Family, Event
  data/api.ts          → ApiResponse<T>, ok<T>, fail<T>
  data/helpers.ts      → getById<T extends BaseEntity>
  data/Repository.ts    → Repository<T extends BaseEntity>
```

Étapes de portage :
1. Crée `domain/entities.ts` avec `BaseEntity` et les entités du domaine.
2. Déplace `ApiResponse<T>` + `ok`/`fail` dans `data/api.ts` (export nommé).
3. `data/Repository.ts` : la classe générique, prête à être branchée sur Prisma au module BDD (le `Map` interne deviendra une table, la signature générique ne bouge pas).
4. Vérifie `npx tsc --noEmit` à la racine du repo, puis commit :

```bash
git add src/domain/entities.ts src/data/api.ts src/data/helpers.ts src/data/Repository.ts
git commit -m "feat(data): couche data générique — ApiResponse<T>, getById, Repository<T>"
```
