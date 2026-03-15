# 17 — Configuration avancee & Performance du compilateur

| Metadata     | Valeur                                                                 |
|-------------|------------------------------------------------------------------------|
| **Duree**       | 3h30                                                                  |
| **Difficulte**  | 4/5                                                                    |
| **Prérequis**   | Modules 1-16, experience avec npm/yarn, notions de build tools        |
| **Objectifs**   | Maîtriser tsconfig.json, optimiser la compilation, configurer un monorepo |

---

## Introduction

Le fichier `tsconfig.json` est le coeur de tout projet TypeScript. Il dicte comment
le compilateur analyse, vérifié et transforme votre code. Une bonne configuration
fait la différence entre un projet rapide et agreable à utiliser, et un projet ou
la compilation prend des minutes et les erreurs de type sont incomprehensibles.

> **Analogie du tableau de bord** : `tsconfig.json` est comme le tableau de bord
> d'un avion. Chaque option est un bouton ou un cadran. Mal configurer un seul
> paramètre peut faire devier tout le projet. Mais une fois maîtrise, vous avez
> un controle total sur la compilation.

---

## tsconfig.json : structure complete

### Vue d'ensemble

```json
// tsconfig.json — Structure globale
{
  // Options du compilateur TypeScript
  "compilerOptions": { /* ... */ },

  // Fichiers a inclure dans la compilation
  "include": ["src/**/*"],

  // Fichiers a exclure
  "exclude": ["node_modules", "dist", "**/*.test.ts"],

  // Liste explicite de fichiers (rare, preferez include)
  "files": ["src/main.ts"],

  // Heriter d'une autre configuration
  "extends": "./tsconfig.base.json",

  // References de projets (monorepos)
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" }
  ]
}
```

### Options de compilation : target & module

```typescript
// target — Quelle version de JavaScript generer ?
{
  "compilerOptions": {
    // "ES5"     -> compatible anciens navigateurs (IE11)
    // "ES2015"  -> let, const, arrow functions, classes
    // "ES2016"  -> includes(), exponentation (**)
    // "ES2017"  -> async/await
    // "ES2018"  -> spread sur objets, for-await-of
    // "ES2019"  -> flat(), flatMap(), Object.fromEntries()
    // "ES2020"  -> BigInt, nullish coalescing (??)
    // "ES2021"  -> replaceAll(), Promise.any()
    // "ES2022"  -> top-level await, class fields, .at()
    // "ES2023"  -> findLast(), toSorted(), toReversed()
    // "ESNext"  -> derniere version (change avec les mises a jour de TS)

    "target": "ES2022" // Recommande pour les projets modernes
  }
}

// Exemple de l'impact de target sur le code genere :

// Code TypeScript source :
// const resultat = tableau?.at(-1) ?? "defaut";

// Avec target: "ES2022" (supporte nativement) :
// const resultat = tableau?.at(-1) ?? "defaut";

// Avec target: "ES5" (transpile) :
// var resultat = (tableau === null || tableau === void 0
//   ? void 0 : tableau.at(-1)) !== null && ... !== void 0
//   ? ... : "defaut";
```

```typescript
// module — Quel systeme de modules generer ?
{
  "compilerOptions": {
    // "CommonJS"   -> require() / module.exports (Node.js classique)
    // "ES2015"     -> import/export (ESM basique)
    // "ES2020"     -> + import() dynamique, import.meta
    // "ES2022"     -> + top-level await
    // "ESNext"     -> derniere spec ESM
    // "Node16"     -> resolution hybride CJS/ESM pour Node 16+
    // "NodeNext"   -> idem, suit les mises a jour Node
    // "Preserve"   -> garde les imports tels quels (TS 5.4+)

    "module": "NodeNext" // Recommande pour Node.js moderne
  }
}

// L'option 'module' affecte comment TypeScript genere les imports/exports :

// Avec module: "CommonJS" :
// const express_1 = require("express");
// exports.app = express_1.default();

// Avec module: "ES2022" :
// import express from "express";
// export const app = express();
```

