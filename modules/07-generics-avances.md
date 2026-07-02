---
titre: Generics avancés
cours: 00-typescript
notions: [inférence du type de retour, generics multiples liés, keyof et accès indexé poussés, contraintes extends keyof, factories et builders génériques, higher-order generic functions, NoInfer TS 5.4, variance en survol, quand un generic est de trop]
outcomes: [lier et inférer plusieurs paramètres de type dans une même signature, contraindre une clé avec extends keyof pour typer un accès dynamique, écrire une factory ou un builder générique qui préserve le typage, verrouiller un paramètre d'inférence avec NoInfer, reconnaître un generic superflu et le retirer]
prerequis: [06-generics-fondamentaux]
next: 08-enums-tuples-types-speciaux
libs: [{ name: typescript, version: "^5" }]
tribuzen: helper pick maison et query builder générique typé pour filtrer les familles TribuZen, avec un paramètre verrouillé par NoInfer
last-reviewed: 2026-07
---

# Generics avancés

> **Outcomes — tu sauras FAIRE :** lier plusieurs paramètres de type dans une signature pour que l'un se déduise de l'autre, contraindre une clé avec `extends keyof` pour typer un accès dynamique, écrire une factory ou un builder générique qui préserve le typage, verrouiller un paramètre d'inférence avec `NoInfer`, et reconnaître quand un generic est de trop.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu bosses sur l'admin TribuZen. Sur la page « Familles », il faut n'afficher que certaines colonnes selon la vue : la liste veut `nom` + `membreCount`, le tooltip veut `nom` + `ville`. Un collègue a écrit un helper `pick` pour extraire un sous-objet :

```ts
// utils/pick.ts — AVANT
function pick(obj: any, keys: string[]): any {
  const out: any = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}

interface Family {
  id: string;
  nom: string;
  ville: string;
  membreCount: number;
  createdAt: string;
}

const family: Family = { id: 'f1', nom: 'Durand', ville: 'Lyon', membreCount: 4, createdAt: '2026-01-01' };

const apercu = pick(family, ['nom', 'membreCount']);
apercu.nom;          // any — aucune autocomplétion
apercu.membreCoun;   // any aussi... la typo passe en silence
pick(family, ['ville', 'inexistante']); // aucune erreur, alors que la clé n'existe pas
```

**Trois problèmes immédiats :**
1. Le résultat est `any` — plus aucune autocomplétion ni détection de typo en aval.
2. On peut demander une clé qui n'existe pas sur `Family` sans que TypeScript ne dise rien.
3. Le type de retour ne reflète pas les clés demandées : impossible de savoir que `apercu` contient `nom` et `membreCount` et rien d'autre.

Le vrai `pick` doit dire : « je prends un objet `T`, une liste de clés qui **existent dans `T`**, et je te rends **exactement** l'objet réduit à ces clés ». C'est le fil conducteur de ce module : faire porter par les types les **relations** entre l'entrée et la sortie, pas juste leur forme isolée.

```ts
// utils/pick.ts — l'objectif de ce module
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

const apercu = pick(family, ['nom', 'membreCount']);
apercu.nom;         // string ✅
apercu.membreCount; // number ✅
// pick(family, ['inexistante']); // ERREUR : "inexistante" n'est pas une clé de Family
```

---

## 2. Théorie complète, concise

### 2.1 Rappel de bornage : ce que le module 06 a posé

Tu sais déjà écrire `function identity<T>(x: T): T`, contraindre avec `T extends { length: number }`, et lire `keyof`. Ce module ne réexplique pas ça : il montre comment **combiner** ces briques pour modéliser des relations. Le fil rouge : un generic n'a de valeur que s'il **relie** deux endroits d'une signature (paramètre ↔ retour, ou paramètre ↔ paramètre).

### 2.2 Inférence du type de retour (le retour se déduit tout seul)

TypeScript infère un paramètre de type à partir des **arguments**, puis propage cette inférence jusqu'au type de retour. Tu n'écris jamais `pick<Family, 'nom'>(...)` : le compilateur le déduit de `family` et de `['nom']`.

```ts
function premier<T>(liste: T[]): T | undefined {
  return liste[0];
}

const n = premier([1, 2, 3]);          // T inféré = number  -> n: number | undefined
const s = premier(['a', 'b']);         // T inféré = string  -> s: string | undefined
const f = premier([family]);           // T inféré = Family  -> f: Family | undefined
```

Le point clé : **le site d'appel choisit `T`**, pas la définition. La signature décrit une relation (« le retour a le même type d'élément que le tableau »), le compilateur la résout à chaque appel.

