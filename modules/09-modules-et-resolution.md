# 09 — Modules, Namespaces & Resolution

> **Duree estimee** : 4 heures
> **Difficulte** : 2/5
> **Prérequis** : Modules 01 a 08 (types de base, fonctions, interfaces, unions, classes, generics, enums)
> **Objectifs** :
>
> - Comprendre le système de modules ECMAScript (ESM) en TypeScript
> - Maîtriser les différentes formes d'import et d'export
> - Gérer l'interoperabilite avec CommonJS (`esModuleInterop`)
> - Organiser le code avec les re-exports et les barrel files
> - Comprendre les namespaces (héritage) et pourquoi les éviter
> - Configurer la résolution de modules (`node`, `node16`, `bundler`)
> - Utiliser les alias de chemins dans `tsconfig.json`
> - Travailler avec les declarations ambiantes (`declare module`)
> - Typer les imports dynamiques et les side-effect imports
> - Decouvrir l'augmentation de modules

---

## Introduction — Pourquoi les modules deviennent vite un sujet central ?

### Le problème qu'on cherche à résoudre

Au début, un projet tient dans quelques fichiers. Puis très vite apparaissent des questions concrètes :

- où ranger les fonctions partagées ?
- comment exporter proprement une classe ou un type ?
- pourquoi tel import marche dans un projet mais casse dans un autre ?
- pourquoi Node, Vite et TypeScript ne résolvent pas toujours les fichiers de la même manière ?

Le sujet n'est pas seulement "comment écrire `import` et `export`". Le vrai sujet, c'est comment un projet se structure et comment les outils comprennent cette structure.

### La solution : comprendre a la fois la syntaxe et la résolution

Dans ce module, on va séparer deux idées qu'on mélange souvent :

- **les modules** : ce qu'un fichier expose et consomme
- **la résolution** : la manière dont TypeScript trouve réellement ce qu'on importe

Quand cette distinction devient claire, beaucoup d'erreurs d'import deviennent logiques au lieu d'être frustrantes.

### Analogie : les modules comme des briques LEGO

Imagine chaque module comme une brique LEGO avec des tenons (`exports`) et des emplacements (`imports`). Mais il ne suffit pas d'avoir les bonnes briques : il faut aussi savoir dans quelle boite les retrouver. C'est précisément le rôle de la résolution de modules.

> 💡 **Conseil de lecture** : si une option de résolution te parait abstraite, rattache-la toujours a une question concrète : "quand j'écris cet import, comment TypeScript retrouve-t-il le bon fichier ?"

---

## ESM : le système de modules ECMAScript

TypeScript utilise la syntaxe ESM (ECMAScript Modules) comme standard. C'est le système de modules officiel de JavaScript.

### Exports nommes

```typescript
// fichier: utils/math.ts

// Export de fonctions
export function additionner(a: number, b: number): number {
  return a + b;
}

export function multiplier(a: number, b: number): number {
  return a * b;
}

// Export de constantes
export const PI = 3.14159265358979;
export const E = 2.71828182845904;

// Export de types et interfaces
export interface Point2D {
  x: number;
  y: number;
}

export type Vecteur = [number, number];

// Export de classes
export class Calculatrice {
  private historique: string[] = [];

  evaluer(expression: string): number {
    // ... implementation
    const resultat = eval(expression); // Simplifie pour l'exemple
    this.historique.push(`${expression} = ${resultat}`);
    return resultat;
  }

  obtenirHistorique(): string[] {
    return [...this.historique];
  }
}
```

### Imports nommes

```typescript
// fichier: app.ts

// Import de noms specifiques
import { additionner, multiplier, PI } from "./utils/math";

console.log(additionner(2, 3));  // 5
console.log(multiplier(4, PI));  // ~12.57

// Import avec renommage (alias)
import { additionner as add, Point2D as Point } from "./utils/math";

const p: Point = { x: 10, y: 20 };
console.log(add(p.x, p.y)); // 30

// Import de tout sous un namespace
import * as MathUtils from "./utils/math";

console.log(MathUtils.PI);            // 3.14159...
console.log(MathUtils.additionner(1, 2)); // 3
const calc = new MathUtils.Calculatrice();
```

### Export par defaut

Chaque module peut avoir **un seul** export par defaut. C'est l'export "principal" du module.

```typescript
// fichier: composants/Bouton.ts

interface PropsBouton {
  texte: string;
  onClick: () => void;
  desactive?: boolean;
  variante?: "primaire" | "secondaire" | "danger";
}

// Export par defaut d'une classe
export default class Bouton {
  private props: PropsBouton;

  constructor(props: PropsBouton) {
    this.props = props;
  }

  rendu(): string {
    const { texte, desactive, variante = "primaire" } = this.props;
    const classes = `bouton bouton--${variante}${desactive ? " bouton--desactive" : ""}`;
    return `<button class="${classes}"${desactive ? " disabled" : ""}>${texte}</button>`;
  }
}

// On peut aussi avoir des exports nommes en plus du defaut
export type { PropsBouton };
```

```typescript
// fichier: app.ts

// L'import par defaut n'a pas besoin d'accolades
// et peut etre nomme comme on veut
import Bouton from "./composants/Bouton";
import type { PropsBouton } from "./composants/Bouton";

const bouton = new Bouton({
  texte: "Valider",
  onClick: () => console.log("click !"),
  variante: "primaire",
});

console.log(bouton.rendu());
```

