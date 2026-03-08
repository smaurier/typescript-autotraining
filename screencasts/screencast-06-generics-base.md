# Screencast 06 — Generics : fonctions, classes et contraintes

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/06-generics-base.md`
- **Lab associe** : Lab 06
- **Prerequis** : Screencast 05 (classes)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/06-generics.ts` pret a etre cree
- [ ] `tsx` installe pour executer les exemples

## Script

### [00:00-04:00] Pourquoi les generics ?

> Les generics sont l'un des mecanismes les plus puissants de TypeScript. Ils permettent de creer du code reutilisable sans sacrifier la securite des types. Commencons par comprendre le probleme qu'ils resolvent.

**Action** : Creer le fichier `src/06-generics.ts`.

```typescript
// Probleme : comment ecrire une fonction "identite" typee ?

// Option 1 : any — on perd toute information de type
function identityAny(value: any): any {
  return value;
}
const resultAny = identityAny("hello"); // type: any — pas utile

// Option 2 : surcharges — fastidieux et non extensible
function identityOverload(value: string): string;
function identityOverload(value: number): number;
function identityOverload(value: string | number): string | number {
  return value;
}

// Option 3 : generics — la bonne solution
function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");    // type: string
const num = identity(42);         // type: number
const bool = identity(true);      // type: boolean

// On peut aussi specifier le type explicitement
const explicit = identity<string>("hello"); // type: string
```

**Action** : Survoler `str`, `num`, `bool` pour montrer que chacun a le bon type infere.

> Le parametre de type `T` est comme un placeholder. Quand on appelle `identity("hello")`, TypeScript remplace `T` par `string`. On obtient une fonction typee qui fonctionne pour tout type, sans utiliser `any`.

### [04:00-08:30] Fonctions generiques avancees

> Les generics deviennent encore plus utiles avec plusieurs parametres de type et des contraintes.

**Action** : Ajouter le code suivant.

```typescript
// Plusieurs parametres de type
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

const p1 = pair("hello", 42);      // type: [string, number]
const p2 = pair(true, [1, 2, 3]);  // type: [boolean, number[]]

// Fonction utilitaire : premier element d'un tableau
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstNum = first([10, 20, 30]);     // type: number | undefined
const firstStr = first(["a", "b", "c"]);  // type: string | undefined

// Map generique sur un tableau
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

const lengths = mapArray(["hello", "world"], (s) => s.length);
// type: number[]
console.log(lengths); // [5, 5]

const doubled = mapArray([1, 2, 3], (n) => n * 2);
// type: number[]
console.log(doubled); // [2, 4, 6]
```

**Action** : Montrer l'inference contextuelle dans le callback de `mapArray` — `s` est infere comme `string`.

> Remarquez que dans `mapArray`, le callback `fn` recoit automatiquement le bon type pour son parametre. TypeScript propage les generics a travers les arguments.

### [08:30-13:00] Contraintes avec extends

> Parfois on veut restreindre les types acceptes par un generic. C'est le role de `extends`.

**Action** : Ajouter le code suivant.

```typescript
// Contrainte : T doit avoir une propriete length
function logLength<T extends { length: number }>(item: T): T {
  console.log(`Longueur : ${item.length}`);
  return item;
}

logLength("hello");        // OK — string a length
logLength([1, 2, 3]);      // OK — array a length
logLength({ length: 10 }); // OK — l'objet a length
// logLength(42);           // Erreur — number n'a pas length

// keyof avec generics
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30, email: "alice@example.com" };

const name2 = getProperty(user, "name");   // type: string
const age = getProperty(user, "age");      // type: number
// getProperty(user, "phone");             // Erreur : "phone" n'est pas une cle de user

// Contrainte avec interface
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

interface User {
  id: string;
  name: string;
}

interface Product {
  id: string;
  price: number;
}

const users: User[] = [
  { id: "u-1", name: "Alice" },
  { id: "u-2", name: "Bob" },
];

const found = findById(users, "u-1"); // type: User | undefined
console.log(found?.name); // "Alice"
```

**Action** : Decommenter l'appel avec `42` pour montrer l'erreur de contrainte. Montrer l'autocompletion sur le deuxieme argument de `getProperty`.

> `extends` dans un generic signifie "doit etre au moins". C'est une contrainte, pas un heritage. La combinaison `keyof T` avec une contrainte garantit que seules les cles valides d'un objet sont acceptees.

### [13:00-17:00] Classes et interfaces generiques

> Les generics s'appliquent aussi aux classes et interfaces.

**Action** : Ajouter le code suivant.

```typescript
// Classe generique : une pile (stack) typee
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);
console.log(numberStack.pop()); // 3 — type: number | undefined

const stringStack = new Stack<string>();
stringStack.push("hello");
// stringStack.push(42); // Erreur — number n'est pas string

// Interface generique
interface Repository<T extends HasId> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implementation
class InMemoryRepository<T extends HasId> implements Repository<T> {
  private store = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.store.values());
  }

  async save(entity: T): Promise<T> {
    this.store.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

// Utilisation typee
const userRepo = new InMemoryRepository<User>();
// userRepo.save({ price: 10 }); // Erreur — pas un User
```

**Action** : Montrer l'autocompletion sur `userRepo.save()` — le parametre est type `User`.

### [17:00-19:30] Valeurs par defaut et recapitulatif

> Les parametres de type peuvent avoir des valeurs par defaut.

```typescript
// Valeur par defaut pour un parametre de type
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

// Sans specifier T — data est unknown
const response1: ApiResponse = {
  data: "quelque chose",
  status: 200,
  message: "OK",
};

// En specifiant T — data est User
const response2: ApiResponse<User> = {
  data: { id: "u-1", name: "Alice" },
  status: 200,
  message: "OK",
};

// Generics avec plusieurs contraintes par defaut
interface PaginatedResponse<T = unknown, M = Record<string, unknown>> {
  items: T[];
  total: number;
  page: number;
  meta: M;
}
```

> En resume : les generics permettent de creer du code reutilisable et type. Les contraintes avec `extends` garantissent un minimum de structure. La combinaison avec `keyof` rend les acces aux proprietes totalement surs. Dans le prochain screencast, nous irons plus loin avec les generics avances.

## Points d'attention pour l'enregistrement
- Commencer par le probleme (`any` vs surcharges) pour motiver les generics
- Toujours survoler les variables pour montrer les types inferes
- L'exemple `getProperty` avec `keyof` est un classique — prendre le temps de bien l'expliquer
- Executer le `Stack` et le `Repository` pour montrer le comportement a l'execution
- Faire la transition vers le screencast suivant sur les generics avances
