# Screencast 01 — Types primitifs, inference et literal types

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/01-types-primitifs.md`
- **Lab associe** : Lab 01
- **Prérequis** : Screencast 00 (environnement installe)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/01-primitifs.ts` pret a etre créé
- [ ] Extension TypeScript VS Code active (vérifier IntelliSense)

## Script

### [00:00-03:00] Introduction aux types primitifs

> Dans ce screencast, nous allons explorer en profondeur les types primitifs de TypeScript. Nous verrons comment l'inference fonctionne, ce que sont les literal types, et la différence cruciale entre `any` et `unknown`.

**Action** : Créer le fichier `src/01-primitifs.ts`.

```typescript
// Les types primitifs de TypeScript

// string
const firstName: string = "Alice";
let lastName: string = "Dupont";

// number (pas de distinction int/float)
const age: number = 30;
const price: number = 19.99;
const hex: number = 0xff;

// boolean
const isActive: boolean = true;

// bigint
const bigNumber: bigint = 9007199254740991n;

// symbol
const uniqueKey: symbol = Symbol("cle");
```

> TypeScript reprend les types primitifs de JavaScript : `string`, `number`, `boolean`, `bigint` et `symbol`. Notez qu'il n'y a pas de distinction entre entier et flottant — tout est `number`.

**Action** : Survoler chaque variable pour montrer le type infere par VS Code.

### [03:00-07:00] Inference de type

> TypeScript est intelligent : il n'est pas toujours nécessaire d'annoter les types explicitement. L'inference de type fait le travail pour nous.

**Action** : Ajouter du code au fichier.

```typescript
// Inference de type — TypeScript deduit le type automatiquement
let city = "Paris";          // infere comme string
let count = 42;              // infere comme number
let isValid = true;          // infere comme boolean

// Attention : const vs let change l'inference
const fixedCity = "Paris";   // infere comme "Paris" (literal type !)
let flexCity = "Paris";      // infere comme string
```

**Action** : Survoler `fixedCity` pour montrer le type literal `"Paris"`, puis survoler `flexCity` pour montrer le type `string`.

> C'est un point fondamental : avec `const`, TypeScript infere un type literal car la valeur ne changera jamais. Avec `let`, il infere le type général car la variable peut etre reassignee.

> En pratique, la regle est simple : annotez les types quand l'inference ne suffit pas, ou quand vous voulez documenter une intention. Sinon, laissez TypeScript inferer.

### [07:00-11:00] Literal types et unions

> Les literal types sont des types qui representent une seule valeur précisé.

**Action** : Créer un nouveau bloc de code.

```typescript
// Literal types explicites
type Direction = "nord" | "sud" | "est" | "ouest";
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
type Toggle = true | false;

let direction: Direction = "nord";
direction = "est";      // OK
// direction = "haut";  // Erreur : "haut" n'est pas dans Direction

let dice: DiceRoll = 3;
// dice = 7;            // Erreur : 7 n'est pas dans DiceRoll

// Combinaison avec des types classiques
type Id = string | number;

let userId: Id = "abc-123";
userId = 42;            // OK — number est accepte
// userId = true;       // Erreur — boolean pas dans Id
```

**Action** : Decommenter les lignes d'erreur une par une pour montrer les messages d'erreur.

> Les literal types combines avec les unions (`|`) forment un outil très puissant. On peut définir exactement quelles valeurs sont acceptees. C'est comme un enum, mais plus flexible.

### [11:00-14:30] null, undefined, any et unknown

> Parlons maintenant des types speciaux : `null`, `undefined`, `any` et `unknown`.

**Action** : Ajouter un nouveau bloc.

```typescript
// null et undefined
let absent: null = null;
let missing: undefined = undefined;

// Avec strictNullChecks (active par defaut en mode strict)
let name2: string = "Bob";
// name2 = null;        // Erreur ! string n'accepte pas null
let name3: string | null = "Bob";
name3 = null;           // OK — explicitement autorise

// any — le type "je m'en fiche" (a eviter !)
let anything: any = 42;
anything = "texte";     // OK
anything = true;        // OK
anything.methodeInexistante(); // Pas d'erreur a la compilation !

// unknown — le type "je ne sais pas encore" (sur et preferable)
let mystery: unknown = 42;
mystery = "texte";      // OK — on peut assigner n'importe quoi

// Mais on ne peut PAS utiliser unknown directement
// let len = mystery.length; // Erreur !

// Il faut d'abord verifier le type (narrowing)
if (typeof mystery === "string") {
  console.log(mystery.length); // OK — TypeScript sait que c'est un string
}
```

**Action** : Montrer que `any` ne généré aucune erreur même avec du code invalide, tandis que `unknown` oblige a vérifier le type.

> La regle d'or : n'utilisez jamais `any` sauf en dernier recours. Preferez `unknown` quand vous ne connaissez pas le type — cela vous force a vérifier avant d'utiliser la valeur, ce qui evite les bugs.

### [14:30-17:00] void, never et récapitulatif

> Terminons avec deux types de retour de fonction : `void` et `never`.

```typescript
// void — la fonction ne retourne rien
function logMessage(msg: string): void {
  console.log(msg);
  // pas de return explicite
}

// never — la fonction ne termine jamais
function throwError(msg: string): never {
  throw new Error(msg);
}

function infiniteLoop(): never {
  while (true) {
    // boucle infinie
  }
}
```

> `void` signifie que la fonction ne retourne pas de valeur utile. `never` signifie que la fonction ne retourne jamais — soit elle lance une exception, soit elle boucle indefiniment. Nous reverrons `never` en detail quand nous parlerons du narrowing exhaustif.

**Action** : Recapituler en survolant les différents types dans le fichier.

> En résumé : TypeScript offre des types primitifs riches, une inference intelligente, des literal types pour la précision, et la distinction `any` vs `unknown` pour la sécurité. Maitrisez ces bases et le reste du cours sera beaucoup plus fluide.

## Points d'attention pour l'enregistrement
- Bien montrer l'inference en survolant chaque variable dans VS Code
- Prendre le temps sur la différence `const` vs `let` pour l'inference des literal types
- Insister visuellement sur la différence entre `any` (dangereux) et `unknown` (sur)
- Decommenter les erreurs progressivement pour montrer les messages un par un
- Garder un rythme calme sur les unions de literal types — c'est un concept nouveau pour beaucoup
