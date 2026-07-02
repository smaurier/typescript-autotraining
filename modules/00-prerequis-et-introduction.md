---
titre: Prérequis et introduction à TypeScript
cours: 00-typescript
notions: [pourquoi le typage statique, TypeScript vs JavaScript, installation de TypeScript, compilateur tsc, exécution avec tsx, tsconfig.json de base, mode strict, type erasure, où TypeScript s'intègre (Node, Vite, build), workflow de développement typé]
outcomes: [installer TypeScript et exécuter un premier fichier ts, compiler avec tsc et exécuter avec tsx, écrire un tsconfig.json de base en mode strict, expliquer ce que TypeScript apporte à JavaScript et ce qui disparaît à la compilation]
prerequis: []
next: 01-types-primitifs-et-inference
libs: [{ name: typescript, version: "^5" }]
tribuzen: poser le projet TribuZen typé et annoncer tribuzen/types/index.ts comme source unique de vérité des types métier
last-reviewed: 2026-07
---

# Prérequis et introduction à TypeScript

> **Outcomes — tu sauras FAIRE :** installer TypeScript et exécuter ton premier fichier `.ts`, compiler avec `tsc` et exécuter avec `tsx`, écrire un `tsconfig.json` de base en mode strict, expliquer ce que TypeScript apporte à JavaScript et ce qui disparaît à la compilation.
> **Difficulté :** :star:
>
> **Portée :** ce module d'introduction pose le vocabulaire, l'outillage et le premier projet. Pas de lab — la pratique reprend au module 01 avec les types primitifs et l'inférence. Les blocs de code ci-dessous sont tous exécutables tels quels : installe l'outillage une fois, puis rejoue-les.

| ← Précédent | Suivant → |
|---|---|
| *(début du cours)* | [01 — Types primitifs et inférence](./01-types-primitifs-et-inference.md) |

## 1. Cas concret d'abord

Tu rejoins le projet **TribuZen** (un réseau familial privé). Un collègue a écrit ce helper de facturation d'abonnement en JavaScript. Il « marche » en démo, puis casse en production :

```javascript
// billing.js — JavaScript pur, aucun garde-fou
function calculerAbonnement(nbMembres, prixParMembre) {
  return nbMembres * prixParMembre;
}

// Les données viennent d'un formulaire HTML : tout arrive en string.
const total = calculerAbonnement("5", 10);
console.log(total); // 50 — ça marche PAR CHANCE (coercion "5" * 10)

const totalBug = calculerAbonnement("cinq", 10);
console.log(totalBug); // NaN — bug silencieux, facturé 0 €, découvert 3 semaines plus tard
```

Rien ne signale l'erreur : ni l'éditeur, ni Node, ni le linter. Le bug ne se voit qu'au moment où un client est mal facturé.

La même fonction en TypeScript refuse de compiler **avant** même d'exécuter le code :

```typescript
// billing.ts — le type verrouille le contrat
function calculerAbonnement(nbMembres: number, prixParMembre: number): number {
  return nbMembres * prixParMembre;
}

calculerAbonnement("cinq", 10);
// ✖ Argument of type 'string' is not assignable to parameter of type 'number'.
```

Ce module te donne l'outillage pour passer de la première version à la seconde : installer TypeScript, écrire un `.ts`, le configurer et l'exécuter.

---

## 2. Théorie complète, concise

### 2.1 Pourquoi le typage statique

JavaScript est **typé dynamiquement** : le type d'une valeur n'est connu qu'à l'exécution, et une variable peut changer de type en cours de route. TypeScript ajoute un **typage statique** : les types sont vérifiés *avant* l'exécution, à la compilation.

Trois bénéfices concrets, valables dès la première ligne :

1. **Détection de bugs à la compilation** — les erreurs de type sont trouvées pendant que tu écris, pas en production.
2. **Autocomplétion (IntelliSense)** — l'éditeur connaît les propriétés et méthodes disponibles, tu ne devines plus.
3. **Documentation vivante** — les types *sont* la doc, et le compilateur garantit qu'elle ne devient jamais obsolète.

Analogie : TypeScript est un **correcteur orthographique** pour le code. Sans lui (JS), tu vois les fautes quand le lecteur répond « je n'ai rien compris ». Avec lui (TS), elles sont soulignées pendant la frappe.

### 2.2 TypeScript vs JavaScript

TypeScript est un **surensemble** de JavaScript : tout JS valide est du TS valide. TS n'invente pas un nouveau langage, il ajoute une **couche de types** au-dessus de JS et un compilateur qui la vérifie.

| | JavaScript | TypeScript |
|---|---|---|
| Vérification des types | à l'exécution (runtime) | à la compilation (compile-time) |
| Fichiers | `.js` / `.mjs` | `.ts` / `.tsx` |
| Exécution directe | Node, navigateur | non — il faut compiler ou transpiler |
| Erreurs de type | plantage ou `NaN` silencieux | refus de compiler |
| Ce qui reste au runtime | tout | uniquement le JS (les types sont effacés) |

Le point clé de la dernière ligne s'appelle le **type erasure** (2.6).

### 2.3 Installer TypeScript

Prérequis : **Node.js 18+** (idéalement 20 ou 22) et **npm**, installés ensemble.

```bash
node --version   # v22.x (ou 20.x / 18.x)
npm --version    # 10.x
```

On installe deux outils. En pratique, on les met en **devDependency d'un projet** (préférable à `-g` : la version est figée par projet) :

```bash
npm init -y
npm install --save-dev typescript tsx
```

- **typescript** fournit le compilateur `tsc`.
- **tsx** exécute directement un fichier `.ts` sans étape de compilation manuelle (idéal en dev).

On lance les binaires locaux via `npx` (ou via des scripts npm) :

```bash
npx tsc --version   # Version 5.x
npx tsx --version
```

> Installer en `-g` (`npm install -g typescript tsx`) reste possible pour du bricolage rapide, mais chaque projet sérieux fige sa propre version en devDependency.

### 2.4 Premier fichier `.ts`, compiler avec `tsc`, exécuter avec `tsx`

Un fichier TypeScript, c'est du JS avec des **annotations de type** (`: string`, `: number`) :

```typescript
// bonjour.ts
const message: string = "Bonjour, TypeScript !";

function saluer(nom: string, age: number): string {
  return `Salut ${nom}, tu as ${age} ans.`;
}

console.log(message);
console.log(saluer("Alice", 30));
```

Deux workflows pour l'exécuter :

```bash
# Workflow 1 — tsc : compile en .js, puis Node exécute le .js
npx tsc bonjour.ts     # produit bonjour.js
node bonjour.js

# Workflow 2 — tsx : compile en mémoire ET exécute en une étape
npx tsx bonjour.ts
```

Différence essentielle entre les deux binaires :

| | `tsc` | `tsx` |
|---|---|---|
| Rôle | compilateur officiel | exécuteur rapide |
| Vérifie les types | **oui** | **non** (transpile seulement) |
| Produit des `.js` | oui (sur disque) | non (mémoire) |
| Usage typique | build, CI/CD, `--noEmit` | développement, scripts, watch |
| Vitesse | plus lent (analyse complète) | très rapide |

Conséquence pratique : `tsx` va vite mais **ne t'arrête pas** sur une erreur de type. On garde donc toujours une vérification `tsc --noEmit` à côté (script `typecheck`, hook CI). `tsx` pour itérer, `tsc` pour garantir.

### 2.5 `tsconfig.json` de base

Plutôt que de compiler fichier par fichier, on configure un **projet**. `npx tsc --init` génère un `tsconfig.json` très commenté ; voici une version minimale et saine :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- **target** — version de JS générée. `ES2022` est un bon défaut moderne (Node 18+ le supporte nativement).
- **module / moduleResolution** — système de modules. `NodeNext` s'adapte au champ `"type"` du `package.json` (CommonJS ou ESM) ; c'est le choix recommandé côté Node.
- **strict** — active toutes les vérifications strictes (voir 2.7). Non négociable.
- **outDir / rootDir** — sépare sources (`src/`) et sortie compilée (`dist/`).
- **skipLibCheck** — ne re-vérifie pas les `.d.ts` des dépendances (build plus rapide).

Une fois configuré, `npx tsc` (sans argument) compile tout le projet selon `include`.

### 2.6 Type erasure — les types disparaissent au runtime

Concept fondamental : **les types n'existent qu'à la compilation**. Le JS généré ne contient plus aucune annotation. Analogie : les **échafaudages** servent à construire le bâtiment, puis on les retire — le bâtiment tient seul.

```typescript
// entree.ts
interface Utilisateur {
  nom: string;
  age: number;
}
const u: Utilisateur = { nom: "Alice", age: 30 };
console.log(u.nom);
```

Après `tsc`, le `.js` généré :

```javascript
// entree.js — les types ont TOTALEMENT disparu
"use strict";
const u = { nom: "Alice", age: 30 };
console.log(u.nom);
```

L'`interface`, les `: string`, le `: Utilisateur` : tout est effacé. Conséquence pratique importante — on **ne peut pas** tester un type au runtime :

```typescript
// ✖ Impossible : 'Utilisateur' n'existe plus à l'exécution
// if (valeur instanceof Utilisateur) { ... }

// ✔ On teste une propriété discriminante réelle qui, elle, survit au runtime
function estUtilisateur(v: unknown): v is Utilisateur {
  return typeof v === "object" && v !== null && "nom" in v;
}
```

### 2.7 Le mode strict

`"strict": true` est un raccourci qui active en bloc une famille de vérifications :

```jsonc
{
  "compilerOptions": {
    "strict": true
    // équivaut, entre autres, à :
    // "noImplicitAny": true          — interdit les paramètres au type 'any' implicite
    // "strictNullChecks": true       — null et undefined ne sont plus assignables partout
    // "strictFunctionTypes": true    — vérifie la compatibilité des types de fonctions
    // "useUnknownInCatchVariables": true — catch(e) est unknown, pas any
    // ...
  }
}
```

Ce que ça change, concrètement :

```typescript
// SANS strict — dangereux
function doubler(v) {        // v est 'any' implicite : aucune vérification
  return v * 2;
}
doubler("hello");            // NaN au runtime, zéro erreur à la compilation

// AVEC strict — sûr
function doublerStrict(v: number): number {
  return v * 2;
}
doublerStrict("hello");      // ✖ erreur de compilation

function longueur(texte: string | null): number {
  if (texte === null) return 0;   // strictNullChecks force à gérer le cas null
  return texte.length;
}
```

Règle d'or : **toujours** `"strict": true` sur un nouveau projet. C'est la ceinture de sécurité — contraignante quand tout va bien, salvatrice le jour du crash. Désactiver strict, c'est débrancher l'alarme incendie parce qu'elle fait du bruit.

### 2.8 Où TypeScript s'intègre

TypeScript ne s'exécute jamais tel quel : il est **toujours** transformé en JS avant de tourner. Selon le contexte, l'outil qui fait cette transformation change :

- **Node.js (backend, scripts)** — `tsc` pour builder vers `dist/`, ou `tsx` pour exécuter directement en dev. Node 22.6+ sait aussi *strip* les types nativement (`--experimental-strip-types`), mais sans vérification.
- **Vite / front (React, Vue)** — Vite transpile le TS via esbuild à la volée (rapide, **sans** vérification de types) ; la vérification passe par `tsc --noEmit` (ou `vue-tsc`) en parallèle et en CI.
- **Build / CI** — `tsc --noEmit` sert de **gate** : la pipeline échoue si un type est cassé, avant même les tests.

Le pattern universel : un outil rapide transpile (esbuild, swc, tsx), et `tsc` vérifie. Les deux rôles sont séparés.

Scripts npm typiques d'un projet Node TS :

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 3. Worked examples

### Exemple 1 — Bootstrapper un projet TypeScript de zéro

Objectif : d'un dossier vide à un `.ts` compilé et exécuté, en mode strict.

```bash
# 1. Dossier + projet npm
mkdir demo-ts && cd demo-ts
npm init -y

# 2. Outillage en devDependency
npm install --save-dev typescript tsx

# 3. Configuration
npx tsc --init      # génère tsconfig.json (on le remplace par la base du 2.5)
mkdir src
```

On remplace `tsconfig.json` par la base du 2.5, puis on écrit le point d'entrée :

```typescript
// src/index.ts
interface Membre {
  id: number;
  nom: string;
  actif: boolean;
}

function decrire(membre: Membre): string {
  const etat = membre.actif ? "actif" : "inactif";
  return `#${membre.id} ${membre.nom} (${etat})`;
}

