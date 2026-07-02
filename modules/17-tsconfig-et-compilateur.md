---
titre: tsconfig et compilateur
cours: 00-typescript
notions: [target et module, moduleResolution, lib, strict et ses sous-flags, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax, isolatedModules, skipLibCheck, paths et baseUrl, outDir et rootDir, declaration et sourceMap, extends et configs de base, project references et composite, tsc --build, tsc comme type-checker seul]
outcomes: [écrire un tsconfig de prod strict et justifié, activer les sous-flags stricts avancés et corriger les erreurs révélées, découper un monorepo en project references avec composite et tsc --build]
prerequis: [16-declaration-files-augmentation]
next: 18-patterns-de-conception
libs: [{ name: typescript, version: "^5" }]
tribuzen: tsconfig de prod strict de l'app TribuZen (strict + noUncheckedIndexedAccess + paths) et project references admin/shared/api
last-reviewed: 2026-07
---

# tsconfig et compilateur

> **Outcomes — tu sauras FAIRE :** écrire un `tsconfig.json` de production strict et justifié option par option, activer les sous-flags stricts avancés (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`) et corriger les erreurs qu'ils révèlent, découper un monorepo en project references avec `composite` + `tsc --build`.
> **Difficulté :** :star::star::star:

> **Note d'actualité (à vérifier) :** Context7 était indisponible au moment de la rédaction (quota mensuel dépassé). Le contenu s'appuie sur la source v0 du cours et la connaissance TypeScript 5.x. **À revalider** contre la doc officielle `tsconfig` avant diffusion, surtout : la liste exacte des flags activés par `strict`, et le remplacement de `importsNotUsedAsValues` / `preserveValueImports` par `verbatimModuleSyntax` (TS 5.0+).

## 1. Cas concret d'abord

Tu reprends l'app TribuZen. Le `tsconfig.json` a été copié-collé d'un vieux boilerplate et personne ne l'a relu :

```json
{
  "compilerOptions": {
    "target": "ES5",
    "module": "AMD",
    "strict": false,
    "skipLibCheck": false,
    "outDir": "./dist"
  },
  "include": ["**/*"]
}
```

Symptômes en production :
1. **Bundle énorme et lent** — `ES5` transpile chaque `?.` et `??` en cascades de `void 0`, alors que tous les navigateurs cibles supportent ES2022.
2. **Modules cassés** — `AMD` est un format mort ; les `import` ne se résolvent pas comme le bundler (Vite) l'attend.
3. **Bugs `null` en prod** — `strict: false` désactive `strictNullChecks` : `member.family.name` compile même quand `family` est `undefined`, et plante à l'exécution.
4. **Compilation qui rame** — `skipLibCheck: false` fait re-typer tous les `.d.ts` de `node_modules`.
5. **`include: ["**/*"]`** — TypeScript essaie de compiler `node_modules` et `dist` eux-mêmes.

Ce module te donne les outils pour transformer ce fichier en un tsconfig de prod strict, justifié ligne à ligne, puis pour le découper proprement quand TribuZen devient un monorepo `admin / shared / api`.

---

## 2. Théorie complète, concise

Un `tsconfig.json` répond à cinq questions : **quel JS produire**, **comment résoudre les modules**, **quelles APIs sont disponibles**, **quel niveau de rigueur imposer**, **comment structurer et accélérer la compilation**.

### 2.1 `target` et `module`

`target` = version de JavaScript **émise**. `module` = système de modules des `import`/`export` émis.

```jsonc
{
  "compilerOptions": {
    // target : ES2022 est un bon défaut moderne (class fields, .at(), top-level await)
    "target": "ES2022",

    // module : dépend du runtime
    //   "NodeNext"  -> Node.js moderne (résolution hybride CJS/ESM d'après package.json)
    //   "ESNext"    -> app compilée par un bundler (Vite, esbuild)
    //   "Preserve"  -> garde les imports tels quels, le bundler décide (TS 5.4+)
    "module": "ESNext"
  }
}
```

`target` bas = plus de transpilation = code plus verbeux et plus lent. On choisit le `target` le plus haut que le runtime supporte.

### 2.2 `moduleResolution`

Une fois le style de modules choisi, il faut dire à TypeScript **comment retrouver** un import.

```jsonc
{
  "compilerOptions": {
    // "Node10"    -> ancien algo Node (main / index.js), déprécié pour du neuf
    // "NodeNext"  -> lit package.json "exports" + conditions import/require/types
    // "Bundler"   -> comme NodeNext mais SANS extension obligatoire dans l'import
    "moduleResolution": "Bundler"
  }
}
```

Règle simple : `module: "NodeNext"` va avec `moduleResolution: "NodeNext"` (backend Node) ; `module: "ESNext"` va avec `moduleResolution: "Bundler"` (app Vite/esbuild).

### 2.3 `lib`

`lib` = quelles **APIs globales** TypeScript considère comme présentes. Si absent, déduit de `target`.

```jsonc
{
  "compilerOptions": {
    // App navigateur : JS moderne + DOM
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
    // API Node pure : ["ES2022"] seulement — les types Node viennent de @types/node
  }
}
```

Sans `"DOM"`, `document` et `fetch` n'existent pas côté types. Sans `"ES2022"`, `Array.prototype.at()` ou `Object.hasOwn` sont inconnus.

### 2.4 `strict` et ses sous-flags

`strict: true` est le flag le plus important. C'est un **méta-flag** qui active un groupe de vérifications :

```jsonc
{
  "compilerOptions": {
    "strict": true
    // équivaut à activer (liste TS 5.x — à revalider) :
    //   noImplicitAny                 (interdit les any implicites)
    //   strictNullChecks              (null / undefined sont des types distincts)
    //   strictFunctionTypes           (contravariance stricte des paramètres)
    //   strictBindCallApply           (bind/call/apply typés)
    //   strictPropertyInitialization  (props de classe initialisées)
    //   strictBuiltinIteratorReturn   (TS 5.6 : IteratorResult des itérateurs natifs typé correctement)
    //   noImplicitThis                (this implicite interdit)
    //   useUnknownInCatchVariables    (catch (e) -> e est unknown, pas any)
    //   alwaysStrict                  ("use strict" émis)
  }
}
```

Le plus impactant est **`strictNullChecks`** : sans lui, `null`/`undefined` sont assignables partout et tu perds la moitié des garanties de TypeScript.

### 2.5 Sous-flags stricts AU-DELÀ de `strict`

Trois flags puissants **ne sont PAS** dans `strict` — il faut les ajouter à la main.

**`noUncheckedIndexedAccess`** — ajoute `| undefined` à tout accès indexé (`array[i]`, `record[key]`). Reflète la réalité : un index peut être hors bornes.

```ts
// avec noUncheckedIndexedAccess: true
const membres: string[] = ["Alice"];
const premier = membres[0];   // type: string | undefined  (pas string !)
premier.toUpperCase();        // ❌ 'premier' peut être undefined
premier?.toUpperCase();       // ✅

const config: Record<string, string> = {};
config["theme"].length;       // ❌ undefined possible
```

**`exactOptionalPropertyTypes`** — distingue « propriété absente » de « propriété présente valant `undefined` ».

```ts
// avec exactOptionalPropertyTypes: true
interface Prefs { theme?: "light" | "dark"; }

const a: Prefs = {};                    // ✅ propriété absente
const b: Prefs = { theme: undefined };  // ❌ undefined n'est PAS "light" | "dark"
// il faut theme?: "light" | "dark" | undefined pour l'autoriser explicitement
```

**`verbatimModuleSyntax`** (TS 5.0+, remplace `importsNotUsedAsValues` + `preserveValueImports`) — TypeScript n'élide plus « intelligemment » les imports : ce qui n'est pas marqué `import type` est **conservé** tel quel dans l'émission. Force donc `import type` pour les imports de types purs.

```ts
// avec verbatimModuleSyntax: true
import type { Member } from "./types";   // ✅ type -> effacé à l'émission
import { fetchMember } from "./api";     // ✅ valeur -> conservé

import { Member, fetchMember } from "./api";
// ❌ si Member n'est qu'un type : il faut séparer en 'import type'
```

Bénéfice : la frontière type/valeur devient explicite, ce qui évite les surprises CJS/ESM et permet aux transpileurs mono-fichier de faire leur travail.

### 2.6 `isolatedModules`

Garantit que **chaque fichier peut être transpilé isolément**, sans vue globale du projet. **Obligatoire** dès qu'on transpile avec esbuild / swc / Babel (Vite, tsx…), qui traitent un fichier à la fois.

```ts
// avec isolatedModules: true
export { Member } from "./types";        // ❌ ambigu si Member est un type
export type { Member } from "./types";   // ✅ explicite

const enum Direction { Nord, Sud }       // ❌ const enum interdit (besoin vue globale)
```

`isolatedModules` ne transpile rien lui-même : c'est un **garde-fou** qui interdit les constructions que les outils mono-fichier ne savent pas gérer.

### 2.7 `skipLibCheck`

Ne type-check pas les `.d.ts` (dont ceux de `node_modules`). Gain de temps énorme, défaut quasi universel.

```jsonc
{ "compilerOptions": { "skipLibCheck": true } }
```

À désactiver seulement quand tu développes une **librairie de types** et veux valider tes propres `.d.ts`.

### 2.8 `paths` et `baseUrl`

Alias d'import pour éviter les `../../../`.

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",                 // ancre des chemins relatifs de paths
    "paths": {
      "@/*": ["src/*"],             // @/components/Card -> src/components/Card
      "@shared/*": ["../shared/src/*"]
    }
  }
}
```

**Piège majeur :** `paths` ne modifie **PAS** le JS émis. Il faut répliquer l'alias dans le bundler (`resolve.alias` de Vite) et dans le test-runner (`vitest`/`jest`), sinon ça compile mais plante au runtime.

### 2.9 `outDir`, `rootDir`, `declaration`, `sourceMap`

```jsonc
{
  "compilerOptions": {
    "rootDir": "./src",       // racine des sources (structure reproduite dans outDir)
    "outDir": "./dist",       // où va le JS émis
    "declaration": true,      // génère les .d.ts (indispensable pour une lib publiée)
    "declarationMap": true,   // .d.ts.map : "go to definition" saute vers le .ts source
    "sourceMap": true         // .js.map : debug le TS d'origine dans le navigateur
  }
}
```

### 2.10 `extends` et configs de base

`extends` fait hériter d'un autre tsconfig. On factorise les options communes dans un `tsconfig.base.json`, ou on part d'une base publiée `@tsconfig/*`.

```jsonc
// tsconfig.json d'un package
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist" }
}
```

```jsonc
// base publiée prête à l'emploi
{ "extends": "@tsconfig/node20/tsconfig.json" }
```

Les packages `@tsconfig/bases` (`@tsconfig/node20`, `@tsconfig/strictest`, `@tsconfig/vite-react`…) donnent des socles maintenus par la communauté. TS 5.0+ accepte aussi un **tableau** d'`extends` (`"extends": ["@tsconfig/strictest/tsconfig.json", "./local.json"]`, appliqué de gauche à droite).

### 2.11 Project references et `composite`

Dans un monorepo, un seul tsconfig géant est lent (une modif recompile tout) et mélange les frontières. Les **project references** découpent en sous-projets typés indépendamment.

```jsonc
// tsconfig.json racine — orchestrateur, ne compile aucun fichier lui-même
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/admin" }
  ]
}
```

```jsonc
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,        // OBLIGATOIRE pour être référencé
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

```jsonc
// packages/api/tsconfig.json — dépend de shared
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "./src", "outDir": "./dist" },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

