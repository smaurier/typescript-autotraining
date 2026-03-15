# Screencast 16 — Fichiers de declaration, augmentation et DefinitelyTyped

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/16-declaration-files.md`
- **Lab associe** : Lab 16
- **Prérequis** : Screencast 09 (modules)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Dossier `src/16-declarations/` pret a etre créé
- [ ] npm installe et fonctionnel
- [ ] Connexion internet pour installer des paquets

## Script

### [00:00-03:30] Les fichiers .d.ts

> Les fichiers de declaration (`.d.ts`) decrivent la forme des modules JavaScript sans contenir de code executable. Ils sont essentiels pour utiliser des librairies JavaScript en TypeScript. Voyons comment ils fonctionnent.

**Action** : Créer le dossier `src/16-declarations/` et le fichier `src/16-declarations/demo.ts`.

```typescript
// TypeScript genere des fichiers .d.ts automatiquement avec "declaration: true"
// Regardons ce que ca produit pour un module simple

// src/16-declarations/math-lib.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export interface Point {
  x: number;
  y: number;
}

export class Vector {
  constructor(public x: number, public y: number) {}

  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}
```

**Action** : Compiler avec `npx tsc --declaration` et montrer le fichier `.d.ts` généré.

```typescript
// dist/16-declarations/math-lib.d.ts (genere automatiquement)
export declare function add(a: number, b: number): number;
export declare function multiply(a: number, b: number): number;
export interface Point {
    x: number;
    y: number;
}
export declare class Vector {
    x: number;
    y: number;
    constructor(x: number, y: number);
    magnitude(): number;
}
```

> Le fichier `.d.ts` contient uniquement les signatures — pas d'implementation. Le mot-clé `declare` indique que l'implementation existe ailleurs (dans le `.js`). C'est ce fichier que TypeScript utilise pour la vérification de types.

### [03:30-08:00] Écrire des declarations manuelles

> Parfois, on doit écrire des declarations pour une librairie JavaScript qui n'en a pas.

**Action** : Créer un fichier `src/16-declarations/legacy-lib.js`.

```javascript
// src/16-declarations/legacy-lib.js
// Librairie JavaScript sans types

function formatCurrency(amount, currency) {
  return `${amount.toFixed(2)} ${currency}`;
}

function parseDate(str) {
  return new Date(str);
}

const VERSION = "1.0.0";

module.exports = { formatCurrency, parseDate, VERSION };
```

**Action** : Créer le fichier de declaration `src/16-declarations/legacy-lib.d.ts`.

```typescript
// src/16-declarations/legacy-lib.d.ts

declare module "./legacy-lib.js" {
  export function formatCurrency(amount: number, currency: string): string;
  export function parseDate(str: string): Date;
  export const VERSION: string;
}
```

**Action** : Utiliser la librairie dans un fichier TypeScript.

```typescript
// src/16-declarations/use-legacy.ts
import { formatCurrency, parseDate, VERSION } from "./legacy-lib.js";

console.log(formatCurrency(42.5, "EUR"));  // "42.50 EUR"
console.log(parseDate("2026-01-15"));       // Date
console.log(VERSION);                        // "1.0.0"

// Autocompletion et verification de types fonctionnent !
// formatCurrency("oops", 42); // Erreur de type
```

**Action** : Montrer l'autocompletion sur `formatCurrency` et l'erreur quand on passe les mauvais types.

> Écrire des fichiers `.d.ts` est la façon de connecter du JavaScript existant au système de types TypeScript. C'est particulierement utile pour les librairies internes legacy.

### [08:00-13:00] DefinitelyTyped et @types

> La plupart des librairies JavaScript populaires ont des types disponibles via DefinitelyTyped.

**Action** : Montrer l'installation de types pour une librairie.

```bash
# Installer une librairie JavaScript
npm install lodash

# Installer ses types
npm install -D @types/lodash
```

**Action** : Créer un fichier pour utiliser lodash avec les types.

```typescript
// src/16-declarations/use-lodash.ts
import _ from "lodash";

const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
  { name: "Charlie", age: 35 },
];

// Autocompletion et types complets !
const sorted = _.sortBy(users, "age");
// type: { name: string; age: number }[]

