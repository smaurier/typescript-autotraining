# 03 — Objets — Interfaces, Type Aliases & Structural Typing

> **Duree estimee** : 4h00
> **Difficulte** : 2/5
> **Prérequis** : Module 02 (fonctions, callbacks, type predicates)
> **Objectifs** :
> - Définir la **forme** des objets avec des types inline, des interfaces et des type aliases
> - Comprendre la différence entre `interface` et `type` et **quand utiliser quoi**
> - Maîtriser `readonly`, les propriétés optionnelles, et les index signatures
> - Comprendre le **structural typing** (duck typing) de TypeScript
> - Utiliser les **intersections** (`&`) pour composer des types
> - Comprendre l'excess property checking

---

## Types d'objets inline

### Syntaxe de base

On peut définir la forme d'un objet directement dans l'annotation de type :

```typescript
// Type d'objet inline — on decrit la "forme" de l'objet
const utilisateur: { nom: string; age: number; actif: boolean } = {
  nom: "Alice",
  age: 30,
  actif: true,
};

// Parametre de fonction avec type inline
function afficher(personne: { nom: string; age: number }): string {
  return `${personne.nom} a ${personne.age} ans`;
}

afficher({ nom: "Alice", age: 30 }); // OK
afficher({ nom: "Bob", age: 25 });   // OK
// afficher({ nom: "Charlie" });      // Erreur : 'age' manquant
// afficher("Alice");                  // Erreur : string n'est pas un objet
```

### Quand utiliser les types inline

Les types inline sont pratiques pour des **cas simples et ponctuels**. Mais ils deviennent vite illisibles :

```typescript
// Inline — trop long et repetitif
function traiterCommande(
  commande: {
    id: number;
    produits: { nom: string; prix: number; quantite: number }[];
    client: { nom: string; email: string; adresse: { rue: string; ville: string } };
    statut: "en_attente" | "validee" | "expediee" | "livree";
  }
): void {
  // ...
}

// Mieux : utiliser des interfaces ou des type aliases (voir ci-dessous)
```

---

## Interfaces

### Declaration

Une **interface** définit un contrat : la forme que doit avoir un objet.

```typescript
// Declaration d'une interface
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  actif: boolean;
}

// Utilisation
const alice: Utilisateur = {
  id: 1,
  nom: "Alice",
  email: "alice@example.com",
  actif: true,
};

// TypeScript verifie que l'objet respecte l'interface
// const bob: Utilisateur = {
//   id: 2,
//   nom: "Bob",
//   // Erreur : Property 'email' is missing
//   actif: true,
// };

// Utiliser dans les fonctions
function saluer(utilisateur: Utilisateur): string {
  return `Bonjour ${utilisateur.nom} !`;
}
```

### Analogie — Le plan de l'architecte

Une interface, c'est comme un **plan de maison** :

- Le plan dit : "Il faut une cuisine, un salon, et deux chambres"
- Toute maison construite selon ce plan **doit** avoir ces pieces
- La maison peut avoir des pieces en plus (un garage, une cave), mais elle **doit** avoir au minimum ce que le plan exige

```typescript
// Le "plan" de notre objet
interface Maison {
  cuisine: boolean;
  salon: boolean;
  chambres: number;
}

// Cette maison respecte le plan
const maVilla: Maison = {
  cuisine: true,
  salon: true,
  chambres: 4,
};
```

### Proprietes optionnelles

Certaines propriétés peuvent etre optionnelles avec `?` :

```typescript
interface ProfilUtilisateur {
  nom: string;           // Obligatoire
  email: string;         // Obligatoire
  telephone?: string;    // Optionnel — type string | undefined
  bio?: string;          // Optionnel
  avatar?: string;       // Optionnel
}

// Les proprietes optionnelles peuvent etre omises
const profil1: ProfilUtilisateur = {
  nom: "Alice",
  email: "alice@example.com",
};

const profil2: ProfilUtilisateur = {
  nom: "Bob",
  email: "bob@example.com",
  telephone: "+33 6 12 34 56 78",
  bio: "Developpeur TypeScript",
};

// Acceder a une propriete optionnelle — peut etre undefined
function afficherTelephone(profil: ProfilUtilisateur): void {
  if (profil.telephone) {
    console.log(`Tel : ${profil.telephone}`);
  } else {
    console.log("Pas de telephone renseigne");
  }

  // Ou avec optional chaining
  console.log(`Tel : ${profil.telephone ?? "non renseigne"}`);
}
```

### Proprietes readonly

`readonly` empeche la modification d'une propriété après la création :

