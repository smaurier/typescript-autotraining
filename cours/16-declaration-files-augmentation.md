# 16 — Declaration Files (.d.ts) & Module Augmentation

> **Duree estimee** : 3h30
> **Difficulte** : 4/5
> **Prérequis** : Modules 1 a 15, système de modules, generics, variance
> **Objectifs** :
>
> - Comprendre le rôle réel des fichiers `.d.ts`
> - Savoir typer une bibliothèque JavaScript existante
> - Maîtriser les déclarations ambiantes et l'augmentation de modules
> - Comprendre le declaration merging et ses cas d'usage

---

## Introduction — Pourquoi les `.d.ts` sont partout sans qu'on les voie ?

### Le problème qu'on cherche à résoudre

Dans beaucoup de projets, tu consommes du JavaScript déjà existant : bibliothèques npm, globals du navigateur, modules spéciaux, plugins, fichiers CSS typés, etc.

Le problème est simple : si TypeScript ne connaît pas leur forme, il ne peut ni t'aider, ni vérifier quoi que ce soit.

### La solution : décrire le code sans l'implémenter

Un fichier `.d.ts` sert précisément a ça : décrire des types sans écrire la logique runtime.

### Analogie du dictionnaire

Le JavaScript est la langue parlée. Le `.d.ts` est le dictionnaire qui permet au compilateur de comprendre ce qui existe, ce que ça expose, et comment l'utiliser.

> 🎯 **Ce qu'il faut retenir** : un `.d.ts` n'ajoute pas du comportement. Il ajoute de la compréhension côté compilateur.

---

## Les fichiers .d.ts : fondamentaux

### Qu'est-ce qu'un fichier .d.ts ?

Un fichier `.d.ts` (declaration file) contient uniquement des **declarations de type**.
Il ne produit aucun code JavaScript à la compilation — c'est une description pure
des types.

```typescript
// mon-module.d.ts — Exemple basique
// Pas d'implementation, uniquement des types !

export declare function additionner(a: number, b: number): number;
export declare function multiplier(a: number, b: number): number;

export declare const PI: number;

export declare interface Point {
  x: number;
  y: number;
}

export declare class Vecteur {
  x: number;
  y: number;
  constructor(x: number, y: number);
  norme(): number;
  ajouter(autre: Vecteur): Vecteur;
}

export declare type Couleur = "rouge" | "vert" | "bleu";
```

### Pourquoi les fichiers .d.ts existent-ils ?

```typescript
// Trois raisons principales :

// 1. TYPER DES BIBLIOTHEQUES JS EXISTANTES
//    lodash, express, react... sont ecrits en JS
//    Les fichiers .d.ts leur donnent des types

// 2. DISTRIBUER DES TYPES SANS LE CODE SOURCE
//    Quand on publie un package npm compile en JS,
//    on inclut les .d.ts pour que les utilisateurs TS
//    aient l'autocompletion et la verification de type

// 3. DECLARATIONS AMBIANTES
//    Declarer des variables globales, des modules speciaux
//    (CSS modules, images, etc.)
```

### Anatomie d'un fichier .d.ts

```typescript
// types/utilitaires.d.ts

// Le mot-cle 'declare' indique a TypeScript que l'implementation
// existe AILLEURS (dans un fichier .js, dans l'environnement, etc.)

// Declaration de fonction
declare function formater(date: Date, format: string): string;

// Declaration de variable
declare const VERSION: string;

// Declaration d'interface (pas besoin de 'declare' pour les interfaces)
interface Configuration {
  langue: string;
  theme: "clair" | "sombre";
  debug: boolean;
}

// Declaration de classe
declare class Logger {
  niveau: "debug" | "info" | "warn" | "error";
  constructor(niveau?: string);
  log(message: string): void;
  error(message: string, erreur?: Error): void;
}

// Declaration d'enum
declare enum Direction {
  Nord = "NORD",
  Sud = "SUD",
  Est = "EST",
  Ouest = "OUEST",
}

// Declaration de namespace
declare namespace MathUtils {
  function arrondir(valeur: number, decimales: number): number;
  function aleatoire(min: number, max: number): number;
  const E: number;
}
```

---

## Génération automatique de declarations

### tsc --declaration

TypeScript peut générer automatiquement les fichiers `.d.ts` à partir de votre code :

