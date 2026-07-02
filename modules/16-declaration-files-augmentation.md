---
titre: Declaration files et augmentation
cours: 00-typescript
notions: [fichiers .d.ts, mot-clé declare, ambient declarations, declare module, declare global, module augmentation, augmenter une lib tierce, triple-slash directives, types @types et DefinitelyTyped, declare module wildcard pour assets]
outcomes: [écrire un .d.ts pour une lib JS non typée, augmenter le type Request d'Express pour ajouter req.member, déclarer un module wildcard pour importer des assets svg]
prerequis: [15-variance-et-soundness]
next: 17-tsconfig-et-compilateur
libs: [{ name: typescript, version: "^5" }]
tribuzen: couche typage de l'API TribuZen — augmentation d'Express Request avec req.member, .d.ts pour une petite lib JS interne, module wildcard pour les icônes SVG de l'admin
last-reviewed: 2026-07
---

# Declaration files et augmentation

> **Outcomes — tu sauras FAIRE :** écrire un fichier `.d.ts` pour une lib JavaScript non typée, augmenter le type `Request` d'Express pour ajouter `req.member`, déclarer un module wildcard pour importer des assets (`*.svg`).
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu branches l'authentification sur l'API TribuZen (Express + un middleware maison). Le middleware lit le JWT, charge le membre et le pose sur la requête :

```ts
// middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import { findMemberById } from '../services/member';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const member = await findMemberById(decodeToken(req));
  req.member = member; // ❌ TS2339: Property 'member' does not exist on type 'Request'
  next();
}
```

Puis, dans un controller, tu veux relire ce membre :

```ts
// controllers/family.ts
export function listMyFamilies(req: Request, res: Response) {
  const memberId = req.member.id; // ❌ même erreur : 'member' n'existe pas sur Request
  res.json(getFamiliesOf(memberId));
}
```

Trois réflexes tentants, tous mauvais :
1. `(req as any).member` — tu perds tout typage, `req.member.id` devient `any`, plus aucune vérif.
2. Réécrire une interface `RequestAvecMembre extends Request` — tu dois la propager partout, elle ne remonte pas dans les handlers Express standard.
3. Modifier `node_modules/@types/express` — écrasé au prochain `npm install`.

La bonne réponse, c'est **augmenter le type `Request` d'Express** dans un fichier `.d.ts` à toi. Et pendant qu'on y est, l'admin importe des icônes `import cog from './cog.svg'` que TS refuse aussi. Même famille de solution. Ce module couvre tout ça.

---

## 2. Théorie complète, concise

### 2.1 Ce qu'est un fichier `.d.ts`

Un `.d.ts` (declaration file) ne contient **que des types**, zéro runtime. Il ne compile vers **aucun** JavaScript. C'est un dictionnaire : il décrit la forme d'un code dont l'implémentation vit ailleurs (un `.js`, l'environnement, une lib npm).

```ts
// math-maison.d.ts — décrit, n'implémente pas
export declare function distance(a: Point, b: Point): number;
export declare const VERSION: string;
export interface Point { x: number; y: number }
```

> **Retenir :** un `.d.ts` n'ajoute pas de comportement, il ajoute de la *compréhension* côté compilateur. Si tu supprimes le `.d.ts`, le code tourne toujours — tu perds juste l'autocomplétion et les vérifications.

### 2.2 Le mot-clé `declare`

`declare` dit à TypeScript : « fais-moi confiance, ça existe au runtime, ne cherche pas l'implémentation ». On l'utilise dans les contextes *ambient* (fichiers `.d.ts`, ou blocs `declare global`).

```ts
declare function formater(d: Date, format: string): string; // impl ailleurs
declare const BUILD_ID: string;                              // injecté au build
declare class Logger { log(msg: string): void }              // pas de corps
```

Les `interface` et `type` n'ont pas besoin de `declare` : ils sont déjà purement types, sans runtime.

### 2.3 Ambient declarations : global vs module

Deux mondes, à ne jamais confondre :