### 2.3 Generics multiples liés (un paramètre en contraint un autre)

Quand une signature a plusieurs paramètres de type, le vrai pouvoir vient de les **lier** entre eux. `K extends keyof T` est l'exemple canonique : `K` n'est pas libre, il est borné par `T`.

```ts
// map une fonction sur chaque élément : le retour dépend de T ET de U
function mapArray<T, U>(liste: T[], fn: (item: T) => U): U[] {
  return liste.map(fn);
}

const noms = mapArray([family], (f) => f.nom); // T=Family, U=string -> string[]

// K borné par T : impossible de demander une clé hors de T
function getProp<T, K extends keyof T>(obj: T, cle: K): T[K] {
  return obj[cle];
}

const ville = getProp(family, 'ville');       // T[K] = string
const count = getProp(family, 'membreCount'); // T[K] = number
// getProp(family, 'xxx');                     // ERREUR : "xxx" ∉ keyof Family
```

`T[K]` est un **accès indexé** : le type de la propriété `K` dans `T`. Comme `K` est une union possible de clés, `T[K]` suit précisément.

### 2.4 `keyof` et accès indexé poussés

`keyof T` produit l'union des clés. Combiné à l'accès indexé, ça permet de dériver des types au lieu de les recopier.

```ts
type FamilyKeys = keyof Family;          // "id" | "nom" | "ville" | "membreCount" | "createdAt"
type FamilyValues = Family[keyof Family]; // string | number  (union de tous les types de valeur)

// Accès indexé sur une union de clés -> union des types correspondants
type NomOuVille = Family['nom' | 'ville']; // string
```

Deux usages concrets qui reviennent partout :

```ts
// Récupérer le type d'élément d'un tableau typé, sans le réécrire
type Membre = { id: string; role: 'admin' | 'membre' };
type Membres = Membre[];
type UnMembre = Membres[number];  // Membre  (T[number] = type d'élément)

// Récupérer le type d'une valeur de config sans le recopier
const config = { theme: 'sombre', maxMembres: 50 } as const;
type Theme = (typeof config)['theme'];  // "sombre"
```

### 2.5 Contraintes `extends keyof` (le cœur de `pick`)

`K extends keyof T` signifie : `K` doit être **une ou plusieurs clés de `T`**. C'est ce qui rend `pick` sûr et son retour précis via l'utility `Pick<T, K>`.

```ts
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

const apercu = pick(family, ['nom', 'membreCount']);
// type inféré : Pick<Family, "nom" | "membreCount"> = { nom: string; membreCount: number }
```

Ici `K` est inféré comme l'**union** `"nom" | "membreCount"` à partir du littéral `['nom', 'membreCount']`, et `Pick<T, K>` reconstruit l'objet réduit. Aucun `as`, aucun `any` côté appelant.

### 2.6 Factories et builders génériques

Une **factory** générique fabrique des valeurs typées à la demande. Un **builder** enchaîne des étapes en accumulant du type.

```ts
// Factory : crée un "repository" typé pour n'importe quelle entité
interface Repository<T> {
  getById(id: string): T | undefined;
  all(): T[];
}

function createRepository<T extends { id: string }>(seed: T[]): Repository<T> {
  const data = [...seed];
  return {
    getById: (id) => data.find((x) => x.id === id),
    all: () => data,
  };
}

const familyRepo = createRepository([family]); // Repository<Family>
const one = familyRepo.getById('f1');          // Family | undefined
```