```json
// tsconfig.json
{
  "compilerOptions": {
    "declaration": true,         // Genere les .d.ts
    "declarationDir": "./types", // Dossier de sortie des .d.ts
    "declarationMap": true,      // Genere des source maps pour .d.ts
    "emitDeclarationOnly": true, // Ne genere QUE les .d.ts (pas le JS)
    "outDir": "./dist"
  }
}
```

```typescript
// src/calculatrice.ts — Code source
export class Calculatrice {
  private historique: string[] = [];

  additionner(a: number, b: number): number {
    const resultat = a + b;
    this.historique.push(`${a} + ${b} = ${resultat}`);
    return resultat;
  }

  soustraire(a: number, b: number): number {
    const resultat = a - b;
    this.historique.push(`${a} - ${b} = ${resultat}`);
    return resultat;
  }

  obtenirHistorique(): readonly string[] {
    return this.historique;
  }
}

export function creerCalculatrice(): Calculatrice {
  return new Calculatrice();
}

export type Operation = "addition" | "soustraction" | "multiplication" | "division";
```

```typescript
// types/calculatrice.d.ts — Genere automatiquement par tsc
export declare class Calculatrice {
  private historique;
  additionner(a: number, b: number): number;
  soustraire(a: number, b: number): number;
  obtenirHistorique(): readonly string[];
}

export declare function creerCalculatrice(): Calculatrice;
export type Operation = "addition" | "soustraction" | "multiplication" | "division";

// Remarquez :
// - Les implementations sont supprimees
// - Les membres 'private' sont mentionnes mais sans type detail
// - Les types sont preserves
```

### declarationMap

```typescript
// Avec declarationMap: true, TypeScript genere aussi des fichiers .d.ts.map
// Cela permet a l'IDE de naviguer vers le CODE SOURCE original
// quand on fait Ctrl+Click sur un type importe

// Structure de sortie :
// dist/
//   calculatrice.js        <- Code compile
//   calculatrice.d.ts      <- Types
//   calculatrice.d.ts.map  <- Lien vers src/calculatrice.ts
```

---

## Triple-slash références

### Syntaxe et usage

Les directives triple-slash sont des commentaires speciaux qui indiquent des
dépendances entre fichiers de declaration :

```typescript
// types/global.d.ts

/// <reference types="node" />
// Inclut les types de @types/node

/// <reference path="./utilitaires.d.ts" />
// Inclut un fichier de declaration local

/// <reference lib="dom" />
// Inclut une bibliotheque standard (lib.dom.d.ts)
```

### Quand utiliser les triple-slash références

```typescript
// CAS 1 : Fichiers .d.ts qui dependent d'autres declarations
// types/mon-plugin.d.ts
/// <reference types="express" />

declare module "express-serve-static-core" {
  interface Request {
    utilisateur?: { id: string; nom: string };
  }
}

// CAS 2 : Inclure des types globaux dans un projet
// src/main.ts
/// <reference path="../types/env.d.ts" />

// CAS 3 : Scripts isoles (pas dans un module)
/// <reference types="vite/client" />

// ATTENTION : dans les modules (fichiers avec import/export),
// preferez les imports normaux aux triple-slash references
// Les triple-slash sont principalement pour les fichiers ambiants
```

---

## Declarations ambiantes (declare)

### declare module

```typescript
// Declarer les types d'un module qui n'en a pas

// CAS 1 : Module npm sans types
// types/vieille-lib.d.ts
declare module "vieille-lib" {
  export function faireTruc(options: {
    entree: string;
    sortie: string;
    verbose?: boolean;
  }): Promise<void>;

  export interface Resultat {
    succes: boolean;
    donnees: unknown;
  }

  export default function init(config: Record<string, unknown>): void;
}

// Utilisation :
// import init, { faireTruc, Resultat } from "vieille-lib";
```

```typescript
// CAS 2 : Modules avec wildcards (pour les imports non-JS)
// types/assets.d.ts

// Fichiers CSS
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

// Fichiers CSS Modules
declare module "*.module.css" {
  const classes: { readonly [cle: string]: string };
  export default classes;
}

// Fichiers images
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const composant: FC<SVGProps<SVGSVGElement>>;
  export default composant;
}

// Fichiers JSON (si resolveJsonModule n'est pas actif)
declare module "*.json" {
  const valeur: unknown;
  export default valeur;
}
```

