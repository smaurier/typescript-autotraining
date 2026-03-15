# Screencast 05 — Classes : hiérarchie, abstract et parameter properties

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/05-classes.md`
- **Lab associe** : Lab 05
- **Prérequis** : Screencast 04 (narrowing)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/05-classes.ts` pret a etre créé
- [ ] `tsx` installe pour exécuter les exemples

## Script

### [00:00-03:30] Classes de base en TypeScript

> Les classes en TypeScript ajoutent le typage statique aux classes JavaScript. Nous allons voir les modificateurs d'acces, les propriétés de paramètre, les classes abstraites et l'implementation d'interfaces.

**Action** : Créer le fichier `src/05-classes.ts`.

```typescript
// Classe de base avec modificateurs d'acces
class Person {
  // Proprietes typees
  public name: string;
  private _age: number;
  protected email: string;
  readonly id: string;

  constructor(name: string, age: number, email: string) {
    this.id = crypto.randomUUID();
    this.name = name;
    this._age = age;
    this.email = email;
  }

  // Getter
  get age(): number {
    return this._age;
  }

  // Setter avec validation
  set age(value: number) {
    if (value < 0 || value > 150) {
      throw new Error("Age invalide");
    }
    this._age = value;
  }

  greet(): string {
    return `Bonjour, je suis ${this.name}, ${this._age} ans.`;
  }
}

const alice = new Person("Alice", 30, "alice@example.com");
console.log(alice.greet());
console.log(alice.name);     // OK — public
// console.log(alice._age);  // Erreur — private
// console.log(alice.email); // Erreur — protected
// alice.id = "new-id";      // Erreur — readonly
```

**Action** : Montrer les erreurs de compilation pour `private`, `protected` et `readonly`.

> TypeScript ajoute trois modificateurs d'acces : `public` (par defaut), `private` (accessible seulement dans la classe), et `protected` (accessible dans la classe et ses sous-classes). `readonly` empeche la reassignation après le constructeur.

### [03:30-07:00] Parameter properties et héritage

> TypeScript offre un raccourci elegant pour les propriétés de constructeur.

**Action** : Ajouter le code suivant.

```typescript
// Parameter properties — raccourci pour declarer et assigner
class Product {
  constructor(
    public readonly id: string,
    public name: string,
    private _price: number,
    protected category: string = "general"
  ) {
    // Pas besoin de this.id = id, etc.
    // TypeScript le fait automatiquement avec les modificateurs
  }

  get price(): number {
    return this._price;
  }

  toString(): string {
    return `${this.name} — ${this._price} EUR`;
  }
}

const laptop = new Product("p-001", "MacBook Pro", 2499, "electronique");
console.log(laptop.toString());

// Heritage classique
class Employee extends Person {
  constructor(
    name: string,
    age: number,
    email: string,
    public department: string,
    private salary: number
  ) {
    super(name, age, email);
  }

  // Override de methode
  override greet(): string {
    // email est accessible car protected
    return `${super.greet()} Departement : ${this.department}.`;
  }

  getInfo(): string {
    return `${this.name} - ${this.email} - ${this.department}`;
  }
}

const bob = new Employee("Bob", 35, "bob@company.com", "Engineering", 75000);
console.log(bob.greet());
```

**Action** : Montrer que `email` est accessible dans `Employee` (protected) mais pas depuis l'exterieur.

> Les parameter properties evitent beaucoup de code repetitif. Le mot-clé `override` est optionnel mais recommande — il garantit que la méthode existe bien dans la classe parente.

### [07:00-11:00] Classes abstraites

> Les classes abstraites definissent un contrat que les sous-classes doivent respecter.

**Action** : Ajouter le code suivant.