### moduleResolution

```typescript
// moduleResolution — Comment TypeScript TROUVE les modules importes
{
  "compilerOptions": {
    // "Classic"    -> Ancien algorithme (deprecie)
    // "Node10"     -> Algorithme Node.js classique (anciennement "Node")
    // "Node16"     -> Supporte package.json "exports", .mjs/.cjs
    // "NodeNext"   -> Idem, suit les mises a jour Node
    // "Bundler"    -> Pour les bundlers (Vite, Webpack, esbuild)

    "moduleResolution": "NodeNext"
    // Ou "Bundler" si vous utilisez Vite/Webpack
  }
}

// La difference entre Node10 et NodeNext est IMPORTANTE :

// Node10 : resout "lodash" en cherchant :
//   node_modules/lodash/index.js
//   node_modules/lodash/package.json -> "main"

// NodeNext : resout "lodash" en cherchant :
//   node_modules/lodash/package.json -> "exports" (prioritaire !)
//   node_modules/lodash/package.json -> "main" (fallback)
//   + supporte les conditions : import, require, types, default

// Bundler : comme NodeNext mais sans forcer les extensions dans les imports
//   import { truc } from "./utils"     // OK (sans .js)
//   import { truc } from "./utils.js"  // OK aussi
```

### lib

```typescript
// lib — Quelles APIs standard sont disponibles ?
{
  "compilerOptions": {
    // lib definit quelles declarations de type standard sont incluses
    // Si non specifie, depend de 'target'

    "lib": [
      "ES2022",        // APIs JavaScript ES2022
      "DOM",           // APIs du navigateur (document, window, etc.)
      "DOM.Iterable",  // Iterables du DOM (NodeList, etc.)
      "WebWorker"      // APIs Web Worker (optionnel)
    ]

    // Pour un projet Node.js (sans DOM) :
    // "lib": ["ES2022"]
    // Les types Node viennent de @types/node, pas de lib

    // Pour un projet navigateur :
    // "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}

// Exemple : sans "DOM" dans lib, ces types n'existent pas :
// const div = document.createElement("div"); // Erreur : 'document' n'existe pas
// const reponse = await fetch("/api");        // Erreur : 'fetch' n'existe pas

// Avec "ES2022" dans lib, ces methodes existent :
// const dernier = [1, 2, 3].at(-1);     // OK : .at() est dans ES2022
// const obj = Object.hasOwn({}, "cle");  // OK : Object.hasOwn dans ES2022
```

### strict et ses composants

```json
// strict — Le flag le plus important
{
  "compilerOptions": {
    // Active TOUTES les verifications strictes
    "strict": true

    // Equivalent a activer chacun de ces flags :
    // "noImplicitAny": true,
    // "noImplicitThis": true,
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictPropertyInitialization": true,
    // "strictBindCallApply": true,
    // "useUnknownInCatchVariables": true,
    // "alwaysStrict": true
  }
}
```

```typescript
// Impact de chaque flag strict :

// --- noImplicitAny ---
// Interdit les types 'any' implicites
function traiter(donnees) {} // Erreur : parametre 'donnees' a un type 'any' implicite
function traiterOK(donnees: unknown) {} // OK

// --- strictNullChecks ---
// null et undefined sont des types distincts
const element = document.getElementById("app"); // Type: HTMLElement | null
// element.textContent = "Bonjour"; // Erreur : 'element' peut etre null
element?.textContent; // OK avec optional chaining
if (element) { element.textContent = "Bonjour"; } // OK avec narrowing

// --- strictFunctionTypes ---
// Contravariance stricte des parametres de fonctions
type Handler = (e: MouseEvent) => void;
const fn: Handler = (e: Event) => {}; // Erreur : Event n'est pas MouseEvent

// --- strictPropertyInitialization ---
class Service {
  // nom: string; // Erreur : pas initialise dans le constructeur
  nom: string = ""; // OK : valeur par defaut
  description!: string; // OK : assertion d'initialisation (! dit "je gere")
  constructor() {
    this.nom = "MonService";
  }
}

// --- useUnknownInCatchVariables ---
try {
  throw new Error("oups");
} catch (erreur) {
  // Avec le flag : erreur est 'unknown' (pas 'any')
  if (erreur instanceof Error) {
    console.log(erreur.message); // OK apres narrowing
  }
}
```