`composite: true` active `incremental` + `declaration` et impose que tous les fichiers soient couverts par `include`/`files`. Un projet référencé consomme les **`.d.ts` émis** de ses dépendances, pas leurs sources.

### 2.12 `tsc --build`

Le mode build (`tsc -b`) lit le graphe de `references`, compile dans l'ordre topologique, et met en cache via `.tsbuildinfo`.

```bash
tsc --build                    # compile tout le graphe dans le bon ordre
tsc --build packages/api       # ce projet + ses dépendances
tsc --build --watch            # recompile à chaque modif
tsc --build --clean            # supprime les sorties
tsc --build --force            # ignore le cache
```

Seuls les projets modifiés (et leurs dépendants) sont recompilés.

### 2.13 TypeScript comme type-checker SEUL

Pattern moderne : **tsc ne produit plus le JS**, il ne fait que **vérifier les types**. C'est Vite / esbuild / swc qui transpilent (bien plus vite, mais **sans** vérification de types).

```jsonc
// tsconfig.json d'une app Vite
{
  "compilerOptions": {
    "noEmit": true,             // tsc ne produit rien : Vite build le JS
    "isolatedModules": true,    // requis par la transpilation mono-fichier
    "verbatimModuleSyntax": true
  }
}
```

```jsonc
// package.json
{
  "scripts": {
    "typecheck": "tsc --noEmit",   // la vraie sécurité de types
    "build": "vite build",         // le JS de prod (esbuild, sans type-check)
    "dev": "vite"
  }
}
```