### declare global

```typescript
// Ajouter des types a l'espace global

// types/global.d.ts
declare global {
  // Ajouter une propriete a window
  interface Window {
    __CONFIG__: {
      apiUrl: string;
      version: string;
      debug: boolean;
    };
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
      identify(userId: string): void;
    };
  }

  // Ajouter une variable globale
  var __DEV__: boolean;
  var __PROD__: boolean;

  // Ajouter une fonction globale
  function structuredClone<T>(value: T): T;

  // Etendre un type global existant
  interface Array<T> {
    /**
     * Verifie si le tableau contient au moins un element.
     * Sert de type guard pour le narrowing vers un tuple non-vide.
     */
    estNonVide(): this is [T, ...T[]];
  }
}

// IMPORTANT : ce fichier doit etre un module pour que 'declare global' fonctionne
// On ajoute un export vide pour en faire un module
export {};
```

```typescript
// Implementation du prototype Array (dans un fichier .ts)
// src/extensions.ts

// L'augmentation de Array dans global.d.ts declare le type
// Ici on fournit l'implementation

if (!Array.prototype.estNonVide) {
  Array.prototype.estNonVide = function <T>(this: T[]): this is [T, ...T[]] {
    return this.length > 0;
  };
}

// Utilisation avec narrowing
const nombres: number[] = [1, 2, 3];

if (nombres.estNonVide()) {
  // TypeScript sait que nombres est [number, ...number[]]
  const premier: number = nombres[0]; // Garanti non-undefined
  console.log(premier);
}
```

---

## Module Augmentation (Augmentation de modules)

### Etendre les interfaces d'un module tiers

```typescript
// L'augmentation de module permet d'AJOUTER des types a un module existant
// sans modifier son code source

// Exemple : ajouter un champ 'utilisateur' a Express Request
// types/express.d.ts

import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    // Ajouter des proprietes a l'interface Request existante
    utilisateur?: {
      id: string;
      nom: string;
      email: string;
      roles: string[];
    };
    sessionId?: string;
    langue: string;
  }

  interface Response {
    // Ajouter des methodes a Response
    succes<T>(donnees: T): void;
    erreur(code: number, message: string): void;
  }
}
```

```typescript
// Exemple : augmenter Vue.js
// types/vue-augmentation.d.ts

import "vue";

declare module "vue" {
  interface ComponentCustomProperties {
    // Proprietes disponibles dans les templates et le code
    $http: typeof import("axios").default;
    $format: {
      date(d: Date): string;
      nombre(n: number): string;
      monnaie(n: number, devise?: string): string;
    };
    $notify: (message: string, type?: "info" | "succes" | "erreur") => void;
  }
}
```

```typescript
// Exemple : augmenter les variables d'environnement
// types/env.d.ts

declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: "development" | "production" | "test";
        PORT: string;
        DATABASE_URL: string;
        JWT_SECRET: string;
        REDIS_URL?: string;
        SMTP_HOST?: string;
        SMTP_PORT?: string;
      }
    }
  }
}

// Maintenant process.env.NODE_ENV est type correctement
// et process.env.PORT existe avec le type string
```

### Augmenter une classe

```typescript
// On peut aussi augmenter un module pour ajouter des exports
// types/lodash-augmentation.d.ts

import "lodash";

declare module "lodash" {
  // Ajouter une nouvelle fonction
  interface LoDashStatic {
    /**
     * Melange aleatoirement les elements d'un tableau (type-safe)
     */
    melangerTableau<T>(tableau: T[]): T[];
  }
}

// L'implementation correspondante :
// src/lodash-extensions.ts
import _ from "lodash";

_.mixin({
  melangerTableau<T>(tableau: T[]): T[] {
    return _.shuffle(tableau);
  },
});
```

---

## Declaration Merging (Fusion de declarations)

### Interface merging

```typescript
// Les interfaces avec le meme nom FUSIONNENT automatiquement
// C'est le mecanisme fondamental de l'augmentation de module

interface Utilisateur {
  id: string;
  nom: string;
}

// Plus tard dans le meme scope (ou via augmentation) :
interface Utilisateur {
  email: string;
  age: number;
}

// Le resultat est la fusion des deux :
// interface Utilisateur {
//   id: string;
//   nom: string;
//   email: string;
//   age: number;
// }

const alice: Utilisateur = {
  id: "1",
  nom: "Alice",
  email: "alice@exemple.fr",
  age: 30,
};
```