### Export par defaut : fonctions et constantes

```typescript
// fichier: config.ts
// Export par defaut d'un objet
export default {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: false,
} as const;

// fichier: helpers/formater.ts
// Export par defaut d'une fonction
export default function formaterDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

```typescript
// fichier: app.ts
import config from "./config";
import formaterDate from "./helpers/formater";

console.log(config.apiUrl);                // "https://api.example.com"
console.log(formaterDate(new Date()));     // "samedi 8 mars 2026"
```

### Import de types uniquement (`import type`)

Depuis TypeScript 3.8, on peut importer **uniquement des types**, ce qui garantit que l'import sera complètement efface à la compilation (aucun code JavaScript généré).

```typescript
// fichier: types/modeles.ts
export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
}

export interface Article {
  id: string;
  titre: string;
  auteur: Utilisateur;
}

export type StatutArticle = "brouillon" | "publie" | "archive";
```

```typescript
// fichier: services/article.service.ts

// Import de types uniquement — efface a la compilation
import type { Article, StatutArticle, Utilisateur } from "../types/modeles";

// On peut utiliser ces types pour l'annotation,
// mais pas comme valeurs (pas de `new`, pas dans `instanceof`, etc.)
function creerArticle(titre: string, auteur: Utilisateur): Article {
  return {
    id: crypto.randomUUID(),
    titre,
    auteur,
  };
}

function filtrerParStatut(articles: Article[], statut: StatutArticle): Article[] {
  // Implementation...
  return articles;
}
```

> **Bonne pratique** : Utilisez `import type` chaque fois que vous n'importez que des types. Cela aide les bundlers (Vite, esbuild, etc.) a optimiser le code et rend l'intention explicite.

### Inline type imports (TypeScript 4.5+)

```typescript
// On peut mixer imports de valeurs et de types dans une seule ligne
import { Calculatrice, type Point2D, type Vecteur } from "./utils/math";

// `Point2D` et `Vecteur` sont des type-only imports
// `Calculatrice` est un import de valeur (la classe)
const calc = new Calculatrice();
const p: Point2D = { x: 1, y: 2 };
```

---

## Interoperabilite avec CommonJS

Beaucoup de packages npm utilisent encore le format CommonJS (`module.exports` / `require`). TypeScript offre des options pour faciliter l'interoperabilite.

### Le problème

```typescript
// Un module CommonJS typique (JavaScript)
// fichier: legacy.js
// module.exports = function greet(name) { return `Hello, ${name}`; };

// En TypeScript, sans configuration speciale :
// import greet from "./legacy"; // ERREUR : pas d'export par defaut

// Il faudrait ecrire :
// import greet = require("./legacy"); // Syntaxe CJS dans TS
// ou
// const greet = require("./legacy"); // Perd le typage
```

### La solution : `esModuleInterop`

L'option `esModuleInterop` dans `tsconfig.json` permet d'utiliser la syntaxe ESM standard même avec des modules CommonJS.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
    // ...
  }
}
```

```typescript
// Avec esModuleInterop active, on peut importer normalement :
import fs from "fs";              // Module Node.js CJS
import path from "path";          // Module Node.js CJS
import express from "express";    // Package npm CJS
import _ from "lodash";           // Package npm CJS

// Ca fonctionne comme si ces modules avaient un export par defaut
const contenu = fs.readFileSync("fichier.txt", "utf-8");
const chemin = path.join(__dirname, "data");
```

### `allowSyntheticDefaultImports`

Cette option permet la syntaxe `import X from "module"` même quand le module n'a pas d'export par defaut. Elle ne modifie pas le code généré (contrairement a `esModuleInterop` qui ajoute un helper).

```typescript
// Avec allowSyntheticDefaultImports :
import React from "react"; // OK meme si React n'a pas de default export strict

// Equivalent a :
import * as React from "react";
```

---

## Re-exports

Les re-exports permettent de re-exporter des éléments d'un module a travers un autre module. C'est essentiel pour organiser les APIs publiques.

### Syntaxes de re-export

```typescript
// fichier: models/utilisateur.ts
export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
}
export function creerUtilisateur(nom: string, email: string): Utilisateur {
  return { id: crypto.randomUUID(), nom, email };
}

// fichier: models/article.ts
export interface Article {
  id: string;
  titre: string;
  contenu: string;
}
export function creerArticle(titre: string, contenu: string): Article {
  return { id: crypto.randomUUID(), titre, contenu };
}

// fichier: models/commentaire.ts
export interface Commentaire {
  id: string;
  texte: string;
  auteurId: string;
}
```

```typescript
// fichier: models/index.ts — re-exports

// Re-exporter tout d'un module
export * from "./utilisateur";
export * from "./article";
export * from "./commentaire";

// Re-exporter avec renommage
export { creerUtilisateur as creerUser } from "./utilisateur";

// Re-exporter un export par defaut comme export nomme
// export { default as Bouton } from "../composants/Bouton";

// Re-exporter uniquement les types
export type { Utilisateur } from "./utilisateur";
```