| | Fichier **script** (ambient global) | Fichier **module** |
|---|---|---|
| Définition | aucun `import`/`export` top-level | au moins un `import` ou `export` |
| Portée des `declare` | **globale** — visible partout sans import | **locale** au module |
| `declare global` | inutile (on est déjà global) | nécessaire pour toucher le scope global |

C'est la règle-piège n°1 : **dès qu'un `.d.ts` contient un `import` ou `export`, il devient un module** et ses `declare` ne fuient plus dans le global. Pour retoucher le global depuis un module, il faut un bloc `declare global { ... }`.

### 2.4 `declare module "nom"` — typer une lib non typée

Quand une lib npm n'a ni types embarqués ni package `@types`, tu écris toi-même sa surface :

```ts
// types/slugify-maison.d.ts
declare module 'slugify-maison' {
  export interface Options {
    minuscule?: boolean;
    separateur?: string;
  }
  export function slug(entree: string, options?: Options): string;
  export default function init(config?: Options): void;
}
```

Ce bloc « déclare le module » : `import { slug } from 'slugify-maison'` devient typé, alors que la lib reste du JS pur.

### 2.5 `declare module "*.ext"` — les wildcards pour assets

Les bundlers (Vite, webpack) laissent importer des fichiers non-JS (`svg`, `css`, `png`). TS ne connaît pas ces extensions et refuse l'import. On déclare un **module wildcard** :

```ts
// types/assets.d.ts
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.module.css' {
  const classes: { readonly [cle: string]: string };
  export default classes;
}
```

Le `*` matche n'importe quel chemin finissant par `.svg`. `import cog from './cog.svg'` type `cog` comme `string`.

### 2.6 Module augmentation — enrichir un module existant

Le mécanisme de base : **les interfaces de même nom fusionnent** (declaration merging). Un `declare module "lib"` rouvre une interface publiée par la lib et lui **ajoute** des membres — sans toucher son code source.

```ts
// types/express.d.ts
import 'express-serve-static-core'; // import pour cibler le module réel

declare module 'express-serve-static-core' {
  interface Request {
    member?: Member; // fusionne avec Request existante
  }
}
```

Point subtil sur Express : le type `Request` que tu importes de `'express'` est **ré-exporté** depuis `'express-serve-static-core'`. C'est ce module-là qu'il faut augmenter pour que `req.member` remonte dans **tous** les handlers.

### 2.7 `declare global` — toucher le scope global depuis un module

Dans un fichier module (avec des `import`/`export`), on ne peut atteindre le global qu'à travers `declare global` :

```ts
// types/global.d.ts
export {}; // force le statut "module"

declare global {
  interface Window {
    __TRIBUZEN_ENV__: { apiUrl: string; version: string };
  }
  var __DEV__: boolean;
}
```

Le `export {}` en tête est l'astuce pour rendre le fichier « module » quand il n'a sinon aucun import/export — indispensable pour que `declare global` soit légal.

### 2.8 Triple-slash directives (survol)

Ce sont de vieux commentaires-directives, antérieurs aux modules ES. À reconnaître en lecture, à éviter en écriture neuve :

```ts
/// <reference types="node" />       // inclut @types/node
/// <reference path="./env.d.ts" />  // inclut un .d.ts local
/// <reference lib="dom" />          // inclut lib.dom.d.ts
```

Dans du code moderne (fichiers avec `import`/`export`), on préfère les imports normaux et la config `tsconfig`. Les triple-slash restent utiles dans certains `.d.ts` ambient (ex. `/// <reference types="vite/client" />`).

### 2.9 `@types` et DefinitelyTyped

DefinitelyTyped est le dépôt communautaire qui héberge les types de milliers de packages JS, publiés sous le scope `@types/`.

```bash
npm i -D @types/express @types/node
```

Algorithme de résolution des types par TS, dans l'ordre :
1. Le package a un champ `"types"` (ou `"typings"`) dans son `package.json` → on l'utilise.
2. Un `index.d.ts` à la racine du package → on l'utilise.
3. Un `node_modules/@types/<nom>` existe → types DefinitelyTyped.
4. Rien → le module est `any` (ou erreur si `noImplicitAny`).

Tes `.d.ts` maison se rangent dans un dossier listé par `typeRoots` (souvent `./types`) ou simplement inclus via `include` du `tsconfig`.