```typescript
interface Configuration {
  readonly version: string;
  readonly port: number;
  debug: boolean; // Peut etre modifie
}

const config: Configuration = {
  version: "1.0.0",
  port: 3000,
  debug: false,
};

config.debug = true;       // OK — pas readonly
// config.version = "2.0.0"; // Erreur : Cannot assign to 'version' because it is a read-only property
// config.port = 8080;       // Erreur : readonly

// Attention : readonly est superficiel (shallow)
interface Donnees {
  readonly valeurs: number[];
}

const data: Donnees = { valeurs: [1, 2, 3] };
// data.valeurs = [4, 5, 6]; // Erreur : readonly
data.valeurs.push(4);         // OK ! Le tableau lui-meme peut etre modifie
// readonly protege la REFERENCE, pas le CONTENU

// Pour un tableau vraiment immutable, utilise ReadonlyArray
interface DonneesImmutables {
  readonly valeurs: ReadonlyArray<number>;
  // Ou : readonly valeurs: readonly number[];
}

const dataImmut: DonneesImmutables = { valeurs: [1, 2, 3] };
// dataImmut.valeurs.push(4); // Erreur : Property 'push' does not exist
```

### Analogie — readonly = vitrine de musee

`readonly`, c'est comme un objet dans une **vitrine de musee** :

- Tu peux le **regarder** (lire la valeur)
- Tu ne peux pas le **toucher** (modifier la valeur)
- Mais si l'objet est un **sac ouvert** contenant des billes, tu peux quand même ajouter des billes dans le sac (mutation du contenu)

---

## Extension d'interfaces

### Syntaxe extends

Les interfaces peuvent **hériter** d'autres interfaces :

```typescript
// Interface de base
interface Entite {
  id: number;
  creeLe: Date;
  misAJourLe: Date;
}

// Interface etendue — herite de Entite
interface Utilisateur extends Entite {
  nom: string;
  email: string;
  actif: boolean;
}

// Utilisateur a TOUTES les proprietes de Entite + les siennes
const alice: Utilisateur = {
  id: 1,
  creeLe: new Date("2024-01-01"),
  misAJourLe: new Date("2024-06-15"),
  nom: "Alice",
  email: "alice@example.com",
  actif: true,
};

// Extension multiple
interface Produit extends Entite {
  nom: string;
  prix: number;
  stock: number;
}

// On peut etendre plusieurs interfaces
interface ProduitAvecAvis extends Produit {
  avis: { note: number; commentaire: string }[];
  noteMoyenne: number;
}
```

### Héritage multiple

```typescript
// Une interface peut etendre PLUSIEURS interfaces
interface Horodatable {
  creeLe: Date;
  misAJourLe: Date;
}

interface Identifiable {
  id: string;
}

interface Nommable {
  nom: string;
}

// Extension de 3 interfaces a la fois
interface Document extends Horodatable, Identifiable, Nommable {
  contenu: string;
  taille: number;
}

const doc: Document = {
  id: "doc-123",
  nom: "Mon document",
  contenu: "Lorem ipsum...",
  taille: 1024,
  creeLe: new Date(),
  misAJourLe: new Date(),
};
```

---

## Declaration merging (fusion d'interfaces)

### Concept

Une particularite des interfaces : si on declare **deux fois la même interface**, TypeScript les **fusionne** automatiquement :

```typescript
// Premiere declaration
interface Fenetre {
  titre: string;
  largeur: number;
}

// Deuxieme declaration — FUSIONNEE avec la premiere
interface Fenetre {
  hauteur: number;
  visible: boolean;
}

// Le resultat est comme si on avait ecrit :
// interface Fenetre {
//   titre: string;
//   largeur: number;
//   hauteur: number;
//   visible: boolean;
// }

const fenetre: Fenetre = {
  titre: "Ma fenetre",
  largeur: 800,
  hauteur: 600,
  visible: true,
};
```

### Cas d'usage : augmenter des types existants

```typescript
// La declaration merging est utile pour augmenter des types de librairies

// Exemple : ajouter une propriete a l'objet Window du navigateur
declare global {
  interface Window {
    maConfigApp: {
      apiUrl: string;
      version: string;
    };
  }
}

// Maintenant, window.maConfigApp est type
window.maConfigApp = {
  apiUrl: "https://api.example.com",
  version: "1.0.0",
};
```

> **Important** : Les `type` aliases ne supportent PAS la declaration merging. C'est l'une des différences clés avec les interfaces.

---

## Type Aliases (type = ...)

### Declaration

Un **type alias** créé un nouveau nom pour un type existant :

```typescript
// Type alias pour un objet
type Utilisateur = {
  id: number;
  nom: string;
  email: string;
  actif: boolean;
};

// Identique a l'interface pour l'utilisation
const alice: Utilisateur = {
  id: 1,
  nom: "Alice",
  email: "alice@example.com",
  actif: true,
};
```

### Ce que type peut faire (et pas interface)

