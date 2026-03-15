# 00 — Prerequis & Introduction a TypeScript

> **Duree estimee** : 3h00
> **Difficulte** : 1/5
> **Prerequis** : Connaitre les bases de JavaScript (variables, fonctions, objets, tableaux)
> **Objectifs** :
> - Comprendre **pourquoi** TypeScript existe et quels problemes il resout
> - Installer TypeScript et configurer un projet
> - Ecrire et compiler un premier fichier `.ts`
> - Comprendre le concept de **type erasure**
> - Maitriser les bases de `tsconfig.json` et le mode strict

---

## Pourquoi TypeScript ?

### Le probleme avec JavaScript

JavaScript est un langage **dynamiquement type**. Cela signifie que les types des variables ne sont pas verifies avant l'execution du programme. Cela mene a des bugs silencieux :

```javascript
// JavaScript — Ce code ne produit aucune erreur... jusqu'a l'execution
function calculerPrix(quantite, prixUnitaire) {
  return quantite * prixUnitaire;
}

// Oups ! On passe une chaine au lieu d'un nombre
const total = calculerPrix("5", 10);
console.log(total); // 50 — ca marche par chance (coercion)

const total2 = calculerPrix("cinq", 10);
console.log(total2); // NaN — bug silencieux !
```

Avec TypeScript, ce bug est **detecte avant meme d'executer le code** :

```typescript
// TypeScript — Erreur detectee immediatement
function calculerPrix(quantite: number, prixUnitaire: number): number {
  return quantite * prixUnitaire;
}

// Erreur de compilation :
// Argument of type 'string' is not assignable to parameter of type 'number'
const total = calculerPrix("cinq", 10);
```

### Analogie — Le correcteur orthographique

Pense a TypeScript comme un **correcteur orthographique** pour ton code.

- **Sans correcteur** (JavaScript) : tu ecris un email de 500 mots. Tu ne vois les fautes que quand ton patron te repond "je n'ai rien compris".
- **Avec correcteur** (TypeScript) : les fautes sont soulignees en rouge **pendant que tu ecris**. Tu les corriges avant d'envoyer.

TypeScript ne change pas le langage fondamentalement — il ajoute une couche de **verification** qui t'alerte des problemes **avant** qu'ils n'arrivent en production.

### Les 3 super-pouvoirs de TypeScript

```
┌──────────────────────────────────────────────────────────────┐
│                   TYPESCRIPT = JAVASCRIPT +                    │
├────────────────────┬────────────────────┬────────────────────┤
│  1. DETECTION      │  2. AUTOCOMPLETION  │  3. DOCUMENTATION  │
│     DE BUGS        │     INTELLIGENTE    │     VIVANTE        │
│                    │                    │                    │
│  Erreurs trouvees  │  Ton editeur sait  │  Les types servent │
│  AVANT execution   │  exactement quelles│  de documentation  │
│  (compile-time)    │  proprietes et     │  qui ne peut pas   │
│                    │  methodes existent │  devenir obsolete  │
└────────────────────┴────────────────────┴────────────────────┘
```

#### 1. Detection de bugs a la compilation

```typescript
// TypeScript detecte les erreurs classiques :

// Erreur : propriete inexistante
const utilisateur = { nom: "Alice", age: 30 };
console.log(utilisateur.prenom); // Property 'prenom' does not exist

// Erreur : appel avec mauvais nombre d'arguments
function saluer(nom: string): string {
  return `Bonjour ${nom}`;
}
saluer("Alice", "Bob"); // Expected 1 arguments, but got 2

// Erreur : operation impossible
const resultat = "hello" - 5; // The left-hand side of an arithmetic operation
                               // must be of type 'any', 'number', 'bigint'
```

#### 2. Autocompletion (IntelliSense)

```typescript
// Quand tu tapes 'utilisateur.', ton editeur propose :
// - nom (string)
// - age (number)
// Pas besoin de deviner ou de lire la documentation !

interface Utilisateur {
  nom: string;
  age: number;
  email: string;
}

const utilisateur: Utilisateur = {
  nom: "Alice",
  age: 30,
  email: "alice@example.com",
};

// L'editeur propose automatiquement .nom, .age, .email
utilisateur.
```

#### 3. Documentation vivante