### Namespace merging

```typescript
// Les namespaces fusionnent entre eux
namespace Validation {
  export function estEmail(valeur: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur);
  }
}

namespace Validation {
  export function estTelephone(valeur: string): boolean {
    return /^(\+33|0)[1-9]\d{8}$/.test(valeur);
  }
}

// Resultat : Validation a les deux fonctions
Validation.estEmail("test@test.fr");   // OK
Validation.estTelephone("0612345678"); // OK
```

### Namespace + Interface merging

```typescript
// On peut fusionner un namespace avec une interface
// Le namespace ajoute des proprietes statiques

interface Couleur {
  r: number;
  g: number;
  b: number;
  a?: number;
}

namespace Couleur {
  export function rouge(): Couleur {
    return { r: 255, g: 0, b: 0 };
  }

  export function vert(): Couleur {
    return { r: 0, g: 255, b: 0 };
  }

  export function bleu(): Couleur {
    return { r: 0, g: 0, b: 255 };
  }

  export function fromHex(hex: string): Couleur {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }
}

// Utilisation : Couleur est a la fois un TYPE et un NAMESPACE
const maCouleur: Couleur = Couleur.rouge();
const fromHex: Couleur = Couleur.fromHex("#FF5733");
```

### Namespace + Class merging

```typescript
// Fusionner un namespace avec une classe pour ajouter des proprietes statiques

class Animal {
  constructor(public nom: string, public type: string) {}

  description(): string {
    return `${this.nom} est un ${this.type}`;
  }
}

namespace Animal {
  // Proprietes statiques ajoutees via namespace
  export function chat(nom: string): Animal {
    return new Animal(nom, "chat");
  }

  export function chien(nom: string): Animal {
    return new Animal(nom, "chien");
  }

  export const ESPECES = ["chat", "chien", "oiseau", "poisson"] as const;
  export type Espece = (typeof ESPECES)[number];
}

// Utilisation
const minou = Animal.chat("Minou");      // Factory method via namespace
const rex = Animal.chien("Rex");
console.log(minou.description());         // Methode d'instance via class
console.log(Animal.ESPECES);              // Constante via namespace
```

### Namespace + Enum merging

```typescript
// Les namespaces peuvent etendre les enums

enum Statut {
  Actif = "ACTIF",
  Inactif = "INACTIF",
  Suspendu = "SUSPENDU",
}

namespace Statut {
  export function estActif(statut: Statut): boolean {
    return statut === Statut.Actif;
  }

  export function description(statut: Statut): string {
    const descriptions: Record<Statut, string> = {
      [Statut.Actif]: "Le compte est actif et fonctionnel",
      [Statut.Inactif]: "Le compte est desactive",
      [Statut.Suspendu]: "Le compte est temporairement suspendu",
    };
    return descriptions[statut];
  }

  export function tousLesStatuts(): Statut[] {
    return [Statut.Actif, Statut.Inactif, Statut.Suspendu];
  }
}

// Utilisation
console.log(Statut.estActif(Statut.Actif));     // true
console.log(Statut.description(Statut.Suspendu)); // "Le compte est..."
```

---

## DefinitelyTyped et @types

### Qu'est-ce que DefinitelyTyped ?

```typescript
// DefinitelyTyped est un depot GitHub communautaire qui contient
// les declarations de type pour des MILLIERS de packages npm

// Installation des types pour un package :
// npm install --save-dev @types/lodash
// npm install --save-dev @types/express
// npm install --save-dev @types/node
// npm install --save-dev @types/react

// TypeScript les trouve automatiquement dans node_modules/@types/
// Pas besoin de configuration supplementaire
```

### Comment TypeScript resout les types

```typescript
// Algorithme de resolution des types :

// 1. Le package a-t-il un champ "types" dans son package.json ?
//    { "types": "./dist/index.d.ts" }
//    -> Utilise ce fichier

// 2. Le package a-t-il un fichier index.d.ts a la racine ?
//    -> Utilise ce fichier

// 3. Existe-t-il @types/nom-du-package dans node_modules ?
//    -> Utilise les declarations de DefinitelyTyped

// 4. Aucun type trouve ?
//    -> Le module est de type 'any' (ou erreur avec noImplicitAny)
```