Les type aliases sont plus **flexibles** que les interfaces :

```typescript
// 1. Unions — IMPOSSIBLE avec interface
type Statut = "actif" | "inactif" | "suspendu";
type ResultatOuErreur = { data: string } | { erreur: string };

// 2. Types primitifs — IMPOSSIBLE avec interface
type Identifiant = string | number;
type Callback = () => void;

// 3. Tuples — IMPOSSIBLE avec interface
type Coordonnees = [number, number];
type Couleur = [number, number, number, number]; // RGBA

// 4. Mapped types — IMPOSSIBLE avec interface
type Optionnel<T> = {
  [K in keyof T]?: T[K];
};

// 5. Conditional types — IMPOSSIBLE avec interface
type SiTableau<T> = T extends unknown[] ? "tableau" : "autre";

// 6. Template literal types — IMPOSSIBLE avec interface
type EvenementSouris = `souris_${"click" | "move" | "enter" | "leave"}`;
```

### Type alias pour des objets

```typescript
// Les type aliases fonctionnent aussi bien que les interfaces pour les objets
type Produit = {
  id: number;
  nom: string;
  prix: number;
  description?: string;
  readonly reference: string;
};

const produit: Produit = {
  id: 1,
  nom: "Clavier mecanique",
  prix: 89.99,
  reference: "KB-001",
};
```

### Extension avec &

Les type aliases utilisent l'**intersection** (`&`) au lieu de `extends` :

```typescript
// Extension avec intersection
type Entite = {
  id: number;
  creeLe: Date;
};

type Utilisateur = Entite & {
  nom: string;
  email: string;
};

// Equivalent a :
// type Utilisateur = {
//   id: number;
//   creeLe: Date;
//   nom: string;
//   email: string;
// };

const alice: Utilisateur = {
  id: 1,
  creeLe: new Date(),
  nom: "Alice",
  email: "alice@example.com",
};

// Composition de plusieurs types
type Horodatable = {
  creeLe: Date;
  misAJourLe: Date;
};

type Supprimable = {
  supprimeLe?: Date;
  estSupprime: boolean;
};

type Document = Entite & Horodatable & Supprimable & {
  titre: string;
  contenu: string;
};
```

---

## Interface vs Type — Quand utiliser quoi ?

### Tableau comparatif

```
┌──────────────────────────────────────────────────────────────────┐
│  INTERFACE vs TYPE ALIAS                                          │
├──────────────────────────┬───────────────────────────────────────┤
│      INTERFACE           │          TYPE ALIAS                    │
├──────────────────────────┼───────────────────────────────────────┤
│ Definir des objets       │ Definir des objets                    │
│ Extension avec extends   │ Composition avec &                    │
│ Declaration merging      │ PAS de declaration merging            │
│ Pas de unions            │ Unions (A | B)                        │
│ Pas de tuples            │ Tuples                                │
│ Pas de types primitifs   │ Types primitifs                       │
│ Pas de mapped types      │ Mapped types                          │
│ Pas de conditional types │ Conditional types                     │
│ Meilleur pour l'heritage │ Meilleur pour la composition          │
│ Messages d'erreur plus   │ Messages d'erreur peuvent etre        │
│ clairs                   │ plus complexes                        │
└──────────────────────────┴───────────────────────────────────────┘
```

### Recommandation pratique

```
┌──────────────────────────────────────────────────────────────┐
│  QUAND UTILISER QUOI ?                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Utilise INTERFACE quand :                                   │
│  - Tu definis la forme d'un OBJET ou d'une CLASSE           │
│  - Tu veux que le type puisse etre ETENDU par d'autres      │
│  - Tu definis un contrat public (API)                        │
│  - Tu veux profiter de la declaration merging                │
│                                                              │
│  Utilise TYPE quand :                                        │
│  - Tu fais une UNION (A | B)                                 │
│  - Tu crees un TUPLE                                         │
│  - Tu nommes un type PRIMITIF                                │
│  - Tu fais de la composition complexe                        │
│  - Tu utilises des mapped/conditional types                  │
│                                                              │
│  En cas de doute : utilise interface pour les objets,        │
│  type pour tout le reste.                                    │
└──────────────────────────────────────────────────────────────┘
```

### Exemples de bonnes pratiques

```typescript
// INTERFACE — Pour les objets et les contrats
interface UtilisateurService {
  trouverParId(id: number): Promise<Utilisateur>;
  creer(donnees: CreerUtilisateur): Promise<Utilisateur>;
  supprimer(id: number): Promise<void>;
}

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
}

// TYPE — Pour les unions, tuples, et compositions
type CreerUtilisateur = Omit<Utilisateur, "id">;
type Role = "admin" | "user" | "moderateur";
type Coordonnees = [number, number];
type Resultat<T> = { success: true; data: T } | { success: false; erreur: string };
```