### paths et baseUrl

```json
// paths — Alias de chemins d'import
{
  "compilerOptions": {
    // baseUrl necessaire pour que paths fonctionne
    "baseUrl": ".",

    "paths": {
      // Alias simple : @/* pointe vers src/*
      "@/*": ["src/*"],

      // Alias specifiques
      "@composants/*": ["src/ui/composants/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],

      // Redirection vers un fichier specifique
      "@config": ["src/config/index.ts"]
    }
  }
}
```

```typescript
// AVANT les alias de chemin :
import { Utilisateur } from "../../../types/utilisateur";
import { formaterDate } from "../../../../utils/date";
import { Button } from "../../../ui/composants/Button";

// APRES les alias :
import { Utilisateur } from "@types/utilisateur";
import { formaterDate } from "@utils/date";
import { Button } from "@composants/Button";

// ATTENTION : paths ne modifie PAS le code emis !
// Il faut aussi configurer l'alias dans le bundler :
// - Vite : resolve.alias
// - Webpack : resolve.alias
// - Jest : moduleNameMapper
// - ts-node : tsconfig-paths
```

### rootDir et outDir

```json
// rootDir et outDir — Organisation des fichiers
{
  "compilerOptions": {
    // Racine des fichiers source (TypeScript s'en sert pour
    // reproduire la structure de dossiers dans outDir)
    "rootDir": "./src",

    // Dossier de sortie pour les fichiers compiles
    "outDir": "./dist"
  }
}

// Structure source :
// src/
//   index.ts
//   utils/
//     date.ts
//   models/
//     utilisateur.ts

// Structure de sortie (outDir) :
// dist/
//   index.js
//   utils/
//     date.js
//   models/
//     utilisateur.js
```

---

## Project Références (Références de projets)

### Le problème des grands projets

```typescript
// Dans un grand projet ou un monorepo, compiler tout en un seul
// tsconfig.json devient LENT et difficile a maintenir

// Problemes :
// 1. Modification d'un fichier -> recompilation de TOUT le projet
// 2. Les erreurs de type d'un package affectent tous les autres
// 3. L'IDE est lent car il analyse tout

// Solution : Project References
// Decouper le projet en sous-projets avec leurs propres tsconfig
```

### Configuration des références

```
# Structure d'un monorepo avec project references
monorepo/
  tsconfig.json            <- Configuration racine
  packages/
    core/
      tsconfig.json        <- Sous-projet "core"
      src/
        index.ts
    api/
      tsconfig.json        <- Sous-projet "api"
      src/
        index.ts
    web/
      tsconfig.json        <- Sous-projet "web"
      src/
        index.ts
```

```json
// monorepo/tsconfig.json (racine)
{
  // Ce fichier reference tous les sous-projets
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}
```

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,        // OBLIGATOIRE pour les project references
    "declaration": true,      // OBLIGATOIRE : genere les .d.ts
    "declarationMap": true,   // Recommande : navigation vers les sources
    "rootDir": "./src",
    "outDir": "./dist",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  },
  "include": ["src/**/*"]
}
```

```json
// packages/api/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  },
  "include": ["src/**/*"],
  "references": [
    // Ce sous-projet DEPEND de "core"
    { "path": "../core" }
  ]
}
```

```json
// packages/web/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }
  ]
}
```

### Heriter d'une configuration de base

```json
// tsconfig.base.json — Configuration partagee
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```json
// packages/api/tsconfig.json — Herite de la base
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // Surcharger/completer les options de base
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }
  ]
}
```

### tsc --build (mode build)