```ts
// Builder : chaque étape enrichit l'état accumulé, return this permet le chaînage
class QueryBuilder<T> {
  private filtres: Array<(x: T) => boolean> = [];

  where<K extends keyof T>(cle: K, valeur: T[K]): this {
    this.filtres.push((x) => x[cle] === valeur);
    return this;
  }

  run(source: T[]): T[] {
    return source.filter((x) => this.filtres.every((f) => f(x)));
  }
}

const lyonnaises = new QueryBuilder<Family>()
  .where('ville', 'Lyon')      // valeur contrainte à string (type de Family['ville'])
  .where('membreCount', 4)     // valeur contrainte à number
  .run([family]);
// .where('ville', 42);        // ERREUR : 42 n'est pas assignable à string
```

Le `return this` typé permet le chaînage. La contrainte `K extends keyof T` + `valeur: T[K]` garantit que la valeur du filtre correspond au type réel de la colonne.

### 2.7 Higher-order generic functions (fonctions qui prennent/rendent des fonctions)

Quand une fonction reçoit ou retourne une fonction, on veut préserver la signature à travers le wrapper. On généralise sur le **tuple d'arguments**.

```ts
// Un wrapper "once" : n'exécute fn qu'une fois, garde exactement sa signature
function once<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  let appelee = false;
  let cache: TResult;
  return (...args: TArgs) => {
    if (!appelee) {
      cache = fn(...args);
      appelee = true;
    }
    return cache;
  };
}

const initFamille = once((id: string, nom: string) => ({ id, nom }));
initFamille('f1', 'Durand'); // OK — signature (string, string) préservée
// initFamille(42);          // ERREUR : arguments attendus (string, string)
```

`TArgs extends unknown[]` capture le tuple de paramètres ; `TResult` capture le retour. Le wrapper est transparent pour le typage.

### 2.8 `NoInfer` (TS 5.4) — verrouiller un paramètre d'inférence

Par défaut, TypeScript infère un paramètre de type depuis **tous** les emplacements où il apparaît. Parfois c'est nuisible : un site élargit `T` alors qu'on voulait le figer sur un autre.

```ts
// Problème : la valeur par défaut élargit T au lieu de le fixer sur la liste.
// `readonly T[]` + `as const` sur l'appel : sans le `as const`, les littéraux
// d'un tableau nu s'élargissent en `string` (T = string) et TOUT est accepté —
// on ne verrait même pas le bug qu'on veut démontrer.
function creerReglage<T>(valeurs: readonly T[], defaut: T): T {
  return defaut;
}

// T inféré depuis les DEUX arguments : `valeurs` fixe "sombre" | "clair",
// `defaut` ajoute "auto" → T = "sombre" | "clair" | "auto". "auto" accepté à tort.
const r = creerReglage(['sombre', 'clair'] as const, 'auto');
```

`NoInfer<T>` dit au compilateur : « n'utilise PAS cet emplacement pour inférer `T` ». `T` est alors déterminé par le premier argument seulement.

```ts
function creerReglage<T>(valeurs: readonly T[], defaut: NoInfer<T>): T {
  return defaut;
}

const ok = creerReglage(['sombre', 'clair'] as const, 'sombre'); // OK
// const ko = creerReglage(['sombre', 'clair'] as const, 'auto'); // ERREUR : "auto" ∉ "sombre" | "clair"
```

> **La vraie règle.** Les littéraux d'un tableau nu (`['sombre', 'clair']`) **s'élargissent en `string`** : sans `as const`, `T = string` et `NoInfer` ne sert à rien puisque `'auto'` est un `string` valide. `NoInfer` **verrouille une source d'inférence** (il empêche `defaut` d'élargir `T`) mais il **ne restreint pas un type déjà élargi**. C'est le `as const` qui garde les littéraux étroits ; `NoInfer` qui empêche le second argument de rouvrir l'union.