---

## Structural Typing (Duck Typing)

### Concept fondamental

TypeScript utilise un système de types **structurel** : deux types sont compatibles si leurs **structures** (propriétés) sont compatibles. Peu importe le nom du type.

```typescript
// Deux interfaces avec des noms differents mais la meme structure
interface Chat {
  nom: string;
  age: number;
}

interface Chien {
  nom: string;
  age: number;
}

// TypeScript les considere comme COMPATIBLES !
const medor: Chien = { nom: "Medor", age: 5 };
const chat: Chat = medor; // OK — meme structure

function afficherAnimal(animal: Chat): void {
  console.log(`${animal.nom} a ${animal.age} ans`);
}

afficherAnimal(medor); // OK — Chien a la meme structure que Chat
```

### Analogie — "Si ça marche comme un canard..."

Le structural typing suit le principe du **duck typing** :

> "Si ça marche comme un canard, si ça nage comme un canard, et si ça cancane comme un canard, alors c'est probablement un canard."

En TypeScript :

> "Si un objet a les propriétés `nom: string` et `age: number`, alors il est compatible avec tout type qui exige `nom: string` et `age: number`."

```typescript
// Peu importe le "nom" du type — seule la STRUCTURE compte
interface Volant {
  voler(): void;
}

interface Nageant {
  nager(): void;
}

// Un canard sait voler ET nager
const canard = {
  voler() { console.log("Je vole !"); },
  nager() { console.log("Je nage !"); },
  cancaner() { console.log("Coin coin !"); },
};

// Le canard est compatible avec Volant (il a la methode voler)
const oiseau: Volant = canard; // OK

// Le canard est compatible avec Nageant (il a la methode nager)
const poisson: Nageant = canard; // OK

// Le canard a des proprietes EN PLUS — c'est acceptable
```

### Compatibilite = le type cible est un SOUS-ENSEMBLE

```typescript
interface Point2D {
  x: number;
  y: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Point3D est compatible avec Point2D (il a x et y, plus z en bonus)
const point3d: Point3D = { x: 1, y: 2, z: 3 };
const point2d: Point2D = point3d; // OK !

// Mais l'inverse ne fonctionne pas
// const point3d2: Point3D = point2d; // Erreur : 'z' manquant

// Schema visuel :
//
//  Point2D requiert : { x, y }
//  Point3D a :        { x, y, z }
//
//  Point3D ⊇ Point2D — donc Point3D est assignable a Point2D
```

---

## Excess Property Checking

### Le comportement particulier

TypeScript à un comportement **special** quand on assigne un **objet literal** directement :

```typescript
interface Config {
  port: number;
  host: string;
}

// CAS 1 : Objet literal — EXCESS PROPERTY CHECKING actif
// const config: Config = {
//   port: 3000,
//   host: "localhost",
//   debug: true, // Erreur ! 'debug' does not exist in type 'Config'
// };

// CAS 2 : Variable intermediaire — PAS d'excess property checking
const options = {
  port: 3000,
  host: "localhost",
  debug: true, // OK — c'est une propriete supplementaire
};
const config: Config = options; // OK ! Structural typing : options a port et host

// CAS 3 : Assertion de type — PAS d'excess property checking
const config2 = {
  port: 3000,
  host: "localhost",
  debug: true,
} as Config; // OK (mais on perd la verification)
```

### Pourquoi cette différence ?

```
┌──────────────────────────────────────────────────────────────┐
│  EXCESS PROPERTY CHECKING                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Quand tu passes un OBJET LITERAL directement, TypeScript    │
│  verifie qu'il n'y a PAS de proprietes en trop.              │
│                                                              │
│  Pourquoi ? Parce que les proprietes en trop sont souvent    │
│  des ERREURS (fautes de frappe, proprietes obsoletes).       │
│                                                              │
│  Quand tu passes une VARIABLE, TypeScript fait du            │
│  structural typing normal (les proprietes en plus sont OK).  │
│                                                              │
│  C'est un FILET DE SECURITE supplementaire.                  │
└──────────────────────────────────────────────────────────────┘
```

### Astuce pour contourner l'excess property checking

```typescript
interface Options {
  couleur: string;
  taille: number;
}

// Methode 1 : Variable intermediaire
const opts = { couleur: "rouge", taille: 42, extra: true };
const options1: Options = opts; // OK

// Methode 2 : Index signature (si tu veux permettre des proprietes extra)
interface OptionsFlexibles {
  couleur: string;
  taille: number;
  [cle: string]: unknown; // Permet n'importe quelle propriete supplementaire
}

const options2: OptionsFlexibles = {
  couleur: "rouge",
  taille: 42,
  extra: true, // OK grace a l'index signature
};

// Methode 3 : satisfies (garde la precision)
const options3 = {
  couleur: "rouge",
  taille: 42,
  extra: true,
} satisfies Options; // Erreur ! satisfies applique l'excess check
```