```typescript
// fichier: app.ts — import depuis le barrel file

// Un seul import au lieu de trois
import {
  Utilisateur,
  Article,
  Commentaire,
  creerUtilisateur,
  creerArticle,
} from "./models";
// Equivalent a importer depuis ./models/index.ts

const user = creerUtilisateur("Alice", "alice@mail.com");
const article = creerArticle("Mon article", "Contenu...");
```

---

## Barrel files (`index.ts`)

Un **barrel file** est un fichier `index.ts` qui re-exporte les éléments de tout un dossier. C'est un pattern d'organisation très courant.

### Structure d'un projet avec barrels

```
src/
  components/
    Button.ts
    Input.ts
    Modal.ts
    index.ts          <-- barrel
  services/
    auth.service.ts
    api.service.ts
    index.ts          <-- barrel
  models/
    user.model.ts
    post.model.ts
    index.ts          <-- barrel
  utils/
    format.ts
    validate.ts
    index.ts          <-- barrel
  index.ts            <-- barrel principal
```

### Exemple complet

```typescript
// fichier: services/auth.service.ts
export class ServiceAuthentification {
  private token: string | null = null;

  async connecter(email: string, motDePasse: string): Promise<boolean> {
    // ... logique de connexion
    this.token = "token_fictif";
    return true;
  }

  deconnecter(): void {
    this.token = null;
  }

  estConnecte(): boolean {
    return this.token !== null;
  }

  obtenirToken(): string | null {
    return this.token;
  }
}

export type InfosConnexion = {
  email: string;
  motDePasse: string;
};
```

```typescript
// fichier: services/api.service.ts
export class ServiceAPI {
  constructor(
    private baseUrl: string,
    private token?: string
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      h["Authorization"] = `Bearer ${this.token}`;
    }
    return h;
  }

  async get<T>(chemin: string): Promise<T> {
    const reponse = await fetch(`${this.baseUrl}${chemin}`, {
      headers: this.headers(),
    });
    return reponse.json();
  }

  async post<T>(chemin: string, donnees: unknown): Promise<T> {
    const reponse = await fetch(`${this.baseUrl}${chemin}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(donnees),
    });
    return reponse.json();
  }
}

export type OptionsAPI = {
  baseUrl: string;
  timeout?: number;
};
```

```typescript
// fichier: services/index.ts — barrel file
export { ServiceAuthentification } from "./auth.service";
export type { InfosConnexion } from "./auth.service";

export { ServiceAPI } from "./api.service";
export type { OptionsAPI } from "./api.service";
```

```typescript
// fichier: app.ts — import propre depuis le barrel
import {
  ServiceAuthentification,
  ServiceAPI,
  type InfosConnexion,
  type OptionsAPI,
} from "./services";

const auth = new ServiceAuthentification();
const api = new ServiceAPI("https://api.example.com");
```

### Avantages et inconvenients des barrel files

| Avantages                                   | Inconvenients                                  |
|---------------------------------------------|------------------------------------------------|
| Imports plus propres et plus courts          | Peut causer des imports circulaires             |
| API publique claire du dossier              | Peut empecher le tree-shaking                   |
| Facilite le refactoring interne             | Augmente le temps de compilation                |
| Cache la structure interne du dossier       | Un module modifie = tout le barrel recharge     |

> **Recommandation** : Utilisez les barrel files avec moderation. Ils sont excellents pour les bibliotheques et les dossiers avec une API publique claire. Evitez-les pour les dossiers très larges ou les imports circulaires sont probables.

---

## Namespaces (héritage)

Les **namespaces** (anciennement "modules internes") sont une fonctionnalite historique de TypeScript qui date d'avant l'adoption generalisee des modules ES. Ils sont encore utilises dans certains contextes spécifiques.

### Syntaxe des namespaces

```typescript
// fichier: legacy/validation.ts

namespace Validation {
  // Exporte depuis le namespace
  export interface ResultatValidation {
    valide: boolean;
    erreurs: string[];
  }

  // Fonction exportee
  export function validerEmail(email: string): ResultatValidation {
    const erreurs: string[] = [];
    if (!email.includes("@")) {
      erreurs.push("L'email doit contenir un @");
    }
    if (email.length < 5) {
      erreurs.push("L'email est trop court");
    }
    return { valide: erreurs.length === 0, erreurs };
  }

  // Fonction privee au namespace
  function normaliser(valeur: string): string {
    return valeur.trim().toLowerCase();
  }

  export function validerNom(nom: string): ResultatValidation {
    const nomNormalise = normaliser(nom);
    const erreurs: string[] = [];
    if (nomNormalise.length < 2) {
      erreurs.push("Le nom doit faire au moins 2 caracteres");
    }
    if (!/^[a-z\s-]+$/.test(nomNormalise)) {
      erreurs.push("Le nom ne peut contenir que des lettres");
    }
    return { valide: erreurs.length === 0, erreurs };
  }
}

// Utilisation
const resultat = Validation.validerEmail("test@example.com");
console.log(resultat.valide); // true
```

### Namespaces imbriques

```typescript
namespace App {
  export namespace Models {
    export interface Utilisateur {
      id: string;
      nom: string;
    }
  }

  export namespace Services {
    export class ServiceUtilisateurs {
      private utilisateurs: Models.Utilisateur[] = [];

      ajouter(user: Models.Utilisateur): void {
        this.utilisateurs.push(user);
      }
    }
  }
}

