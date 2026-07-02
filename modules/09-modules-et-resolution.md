---
titre: Modules ES et résolution
cours: 00-typescript
notions: [import/export nommés et default, re-export et barrel files, import type et export type, verbatimModuleSyntax, résolution de modules bundler vs node16/nodenext, ESM vs CJS, extensions .js en ESM, alias de chemins paths, ambient modules]
outcomes: [structurer un module avec named/default exports et un barrel index.ts, séparer les imports de types des imports de valeurs avec import type, choisir et configurer moduleResolution selon la cible, configurer des alias @/ dans tsconfig et le bundler]
prerequis: [08-enums-tuples-types-speciaux]
next: 10-utility-types
libs: [{ name: typescript, version: "^5" }]
tribuzen: barrel tribuzen/types/index.ts, import type élidés au build, alias @/ configurés
last-reviewed: 2026-07
---

# Modules ES et résolution

> **Outcomes — tu sauras FAIRE :** structurer un module avec named/default exports et un barrel `index.ts`, séparer imports de types et imports de valeurs avec `import type`, choisir et configurer `moduleResolution`, poser des alias `@/` cohérents entre tsconfig et bundler.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu reprends le code TribuZen. Les types métier sont éparpillés dans des fichiers séparés, et chaque écran les importe avec des chemins relatifs fragiles :

```ts
// screens/FamilyScreen.tsx — AVANT
import { Family } from '../../types/family';
import { Member } from '../../types/member';
import { Event } from '../../types/event';
import { formatDate } from '../../utils/date';
import { fetchFamily } from '../../services/family.service';
```

**Trois problèmes immédiats :**
1. Chaque déplacement de fichier casse les `../../` — refactoring pénible et risqué.
2. `Family`, `Member`, `Event` sont des **types** : ils devraient disparaître au build, mais rien ne le garantit ici. Un import de type mal écrit peut entraîner un vrai `import` runtime vers un module à effet de bord.
3. Cinq imports pour une seule feature — pas d'API publique claire côté `types/`.

Ce que tu vises à la fin du module :

```ts
// screens/FamilyScreen.tsx — APRÈS
import type { Family, Member, Event } from '@/types';   // élidé au build
import { formatDate } from '@/utils/date';
import { fetchFamily } from '@/services/family.service';
```

Un barrel `@/types` qui expose l'API publique, `import type` qui garantit l'effacement, un alias `@/` stable. Ce module te donne les trois briques.

---

## 2. Théorie complète, concise

### 2.1 Exports et imports nommés

Un module ES expose ce qu'il veut via `export`, et un autre module consomme via `import`. Les **exports nommés** sont la forme par défaut : plusieurs par fichier, importés par leur nom exact.

```ts
// utils/date.ts
export function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}
export const TIMEZONE = 'Europe/Paris';

// app.ts
import { formatDate, TIMEZONE } from './utils/date';
import { formatDate as fmt } from './utils/date';   // renommage à l'import
import * as dateUtils from './utils/date';           // tout sous un namespace
```

### 2.2 Export par défaut

Un module a **au plus un** `export default` — l'export principal. À l'import, pas d'accolades, et on le nomme librement.

```ts
// components/Button.ts
export default function Button() { /* ... */ }
export type ButtonProps = { label: string };   // named en plus du default

// app.ts
import Bouton from './components/Button';        // pas d'accolades, nom libre
import type { ButtonProps } from './components/Button';
```

> **Recommandation moderne :** privilégie les **exports nommés**. Ils se renomment de façon cohérente, se tree-shakent mieux et évitent le nom arbitraire à l'import. Le `default` reste utile pour un module « une seule chose » (un composant, une config).

### 2.3 Re-export et barrel files

Un **re-export** ré-expose depuis un module ce qui vient d'un autre. Un **barrel file** est un `index.ts` qui centralise l'API publique d'un dossier.