---

## Index Signatures

### Syntaxe

Les index signatures permettent de définir des objets avec des **clés dynamiques** :

```typescript
// Objet avec des cles string et des valeurs number
interface Scores {
  [nomJoueur: string]: number;
}

const scores: Scores = {
  Alice: 150,
  Bob: 120,
  Charlie: 180,
};

// On peut ajouter de nouvelles cles a tout moment
scores["David"] = 95;
scores.Eve = 200;

// Toutes les valeurs sont de type number
const scoreAlice: number = scores["Alice"]; // 150
const scoreInconnu: number = scores["Inconnu"]; // undefined au runtime, mais type number !
```

### Types de clés possibles

```typescript
// Cle string — la plus courante
interface Dictionnaire {
  [cle: string]: string;
}

// Cle number — pour les tableaux associatifs
interface IndexNumerique {
  [index: number]: string;
}

const jours: IndexNumerique = {
  0: "Lundi",
  1: "Mardi",
  2: "Mercredi",
};

// Combiner proprietes fixes et index signature
interface ApiResponse {
  status: number;         // Propriete fixe
  message: string;        // Propriete fixe
  [cle: string]: unknown; // Proprietes dynamiques (doit etre compatible)
}

const response: ApiResponse = {
  status: 200,
  message: "OK",
  data: { users: [] },    // Propriete dynamique
  timestamp: Date.now(),   // Propriete dynamique
};
```

### Attention aux pieges

```typescript
// Piege 1 : Les proprietes fixes doivent etre compatibles avec l'index signature
interface Mauvais {
  nom: string;
  // [cle: string]: number;
  // Erreur : 'nom' (string) n'est pas compatible avec number
}

// Solution : utiliser une union
interface Correct {
  nom: string;
  [cle: string]: string | number; // nom est string, qui fait partie de l'union
}

// Piege 2 : L'acces par cle retourne toujours le type declare, meme si la cle n'existe pas
interface Scores {
  [joueur: string]: number;
}

const scores: Scores = { Alice: 100 };
const scoreBob: number = scores["Bob"]; // number (pas number | undefined !)
// Au runtime, scoreBob est undefined — TypeScript ne le detecte pas par defaut

// Solution : activer noUncheckedIndexedAccess dans tsconfig.json
// Avec cette option, scores["Bob"] serait de type number | undefined
```

---

## Objets imbriques (nested objects)

### Typer des structures profondes

```typescript
// Structure complexe avec des objets imbriques
interface Adresse {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
}

interface Contact {
  email: string;
  telephone?: string;
  adresse: Adresse;
}

interface Entreprise {
  nom: string;
  siret: string;
  contact: Contact;
  employes: Employe[];
}

interface Employe {
  id: number;
  prenom: string;
  nom: string;
  poste: string;
  salaire: number;
  contact: Contact;
}

// Utilisation
const entreprise: Entreprise = {
  nom: "TechCorp",
  siret: "123 456 789 00001",
  contact: {
    email: "contact@techcorp.fr",
    telephone: "+33 1 23 45 67 89",
    adresse: {
      rue: "42 avenue des Champs-Elysees",
      codePostal: "75008",
      ville: "Paris",
      pays: "France",
    },
  },
  employes: [
    {
      id: 1,
      prenom: "Alice",
      nom: "Martin",
      poste: "Developpeur Senior",
      salaire: 55000,
      contact: {
        email: "alice.martin@techcorp.fr",
        adresse: {
          rue: "10 rue de Rivoli",
          codePostal: "75001",
          ville: "Paris",
          pays: "France",
        },
      },
    },
  ],
};
```

### Acceder aux propriétés imbriquees

```typescript
// Acces direct
const villeEntreprise: string = entreprise.contact.adresse.ville;

// Avec optional chaining (si des proprietes sont optionnelles)
interface ProfilPartiel {
  nom: string;
  adresse?: {
    rue?: string;
    ville?: string;
  };
}

const profil: ProfilPartiel = { nom: "Alice" };
const ville: string | undefined = profil.adresse?.ville;
console.log(ville ?? "Ville inconnue");
```

---

## Intersections (&) pour la composition

### Concept

L'intersection `&` combine plusieurs types en un seul. L'objet resultant doit avoir **toutes** les propriétés de chaque type :