---

## 3. Worked examples

### Exemple 1 — Augmenter `Request` d'Express avec `req.member` (TribuZen)

Objectif : faire disparaître le `TS2339` du cas concret, avec un vrai typage.

```ts
// types/express/index.d.ts
// 1. On importe le type métier Member (import de type = ce fichier devient un module)
import type { Member } from '../../src/domain/member';

// 2. On rouvre le module qui définit RÉELLEMENT Request.
//    (express ré-exporte Request depuis express-serve-static-core)
declare module 'express-serve-static-core' {
  interface Request {
    // 3. On ajoute member. Optionnel : avant le middleware auth il n'existe pas.
    member?: Member;
  }
}
```

```ts
// middlewares/auth.ts — plus aucune erreur
import { Request, Response, NextFunction } from 'express';
import { findMemberById } from '../services/member';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.member = await findMemberById(decodeToken(req)); // ✅ typé Member
  next();
}
```

```ts
// controllers/family.ts
export function listMyFamilies(req: Request, res: Response) {
  // req.member est Member | undefined → on narrow d'abord
  if (!req.member) return res.status(401).json({ error: 'non authentifié' });
  res.json(getFamiliesOf(req.member.id)); // ✅ req.member.id : string, autocomplété
}
```

Ce qu'il faut voir :
- `member?` est **optionnel** car sa présence dépend du passage dans `authMiddleware`. Le `?` force le narrowing dans les controllers — soundness préservée (cf. module 15).
- On augmente `express-serve-static-core`, pas `express`, sinon l'augmentation ne remonte pas dans les handlers.
- Il faut que `tsconfig` voie le dossier `types/` (via `include` ou `typeRoots`), sinon l'augmentation est ignorée silencieusement.

### Exemple 2 — Écrire un `.d.ts` pour une petite lib JS non typée

TribuZen utilise une lib interne `tribu-ics` (JS pur) qui génère des fichiers `.ics` pour les événements famille. Son API observée :

```js
// tribu-ics/index.js (JS, sans types)
function creerEvenement(opts) { /* ... retourne une string ICS */ }
function fusionner(evenements) { /* ... retourne une string ICS */ }
module.exports = { creerEvenement, fusionner };
```

On décrit sa surface dans un `.d.ts` :

```ts
// types/tribu-ics.d.ts
declare module 'tribu-ics' {
  /** Un événement du calendrier famille */
  export interface EvenementICS {
    titre: string;
    debut: Date;
    fin: Date;
    /** Fuseau IANA, ex. "Europe/Paris" */
    fuseau?: string;
    lieu?: string;
    participants?: string[];
  }

  /** Génère un bloc VEVENT au format ICS */
  export function creerEvenement(opts: EvenementICS): string;

  /** Concatène plusieurs événements dans un seul calendrier VCALENDAR */
  export function fusionner(evenements: string[]): string;
}
```

```ts
// usage dans l'API — désormais typé et autocomplété
import { creerEvenement, fusionner } from 'tribu-ics';

const bloc = creerEvenement({
  titre: 'Anniversaire Papy',
  debut: new Date('2026-08-01T18:00:00'),
  fin: new Date('2026-08-01T23:00:00'),
  fuseau: 'Europe/Paris',
});
const calendrier = fusionner([bloc]); // ✅ string[] exigé, Date exigée, typos attrapées
```

Stratégie générale pour typer une lib JS : (1) lire l'API réelle (doc + exemples), (2) commencer par les fonctions les plus utilisées, (3) affiner au fur et à mesure. Un `.d.ts` incomplet mais correct vaut mieux que `any`.

### Exemple 3 (fading) — Wildcard `*.svg` pour les icônes de l'admin

L'admin TribuZen fait `import cog from './icons/cog.svg'`. Déclare le module wildcard pour que ça type.

```ts
// types/assets.d.ts
declare module '*.svg' {
  // Avec un bundler qui expose l'URL (Vite par défaut) : l'import vaut une string
  const src: string;
  export default src;
}
```

Usage :

```ts
import cog from './icons/cog.svg';
// cog : string (URL). <img src={cog} /> ✅
```

