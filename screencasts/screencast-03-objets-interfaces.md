# Screencast 03 — Objets, interfaces et typage structurel

## Informations
- **Duree estimee** : 15-18 min
- **Module** : `modules/03-objets-interfaces.md`
- **Lab associe** : Lab 03
- **Prerequis** : Screencast 02 (fonctions)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal integre ouvert
- [ ] Fichier `src/03-objets.ts` pret a etre cree
- [ ] Parametres strict actifs dans `tsconfig.json`

## Script

### [00:00-03:30] Types objets et interfaces de base

> Dans ce screencast, nous allons explorer la facon dont TypeScript gere les objets. Nous verrons la difference entre `interface` et `type`, le typage structurel, l'extension et le declaration merging.

**Action** : Creer le fichier `src/03-objets.ts`.

```typescript
// Type objet inline
const user: { name: string; age: number } = {
  name: "Alice",
  age: 30,
};

// Interface nommee
interface User {
  name: string;
  age: number;
  email?: string;          // propriete optionnelle
  readonly id: string;     // propriete en lecture seule
}

const alice: User = {
  id: "u-001",
  name: "Alice",
  age: 30,
};

// alice.id = "u-002"; // Erreur : readonly

// Type alias pour un objet
type Product = {
  name: string;
  price: number;
  inStock: boolean;
};

const laptop: Product = {
  name: "MacBook Pro",
  price: 2499,
  inStock: true,
};
```

**Action** : Montrer l'erreur sur la tentative de modification de `readonly id`.

> Les interfaces et les type alias permettent tous deux de definir des formes d'objets. La propriete optionnelle `?` indique qu'elle peut etre absente, et `readonly` empeche la modification apres creation.

### [03:30-07:30] Interface vs type : differences cles

> Alors, quand utiliser `interface` et quand utiliser `type` ? Voyons les differences concretes.

**Action** : Ajouter le code suivant.

```typescript
// 1. Extension : les deux supportent l'extension, mais differemment

// Interface : extends
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type : intersection &
type AnimalType = {
  name: string;
};
type DogType = AnimalType & {
  breed: string;
};

// 2. Declaration merging : UNIQUEMENT les interfaces
interface Config {
  host: string;
}
interface Config {
  port: number;
}
// Config a maintenant { host: string; port: number }

const config: Config = {
  host: "localhost",
  port: 3000,
};

// Avec type, c'est une erreur :
// type Settings = { theme: string };
// type Settings = { lang: string }; // Erreur : identifiant duplique

// 3. Les types peuvent faire des choses que les interfaces ne peuvent pas
type StringOrNumber = string | number;     // union
type Pair = [string, number];              // tuple
type Callback = () => void;               // fonction

// 4. Les interfaces ont de meilleurs messages d'erreur
// et sont plus performantes pour la verification de types
```

**Action** : Montrer le declaration merging en survolant `Config` pour voir les deux proprietes fusionnees.

> Regle pratique : utilisez `interface` pour les formes d'objets et l'API publique. Utilisez `type` pour les unions, les tuples, et les types composes. Le declaration merging est une fonctionnalite unique aux interfaces, utile pour augmenter des types existants.

### [07:30-11:30] Typage structurel (structural typing)

> TypeScript utilise un typage structurel, aussi appele "duck typing". Ce qui compte, c'est la forme, pas le nom.

**Action** : Ajouter le code suivant.

```typescript
// Typage structurel : la forme compte, pas le nom
interface Point2D {
  x: number;
  y: number;
}

interface Coordinate {
  x: number;
  y: number;
}

const point: Point2D = { x: 10, y: 20 };
const coord: Coordinate = point; // OK ! Meme forme = compatible

// Ca marche aussi avec des types qui ont plus de proprietes
interface Point3D {
  x: number;
  y: number;
  z: number;
}

const point3d: Point3D = { x: 1, y: 2, z: 3 };
const point2d: Point2D = point3d; // OK — Point3D a tout ce que Point2D demande

// Attention : l'exces de proprietes est detecte sur les litteraux
// const badPoint: Point2D = { x: 1, y: 2, z: 3 }; // Erreur !
// Mais pas quand on passe par une variable intermediaire

function printPoint(p: Point2D): void {
  console.log(`(${p.x}, ${p.y})`);
}

printPoint(point3d); // OK — Point3D est compatible avec Point2D
printPoint({ x: 5, y: 10 }); // OK
// printPoint({ x: 5, y: 10, z: 15 }); // Erreur sur un litteral !
```

**Action** : Decommenter `badPoint` pour montrer l'erreur d'exces de proprietes, puis montrer que ca passe via une variable.

> Le typage structurel est fondamentalement different du typage nominal (comme en Java ou C#). Deux types avec la meme forme sont compatibles, meme s'ils ont des noms differents. L'exces de proprietes n'est verifie que sur les litteraux d'objets directs.

### [11:30-15:00] Index signatures et types utilitaires de base

> Parfois on ne connait pas toutes les cles a l'avance. Les index signatures resolvent ce probleme.

**Action** : Ajouter le code suivant.

```typescript
// Index signature
interface Dictionary {
  [key: string]: string;
}

const translations: Dictionary = {
  hello: "bonjour",
  goodbye: "au revoir",
  // On peut ajouter n'importe quelle cle string
};

translations["thanks"] = "merci"; // OK

// Combiner proprietes connues et index signature
interface Config2 {
  name: string;
  version: number;
  [key: string]: string | number; // doit englober les types ci-dessus
}

// Record : un raccourci pour les index signatures
type HttpHeaders = Record<string, string>;

const headers: HttpHeaders = {
  "Content-Type": "application/json",
  "Authorization": "Bearer token123",
};

// Interfaces imbriquees
interface Company {
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  employees: User[]; // tableau de User
}

const acme: Company = {
  name: "Acme Corp",
  address: {
    street: "42 rue de TypeScript",
    city: "Paris",
    country: "France",
  },
  employees: [alice],
};
```

**Action** : Montrer l'autocompletion sur `acme.address.` pour afficher les proprietes imbriquees.

### [15:00-17:30] Extension avancee et recapitulatif

> Terminons avec quelques patterns d'extension avances.

```typescript
// Extension multiple
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeletable {
  deletedAt: Date | null;
}

interface AuditedUser extends User, Timestamped, SoftDeletable {
  lastLogin: Date;
}

// Equivalent avec type et intersection
type AuditedUserType = User & Timestamped & SoftDeletable & {
  lastLogin: Date;
};

// Interface generique (apercu)
interface Repository<T> {
  findById(id: string): T | null;
  save(entity: T): void;
  delete(id: string): void;
}
```

> En resume : les interfaces definissent des contrats pour les objets, le typage structurel compare les formes et non les noms, et `interface` est prefere pour les API publiques tandis que `type` excelle pour les compositions complexes. Dans le prochain screencast, nous verrons comment le narrowing permet de travailler en securite avec les types union.

## Points d'attention pour l'enregistrement
- Insister sur le typage structurel — c'est souvent une surprise pour les developpeurs venant de Java/C#
- Bien montrer le declaration merging visuellement dans VS Code
- L'exces de proprietes sur les litteraux est un piege frequent : prendre le temps de l'expliquer
- Montrer l'autocompletion VS Code pour illustrer l'interet du typage
- Executer au moins un exemple complet avec `npx tsx` pour ancrer la theorie