```typescript
// Les types SONT la documentation
// Impossible qu'elle devienne obsolete car le compilateur verifie

/**
 * Calcule le montant TTC a partir du montant HT
 */
function calculerTTC(montantHT: number, tauxTVA: number = 0.2): number {
  return montantHT * (1 + tauxTVA);
}

// En survolant la fonction, tu vois immediatement :
// - Les types des parametres
// - La valeur par defaut de tauxTVA
// - Le type de retour
```

---

## Histoire & Versions de TypeScript

### Origines

TypeScript a ete cree par **Anders Hejlsberg** (le createur de C# et Delphi) chez **Microsoft**. La premiere version publique est sortie en **octobre 2012**.

```
Chronologie des versions majeures :
──────────────────────────────────────────────────────────
2012  │  TypeScript 0.8    — Premiere version publique
2014  │  TypeScript 1.0    — Version stable
2016  │  TypeScript 2.0    — strict null checks, control flow analysis
2018  │  TypeScript 3.0    — Tuples, project references
2020  │  TypeScript 4.0    — Variadic tuple types, labeled tuples
2023  │  TypeScript 5.0    — Decorators ES, const type parameters
2024  │  TypeScript 5.4+   — NoInfer, improved narrowing
2025  │  TypeScript 5.8+   — Derniere version stable
──────────────────────────────────────────────────────────
```

### TypeScript aujourd'hui

TypeScript est devenu un **standard de l'industrie** :

- **Angular** est ecrit en TypeScript depuis Angular 2
- **React** a un support TypeScript natif via `npm create vite@latest -- --template react-ts`

> **Note** : `create-react-app` est deprecie depuis fevrier 2025. Utilisez Vite, Next.js, ou Remix pour les nouveaux projets React + TypeScript.

- **Vue 3** est ecrit en TypeScript
- **Node.js** supporte TypeScript nativement depuis la v22.6+ (flag `--experimental-strip-types`)
- **Deno** et **Bun** supportent TypeScript nativement
- Plus de **40 millions** de telechargements npm par semaine

---

## Installation

### Prerequis

Avant d'installer TypeScript, tu as besoin de :

1. **Node.js** (version 18 ou superieure recommandee)
2. **npm** (installe automatiquement avec Node.js)
3. Un **editeur de code** (VS Code fortement recommande)

```bash
# Verifier que Node.js est installe
node --version
# v20.11.0 (ou superieur)

# Verifier que npm est installe
npm --version
# 10.2.4 (ou superieur)
```

### Installer TypeScript globalement

```bash
# Installation globale du compilateur TypeScript
npm install -g typescript

# Verifier l'installation
tsc --version
# Version 5.8.x
```

### Installer tsx (TypeScript Execute)

`tsx` est un outil qui permet d'**executer directement** des fichiers TypeScript sans etape de compilation manuelle. Tres pratique pour le developpement :

```bash
# Installation globale de tsx
npm install -g tsx

# Verifier l'installation
tsx --version
```

### Difference entre tsc et tsx

```
┌──────────────────────────────────────────────────────────────┐
│                    tsc vs tsx                                   │
├──────────────────────────────┬───────────────────────────────┤
│           tsc                │            tsx                 │
├──────────────────────────────┼───────────────────────────────┤
│ Compilateur officiel         │ Executeur rapide               │
│ Verifie les types            │ Ne verifie PAS les types       │
│ Produit des fichiers .js     │ Execute directement en memoire │
│ Utilise en CI/CD, build      │ Utilise en developpement       │
│ Lent (analyse complete)      │ Rapide (transpilation seule)   │
└──────────────────────────────┴───────────────────────────────┘
```

```bash
# Avec tsc : compilation puis execution
tsc mon-fichier.ts        # produit mon-fichier.js
node mon-fichier.js       # execute le JS

# Avec tsx : execution directe
tsx mon-fichier.ts         # compile et execute en une etape
```

---

## Premier fichier TypeScript

### Creer le fichier

Cree un fichier `bonjour.ts` :

```typescript
// bonjour.ts — Notre premier fichier TypeScript !

// On declare une variable avec son type
const message: string = "Bonjour, TypeScript !";

// On declare une fonction avec des types
function saluer(nom: string, age: number): string {
  return `Salut ${nom}, tu as ${age} ans.`;
}

// Utilisation
const resultat = saluer("Alice", 30);
console.log(message);
console.log(resultat);

// TypeScript detecte les erreurs :
// saluer(42, "Alice"); // Erreur ! Les arguments sont dans le mauvais ordre
```

### Compiler et executer

```bash
# Methode 1 : Compilation explicite avec tsc
tsc bonjour.ts
# Cree un fichier bonjour.js

node bonjour.js
# Bonjour, TypeScript !
# Salut Alice, tu as 30 ans.

# Methode 2 : Execution directe avec tsx
tsx bonjour.ts
# Bonjour, TypeScript !
# Salut Alice, tu as 30 ans.
```

### Observer le JavaScript genere

Apres la compilation avec `tsc`, regarde le fichier `bonjour.js` genere :

```javascript
// bonjour.js — Le resultat de la compilation
// Remarque : TOUS les types ont disparu !

"use strict";
const message = "Bonjour, TypeScript !";

function saluer(nom, age) {
  return `Salut ${nom}, tu as ${age} ans.`;
}

const resultat = saluer("Alice", 30);
console.log(message);
console.log(resultat);
```

C'est le concept fondamental de **type erasure** que nous allons explorer en detail.

---

## Type Erasure — Le concept fondamental

### Analogie — Les echafaudages

Imagine la construction d'un batiment :

- Les **echafaudages** sont necessaires pendant la construction. Ils permettent aux ouvriers de travailler en hauteur, de verifier l'alignement des murs, etc.
- Une fois le batiment termine, **on retire les echafaudages**. Le batiment tient debout tout seul.

TypeScript fonctionne exactement de la meme maniere :

```
┌─────────────────────────────────────────────────────────┐
│                    TYPE ERASURE                           │
│                                                          │
│  Phase DEVELOPPEMENT         Phase EXECUTION              │
│  (avec echafaudages)         (echafaudages retires)      │
│                                                          │
│  const age: number = 30;  →  const age = 30;             │
│                                                          │
│  function greet(            function greet(               │
│    name: string             →   name                      │
│  ): string {                ): {                          │
│    return "Hi " + name;       return "Hi " + name;       │
│  }                           }                            │
│                                                          │
│  Les types existent UNIQUEMENT a la compilation.          │
│  Au runtime, c'est du JavaScript pur.                    │
└─────────────────────────────────────────────────────────┘
```

### Consequences importantes

```typescript
// ⚠️ Les types n'existent PAS au runtime !

interface Chat {
  nom: string;
  ronronne: boolean;
}

interface Chien {
  nom: string;
  aboie: boolean;
}

// On NE PEUT PAS faire ceci au runtime :
// if (animal instanceof Chat) { ... }
// Erreur : 'Chat' only refers to a type, but is being used as a value here

// Solution : utiliser des proprietes discriminantes
function estChat(animal: Chat | Chien): animal is Chat {
  return "ronronne" in animal;
}
```

### Le flow de compilation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│  Code .ts    │────▶│ Compilateur  │────▶│  Code .js    │
│              │     │    (tsc)     │     │              │
│ Avec types   │     │              │     │ Sans types   │
│              │     │ Verification │     │              │
└──────────────┘     │ des types    │     └──────┬───────┘
                     │              │            │
                     │ Generation   │            ▼
                     │ du JS        │     ┌──────────────┐
                     │              │     │              │
                     └──────────────┘     │   Node.js    │
                                          │  ou Browser  │
                                          │              │
                                          │  Execute le  │
                                          │  JavaScript  │
                                          └──────────────┘
```

---

## Initialiser un projet — tsc --init

### Creer un tsconfig.json

Plutot que de compiler fichier par fichier, on configure un **projet** TypeScript :

```bash
# Creer un nouveau dossier de projet
mkdir mon-projet-ts
cd mon-projet-ts

# Initialiser le projet npm
npm init -y

# Initialiser la configuration TypeScript
tsc --init
```

La commande `tsc --init` cree un fichier `tsconfig.json` avec beaucoup d'options commentees.

### tsconfig.json — Les options essentielles

Voici un `tsconfig.json` minimal et bien configure :

```json
{
  "compilerOptions": {
    // === Cible de compilation ===
    "target": "ES2022",          // Version JS cible (ES2022 est un bon defaut)
    "module": "NodeNext",        // Systeme de modules
    "moduleResolution": "NodeNext", // Resolution des imports

    // === Mode strict (OBLIGATOIRE) ===
    "strict": true,              // Active TOUTES les verifications strictes

    // === Sortie ===
    "outDir": "./dist",          // Dossier de sortie pour les .js compiles
    "rootDir": "./src",          // Dossier source

    // === Qualite du code ===
    "noUnusedLocals": true,      // Erreur si variable locale non utilisee
    "noUnusedParameters": true,  // Erreur si parametre non utilise
    "noImplicitReturns": true,   // Erreur si une branche ne retourne rien
    "noFallthroughCasesInSwitch": true, // Erreur si case sans break

    // === Interop ===
    "esModuleInterop": true,     // Meilleure compatibilite avec les modules CommonJS
    "forceConsistentCasingInFileNames": true, // Respect de la casse des fichiers

    // === Source maps (pour le debug) ===
    "sourceMap": true,           // Genere des .js.map pour le debugging
    "declaration": true          // Genere des .d.ts pour les types
  },
  "include": ["src/**/*"],       // Fichiers a compiler
  "exclude": ["node_modules", "dist"] // Fichiers a ignorer
}
```

### Comprendre "target"

L'option `target` determine la version de JavaScript generee :

```typescript
// Code TypeScript source
const nombres = [1, 2, 3, 4, 5];
const pairs = nombres.filter((n) => n % 2 === 0);

// Avec target: "ES5" — Compatibilite maximale
var nombres = [1, 2, 3, 4, 5];
var pairs = nombres.filter(function (n) { return n % 2 === 0; });

// Avec target: "ES2022" — JavaScript moderne (recommande)
const nombres = [1, 2, 3, 4, 5];
const pairs = nombres.filter((n) => n % 2 === 0);
```

### Comprendre "module"

```
┌───────────────────────────────────────────────────────────┐
│                SYSTEMES DE MODULES                         │
├──────────────────┬────────────────────────────────────────┤
│ "CommonJS"       │ require() / module.exports             │
│                  │ Utilise par Node.js historiquement      │
├──────────────────┼────────────────────────────────────────┤
│ "ESNext"         │ import / export                         │
│                  │ Standard moderne (navigateurs + Node)  │
├──────────────────┼────────────────────────────────────────┤
│ "NodeNext"       │ Adapte automatiquement selon package   │
│                  │ .json "type" field — RECOMMANDE        │
└──────────────────┴────────────────────────────────────────┘
```

---

## Le mode strict — Pourquoi c'est OBLIGATOIRE

### Qu'est-ce que le mode strict ?

L'option `"strict": true` active en realite **plusieurs verifications** d'un coup :

```json
{
  "compilerOptions": {
    "strict": true
    // Equivalent a activer TOUTES ces options :
    // "strictNullChecks": true        — null et undefined geres proprement
    // "strictFunctionTypes": true     — Types de fonctions verifies
    // "strictBindCallApply": true     — bind/call/apply verifies
    // "strictPropertyInitialization": true — Proprietes de classe initialisees
    // "noImplicitAny": true           — Pas de 'any' implicite
    // "noImplicitThis": true          — 'this' doit avoir un type
    // "alwaysStrict": true            — "use strict" dans chaque fichier
    // "useUnknownInCatchVariables": true — catch(e) est unknown, pas any
  }
}
```

### Exemple : avec et sans strict

```typescript
// === SANS strict (DANGEREUX) ===

// noImplicitAny: false — Les parametres sans type deviennent 'any'
function doubler(valeur) {
  // 'valeur' est implicitement 'any' — aucune verification !
  return valeur * 2;
}
doubler("hello"); // NaN au runtime, aucune erreur a la compilation

// strictNullChecks: false — null/undefined ignores
function longueur(texte: string) {
  return texte.length; // Peut crasher si texte est null !
}
longueur(null); // TypeError: Cannot read property 'length' of null


// === AVEC strict (SUR) ===

// noImplicitAny: true — Obligation de typer
function doubler(valeur: number): number {
  return valeur * 2;
}
doubler("hello"); // Erreur de compilation ! Impossible de passer une string.

// strictNullChecks: true — null doit etre gere
function longueur(texte: string | null): number {
  if (texte === null) {
    return 0; // On gere le cas null explicitement
  }
  return texte.length; // TypeScript sait que texte est string ici
}
```

### Analogie — La ceinture de securite

Le mode strict, c'est comme la **ceinture de securite** en voiture :

- Ca te contraint un peu (tu dois l'attacher)
- Ca peut sembler inutile quand tout va bien
- Mais le jour ou il y a un probleme, **ca te sauve la vie**

> **Regle d'or** : TOUJOURS activer `"strict": true` dans un nouveau projet.
> Desactiver le mode strict, c'est comme desactiver l'alarme incendie parce qu'elle fait du bruit.

---

## Le Playground en ligne

### TypeScript Playground

Le **TypeScript Playground** est un editeur en ligne officiel qui permet d'experimenter avec TypeScript sans rien installer :

- URL : [https://www.typescriptlang.org/play](https://www.typescriptlang.org/play)
- Tu ecris du TypeScript a gauche
- Tu vois le JavaScript genere a droite
- Les erreurs s'affichent en temps reel

```
┌───────────────────────────┬──────────────────────────────┐
│      TypeScript (input)    │     JavaScript (output)       │
│                            │                              │
│  interface User {          │                              │
│    name: string;           │  "use strict";               │
│    age: number;            │  const user = {              │
│  }                         │    name: "Alice",            │
│                            │    age: 30                   │
│  const user: User = {     │  };                           │
│    name: "Alice",          │  console.log(user.name);     │
│    age: 30                 │                              │
│  };                        │                              │
│                            │  // Les types ont disparu !  │
│  console.log(user.name);  │                              │
└───────────────────────────┴──────────────────────────────┘
```

### Utiliser le Playground efficacement

1. **Partager du code** : Clique sur "Share" pour obtenir un lien unique
2. **Changer les options** : Clique sur "TS Config" pour modifier les options du compilateur
3. **Voir les erreurs** : Clique sur "Errors" pour voir les erreurs de compilation
4. **Executer le code** : Clique sur "Run" pour executer dans la console du navigateur

---

## Le REPL avec tsx

### Mode interactif

`tsx` peut aussi servir de **REPL** (Read-Eval-Print Loop) — un mode interactif pour tester du code TypeScript :

```bash
# Lancer le REPL TypeScript
tsx

# Tu peux maintenant taper du TypeScript directement :
> const x: number = 42
> x * 2
84
> interface Point { x: number; y: number }
> const p: Point = { x: 1, y: 2 }
> p
{ x: 1, y: 2 }
```

### Mode watch (rechargement automatique)

Pour le developpement, `tsx` offre un mode **watch** qui recompile automatiquement quand tu modifies un fichier :

```bash
# Lancer en mode watch
tsx watch mon-fichier.ts

# Chaque fois que tu sauvegardes mon-fichier.ts,
# il est automatiquement re-execute
```

---

## Structure d'un projet TypeScript

### Structure recommandee

```
mon-projet-ts/
├── src/                    # Code source TypeScript
│   ├── index.ts           # Point d'entree
│   ├── utils/             # Utilitaires
│   │   └── calcul.ts
│   └── models/            # Types et interfaces
│       └── utilisateur.ts
├── dist/                   # Code JS compile (genere par tsc)
│   ├── index.js
│   ├── index.js.map
│   └── ...
├── tests/                  # Tests
│   └── calcul.test.ts
├── tsconfig.json           # Configuration TypeScript
├── package.json            # Configuration npm
└── .gitignore              # Ignorer dist/ et node_modules/
```

### Exemple complet de projet

```typescript
// src/models/utilisateur.ts
export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  actif: boolean;
}
```

```typescript
// src/utils/calcul.ts
export function additionner(a: number, b: number): number {
  return a + b;
}