Variante fréquente en React (SVGR transforme le SVG en composant) :

```ts
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const Composant: FC<SVGProps<SVGSVGElement>>;
  export default Composant;
}
```

Une seule des deux formes à la fois : elle doit refléter ce que ton bundler produit réellement.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Le `.d.ts` bascule en module et perd le global

```ts
// ❌ types/globals.d.ts
import { Member } from '../src/domain/member'; // cet import fait du fichier un MODULE

declare global {
  var currentMember: Member; // OK, dans un declare global
}
interface Window { foo: string } // ❌ IGNORÉ : local au module, ne touche pas le vrai Window
```

**Pourquoi c'est faux :** dès qu'il y a un `import`, tout `declare`/`interface` top-level devient local. **Correct :** tout ce qui doit être global passe *dans* le bloc `declare global`, et on ajoute `export {}` si besoin de forcer le statut module.

### PIÈGE #2 — Augmenter `express` au lieu de `express-serve-static-core`

```ts
// ❌ ne remonte pas dans les handlers
declare module 'express' {
  interface Request { member?: Member }
}
```

**Pourquoi c'est faux :** `Request` est *défini* dans `express-serve-static-core` et seulement ré-exporté par `express`. Augmenter `express` crée une interface `Request` déconnectée. **Correct :** `declare module 'express-serve-static-core' { interface Request { ... } }`.

### PIÈGE #3 — Confondre `declare module "lib"` (déclarer) et augmenter (fusionner)

```ts
// Si 'lodash' A DÉJÀ des types (@types/lodash) :
declare module 'lodash' {
  export function chunk(a: unknown[], n: number): unknown[][]; // ❌ écrase/entre en conflit
}
```

**Pourquoi c'est faux :** sans `import 'lodash'` en tête, ce bloc *redéclare* le module et rentre en collision avec les types existants. **Correct pour ajouter :** mettre `import 'lodash'` d'abord, puis rouvrir une `interface` (ex. `LoDashStatic`) — là on **fusionne** au lieu de redéclarer.

### PIÈGE #4 — `(req as any).member` pour « faire taire » l'erreur

```ts
const id = (req as any).member.id; // ❌ id : any — plus aucune vérif, typos silencieuses
```

**Pourquoi c'est faux :** le cast `any` détruit le typage en aval, exactement ce qu'on voulait garder. **Correct :** augmenter `Request` une fois, et `req.member` est typé partout, avec narrowing propre sur l'optionnel.

### PIÈGE #5 — Le `.d.ts` maison n'est pas vu par le compilateur

Tu as écrit `types/express/index.d.ts` mais l'erreur persiste. **Cause fréquente :** le dossier `types/` n'est ni dans `include` ni dans `typeRoots` du `tsconfig`. Un `.d.ts` hors périmètre est simplement ignoré. **Correct :** ajouter `"include": ["src", "types"]` (ou configurer `typeRoots`), puis redémarrer le serveur TS de l'IDE.

---

## 5. Ancrage TribuZen

La couche typage de l'API TribuZen s'appuie sur trois declaration files, tous dans `smaurier/tribuzen-api` :