const alice: Membre = { id: 1, nom: "Alice", actif: true };
console.log(decrire(alice));
```

On l'exécute des deux façons :

```bash
# Dev rapide — exécution directe
npx tsx src/index.ts
# #1 Alice (actif)

# Build — compile vers dist/ puis exécute le JS
npx tsc
node dist/index.js
# #1 Alice (actif)
```

Le mode strict est déjà actif : si on oublie `actif` dans l'objet `alice`, `tsc` refuse de compiler. Étape par étape, on a : installé (1-2), configuré (3 + tsconfig), écrit un type + une fonction typée, puis exécuté en dev **et** en build.

### Exemple 2 — Observer le type erasure et le rôle de chaque outil

On part de ce fichier qui contient une erreur de type volontaire :

```typescript
// src/erasure.ts
interface Prix {
  ht: number;
  tva: number;
}

function ttc(p: Prix): number {
  return p.ht * (1 + p.tva);
}

const facture: Prix = { ht: 100, tva: 0.2 };
console.log(ttc(facture)); // 120

// @ts-expect-error — on documente qu'on force ici une erreur de type
ttc({ ht: "100", tva: 0.2 });
```

Ce qui se passe selon l'outil :

```bash
# tsx : transpile et exécute, IGNORE la vérification de type
npx tsx src/erasure.ts
# 120   (la ligne fautive ne serait un problème qu'au runtime, pas au typage)

