# Screencast 04 — Narrowing et types union

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/04-narrowing.md`
- **Lab associe** : Lab 04
- **Prérequis** : Screencast 03 (objets et interfaces)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/04-narrowing.ts` pret a etre créé
- [ ] Mode strict actif dans `tsconfig.json`

## Script

### [00:00-03:00] Introduction au narrowing

> Le narrowing est un concept central de TypeScript. Quand une variable à un type union, TypeScript peut affiner (narrow) ce type en se basant sur les verifications de votre code. Voyons comment ça fonctionne.

**Action** : Créer le fichier `src/04-narrowing.ts`.

```typescript
// Type union de base
function printValue(value: string | number): void {
  // Ici, value est string | number
  // console.log(value.toUpperCase()); // Erreur ! number n'a pas toUpperCase

  // Narrowing avec typeof
  if (typeof value === "string") {
    // Ici, TypeScript sait que value est string
    console.log(value.toUpperCase());
  } else {
    // Ici, TypeScript sait que value est number
    console.log(value.toFixed(2));
  }
}

printValue("bonjour"); // "BONJOUR"
printValue(3.14159);    // "3.14"

// typeof guards : les types reconnus
function checkType(x: string | number | boolean | object | undefined): void {
  if (typeof x === "string") {
    console.log("string :", x);
  } else if (typeof x === "number") {
    console.log("number :", x);
  } else if (typeof x === "boolean") {
    console.log("boolean :", x);
  } else if (typeof x === "undefined") {
    console.log("undefined");
  } else {
    console.log("object :", x); // ce qui reste
  }
}
```

**Action** : Survoler `value` dans chaque branche du `if` pour montrer comment le type change.

> A chaque vérification, TypeScript restreint le type. C'est ce qu'on appelle le control flow analysis — l'analyse du flux de controle.

### [03:00-07:00] Truthiness, equality et in narrowing

> Il existe plusieurs techniques de narrowing au-dela de `typeof`.

**Action** : Ajouter le code suivant.

```typescript
// Truthiness narrowing
function printName(name: string | null | undefined): void {
  if (name) {
    // Ici, name est string (null et undefined sont falsy)
    console.log(name.toUpperCase());
  } else {
    console.log("Pas de nom fourni");
  }
}

// Attention : "" est aussi falsy — a utiliser avec precaution

// Equality narrowing
function compare(a: string | number, b: string | boolean): void {
  if (a === b) {
    // Le seul type commun est string
    // Ici, a et b sont tous les deux string
    console.log(a.toUpperCase());
    console.log(b.toUpperCase());
  }
}

// "in" narrowing
interface Cat {
  meow(): void;
  purr(): void;
}

interface Dog2 {
  bark(): void;
  fetch(): void;
}

function interact(pet: Cat | Dog2): void {
  if ("meow" in pet) {
    pet.meow(); // TypeScript sait que c'est un Cat
    pet.purr();
  } else {
    pet.bark(); // TypeScript sait que c'est un Dog2
    pet.fetch();
  }
}

// instanceof narrowing
function formatDate(input: string | Date): string {
  if (input instanceof Date) {
    return input.toISOString();
  }
  return new Date(input).toISOString();
}
```

**Action** : Survoler `pet` dans chaque branche du `if ("meow" in pet)` pour voir le type affine.

> Chaque technique a son utilite : `typeof` pour les primitifs, `in` pour les objets avec des propriétés distinctives, `instanceof` pour les classes.

### [07:00-12:00] Discriminated unions

> Les discriminated unions sont le pattern le plus puissant du narrowing TypeScript.

**Action** : Ajouter le code suivant.