```ts
// types/index.ts — barrel
export * from './family';                    // tout ce que family exporte
export { Member } from './member';           // sélectif
export type { Event } from './event';        // type-only re-export
export { default as Button } from '../components/Button';  // default → nommé
```

```ts
// consommation : un seul import au lieu de trois
import { Family, Member, Event } from '@/types';
```

Avantages : imports courts, API publique claire, refactoring interne caché. Coût : risque d'imports circulaires et de tree-shaking dégradé si le barrel devient géant. Garde les barrels sur des dossiers à API publique nette (`types/`, `ui/`), pas sur toute l'application.

### 2.4 `import type` / `export type`

Un type n'existe qu'à la compilation : il doit disparaître du JavaScript émis. `import type` **garantit** cet effacement (élision) et rend l'intention explicite.

```ts
// ❌ import de valeur — peut survivre au build et déclencher un side-effect
import { Family } from './family';

// ✅ import type — garanti élidé, aucun code JS généré
import type { Family } from './family';

// mixte : valeur + types sur une seule ligne (TS 4.5+)
import { createFamily, type Family, type Member } from './family';

// côté export
export type { Family, Member };
```

Utilise `import type` **dès que tu n'importes que des types**. Cela aide les bundlers, documente l'intention, et évite les imports circulaires de valeurs.

### 2.5 `verbatimModuleSyntax` (TS 5)

*(Confirmé via Context7 — TypeScript 5.0.)* Sans cette option, TS applique une **élision automatique** : il devine quels imports sont « seulement des types » et les supprime. C'est source d'ambiguïté (un import purement type mais à side-effect peut être retiré par surprise).

`verbatimModuleSyntax: true` remplace la devinette par une règle littérale, « what you see is what you get » :
- tout import/export **sans** modificateur `type` est **préservé** tel quel dans le JS ;
- tout import/export **avec** `type` est **entièrement supprimé**.

```ts
import type { A } from 'a';            // → supprimé entièrement
import { b, type c, type d } from 'bcd'; // → import { b } from "bcd";
import { type xyz } from 'xyz';        // → import {} from "xyz";  (side-effect conservé)
```

Conséquence pratique : avec `verbatimModuleSyntax`, tu **dois** écrire `import type` pour les imports purement type, sinon ils restent dans le bundle. Cette option remplace les anciennes `importsNotUsedAsValues` et `preserveValueImports` (dépréciées). Elle impose aussi l'interop stricte : pas de réécriture auto ESM→`require`.

### 2.6 Résolution de modules : `bundler` vs `node16` / `nodenext`

La **résolution** est la manière dont TS trouve le fichier réel derrière un chemin d'import. Option clé : `moduleResolution`. *(Comparatif confirmé via Context7.)*

| Stratégie | Extension requise sur les imports relatifs | `exports`/`imports` de package.json | Cas d'usage |
|---|---|---|---|
| `node10` (ex-`node`) | Non | Non | Legacy CommonJS, Node < 10 — à éviter |
| `node16` / `nodenext` | **Oui** (`.js`) | Oui | Node.js avec ESM natif, **libs publiées sur npm** |
| `bundler` | **Non** | Oui | Apps front-end (Vite, esbuild, webpack) |

Règle de choix : **`bundler`** pour une app buildée par un bundler (extensionless, supporte les `exports`) ; **`node16`/`nodenext`** pour du code exécuté directement par Node ou une lib publiée, où les extensions `.js` sont obligatoires.

### 2.7 ESM vs CJS et les extensions `.js`

Node distingue deux formats : ESM (`import`/`export`) et CommonJS (`require`/`module.exports`). En résolution `node16`/`nodenext`, un import relatif ESM **doit porter l'extension du fichier émis**, donc `.js` — **même quand le source est `.ts`** :

```ts
// avec moduleResolution: node16/nodenext
import { foo } from './utils.js';   // ✅ .js, alors que le fichier source est utils.ts
import { foo } from './utils';      // ❌ erreur : extension manquante
```