// Acces via la chaine de namespaces
const user: App.Models.Utilisateur = { id: "1", nom: "Alice" };
const service = new App.Services.ServiceUtilisateurs();
service.ajouter(user);
```

### Pourquoi éviter les namespaces ?

| Raison                          | Explication                                              |
|---------------------------------|----------------------------------------------------------|
| Modules ES sont le standard     | L'ecosysteme JavaScript est base sur ESM                 |
| Pas de tree-shaking             | Tout le namespace est inclus même si on n'utilise qu'une partie |
| Complexite inutile              | Les modules ES font la même chose plus simplement         |
| Incompatible avec certains outils | ESBuild, Vite et autres bundlers modernes ne les supportent pas bien |

> **Recommandation** : N'utilisez **pas** les namespaces dans du code nouveau. Preferez toujours les modules ES (`import`/`export`). Les namespaces restent utiles uniquement dans les fichiers de declarations (`.d.ts`) pour les bibliotheques globales.

---

## Resolution de modules

La **résolution de modules** est le processus par lequel TypeScript déterminé quel fichier correspond à un chemin d'import. C'est un aspect crucial de la configuration.

### Les stratégies de résolution

TypeScript propose plusieurs stratégies configurables via `moduleResolution` dans `tsconfig.json`.

#### `node` (historique)

Imite la résolution de Node.js pour CommonJS :

```
import { foo } from "./bar"
→ cherche ./bar.ts, ./bar/index.ts

import { foo } from "lodash"
→ cherche node_modules/lodash/index.ts, node_modules/lodash/package.json "main"
```

#### `node16` / `nodenext`

Resolution pour Node.js avec support ESM natif. Requiert des extensions dans les imports.

```typescript
// Avec moduleResolution: "node16"

// Les imports relatifs DOIVENT avoir une extension
import { foo } from "./utils.js"; // .js meme si le fichier source est .ts

// Les imports de packages fonctionnent via le champ "exports" de package.json
import { bar } from "mon-package"; // Resolu via package.json "exports"
```

```jsonc
// package.json du module
{
  "name": "mon-package",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    }
  }
}
```

#### `bundler`

Resolution adaptee aux bundlers modernes (Vite, webpack, esbuild, Rollup). C'est souvent le **meilleur choix** pour les applications front-end.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "esnext"
    // ...
  }
}
```

```typescript
// Avec moduleResolution: "bundler"

// Pas besoin d'extension
import { foo } from "./utils"; // OK

// Supporte les champs "exports" de package.json
import { bar } from "mon-package/utils"; // OK

// Supporte les imports non-JS (geres par le bundler)
import styles from "./styles.module.css";
import logo from "./logo.png";
```

### Tableau comparatif des stratégies

| Stratégie    | Extensions requises | `exports` pkg.json | Cas d'usage                    |
|--------------|--------------------|--------------------|--------------------------------|
| `node`       | Non                | Non                | Projets anciens, CommonJS       |
| `node16`     | Oui (`.js`)        | Oui                | Node.js avec ESM natif          |
| `nodenext`   | Oui (`.js`)        | Oui                | Node.js dernière version        |
| `bundler`    | Non                | Oui                | Apps front-end, Vite, webpack   |

---

## Alias de chemins (`paths`)

Les alias de chemins permettent de remplacer les chemins relatifs longs par des chemins courts et lisibles.

### Configuration dans `tsconfig.json`

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Alias simple : @ pointe vers src/
      "@/*": ["src/*"],

      // Alias specifiques
      "@models/*": ["src/models/*"],
      "@services/*": ["src/services/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@config": ["src/config/index.ts"],

      // Alias pour les tests
      "@test/*": ["tests/*"]
    }
  }
}
```

### Avant et après les alias

```typescript
// AVANT — chemins relatifs difficiles a lire et a maintenir
import { Utilisateur } from "../../../models/utilisateur";
import { ServiceAPI } from "../../services/api.service";
import { formaterDate } from "../../../utils/format";
import config from "../../../../config";
```

```typescript
// APRES — alias propres et lisibles
import { Utilisateur } from "@models/utilisateur";
import { ServiceAPI } from "@services/api.service";
import { formaterDate } from "@utils/format";
import config from "@config";
```

### Configuration du bundler

Les alias TypeScript ne suffisent pas : il faut aussi configurer le bundler pour qu'il comprenne les alias.

```typescript
// vite.config.ts — pour Vite
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@models": path.resolve(__dirname, "src/models"),
      "@services": path.resolve(__dirname, "src/services"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
});
```

```javascript
// webpack.config.js — pour webpack
const path = require("path");

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@models": path.resolve(__dirname, "src/models"),
      "@services": path.resolve(__dirname, "src/services"),
    },
    extensions: [".ts", ".tsx", ".js"],
  },
};
```

> **Astuce** : Le package `tsconfig-paths` permet a Node.js de comprendre les alias directement en développement : `ts-node -r tsconfig-paths/register index.ts`.

---

## Declarations ambiantes (`declare module`)

Les declarations ambiantes permettent de decrire des types pour des modules qui n'ont pas de définitions TypeScript.

### Modules sans types

```typescript
// fichier: declarations.d.ts ou types/global.d.ts