**`types/express/index.d.ts`** — augmente `express-serve-static-core` pour ajouter `req.member?: Member`. C'est le pont NestJS/Express : le même mécanisme d'augmentation sert quand on passe à NestJS (qui s'appuie sur Express sous le capot). Tout le middleware d'auth et tous les controllers en dépendent (Exemple 1).

**`types/tribu-ics.d.ts`** — décrit la lib JS interne `tribu-ics` qui sérialise les événements famille en `.ics`. Sans lui, le service calendrier tomberait en `any` et laisserait passer des `debut` en string au lieu de `Date` (Exemple 2).

**`types/assets.d.ts`** — dans le front admin (`smaurier/tribuzen-admin`), déclare `*.svg` (et `*.module.css`) pour que les icônes de la barre latérale s'importent proprement (Exemple 3).

Fichiers cibles :
```
tribuzen-api/
  types/
    express/index.d.ts   # req.member?: Member
    tribu-ics.d.ts       # lib .ics non typée
  tsconfig.json          # include: ["src", "types"]
tribuzen-admin/
  types/
    assets.d.ts          # *.svg, *.module.css
```

---

## 6. Points clés

1. Un `.d.ts` ne contient que des types, ne produit aucun JS : il décrit une implémentation qui vit ailleurs.
2. `declare` affirme l'existence runtime d'une entité sans en fournir le corps ; `interface`/`type` n'en ont pas besoin.
3. Un `.d.ts` avec un `import`/`export` top-level est un **module** : ses `declare` ne fuient plus dans le global — il faut `declare global` (+ `export {}`).
4. `declare module "lib"` *déclare* une lib non typée ; précédé de `import "lib"`, il *augmente* (fusionne) une lib déjà typée.
5. Augmenter Express Request se fait sur `express-serve-static-core`, pas `express`, et le champ ajouté (`member?`) est optionnel pour forcer le narrowing.
6. `declare module "*.svg"` (wildcard) type les imports d'assets non-JS gérés par le bundler.
7. Les triple-slash (`/// <reference ...>`) sont l'ancien mécanisme, à reconnaître mais à éviter en code neuf.
8. Résolution des types : `package.json#types` → `index.d.ts` racine → `@types/<nom>` (DefinitelyTyped) → sinon `any` ; les `.d.ts` maison doivent être dans `include`/`typeRoots`.

---

## 7. Seeds Anki

```
Qu'est-ce qu'un fichier .d.ts et que produit-il à la compilation ?|Un fichier de déclaration qui ne contient que des types (pas de runtime). Il ne produit AUCUN JavaScript : il décrit la forme d'un code dont l'implémentation existe ailleurs, pour donner autocomplétion et vérifications au compilateur.
À quoi sert le mot-clé declare ?|Il affirme à TypeScript qu'une entité (fonction, const, class, module) existe au runtime sans en fournir l'implémentation. Utilisé dans les contextes ambient (.d.ts, declare global). interface et type n'en ont pas besoin car ils sont déjà purement types.
Pourquoi un .d.ts avec un import top-level perd-il ses déclarations globales ?|Dès qu'un fichier a un import/export top-level, il devient un MODULE : ses declare/interface deviennent locaux et ne fuient plus dans le scope global. Pour toucher le global depuis un module, il faut un bloc declare global { ... }.
Quelle est la différence entre declare module "lib" seul et précédé de import "lib" ?|Seul, il DÉCLARE un module non typé (crée ses types). Précédé de import "lib", il AUGMENTE (fusionne, via declaration merging) une lib déjà typée en rouvrant ses interfaces — sans écraser les types existants.
Pour ajouter req.member à Express, quel module faut-il augmenter et pourquoi ?|express-serve-static-core (pas 'express'). C'est ce module qui DÉFINIT réellement l'interface Request ; 'express' ne fait que la ré-exporter. Augmenter 'express' créerait un Request déconnecté qui ne remonte pas dans les handlers.
Comment typer import cog from './cog.svg' que TS refuse ?|Déclarer un module wildcard : declare module '*.svg' { const src: string; export default src; }. Le * matche tout chemin finissant en .svg. La forme dépend du bundler (URL string, ou composant FC<SVGProps> avec SVGR).
Dans quel ordre TypeScript résout-il les types d'un package npm ?|1) champ types/typings du package.json, 2) index.d.ts à la racine du package, 3) node_modules/@types/<nom> (DefinitelyTyped), 4) sinon any (ou erreur si noImplicitAny). Les .d.ts maison doivent être dans include ou typeRoots du tsconfig.
Pourquoi préférer augmenter Request plutôt que (req as any).member ?|Le cast any détruit le typage en aval : req.member.id devient any, plus aucune vérif ni autocomplétion, les typos passent. L'augmentation type req.member une fois pour toutes, partout, avec narrowing propre sur l'optionnel.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-16-declaration-files/README.md`. Écrire les trois declaration files de TribuZen — augmentation d'Express `Request` avec `req.member`, `.d.ts` pour la lib JS `tribu-ics`, wildcard `*.svg` — puis vérifier au compilateur (`tsc --noEmit`) que le typage remonte.