```typescript
// Deux types de base
type Horodatable = {
  creeLe: Date;
  misAJourLe: Date;
};

type Identifiable = {
  id: string;
};

// Intersection — combine les deux
type Entite = Horodatable & Identifiable;
// Equivalent a :
// type Entite = {
//   creeLe: Date;
//   misAJourLe: Date;
//   id: string;
// };

const entite: Entite = {
  id: "abc-123",
  creeLe: new Date(),
  misAJourLe: new Date(),
};
```

### Intersection vs extends

```typescript
// Avec interface + extends :
interface Animal {
  nom: string;
}

interface AnimalDomestique extends Animal {
  proprietaire: string;
}

// Avec type + & :
type AnimalType = {
  nom: string;
};

type AnimalDomestiqueType = AnimalType & {
  proprietaire: string;
};

// Les deux sont equivalents pour les objets
// La difference est syntaxique
```

### Intersection de types incompatibles

```typescript
// Attention : l'intersection de types primitifs incompatibles donne 'never'
type Impossible = string & number; // never — rien ne peut etre a la fois string ET number

// Mais l'intersection d'objets fonctionne toujours
type A = { x: number; y: number };
type B = { y: number; z: number };
type C = A & B;
// C = { x: number; y: number; z: number }
// La propriete 'y' commune doit etre compatible dans les deux types

// Conflit de types sur une meme propriete
type D = { status: string };
type E = { status: number };
type F = D & E;
// F = { status: string & number } = { status: never }
// Impossible a creer !
```

### Patterns de composition

```typescript
// Pattern : Mixin de comportements
type Loggable = {
  log(message: string): void;
};

type Serialisable = {
  toJSON(): string;
};

type Validable = {
  valider(): boolean;
  erreurs: string[];
};

// Un formulaire combine plusieurs comportements
type Formulaire = {
  champs: Record<string, string>;
} & Loggable & Serialisable & Validable;

// Implementation
const formulaire: Formulaire = {
  champs: { nom: "Alice", email: "alice@example.com" },
  erreurs: [],
  log(message) {
    console.log(`[FORM] ${message}`);
  },
  toJSON() {
    return JSON.stringify(this.champs);
  },
  valider() {
    this.erreurs = [];
    if (!this.champs.nom) this.erreurs.push("Nom requis");
    if (!this.champs.email) this.erreurs.push("Email requis");
    return this.erreurs.length === 0;
  },
};
```

---

## Type compatibility (compatibilite de types)

### Les regles

TypeScript vérifié la compatibilite structurelle. Voici les regles principales :

```typescript
// Regle 1 : Un type avec PLUS de proprietes est assignable a un type avec MOINS
interface Petit {
  x: number;
}

interface Grand {
  x: number;
  y: number;
  z: number;
}

let petit: Petit;
let grand: Grand = { x: 1, y: 2, z: 3 };

petit = grand; // OK — Grand a tout ce que Petit exige (et plus)
// grand = petit; // Erreur — Petit n'a pas y et z

// Regle 2 : Les fonctions sont compatibles si les parametres correspondent
type FonctionA = (x: number) => void;
type FonctionB = (x: number, y: number) => void;

let fnA: FonctionA = (x) => console.log(x);
let fnB: FonctionB = (x, y) => console.log(x, y);

fnB = fnA; // OK — fnA ignore simplement le parametre y
// fnA = fnB; // Erreur — fnB a besoin de 2 parametres

// C'est essentiel pour les callbacks :
[1, 2, 3].forEach((item) => console.log(item));
// forEach attend (item, index, array) => void
// Mais notre callback n'utilise que 'item' — c'est valide
```

### Analogie — La prise electrique

La compatibilite de types, c'est comme les **prises electriques** :

- Une prise avec 2 trous (Type Petit) accepte une fiche avec 2 broches
- Une fiche avec 3 broches (Type Grand) **ne rentre pas** dans une prise a 2 trous
- Mais une fiche avec 2 broches **rentre** dans une prise a 3 trous (avec une broche terre non utilisee)

---

## Pratique

### Exercice 1 — Modeliser un blog

Cree les interfaces pour un système de blog avec :
- `Auteur` (id, nom, email, bio optionnelle)
- `Article` (id, titre, contenu, auteur, datePublication, tags, commentaires)
- `Commentaire` (id, auteur, contenu, date, likes)

<details>
<summary>Solution</summary>