# tsc --noEmit : vérifie SANS produire de fichier — c'est le gardien
npx tsc --noEmit
# (avec la directive @ts-expect-error, tsc s'attend justement à l'erreur ;
#  retire cette directive et tsc signale l'incompatibilité string / number)
```

Après un `npx tsc`, on inspecte `dist/erasure.js` : l'`interface Prix`, les `: number`, le `: Prix` ont **tous** disparu. Il ne reste que la fonction `ttc(p)` et le calcul. Morale : `tsx` fait tourner le code vite mais ne protège pas ; `tsc` protège ; au runtime, il n'y a plus que du JavaScript.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `tsx` (ou Vite) vérifie les types

`tsx`, esbuild et swc **transpilent** : ils enlèvent les types sans les vérifier. Un fichier truffé d'erreurs de type peut très bien s'exécuter via `tsx`.

```bash
npx tsx app.ts      # ✔ tourne, même avec des erreurs de type dedans
npx tsc --noEmit    # ← la SEULE commande qui garantit l'absence d'erreur de type
```

**Correct :** toujours doubler l'exécution rapide d'un `typecheck` (`tsc --noEmit`) en local et en CI.

### PIÈGE #2 — Croire que les types existent au runtime

Les types sont effacés à la compilation (type erasure). On ne peut ni faire `instanceof` sur une `interface`, ni tester `typeof MonType`.

```typescript
interface Chat { ronronne: boolean; }

