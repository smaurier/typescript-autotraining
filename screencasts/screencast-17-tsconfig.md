# Screencast 17 — tsconfig.json en profondeur

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/17-tsconfig.md`
- **Lab associe** : Lab 17
- **Prerequis** : Screencast 09 (modules), Screencast 16 (declaration files)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] `tsconfig.json` existant dans le projet
- [ ] Plusieurs fichiers TypeScript existants pour tester les options

## Script

### [00:00-04:00] Structure et options fondamentales

> Le fichier `tsconfig.json` controle tout le comportement du compilateur TypeScript. Dans ce screencast, nous allons explorer en profondeur les options les plus importantes, configurer un projet multi-packages avec les project references, et optimiser la performance de compilation.

**Action** : Ouvrir le `tsconfig.json` du projet et le remplacer par une configuration commentee.

```json
{
  // Options du compilateur
  "compilerOptions": {
    // --- Cible et runtime ---
    "target": "ES2022",
    // ES version cible. ES2022 inclut : top-level await, Array.at(), etc.

    "lib": ["ES2022"],
    // Quelles API standard inclure. Ajouter "DOM" pour le navigateur.

    // --- Modules ---
    "module": "Node16",
    // Systeme de modules : "Node16" ou "NodeNext" pour Node.js moderne

    "moduleResolution": "Node16",
    // Comment resoudre les imports. Doit correspondre a "module"

    "esModuleInterop": true,
    // Permet import X from "module-cjs" au lieu de import * as X

    "resolveJsonModule": true,
    // Permet d'importer des fichiers .json

    // --- Sortie ---
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // --- Strictness ---
    "strict": true
    // Active TOUTES les options strictes d'un coup
  },

  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Action** : Expliquer chaque section en la survolant.

> L'option `strict: true` est un raccourci qui active : `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict` et `useUnknownInCatchVariables`. Activez-la toujours dans les nouveaux projets.

### [04:00-09:00] Les options strict en detail

> Voyons ce que chaque option strict apporte concretement.

**Action** : Creer un fichier `src/17-strict-demo.ts` pour demontrer les options.

```typescript
// strictNullChecks : null et undefined sont des types distincts
function getLength(str: string | null): number {
  // Sans strictNullChecks : str.length serait OK (danger !)
  // Avec strictNullChecks :
  if (str === null) return 0;
  return str.length; // OK — TypeScript sait que str est string ici
}

// noImplicitAny : interdit les "any" implicites
// Sans noImplicitAny :
// function process(data) { ... } // data est "any" implicitement — OK
// Avec noImplicitAny :
// function process(data) { ... } // Erreur ! Le parametre a un type "any" implicite

function process(data: unknown): void {
  // Correct : type explicite
}

// strictPropertyInitialization : les proprietes de classe doivent etre initialisees
class User {
  name: string;
  // email: string; // Erreur ! Pas initialise dans le constructeur

  constructor(name: string) {
    this.name = name;
  }
}

// useUnknownInCatchVariables : catch(e) => e est unknown, pas any
try {
  throw new Error("oops");
} catch (e) {
  // e est unknown (pas any)
  if (e instanceof Error) {
    console.log(e.message); // OK apres le narrowing
  }
}

// noUncheckedIndexedAccess (pas dans strict, mais recommande)
// Avec cette option :
const arr = [1, 2, 3];
// const first: number = arr[0]; // Erreur ! arr[0] est number | undefined
const first = arr[0]; // first: number | undefined
if (first !== undefined) {
  console.log(first.toFixed(2)); // OK
}
```

**Action** : Activer et desactiver `strictNullChecks` pour montrer la difference de comportement.

> Je recommande fortement d'ajouter `noUncheckedIndexedAccess: true` en plus de `strict`. Ce n'est pas inclus dans `strict` car il a ete ajoute plus tard, mais il evite beaucoup de bugs lies aux acces par index.

### [09:00-13:30] Options de qualite de code

> Au-dela de `strict`, plusieurs options ameliorent la qualite du code.

**Action** : Ajouter les options au `tsconfig.json` et montrer les erreurs generees.

```json
{
  "compilerOptions": {
    "strict": true,

    // Options supplementaires recommandees
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,

    // Interop et compatibilite
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

**Action** : Creer des exemples qui declenchent chaque erreur.

```typescript
// noUnusedLocals
// const unused = 42; // Erreur : variable declaree mais jamais utilisee

// noUnusedParameters
// function greet(name: string, title: string) { // Erreur : title inutilise
//   return `Hello ${name}`;
// }
// Solution : prefixer avec _
function greet(name: string, _title: string) {
  return `Hello ${name}`;
}

// noFallthroughCasesInSwitch
function describe(x: number): string {
  switch (x) {
    case 1:
      return "un";
    case 2:
      return "deux";
    // case 3: // Sans return/break = erreur de fallthrough
    //   console.log("trois");
    default:
      return "autre";
  }
}

// exactOptionalPropertyTypes
interface Options {
  color?: string;
}
// Avec exactOptionalPropertyTypes :
// const opts: Options = { color: undefined }; // Erreur !
// Il faut omettre la propriete, pas la mettre a undefined
const opts: Options = {}; // OK
```

**Action** : Decommenter les erreurs une par une pour montrer les messages.

> `isolatedModules` est crucial si vous utilisez un bundler (esbuild, swc, Vite) car ces outils compilent fichier par fichier. `verbatimModuleSyntax` remplace `importsNotUsedAsValues` et force l'utilisation de `import type` pour les imports de types.

### [13:30-17:00] Project references (monorepo)

> Les project references permettent de structurer un monorepo TypeScript avec une compilation incrementale.

**Action** : Montrer la structure d'un monorepo.

```
monorepo/
  tsconfig.json          (fichier racine)
  packages/
    shared/
      tsconfig.json
      src/
        index.ts
    api/
      tsconfig.json
      src/
        index.ts
    web/
      tsconfig.json
      src/
        index.ts
```

```json
// tsconfig.json (racine) — fichier "solution"
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}
```

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"]
}
```