const grouped = _.groupBy(users, (u) => (u.age >= 30 ? "senior" : "junior"));
// type: Dictionary<{ name: string; age: number }[]>

const names = _.map(users, "name");
// type: string[]

console.log(sorted);
console.log(grouped);
console.log(names);
```

**Action** : Montrer l'autocompletion riche sur les méthodes lodash.

> Les paquets `@types/*` proviennent du depot DefinitelyTyped sur GitHub — c'est le plus grand depot de declarations de types au monde. Quand vous installez un paquet npm, verifiez s'il inclut déjà ses types (propriété `types` dans `package.json`) ou s'il faut installer `@types/nom-du-paquet`.

```bash
# Verifier si les types sont inclus
npm info express types
# Si vide, installer @types/express

npm install express
npm install -D @types/express
```

### [13:00-17:00] Module augmentation et declaration merging

> L'augmentation de module permet d'ajouter des types a des modules existants.

**Action** : Ajouter le code suivant.

```typescript
// src/16-declarations/augmentation.ts

// Augmenter un module existant
declare module "lodash" {
  // Ajouter une nouvelle fonction a lodash
  interface LoDashStatic {
    customSort<T>(arr: T[], key: keyof T): T[];
  }
}

// Augmenter les types globaux
declare global {
  interface Window {
    appVersion: string;
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
    };
  }

  // Ajouter une methode a Array
  interface Array<T> {
    customFilter(predicate: (item: T) => boolean): T[];
  }
}

// Implementation de l'augmentation
Array.prototype.customFilter = function <T>(
  this: T[],
  predicate: (item: T) => boolean
): T[] {
  return this.filter(predicate);
};

// Utilisation
const numbers = [1, 2, 3, 4, 5];
const even = numbers.customFilter((n) => n % 2 === 0);
console.log(even); // [2, 4]

// Augmenter le namespace de process (Node.js)
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      API_KEY: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

// Maintenant process.env est type !
const dbUrl: string = process.env.DATABASE_URL;
const env: "development" | "production" | "test" = process.env.NODE_ENV;
```

**Action** : Montrer l'autocompletion sur `process.env.` avec les propriétés ajoutees.

> L'augmentation de module est extremement utile. Elle permet de typer les variables d'environnement, d'etendre les librairies tierces, et d'ajouter des propriétés aux types globaux. Le `declare global` est nécessaire quand on est dans un fichier module (qui à un import/export).

### [17:00-19:30] Bonnes pratiques et récapitulatif

> Terminons avec les bonnes pratiques.

```typescript
// Bonnes pratiques pour les fichiers de declaration :
//
// 1. Structure du projet
//    src/
//      types/           — types partages
//        global.d.ts    — augmentations globales
//        env.d.ts       — types pour process.env
//      @types/          — declarations pour modules sans types
//        legacy-lib/
//          index.d.ts
//
// 2. Dans tsconfig.json :
//    "typeRoots": ["./node_modules/@types", "./src/@types"]
//    "types": ["node"]  — si on veut limiter les types auto-inclus
//
// 3. Pour publier une librairie :
//    - Generer les .d.ts avec "declaration": true
//    - Ajouter "types": "./dist/index.d.ts" dans package.json
//    - Tester avec attw (are the types wrong?)
//
// 4. Eviter :
//    - declare module "*" (wildcard) — trop permissif
//    - Des augmentations globales trop larges
//    - Des fichiers .d.ts avec du code (import/export de valeurs)
```

> En résumé : les fichiers `.d.ts` sont le pont entre JavaScript et TypeScript. `@types` couvre la majorite des librairies populaires. L'augmentation de module permet d'etendre les types existants. Et quand vous publiez une librairie, generez toujours les declarations pour vos utilisateurs TypeScript.

## Points d'attention pour l'enregistrement
- Compiler avec `--declaration` et montrer les fichiers generes cote a cote
- L'installation de `@types/lodash` doit etre en live pour montrer le processus
- L'augmentation de `process.env` est un cas d'usage très concret et motivant
- Bien distinguer `declare module` (augmentation) de `declare module` (declaration)
- Mentionner l'outil `attw` pour vérifier les types avant publication