// Declarer les types pour un module npm sans types
declare module "ma-bibliotheque-sans-types" {
  export function traiter(donnees: string): string;
  export function convertir(valeur: number): string;

  export interface Options {
    format: "json" | "xml";
    verbose: boolean;
  }

  export default class Client {
    constructor(options: Options);
    envoyer(message: string): Promise<void>;
    recevoir(): Promise<string>;
  }
}

// Utilisation
import Client, { traiter, Options } from "ma-bibliotheque-sans-types";

const options: Options = { format: "json", verbose: true };
const client = new Client(options);
```

### Modules génériques (wildcard)

```typescript
// fichier: declarations.d.ts

// Declarer que tous les fichiers .css sont des modules avec un export par defaut
declare module "*.css" {
  const contenu: Record<string, string>;
  export default contenu;
}

// Fichiers CSS modules
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Fichiers d'images
declare module "*.png" {
  const chemin: string;
  export default chemin;
}

declare module "*.jpg" {
  const chemin: string;
  export default chemin;
}

declare module "*.svg" {
  const contenu: string;
  export default contenu;
}

// Fichiers JSON (si resolveJsonModule n'est pas active)
declare module "*.json" {
  const valeur: Record<string, unknown>;
  export default valeur;
}
```

```typescript
// Utilisation apres les declarations
import styles from "./composant.module.css";
import logo from "./assets/logo.png";
import icone from "./assets/check.svg";

console.log(styles.container); // la classe CSS
console.log(logo);             // le chemin vers l'image
```

### Declarations pour les variables globales

```typescript
// fichier: global.d.ts

// Variable globale injectee par le serveur
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __IS_PRODUCTION__: boolean;

// Etendre l'objet Window
declare global {
  interface Window {
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
      identify(userId: string): void;
    };
    __INITIAL_STATE__: Record<string, unknown>;
  }
}

// Le `export {}` est necessaire pour que le fichier soit traite comme un module
export {};
```

```typescript
// Utilisation
console.log(`Version: ${__APP_VERSION__}`);
window.analytics.track("page_view", { page: "/accueil" });
```

---

## Side-effect imports

Certains modules sont importes uniquement pour leurs **effets de bord** (side effects) : ils n'exportent rien mais executent du code lors de l'import.

```typescript
// Import pour effet de bord uniquement
// Le module s'execute mais on n'importe aucune valeur
import "./polyfills";           // Charge des polyfills
import "reflect-metadata";     // Configure le systeme de reflexion
import "./styles/global.css";  // Charge des styles globaux (via bundler)
import "./config/init";        // Execute du code d'initialisation
```

```typescript
// fichier: config/init.ts — un module a effet de bord

// Ce code s'execute des l'import
console.log("Initialisation de l'application...");

// Configurer la gestion des erreurs globales
window.addEventListener("unhandledrejection", (event) => {
  console.error("Promesse rejetee non geree :", event.reason);
});

// Configurer le fuseau horaire
Intl.DateTimeFormat().resolvedOptions().timeZone;

// Aucun export — c'est un module a effet de bord
```

### `sideEffects` dans `package.json`

Pour aider les bundlers avec le tree-shaking, le champ `sideEffects` dans `package.json` indique quels fichiers ont des effets de bord.

```jsonc
// package.json
{
  "name": "mon-package",
  "sideEffects": [
    "*.css",
    "./src/polyfills.ts",
    "./src/config/init.ts"
  ]
  // Ou "sideEffects": false si aucun fichier n'a d'effet de bord
}
```

---

## Import dynamique (`import()`)

L'import dynamique permet de charger des modules **à la demandé**, au runtime. TypeScript type correctement le résultat.

### Syntaxe de base

```typescript
// Import dynamique — retourne une Promise
async function chargerModule() {
  // Le type est infere automatiquement depuis le module
  const mathUtils = await import("./utils/math");

  console.log(mathUtils.additionner(1, 2)); // 3
  console.log(mathUtils.PI);                // 3.14159...
}

// Avec destructuring
async function chargerEtUtiliser() {
  const { additionner, multiplier, PI } = await import("./utils/math");

  console.log(additionner(PI, 1)); // ~4.14
}
```

### Chargement conditionnel

```typescript
// Charger un module selon la plateforme
async function obtenirStockage() {
  if (typeof window !== "undefined") {
    // Environnement navigateur
    const { StockageLocal } = await import("./stockage/navigateur");
    return new StockageLocal();
  } else {
    // Environnement Node.js
    const { StockageFichier } = await import("./stockage/node");
    return new StockageFichier("./data");
  }
}

// Chargement paresseux (lazy loading) de fonctionnalites lourdes
async function genererRapportPDF() {
  // Le module PDF est charge uniquement quand on en a besoin
  const { creerPDF, ajouterTableau, sauvegarder } = await import("./rapport/pdf-generator");

  const pdf = creerPDF("Rapport mensuel");
  ajouterTableau(pdf, donnees);
  await sauvegarder(pdf, "rapport.pdf");
}
```

### Typer un import dynamique

```typescript
// On peut utiliser `typeof import(...)` pour obtenir le type d'un module
type ModuleMath = typeof import("./utils/math");

// Utile pour typer des parametres
function traiterAvecModule(mod: ModuleMath): number {
  return mod.additionner(mod.PI, mod.E);
}

