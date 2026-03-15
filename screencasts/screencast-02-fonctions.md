# Screencast 02 — Fonctions : signatures, surcharges et predicats de type

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/02-fonctions.md`
- **Lab associe** : Lab 02
- **Prérequis** : Screencast 01 (types primitifs)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/02-fonctions.ts` pret a etre créé
- [ ] `tsx` installe pour exécuter les exemples

## Script

### [00:00-03:30] Signatures de fonctions

> Les fonctions sont au coeur de tout programme TypeScript. Dans ce screencast, nous allons voir comment typer les paramètres, les retours, et gérer les cas avances comme les surcharges et les predicats de type.

**Action** : Créer le fichier `src/02-fonctions.ts`.

```typescript
// Signature de base : parametres types et retour type
function add(a: number, b: number): number {
  return a + b;
}

// Le type de retour peut etre infere
function multiply(a: number, b: number) {
  return a * b; // TypeScript infere : number
}

// Parametres optionnels avec ?
function greet(name: string, title?: string): string {
  if (title) {
    return `Bonjour, ${title} ${name}`;
  }
  return `Bonjour, ${name}`;
}

console.log(greet("Alice"));            // "Bonjour, Alice"
console.log(greet("Alice", "Dr."));     // "Bonjour, Dr. Alice"

// Parametres par defaut
function createUser(name: string, role: string = "user"): { name: string; role: string } {
  return { name, role };
}

// Rest parameters
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

console.log(sum(1, 2, 3, 4)); // 10
```

**Action** : Survoler la fonction `multiply` pour montrer que TypeScript infere le type de retour.

> Bonne pratique : annotez toujours le type de retour des fonctions exportees. Pour les fonctions locales, l'inference suffit souvent.

### [03:30-07:30] Types de fonctions et callbacks

> On peut aussi typer les fonctions elles-memes, ce qui est utile pour les callbacks.

**Action** : Ajouter le code suivant.

```typescript
// Type d'une fonction
type MathOperation = (a: number, b: number) => number;

const subtract: MathOperation = (a, b) => a - b;
const divide: MathOperation = (a, b) => a / b;

// Callback type
function applyOperation(x: number, y: number, op: MathOperation): number {
  return op(x, y);
}

console.log(applyOperation(10, 3, subtract)); // 7
console.log(applyOperation(10, 3, divide));   // 3.333...

// Callback avec signature inline
function fetchData(url: string, onSuccess: (data: string) => void, onError: (error: Error) => void): void {
  try {
    const data = `Donnees de ${url}`;
    onSuccess(data);
  } catch (e) {
    onError(e as Error);
  }
}

// Utilisation avec des fonctions flechees
fetchData(
  "https://api.example.com",
  (data) => console.log("Recu :", data),
  (error) => console.error("Erreur :", error.message)
);
```

**Action** : Montrer que dans les callbacks, les types des paramètres sont inferes grace au contexte.

> Quand on passe une fonction en argument, TypeScript infere les types des paramètres depuis la signature attendue. C'est ce qu'on appelle l'inference contextuelle.

### [07:30-11:30] Surcharges de fonctions

> TypeScript permet les surcharges de fonctions — plusieurs signatures pour une même implementation.

**Action** : Ajouter le code suivant.

```typescript
// Surcharges (overloads)
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;
function format(value: string | number | Date): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value.toISOString();
}

console.log(format("hello"));       // "HELLO"
console.log(format(3.14159));        // "3.14"
console.log(format(new Date()));     // ISO string

// Surcharge avec des retours differents
function parse(input: string, asNumber: true): number;
function parse(input: string, asNumber: false): string;
function parse(input: string, asNumber: boolean): number | string {
  if (asNumber) {
    return Number(input);
  }
  return input.trim();
}

const n = parse("42", true);   // type: number
const s = parse(" hi ", false); // type: string
```

**Action** : Survoler `n` et `s` pour montrer que TypeScript choisit le bon type de retour selon la surcharge.

> Les surcharges sont utiles quand le type de retour depend des arguments. La dernière signature (l'implementation) n'est pas visible par l'appelant — seules les surcharges declarees au-dessus comptent.

### [11:30-15:00] Predicats de type (type predicates)

> Les predicats de type permettent de créer des fonctions de vérification qui affinent le type pour TypeScript.

**Action** : Ajouter le code suivant.

```typescript
// Probleme : TypeScript ne sait pas ce que retourne une verification custom
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

// Predicat de type : "animal is Fish"
function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}

function move(animal: Fish | Bird): void {
  if (isFish(animal)) {
    animal.swim(); // TypeScript sait que c'est un Fish ici
  } else {
    animal.fly();  // TypeScript sait que c'est un Bird ici
  }
}

// Autre exemple : validation de donnees
interface User {
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string"
  );
}

// Utilisation
const data: unknown = JSON.parse('{"name": "Alice", "email": "alice@example.com"}');

if (isUser(data)) {
  console.log(data.name);  // OK — TypeScript sait que c'est un User
  console.log(data.email); // OK
}
```

**Action** : Montrer que sans le predicat `is`, TypeScript ne restreindrait pas le type dans le bloc `if`.

> Les predicats de type sont essentiels pour la validation de donnees externes — API, JSON, formulaires. Ils connectent la logique de vérification au système de types.

### [15:00-17:30] Assertion functions et récapitulatif

> Terminons avec les assertion functions, proches des predicats mais qui lancent une erreur au lieu de retourner un boolean.

```typescript
// Assertion function
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Attendu string, recu ${typeof value}`);
  }
}

function processInput(input: unknown): void {
  assertIsString(input);
  // Apres cette ligne, TypeScript sait que input est un string
  console.log(input.toUpperCase());
}

processInput("hello"); // "HELLO"
// processInput(42);   // Lancerait une erreur
```

> En résumé, TypeScript offre un système riche pour typer les fonctions : signatures simples, surcharges pour les cas complexes, predicats pour le narrowing, et assertion functions pour les validations strictes. Maitrisez ces outils et vous pourrez typer n'importe quel callback ou API.

## Points d'attention pour l'enregistrement
- Bien expliquer la différence entre signature de surcharge et signature d'implementation
- Montrer l'inference contextuelle des callbacks en survolant les paramètres
- Prendre le temps sur les predicats de type — c'est souvent un concept nouveau
- Exécuter les exemples avec `npx tsx src/02-fonctions.ts` pour montrer les résultats
- Commenter la raison pour laquelle `any` n'apparait nulle part dans ces exemples