```typescript
// Classe abstraite — ne peut pas etre instanciee directement
abstract class Shape {
  abstract readonly kind: string;

  // Methode abstraite — doit etre implementee par les sous-classes
  abstract area(): number;
  abstract perimeter(): number;

  // Methode concrete — partagee par toutes les sous-classes
  describe(): string {
    return `${this.kind} — Aire: ${this.area().toFixed(2)}, Perimetre: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  readonly kind = "cercle";

  constructor(public radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  readonly kind = "rectangle";

  constructor(
    public width: number,
    public height: number
  ) {
    super();
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// const shape = new Shape(); // Erreur — classe abstraite

const shapes: Shape[] = [
  new Circle(5),
  new Rectangle(4, 6),
  new Circle(3),
];

for (const shape of shapes) {
  console.log(shape.describe());
}
```

**Action** : Montrer l'erreur quand on tente d'instancier `Shape` directement. Exécuter le code pour voir les descriptions.

> Une classe abstraite peut contenir un melange de méthodes abstraites (a implementer) et de méthodes concretes (partagees). C'est un pattern classique de template method.

### [11:00-15:00] Implements : interfaces et classes

> Les interfaces peuvent servir de contrat qu'une classe doit implementer.

**Action** : Ajouter le code suivant.

```typescript
// Interface comme contrat
interface Serializable {
  serialize(): string;
}

interface Loggable {
  log(): void;
}

// Implementation de plusieurs interfaces
class UserAccount implements Serializable, Loggable {
  constructor(
    public readonly id: string,
    public username: string,
    private password: string
  ) {}

  serialize(): string {
    return JSON.stringify({
      id: this.id,
      username: this.username,
      // password n'est pas serialise — securite
    });
  }

  log(): void {
    console.log(`[UserAccount] ${this.id}: ${this.username}`);
  }

  // Methode privee
  private hashPassword(): string {
    return `hashed_${this.password}`;
  }
}

const account = new UserAccount("u-001", "alice", "secret123");
account.log();
console.log(account.serialize());

// Le type d'une classe peut etre utilise comme interface
class EventEmitter {
  private handlers: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((h) => h(...args));
  }
}

// Utiliser typeof pour obtenir le type d'une instance
function setupLogger(emitter: EventEmitter): void {
  emitter.on("log", (msg: string) => console.log(`[LOG] ${msg}`));
}
```

**Action** : Montrer que `UserAccount` doit implementer toutes les méthodes des deux interfaces.

> `implements` vérifié que la classe respecte le contrat de l'interface. Contrairement a `extends`, une classe peut implementer plusieurs interfaces. Cela favorise la composition sur l'héritage.

### [15:00-17:30] Static, this et récapitulatif

> Terminons avec les membres statiques et le typage de `this`.

```typescript
// Membres statiques
class Counter {
  static count = 0;

  static increment(): void {
    Counter.count++;
  }

  static reset(): void {
    Counter.count = 0;
  }
}

Counter.increment();
Counter.increment();
console.log(Counter.count); // 2

// Pattern fluent avec this
class QueryBuilder {
  private conditions: string[] = [];
  private tableName = "";

  from(table: string): this {
    this.tableName = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  build(): string {
    const where = this.conditions.length
      ? ` WHERE ${this.conditions.join(" AND ")}`
      : "";
    return `SELECT * FROM ${this.tableName}${where}`;
  }
}

const query = new QueryBuilder()
  .from("users")
  .where("age > 18")
  .where("active = true")
  .build();

console.log(query);
// "SELECT * FROM users WHERE age > 18 AND active = true"
```

**Action** : Exécuter le code complet avec `npx tsx src/05-classes.ts`.

> En résumé : les classes TypeScript combinent la puissance de l'orientee objet avec la sécurité du typage statique. Les parameter properties reduisent le boilerplate, les classes abstraites definissent des contrats, et `implements` connecte les classes aux interfaces. Dans le prochain screencast, nous aborderons les generics.

## Points d'attention pour l'enregistrement
- Bien montrer les erreurs de compilation pour chaque modificateur d'acces
- Prendre le temps sur les parameter properties — c'est spécifique a TypeScript
- Le pattern template method avec les classes abstraites merite une explication claire
- Montrer que `implements` ne généré PAS de code JavaScript — c'est purement compile-time
- Exécuter les exemples pour montrer les résultats concrets dans le terminal