```typescript
// Discriminated unions : chaque variante a un champ discriminant commun
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // TypeScript sait que shape est Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // TypeScript sait que shape est Rectangle
      return shape.width * shape.height;
    case "triangle":
      // TypeScript sait que shape est Triangle
      return (shape.base * shape.height) / 2;
  }
}

console.log(area({ kind: "circle", radius: 5 }));          // ~78.54
console.log(area({ kind: "rectangle", width: 4, height: 6 })); // 24
console.log(area({ kind: "triangle", base: 3, height: 8 }));   // 12

// Le champ discriminant peut etre n'importe quel literal
interface ApiSuccess {
  status: "success";
  data: unknown;
}

interface ApiError {
  status: "error";
  message: string;
  code: number;
}

type ApiResponse = ApiSuccess | ApiError;

function handleResponse(response: ApiResponse): void {
  if (response.status === "success") {
    console.log("Donnees recues :", response.data);
  } else {
    console.error(`Erreur ${response.code} : ${response.message}`);
  }
}
```

**Action** : Survoler `shape` dans chaque `case` pour montrer le type affine.

> Le champ `kind` (où `status`, `type`, etc.) est le discriminant. TypeScript utilise sa valeur pour déterminer quelle variante de l'union est en jeu. C'est un pattern extremement courant dans les applications reelles.

### [12:00-15:30] Exhaustive switch et never

> Le vrai pouvoir des discriminated unions apparait avec le controle exhaustif.

**Action** : Ajouter le code suivant.

```typescript
// Exhaustive checking avec never
function getShapeDescription(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `Cercle de rayon ${shape.radius}`;
    case "rectangle":
      return `Rectangle ${shape.width}x${shape.height}`;
    case "triangle":
      return `Triangle base ${shape.base}, hauteur ${shape.height}`;
    default: {
      // Si on arrive ici, shape est de type never
      const _exhaustive: never = shape;
      throw new Error(`Forme inconnue : ${_exhaustive}`);
    }
  }
}

// Ajoutons un nouveau type pour voir l'erreur
interface Pentagon {
  kind: "pentagon";
  sideLength: number;
}

// Si on ajoute Pentagon a Shape sans mettre a jour le switch :
// type Shape = Circle | Rectangle | Triangle | Pentagon;
// -> Erreur sur _exhaustive : Type 'Pentagon' is not assignable to type 'never'
```

**Action** : Decommenter la modification de `Shape` pour ajouter `Pentagon` et montrer l'erreur de compilation.

> La variable `_exhaustive: never` ne peut recevoir aucune valeur. Si on oublie un cas dans le switch, le type residuel n'est pas `never` et TypeScript nous signale l'oubli. C'est une garantie à la compilation que tous les cas sont traites.

### [15:30-17:30] Custom type guards et récapitulatif

> Combinons le narrowing avec les predicats de type vus au screencast précédent.

```typescript
// Type guard custom pour une discriminated union
function isCircle(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}

// Filtrer un tableau grace au narrowing
const shapes: Shape[] = [
  { kind: "circle", radius: 5 },
  { kind: "rectangle", width: 3, height: 4 },
  { kind: "circle", radius: 10 },
  { kind: "triangle", base: 6, height: 3 },
];

// filter avec predicat de type retourne Circle[]
const circles = shapes.filter(isCircle);
console.log(circles); // Seulement les cercles, type Circle[]
```

**Action** : Survoler `circles` pour montrer que le type est bien `Circle[]` et non `Shape[]`.

> En résumé : le narrowing permet a TypeScript de suivre la logique de votre code pour affiner les types. Les discriminated unions avec un switch exhaustif sont le pattern le plus robuste. Utilisez-les pour modeliser les états de votre application — c'est ce qui rend TypeScript veritablement puissant.

## Points d'attention pour l'enregistrement
- Toujours survoler la variable dans chaque branche pour montrer le type affine
- Le pattern exhaustif avec `never` est crucial : prendre le temps de bien l'expliquer
- Montrer l'ajout d'un nouveau cas a l'union pour declencher l'erreur de compilation
- L'exemple `ApiResponse` est très concret — insister sur son usage en contexte réel
- Éviter d'aller trop vite sur les discriminated unions, c'est le coeur du screencast
