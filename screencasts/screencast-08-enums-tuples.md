# Screencast 08 — Enums, tuples et types speciaux

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/08-enums-tuples.md`
- **Lab associe** : Lab 08
- **Prerequis** : Screencast 04 (narrowing)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/08-enums-tuples.ts` pret a etre cree
- [ ] `tsx` installe pour executer les exemples

## Script

### [00:00-04:00] Enums numeriques et string

> Les enums permettent de definir un ensemble de constantes nommees. TypeScript offre des enums numeriques, string, et meme const enums. Voyons les differences et les bonnes pratiques.

**Action** : Creer le fichier `src/08-enums-tuples.ts`.

```typescript
// Enum numerique : chaque membre a une valeur numerique
enum Direction {
  North,    // 0
  South,    // 1
  East,     // 2
  West,     // 3
}

console.log(Direction.North);    // 0
console.log(Direction[0]);       // "North" (reverse mapping)

// Enum avec valeurs explicites
enum HttpStatus {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
}

function handleStatus(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.OK:
      return "Succes";
    case HttpStatus.NotFound:
      return "Ressource introuvable";
    case HttpStatus.InternalServerError:
      return "Erreur serveur";
    default:
      return `Status ${status}`;
  }
}

// Enum string : plus lisible, pas de reverse mapping
enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

function log(level: LogLevel, message: string): void {
  console.log(`[${level}] ${message}`);
}

log(LogLevel.Info, "Application demarree");
log(LogLevel.Error, "Connexion echouee");
```

**Action** : Compiler le code et montrer le JavaScript genere pour voir la difference entre enum numerique et string.

> Les enums string sont generalement preferees car elles sont plus lisibles dans les logs et ne permettent pas le reverse mapping accidentel. Les enums numeriques sont utiles quand la valeur a une signification (comme les codes HTTP).

### [04:00-08:00] Const enums et alternatives

> Les const enums sont une optimisation qui elimine l'objet enum a l'execution.

**Action** : Ajouter le code suivant.

```typescript
// Const enum : efface a la compilation, remplace par les valeurs
const enum Color {
  Red = "#FF0000",
  Green = "#00FF00",
  Blue = "#0000FF",
}

// A la compilation, c'est remplace par :
// const bg = "#FF0000";
const bg = Color.Red;
console.log(bg); // "#FF0000"

// Attention : const enum n'est pas compatible avec isolatedModules
// Alternative recommandee : unions de literal types

// Alternative 1 : union de literal types (recommandee)
type Fruit = "apple" | "banana" | "cherry";

function describeFruit(fruit: Fruit): string {
  switch (fruit) {
    case "apple":  return "Pomme rouge";
    case "banana": return "Banane jaune";
    case "cherry": return "Cerise rouge";
  }
}

// Alternative 2 : objet as const
const ROLES = {
  Admin: "ADMIN",
  User: "USER",
  Guest: "GUEST",
} as const;

type Role = typeof ROLES[keyof typeof ROLES];
// type Role = "ADMIN" | "USER" | "GUEST"

function checkRole(role: Role): boolean {
  return role === ROLES.Admin;
}

// L'objet as const offre :
// - Autocompletion (ROLES.Admin)
// - Type union derive automatiquement
// - Pas de code genere supplementaire
// - Compatible avec isolatedModules
```

**Action** : Survoler `Role` pour montrer le type union derive de l'objet `as const`.

> En pratique, beaucoup de developpeurs TypeScript preferent les unions de literal types ou les objets `as const` aux enums. Ils sont plus simples, ne generent pas de code supplementaire, et s'integrent mieux avec le reste du systeme de types.

### [08:00-12:30] Tuples

> Les tuples sont des tableaux de taille fixe ou chaque element a un type specifique.

**Action** : Ajouter le code suivant.