`NoInfer` est un utility natif depuis **TypeScript 5.4** (mai 2024) — pas besoin de le redéfinir à la main.

### 2.9 Variance en survol (co / contravariance)

La **variance** décrit comment la compatibilité d'un type conteneur suit celle de son paramètre. Intuition rapide :

- **Covariance** (sorties, lectures) : si `Chat` est un `Animal`, alors `Chat[]` est un `Animal[]`. Le conteneur varie *dans le même sens* que son contenu.
- **Contravariance** (entrées, paramètres de fonction) : une fonction qui accepte un `Animal` peut remplacer une qui accepte un `Chat` — elle varie *en sens inverse*.

```ts
interface Animal { nom: string; }
interface Chat extends Animal { ronronne: boolean; }

const chats: Chat[] = [{ nom: 'Félix', ronronne: true }];
const animaux: Animal[] = chats;        // covariance : OK en lecture

type Traite<T> = (x: T) => void;
const traiteAnimal: Traite<Animal> = (a) => console.log(a.nom);
const traiteChat: Traite<Chat> = traiteAnimal; // contravariance : une fn Animal fait le job d'une fn Chat
```

> Ce module ne fait qu'**introduire** la variance pour que tu reconnaisses le mot. Le traitement complet (soundness, `strictFunctionTypes`, annotations `in`/`out`) est le **module 15**.

### 2.10 Quand un generic est de trop

Un generic n'a de sens que s'il **relie** au moins deux positions. S'il n'apparaît qu'une fois, ou si tu ne l'utilises jamais pour lier entrée et sortie, il ne fait que compliquer la signature.

```ts
// ❌ Generic inutile : T n'apparaît qu'à un seul endroit, il ne lie rien
function afficher<T>(valeur: T): void {
  console.log(valeur);
}
// Aucune relation exprimée -> `unknown` dit exactement la même chose, plus honnêtement
function afficher2(valeur: unknown): void {
  console.log(valeur);
}

// ❌ Generic "fantôme" : renvoyé en any déguisé
function parse<T>(json: string): T {
  return JSON.parse(json); // MENSONGE : rien ne garantit que le résultat est un T
}
// ✅ Sois honnête : renvoie unknown et laisse l'appelant valider
function parse2(json: string): unknown {
  return JSON.parse(json);
}
```

**Règle de décision :** garde le generic seulement s'il apparaît **au moins deux fois** dans la signature (paramètre + retour, ou deux paramètres liés). Sinon `unknown` (ou un type concret) est plus clair.

---

## 3. Worked examples

### Exemple 1 — `pick` maison, résolu pas à pas (TribuZen)

On reprend le cas concret et on le construit de zéro.

```ts
// ─── types/family.ts ─────────────────────────────────────────────
export interface Family {
  id: string;
  nom: string;
  ville: string;
  membreCount: number;
  createdAt: string;
}

// ─── utils/pick.ts ───────────────────────────────────────────────
// Étape 1 : deux paramètres de type. T = l'objet source.
//           K = les clés voulues, BORNÉES par keyof T.
// Étape 2 : keys est un tableau de K -> K sera inféré comme l'UNION des clés passées.
// Étape 3 : le retour Pick<T, K> reconstruit l'objet réduit aux clés K.
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // `as Pick<T, K>` : on part d'un objet vide qu'on remplit ; l'assertion cible
  // le type final, justifiée car la boucle copie précisément les clés K.
  const out = {} as Pick<T, K>;
  for (const k of keys) {
    out[k] = obj[k]; // obj[k] : T[K], out[k] attend T[K] -> compatible
  }
  return out;
}

// ─── usage ───────────────────────────────────────────────────────
const family: Family = {
  id: 'f1', nom: 'Durand', ville: 'Lyon', membreCount: 4, createdAt: '2026-01-01',
};

const carte = pick(family, ['nom', 'ville']);
// K inféré = "nom" | "ville"
// type de carte = Pick<Family, "nom" | "ville"> = { nom: string; ville: string }
carte.nom;   // string ✅
carte.ville; // string ✅
// carte.membreCount;               // ERREUR : n'existe pas sur le type réduit
// pick(family, ['nom', 'zzz']);    // ERREUR : "zzz" n'est pas une clé de Family
```