```json
// packages/api/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

**Action** : Montrer la compilation avec `tsc --build` (mode projet).

```bash
# Compilation incrementale de tout le monorepo
npx tsc --build

# Compilation propre (effacer les caches)
npx tsc --build --clean

# Compiler seulement un package et ses dependances
npx tsc --build packages/api
```

> `composite: true` active les project references. `tsc --build` compile les projets dans le bon ordre en respectant les dependances. La compilation incrementale ne recompile que ce qui a change — c'est essentiel pour les gros monorepos.

### [17:00-19:30] Performance et recapitulatif

> Quelques options pour accelerer la compilation dans les gros projets.

```json
{
  "compilerOptions": {
    // Compilation incrementale (hors project references)
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // Ignorer la verification des types de node_modules
    "skipLibCheck": true,

    // Pour les gros projets : compiler sans verifier les types
    // npx tsc --noEmit             (verifier les types sans compiler)
    // npx tsc --emitDeclarationOnly (generer seulement les .d.ts)
  }
}
```

```bash
# Mesurer le temps de compilation
npx tsc --diagnostics

# Generer un trace de performance
npx tsc --generateTrace ./trace
# Ouvrir dans chrome://tracing
```

**Action** : Executer `npx tsc --diagnostics` et montrer les metriques.

> En resume : `tsconfig.json` est le cerveau de votre projet TypeScript. Activez `strict` et `noUncheckedIndexedAccess` pour la securite maximale. Utilisez les project references pour les monorepos. Et mesurez la performance avec `--diagnostics` et `--generateTrace` quand la compilation devient lente.

## Points d'attention pour l'enregistrement
- Le `tsconfig.json` peut etre ecrasant — presenter les options par categorie
- Montrer l'effet concret de chaque option strict avec un exemple de code
- La section project references necessite une structure de fichiers claire
- `tsc --diagnostics` est un outil meconnu mais tres utile — le montrer
- Mentionner que `tsconfig.json` peut heriter d'un autre avec `"extends"`
