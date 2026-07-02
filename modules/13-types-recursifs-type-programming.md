---
titre: Types récursifs et type-level programming
cours: 00-typescript
notions: [types récursifs, DeepPartial, DeepReadonly, type JSON récursif, récursion sur tuples, length reverse tail, accumulateurs de types, tail-call des types, limite de profondeur de récursion, coût de compilation, quand ne pas faire de type-programming]
outcomes: [écrire un type récursif sûr avec cas d'arrêt, construire DeepReadonly et DeepPartial, dérouler un tuple avec un accumulateur, reconnaître et éviter Type instantiation is excessively deep, décider quand le type-programming nuit à la maintenabilité]
prerequis: [12-mapped-types-template-literals]
next: 14-decorateurs-metadata
libs: [{ name: typescript, version: "^5" }]
tribuzen: types utilitaires TribuZen - DeepReadonly d'une Family figée, DeepPartial d'un Member pour un patch profond, Paths des clés
last-reviewed: 2026-07
---

# Types récursifs et type-level programming

> **Outcomes — tu sauras FAIRE :** écrire un type récursif avec cas d'arrêt, construire `DeepReadonly`/`DeepPartial`, dérouler un tuple avec accumulateur, reconnaître l'erreur `Type instantiation is excessively deep` et décider quand NE PAS faire de type-programming.
> **Difficulté :** :star::star::star::star::star:

> **Ce module est un cran au-dessus.** L'objet n'est pas de te transformer en gymnaste du système de types. C'est de savoir écrire les 3-4 types récursifs *utiles* (deep partial, deep readonly, chemins de clés), de reconnaître quand tu tapes dans un mur (profondeur, temps de compil), et surtout de savoir t'arrêter avant que le type devienne moins lisible que le code qu'il protège.

## 1. Cas concret d'abord

Dans l'admin TribuZen, une `Family` porte des données imbriquées : la famille, ses réglages, la liste de ses membres. Deux besoins réels, contradictoires en apparence :

```ts
interface Address {
  city: string;
  zip: string;
}

interface Member {
  id: string;
  displayName: string;
  email?: string;
  address: Address;          // objet imbriqué
}

interface Family {
  id: string;
  name: string;
  settings: {                // objet imbriqué
    isPublic: boolean;
    locale: 'fr' | 'en';
  };
  members: Member[];         // tableau d'objets imbriqués
}
```

**Besoin 1 — figer une famille pour l'affichage.** On charge une `Family` depuis l'API et on veut garantir que *rien* ne la mute pendant le rendu — ni `family.name`, ni `family.settings.locale`, ni `family.members[0].address.city`. `Readonly<Family>` ne fige que le premier niveau : `family.settings.locale = 'en'` reste autorisé. Il faut descendre récursivement.

**Besoin 2 — patcher un membre partiellement.** L'endpoint `PATCH /members/:id` reçoit un objet où *n'importe quelle* clé, à *n'importe quelle profondeur*, peut être absente : `{ address: { city: 'Lyon' } }` sans `zip`. `Partial<Member>` ne rend optionnel que le premier niveau : il exige encore un `address` complet. Là aussi, il faut descendre.

`Readonly` et `Partial` sont les briques du module 10. Ici on les fait **descendre en récursion**. C'est exactement l'usage 80/20 des types récursifs. Le reste du module montre aussi le côté « acrobatie » (arithmétique sur tuples) — utile à *lire*, dangereux à *écrire* en prod.

---

## 2. Théorie complète, concise

### 2.1 Un type récursif = un type qui se référence lui-même

Comme une fonction récursive, un type récursif a besoin de deux choses : un **cas général** qui se rappelle, et un **cas d'arrêt** qui termine la descente.

```ts
// Type JSON : une valeur JSON contient d'autres valeurs JSON.
// Cas d'arrêt = les primitives (string, number, boolean, null).
// Cas général = tableau ou objet de JsonValue.
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const ok: JsonValue = { nom: 'Alice', tags: ['a', 'b'], meta: { n: 1 } };
// const ko: JsonValue = { fn: () => {} }; // ❌ une fonction n'est pas du JSON
```

Ici la récursion est *structurelle* (l'objet peut contenir des objets). TypeScript l'autorise sans limite pratique parce qu'elle décrit une forme, elle ne *calcule* rien.

### 2.2 DeepReadonly — figer en profondeur

On combine un **mapped type** (module 12) avec un **conditional type** (module 11) qui se rappelle sur chaque valeur.

```ts
type DeepReadonly<T> =
  T extends (infer U)[]                       // cas tableau
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object                        // cas objet
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;                                     // cas d'arrêt : primitive

type FrozenFamily = DeepReadonly<Family>;
// family.settings.locale = 'en'          → ❌ Cannot assign, readonly
// family.members[0].address.city = 'x'   → ❌ readonly jusqu'en bas
```

Lecture : « si c'est un tableau, fige ses éléments récursivement ; sinon si c'est un objet, remappe chaque clé en `readonly` + récursion sur la valeur ; sinon (primitive) rends tel quel ». Le cas d'arrêt est la primitive : `string`, `number`, `boolean` ne matchent ni `[]` ni `object`, la récursion s'arrête.

> Note : on traite les tableaux *avant* `object` car en TS un tableau **est** un `object`. Sans la branche tableau en premier, on mapperait les index numériques et on perdrait `ReadonlyArray`.

### 2.3 DeepPartial — rendre optionnel en profondeur

Même squelette, mais on ajoute le modificateur `?` à chaque niveau.

```ts
type DeepPartial<T> =
  T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

type MemberPatch = DeepPartial<Member>;
const patch: MemberPatch = { address: { city: 'Lyon' } }; // ✅ zip absent, id absent
```

`{ [K in keyof T]?: ... }` : le `?` rend chaque clé optionnelle, et `DeepPartial<T[K]>` propage l'optionnalité aux sous-objets.

### 2.4 Récursion sur les tuples

Un tuple se déstructure au niveau des types avec `infer` et le rest `...`. C'est le pattern de base de tout parcours de tuple.

```ts
// Tail : tout sauf le premier
type Tail<T extends readonly unknown[]> =
  T extends readonly [unknown, ...infer Rest] ? Rest : [];

type T1 = Tail<[1, 2, 3]>;   // [2, 3]

// Length : propriété native, PAS besoin de récursion
type Length<T extends readonly unknown[]> = T['length'];
type L1 = Length<[1, 2, 3]>; // 3

// Reverse : récursion — on retire la tête et on la remet à la fin
type Reverse<T extends readonly unknown[]> =
  T extends readonly [infer Head, ...infer Rest]
    ? [...Reverse<Rest>, Head]
    : [];

type R1 = Reverse<[1, 2, 3]>; // [3, 2, 1]
```

Retiens que `T['length']` est natif : n'écris jamais un compteur récursif quand une propriété existe. C'est la première règle anti-coût.

### 2.5 Accumulateurs de types et tail-call

Comme en programmation fonctionnelle, un **accumulateur** (paramètre générique avec valeur par défaut) sert à construire le résultat en position terminale. Depuis TS 4.5, quand l'appel récursif est *directement* le résultat (pas enveloppé dans un `[...X, ...]`), le compilateur applique une optimisation « tail-call » et supporte des profondeurs bien plus grandes.

```ts
// ❌ NON tail : l'appel récursif est enveloppé dans [...Reverse<Rest>, Head]
type ReverseNaive<T extends readonly unknown[]> =
  T extends [infer H, ...infer R] ? [...ReverseNaive<R>, H] : [];

// ✅ Tail : l'appel récursif EST le résultat, l'accumulateur porte le travail
type ReverseTail<T extends readonly unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer R]
    ? ReverseTail<R, [H, ...Acc]>   // rien autour de l'appel → tail-call
    : Acc;

type R2 = ReverseTail<[1, 2, 3]>; // [3, 2, 1], tient sur de gros tuples
```

Même résultat, mais la version accumulateur encaisse des tuples beaucoup plus longs avant de saturer.

### 2.6 La limite de récursion — le mur réel

TypeScript borne la profondeur de récursion (~50 instanciations en position non-tail, plus haut en tail) pour éviter les boucles infinies et protéger les temps de compilation. Au-delà :

```
Type instantiation is excessively deep and possibly infinite. ts(2589)
```

```ts
type BuildTuple<N extends number, Acc extends unknown[] = []> =
  Acc['length'] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>;

type Ok = BuildTuple<40>;      // ✅ ok
// type Boom = BuildTuple<900>; // ❌ ts(2589) Type instantiation is excessively deep
```

Ce n'est pas un bug à contourner : c'est un **signal**. Si tu heurtes ce mur, la question n'est presque jamais « comment forcer plus de profondeur » mais « pourquoi je calcule ça au niveau des types ».

### 2.7 Le coût de compilation

Chaque instanciation de type conditionnel récursif a un coût. Un type-programme trop ambitieux ne « plante » pas toujours — il rend surtout ton éditeur lent : autocomplétion qui rame, `tsc` qui passe de 3 s à 30 s, erreurs affichées avec 2 s de retard. Ce coût est invisible en revue de code et bien réel au quotidien. `tsc --extendedDiagnostics` (temps de check) et `tsc --generateTrace` (profil détaillé) permettent de le mesurer si un fichier devient lent.

### 2.8 Quand NE PAS faire de type-programming

C'est la partie la plus importante du module. Le type-level programming est **puissant mais à doser**. Repères de décision :

| Situation | Verdict |
|---|---|
| `DeepPartial`, `DeepReadonly`, un `Paths<T>` pour un helper d'accès | ✅ légitime, réutilisable, borné |
| Type utilitaire dans une **librairie** consommée par d'autres | ✅ le coût est amorti sur les usagers |
| Arithmétique sur tuples, parser, FizzBuzz au niveau des types | 🎓 exercice de compréhension, à *lire* — pas en prod |
| Le type est plus long/complexe que le code runtime qu'il valide | ❌ inverse le rapport coût/valeur |
| Tu heurtes `ts(2589)` et tu cherches à « forcer » | ❌ recule, valide à l'exécution (Zod, un test) |
| Un collègue devra maintenir ce type sans toi | ❌ si tu ne peux pas l'expliquer en 2 phrases, simplifie |

Règle honnête : **le meilleur type récursif est le plus court qui règle un vrai problème.** Passé ce point, chaque niveau de finesse se paie en lisibilité et en temps de compilation — souvent au bénéfice de personne. Une validation runtime (module Zod plus tard) est fréquemment plus robuste, plus lisible et *plus sûre* qu'un type-programme acrobatique, parce qu'elle vérifie de vraies valeurs, pas juste des formes.

---

## 3. Worked examples

### Exemple 1 — `DeepReadonly<Family>` pas à pas

Objectif : figer une `Family` entière, membres et adresses compris.

```ts
type DeepReadonly<T> =
  T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

type FrozenFamily = DeepReadonly<Family>;

declare const f: FrozenFamily;

f.name;                         // string (lecture ok)
// f.name = 'x';                // ❌ readonly niveau 1
// f.settings.locale = 'en';    // ❌ readonly niveau 2 (l'objet settings)
// f.members[0].address.city='';// ❌ readonly niveau 3 (dans le tableau)
```

Déroulé pour `f.members[0].address.city` :
1. `Family` est un `object` → on remappe chaque clé en `readonly`, dont `members`.
2. `members` est `Member[]` → branche tableau → `ReadonlyArray<DeepReadonly<Member>>`.
3. `Member` est un `object` → remap `readonly`, dont `address`.
4. `address` est un `object` → remap `readonly`, dont `city`.
5. `city` est `string` → cas d'arrêt, rendu tel quel mais la clé qui le porte est `readonly`.

Chaque niveau ajoute *un* `DeepReadonly` : profondeur = imbrication réelle de `Family`, soit 3-4. Aucun risque de `ts(2589)` sur une structure métier normale.

### Exemple 2 — `DeepPartial<Member>` pour un patch, avec la nuance tableau

Objectif : typer le body d'un `PATCH` où tout est optionnel en profondeur.

```ts
type DeepPartial<T> =
  T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

type MemberPatch = DeepPartial<Member>;

const p1: MemberPatch = {};                          // ✅ patch vide
const p2: MemberPatch = { displayName: 'Bob' };      // ✅ un champ
const p3: MemberPatch = { address: { city: 'Lyon' } }; // ✅ sous-objet partiel
// const p4: MemberPatch = { address: { city: 1 } };   // ❌ city reste un string
```

Point de vigilance sur les tableaux : `DeepPartial` rend les *éléments* partiels (`DeepPartial<U>[]`) mais **pas** le tableau lui-même optionnel élément par élément. Un `Member[]` patché reste « une liste d'éléments partiels », pas « une liste à trous ». Pour un vrai patch d'API on remplace en général le tableau entier — un patch profond *dans* un tableau est un mauvais signal de design côté endpoint.

### Exemple 3 (survol) — `Paths<T>` : les chemins de clés

Type récursif qui produit l'union des chemins pointés d'un objet. À *lire* et comprendre — on ne le réécrit pas de tête.

```ts
type Paths<T> =
  T extends object
    ? {
        [K in keyof T & string]:
          T[K] extends object
            ? K | `${K}.${Paths<T[K]>}`   // clé seule OU clé.sous-chemin
            : K;
      }[keyof T & string]
    : never;

type FamilyPaths = Paths<Family>;
// "id" | "name" | "settings" | "settings.isPublic" | "settings.locale"
// | "members" | "members.length" | "members.at" | "members.push" | ...  ⚠️
```

> **⚠️ Ce `Paths` ne gère PAS les tableaux.** Un tableau est un `object`, donc `members: Member[]` fait récurser `Paths<Member[]>` sur les **clés du prototype Array** : la sortie se pollue de `"members.length"`, `"members.at"`, `"members.push"`… et ne produit **jamais** `"members.0.displayName"`. Avant d'exiger un `Paths` sur un modèle avec tableaux (c'est le cas dans la variante J+30 du lab, `members: Member[]`), il faut le **borner** : traiter tout tableau comme une **feuille** (on ne descend pas dedans). Une clause en tête suffit —
>
> ```ts
> type Paths<T> =
>   T extends readonly unknown[]
>     ? never // ne pas indexer un tableau : arrête la récursion ici
>     : T extends object
>       ? { [K in keyof T & string]:
>             T[K] extends readonly unknown[]
>               ? K                                   // "members" reste une feuille
>               : T[K] extends object
>                 ? K | `${K}.${Paths<T[K]>}`
>                 : K;
>         }[keyof T & string]
>       : never;
> // => "id" | "name" | "settings" | "settings.isPublic" | "settings.locale" | "members"
> // (plus de "members.length"/"members.push")
> ```

Usage typique : contraindre une fonction `get(family, path)` à n'accepter que des chemins valides. C'est le cas d'usage *légitime* d'un type récursif un peu poussé : il sécurise une vraie API d'accès. Même bornée aux tableaux, méfiance — sur un modèle très profond, `Paths<T>` explose combinatoirement et peut déclencher `ts(2589)`. Si ça arrive : borne aussi la profondeur ou repasse à un `string` simple validé à l'exécution.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Oublier le cas d'arrêt

```ts
// ❌ Pas de branche primitive → la récursion ne termine jamais proprement
type DeepReadonlyKO<T> = { readonly [K in keyof T]: DeepReadonlyKO<T[K]> };
// Sur T[K] = string, keyof string donne les méthodes de String → bruit/erreurs

// ✅ La branche `: T` finale arrête sur les primitives
type DeepReadonlyOK<T> =
  T extends object ? { readonly [K in keyof T]: DeepReadonlyOK<T[K]> } : T;
```

Un type récursif SANS cas d'arrêt est l'équivalent d'une fonction sans condition de sortie.

### PIÈGE #2 — Traiter `object` avant les tableaux

```ts
// ❌ Un array EST un object → cette branche l'attrape et mappe ses index
type DeepRO_KO<T> =
  T extends object ? { readonly [K in keyof T]: DeepRO_KO<T[K]> } : T;
// DeepRO_KO<string[]> devient un objet indexé, pas un ReadonlyArray

// ✅ Tester le tableau EN PREMIER
type DeepRO_OK<T> =
  T extends (infer U)[] ? ReadonlyArray<DeepRO_OK<U>>
  : T extends object ? { readonly [K in keyof T]: DeepRO_OK<T[K]> }
  : T;
```

Ordre des branches conditionnelles : du plus spécifique (tableau) au plus général (objet).

### PIÈGE #3 — Croire que `ts(2589)` est un bug à contourner

```ts
type BuildTuple<N extends number, A extends unknown[] = []> =
  A['length'] extends N ? A : BuildTuple<N, [...A, unknown]>;
// type X = BuildTuple<5000>; // ts(2589)
```

Ce n'est pas TypeScript qui « bloque » : c'est un garde-fou contre une boucle potentiellement infinie et un temps de compilation explosif. **Le corriger ne veut pas dire pousser la limite** — ça veut dire reconsidérer si ce calcul doit vraiment vivre dans les types.

### PIÈGE #4 — Confondre récursion structurelle et récursion calculatoire

```ts
// Récursion STRUCTURELLE : décrit une forme, coût quasi nul, illimitée en pratique
type Tree<T> = { value: T; children: Tree<T>[] };

// Récursion CALCULATOIRE : le compilateur déroule un calcul, coût réel, bornée
type Multiply<A extends number, B extends number, Acc extends unknown[] = []> =
  never; // (implémentation lourde — voir exercices type-challenges)
```

La première (arbres, listes, JSON) est bénigne et courante. La seconde (arithmétique, parsing) est ce qui te met en danger. Confondre les deux fait croire que « les types récursifs sont chers » — non, c'est le *calcul* au niveau des types qui l'est.

### PIÈGE #5 — Écrire un type-programme là où une valeur suffit

```ts
// ❌ Valider un format d'email au niveau des types
type IsEmail<S extends string> = S extends `${string}@${string}.${string}` ? S : never;
// Fragile : laisse passer des chaînes absurdes, illisible à étendre, aucun message

// ✅ Valider la VALEUR à l'exécution (aperçu Zod, module ultérieur)
// const Email = z.string().email(); → message d'erreur clair, robuste, testable
```

Si la règle porte sur une *valeur* (contenu d'une string, plage d'un nombre), la valider à l'exécution est presque toujours supérieur à un type-programme.

---

## 5. Ancrage TribuZen

Dans `smaurier/tribuzen`, ces types récursifs vivent dans un module d'utilitaires transverses, `src/types/deep.ts`, et servent trois usages concrets.

**`DeepReadonly<Family>`** — quand le store charge une famille pour l'affichage read-only (page publique d'une tribu), on expose `DeepReadonly<Family>` aux composants. Garantie à la compilation : aucun composant ne peut muter `family.settings.locale` ni `family.members[i].address.city` par accident. Le `readonly` descend jusqu'aux feuilles.