```bash
# Le mode --build (ou -b) compile les project references
# dans le bon ordre, avec mise en cache

# Compiler tout le monorepo depuis la racine
tsc --build

# Compiler un sous-projet specifique (et ses dependances)
tsc --build packages/api

# Forcer une recompilation complete (ignorer le cache)
tsc --build --force

# Nettoyer les fichiers generes
tsc --build --clean

# Mode watch (recompile a chaque modification)
tsc --build --watch

# Mode verbose (pour debugger)
tsc --build --verbose
```

```typescript
// Comment tsc --build fonctionne :
// 1. Lit les 'references' de chaque tsconfig.json
// 2. Construit un graphe de dependances
// 3. Compile dans l'ordre topologique (dependances d'abord)
// 4. Utilise les .tsbuildinfo pour la compilation incrementale
// 5. Ne recompile QUE les projets modifies

// Exemple d'ordre de compilation pour notre monorepo :
// 1. core (pas de dependances)
// 2. api (depend de core) ET web (depend de core) — en parallele possible
```

---

## Compilation incrementale

### Le fichier .tsbuildinfo

```json
// tsconfig.json
{
  "compilerOptions": {
    // Active la compilation incrementale
    "incremental": true,

    // Optionnel : chemin du fichier de cache
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}

// TypeScript genere un fichier .tsbuildinfo qui contient :
// - Le hash de chaque fichier source
// - Le graphe de dependances entre fichiers
// - Les erreurs de type par fichier

// A la prochaine compilation, TypeScript compare les hashes
// et ne recompile que les fichiers modifies et leurs dependants
```

### composite vs incremental

```typescript
// Quelle est la difference ?

// incremental: true
// - Compilation incrementale pour UN SEUL projet
// - Genere .tsbuildinfo
// - Peut fonctionner seul

// composite: true
// - Active automatiquement incremental et declaration
// - NECESSAIRE pour les project references
// - Impose des contraintes supplementaires :
//   - Tous les fichiers doivent etre listes dans 'include' ou 'files'
//   - rootDir doit etre defini (ou infere)

// En resume :
// - Projet simple -> incremental: true
// - Monorepo avec references -> composite: true
```

---

## Performance de compilation

### Mesurer la performance

```bash
# Mesurer le temps de compilation
tsc --diagnostics
# Affiche : temps de verification, temps d'emission, nombre de fichiers, etc.

# Encore plus de details
tsc --extendedDiagnostics
# Affiche : temps par phase, utilisation memoire, etc.

# Generer une trace de performance
tsc --generateTrace ./trace
# Cree un dossier avec des fichiers JSON analysables
# dans chrome://tracing ou speedscope.app
```

### Options qui ameliorent la performance

```json
// tsconfig.json optimise pour la performance
{
  "compilerOptions": {
    // --- Performance directe ---

    // Ne verifie pas les .d.ts dans node_modules
    // Gain ENORME sur les grands projets
    "skipLibCheck": true,

    // Compilation incrementale
    "incremental": true,

    // Garantit que chaque fichier peut etre compile isolement
    // Necessaire pour esbuild, swc, etc.
    "isolatedModules": true,

    // --- Eviter les features couteuses ---

    // Ne pas generer le JS (si un autre outil s'en charge)
    "noEmit": true,

    // Ou ne generer que les declarations
    "emitDeclarationOnly": true
  }
}
```

### skipLibCheck en detail

```typescript
// skipLibCheck: true — Que fait-il exactement ?

// SANS skipLibCheck :
// TypeScript verifie les types dans TOUS les fichiers .d.ts
// y compris ceux dans node_modules/@types/
// Cela peut prendre beaucoup de temps et generer des erreurs
// dans des packages que vous ne controlez pas

// AVEC skipLibCheck :
// TypeScript NE verifie PAS les fichiers .d.ts
// Il fait confiance aux declarations de type existantes
// Seul VOTRE code (.ts, .tsx) est verifie

// Quand l'activer :
// - Projets avec beaucoup de dependances
// - Conflits de types entre @types/* incompatibles
// - CI/CD ou la vitesse compte

// Quand le desactiver :
// - Developpement d'une bibliotheque de types
// - Debuggage de problemes de compatibilite de types
```