Conséquence : le type-check devient une étape CI **séparée** du build. Un `vite build` peut réussir avec des erreurs de types — d'où l'importance de `tsc --noEmit` dans le pipeline.

---

## 3. Worked examples

### Exemple 1 — Réparer le tsconfig du cas concret (app Vite TribuZen)

On part du fichier cassé de la section 1 et on le reconstruit, justifié.

```jsonc
// tsconfig.json — app front TribuZen (Vite + React)
{
  "compilerOptions": {
    // 1. Cible moderne : navigateurs à jour, JS émis léger
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // 2. Modules pensés pour un bundler
    "module": "ESNext",
    "moduleResolution": "Bundler",

    // 3. Rigueur maximale
    "strict": true,                     // méta-flag (null checks, no implicit any, …)
    "noUncheckedIndexedAccess": true,   // array[i] -> T | undefined
    "exactOptionalPropertyTypes": true, // {a?:T} != {a:undefined}

    // 4. Transpilation mono-fichier (Vite/esbuild)
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,                     // tsc = type-checker ; Vite émet le JS

    // 5. Confort & perf
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",

    // 6. Alias — à répliquer dans vite.config.ts !
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Points corrigés vs. le fichier cassé :
- `ES5` → `ES2022` : plus de transpilation inutile de `?.`/`??`.
- `AMD` → `ESNext` + `moduleResolution: Bundler` : cohérent avec Vite.
- `strict: false` → `strict: true` + deux sous-flags : les bugs `null` remontent à la compilation.
- `skipLibCheck: false` → `true` : compilation rapide.
- `include: ["**/*"]` → `["src"]` + `exclude` : on ne compile plus `node_modules`.

L'alias Vite correspondant :

```ts
// vite.config.ts — SANS ça, "@/..." plante au runtime
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