// Pattern : factory avec import dynamique
type ChargeurModule<T> = () => Promise<{ default: T }>;

async function charger<T>(chargeur: ChargeurModule<T>): Promise<T> {
  const module = await chargeur();
  return module.default;
}
```

---

## Augmentation de modules

L'**augmentation de modules** permet d'ajouter des types à un module existant sans le modifier. C'est utile pour les plugins, les extensions et les patches de type.

### Augmenter un module externe

```typescript
// fichier: augmentations/express.d.ts

// Augmenter le module Express pour ajouter des proprietes a Request
import "express"; // Important : cet import rend le fichier un module

declare module "express" {
  interface Request {
    // Ajouter une propriete `utilisateur` a toutes les requetes
    utilisateur?: {
      id: string;
      nom: string;
      roles: string[];
    };
    // Ajouter un identifiant de requete
    idRequete: string;
  }
}
```

```typescript
// fichier: middleware/auth.ts
import { Request, Response, NextFunction } from "express";

// Maintenant `req.utilisateur` est reconnu par TypeScript
function middlewareAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization;

  if (token) {
    // Verifier le token et definir l'utilisateur
    req.utilisateur = {
      id: "user_123",
      nom: "Alice",
      roles: ["admin"],
    };
  }

  next();
}

function routeProtegee(req: Request, res: Response): void {
  // TypeScript connait `req.utilisateur` grace a l'augmentation
  if (req.utilisateur) {
    res.json({ message: `Bonjour ${req.utilisateur.nom}` });
  } else {
    res.status(401).json({ erreur: "Non authentifie" });
  }
}
```

### Augmenter un module local

```typescript
// fichier: types/augmentations.ts

// Augmenter une classe existante dans votre projet
import { ServiceAPI } from "@services/api.service";

declare module "@services/api.service" {
  interface ServiceAPI {
    // Ajouter des methodes
    put<T>(chemin: string, donnees: unknown): Promise<T>;
    delete(chemin: string): Promise<void>;
    patch<T>(chemin: string, donnees: Partial<unknown>): Promise<T>;
  }
}
```

### Augmenter les types globaux

```typescript
// fichier: augmentations/array.d.ts

// Ajouter des methodes a Array<T>
declare global {
  interface Array<T> {
    dernierElement(): T | undefined;
    estVide(): boolean;
    grouper<K extends string>(fn: (element: T) => K): Record<K, T[]>;
  }
}

export {};
```

```typescript
// fichier: polyfills/array.ts
// Implementation des methodes ajoutees

Array.prototype.dernierElement = function <T>(this: T[]): T | undefined {
  return this[this.length - 1];
};

Array.prototype.estVide = function <T>(this: T[]): boolean {
  return this.length === 0;
};

Array.prototype.grouper = function <T, K extends string>(
  this: T[],
  fn: (element: T) => K
): Record<K, T[]> {
  return this.reduce((acc, element) => {
    const cle = fn(element);
    if (!acc[cle]) acc[cle] = [];
    acc[cle].push(element);
    return acc;
  }, {} as Record<K, T[]>);
};
```

```typescript
// fichier: app.ts
import "./polyfills/array"; // Charge les implementations

const nombres = [1, 2, 3, 4, 5];
console.log(nombres.dernierElement()); // 5
console.log([].estVide());             // true

const utilisateurs = [
  { nom: "Alice", ville: "Paris" },
  { nom: "Bob", ville: "Lyon" },
  { nom: "Charlie", ville: "Paris" },
];

const parVille = utilisateurs.grouper((u) => u.ville);
console.log(parVille);
// { Paris: [{Alice...}, {Charlie...}], Lyon: [{Bob...}] }
```

---

## Pratique

### Exercice 1 : Créer un barrel file pour une application

Organisez le code suivant en modules avec un barrel file propre.

<details>
<summary>Solution</summary>

```typescript
// fichier: src/models/user.model.ts
export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
}

export type UserRole = "admin" | "editeur" | "lecteur";

export function creerUser(nom: string, email: string, role: UserRole = "lecteur"): User {
  return { id: crypto.randomUUID(), nom, email, role };
}

// fichier: src/models/post.model.ts
export interface Post {
  id: string;
  titre: string;
  contenu: string;
  auteurId: string;
  dateCreation: Date;
  statut: PostStatut;
}

export type PostStatut = "brouillon" | "publie" | "archive";

export function creerPost(titre: string, contenu: string, auteurId: string): Post {
  return {
    id: crypto.randomUUID(),
    titre,
    contenu,
    auteurId,
    dateCreation: new Date(),
    statut: "brouillon",
  };
}

// fichier: src/models/index.ts — BARREL FILE
export { type User, type UserRole, creerUser } from "./user.model";
export { type Post, type PostStatut, creerPost } from "./post.model";

// fichier: src/services/user.service.ts
import type { User, UserRole } from "../models";
import { creerUser } from "../models";

export class UserService {
  private utilisateurs: User[] = [];

  ajouter(nom: string, email: string, role?: UserRole): User {
    const user = creerUser(nom, email, role);
    this.utilisateurs.push(user);
    return user;
  }

  trouver(id: string): User | undefined {
    return this.utilisateurs.find((u) => u.id === id);
  }

  lister(): User[] {
    return [...this.utilisateurs];
  }
}