export function multiplier(a: number, b: number): number {
  return a * b;
}
```

```typescript
// src/index.ts
import { Utilisateur } from "./models/utilisateur";
import { additionner } from "./utils/calcul";

const utilisateur: Utilisateur = {
  id: 1,
  nom: "Alice",
  email: "alice@example.com",
  actif: true,
};

console.log(`Bienvenue ${utilisateur.nom} !`);
console.log(`2 + 3 = ${additionner(2, 3)}`);
```

### Scripts npm recommandes

```json
{
  "scripts": {
    "build": "tsc",
    "start": "tsx src/index.ts",
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

- `npm run build` — Compile le projet
- `npm start` — Execute directement avec tsx
- `npm run dev` — Mode developpement avec rechargement automatique
- `npm run typecheck` — Verifie les types sans generer de fichiers

---

## Pratique

### Exercice 1 — Installation et premier fichier

Cree un projet TypeScript from scratch :

1. Cree un dossier `tp-introduction`
2. Initialise npm et TypeScript
3. Cree un fichier `src/premier.ts` qui :
   - Declare une variable `prenom` de type `string`
   - Declare une variable `age` de type `number`
   - Declare une fonction `sePresenter` qui prend un `prenom` et un `age` et retourne une phrase de presentation
   - Appelle la fonction et affiche le resultat

<details>
<summary>Solution</summary>

```bash
mkdir tp-introduction
cd tp-introduction
npm init -y
tsc --init
mkdir src
```

```typescript
// src/premier.ts

const prenom: string = "Alice";
const age: number = 30;

function sePresenter(prenom: string, age: number): string {
  return `Je m'appelle ${prenom} et j'ai ${age} ans.`;
}

const presentation: string = sePresenter(prenom, age);
console.log(presentation);
// Je m'appelle Alice et j'ai 30 ans.
```

```bash
# Compiler et executer
tsc src/premier.ts
node src/premier.js

# Ou directement
tsx src/premier.ts
```

</details>

### Exercice 2 — Comprendre le type erasure

Ecris le fichier TypeScript suivant, compile-le avec `tsc`, puis compare le fichier `.ts` et le fichier `.js` genere. Note toutes les differences.

```typescript
// src/erasure.ts
interface Animal {
  nom: string;
  type: "chat" | "chien";
  age: number;
}

function decrireAnimal(animal: Animal): string {
  const emoji: string = animal.type === "chat" ? "🐱" : "🐶";
  return `${emoji} ${animal.nom} a ${animal.age} ans`;
}

const monChat: Animal = {
  nom: "Moustache",
  type: "chat",
  age: 5,
};

console.log(decrireAnimal(monChat));
```

<details>
<summary>Solution</summary>

Apres compilation avec `tsc`, le fichier JavaScript genere est :

```javascript
// src/erasure.js
"use strict";
function decrireAnimal(animal) {
  const emoji = animal.type === "chat" ? "🐱" : "🐶";
  return `${emoji} ${animal.nom} a ${animal.age} ans`;
}
const monChat = {
  nom: "Moustache",
  type: "chat",
  age: 5,
};
console.log(decrireAnimal(monChat));
```

**Differences observees** :
1. L'`interface Animal` a **completement disparu** (type erasure)
2. Les annotations de type (`: string`, `: number`, `: Animal`) ont disparu
3. Le type union `"chat" | "chien"` a disparu
4. Le type de retour `: string` a disparu
5. La logique du code est **identique** — seuls les types ont ete effaces

</details>

### Exercice 3 — Configurer tsconfig.json

Cree un `tsconfig.json` pour un projet avec les exigences suivantes :
- Cible : ES2022
- Mode strict active
- Sources dans `src/`
- Sortie dans `build/`
- Source maps actives
- Pas de variables locales inutilisees

<details>
<summary>Solution</summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./build",
    "rootDir": "./src",
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

</details>

### Exercice 4 — Detecter les erreurs

Le code suivant contient **5 erreurs** que TypeScript detecterait en mode strict. Trouve-les toutes :

```typescript
// src/erreurs.ts

function calculer(a, b) {
  return a + b;
}

const resultat = calculer(10, 20, 30);

let nom: string = null;

const utilisateur = {
  prenom: "Bob",
  age: 25,
};
console.log(utilisateur.email);

function traiter(donnees: string) {
  if (donnees.length > 10) {
    return donnees.substring(0, 10);
  }
}
```

<details>
<summary>Solution</summary>

Les 5 erreurs :

1. **`function calculer(a, b)`** — Parametres `a` et `b` n'ont pas de type (`noImplicitAny` en mode strict)
2. **`calculer(10, 20, 30)`** — La fonction attend 2 arguments mais en recoit 3
3. **`let nom: string = null`** — En mode strict (`strictNullChecks`), `null` n'est pas assignable a `string`. Il faudrait `string | null`
4. **`utilisateur.email`** — La propriete `email` n'existe pas sur l'objet `utilisateur`
5. **La fonction `traiter`** — Ne retourne pas toujours une valeur (pas de `return` dans le `else`). Avec `noImplicitReturns`, c'est une erreur

Version corrigee :

```typescript
function calculer(a: number, b: number): number {
  return a + b;
}

const resultat = calculer(10, 20);

let nom: string | null = null;

const utilisateur = {
  prenom: "Bob",
  age: 25,
  email: "bob@example.com",
};
console.log(utilisateur.email);

function traiter(donnees: string): string {
  if (donnees.length > 10) {
    return donnees.substring(0, 10);
  }
  return donnees; // On retourne la chaine complete si < 10 caracteres
}
```

</details>

### Exercice 5 — Mini-projet : Gestionnaire de taches

Cree un mini-projet TypeScript complet avec :
- Une interface `Tache` avec `id`, `titre`, `terminee`
- Une fonction `creerTache` pour creer une tache
- Une fonction `terminerTache` qui change l'etat d'une tache
- Une fonction `afficherTaches` qui affiche la liste des taches

<details>
<summary>Solution</summary>

```typescript
// src/taches.ts

// Definition du type Tache
interface Tache {
  id: number;
  titre: string;
  terminee: boolean;
}

// Compteur auto-incremente pour les IDs
let prochainId: number = 1;

// Creer une nouvelle tache
function creerTache(titre: string): Tache {
  const tache: Tache = {
    id: prochainId,
    titre: titre,
    terminee: false,
  };
  prochainId++;
  return tache;
}

// Marquer une tache comme terminee
function terminerTache(tache: Tache): Tache {
  return {
    ...tache,
    terminee: true,
  };
}

// Afficher la liste des taches
function afficherTaches(taches: Tache[]): void {
  console.log("\n=== Liste des taches ===");
  for (const tache of taches) {
    const statut: string = tache.terminee ? "[x]" : "[ ]";
    console.log(`${statut} #${tache.id} — ${tache.titre}`);
  }
  console.log("========================\n");
}