// ✖ 'Chat' only refers to a type, but is being used as a value here
// if (x instanceof Chat) { ... }

// ✔ tester une propriété qui existe réellement à l'exécution
function estChat(x: object): x is Chat {
  return "ronronne" in x;
}
```

**Correct :** pour discriminer au runtime, s'appuyer sur des **valeurs** réelles (propriété présente, champ discriminant `type: "chat"`), pas sur les types.

### PIÈGE #3 — Confondre `tsc` et `tsx`

Ce ne sont pas deux orthographes du même outil. `tsc` = *compiler* (vérifie + émet du `.js`). `tsx` = *execute* (transpile + lance). Les confondre mène à croire qu'on a un build sûr alors qu'on n'a qu'une exécution rapide.

**Correct :** `tsx` pour itérer en dev, `tsc` pour builder et vérifier.

### PIÈGE #4 — Démarrer sans `"strict": true`

Un `tsconfig` sans strict laisse passer les `any` implicites et ignore `null` / `undefined` — on perd l'essentiel de la valeur de TypeScript tout en se croyant « protégé ».

```jsonc
// ❌ faux sentiment de sécurité
{ "compilerOptions": { "strict": false } }

// ✅ vraie protection
{ "compilerOptions": { "strict": true } }
```

**Correct :** activer `strict` dès la création du projet. L'activer plus tard sur un gros projet fait exploser le nombre d'erreurs d'un coup.

### PIÈGE #5 — Oublier que `.ts` ne s'exécute nulle part directement

Ni le navigateur ni (par défaut) Node ne lancent un `.ts` brut. Il faut toujours une étape de transformation (`tsc`, `tsx`, Vite, esbuild).

**Correct :** en dev on passe par `tsx` / Vite ; en prod on **build** en `.js` (`tsc`) et on lance le `.js` avec Node, ou on sert le bundle.

---

## 5. Ancrage TribuZen

Ce cours construit progressivement le **typage du projet TribuZen** (réseau familial privé). Dès ce module d'intro, on pose la pierre angulaire : un fichier `tribuzen/types/index.ts` qui sera la **source unique de vérité** des types métier. Tous les autres cours (React, NestJS, PostgreSQL) réutiliseront ces mêmes types.

Les quatre entités centrales, qu'on enrichira au fil du cours :

```typescript
// tribuzen/types/index.ts — squelette posé maintenant, complété module après module
export interface Family {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "child";
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO 8601
}