**Ce que cet exemple prouve :**
- `K` se déduit **du littéral de clés**, pas d'une annotation manuelle.
- Le retour est *exactement* l'objet réduit, pas `any` ni `Partial`.
- Toute typo de clé est une erreur de compilation, côté appelant comme côté implémentation.

### Exemple 2 — Query builder générique + `NoInfer` (fading)

On monte d'un cran : un builder qui filtre des familles, avec une méthode `where` où l'on **verrouille** le type de la valeur sur celui de la colonne.

```ts
// ─── query/QueryBuilder.ts ───────────────────────────────────────
class QueryBuilder<T> {
  private predicats: Array<(x: T) => boolean> = [];

  // K borné par keyof T ; valeur bornée par T[K] -> impossible de comparer une
  // colonne string à un number. NoInfer<T[K]> empêche `valeur` d'élargir K.
  where<K extends keyof T>(cle: K, valeur: NoInfer<T[K]>): this {
    this.predicats.push((x) => x[cle] === valeur);
    return this; // `this` typé -> chaînage fluide
  }

  // Prédicat libre, pour les cas non couverts par une égalité simple
  filter(fn: (x: T) => boolean): this {
    this.predicats.push(fn);
    return this;
  }

  run(source: readonly T[]): T[] {
    return source.filter((x) => this.predicats.every((p) => p(x)));
  }
}

// ─── usage ───────────────────────────────────────────────────────
const familles: Family[] = [
  { id: 'f1', nom: 'Durand', ville: 'Lyon', membreCount: 4, createdAt: '2026-01-01' },
  { id: 'f2', nom: 'Martin', ville: 'Paris', membreCount: 2, createdAt: '2026-02-01' },
  { id: 'f3', nom: 'Bernard', ville: 'Lyon', membreCount: 5, createdAt: '2026-03-01' },
];

const grandesLyonnaises = new QueryBuilder<Family>()
  .where('ville', 'Lyon')                 // valeur: string (= Family['ville'])
  .filter((f) => f.membreCount >= 4)      // prédicat libre
  .run(familles);
// -> [Durand, Bernard]

// .where('membreCount', 'quatre');       // ERREUR : 'quatre' ∉ number
// .where('ville', 5);                     // ERREUR : 5 ∉ string
```