// Utilisation
const taches: Tache[] = [];

taches.push(creerTache("Apprendre TypeScript"));
taches.push(creerTache("Configurer tsconfig.json"));
taches.push(creerTache("Ecrire du code type-safe"));

afficherTaches(taches);
// [ ] #1 — Apprendre TypeScript
// [ ] #2 — Configurer tsconfig.json
// [ ] #3 — Ecrire du code type-safe

// Terminer la premiere tache
taches[0] = terminerTache(taches[0]);

afficherTaches(taches);
// [x] #1 — Apprendre TypeScript
// [ ] #2 — Configurer tsconfig.json
// [ ] #3 — Ecrire du code type-safe
```

</details>

---

## Recapitulatif

```
┌──────────────────────────────────────────────────────────────┐
│                   CE QUE TU AS APPRIS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TypeScript = JavaScript + Verification de types          │
│                                                              │
│  2. Les 3 avantages : detection de bugs, autocompletion,     │
│     documentation vivante                                    │
│                                                              │
│  3. Installation : npm i -g typescript tsx                    │
│                                                              │
│  4. Compilation : tsc (compile) vs tsx (execute direct)      │
│                                                              │
│  5. tsconfig.json : le fichier de configuration central      │
│                                                              │
│  6. Mode strict : TOUJOURS actif (strict: true)              │
│                                                              │
│  7. Type erasure : les types disparaissent a la compilation  │
│     — ils n'existent qu'a la phase de developpement          │
│                                                              │
│  8. Le Playground : experimenter en ligne sans installation  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Commandes essentielles

```bash
# Installation
npm install -g typescript tsx

# Initialiser un projet
tsc --init

# Compiler
tsc                      # Compile tout le projet
tsc fichier.ts           # Compile un fichier

# Executer directement
tsx fichier.ts           # Execute sans compilation separee
tsx watch fichier.ts     # Mode developpement avec reload

# Verifier les types sans compiler
tsc --noEmit
```

---

## Pour aller plus loin

Dans le prochain module, **01 — Types primitifs, Inference & Strict Mode**, nous allons decouvrir en detail :

- Les types de base de TypeScript (`string`, `number`, `boolean`, etc.)
- Comment TypeScript **infere** les types automatiquement
- La difference entre `let` et `const` pour l'inference
- Pourquoi `any` est dangereux et comment utiliser `unknown` a la place
- L'operateur `satisfies` (nouveaute TypeScript 4.9+)

> **Conseil** : Avant de passer au module suivant, assure-toi d'avoir installe TypeScript et d'avoir reussi a compiler et executer ton premier fichier `.ts`. La pratique est essentielle !