### Configurer les types inclus

```json
// tsconfig.json — Controle des types
{
  "compilerOptions": {
    // Par defaut, TOUS les @types/ sont inclus
    // Pour limiter, specifier explicitement :
    "types": ["node", "jest"],
    // Seuls @types/node et @types/jest seront inclus

    // Dossiers ou chercher les types
    "typeRoots": [
      "./types",           // Nos types personnalises
      "./node_modules/@types" // Types de DefinitelyTyped
    ]
  }
}
```

---

## Créer un package de types

### Structure d'un package @types

```
mon-package-types/
  index.d.ts          <- Point d'entree
  sous-module.d.ts     <- Types pour les sous-modules
  package.json
  tsconfig.json
  LICENSE
```

```json
// package.json pour un package de types
{
  "name": "@types/ma-lib",
  "version": "1.0.0",
  "description": "Declarations TypeScript pour ma-lib",
  "types": "index.d.ts",
  "files": [
    "*.d.ts",
    "package.json"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/DefinitelyTyped/DefinitelyTyped"
  },
  "dependencies": {}
}
```

```typescript
// index.d.ts — Declarations completes pour une lib imaginaire "super-fetch"

/**
 * Configuration pour les requetes HTTP
 */
export interface OptionsRequete {
  /** URL de la requete */
  url: string;
  /** Methode HTTP */
  methode?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** En-tetes personnalises */
  entetes?: Record<string, string>;
  /** Corps de la requete (sera serialise en JSON) */
  corps?: unknown;
  /** Delai d'attente en millisecondes */
  timeout?: number;
  /** Inclure les cookies */
  avecCredentials?: boolean;
}

/**
 * Reponse d'une requete HTTP
 */
export interface Reponse<T = unknown> {
  /** Statut HTTP */
  statut: number;
  /** Texte du statut */
  texteStatut: string;
  /** En-tetes de reponse */
  entetes: Record<string, string>;
  /** Donnees de reponse parsees */
  donnees: T;
  /** Temps de reponse en ms */
  tempsReponse: number;
}

/**
 * Effectue une requete HTTP type-safe
 */
export declare function requete<T = unknown>(
  options: OptionsRequete
): Promise<Reponse<T>>;

/**
 * Raccourci pour les requetes GET
 */
export declare function get<T = unknown>(
  url: string,
  options?: Omit<OptionsRequete, "url" | "methode">
): Promise<Reponse<T>>;

/**
 * Raccourci pour les requetes POST
 */
export declare function post<T = unknown>(
  url: string,
  corps: unknown,
  options?: Omit<OptionsRequete, "url" | "methode" | "corps">
): Promise<Reponse<T>>;

/**
 * Cree une instance avec une configuration de base
 */
export declare function creerInstance(
  configBase: Partial<OptionsRequete>
): {
  requete<T>(options: OptionsRequete): Promise<Reponse<T>>;
  get<T>(url: string): Promise<Reponse<T>>;
  post<T>(url: string, corps: unknown): Promise<Reponse<T>>;
};
```

---

## Écrire des .d.ts pour des bibliotheques JS existantes

### Stratégie générale

```typescript
// Etape 1 : Analyser l'API de la bibliotheque JS
// Regarder la documentation, les exemples, le code source

// Etape 2 : Identifier les patterns
// - Fonctions exportees
// - Classes
// - Callbacks
// - Options/configuration
// - Valeurs par defaut

// Etape 3 : Ecrire les declarations progressivement
// Commencer par les fonctions les plus utilisees
// Affiner au fur et a mesure
```

### Exemple complet : typer une lib de validation JS