### Exemple 2 — Activer `noUncheckedIndexedAccess` et corriger les erreurs

On active le flag sur un utilitaire TribuZen existant. Voici ce que le compilateur révèle et comment corriger.

```ts
// AVANT — compile en strict, mais faux dès que l'index est hors bornes
function premierAdmin(membres: Member[]): string {
  const admins = membres.filter((m) => m.role === "admin");
  return admins[0].name;   // suppose qu'il existe TOUJOURS un admin
}

function libelleRole(role: string): string {
  const LABELS: Record<string, string> = { admin: "Admin", mod: "Modo" };
  return LABELS[role].toUpperCase();   // plante si role == "member"
}
```

```ts
// APRÈS activation de noUncheckedIndexedAccess -> deux erreurs, deux corrections
function premierAdmin(membres: Member[]): string | undefined {
  const admins = membres.filter((m) => m.role === "admin");
  // admins[0] : Member | undefined  -> on gère l'absence
  return admins[0]?.name;
}

function libelleRole(role: string): string {
  const LABELS: Record<string, string> = { admin: "Admin", mod: "Modo" };
  // LABELS[role] : string | undefined -> fallback explicite
  return (LABELS[role] ?? "Membre").toUpperCase();
}
```

Le flag a transformé deux plantages `undefined` potentiels en erreurs de compilation. C'est exactement l'effet recherché sur du code manipulant des listes/maps venant d'une API.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `strict: true` active `noUncheckedIndexedAccess`

```jsonc
// ❌ Mauvaise croyance : "strict couvre tout"
{ "compilerOptions": { "strict": true } }
// array[999] reste typé T (pas T | undefined) : les accès hors bornes passent
```