```typescript
interface Auteur {
  id: number;
  nom: string;
  email: string;
  bio?: string;
}

interface Commentaire {
  id: number;
  auteur: Auteur;
  contenu: string;
  date: Date;
  likes: number;
}

interface Article {
  id: number;
  titre: string;
  contenu: string;
  auteur: Auteur;
  datePublication: Date;
  tags: string[];
  commentaires: Commentaire[];
}

// Utilisation
const alice: Auteur = {
  id: 1,
  nom: "Alice",
  email: "alice@blog.com",
  bio: "Developpeuse passionnee",
};

const article: Article = {
  id: 1,
  titre: "Introduction a TypeScript",
  contenu: "TypeScript est un sur-ensemble type de JavaScript...",
  auteur: alice,
  datePublication: new Date("2024-06-15"),
  tags: ["typescript", "javascript", "tutorial"],
  commentaires: [
    {
      id: 1,
      auteur: { id: 2, nom: "Bob", email: "bob@blog.com" },
      contenu: "Super article !",
      date: new Date("2024-06-16"),
      likes: 5,
    },
  ],
};
```

</details>

### Exercice 2 — Structural typing

Sans exécuter le code, déterminé si chaque assignation est valide ou provoque une erreur :

```typescript
interface Vehicule {
  marque: string;
  vitesseMax: number;
}

interface Voiture {
  marque: string;
  vitesseMax: number;
  nombrePortes: number;
}

const tesla: Voiture = { marque: "Tesla", vitesseMax: 250, nombrePortes: 4 };
const vehicule: Vehicule = tesla;                    // 1. Valide ?
// const voiture: Voiture = vehicule;                // 2. Valide ?
const obj = { marque: "BMW", vitesseMax: 230 };
// const bmw: Voiture = obj;                         // 3. Valide ?
const obj2 = { marque: "Audi", vitesseMax: 260, nombrePortes: 5, couleur: "noir" };
const audi: Voiture = obj2;                          // 4. Valide ?
```

<details>
<summary>Solution</summary>

```typescript
// 1. VALIDE — Voiture a toutes les proprietes de Vehicule (+ nombrePortes)
const vehicule: Vehicule = tesla; // OK

// 2. ERREUR — Vehicule n'a pas la propriete 'nombrePortes'
// const voiture: Voiture = vehicule;
// Property 'nombrePortes' is missing in type 'Vehicule'

// 3. ERREUR — obj n'a pas la propriete 'nombrePortes'
// const bmw: Voiture = obj;
// Property 'nombrePortes' is missing

// 4. VALIDE — obj2 a toutes les proprietes de Voiture (+ couleur en bonus)
// Pas d'excess property checking car c'est via une variable (pas un literal)
const audi: Voiture = obj2; // OK
```

</details>

### Exercice 3 — Interface vs Type

Refactorise le code suivant en utilisant le bon outil (interface ou type) pour chaque cas :

```typescript
// A transformer
const statut = "actif" | "inactif" | "suspendu"; // wrong syntax!
const coordonnees = [number, number];              // wrong syntax!
// Un service avec des methodes...
// Un objet de configuration...
// Un resultat qui peut etre succes ou erreur...
```

<details>
<summary>Solution</summary>

```typescript
// Union → TYPE (impossible avec interface)
type Statut = "actif" | "inactif" | "suspendu";

// Tuple → TYPE (impossible avec interface)
type Coordonnees = [number, number];

// Service avec methodes → INTERFACE (contrat public)
interface UtilisateurService {
  trouverParId(id: number): Promise<Utilisateur | null>;
  lister(): Promise<Utilisateur[]>;
  creer(donnees: CreerUtilisateur): Promise<Utilisateur>;
  supprimer(id: number): Promise<boolean>;
}

// Objet de configuration → INTERFACE (extensible)
interface ConfigApp {
  port: number;
  host: string;
  debug: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

// Resultat succes/erreur → TYPE (union discriminee)
type Resultat<T> =
  | { success: true; data: T }
  | { success: false; erreur: string };

// Types utilitaires → TYPE
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  statut: Statut;
}

type CreerUtilisateur = Omit<Utilisateur, "id">;
```

</details>

### Exercice 4 — Composition avec intersections

Cree un système de types pour des entites de base de donnees en utilisant la composition :

1. Un type `Timestamps` avec `createdAt` et `updatedAt`
2. Un type `SoftDeletable` avec `deletedAt` optionnel et `isDeleted`
3. Un type `Versionnable` avec `version` (number)
4. Compose ces types pour créer `Article` et `Commentaire`

<details>
<summary>Solution</summary>

```typescript
// Types de base composables
type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type SoftDeletable = {
  deletedAt?: Date;
  isDeleted: boolean;
};

type Versionnable = {
  version: number;
};

type WithId = {
  id: string;
};

// Composition pour Article — toutes les fonctionnalites
type Article = WithId & Timestamps & SoftDeletable & Versionnable & {
  titre: string;
  contenu: string;
  auteurId: string;
  tags: string[];
  publie: boolean;
};

// Composition pour Commentaire — pas versionnable
type Commentaire = WithId & Timestamps & SoftDeletable & {
  articleId: string;
  auteurId: string;
  contenu: string;
  likes: number;
};

// Utilisation
const article: Article = {
  id: "art-001",
  titre: "Apprendre TypeScript",
  contenu: "TypeScript est genial...",
  auteurId: "user-001",
  tags: ["typescript", "cours"],
  publie: true,
  version: 3,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-06-20"),
  isDeleted: false,
};

const commentaire: Commentaire = {
  id: "com-001",
  articleId: "art-001",
  auteurId: "user-002",
  contenu: "Tres instructif !",
  likes: 12,
  createdAt: new Date("2024-06-21"),
  updatedAt: new Date("2024-06-21"),
  isDeleted: false,
};

console.log(article.titre);
console.log(commentaire.contenu);
```