```typescript
// Imaginons une lib JS "simple-validate" qui expose ceci :
// const validator = require('simple-validate');
// validator.isEmail('test@test.fr') // true
// validator.isPhone('0612345678', 'FR') // true
// validator.isUrl('https://...') // true
// const schema = validator.schema({ name: 'string', age: 'number' });
// schema.validate({ name: 'Alice', age: 30 }) // { valid: true, errors: [] }

// types/simple-validate.d.ts

declare module "simple-validate" {
  /** Resultat de validation */
  interface ResultatValidation {
    /** Vrai si la validation reussit */
    valide: boolean;
    /** Liste des erreurs (vide si valide) */
    erreurs: ErreurValidation[];
  }

  /** Detail d'une erreur de validation */
  interface ErreurValidation {
    /** Chemin de la propriete en erreur */
    chemin: string;
    /** Message d'erreur */
    message: string;
    /** Type attendu */
    typeAttendu: string;
    /** Type recu */
    typeRecu: string;
  }

  /** Types supportes dans les schemas */
  type TypeSchema = "string" | "number" | "boolean" | "object" | "array";

  /** Definition d'un schema */
  type DefinitionSchema = Record<string, TypeSchema | DefinitionSchema>;

  /** Schema valide avec methode validate */
  interface Schema<T = unknown> {
    validate(donnees: unknown): ResultatValidation & { donnees?: T };
    etendre(ajouts: DefinitionSchema): Schema;
  }

  /** Verifie si la valeur est un email valide */
  export function isEmail(valeur: string): boolean;

  /** Verifie si la valeur est un numero de telephone */
  export function isPhone(
    valeur: string,
    codePays?: "FR" | "US" | "GB" | "DE"
  ): boolean;

  /** Verifie si la valeur est une URL valide */
  export function isUrl(valeur: string): boolean;

  /** Verifie si la valeur est un UUID */
  export function isUuid(valeur: string): boolean;

  /** Cree un schema de validation */
  export function schema<T = unknown>(definition: DefinitionSchema): Schema<T>;

  /** Version de la bibliotheque */
  export const version: string;
}
```

---

## Options de declaration dans tsconfig.json

```json
// tsconfig.json — Toutes les options liees aux declarations
{
  "compilerOptions": {
    // --- Generation de declarations ---

    // Genere des fichiers .d.ts
    "declaration": true,

    // Dossier de sortie pour les .d.ts
    "declarationDir": "./dist/types",

    // Genere des source maps pour les .d.ts
    // Permet le "Go to Definition" vers les sources .ts
    "declarationMap": true,

    // Ne genere QUE les .d.ts (pas le JS)
    // Utile quand un autre outil compile le JS (esbuild, swc)
    "emitDeclarationOnly": true,

    // --- Resolution des types ---

    // Dossiers ou chercher les declarations de type
    "typeRoots": ["./types", "./node_modules/@types"],

    // Packages @types a inclure (par defaut : tous)
    "types": ["node", "jest"],

    // --- Imports de type ---

    // Force l'utilisation de 'import type' pour les types uniquement
    "verbatimModuleSyntax": true,

    // Ou l'ancienne option :
    // "importsNotUsedAsValues": "error",
    // "isolatedModules": true,

    // --- Options avancees ---

    // Ne verifie pas les .d.ts dans node_modules (performance)
    "skipLibCheck": true,

    // Fichiers de declaration a inclure
    "files": ["./types/global.d.ts"],

    // Ou via include
    "include": ["src/**/*", "types/**/*"]
  }
}
```

### verbatimModuleSyntax et les imports de type

```typescript
// Avec verbatimModuleSyntax: true, TypeScript force la distinction
// entre les imports de valeur et les imports de type

// CORRECT :
import type { Utilisateur, Role } from "./models";  // Type uniquement
import { creerUtilisateur } from "./services";       // Valeur

// INCORRECT (avec verbatimModuleSyntax) :
// import { Utilisateur, creerUtilisateur } from "./services";
// Erreur si Utilisateur est un type pur

// Aussi supporte : inline type imports
import { creerUtilisateur, type Utilisateur } from "./services";
// 'type' devant Utilisateur indique que c'est un type
```

---

## Pratique

### Exercice 1 : Écrire un fichier .d.ts

Ecrivez les declarations de type pour cette bibliotheque JavaScript imaginaire :

```javascript
// color-utils.js (bibliotheque JS sans types)
function rgb(r, g, b) { return { r, g, b, type: 'rgb' }; }
function hsl(h, s, l) { return { h, s, l, type: 'hsl' }; }
function hex(value) { return { value, type: 'hex' }; }
function toHex(color) { /* ... convertit en hex */ }
function toRgb(color) { /* ... convertit en rgb */ }
function mix(color1, color2, ratio) { /* ... melange */ }
function lighten(color, amount) { /* ... eclaircit */ }
function darken(color, amount) { /* ... assombrit */ }
module.exports = { rgb, hsl, hex, toHex, toRgb, mix, lighten, darken };
```

