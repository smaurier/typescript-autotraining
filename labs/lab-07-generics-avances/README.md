# Lab 07 — Generics avancés

> **Outcome :** à la fin, tu sais écrire `pick<T, K>` maison, un `QueryBuilder<T>` générique verrouillé par `NoInfer`, et repérer/retirer un generic superflu — en TypeScript strict, avec le vrai compilateur.
> **Vrai outil :** `tsc` (TypeScript ^5.4, mode `strict`) + `tsx` pour exécuter. Aucun harnais de test simulé.
> **Feedback :** le coach valide en session. Le juge de vérité, c'est `tsc --noEmit` : les erreurs de type attendues DOIVENT apparaître, les usages corrects DOIVENT compiler.

## Prérequis outil

```bash
# depuis un dossier vide de travail (hors repo de cours, ou dans un scratch)
npm init -y
npm i -D typescript@^5.4 tsx
npx tsc --init --strict
```

> `NoInfer` exige **TypeScript ≥ 5.4**. Vérifie : `npx tsc --version`.

## Énoncé

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

## Corrigé complet commenté

```ts
// generics.ts — lancer avec : npx tsx generics.ts   (et vérifier : npx tsc --noEmit)

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

// ─── Étape 1 : pick maison ───────────────────────────────────────
// T = objet source ; K = clés voulues, bornées par keyof T (sinon on pourrait
// demander une clé qui n'existe pas). Retour Pick<T, K> = objet réduit à K.
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;   // objet vide qu'on remplit ; assertion vers le type final
  for (const k of keys) {
    out[k] = obj[k];              // obj[k]: T[K], out[k] attend T[K] -> OK
  }
  return out;
}

const carte = pick(familles[0], ['nom', 'ville']);
// K inféré = "nom" | "ville" -> type: { nom: string; ville: string }
console.log(carte.nom, carte.ville);
// @ts-expect-error "createdAt" absent du type réduit
console.log(carte.createdAt);
// @ts-expect-error "zzz" n'est pas une clé de Family
pick(familles[0], ['zzz']);

// ─── Étapes 2 & 3 : QueryBuilder + NoInfer ───────────────────────
class QueryBuilder<T> {
  private predicats: Array<(x: T) => boolean> = [];

  // K borné par keyof T ; valeur = NoInfer<T[K]> : la valeur ne peut plus servir
  // de source d'inférence, T[K] est décidé par la clé seule. Comparaison type-safe.
  where<K extends keyof T>(cle: K, valeur: NoInfer<T[K]>): this {
    this.predicats.push((x) => x[cle] === valeur);
    return this;                 // `this` typé -> chaînage fluide
  }

  filter(fn: (x: T) => boolean): this {
    this.predicats.push(fn);
    return this;
  }

  run(source: readonly T[]): T[] {
    return source.filter((x) => this.predicats.every((p) => p(x)));
  }
}

const grandesLyonnaises = new QueryBuilder<Family>()
  .where('ville', 'Lyon')          // valeur: string (= Family['ville'])
  .filter((f) => f.membreCount >= 4)
  .run(familles);
console.log(grandesLyonnaises.map((f) => f.nom)); // ["Durand", "Bernard"]

// @ts-expect-error 'quatre' n'est pas assignable à number
new QueryBuilder<Family>().where('membreCount', 'quatre');

// Démonstration NoInfer sur une valeur par défaut.
// `options: readonly T[]` + `as const` sur l'appel : sans le `as const`, les
// littéraux d'un tableau nu s'élargissent en `string`, T = string, et 'auto'
// passerait (le @ts-expect-error deviendrait inutilisé → TS2578).
function withDefault<T>(options: readonly T[], defaut: NoInfer<T>): T {
  return options.includes(defaut) ? defaut : options[0];
}
const theme = withDefault(['sombre', 'clair'] as const, 'sombre'); // OK
console.log(theme);
// @ts-expect-error 'auto' ∉ "sombre" | "clair" grâce à NoInfer + as const
withDefault(['sombre', 'clair'] as const, 'auto');

// ─── Étape 4 : chasse au generic de trop ─────────────────────────
// a) generic INUTILE : T n'apparaît qu'une fois, le retour ne dépend pas de T.
function longueur(x: unknown[]): number { return x.length; }

// b) generic UTILE : T lie l'entrée et le retour (identity). On le garde.
function identity<T>(x: T): T { return x; }

// c) generic FANTÔME : T n'est déduit d'aucun argument, c'est un any déguisé.
//    Version honnête : renvoyer unknown et laisser l'appelant valider.
function parseJson(json: string): unknown { return JSON.parse(json); }

console.log(longueur([1, 2, 3]), identity('ok'), parseJson('{"a":1}'));
```

> **Note sur `@ts-expect-error` :** ce n'est PAS un test-runner. C'est une directive du compilateur : si la ligne suivante ne produit PAS l'erreur attendue, `tsc` échoue. C'est exactement le feedback qu'on veut — le type checker devient le juge. Lance `npx tsc --noEmit` : zéro sortie = tout est conforme.

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