// fichier: src/services/post.service.ts
import type { Post } from "../models";
import { creerPost } from "../models";

export class PostService {
  private posts: Post[] = [];

  publier(titre: string, contenu: string, auteurId: string): Post {
    const post = creerPost(titre, contenu, auteurId);
    post.statut = "publie";
    this.posts.push(post);
    return post;
  }

  listerPublies(): Post[] {
    return this.posts.filter((p) => p.statut === "publie");
  }
}

// fichier: src/services/index.ts — BARREL FILE
export { UserService } from "./user.service";
export { PostService } from "./post.service";

// fichier: src/index.ts — BARREL PRINCIPAL
export * from "./models";
export * from "./services";
```

</details>

### Exercice 2 : Configuration de résolution de modules

Ecrivez un fichier `tsconfig.json` complet pour un projet Vite avec React, incluant les alias de chemins.

<details>
<summary>Solution</summary>

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // Cible et module
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // JSX pour React
    "jsx": "react-jsx",

    // Strictness
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    // Modules
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,

    // Alias de chemins
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@models/*": ["src/models/*"],
      "@utils/*": ["src/utils/*"],
      "@assets/*": ["src/assets/*"],
      "@styles/*": ["src/styles/*"],
      "@config": ["src/config/index.ts"]
    },

    // Sortie
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // Autres
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "types/**/*.d.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

```typescript
// vite.config.ts correspondant
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@services": path.resolve(__dirname, "src/services"),
      "@models": path.resolve(__dirname, "src/models"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@config": path.resolve(__dirname, "src/config"),
    },
  },
});
```

</details>

### Exercice 3 : Declarations ambiantes pour un SDK externe

Ecrivez des declarations de types pour un SDK de paiement fictif qui n'a pas de types TypeScript.

<details>
<summary>Solution</summary>

```typescript
// fichier: types/payment-sdk.d.ts

declare module "payment-sdk" {
  // Types de base
  export type Devise = "EUR" | "USD" | "GBP" | "CHF";
  export type StatutPaiement = "en_attente" | "accepte" | "refuse" | "rembourse";

  // Interfaces
  export interface Montant {
    valeur: number;
    devise: Devise;
  }

  export interface CarteBancaire {
    numero: string;
    expiration: string; // "MM/YY"
    cvv: string;
    titulaire: string;
  }

  export interface Paiement {
    id: string;
    montant: Montant;
    statut: StatutPaiement;
    dateCreation: string; // ISO 8601
    description?: string;
    metadata?: Record<string, string>;
  }

  export interface OptionsCreationPaiement {
    montant: Montant;
    carte: CarteBancaire;
    description?: string;
    metadata?: Record<string, string>;
    capture?: boolean; // true par defaut
  }

  export interface OptionsRemboursement {
    paiementId: string;
    montant?: Montant; // Si absent, remboursement total
    raison?: string;
  }

  export interface ResultatPaiement {
    succes: boolean;
    paiement: Paiement;
    erreur?: {
      code: string;
      message: string;
    };
  }

  // Configuration
  export interface ConfigSDK {
    cleApi: string;
    cleSecrete: string;
    environnement: "sandbox" | "production";
    timeout?: number;
    journalisation?: boolean;
  }

  // Evenements
  export type EvenementPaiement =
    | { type: "paiement.cree"; paiement: Paiement }
    | { type: "paiement.accepte"; paiement: Paiement }
    | { type: "paiement.refuse"; paiement: Paiement; raison: string }
    | { type: "paiement.rembourse"; paiement: Paiement };

  // Classe principale
  export default class PaymentClient {
    constructor(config: ConfigSDK);

    // Methodes de paiement
    creerPaiement(options: OptionsCreationPaiement): Promise<ResultatPaiement>;
    obtenirPaiement(id: string): Promise<Paiement>;
    listerPaiements(filtres?: { statut?: StatutPaiement; limite?: number }): Promise<Paiement[]>;
    rembourser(options: OptionsRemboursement): Promise<ResultatPaiement>;

    // Webhooks
    surEvenement(callback: (evenement: EvenementPaiement) => void): void;
    verifierSignature(payload: string, signature: string): boolean;

    // Gestion
    fermer(): Promise<void>;
  }
}
```

```typescript
// fichier: services/paiement.service.ts — utilisation
import PaymentClient, {
  type ConfigSDK,
  type OptionsCreationPaiement,
  type Paiement,
  type StatutPaiement,
} from "payment-sdk";

const config: ConfigSDK = {
  cleApi: process.env.PAYMENT_API_KEY!,
  cleSecrete: process.env.PAYMENT_SECRET_KEY!,
  environnement: "sandbox",
  journalisation: true,
};

const client = new PaymentClient(config);

// Toutes les methodes sont correctement typees
async function effectuerPaiement(): Promise<Paiement> {
  const resultat = await client.creerPaiement({
    montant: { valeur: 29.99, devise: "EUR" },
    carte: {
      numero: "4242424242424242",
      expiration: "12/25",
      cvv: "123",
      titulaire: "Alice Dupont",
    },
    description: "Abonnement mensuel",
  });

  if (!resultat.succes) {
    throw new Error(`Paiement echoue : ${resultat.erreur?.message}`);
  }

  return resultat.paiement;
}
```

</details>

### Exercice 4 : Augmentation de module pour un plugin

Creez une augmentation de module pour ajouter une fonctionnalite de cache à un service API existant.

<details>
<summary>Solution</summary>

```typescript
// fichier: services/api.service.ts (module existant)
export class ServiceAPI {
  constructor(private baseUrl: string) {}