**Pourquoi `NoInfer` ici :** sans lui, `where('ville', valeur)` pourrait, dans des cas tordus (valeur d'un type plus large), pousser TypeScript à ré-inférer `T[K]` depuis l'argument `valeur` et diluer la contrainte. `NoInfer<T[K]>` fige la source d'inférence sur la **clé**, et fait de `valeur` un simple consommateur du type déjà décidé.

**Variante mentale (J+30, voir lab) :** ajoute une méthode `orderBy<K extends keyof T>(cle: K)` qui trie sur une colonne — même schéma `extends keyof`, tri via `a[cle] < b[cle]`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire qu'on doit passer les types explicitement

```ts
// ❌ Redondant : les types sont déjà déductibles des arguments
const carte = pick<Family, 'nom' | 'ville'>(family, ['nom', 'ville']);

// ✅ Laisse l'inférence faire — plus court, aussi sûr
const carte2 = pick(family, ['nom', 'ville']);
```

**Règle :** n'annote explicitement `<...>` que si l'inférence échoue ou choisit un type trop large. Le cas normal, c'est zéro annotation au site d'appel.

### PIÈGE #2 — `K extends keyof T` vs `keys: string[]`

```ts
// ❌ keys: string[] -> aucune vérification, retour any
function pickFaux<T>(obj: T, keys: string[]): any { /* ... */ }

// ✅ K extends keyof T -> clés vérifiées, retour Pick<T, K> précis
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> { /* ... */ }
```

`string[]` accepte n'importe quelle chaîne et jette l'information. La contrainte `extends keyof T` est ce qui relie les clés à l'objet et rend le retour exploitable.

### PIÈGE #3 — Le generic « fantôme » qui ment (faux ami de `any`)

```ts
// ❌ T n'est contraint par rien ni inféré depuis un argument : c'est un any déguisé
function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json()); // rien ne garantit la forme T
}
const u = await fetchJson<Family>('/api/f1'); // "Family" est une PROMESSE non tenue

// ✅ Renvoie unknown et valide (schéma, type guard) avant d'affirmer le type
async function fetchJson2(url: string): Promise<unknown> {
  return (await fetch(url)).json();
}
```

**Signal d'alarme :** un paramètre de type qui n'apparaît qu'au **retour** et n'est déduit d'aucun argument ne prouve rien — il déplace juste le `any` sous le tapis.

### PIÈGE #4 — Ajouter un generic qui ne lie rien

```ts
// ❌ T n'apparaît qu'une fois -> il ne modélise aucune relation
function longueur<T>(x: T[]): number {
  return x.length;
}

// ✅ Pas besoin de generic si le retour ne dépend pas de T
function longueur2(x: unknown[]): number {
  return x.length;
}
```

**Règle (rappel) :** un generic utile apparaît **au moins deux fois**. S'il n'apparaît qu'une fois, supprime-le.

### PIÈGE #5 — Oublier `NoInfer` et laisser un argument élargir le type

```ts
// ❌ `defaut` participe à l'inférence -> T s'élargit et accepte une valeur hors liste.
// NB : `readonly T[]` + `as const` sont indispensables — sans eux, les littéraux
// du tableau nu s'élargissent en `string`, T = string, et 'z' passerait de toute
// façon (le bug serait invisible ET NoInfer sans effet).
function withDefault<T>(options: readonly T[], defaut: T): T { return defaut; }
withDefault(['a', 'b'] as const, 'z'); // T devient "a" | "b" | "z" -> 'z' passe à tort

// ✅ NoInfer verrouille la source d'inférence sur `options`
function withDefault2<T>(options: readonly T[], defaut: NoInfer<T>): T { return defaut; }
// withDefault2(['a', 'b'] as const, 'z'); // ERREUR attendue : 'z' ∉ "a" | "b"
```

> Rappel : `NoInfer` verrouille une **source d'inférence**, il ne restreint pas un type déjà élargi. Le `as const` garde les littéraux étroits ; `NoInfer` empêche le second argument de rouvrir l'union.

---

## 5. Ancrage TribuZen

Ces patterns forment la couche « accès aux données typé » de l'admin TribuZen.

**`pick<T, K>`** (`src/utils/pick.ts`) — utilisé partout où une vue n'a besoin que d'un sous-ensemble de champs : la liste des familles (`pick(family, ['nom', 'membreCount'])`), les tooltips, les payloads d'API allégés. Un seul helper, typé, remplace des dizaines d'objets `{ nom: f.nom, ... }` recopiés à la main.

**`QueryBuilder<T>`** (`src/query/QueryBuilder.ts`) — le moteur de filtrage des tableaux TribuZen. La page « Familles » l'instancie en `QueryBuilder<Family>` et enchaîne `.where('ville', 'Lyon')`, `.filter(f => f.membreCount >= 4)`. La contrainte `K extends keyof T` + `valeur: NoInfer<T[K]>` garantit qu'aucun filtre ne peut comparer une colonne à une valeur du mauvais type — une classe entière de bugs éliminée à la compilation.

**`createRepository<T>`** (`src/data/createRepository.ts`) — factory qui produit un repo typé (`getById`, `all`) pour chaque entité du domaine (`Family`, `Member`, `Event`). Le même code, spécialisé par le type passé à l'appel.

**`NoInfer`** — mobilisé dès qu'un helper a une valeur par défaut ou un argument « consommateur » qui ne doit pas participer à l'inférence (colonnes de filtre, valeurs de repli des réglages admin).

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/
  utils/
    pick.ts
  query/
    QueryBuilder.ts
  data/
    createRepository.ts
  types/
    family.ts
```

---

## 6. Points clés

1. Un generic ne vaut que s'il **relie** deux positions d'une signature (paramètre ↔ retour, ou paramètre ↔ paramètre) ; sinon il est de trop.
2. TypeScript infère les paramètres de type depuis les **arguments** et propage jusqu'au retour — on annote `<...>` seulement en dernier recours.
3. `K extends keyof T` borne une clé à l'objet ; couplé à l'accès indexé `T[K]`, il type précisément un accès dynamique.
4. `Pick<T, K>` est le retour naturel d'un `pick` maison : l'objet réduit exactement aux clés demandées.
5. Une factory générique fabrique des valeurs typées à la demande ; un builder accumule du type via `return this`.
6. Les higher-order functions se typent en généralisant sur le tuple d'arguments : `<TArgs extends unknown[], TResult>`.
7. `NoInfer<T>` (TS 5.4) exclut un emplacement de l'inférence, pour verrouiller `T` sur la source voulue.
8. La variance (co/contravariance) décrit la compatibilité des conteneurs — introduite ici, approfondie au module 15.

---

## 7. Seeds Anki

```
Pourquoi le retour de pick<T, K extends keyof T> vaut-il Pick<T, K> et pas any ?|Parce que K est inféré comme l'union exacte des clés passées, et Pick<T, K> reconstruit l'objet réduit à ces clés. On garde l'autocomplétion et la détection de typo côté appelant.
Que signifie la contrainte K extends keyof T ?|K doit être une (ou plusieurs) clé(s) réelle(s) de T. Toute clé absente de T devient une erreur de compilation. Couplé à T[K] (accès indexé), le type de la valeur suit précisément la clé.
Quand un paramètre de type générique est-il inutile ?|Quand il n'apparaît qu'une seule fois dans la signature : il ne relie rien. Un generic utile apparaît au moins deux fois (paramètre + retour, ou deux paramètres liés). Sinon, préférer unknown ou un type concret.
Qu'est-ce qu'un generic "fantôme" et pourquoi c'est dangereux ?|Un paramètre de type qui n'apparaît qu'au retour sans être déduit d'aucun argument (ex : function parse<T>(s): T). Rien ne garantit la forme T : c'est un any déguisé. Renvoyer unknown et valider est plus honnête.
À quoi sert NoInfer<T> (TS 5.4) ?|À exclure un emplacement de l'inférence de T. Ex : where<K extends keyof T>(cle, valeur: NoInfer<T[K]>) — la valeur ne peut plus élargir ni ré-inférer le type ; T[K] est décidé par la clé seule.
Comment typer un wrapper de fonction qui préserve la signature (higher-order) ?|En généralisant sur le tuple d'arguments et le retour : function once<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult): (...args: TArgs) => TResult. Le wrapper reste transparent au typage.
Différence entre covariance et contravariance en une phrase ?|Covariance : le conteneur varie dans le même sens que son contenu (Chat[] est un Animal[], en lecture). Contravariance : les paramètres de fonction varient en sens inverse (une fn (x: Animal) => void remplace une fn (x: Chat) => void). Détaillé au module 15.
Comment TypeScript choisit-il la valeur d'un paramètre de type générique ?|Au site d'appel, à partir des arguments fournis, puis il propage cette inférence jusqu'au type de retour. La définition décrit une relation ; chaque appel la résout indépendamment.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-07-generics-avances/README.md`. Construire `pick<T, K>` maison, puis un `QueryBuilder<Family>` générique verrouillé par `NoInfer`, et retirer un generic superflu — le tout en TypeScript strict.