**`DeepPartial<Member>`** — le body de `PATCH /members/:id` est typé `DeepPartial<Member>`. Le front peut envoyer `{ address: { city: 'Lyon' } }` sans reconstruire un `Member` complet, et TS refuse `{ address: { city: 42 } }` (le type feuille reste `string`).

**`Paths<Family>`** (survol) — un helper `getPath(family, path)` typé pour l'export CSV / les colonnes configurables de l'admin : `path` n'accepte que des chemins réels (`"settings.locale"`, `"name"`). Type puissant, mais surveillé : si le modèle grossit et que `Paths` devient lent ou déclenche `ts(2589)`, on retombe sur un `string` validé à l'exécution. C'est exactement la décision « quand s'arrêter » du module, prise sur un cas réel.

```
tribuzen/src/
  types/
    index.ts          ← Family, Member, Address (modèle métier)
    deep.ts           ← DeepReadonly, DeepPartial, Paths (ce module)
  api/
    members.ts        ← PATCH body: DeepPartial<Member>
  features/
    family/
      PublicFamilyView.tsx  ← props: DeepReadonly<Family>
```

**Frontière assumée :** au-delà de ces trois types, TribuZen ne fait *pas* de type-programming. Les validations de contenu (email, code postal, plages) passent par une validation runtime, pas par des types acrobatiques. C'est un choix de maintenabilité, pas une limite de compétence.