### isolatedModules

```typescript
// isolatedModules: true — Pourquoi c'est important

// TypeScript compile normalement en ayant une vue GLOBALE de tout le projet
// Certaines features necessitent cette vue globale :

// 1. const enum (necessite de connaitre la valeur a la compilation)
const enum Direction {
  Nord, Sud, Est, Ouest
}
// Avec isolatedModules, les const enum sont restreints

// 2. Re-export de types depuis un fichier d'index
// export { MonType } from "./types";
// Sans isolatedModules, TS sait si MonType est un type ou une valeur
// Avec isolatedModules, il faut etre explicite :
// export type { MonType } from "./types";

// 3. namespace merging entre fichiers
// Necessite la vue globale, desactive avec isolatedModules

// POURQUOI l'activer :
// - Necessaire pour esbuild, swc, Babel, et tout transpileur
//   qui compile fichier par fichier
// - Force des bonnes pratiques (import type, etc.)
// - Recommande pour tous les projets modernes
```

---

## Outils de compilation alternatifs

### tsc vs esbuild vs swc vs tsx

```typescript
// Comparaison des outils de compilation TypeScript

// --- tsc (TypeScript Compiler) ---
// Avantages :
// - Verification de type complete
// - Generation de .d.ts
// - Support de toutes les features TS
// Inconvenients :
// - LENT pour la compilation (pas de parallelisme)
// - Pas de bundling
// Utilisation : verification de type + generation de declarations

// --- esbuild ---
// Avantages :
// - EXTREMEMENT rapide (100x plus rapide que tsc)
// - Bundler integre
// - Tree-shaking
// Inconvenients :
// - PAS de verification de type (ne fait que transpiler)
// - Support TS limite (pas de const enum, etc.)
// Utilisation : build de production, dev server

// --- swc (Speedy Web Compiler) ---
// Avantages :
// - Tres rapide (ecrit en Rust)
// - Plugin system
// - Compatible avec la plupart des features TS
// Inconvenients :
// - PAS de verification de type
// - Configuration parfois complexe
// Utilisation : transpilation rapide, Next.js

// --- tsx (TypeScript Execute) ---
// Avantages :
// - Execute directement les fichiers .ts
// - Base sur esbuild (rapide)
// - Remplacement de ts-node
// Inconvenients :
// - PAS de verification de type
// - Pour le developpement uniquement
// Utilisation : scripts, developpement, prototypage
```

### Configuration typique de production

```json
// package.json — Scripts de build modernes
{
  "scripts": {
    // Verification de type (tsc) en parallele avec le build (esbuild)
    "typecheck": "tsc --noEmit",
    "build:js": "esbuild src/index.ts --bundle --outdir=dist --platform=node",
    "build:types": "tsc --emitDeclarationOnly --outDir dist",
    "build": "npm run typecheck && npm run build:js && npm run build:types",

    // Developpement avec tsx (execution directe)
    "dev": "tsx watch src/index.ts",

    // CI : verification de type stricte
    "ci": "tsc --noEmit --strict"
  }
}
```

```typescript
// esbuild.config.ts — Configuration esbuild
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: true,
  // esbuild transpile le TS mais ne verifie pas les types
  // Il faut executer tsc --noEmit separement
});
```

---

## Configuration pour monorepo

### Structure recommandee

```
monorepo/
  package.json             <- Scripts racine
  tsconfig.json            <- References de projets
  tsconfig.base.json       <- Configuration partagee
  packages/
    core/
      package.json
      tsconfig.json        <- extends ../../tsconfig.base.json
      src/
    api/
      package.json
      tsconfig.json
      src/
    web/
      package.json
      tsconfig.json
      src/
```

