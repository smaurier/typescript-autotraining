# Lab 07 — Generics avancés

> **Outcome :** à la fin, tu sais écrire `pick<T, K>` maison, un `QueryBuilder<T>` générique verrouillé par `NoInfer`, et repérer/retirer un generic superflu — en TypeScript strict, avec le vrai compilateur.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:07` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:07` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`07-generics-avances.md`](../../modules/07-generics-avances.md), **une fois**, puis on ferme :
- §2.3 generics multiples liés · §2.4-2.5 `keyof`, accès indexé, `extends keyof` (le cœur de `pick`)
- §2.6 factories et builders · §2.8 `NoInfer` · §2.10 quand un generic est de trop
- §4 pièges #2 (`K extends keyof T` vs `string[]`), #3 (generic fantôme), #4 (generic qui ne lie rien), #5 (`NoInfer` oublié)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab, résolu).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 22/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

Tu construis la couche « accès aux données typé » de l'admin TribuZen dans un seul fichier `generics.ts`. Trois tâches, du plus guidé au plus autonome. Tu écris tout toi-même — pas de trous à remplir.

Type de base commun à tout le lab :

```ts
export interface Family {
  id: string;
  nom: string;
  ville: string;
  membreCount: number;
  createdAt: string;
}

const familles: Family[] = [
  { id: 'f1', nom: 'Durand', ville: 'Lyon', membreCount: 4, createdAt: '2026-01-01' },
  { id: 'f2', nom: 'Martin', ville: 'Paris', membreCount: 2, createdAt: '2026-02-01' },
  { id: 'f3', nom: 'Bernard', ville: 'Lyon', membreCount: 5, createdAt: '2026-03-01' },
];
```

## Étapes (en friction)

1. **`pick` maison.** Écris `pick<T, K extends keyof T>(obj, keys)` qui renvoie `Pick<T, K>`. Prouve que `pick(familles[0], ['nom', 'ville'])` a bien le type `{ nom: string; ville: string }` (survole-le dans l'éditeur) et qu'une clé inexistante est refusée. Écris en commentaire la ligne qui DOIT échouer.

2. **`QueryBuilder<T>` générique.** Écris une classe avec `where<K extends keyof T>(cle, valeur)` et `run(source)`. La valeur du filtre doit être contrainte au type de la colonne. Vérifie que `.where('membreCount', 'quatre')` est une erreur de type.

3. **Verrou `NoInfer`.** Modifie la signature de `where` pour que `valeur` soit `NoInfer<T[K]>`. Écris ensuite une fonction `withDefault<T>(options, defaut)` qui montre le problème SANS `NoInfer`, puis la version corrigée AVEC — commente la ligne qui doit échouer une fois `NoInfer` en place.

4. **Chasse au generic de trop.** On te donne trois signatures ; identifie celle(s) où le generic ne lie rien et réécris-la sans generic. Justifie en une phrase par commentaire.

```ts
function a<T>(x: T[]): number { return x.length; }        // generic utile ou pas ?
function b<T>(x: T): T { return x; }                       // ?
function c<T>(json: string): T { return JSON.parse(json); } // ?
```

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:07         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:07       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/generics.ts` (`Family` et `familles` fournis). Exports attendus :
- `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
- `class QueryBuilder<T>` : `where<K extends keyof T>(cle: K, valeur: NoInfer<T[K]>): this` · `filter(fn: (x: T) => boolean): this` · `run(source: readonly T[]): T[]` (prédicats combinés en ET)
- `withDefault<T>(options: readonly T[], defaut: NoInfer<T>): T` (le défaut s'il est dans les options, sinon la première)
- Étape 4, sous ces noms : `longueur(x: unknown[]): number` (sans generic) · `identity<T>(x: T): T` (generic gardé) · `parseJson(json: string): unknown` (sans generic fantôme)

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `pick(familles[0], ["nom", "ville"])` est exactement `{ nom: string; ville: string }`, `createdAt` et une clé inconnue sont refusés ; `where("membreCount", "quatre")` et `where("pays", …)` sont refusés ; `where`/`filter` renvoient `QueryBuilder<Family>` (chaînage `this`) ; `withDefault(["sombre", "clair"] as const, "sombre")` est `"sombre" | "clair"` et `"auto"` est refusé (c'est `NoInfer` qui l'empêche) ; `parseJson` renvoie `unknown`.
- **Runtime** : `pick` ne garde que les clés demandées et ne mute pas ; le builder `where("ville","Lyon").filter(≥ 4)` renvoie Durand et Bernard ; sans prédicat il renvoie tout ; `withDefault` ; `longueur`/`identity`/`parseJson`.
- **Lecture (correcteur)** : aucun paramètre de type ne subsiste sur `longueur` ni `parseJson`, et chaque choix de l'étape 4 est justifié en une phrase de commentaire.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

## Variante J+30 (fading)

Refais l'exercice de mémoire, en **20 minutes**, avec ces contraintes ajoutées :
- Ajoute à `QueryBuilder` une méthode `orderBy<K extends keyof T>(cle: K): this` qui trie le résultat sur une colonne (compare `a[cle] < b[cle]`). Applique-la dans `run`.
- Ajoute `pickExcept<T, K extends keyof T>(obj, keys): Omit<T, K>` — l'inverse de `pick`.
- Interdiction de regarder le corrigé ci-dessus. Le seul feedback autorisé : `npx tsc --noEmit`.

## Application TribuZen

Porte ces trois helpers dans le vrai produit :
- `src/utils/pick.ts` — `pick` + `pickExcept`, utilisés par la liste et les tooltips de la page « Familles ».
- `src/query/QueryBuilder.ts` — le `QueryBuilder<Family>` avec `where` (verrouillé `NoInfer`), `filter`, `orderBy`, `run`. Branche-le sur le tableau des familles de l'admin.
- `src/data/createRepository.ts` — factory `createRepository<T extends { id: string }>` pour `Family`, `Member`, `Event`.

Ajoute un fichier `src/utils/pick.spec-types.ts` contenant uniquement des assertions de type (`@ts-expect-error` sur les cas interdits) — c'est ta filet de sécurité au refactor. Commit sur `smaurier/tribuzen` :

```bash
git add src/utils/pick.ts src/query/QueryBuilder.ts src/data/createRepository.ts
git commit -m "feat(types): pick + QueryBuilder générique verrouillé NoInfer"
```
