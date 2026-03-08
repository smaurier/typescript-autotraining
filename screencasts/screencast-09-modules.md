# Screencast 09 — Modules : ESM, CommonJS et resolution

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/09-modules.md`
- **Lab associe** : Lab 09
- **Prerequis** : Screencast 08 (enums et tuples)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Dossier `src/09-modules/` pret a etre cree
- [ ] `tsconfig.json` accessible pour les modifications

## Script

### [00:00-03:30] ESM : import et export

> Les modules sont la facon d'organiser le code TypeScript en unites reutilisables. Dans ce screencast, nous allons voir les deux systemes de modules — ESM et CommonJS — les barrel files, et le mecanisme de resolution de modules.

**Action** : Creer le dossier `src/09-modules/` et le fichier `src/09-modules/math.ts`.

```typescript
// src/09-modules/math.ts

// Export nomme
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// Export d'un type
export interface MathOperation {
  (a: number, b: number): number;
}

// Export d'une constante
export const PI = 3.14159265359;

// Export par defaut
export default class Calculator {
  private history: string[] = [];

  calculate(a: number, b: number, op: MathOperation): number {
    const result = op(a, b);
    this.history.push(`${a} op ${b} = ${result}`);
    return result;
  }

  getHistory(): string[] {
    return [...this.history];
  }
}
```

**Action** : Creer le fichier `src/09-modules/main.ts`.

```typescript
// src/09-modules/main.ts

// Import par defaut
import Calculator from "./math.js";

// Import nommes
import { add, subtract, PI } from "./math.js";

// Import avec alias
import { multiply as mult } from "./math.js";

// Import de type (efface a la compilation)
import type { MathOperation } from "./math.js";

// Utilisation
const calc = new Calculator();
console.log(add(2, 3));        // 5
console.log(subtract(10, 4));  // 6
console.log(mult(3, 7));       // 21
console.log(PI);               // 3.14159...

const op: MathOperation = add;
console.log(calc.calculate(5, 3, op)); // 8
console.log(calc.getHistory());

// Import namespace : tout sous un alias
import * as MathUtils from "./math.js";
console.log(MathUtils.add(1, 1)); // 2
```

**Action** : Montrer l'extension `.js` dans les imports et expliquer pourquoi.

> Notez l'extension `.js` dans les imports, meme si le fichier source est `.ts`. Avec `moduleResolution: "Node16"`, TypeScript exige l'extension de fichier de sortie. C'est un point qui surprend souvent.

### [03:30-07:30] Import type et re-export

> L'import `type` est important pour la performance et la clarte.

**Action** : Creer le fichier `src/09-modules/types.ts`.

```typescript
// src/09-modules/types.ts

// Fichier dedie aux types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export type Id = string | number;

// Re-export depuis un autre module
export { add, subtract } from "./math.js";
export type { MathOperation } from "./math.js";
```

**Action** : Creer le fichier `src/09-modules/user-service.ts`.

```typescript
// src/09-modules/user-service.ts

// import type — efface a la compilation, zero impact runtime
import type { User, Id } from "./types.js";

export function createUser(name: string, email: string): User {
  return {
    id: crypto.randomUUID(),
    name,
    email,
  };
}

export function findUser(users: User[], id: Id): User | undefined {
  return users.find((u) => u.id === id);
}

// Inline type import dans un import mixte
import { add, type MathOperation } from "./types.js";

const op: MathOperation = add;
```

> `import type` garantit que l'import est efface a la compilation. Cela evite les imports circulaires au runtime et clarifie l'intention. Depuis TypeScript 4.5, on peut aussi ecrire `import { type X, Y }` pour mixer types et valeurs dans un meme import.

### [07:30-11:30] Barrel files et structure de projet

> Les barrel files centralisent les exports d'un dossier pour simplifier les imports.

**Action** : Creer la structure suivante.

```typescript
// src/09-modules/models/user.ts
export interface User {
  id: string;
  name: string;
}

export function createUser(name: string): User {
  return { id: crypto.randomUUID(), name };
}
```

```typescript
// src/09-modules/models/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}

export function createProduct(name: string, price: number): Product {
  return { id: crypto.randomUUID(), name, price };
}
```

```typescript
// src/09-modules/models/index.ts — le barrel file
export { User, createUser } from "./user.js";
export { Product, createProduct } from "./product.js";
```

```typescript
// src/09-modules/app.ts
// Grace au barrel file, un seul import suffit
import { createUser, createProduct } from "./models/index.js";

const user = createUser("Alice");
const product = createProduct("Laptop", 999);

console.log(user);
console.log(product);
```

**Action** : Montrer la difference entre importer depuis chaque fichier individuel vs depuis le barrel file.

> Les barrel files (`index.ts`) regroupent les exports. L'import depuis `./models/index.js` est equivalent a `./models` dans certaines configurations. Attention cependant : trop de barrel files dans un gros projet peut ralentir la compilation et provoquer des imports circulaires.

### [11:30-15:00] CommonJS vs ESM et configuration

> TypeScript supporte les deux systemes de modules. Voyons les differences de configuration.

**Action** : Montrer les differences dans `tsconfig.json`.

```json
// Configuration ESM (recommandee pour les projets modernes)
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "target": "ES2022"
  }
}
```

```json
// Configuration CommonJS (projets legacy)
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "target": "ES2020",
    "esModuleInterop": true
  }
}
```

**Action** : Creer un exemple CommonJS pour montrer la syntaxe.

```typescript
// Style CommonJS (si module: "CommonJS")
// En TypeScript, on utilise toujours la syntaxe ESM
// tsc compile vers require() automatiquement

// Importer un module CommonJS depuis ESM
// Avec esModuleInterop: true
import express from "express"; // fonctionne meme si express est CommonJS

// Sans esModuleInterop
// import * as express from "express"; // ancienne syntaxe
```

> En 2026, ESM est le standard. Utilisez `module: "Node16"` ou `"NodeNext"` pour les nouveaux projets. `esModuleInterop` permet d'importer des modules CommonJS avec la syntaxe `import default`.

### [15:00-17:30] Resolution de modules et recapitulatif

> Comprendre comment TypeScript resout les imports est essentiel pour debugger les problemes de modules.

**Action** : Montrer le schema de resolution.

```typescript
// Resolution de "import { X } from './math.js'"
// 1. Cherche ./math.ts
// 2. Cherche ./math.tsx
// 3. Cherche ./math/index.ts

// Resolution de "import { X } from 'lodash'"
// 1. Cherche dans node_modules/lodash/package.json -> types/typings
// 2. Cherche node_modules/lodash/index.d.ts
// 3. Cherche node_modules/@types/lodash/index.d.ts

// Pour debugger la resolution :
// npx tsc --traceResolution | head -50
```

**Action** : Executer `npx tsc --traceResolution` et montrer la sortie (les premieres lignes).

> En resume : ESM est le standard moderne, `import type` separe les types des valeurs, les barrel files centralisent les exports, et la resolution de modules suit un algorithme predictible. Avec `module: "Node16"`, n'oubliez pas les extensions `.js` dans vos imports. Dans le prochain screencast, nous explorerons les utility types.

## Points d'attention pour l'enregistrement
- Creer les fichiers dans l'ordre pour que les imports fonctionnent
- Insister sur l'extension `.js` obligatoire avec `moduleResolution: "Node16"`
- Montrer `import type` vs `import` pour clarifier la distinction
- Le barrel file est un pattern courant — montrer l'avantage concret
- Executer `npx tsc` pour montrer les fichiers generes et les require/import dans le JS