```json
// tsconfig.base.json — La base partagee par tous les packages
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

### Gestion des dépendances internes

```json
// packages/core/package.json
{
  "name": "@monorepo/core",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

```json
// packages/api/package.json
{
  "name": "@monorepo/api",
  "version": "1.0.0",
  "dependencies": {
    "@monorepo/core": "workspace:*"
  }
}
```

---

## Configuration spécifique aux bundlers

### Vite + TypeScript

```json
// tsconfig.json pour un projet Vite
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",  // Important pour Vite !
    "strict": true,
    "jsx": "react-jsx",            // Pour React
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "isolatedModules": true,        // Necessaire pour Vite
    "noEmit": true,                 // Vite compile le JS
    "allowImportingTsExtensions": true, // TS 5.0+ avec noEmit
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
```

```typescript
// vite.config.ts — Configuration Vite avec TypeScript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Reproduire les paths de tsconfig.json
      "@": path.resolve(__dirname, "./src"),
      "@composants": path.resolve(__dirname, "./src/composants"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
```

### Next.js + TypeScript

```json
// tsconfig.json pour Next.js
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",               // Next.js gere le JSX
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "plugins": [
      { "name": "next" }            // Plugin TypeScript de Next.js
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Linting avec typescript-eslint

### Configuration moderne (flat config)

```typescript
// eslint.config.ts — Configuration ESLint avec typescript-eslint
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Pointer vers le tsconfig pour les regles type-aware
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Regles personnalisees
    rules: {
      // Interdire les 'any' explicites
      "@typescript-eslint/no-explicit-any": "error",

      // Forcer les types de retour explicites sur les fonctions exportees
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],

      // Interdire les assertions de type non-null (!)
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Forcer l'utilisation de 'import type' quand possible
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],

      // Interdire les promesses non gerees
      "@typescript-eslint/no-floating-promises": "error",

      // Forcer le narrowing au lieu de 'as'
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
  {
    // Ignorer certains fichiers
    ignores: ["dist/", "node_modules/", "*.js"],
  }
);
```

---

## Intégration CI/CD

### Pipeline TypeScript

```yaml
# .github/workflows/typescript.yml
name: TypeScript CI

on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      # Verification de type
      - name: Verification de type
        run: npx tsc --noEmit

      # Linting
      - name: Linting ESLint
        run: npx eslint .

      # Tests
      - name: Tests
        run: npx vitest run

      # Build
      - name: Build
        run: npm run build
```

```json
// package.json — Scripts pour CI/CD
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "ci": "npm run typecheck && npm run lint && npm run test && npm run build",
    "prepublishOnly": "npm run ci"
  }
}
```

---

## Pratique

### Exercice 1 : Diagnostiquer un tsconfig.json

Le tsconfig.json suivant a plusieurs problèmes. Identifiez et corrigez-les :

```json
{
  "compilerOptions": {
    "target": "ES3",
    "module": "AMD",
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": false,
    "isolatedModules": false,
    "outDir": "./dist",
    "declaration": false
  },
  "include": ["**/*"]
}
```

<details>
<summary>Solution</summary>

```json
// Problemes identifies et corrections :
{
  "compilerOptions": {
    // PROBLEME : ES3 est obsolete, genere du code tres verbose
    // CORRECTION : utiliser une version moderne
    "target": "ES2022",

    // PROBLEME : AMD est un format de module obsolete
    // CORRECTION : utiliser NodeNext ou ESNext
    "module": "NodeNext",

    // AJOUTE : moduleResolution doit correspondre a module
    "moduleResolution": "NodeNext",

    // PROBLEME : strict: false desactive toutes les verifications
    // CORRECTION : toujours activer strict
    "strict": true,

    // PROBLEME : noImplicitAny: false permet les 'any' partout
    // CORRECTION : inutile de le specifier si strict: true (deja inclus)
    // On le retire

    // PROBLEME : skipLibCheck: false ralentit la compilation
    // CORRECTION : activer pour de meilleures performances
    "skipLibCheck": true,

    // PROBLEME : isolatedModules: false empeche d'utiliser esbuild/swc
    // CORRECTION : activer pour la compatibilite
    "isolatedModules": true,

    "outDir": "./dist",

    // AJOUTE : rootDir pour une structure propre
    "rootDir": "./src",

    // PROBLEME : declaration: false ne genere pas les types
    // CORRECTION : activer si c'est une bibliotheque
    "declaration": true,
    "declarationMap": true,

    // AJOUTE : options importantes manquantes
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true,

    // AJOUTE : compilation incrementale
    "incremental": true
  },

  // PROBLEME : "**/*" inclut node_modules et dist !
  // CORRECTION : limiter a src
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

</details>

### Exercice 2 : Configurer un monorepo

Creez les fichiers tsconfig.json pour un monorepo avec trois packages :
- `@monorepo/shared` : types et utilitaires partages
- `@monorepo/server` : API Express (depend de shared)
- `@monorepo/client` : App React Vite (depend de shared)

<details>
<summary>Solution</summary>

```json
// tsconfig.base.json (racine)
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

```json
// tsconfig.json (racine — orchestrateur)
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ]
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