---

## 6. Points clés

1. Un type récursif se référence lui-même et exige un **cas d'arrêt** (branche primitive `: T`), comme une fonction récursive exige une condition de sortie.
2. `DeepReadonly<T>` et `DeepPartial<T>` = un mapped type qui se rappelle sur `T[K]` ; ce sont les types récursifs *utiles* du quotidien.
3. Tester le **tableau avant l'objet** : en TS un array est un object, sinon on perd `ReadonlyArray` et on mappe les index.
4. `T['length']` est natif — jamais de compteur récursif quand une propriété existe.
5. Un **accumulateur** en position terminale active la tail-call (TS 4.5+) et encaisse des tuples bien plus longs.
6. `Type instantiation is excessively deep ts(2589)` est un **garde-fou**, pas un bug : recule au lieu de forcer la profondeur.
7. Le type-programming a un **coût de compilation** réel (éditeur lent, `tsc` lent) invisible en revue — mesurable avec `--extendedDiagnostics`.
8. Quand s'arrêter : si le type est plus complexe que le code qu'il protège, ou impossible à expliquer en deux phrases, préfère une **validation runtime**. Le meilleur type récursif est le plus court qui règle un vrai problème.

---

## 7. Seeds Anki

```
Qu'est-ce qui distingue un type récursif d'un type normal, et de quoi a-t-il obligatoirement besoin ?|Il se référence lui-même dans sa définition. Il a besoin d'un cas d'arrêt (une branche qui ne se rappelle pas, typiquement la branche primitive ': T') sinon il ne termine pas.
Pourquoi Readonly<T> ne suffit-il pas pour figer une Family imbriquée, et que fait DeepReadonly ?|Readonly ne fige que le premier niveau : family.settings.locale reste mutable. DeepReadonly est un mapped type récursif qui applique readonly à chaque clé ET se rappelle sur T[K] jusqu'aux primitives.
Dans DeepReadonly/DeepPartial, pourquoi tester le tableau AVANT l'objet ?|En TypeScript un tableau est un object. Si on teste object en premier, la branche attrape le tableau et mappe ses index numériques, on perd ReadonlyArray et la sémantique de liste. Ordre : du plus spécifique au plus général.
Comment récupère-t-on la longueur d'un tuple au niveau des types, et quelle règle de coût cela illustre ?|Avec la propriété native T['length']. Règle : ne jamais écrire un compteur récursif quand une propriété native existe — c'est la première optimisation anti-coût.
Qu'est-ce qu'un accumulateur de types et quel gain apporte la position terminale (tail) ?|Un paramètre générique avec valeur par défaut ([] ou '') qui porte le résultat en construction. Si l'appel récursif EST le résultat (pas enveloppé dans [...X, ...]), TS 4.5+ applique une optimisation tail-call et supporte une profondeur bien plus grande.
Que signifie l'erreur ts(2589) 'Type instantiation is excessively deep' et quelle est la bonne réaction ?|TS a dépassé sa limite de récursion (garde-fou contre boucle infinie et compilation explosive). Bonne réaction : reculer et se demander si ce calcul doit vivre dans les types — pas chercher à forcer plus de profondeur.
Quel est le coût caché du type-programming poussé et comment le mesurer ?|Un coût de compilation : autocomplétion lente, tsc qui passe de secondes à dizaines de secondes, erreurs affichées en retard. Invisible en revue de code. Mesurable avec tsc --extendedDiagnostics et --generateTrace.
Quand NE PAS faire de type-programming ?|Quand le type devient plus complexe que le code runtime qu'il valide, quand la règle porte sur une valeur (email, plage) mieux validée à l'exécution, quand tu heurtes ts(2589) et cherches à forcer, ou quand tu ne peux pas l'expliquer en 2 phrases. Préfère alors une validation runtime.
Quelle est la différence entre récursion structurelle et récursion calculatoire, côté coût ?|Structurelle (arbre, liste, JSON) : décrit une forme, coût quasi nul, illimitée en pratique. Calculatoire (arithmétique, parsing sur tuples) : le compilateur déroule un calcul, coût réel et bornée. C'est la seconde qui met en danger, pas la première.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-13-type-programming/README.md`. Construire `DeepReadonly` et `DeepPartial` pour le modèle TribuZen, les éprouver sur `Family`/`Member`, puis toucher volontairement le mur `ts(2589)` pour ancrer la limite — et décider où s'arrêter.
