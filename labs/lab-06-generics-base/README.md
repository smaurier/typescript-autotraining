# Lab 06 — Generics fondamentaux

> **Outcome :** à la fin, tu sais rendre génériques les trois briques de la couche data TribuZen — `ApiResponse<T>`, `getById<T extends BaseEntity>` et `Repository<T>` — avec inférence, contrainte `extends` et accès `keyof`/`T[K]`.
> **Vrai outil :** TypeScript (`tsc --noEmit` pour le type-check, `tsx` pour l'exécution). Aucun harnais de test simulé.
> **Feedback :** le coach valide en session — pas de test-runner auto-correcteur.

## Énoncé

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

## Corrigé complet commenté

```ts
// data.ts — CORRIGÉ
// ── Contrat minimal partagé par toutes les entités ────────────────
interface BaseEntity {
  id: string; // la seule chose que getById / Repository exigent
}

interface Member extends BaseEntity {
  name: string;
  role: "admin" | "mod" | "member";
}
interface Family extends BaseEntity {
  label: string;
}

// ── Étape 2 : enveloppe API générique (remplace *Response) ─────────
// Un seul type. data varie par T, error est commun.
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Constructeurs typés : T est inféré depuis l'argument de ok()
function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}
// fail n'a pas d'argument de type T à inférer → on le précise à l'appel
function fail<T>(message: string): ApiResponse<T> {
  return { data: null, error: message };
}

// ── Étape 3 : accès générique contraint (remplace get*ById) ───────
// <T extends BaseEntity> garantit item.id ; le retour reste T précis.
function getById<T extends BaseEntity>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// ── Étape 4 + 5 : dépôt CRUD générique ────────────────────────────
class Repository<T extends BaseEntity> {
  private store = new Map<string, T>();

  findAll(): T[] {
    return [...this.store.values()];
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  // Omit<T, "id"> : on ne fournit PAS l'id, il est généré ici
  create(input: Omit<T, "id">): T {
    const entity = { ...input, id: crypto.randomUUID() } as T;
    this.store.set(entity.id, entity);
    return entity;
  }

  // Partial<T> : on ne modifie que certains champs ; id reste stable
  update(id: string, patch: Partial<T>): T | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.store.delete(id);
  }

  // Étape 5 : keyof + accès indexé → lecture d'une propriété type-safe
  // K est une clé valide de T ; le retour T[K] s'adapte à la clé.
  getProp<K extends keyof T>(id: string, key: K): T[K] | undefined {
    return this.store.get(id)?.[key];
  }
}

// ── Scénario de démonstration (npx tsx data.ts) ───────────────────
const memberRepo = new Repository<Member>();
const created = memberRepo.create({ name: "Cléo", role: "mod" });
// create attend Omit<Member, "id"> = { name, role } — pas d'id à donner

memberRepo.update(created.id, { role: "admin" }); // Partial<Member> : role seul

const found = getById(memberRepo.findAll(), created.id); // found : Member | undefined
const res: ApiResponse<Member> = found ? ok(found) : fail("Membre introuvable");

if (res.data) {
  console.log(res.data.name);                 // "Cléo"
  console.log(memberRepo.getProp(created.id, "role")); // "admin" — typé string-union
}
```

Points de contrôle : `npx tsc --noEmit` passe ; retirer `extends BaseEntity` de `getById` fait échouer `item.id` ; passer une clé inexistante à `getProp` (`"email"`) est refusé à la compilation.

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
