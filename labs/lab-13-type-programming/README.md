# Lab 13 — Types récursifs & type-level programming

> **Outcome :** à la fin, tu sais écrire `DeepReadonly` et `DeepPartial` pour le modèle TribuZen, les éprouver sur `Family`/`Member`, dérouler un tuple avec un accumulateur, et **reconnaître le mur `ts(2589)`** pour décider où t'arrêter.
> **Vrai outil :** `tsc` (TypeScript ^5) + ton éditeur (les erreurs de type sont le feedback — pas un test-runner). Un `tsc --noEmit` valide le fichier.
> **Feedback :** le coach valide en session — pas de test auto-correcteur. La preuve = les lignes attendues rougissent (ou pas) dans l'éditeur.

---

## Énoncé

Tu construis les types utilitaires « deep » de TribuZen dans un seul fichier `deep.ts`. L'objectif n'est PAS d'écrire le type le plus impressionnant possible : c'est d'écrire les 3 types *utiles*, de les vérifier, puis de toucher volontairement la limite de récursion pour la ressentir.

**Modèle de départ (à copier tel quel en haut de `deep.ts`) :**

```ts
export interface Address {
  city: string;
  zip: string;
}

export interface Member {
  id: string;
  displayName: string;
  email?: string;
  address: Address;
}

export interface Family {
  id: string;
  name: string;
  settings: {
    isPublic: boolean;
    locale: 'fr' | 'en';
  };
  members: Member[];
}
```

**Ce que tu dois produire :**

1. `DeepReadonly<T>` — fige récursivement, tableaux compris (`ReadonlyArray`).
2. `DeepPartial<T>` — rend optionnel récursivement.
3. Un tuple utilitaire `ReverseTail<T, Acc>` avec accumulateur (tail-call).
4. Une démonstration du mur `ts(2589)` avec un `BuildTuple<N>`, puis un commentaire expliquant la décision « je m'arrête ».

**Contraintes :**
- Chaque type récursif a un **cas d'arrêt** explicite.
- `DeepReadonly` et `DeepPartial` testent le **tableau avant l'objet**.
- Aucun `any`. Utilise `unknown` dans les contraintes de tuple.
- **Pas de gap-fill** — tu écris chaque type en entier depuis le modèle.

### Setup minimal

```bash
mkdir lab-13 && cd lab-13
npm init -y
npm i -D typescript
npx tsc --init --strict
# écris ton code dans deep.ts, puis :
npx tsc --noEmit
```

---

## Étapes (en friction)