```typescript
// Tuple de base
const point: [number, number] = [10, 20];
const nameAge: [string, number] = ["Alice", 30];

// Acces type
const x: number = point[0];
const y: number = point[1];
// const z = point[2]; // Erreur : index 2 n'existe pas sur [number, number]

// Destructuring
const [firstName, userAge] = nameAge;
// firstName: string, userAge: number

// Tuples avec labels (TypeScript 4.0+)
type UserTuple = [name: string, age: number, active: boolean];
const user: UserTuple = ["Alice", 30, true];

// Tuples optionnels
type OptionalTuple = [string, number?, boolean?];
const t1: OptionalTuple = ["hello"];
const t2: OptionalTuple = ["hello", 42];
const t3: OptionalTuple = ["hello", 42, true];

// Rest elements dans les tuples
type StringAndNumbers = [string, ...number[]];
const data: StringAndNumbers = ["scores", 90, 85, 92, 88];

// Readonly tuples
const frozen: readonly [string, number] = ["Alice", 30];
// frozen[0] = "Bob"; // Erreur : readonly

// as const cree un tuple readonly
const coords = [48.8566, 2.3522] as const;
// type: readonly [48.8566, 2.3522] — literal types !

// Usage concret : retour de fonction
function useState<T>(initial: T): [T, (newValue: T) => void] {
  let value = initial;
  const setter = (newValue: T) => {
    value = newValue;
    console.log(`Nouvelle valeur : ${value}`);
  };
  return [value, setter];
}

const [count, setCount] = useState(0);
// count: number, setCount: (newValue: number) => void
setCount(5);
```

**Action** : Survoler `coords` pour montrer les literal types du tuple readonly.

> Les tuples sont essentiels en TypeScript. Le pattern `useState` de React les utilise massivement. L'ajout de labels depuis TypeScript 4.0 les rend aussi lisibles que des objets, tout en gardant la syntaxe compacte.

### [12:30-15:30] never, unknown et void en profondeur

> Revenons sur trois types speciaux avec une comprehension plus approfondie.

**Action** : Ajouter le code suivant.

```typescript
// void : absence de valeur de retour
function logMessage(msg: string): void {
  console.log(msg);
  // Un return sans valeur est OK
  // return undefined; // aussi OK
}

// Attention : void dans un callback est different
type Callback = () => void;
const cb: Callback = () => {
  return 42; // Pas d'erreur ! void dans un callback ignore le retour
};
// C'est voulu — forEach callback retourne void mais map pourrait retourner

// never : le type impossible
// - Fonctions qui ne terminent jamais
function fail(message: string): never {
  throw new Error(message);
}

// - Type des cas impossibles (bottom type)
type NeverUnion = string & number; // never — aucune valeur n'est a la fois string et number

// - Filtrage de types
type NonNullable2<T> = T extends null | undefined ? never : T;
type Result = NonNullable2<string | null | undefined>;
// type Result = string

// unknown : le type sur pour les donnees inconnues
function processValue(value: unknown): string {
  // On ne peut rien faire sans narrowing
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

console.log(processValue("hello"));       // "HELLO"
console.log(processValue(42));             // "42"
console.log(processValue(new Date()));     // ISO string
```

**Action** : Montrer que le callback `cb` peut retourner une valeur malgre le type `void`. Expliquer pourquoi c'est intentionnel.

### [15:30-17:30] Recapitulatif et bonnes pratiques

> Faisons un resume des bonnes pratiques.

```typescript
// Bonnes pratiques :
//
// 1. Enums : preferez les unions de literal types ou as const
//    Sauf si vous avez besoin de reverse mapping (enum numerique)
//
// 2. Tuples : utilisez-les pour les retours multiples et les donnees positionnelles
//    Ajoutez des labels pour la lisibilite
//
// 3. never : utilisez-le pour le controle exhaustif (switch/case)
//
// 4. unknown : preferez-le a any pour les donnees externes
//    Forcez le narrowing avant utilisation
//
// 5. void : rappel — dans un type callback, void accepte un retour
//    C'est un choix de design intentionnel de TypeScript
```

> En resume : les enums, tuples et types speciaux sont des outils complementaires. Les enums definissent des ensembles de constantes, les tuples structurent des donnees positionnelles, et `never`/`unknown`/`void` forment le trio des types de controle. Maitrisez-les pour ecrire du TypeScript idiomatique.

## Points d'attention pour l'enregistrement
- Montrer le JavaScript genere pour les enums (via `npx tsc`) pour comprendre le cout
- Bien expliquer le pattern `as const` comme alternative aux enums
- Le comportement de `void` dans les callbacks est surprenant — bien insister dessus
- Executer `useState` pour montrer le destructuring de tuple en action
- Mentionner que `never` sera revu en detail dans le screencast sur les conditional types