<details>
<summary>Solution</summary>

```typescript
// types/color-utils.d.ts

declare module "color-utils" {
  /** Couleur au format RGB */
  interface CouleurRGB {
    r: number;
    g: number;
    b: number;
    type: "rgb";
  }

  /** Couleur au format HSL */
  interface CouleurHSL {
    h: number;
    s: number;
    l: number;
    type: "hsl";
  }

  /** Couleur au format hexadecimal */
  interface CouleurHex {
    value: string;
    type: "hex";
  }

  /** Union de tous les types de couleur */
  type Couleur = CouleurRGB | CouleurHSL | CouleurHex;

  /** Cree une couleur RGB */
  export function rgb(r: number, g: number, b: number): CouleurRGB;

  /** Cree une couleur HSL */
  export function hsl(h: number, s: number, l: number): CouleurHSL;

  /** Cree une couleur hexadecimale */
  export function hex(value: string): CouleurHex;

  /** Convertit une couleur en hexadecimal */
  export function toHex(color: Couleur): CouleurHex;

  /** Convertit une couleur en RGB */
  export function toRgb(color: Couleur): CouleurRGB;

  /** Melange deux couleurs avec un ratio (0 a 1) */
  export function mix(
    color1: Couleur,
    color2: Couleur,
    ratio?: number
  ): CouleurRGB;

  /** Eclaircit une couleur (amount: 0 a 1) */
  export function lighten(color: Couleur, amount: number): CouleurRGB;

  /** Assombrit une couleur (amount: 0 a 1) */
  export function darken(color: Couleur, amount: number): CouleurRGB;
}
```

</details>

### Exercice 2 : Module augmentation

Augmentez le module `express` pour ajouter un middleware de logging type-safe :

```typescript
// A faire :
// 1. Augmenter Request pour ajouter un champ 'journal' de type Logger
// 2. Augmenter Response pour ajouter une methode 'json typee'
// 3. Creer l'interface Logger
```

<details>
<summary>Solution</summary>

```typescript
// types/express-logging.d.ts

import "express-serve-static-core";

/** Interface pour le journal de requete */
interface JournalRequete {
  /** Identifiant unique de la requete */
  idRequete: string;
  /** Timestamp de debut */
  debut: Date;
  /** Niveau de log */
  niveau: "debug" | "info" | "warn" | "error";
  /** Ecrit un message dans le journal */
  ecrire(niveau: "debug" | "info" | "warn" | "error", message: string): void;
  /** Raccourci pour info */
  info(message: string): void;
  /** Raccourci pour error */
  erreur(message: string, err?: Error): void;
  /** Obtenir la duree depuis le debut */
  duree(): number;
}

declare module "express-serve-static-core" {
  interface Request {
    /** Journal de requete attache par le middleware de logging */
    journal: JournalRequete;
  }

  interface Response {
    /**
     * Envoie une reponse JSON type-safe avec le bon Content-Type
     * et le code de statut
     */
    jsonType<T extends Record<string, unknown>>(
      statut: number,
      donnees: T
    ): void;

    /**
     * Envoie une reponse de succes standardisee
     */
    succes<T>(donnees: T, message?: string): void;

    /**
     * Envoie une reponse d'erreur standardisee
     */
    erreurServeur(code: number, message: string, details?: unknown): void;
  }
}

export { JournalRequete };
```

</details>

### Exercice 3 : Declaration merging

Utilisez la fusion de declarations pour créer un module complet avec types,
fonctions factory, et constantes :

```typescript
// A faire : Creer un type 'Monnaie' qui est a la fois :
// - Une interface (avec montant, devise, formater())
// - Un namespace avec des fonctions factory (euros, dollars, yen)
// - Un namespace avec des constantes (ZERO, DEVISES_SUPPORTEES)
```

<details>
<summary>Solution</summary>