```json
// packages/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```json
// packages/client/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

</details>

### Exercice 3 : Optimiser la compilation

Votre projet met 45 secondes a compiler. Quelles options ajoutez-vous a
tsconfig.json pour ameliorer les performances ?

<details>
<summary>Solution</summary>

```json
{
  "compilerOptions": {
    // 1. Ne pas verifier les types des bibliotheques
    // Impact : ENORME — peut reduire de 50%+ le temps
    "skipLibCheck": true,

    // 2. Compilation incrementale
    // Impact : GRAND — ne recompile que les fichiers modifies
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // 3. Ne pas emettre de JS (si un bundler s'en charge)
    // Impact : MOYEN — evite l'etape d'ecriture des fichiers
    "noEmit": true,

    // 4. Isoler les modules (permet le parallelisme)
    // Impact : INDIRECT — permet d'utiliser des outils plus rapides
    "isolatedModules": true,

    // 5. Exclure les tests et fichiers non necessaires
    // Impact : MOYEN — moins de fichiers a analyser
  },

  // 6. Limiter les fichiers inclus
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ]
}

// 7. Si c'est un monorepo : utiliser les project references
// avec composite: true et tsc --build

// 8. En CI, separer verification de type et build :
// - tsc --noEmit (verification de type)
// - esbuild/swc (build JS rapide)

// 9. Utiliser --generateTrace pour identifier les goulots :
// tsc --generateTrace ./trace
// Analyser dans speedscope.app
```

</details>

---

## Récapitulatif

| Option                       | Role                                              |
|------------------------------|--------------------------------------------------|
| **target**                   | Version JS de sortie (ES2022 recommande)          |
| **module**                   | Système de modules (NodeNext/ESNext)              |
| **moduleResolution**         | Algorithme de résolution (NodeNext/Bundler)       |
| **strict**                   | Active toutes les verifications strictes          |
| **paths**                    | Alias d'import (@/*, @utils/*, etc.)             |
| **composite**                | Active les project références                     |
| **incremental**              | Compilation incrementale avec cache               |
| **skipLibCheck**             | Ignore les .d.ts (performance)                   |
| **isolatedModules**          | Compilation fichier par fichier                   |
| **declaration**              | Genere les fichiers .d.ts                         |
| **noEmit**                   | Ne généré pas de JS (bundler externe)            |

---

## Pour aller plus loin

Dans le prochain module, **Module 18 — Patterns de conception en TypeScript**,
nous verrons comment appliquer les patterns classiques (Strategy, Observer, Builder,
Result, etc.) en tirant pleinement parti du système de types de TypeScript.

Une bonne configuration `tsconfig.json` est le socle sur lequel reposent tous
ces patterns : sans `strict: true`, la plupart des garanties de type que nous
allons exploiter n'existeraient pas.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 17 tsconfig](../screencasts/screencast-17-tsconfig.md)
2. **Lab** : [lab-17-tsconfig](../labs/lab-17-tsconfig/README)
3. **Quiz** : [quiz 17 tsconfig](../quizzes/quiz-17-tsconfig.html)
:::