`strict` regroupe 8 flags (section 2.4) mais **PAS** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ni `noImplicitReturns`/`noUnusedLocals`. Il faut les ajouter explicitement. Base la plus stricte prête à l'emploi : `@tsconfig/strictest`.

### PIÈGE #2 — `paths` sans alias côté bundler/runtime

```ts
import { Card } from "@/components/Card";
// ✅ tsc content   ❌ à l'exécution : "Cannot find module '@/components/Card'"
```

`paths` n'agit **que** sur la résolution de types de `tsc`. Le JS émis garde `"@/components/Card"` littéralement. Il faut le même alias dans `vite.config.ts` (`resolve.alias`), `vitest`, ou `tsconfig-paths` pour `ts-node`. **Signal d'alarme :** ça compile mais l'import casse au `npm run dev`.

### PIÈGE #3 — Confondre `module` et `moduleResolution`

`module` = **ce que TypeScript émet** (`import` ESM vs `require` CJS). `moduleResolution` = **comment TypeScript cherche** les fichiers importés. Ce sont deux axes indépendants : on peut émettre de l'ESM (`module: ESNext`) tout en résolvant à la mode bundler (`moduleResolution: Bundler`). Mettre `moduleResolution: Node10` avec un projet ESM moderne casse la résolution des `exports` de `package.json`.

### PIÈGE #4 — Oublier `composite` sur un projet référencé

```jsonc
// tsconfig racine
{ "references": [{ "path": "./packages/shared" }] }
```

```
error TS6306: Referenced project must have "composite": true
```

Tout projet cité dans `references` **doit** avoir `composite: true`. Et on lance `tsc --build` (pas `tsc` seul) pour respecter l'ordre du graphe : `tsc` simple ignore les `references`.

### PIÈGE #5 — Croire que `vite build` vérifie les types

esbuild (dans Vite) **transpile sans type-checker** : il jette les annotations de types sans les valider. Un `vite build` peut réussir alors que `tsc --noEmit` échoue. C'est pourquoi le pipeline CI doit lancer `tsc --noEmit` **en plus** du build. `isolatedModules: true` force au moins un code compatible mono-fichier, mais ne remplace pas le type-check.

### PIÈGE #6 — `verbatimModuleSyntax` sans `import type`

```ts
// ❌ avec verbatimModuleSyntax : Member est un type, mais importé comme valeur
import { Member, saveMember } from "./member";
// error : 'Member' is a type and must be imported using a type-only import
```

`verbatimModuleSyntax` n'élide plus automatiquement : un import de type non marqué `import type` est conservé à l'émission, ce qui produit un import de runtime vers un symbole inexistant. Correction : séparer `import type { Member }` et `import { saveMember }`.

---

## 5. Ancrage TribuZen

TribuZen commence en app Vite mono-package, puis migre en monorepo. Deux tsconfig successifs.

**Phase 1 — app front unique.** Le `tsconfig.json` de l'app est celui de l'Exemple 1 : `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `paths: { "@/*": ["src/*"] }`, `noEmit: true` (Vite build). C'est le socle sur lequel reposent toutes les garanties de type des modules précédents (declaration files, narrowing, unions de rôles).

**Phase 2 — monorepo.** L'app se scinde en trois packages :

```
tribuzen/
  tsconfig.base.json          # options communes (strict + sous-flags)
  tsconfig.json               # orchestrateur : references shared/api/admin
  packages/
    shared/                   # types Member, Family, Event + utils purs
      tsconfig.json           # composite: true, module NodeNext
    api/                      # backend NestJS/Express — dépend de shared
      tsconfig.json           # composite: true, references shared
    admin/                    # front Vite React — dépend de shared
      tsconfig.json           # composite: true, moduleResolution Bundler, references shared
```

- `shared` détient les types métier partagés ; `api` et `admin` consomment ses **`.d.ts` émis**, pas ses sources.
- `tsc --build` compile `shared` d'abord, puis `api` et `admin` en parallèle.
- Modifier un type dans `shared` ne recompile que les packages qui en dépendent (cache `.tsbuildinfo`).

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  tsconfig.base.json
  tsconfig.json
  packages/shared/tsconfig.json
  packages/api/tsconfig.json
  packages/admin/tsconfig.json
```