export interface Invitation {
  id: string;
  familyId: string;
  email: string;
  status: "pending" | "accepted" | "expired";
}
```

Pourquoi une source unique : un `Member` doit avoir **exactement** la même forme dans le formulaire React, dans l'API NestJS et dans la ligne PostgreSQL. Un seul fichier de types évite les divergences (le front croit `role: string`, le back attend `role: "admin" | ...`). Chaque module suivant viendra typer une couche réelle de TribuZen en important depuis ce fichier.

Fichier cible dans le repo `smaurier/tribuzen` :

```
tribuzen/
  types/
    index.ts      # Family, Member, Post, Invitation — source unique de vérité
  tsconfig.json   # strict: true, target ES2022, NodeNext
```

---

## 6. Points clés

1. TypeScript est un **surensemble** de JavaScript : il ajoute un typage **statique** (vérifié à la compilation) sans changer le fondamental du langage.
2. Trois bénéfices : détection de bugs au compile-time, autocomplétion, documentation vivante toujours à jour.
3. On installe `typescript` (fournit `tsc`) et `tsx` en **devDependency**, on les lance via `npx` ou des scripts npm.
4. `tsc` **compile et vérifie** les types ; `tsx` **transpile et exécute** sans vérifier — les deux rôles sont complémentaires.
5. Un `tsconfig.json` de base : `target ES2022`, `module NodeNext`, `outDir` / `rootDir`, et surtout `"strict": true`.
6. **Type erasure** : les types disparaissent totalement du JS généré — impossible de les tester au runtime.
7. `"strict": true` active en bloc `noImplicitAny`, `strictNullChecks`, etc. : à activer dès le départ, toujours.
8. TypeScript ne s'exécute jamais seul : Node (`tsc` / `tsx`), Vite/esbuild côté front transpilent, et `tsc --noEmit` sert de garde-fou en CI.

---

## 7. Seeds Anki

```
Qu'est-ce que TypeScript par rapport à JavaScript ?|Un surensemble de JS qui ajoute un typage statique vérifié à la compilation. Tout JS valide est du TS valide ; TS ajoute une couche de types + un compilateur (tsc) qui la vérifie.
Quelle est la différence entre tsc et tsx ?|tsc = compilateur officiel : vérifie les types ET produit du .js. tsx = exécuteur : transpile en mémoire et lance directement, SANS vérifier les types. tsc pour builder/CI, tsx pour itérer en dev.
Qu'est-ce que le type erasure en TypeScript ?|Les types n'existent qu'à la compilation ; le .js généré ne contient plus aucune annotation ni interface. Conséquence : on ne peut pas tester un type au runtime (pas d'instanceof sur une interface).
Que fait la commande tsc --noEmit ?|Elle vérifie les types de tout le projet sans générer de fichiers .js. C'est le garde-fou utilisé en local (script typecheck) et en CI pour bloquer un build si un type est cassé.
Que fait "strict": true dans tsconfig.json et pourquoi l'activer ?|Il active en bloc noImplicitAny, strictNullChecks, strictFunctionTypes, etc. À activer dès la création du projet : sans lui, les any implicites et les null passent, on perd l'essentiel de la valeur de TS.
Pourquoi un fichier .ts ne s'exécute-t-il pas directement dans Node ou le navigateur ?|Parce que ni l'un ni l'autre ne comprennent nativement les annotations de type. Il faut d'abord transformer le TS en JS via tsc (build), tsx (dev), Vite ou esbuild.
Quelles options mettre dans un tsconfig.json de base pour Node ?|target ES2022, module NodeNext, moduleResolution NodeNext, strict true, outDir/rootDir séparés, esModuleInterop et skipLibCheck. include src, exclude node_modules/dist.
Comment TypeScript s'intègre-t-il côté front avec Vite ?|Vite transpile le TS via esbuild à la volée, rapidement mais SANS vérifier les types. La vérification passe par tsc --noEmit (ou vue-tsc) lancé en parallèle et en CI.
```