</details>

### Exercice 5 — Index signatures et readonly

Cree un type `Dictionnaire` pour un dictionnaire français-anglais :
- Les clés sont des mots français (string)
- Les valeurs sont des objets avec la traduction anglaise et une phrase d'exemple optionnelle
- Le dictionnaire est readonly (on ne peut pas modifier les entrees existantes)
- Cree une fonction `chercher` qui retourne la traduction ou "Mot inconnu"

<details>
<summary>Solution</summary>

```typescript
interface EntreeDictionnaire {
  readonly traduction: string;
  readonly exemple?: string;
}

interface Dictionnaire {
  readonly [motFrancais: string]: EntreeDictionnaire;
}

const dictionnaire: Dictionnaire = {
  bonjour: {
    traduction: "hello",
    exemple: "Hello, how are you?",
  },
  maison: {
    traduction: "house",
    exemple: "This is my house.",
  },
  chat: {
    traduction: "cat",
  },
  programmer: {
    traduction: "to code",
    exemple: "I love to code in TypeScript.",
  },
};

function chercher(
  dictionnaire: Dictionnaire,
  mot: string
): string {
  const entree = dictionnaire[mot];
  if (!entree) {
    return "Mot inconnu";
  }

  let resultat = `${mot} → ${entree.traduction}`;
  if (entree.exemple) {
    resultat += ` (ex: "${entree.exemple}")`;
  }
  return resultat;
}

console.log(chercher(dictionnaire, "bonjour"));
// "bonjour → hello (ex: "Hello, how are you?")"

console.log(chercher(dictionnaire, "chat"));
// "chat → cat"

console.log(chercher(dictionnaire, "ordinateur"));
// "Mot inconnu"

// Impossible de modifier :
// dictionnaire["bonjour"] = { traduction: "hi" }; // Erreur : readonly
// dictionnaire.bonjour.traduction = "hi";          // Erreur : readonly
```

</details>

---

## Récapitulatif

```
┌──────────────────────────────────────────────────────────────┐
│                   CE QUE TU AS APPRIS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Types d'objets inline : pour les cas simples             │
│                                                              │
│  2. Interfaces :                                             │
│     - Contrats pour les objets                               │
│     - Extension avec extends                                 │
│     - Declaration merging (fusion)                           │
│     - Proprietes readonly et optionnelles                    │
│                                                              │
│  3. Type aliases :                                           │
│     - Plus flexibles (unions, tuples, mapped types)          │
│     - Composition avec & (intersection)                      │
│     - Pas de declaration merging                             │
│                                                              │
│  4. Structural typing :                                      │
│     - La compatibilite est basee sur la STRUCTURE            │
│     - Pas besoin que les noms correspondent                  │
│     - Un objet avec plus de proprietes est compatible        │
│                                                              │
│  5. Excess property checking :                               │
│     - Actif uniquement sur les objets literals               │
│     - Protege contre les fautes de frappe                    │
│                                                              │
│  6. Index signatures :                                       │
│     - [cle: string]: Type pour les cles dynamiques           │
│                                                              │
│  7. Intersections (&) :                                      │
│     - Combinent plusieurs types en un seul                   │
│     - Parfaites pour la composition                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Pour aller plus loin

Dans le prochain module, **04 — Union, Intersection & Narrowing**, nous allons approfondir :

- Les **union types** et les **discriminated unions** (unions discriminees)
- Le **type narrowing** avec `typeof`, `instanceof`, `in`, et les comparaisons
- Les **type guards custom** (predicates `is`)
- La vérification **exhaustive** avec `never`
- L'analyse du **control flow** par TypeScript

> **Conseil** : Entraine-toi a créer des interfaces et des type aliases pour des structures de donnees reelles (API, bases de donnees, formulaires). La modelisation des types est une compétence clé en TypeScript.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 03 objets interfaces](../screencasts/screencast-03-objets-interfaces.md)
2. **Lab** : [lab-03-objets-interfaces](../labs/lab-03-objets-interfaces/README)
3. **Quiz** : [quiz 03 objets interfaces](../quizzes/quiz-03-objets-interfaces.html)
:::