C'est exactement l'objet du lab associé : écrire ce socle de prod, puis activer un sous-flag strict et corriger les erreurs qu'il révèle dans `shared`.

---

## 6. Points clés

1. `target` fixe la version JS émise, `module` le format des imports émis, `moduleResolution` la façon de retrouver les fichiers — trois axes distincts.
2. `lib` déclare les APIs globales supposées présentes (`DOM`, `ES2022`) ; sans elles, `document` ou `.at()` sont inconnus.
3. `strict: true` est un méta-flag (8 vérifications, dont `strictNullChecks`) mais n'inclut PAS `noUncheckedIndexedAccess` ni `exactOptionalPropertyTypes`.
4. `noUncheckedIndexedAccess` ajoute `| undefined` à tout accès indexé ; `exactOptionalPropertyTypes` sépare « absent » de « présent = undefined ».
5. `verbatimModuleSyntax` (TS 5.0+) conserve les imports non marqués `import type` : la frontière type/valeur devient obligatoire et explicite.
6. `isolatedModules` garantit un code transpilable fichier par fichier — requis par esbuild/swc/Vite.
7. `paths` n'agit que sur `tsc` : il faut répliquer l'alias dans le bundler et le test-runner.
8. Les project references (`composite: true` + `references` + `tsc --build`) découpent un monorepo ; chaque projet consomme les `.d.ts` de ses dépendances.
9. En stack moderne, `tsc --noEmit` type-check et Vite/esbuild transpile — le type-check est une étape CI séparée du build.

---

## 7. Seeds Anki

```
Quelle est la différence entre target, module et moduleResolution ?|target = version JS émise. module = format des import/export émis (ESM vs CommonJS). moduleResolution = algorithme pour retrouver les fichiers importés (Node10, NodeNext, Bundler). Trois axes indépendants.
strict: true active-t-il noUncheckedIndexedAccess ?|Non. strict est un méta-flag de 8 vérifications (dont strictNullChecks, noImplicitAny) mais noUncheckedIndexedAccess, exactOptionalPropertyTypes et noImplicitReturns doivent être ajoutés séparément. Base la plus stricte : @tsconfig/strictest.
Que change noUncheckedIndexedAccess ?|Il ajoute | undefined à tout accès indexé : array[i] devient T | undefined, record[key] devient V | undefined. Force à gérer les accès hors bornes (optional chaining ou fallback ??).
Que fait exactOptionalPropertyTypes ?|Il distingue une propriété absente d'une propriété présente valant undefined. Avec le flag, { theme?: "dark" } n'accepte plus { theme: undefined } sauf si le type inclut explicitement undefined.
Pourquoi verbatimModuleSyntax force-t-il import type ?|Il désactive l'élision automatique : tout import non marqué import type est conservé à l'émission. Un import de type pur non marqué produirait un import runtime vers un symbole inexistant. Remplace importsNotUsedAsValues + preserveValueImports (TS 5.0+).
À quoi sert isolatedModules ?|Il garantit que chaque fichier est transpilable isolément, sans vue globale du projet. Requis par esbuild/swc/Babel/Vite. Interdit const enum et impose export type pour les re-exports de types.
Le flag paths modifie-t-il le JS émis ?|Non. paths n'agit que sur la résolution de types de tsc. Le JS émis garde l'alias littéral. Il faut répliquer l'alias dans le bundler (vite resolve.alias), vitest, ou tsconfig-paths, sinon l'import plante au runtime.
Que faut-il pour un projet référencé dans un monorepo TypeScript ?|composite: true (active incremental + declaration, exige include complet), une entrée dans references du parent, et compiler avec tsc --build (pas tsc seul) pour respecter l'ordre topologique. Chaque projet consomme les .d.ts de ses dépendances.
vite build vérifie-t-il les types ?|Non. esbuild transpile sans type-checker : il jette les annotations sans les valider. Il faut lancer tsc --noEmit en plus dans la CI. Le type-check est une étape séparée du build.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-17-tsconfig/README.md`. Écrire de zéro le tsconfig de prod strict de TribuZen (strict + noUncheckedIndexedAccess + paths), le découper en project references `shared / api / admin`, puis activer un sous-flag strict et corriger les erreurs révélées.