  async get<T>(chemin: string): Promise<T> {
    const reponse = await fetch(`${this.baseUrl}${chemin}`);
    return reponse.json();
  }

  async post<T>(chemin: string, donnees: unknown): Promise<T> {
    const reponse = await fetch(`${this.baseUrl}${chemin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });
    return reponse.json();
  }
}

// fichier: augmentations/api-cache.d.ts
import { ServiceAPI } from "../services/api.service";

declare module "../services/api.service" {
  interface ServiceAPI {
    // Nouvelles methodes de cache
    getAvecCache<T>(chemin: string, dureeVieMs?: number): Promise<T>;
    invaliderCache(chemin?: string): void;
    tailleCache(): number;
  }

  // Nouvelle interface pour les options de cache
  interface OptionsCacheAPI {
    dureeVieParDefaut: number;
    tailleMax: number;
    strategie: "lru" | "fifo";
  }
}

// fichier: plugins/api-cache.ts — implementation
import { ServiceAPI } from "../services/api.service";

interface EntreeCache {
  donnees: unknown;
  expiration: number;
}

const caches = new WeakMap<ServiceAPI, Map<string, EntreeCache>>();

function obtenirCache(api: ServiceAPI): Map<string, EntreeCache> {
  if (!caches.has(api)) {
    caches.set(api, new Map());
  }
  return caches.get(api)!;
}

// Ajouter les methodes au prototype
ServiceAPI.prototype.getAvecCache = async function <T>(
  this: ServiceAPI,
  chemin: string,
  dureeVieMs: number = 60000
): Promise<T> {
  const cache = obtenirCache(this);
  const entree = cache.get(chemin);

  if (entree && Date.now() < entree.expiration) {
    console.log(`[Cache] Hit pour ${chemin}`);
    return entree.donnees as T;
  }

  console.log(`[Cache] Miss pour ${chemin}`);
  const donnees = await this.get<T>(chemin);
  cache.set(chemin, { donnees, expiration: Date.now() + dureeVieMs });
  return donnees;
};

ServiceAPI.prototype.invaliderCache = function (
  this: ServiceAPI,
  chemin?: string
): void {
  const cache = obtenirCache(this);
  if (chemin) {
    cache.delete(chemin);
  } else {
    cache.clear();
  }
};

ServiceAPI.prototype.tailleCache = function (this: ServiceAPI): number {
  return obtenirCache(this).size;
};

// fichier: app.ts — utilisation
import { ServiceAPI } from "./services/api.service";
import "./plugins/api-cache"; // Charge le plugin

const api = new ServiceAPI("https://api.example.com");

async function demo() {
  // Premiere requete : miss cache, appel reseau
  const data1 = await api.getAvecCache("/users");

  // Deuxieme requete : hit cache, pas d'appel reseau
  const data2 = await api.getAvecCache("/users");

  console.log(`Taille du cache : ${api.tailleCache()}`);

  // Invalider le cache
  api.invaliderCache("/users");
}
```

</details>

---

## Récapitulatif

| Concept                     | Description                                                        |
|-----------------------------|--------------------------------------------------------------------|
| `export` / `import`         | Syntaxe ESM standard pour partager du code entre fichiers          |
| `export default`            | Export principal unique d'un module                                 |
| `import type`               | Import de types uniquement, efface à la compilation                |
| `esModuleInterop`           | Permet d'importer des modules CJS avec la syntaxe ESM             |
| Re-exports                  | Re-exporter des éléments d'un module via un autre                  |
| Barrel files                | Fichiers `index.ts` qui centralisent les exports d'un dossier     |
| Namespaces                  | Héritage — éviter dans le code nouveau                             |
| Resolution `bundler`        | Stratégie recommandee pour les apps front-end                      |
| Resolution `node16`         | Stratégie pour Node.js avec ESM natif                              |
| `paths`                     | Alias de chemins dans `tsconfig.json`                              |
| `declare module`            | Declarations de types pour des modules sans types                  |
| Side-effect imports         | `import "./module"` — exécuté le module sans importer de valeurs  |
| `import()`                  | Import dynamique — charge un module à la demandé                   |
| Augmentation de modules     | Ajouter des types à un module existant                             |

---

## Pour aller plus loin

Les modules que nous avons vus dans ce Module 09 forment les fondations de l'organisation du code TypeScript. Dans les modules suivants, nous aborderons les **types utilitaires avances** (`Partial`, `Required`, `Pick`, `Omit`, `Record`, etc.), les **types conditionnels** et les **template literal types** qui enrichissent encore la puissance du système de types.

[Continuer vers le Module 10 : Types utilitaires & Mapped Types →](./10-types-utilitaires-mapped.md)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 09 modules](../screencasts/screencast-09-modules.md)
2. **Lab** : [lab-09-modules](../labs/lab-09-modules/README)
3. **Visualisation** : [Module Resolution](../visualizations/module-resolution.html)
4. **Quiz** : [quiz 09 modules](../quizzes/quiz-09-modules.html)
:::