C'est déroutant mais logique : TS ne réécrit pas tes chemins, et à l'exécution c'est le `.js` compilé que Node charge. En `bundler`, le bundler tolère l'absence d'extension, donc on écrit `./utils` sans suffixe.

### 2.8 Alias de chemins (`paths`)

Les alias remplacent les `../../` par des chemins stables. Ils se déclarent dans `tsconfig.json` via `baseUrl` + `paths`.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types": ["src/types/index.ts"]
    }
  }
}
```

**Point crucial :** `paths` n'informe que le **type-checker**. À l'exécution/au build, il faut répliquer l'alias côté outil (bundler ou runtime), sinon `@/...` n'est pas résolu :

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

Pour du Node direct, `tsconfig-paths` (`tsx`/`ts-node -r tsconfig-paths/register`) ou le champ `imports` de package.json font le même travail au runtime.

### 2.9 Ambient modules (survol)

Un **ambient module** décrit les types d'un module sans fournir d'implémentation TS. Deux usages courants : typer un package npm sans types, et déclarer des imports non-JS gérés par le bundler.

```ts
// types/ambient.d.ts

// package npm sans types
declare module 'lib-sans-types' {
  export function run(input: string): string;
}

// imports non-JS (CSS modules, assets) résolus par le bundler
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
```

À connaître en lecture ; on l'approfondit au module 16 (declaration files).

---

## 3. Worked examples

### Exemple 1 — Organiser `types/` en barrel avec `import type` (TribuZen)

On part des trois types métier éparpillés du cas concret et on construit l'API publique.

```ts
// ─── src/types/family.ts ─────────────────────────────────────────
export interface Family {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

// ─── src/types/member.ts ─────────────────────────────────────────
export type Role = 'admin' | 'parent' | 'enfant';

export interface Member {
  id: string;
  name: string;
  role: Role;
  familyId: string;
}

// ─── src/types/event.ts ──────────────────────────────────────────
export interface Event {
  id: string;
  title: string;
  familyId: string;
  startsAt: string;
}

// ─── src/types/index.ts — BARREL (API publique du dossier) ───────
export type { Family } from './family';
export type { Member, Role } from './member';
export type { Event } from './event';
// tout est type-only : ce barrel n'émet AUCUN JavaScript
```

```ts
// ─── src/screens/FamilyScreen.tsx — consommation ─────────────────
// un seul import, garanti élidé au build grâce à `import type`
import type { Family, Member, Event } from '@/types';

function renderFamily(family: Family, members: Member[], events: Event[]) {
  // Family / Member / Event servent uniquement à l'annotation → 0 code JS généré
  return { family, members, events };
}
```

**Ce que ça apporte :**
- `@/types` est la seule surface d'import pour les types métier — les fichiers internes peuvent bouger sans casser les consommateurs.
- Le barrel 100 % `export type` ne génère aucun runtime : au build, la ligne d'import de `FamilyScreen` disparaît entièrement.
- Avec `verbatimModuleSyntax: true`, écrire `import type` n'est pas décoratif : c'est ce qui autorise l'effacement.

### Exemple 2 — Choisir `moduleResolution` et poser l'alias `@/`

Config type d'une app TribuZen buildée par Vite, avec l'alias répliqué des deux côtés.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",   // app front-end → extensionless + exports
    "verbatimModuleSyntax": true,    // import type obligatoire pour les types
    "strict": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "types/**/*.d.ts"]
}
```

```ts
// vite.config.ts — l'alias DOIT être répliqué ici, sinon @/ non résolu au build
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

**Variante — même projet publié comme lib Node (fading) :** si `tribuzen/types` devenait un package npm consommé sans bundler, on basculerait en `nodenext`, et les imports relatifs internes devraient porter `.js` :

```jsonc
// tsconfig.json (variante lib)
{ "compilerOptions": { "module": "NodeNext", "moduleResolution": "nodenext" } }
```

```ts
// src/index.ts (variante lib) — extension obligatoire
export type { Family } from './family.js';   // .js même si le source est family.ts
```

Le passage `bundler` → `nodenext` change une seule règle visible : l'extension `.js` devient obligatoire sur chaque import relatif.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `import type` est juste cosmétique

```ts
// ❌ sans `type` : Family est traité comme une valeur importée
import { Family } from './family';
function f(x: Family) {}   // avec verbatimModuleSyntax, la ligne d'import RESTE dans le JS

// ✅ avec `type` : effacement garanti
import type { Family } from './family';
```

**Pourquoi :** `verbatimModuleSyntax` ne devine plus. Sans le modificateur `type`, l'import est préservé littéralement dans le bundle — même s'il ne sert qu'à une annotation. Le `type` est la seule instruction d'effacement.

### PIÈGE #2 — Oublier `.js` en résolution `node16`/`nodenext`

```ts
// ❌ en nodenext : erreur "Relative import paths need explicit file extensions"
import { formatDate } from './utils/date';

// ✅
import { formatDate } from './utils/date.js';
```

**Pourquoi :** Node en ESM ne devine pas l'extension. TS n'y touche pas et exige le `.js` du fichier **émis**, pas le `.ts` du source. En `bundler` le problème n'existe pas — d'où l'importance de savoir quelle stratégie est active.

### PIÈGE #3 — `paths` sans réplication côté bundler/runtime

```jsonc
// tsconfig.json : le check passe...
"paths": { "@/*": ["src/*"] }
```
```ts
import { Family } from '@/types';   // ✅ type-check OK
// ❌ mais au build/run : "Cannot find module '@/types'" si l'alias n'est pas
//    aussi dans vite.config.ts (ou tsconfig-paths pour Node)
```

**Pourquoi :** `paths` ne configure que le type-checker de TS. Le bundler et Node ont leur propre résolution ; il faut y redéclarer l'alias. Une double source de vérité à garder synchro (ou utiliser `vite-tsconfig-paths` qui lit le tsconfig).

### PIÈGE #4 — Barrel géant → imports circulaires et tree-shaking cassé

```ts
// ❌ un barrel qui ré-exporte TOUTE l'app
// src/index.ts
export * from './types';
export * from './services';   // services importe des types depuis './types'...
export * from './screens';    // ...qui importent des services → cycle
```

**Pourquoi :** re-exporter des modules qui se référencent mutuellement via le même barrel crée des cycles d'initialisation (valeurs `undefined` au runtime). De plus, `export *` massif empêche certains bundlers d'élaguer le code mort. Garde les barrels petits et ciblés (un par dossier à API publique), et préfère `export type` quand c'est possible.

### PIÈGE #5 — Confondre `export default` réexporté et namespace

```ts
// ✅ ré-exporter un default sous un nom
export { default as Button } from './Button';

// ❌ ceci n'est PAS un re-export de default
export * from './Button';   // ne ré-exporte QUE les exports nommés, jamais le default
```

**Pourquoi :** `export *` ignore délibérément l'export par défaut. Pour l'exposer via un barrel, il faut le nommer explicitement avec `export { default as X }`.

---

## 5. Ancrage TribuZen

Ce module pose la **structure d'imports** de tout le front TribuZen.

**`tribuzen/src/types/index.ts`** — le barrel type-only qui expose `Family`, `Member`, `Role`, `Event`. C'est l'API publique du domaine : chaque écran importe `import type { … } from '@/types'`, jamais les fichiers internes. 100 % `export type` → zéro octet de JS généré par ce dossier.

**`import type` partout pour les types métier** — combiné à `verbatimModuleSyntax: true` dans le tsconfig TribuZen, cela garantit que les types disparaissent du bundle. Seuls les vrais imports de valeurs (services, utils) survivent au build.

**Alias `@/`** — déclaré dans `tsconfig.json` (`"@/*": ["src/*"]`) et répliqué dans `vite.config.ts`. Fin des `../../` : `@/types`, `@/services`, `@/utils` sont stables même quand on réorganise `src/`.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  tsconfig.json          # moduleResolution: bundler, verbatimModuleSyntax, paths @/*
  vite.config.ts         # resolve.alias @ vers src
  src/
    types/
      family.ts
      member.ts
      event.ts
      index.ts           # barrel type-only (API publique)
    services/
      family.service.ts
    utils/
      date.ts
```

---

## 6. Points clés

1. Les exports nommés sont la forme par défaut (plusieurs par fichier) ; `export default` est unique par module et importé sans accolades.
2. Un barrel `index.ts` centralise l'API publique d'un dossier via re-exports ; `export *` ne ré-exporte jamais le `default`.
3. `import type` / `export type` garantissent l'effacement des types au build et documentent l'intention.
4. `verbatimModuleSyntax: true` (TS 5) supprime l'élision automatique : sans `type`, l'import est préservé littéralement ; avec `type`, il est retiré.
5. `moduleResolution: bundler` pour une app buildée (extensionless) ; `node16`/`nodenext` pour Node/lib publiée (extensions `.js` obligatoires).
6. En ESM `node16`/`nodenext`, les imports relatifs portent `.js` même quand le source est `.ts`.
7. `paths` ne configure que le type-checker : l'alias doit être répliqué côté bundler (Vite) ou runtime (`tsconfig-paths`).
8. Les ambient modules (`declare module`) typent un package sans types ou des imports non-JS (`*.css`, `*.svg`) — approfondis au module 16.

---

## 7. Seeds Anki

```
Quelle différence entre un export nommé et un export default ?|Un module peut avoir plusieurs exports nommés (importés par leur nom exact, entre accolades) mais un seul export default (importé sans accolades, nom libre à l'import). Les exports nommés se tree-shakent et se renomment plus proprement.
Que garantit import type { X } from './m' par rapport à import { X } ?|Que l'import est purement type et sera entièrement élidé (effacé) du JavaScript émis — aucun code runtime, aucun risque de déclencher un side-effect du module. import { X } peut, lui, être préservé.
Que fait verbatimModuleSyntax: true en TypeScript 5 ?|Il supprime l'élision automatique : tout import/export SANS modificateur type est préservé littéralement dans le JS, tout import/export AVEC type est entièrement supprimé. Il remplace importsNotUsedAsValues et preserveValueImports.
Quand choisir moduleResolution bundler vs node16/nodenext ?|bundler pour une app front-end buildée (Vite/esbuild/webpack) : imports extensionless + support des exports. node16/nodenext pour du code exécuté par Node ou une lib publiée sur npm : extensions .js obligatoires sur les imports relatifs.
Pourquoi écrit-on import './utils.js' alors que le fichier source est utils.ts ?|En résolution node16/nodenext (ESM natif), Node ne devine pas l'extension et charge le .js compilé. TypeScript ne réécrit pas le chemin, donc on référence l'extension du fichier ÉMIS (.js), pas celle du source (.ts).
L'option paths du tsconfig suffit-elle pour que @/... fonctionne au runtime ?|Non. paths ne configure que le type-checker de TypeScript. Il faut répliquer l'alias côté bundler (ex. resolve.alias de Vite) ou côté runtime Node (tsconfig-paths), sinon le module n'est pas résolu à l'exécution.
Que ré-exporte export * from './m' et qu'oublie-t-il ?|Il ré-exporte tous les exports NOMMÉS de ./m, mais jamais son export default. Pour exposer le default via un barrel, il faut l'écrire explicitement : export { default as X } from './m'.
À quoi sert un ambient module (declare module) ?|À décrire les types d'un module sans fournir d'implémentation : typer un package npm sans types, ou déclarer des imports non-JS gérés par le bundler (declare module '*.svg', '*.module.css').
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-09-modules/README.md`. Organiser `tribuzen/types` en barrel type-only, activer `verbatimModuleSyntax`, poser l'alias `@/` de bout en bout et vérifier l'effacement au build.