1. **Écris `DeepReadonly<T>`** — trois branches : tableau (`(infer U)[]` → `ReadonlyArray<DeepReadonly<U>>`), objet (`{ readonly [K in keyof T]: ... }`), puis cas d'arrêt `: T`. Crée `type Frozen = DeepReadonly<Family>` et vérifie dans l'éditeur que `family.settings.locale = 'en'` rougit.
2. **Écris `DeepPartial<T>`** — même squelette, `?` sur chaque clé. Crée `const p: DeepPartial<Member> = { address: { city: 'Lyon' } }` et vérifie que ça passe, puis que `{ address: { city: 42 } }` rougit.
3. **Écris `ReverseTail<T, Acc = []>`** — accumulateur en position terminale. Vérifie `type R = ReverseTail<[1, 2, 3]>` = `[3, 2, 1]` (survole le type dans l'éditeur).
4. **Touche le mur** — écris `BuildTuple<N, Acc = []>`, teste `BuildTuple<40>` (ok) puis décommente `BuildTuple<900>` et observe `ts(2589)`. Écris en commentaire *pourquoi* tu ne « forces » pas et ce que tu ferais à la place.
5. **Lance `npx tsc --noEmit`** — zéro erreur hors des lignes que tu as volontairement laissées en commentaire pour la démo.

---

## Corrigé complet commenté

```ts
// ─── deep.ts ─────────────────────────────────────────────────────

export interface Address {
  city: string;
  zip: string;
}

export interface Member {
  id: string;
  displayName: string;
  email?: string;
  address: Address;
}

export interface Family {
  id: string;
  name: string;
  settings: {
    isPublic: boolean;
    locale: 'fr' | 'en';
  };
  members: Member[];
}

// ─── 1. DeepReadonly ─────────────────────────────────────────────
// Trois branches, dans cet ordre :
//   a) tableau AVANT objet (un array EST un object en TS)
//   b) objet : mapped type readonly + récursion sur la valeur
//   c) cas d'arrêt : primitive rendue telle quelle
export type DeepReadonly<T> =
  T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

type Frozen = DeepReadonly<Family>;

declare const f: Frozen;
f.name;                            // lecture ok
// f.name = 'x';                   // ❌ readonly niveau 1
// f.settings.locale = 'en';       // ❌ readonly niveau 2
// f.members[0].address.city = ''; // ❌ readonly niveau 3, à travers le tableau

// ─── 2. DeepPartial ──────────────────────────────────────────────
// Même squelette, on ajoute `?` sur chaque clé.
// Sur les tableaux : on rend les ÉLÉMENTS partiels, pas le tableau "à trous".
export type DeepPartial<T> =
  T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

const p1: DeepPartial<Member> = {};                          // ✅ vide
const p2: DeepPartial<Member> = { displayName: 'Bob' };      // ✅ un champ
const p3: DeepPartial<Member> = { address: { city: 'Lyon' } }; // ✅ sous-objet partiel
// const p4: DeepPartial<Member> = { address: { city: 42 } };  // ❌ city reste string

// ─── 3. ReverseTail (accumulateur / tail-call) ───────────────────
// L'appel récursif EST le résultat : rien ne l'enveloppe → tail-call TS 4.5+.
// L'accumulateur Acc porte le tuple en construction.
export type ReverseTail<
  T extends readonly unknown[],
  Acc extends unknown[] = [],
> =
  T extends [infer Head, ...infer Rest]
    ? ReverseTail<Rest, [Head, ...Acc]>
    : Acc;

type R = ReverseTail<[1, 2, 3]>; // [3, 2, 1]

// Length : natif, PAS de récursion — la bonne réflexe anti-coût.
export type Length<T extends readonly unknown[]> = T['length'];
type L = Length<[1, 2, 3]>; // 3

// ─── 4. Le mur ts(2589) et la décision de s'arrêter ──────────────
export type BuildTuple<
  N extends number,
  Acc extends unknown[] = [],
> =
  Acc['length'] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>;

type Ok = BuildTuple<40>; // ✅ 40 niveaux, ça passe

// type Boom = BuildTuple<900>;
// ❌ ts(2589) "Type instantiation is excessively deep and possibly infinite"
//
// DÉCISION — je NE force PAS la profondeur :
//   ts(2589) est un garde-fou, pas un bug. Si j'ai besoin de compter jusqu'à
//   900 au niveau des types, c'est que le calcul n'a rien à faire dans les types.
//   À la place : je le calcule à l'exécution (une fonction JS) ou je valide la
//   valeur (Zod). Les types décrivent des formes ; ils ne sont pas un moteur
//   de calcul, et chaque niveau de récursion se paie en temps de compilation.
```

**Pourquoi ce corrigé est correct :**
- `DeepReadonly`/`DeepPartial` testent le tableau **avant** l'objet — sinon `Member[]` deviendrait un objet indexé et on perdrait `ReadonlyArray`.
- Chaque type a un **cas d'arrêt** (`: T`) : la récursion s'arrête sur les primitives, pas de `ts(2589)` sur un modèle métier de profondeur 3-4.
- `ReverseTail` met l'appel récursif en position terminale : c'est ce qui active la tail-call et supporte de longs tuples.
- `Length` utilise `T['length']` natif — on n'écrit pas de compteur récursif inutile.
- La démo `BuildTuple<900>` reste **en commentaire** : le lab ancre la limite en la *voyant*, sans laisser une erreur bloquante dans le build.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduire de mémoire en 20 minutes, sans rouvrir ce corrigé ni le module :**

1. Ajoute `DeepRequired<T>` (l'inverse de `DeepPartial` : retire `?` en profondeur avec `-?`).
2. Ajoute `Paths<Family>` en survol (union des chemins pointés) et écris une signature `declare function getPath(f: Family, path: Paths<Family>): unknown;`. Vérifie que `getPath(fam, 'settings.locale')` passe et que `getPath(fam, 'settings.wrong')` rougit.
3. Fais grossir volontairement `Family` (imbrique 6-7 niveaux d'objets) jusqu'à faire ramer l'autocomplétion ou déclencher `ts(2589)` sur `Paths`, puis **écris ta décision** : borner la profondeur ou repasser à `string` validé à l'exécution.

**Critère de réussite :** `DeepRequired` et `Paths` compilent, la ligne `getPath(..., 'settings.wrong')` est la seule à rougir, et ton commentaire de décision est explicite sur le « quand s'arrêter ».

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces types vivent ici :

```
tribuzen/src/
  types/
    index.ts   ← Family, Member, Address (modèle métier, déjà présent)
    deep.ts    ← DeepReadonly, DeepPartial, (Paths en survol) — CE LAB
  api/
    members.ts ← body de PATCH /members/:id typé DeepPartial<Member>
  features/
    family/
      PublicFamilyView.tsx ← props: DeepReadonly<Family>
```

**Différences par rapport au lab :**
- `Family`/`Member` seront importés depuis `src/types/index.ts` au lieu d'être recopiés.
- `Paths<Family>` reste **optionnel** en prod : on ne l'active que si un vrai besoin (colonnes CSV configurables) le justifie, et on l'abandonne au premier signe de `ts(2589)` ou de lenteur d'éditeur.
- Aucune arithmétique/parser au niveau des types dans TribuZen : frontière assumée, validations de contenu déléguées au runtime.

**Commit cible :**
```
feat(types): DeepReadonly + DeepPartial — utilitaires deep du modèle TribuZen
docs(types): borne d'usage du type-programming (quand s'arrêter, ts2589)
```