```typescript
// Monnaie comme interface
interface Monnaie {
  montant: number;
  devise: "EUR" | "USD" | "JPY" | "GBP";
  formater(): string;
}

// Monnaie comme namespace avec des factories et constantes
namespace Monnaie {
  // Constantes
  export const DEVISES_SUPPORTEES = ["EUR", "USD", "JPY", "GBP"] as const;
  export type Devise = (typeof DEVISES_SUPPORTEES)[number];

  // Fonction interne de creation
  function creer(montant: number, devise: Devise): Monnaie {
    return {
      montant,
      devise,
      formater() {
        const formatteur = new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: this.devise,
        });
        return formatteur.format(this.montant);
      },
    };
  }

  // Factories
  export function euros(montant: number): Monnaie {
    return creer(montant, "EUR");
  }

  export function dollars(montant: number): Monnaie {
    return creer(montant, "USD");
  }

  export function yen(montant: number): Monnaie {
    return creer(montant, "JPY");
  }

  export function livres(montant: number): Monnaie {
    return creer(montant, "GBP");
  }

  // Constante zero
  export const ZERO: Monnaie = creer(0, "EUR");

  // Operations
  export function additionner(a: Monnaie, b: Monnaie): Monnaie {
    if (a.devise !== b.devise) {
      throw new Error(
        `Impossible d'additionner ${a.devise} et ${b.devise}`
      );
    }
    return creer(a.montant + b.montant, a.devise);
  }
}

// Utilisation
const prix: Monnaie = Monnaie.euros(42.5);
console.log(prix.formater()); // "42,50 EUR"

const total = Monnaie.additionner(
  Monnaie.euros(10),
  Monnaie.euros(20)
);
console.log(total.formater()); // "30,00 EUR"
```

</details>

### Exercice 4 : declare global complet

Creez les declarations globales pour une application avec des variables
d'environnement et des utilitaires globaux :

<details>
<summary>Solution</summary>

```typescript
// types/app-global.d.ts

declare global {
  // Variables d'environnement
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      JWT_SECRET: string;
      API_KEY: string;
      LOG_LEVEL: "debug" | "info" | "warn" | "error";
    }
  }

  // Variables globales de l'application
  var __APP_VERSION__: string;
  var __BUILD_DATE__: string;
  var __IS_DEV__: boolean;

  // Utilitaires globaux
  interface ObjectConstructor {
    /**
     * Verifie si un objet a une propriete (type guard)
     */
    hasOwn<T extends object, K extends PropertyKey>(
      obj: T,
      key: K
    ): obj is T & Record<K, unknown>;
  }

  // Surcharger fetch pour ajouter des types generiques
  interface WindowOrWorkerGlobalScope {
    fetchJson<T>(url: string, init?: RequestInit): Promise<T>;
  }

  // Ajouter une methode de logging structuree
  interface Console {
    logStructure(evenement: string, donnees: Record<string, unknown>): void;
  }
}

export {};
```

</details>

---

## Récapitulatif

| Concept                    | Description                                              |
|----------------------------|----------------------------------------------------------|
| **Fichier .d.ts**          | Contient uniquement des declarations de type             |
| **declare**                | Indique qu'une implementation existe ailleurs            |
| **declare module**         | Declare les types d'un module JS ou augmente un existant |
| **declare global**         | Ajoute des types a l'espace global                       |
| **Triple-slash**           | Références entre fichiers de declaration                 |
| **Declaration merging**    | Fusion automatique d'interfaces, namespaces, etc.        |
| **@types/**                | Packages de types de DefinitelyTyped                     |
| **tsc --declaration**      | Génération automatique de .d.ts depuis le code TS        |
| **declarationMap**         | Source maps pour naviguer vers les sources depuis .d.ts  |
| **verbatimModuleSyntax**   | Force `import type` pour les types purs                  |

---

## Pour aller plus loin

Dans le prochain module, **Module 17 — Configuration avancee & Performance du
compilateur**, nous verrons comment configurer TypeScript de manière optimale
avec `tsconfig.json`, gérer les project références, et optimiser les performances
de compilation dans les grands projets et monorepos.

La maîtrise des fichiers de declaration est essentielle pour comprendre comment
TypeScript resout les types et comment configurer correctement les chemins et
références dans `tsconfig.json`.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 16 declaration files](../screencasts/screencast-16-declaration-files.md)
2. **Lab** : [lab-16-declaration-files](../labs/lab-16-declaration-files/README)
3. **Visualisation** : [Module Resolution](../visualizations/module-resolution.html)
4. **Quiz** : [quiz 16 declaration files](../quizzes/quiz-16-declaration-files.html)
:::
