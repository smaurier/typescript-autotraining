# 02 — Fonctions — Signatures, Surcharges & Callbacks

> **Duree estimee** : 4h00
> **Difficulte** : 2/5
> **Prerequis** : Module 01 (types primitifs, inference, any vs unknown)
> **Objectifs** :
> - Typer les **parametres** et les **retours** de fonctions
> - Maitriser les parametres **optionnels**, **par defaut** et **rest**
> - Comprendre et utiliser les **surcharges** (overloads)
> - Typer les **callbacks** correctement
> - Decouvrir les **type predicates** (`is`) et **assertion functions** (`asserts`)
> - Apercu des **generiques** dans les fonctions

---

## Parametres types et types de retour

### Syntaxe de base

En TypeScript, on annote les parametres et le type de retour d'une fonction :

```typescript
// Syntaxe : function nom(param: Type): TypeRetour { ... }

function additionner(a: number, b: number): number {
  return a + b;
}

// Appel correct
const resultat = additionner(10, 20); // resultat est number (infere)

// Appels incorrects — TypeScript les detecte
// additionner("10", 20);  // Erreur : string n'est pas number
// additionner(10);         // Erreur : Expected 2 arguments, but got 1
// additionner(10, 20, 30); // Erreur : Expected 2 arguments, but got 3
```

### Pourquoi toujours typer les parametres ?

```typescript
// TypeScript NE PEUT PAS inferer les types des parametres
// (il ne sait pas avec quoi la fonction sera appelee)

// MAUVAIS — Sans strict, 'a' et 'b' deviennent 'any'
// function additionner(a, b) { return a + b; }

// BON — Types explicites
function additionner(a: number, b: number): number {
  return a + b;
}

// Le type de retour peut etre infere (mais l'annotation est recommandee
// pour les fonctions exportees ou complexes)
function multiplier(a: number, b: number) {
  return a * b; // TypeScript infere : number
}
```

### Analogie — Le contrat de la fonction

Une fonction typee, c'est comme un **contrat de travail** :

- **Parametres** = Ce que tu dois fournir (ton CV, tes diplomes)
- **Type de retour** = Ce que tu recois en echange (ton salaire)
- **Le compilateur** = Le juriste qui verifie que les deux parties respectent le contrat

```typescript
// Le "contrat" de cette fonction :
// "Donne-moi un string et un number, je te rends un string"
function formaterPrix(montant: number, devise: string): string {
  return `${montant.toFixed(2)} ${devise}`;
}

// Le contrat est respecte :
formaterPrix(19.99, "EUR"); // "19.99 EUR"

// Le contrat n'est pas respecte :
// formaterPrix("19.99", "EUR"); // Erreur ! string au lieu de number
```

---

## Fonctions flechees

### Syntaxe typee

Les fonctions flechees (arrow functions) se typent de la meme maniere :

```typescript
// Fonction flechee avec types
const saluer = (nom: string): string => {
  return `Bonjour ${nom} !`;
};

// Version courte (return implicite)
const doubler = (n: number): number => n * 2;

// Plusieurs parametres
const concatener = (a: string, b: string, separateur: string = " "): string =>
  `${a}${separateur}${b}`;

// Appels
console.log(saluer("Alice"));            // "Bonjour Alice !"
console.log(doubler(21));                  // 42
console.log(concatener("Bon", "jour"));    // "Bon jour"
console.log(concatener("Bon", "jour", "")); // "Bonjour"
```

### Typer une variable comme fonction

On peut declarer le type d'une variable de type fonction :

```typescript
// Type de fonction : (params) => retour
type Operation = (a: number, b: number) => number;

const additionner: Operation = (a, b) => a + b;
const soustraire: Operation = (a, b) => a - b;
const multiplier: Operation = (a, b) => a * b;
const diviser: Operation = (a, b) => a / b;

// Les types des parametres sont inferes grace au type Operation
// Pas besoin de re-ecrire (a: number, b: number): number

// Stocker dans un tableau
const operations: Operation[] = [additionner, soustraire, multiplier, diviser];

operations.forEach((op) => {
  console.log(op(10, 3));
});
// 13, 7, 30, 3.3333...
```

---

## Parametres optionnels (?)

### Syntaxe

Un parametre optionnel est marque avec `?`. Il peut etre omis a l'appel :

```typescript
// 'titre' est optionnel — son type est string | undefined
function saluer(nom: string, titre?: string): string {
  if (titre) {
    return `Bonjour ${titre} ${nom} !`;
  }
  return `Bonjour ${nom} !`;
}

// Les deux appels sont valides
saluer("Dupont");           // "Bonjour Dupont !"
saluer("Dupont", "Mme");    // "Bonjour Mme Dupont !"

// Regles importantes :
// 1. Les parametres optionnels doivent etre APRES les obligatoires
// function mauvais(a?: string, b: number) {} // Erreur !

// 2. Un parametre optionnel a le type T | undefined
function afficherAge(age?: number): void {
  // age est de type number | undefined
  // Il faut verifier avant d'utiliser
  if (age !== undefined) {
    console.log(`Age : ${age}`);
  } else {
    console.log("Age non renseigne");
  }
}
```

### Analogie — Le menu du restaurant

Les parametres optionnels, c'est comme un **menu de restaurant** :

- Le plat principal est **obligatoire** (tu dois en choisir un)
- Le dessert est **optionnel** (tu peux le prendre ou non)
- Si tu ne prends pas de dessert, le serveur ne te forcera pas

```typescript
function commander(
  plat: string,           // Obligatoire
  boisson: string,        // Obligatoire
  dessert?: string,       // Optionnel
  supplement?: string     // Optionnel
): string {
  let commande = `Plat: ${plat}, Boisson: ${boisson}`;
  if (dessert) commande += `, Dessert: ${dessert}`;
  if (supplement) commande += `, Supplement: ${supplement}`;
  return commande;
}

commander("Steak", "Eau");                        // OK
commander("Steak", "Eau", "Tiramisu");            // OK
commander("Steak", "Eau", "Tiramisu", "Fromage"); // OK
```

---

## Parametres par defaut

### Syntaxe

Un parametre avec une valeur par defaut n'a pas besoin du `?` — il est automatiquement optionnel :

```typescript
// Le parametre 'tva' a une valeur par defaut de 0.2
function calculerTTC(montantHT: number, tva: number = 0.2): number {
  return montantHT * (1 + tva);
}

// Appels
calculerTTC(100);       // 120 (tva = 0.2 par defaut)
calculerTTC(100, 0.1);  // 110 (tva = 0.1)
calculerTTC(100, 0);    // 100 (tva = 0 — attention, 0 est falsy !)

// Le type du parametre est infere de la valeur par defaut
// Pas besoin d'ecrire tva: number = 0.2

// Parametres par defaut complexes
function creerUtilisateur(
  nom: string,
  role: "admin" | "user" = "user",
  actif: boolean = true,
  dateInscription: Date = new Date()
) {
  return { nom, role, actif, dateInscription };
}

creerUtilisateur("Alice");
// { nom: "Alice", role: "user", actif: true, dateInscription: Date }

creerUtilisateur("Bob", "admin");
// { nom: "Bob", role: "admin", actif: true, dateInscription: Date }
```

### Difference entre optionnel et defaut

```
┌──────────────────────────────────────────────────────────────┐
│  OPTIONNEL (?) vs PAR DEFAUT (=)                              │
├──────────────────────────────┬───────────────────────────────┤
│ param?: string               │ param: string = "valeur"      │
├──────────────────────────────┼───────────────────────────────┤
│ Type: string | undefined     │ Type: string                  │
│ Si omis: undefined           │ Si omis: "valeur"             │
│ Doit verifier undefined      │ Toujours une valeur valide    │
│ Utilise quand "pas de valeur"│ Utilise quand il y a un       │
│ est un cas valide            │ comportement par defaut       │
└──────────────────────────────┴───────────────────────────────┘
```

---

## Rest parameters (...args)

### Concept

Les rest parameters permettent de passer un **nombre variable** d'arguments :

```typescript
// ...nombres collecte tous les arguments dans un tableau
function somme(...nombres: number[]): number {
  return nombres.reduce((total, n) => total + n, 0);
}

somme(1, 2, 3);          // 6
somme(10, 20, 30, 40);   // 100
somme();                   // 0

// Rest parameter apres des parametres normaux
function log(niveau: string, ...messages: string[]): void {
  const prefix = `[${niveau.toUpperCase()}]`;
  messages.forEach((msg) => console.log(`${prefix} ${msg}`));
}

log("info", "Serveur demarre", "Port 3000");
// [INFO] Serveur demarre
// [INFO] Port 3000

log("error", "Connection perdue");
// [ERROR] Connection perdue
```

### Rest parameters avec des tuples

```typescript
// On peut typer les rest parameters plus precisement avec des tuples
function creerPoint(...coords: [number, number]): { x: number; y: number } {
  return { x: coords[0], y: coords[1] };
}

creerPoint(10, 20);     // { x: 10, y: 20 }
// creerPoint(10);       // Erreur : Expected 2 arguments
// creerPoint(10, 20, 30); // Erreur : Expected 2 arguments

// Tuple avec elements optionnels
function creerVecteur(...coords: [number, number, number?]): {
  x: number;
  y: number;
  z: number;
} {
  return { x: coords[0], y: coords[1], z: coords[2] ?? 0 };
}

creerVecteur(1, 2);     // { x: 1, y: 2, z: 0 }
creerVecteur(1, 2, 3);  // { x: 1, y: 2, z: 3 }
```

### Cas d'usage : Fonction wrapper

```typescript
// Un pattern courant : wrapper qui passe les arguments a une autre fonction
function mesurerTemps<T>(
  nomFonction: string,
  fn: (...args: unknown[]) => T,
  ...args: unknown[]
): T {
  const debut = performance.now();
  const resultat = fn(...args);
  const fin = performance.now();
  console.log(`${nomFonction} : ${(fin - debut).toFixed(2)}ms`);
  return resultat;
}
```

---

## Surcharges de fonctions (Overloads)

### Le probleme

Parfois, une fonction doit avoir des **comportements differents** selon les types des arguments :

```typescript
// On veut une fonction 'formater' qui :
// - Si on passe un number → retourne un string formate
// - Si on passe un Date → retourne un string date formatee
// - Si on passe un string → retourne le string en majuscules

// SANS surcharge — le type de retour est ambigu
function formater(valeur: number | Date | string): string {
  if (typeof valeur === "number") {
    return valeur.toFixed(2);
  }
  if (valeur instanceof Date) {
    return valeur.toISOString();
  }
  return valeur.toUpperCase();
}
// Ca marche, mais le type de retour est toujours string
// On perd la precision
```

### Syntaxe des surcharges

```typescript
// AVEC surcharges — chaque signature est precise
// 1. Declarations de surcharge (les "signatures publiques")
function formater(valeur: number): string;
function formater(valeur: Date): string;
function formater(valeur: string): string;

// 2. Implementation (la "signature d'implementation" — plus large)
function formater(valeur: number | Date | string): string {
  if (typeof valeur === "number") {
    return valeur.toFixed(2);
  }
  if (valeur instanceof Date) {
    return valeur.toISOString();
  }
  return valeur.toUpperCase();
}

// Utilisation — TypeScript sait quel overload est utilise
formater(42);              // OK — correspond a la signature (number) → string
formater(new Date());      // OK — correspond a la signature (Date) → string
formater("hello");         // OK — correspond a la signature (string) → string
// formater(true);          // Erreur — aucune surcharge ne correspond
```

### Surcharge avec types de retour differents

```typescript
// Fonction qui retourne des types DIFFERENTS selon l'input
function chercher(id: number): Utilisateur;
function chercher(email: string): Utilisateur;
function chercher(critere: { nom: string; age: number }): Utilisateur[];

function chercher(
  critere: number | string | { nom: string; age: number }
): Utilisateur | Utilisateur[] {
  if (typeof critere === "number") {
    // Recherche par ID — retourne un seul utilisateur
    return { id: critere, nom: "Alice", email: "alice@example.com" };
  }
  if (typeof critere === "string") {
    // Recherche par email — retourne un seul utilisateur
    return { id: 1, nom: "Alice", email: critere };
  }
  // Recherche par criteres — retourne un tableau
  return [
    { id: 1, nom: critere.nom, email: "alice@example.com" },
  ];
}

interface Utilisateur {
  id: number;
  nom: string;
  email: string;
}

// TypeScript connait le type de retour precis
const user1 = chercher(1);        // Utilisateur (pas Utilisateur[])
const user2 = chercher("a@b.c");  // Utilisateur
const users = chercher({ nom: "A", age: 30 }); // Utilisateur[]
```

### Regles des surcharges

```
┌──────────────────────────────────────────────────────────────┐
│  REGLES DES SURCHARGES                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Les surcharges sont declarees AVANT l'implementation     │
│                                                              │
│  2. La signature d'implementation doit etre COMPATIBLE       │
│     avec TOUTES les surcharges                               │
│                                                              │
│  3. La signature d'implementation n'est PAS visible          │
│     de l'exterieur — seules les surcharges le sont           │
│                                                              │
│  4. TypeScript essaie les surcharges dans l'ORDRE            │
│     (de haut en bas) et utilise la premiere qui correspond   │
│                                                              │
│  5. Mets les surcharges les plus SPECIFIQUES en premier      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Callback typing

### Typer les callbacks

Les callbacks sont des fonctions passees en argument a d'autres fonctions :

```typescript
// Typer un callback inline
function appliquerSurTableau(
  nombres: number[],
  callback: (valeur: number, index: number) => number
): number[] {
  return nombres.map(callback);
}

// Utilisation
const doubles = appliquerSurTableau([1, 2, 3], (val) => val * 2);
// [2, 4, 6]

const avecIndex = appliquerSurTableau([10, 20, 30], (val, idx) => val + idx);
// [10, 21, 32]
```

### Extraire le type de callback

```typescript
// Definir un type de callback reutilisable
type Comparateur<T> = (a: T, b: T) => number;

function trier<T>(tableau: T[], comparateur: Comparateur<T>): T[] {
  return [...tableau].sort(comparateur);
}

// Utilisation
const nombres = [3, 1, 4, 1, 5, 9];
const tries = trier(nombres, (a, b) => a - b);
// [1, 1, 3, 4, 5, 9]

const noms = ["Charlie", "Alice", "Bob"];
const nomsTries = trier(noms, (a, b) => a.localeCompare(b));
// ["Alice", "Bob", "Charlie"]
```

### Pattern : Callback avec erreur (style Node.js)

```typescript
// Pattern classique Node.js : callback(erreur, resultat)
type NodeCallback<T> = (erreur: Error | null, resultat: T | null) => void;

function lireFichier(chemin: string, callback: NodeCallback<string>): void {
  try {
    // Simulons la lecture d'un fichier
    const contenu = "contenu du fichier";
    callback(null, contenu);
  } catch (erreur) {
    callback(erreur instanceof Error ? erreur : new Error(String(erreur)), null);
  }
}

// Utilisation
lireFichier("/chemin/fichier.txt", (erreur, contenu) => {
  if (erreur) {
    console.error("Erreur :", erreur.message);
    return;
  }
  console.log("Contenu :", contenu);
});
```

### Callbacks dans les evenements

```typescript
// Type de callback pour les evenements
type EventHandler<T = void> = (event: T) => void;

interface Bouton {
  onClick: EventHandler<{ x: number; y: number }>;
  onHover: EventHandler;
  onFocus: EventHandler;
}

const monBouton: Bouton = {
  onClick: (event) => {
    console.log(`Click a (${event.x}, ${event.y})`);
  },
  onHover: () => {
    console.log("Survol !");
  },
  onFocus: () => {
    console.log("Focus !");
  },
};
```

---

## void vs undefined dans les retours

### La subtilite

`void` et `undefined` sont differents quand il s'agit du type de retour :

```typescript
// void = "je ne retourne rien d'utile" (mais je peux retourner undefined)
function logVoid(msg: string): void {
  console.log(msg);
  // Pas de return, ou return; sans valeur
}

// undefined = "je retourne explicitement undefined"
function retourneUndefined(): undefined {
  return undefined; // DOIT retourner undefined
  // return; // Aussi valide
}

// La vraie difference : dans les CALLBACKS
type CallbackVoid = () => void;

// Un callback de type void peut retourner n'importe quoi !
// La valeur de retour sera simplement ignoree
const cb: CallbackVoid = () => {
  return 42; // OK ! La valeur est ignoree
};

// C'est essentiel pour des cas comme Array.forEach :
// forEach attend (element) => void
// Mais .push() retourne un number
const nombres: number[] = [];
[1, 2, 3].forEach((n) => nombres.push(n));
// push retourne un number, mais forEach attend void
// C'est valide grace a cette regle speciale de void dans les callbacks
```

### Analogie

- **`void`** en retour de fonction = "Tu peux jeter la lettre de reponse, elle ne contient rien d'important."
- **`undefined`** en retour de fonction = "La lettre de reponse contient explicitement la mention 'neant'."

---

## this parameter typing

### Le probleme de this en JavaScript

```typescript
// En JavaScript, 'this' depend du CONTEXTE d'appel
const compteur = {
  valeur: 0,
  incrementer() {
    this.valeur++;
  },
};

// Appel normal : this = compteur
compteur.incrementer(); // OK

// Mais si on extrait la methode :
const fn = compteur.incrementer;
fn(); // Erreur ! this est undefined (en mode strict)
```

### Typer this

TypeScript permet de declarer le type de `this` comme **premier parametre** (il est efface a la compilation) :

```typescript
// Le parametre 'this' est un parametre special :
// - Il doit etre le PREMIER parametre
// - Il n'est PAS passe a l'appel
// - Il est efface lors de la compilation (type erasure)

interface Compteur {
  valeur: number;
  incrementer(this: Compteur): void;
  getValeur(this: Compteur): number;
}

const compteur: Compteur = {
  valeur: 0,
  incrementer(this: Compteur) {
    this.valeur++; // TypeScript sait que this est Compteur
  },
  getValeur(this: Compteur) {
    return this.valeur;
  },
};

compteur.incrementer(); // OK — this est bien Compteur

// const fn = compteur.incrementer;
// fn(); // Erreur TypeScript : The 'this' context of type 'void' is not
//       // assignable to method's 'this' of type 'Compteur'
```

### Cas d'usage : Event handlers du DOM

```typescript
// Dans un handler DOM, 'this' est l'element HTML
function handleClick(this: HTMLButtonElement, event: MouseEvent): void {
  // TypeScript sait que 'this' est un HTMLButtonElement
  this.disabled = true;
  this.textContent = "Clique !";
  console.log(`Bouton clique a (${event.clientX}, ${event.clientY})`);
}

// L'utiliser correctement
const bouton = document.querySelector("button")!;
bouton.addEventListener("click", handleClick);
```

---

## Assertion functions (asserts)

### Concept

Une assertion function est une fonction qui **lance une erreur** si une condition n'est pas remplie. Apres l'appel, TypeScript sait que la condition est vraie :

```typescript
// Le mot-cle 'asserts' dans le type de retour
function assertEstString(valeur: unknown): asserts valeur is string {
  if (typeof valeur !== "string") {
    throw new Error(`Attendu un string, recu ${typeof valeur}`);
  }
}

// Utilisation
function traiter(donnee: unknown): void {
  // Ici, donnee est 'unknown'
  assertEstString(donnee);
  // Apres l'assertion, TypeScript SAIT que donnee est string
  console.log(donnee.toUpperCase()); // OK !
}

// Si la valeur n'est pas un string, l'erreur est lancee
// Le code apres l'assertion ne s'execute que si la condition est vraie
```

### assert plus general

```typescript
// Assertion generique : verifier qu'une condition est vraie
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Utilisation
function diviser(a: number, b: number): number {
  assert(b !== 0, "Division par zero !");
  // Apres cette ligne, TypeScript sait que b !== 0
  return a / b;
}
```

### Assertion de non-nullite

```typescript
// Verifier qu'une valeur n'est ni null ni undefined
function assertDefini<T>(
  valeur: T | null | undefined,
  nom: string = "valeur"
): asserts valeur is T {
  if (valeur === null || valeur === undefined) {
    throw new Error(`${nom} ne doit pas etre null ou undefined`);
  }
}

// Utilisation
function afficherProfil(nom: string | null, age: number | undefined): void {
  assertDefini(nom, "nom");
  // nom est maintenant string (pas string | null)

  assertDefini(age, "age");
  // age est maintenant number (pas number | undefined)

  console.log(`${nom} a ${age} ans`);
}
```

---

## Type predicates (is)

### Concept

Un **type predicate** est une fonction qui retourne `boolean` et qui dit a TypeScript **quel type** la valeur a si le retour est `true` :

```typescript
// Syntaxe : parametre is Type dans le type de retour
function estString(valeur: unknown): valeur is string {
  return typeof valeur === "string";
}

function estNombre(valeur: unknown): valeur is number {
  return typeof valeur === "number";
}

// Utilisation
function traiter(donnee: unknown): void {
  if (estString(donnee)) {
    // Ici, TypeScript sait que donnee est string
    console.log(donnee.toUpperCase());
  } else if (estNombre(donnee)) {
    // Ici, TypeScript sait que donnee est number
    console.log(donnee.toFixed(2));
  }
}
```

### Difference entre is et asserts

```
┌──────────────────────────────────────────────────────────────┐
│  TYPE PREDICATES (is) vs ASSERTIONS (asserts)                 │
├──────────────────────────────┬───────────────────────────────┤
│ function est(v): v is T      │ function assert(v): asserts v │
│                              │   is T                        │
├──────────────────────────────┼───────────────────────────────┤
│ Retourne boolean             │ Retourne void (ou throw)      │
│ Utilise dans un if/else      │ Utilise comme assertion        │
│ Ne lance pas d'erreur        │ Lance une erreur si faux      │
│ Le code continue dans        │ Le code apres ne s'execute    │
│ les deux branches            │ que si la condition est vraie  │
└──────────────────────────────┴───────────────────────────────┘
```

### Cas d'usage avances

```typescript
// Type predicate pour des interfaces
interface Chat {
  type: "chat";
  nom: string;
  ronronne: boolean;
}

interface Chien {
  type: "chien";
  nom: string;
  aboie: boolean;
}

type Animal = Chat | Chien;

function estChat(animal: Animal): animal is Chat {
  return animal.type === "chat";
}

function estChien(animal: Animal): animal is Chien {
  return animal.type === "chien";
}

// Utilisation
function decrire(animal: Animal): string {
  if (estChat(animal)) {
    // animal est Chat
    return `${animal.nom} ${animal.ronronne ? "ronronne" : "ne ronronne pas"}`;
  }
  // animal est forcement Chien (par elimination)
  return `${animal.nom} ${animal.aboie ? "aboie" : "n'aboie pas"}`;
}

// Filtrer un tableau avec un type predicate
const animaux: Animal[] = [
  { type: "chat", nom: "Moustache", ronronne: true },
  { type: "chien", nom: "Rex", aboie: true },
  { type: "chat", nom: "Felix", ronronne: false },
];

// .filter avec type predicate retourne le bon type !
const chats: Chat[] = animaux.filter(estChat);
// chats est Chat[] (pas Animal[]) grace au type predicate
```

---

## Generiques dans les fonctions (apercu)

### Le probleme

Parfois, on veut ecrire une fonction qui fonctionne avec **n'importe quel type** tout en gardant la relation entre les types :

```typescript
// MAUVAIS — Perd l'information de type
function premier(tableau: unknown[]): unknown {
  return tableau[0];
}

const resultat = premier([1, 2, 3]); // unknown — on a perdu le fait que c'est number

// BON — Generique avec <T>
function premierElement<T>(tableau: T[]): T | undefined {
  return tableau[0];
}

const nombre = premierElement([1, 2, 3]);      // number | undefined
const texte = premierElement(["a", "b", "c"]); // string | undefined
// TypeScript infere T automatiquement !
```

### Syntaxe de base

```typescript
// <T> est un "parametre de type" — une variable pour les types
function identite<T>(valeur: T): T {
  return valeur;
}

// TypeScript infere T
identite(42);        // T = number, retour = number
identite("hello");   // T = string, retour = string
identite(true);      // T = boolean, retour = boolean

// On peut aussi specifier T explicitement
identite<string>("hello"); // T = string

// Plusieurs parametres de type
function paire<A, B>(premier: A, second: B): [A, B] {
  return [premier, second];
}

const p = paire("hello", 42);  // [string, number]
const p2 = paire(true, [1]);   // [boolean, number[]]
```

### Analogie — Les generiques comme des boites

Les generiques, c'est comme des **boites etiquetees** :

- `function emballer<T>(objet: T): Boite<T>` = "Donne-moi n'importe quel objet, je te le mets dans une boite du meme type."
- Si tu me donnes un **livre**, tu recuperes une **boite a livres**.
- Si tu me donnes un **bijou**, tu recuperes une **boite a bijoux**.
- La boite s'adapte a son contenu.

```typescript
interface Boite<T> {
  contenu: T;
  etiquette: string;
}

function emballer<T>(objet: T, etiquette: string): Boite<T> {
  return { contenu: objet, etiquette };
}

const boiteLivre = emballer({ titre: "TypeScript" }, "Livre");
// Boite<{ titre: string }>

const boiteNombre = emballer(42, "Nombre");
// Boite<number>
```

> Les generiques seront explores en profondeur dans un module dedie. Ceci n'est qu'un apercu.

---

## Pratique

### Exercice 1 — Fonctions de base

Ecris les fonctions suivantes avec les bons types :

1. `estPair(n)` — retourne `true` si un nombre est pair
2. `tronquer(texte, longueurMax)` — tronque un texte et ajoute "..." si necessaire
3. `calculerMoyenne(...notes)` — calcule la moyenne d'un nombre variable de notes

<details>
<summary>Solution</summary>

```typescript
// 1. estPair
function estPair(n: number): boolean {
  return n % 2 === 0;
}

console.log(estPair(4));  // true
console.log(estPair(7));  // false

// 2. tronquer
function tronquer(texte: string, longueurMax: number): string {
  if (texte.length <= longueurMax) {
    return texte;
  }
  return texte.substring(0, longueurMax) + "...";
}

console.log(tronquer("Bonjour le monde", 10)); // "Bonjour le..."
console.log(tronquer("Court", 10));             // "Court"

// 3. calculerMoyenne
function calculerMoyenne(...notes: number[]): number {
  if (notes.length === 0) {
    return 0;
  }
  const somme = notes.reduce((acc, note) => acc + note, 0);
  return somme / notes.length;
}

console.log(calculerMoyenne(15, 12, 18, 14)); // 14.75
console.log(calculerMoyenne(20));              // 20
console.log(calculerMoyenne());                // 0
```

</details>

### Exercice 2 — Parametres optionnels et par defaut

Cree une fonction `formaterNom` qui :
- Prend un `prenom` (obligatoire), un `nom` (obligatoire), et un `titre` (optionnel)
- Prend un `format` avec valeur par defaut "complet"
- Si format = "complet" : retourne "Mme Alice DUPONT"
- Si format = "court" : retourne "A. DUPONT"
- Si format = "informel" : retourne "Alice"

<details>
<summary>Solution</summary>

```typescript
function formaterNom(
  prenom: string,
  nom: string,
  titre?: string,
  format: "complet" | "court" | "informel" = "complet"
): string {
  const nomMajuscule = nom.toUpperCase();
  const prefixe = titre ? `${titre} ` : "";

  switch (format) {
    case "complet":
      return `${prefixe}${prenom} ${nomMajuscule}`;
    case "court":
      return `${prefixe}${prenom[0]}. ${nomMajuscule}`;
    case "informel":
      return prenom;
  }
}

console.log(formaterNom("Alice", "Dupont"));
// "Alice DUPONT"

console.log(formaterNom("Alice", "Dupont", "Mme"));
// "Mme Alice DUPONT"

console.log(formaterNom("Alice", "Dupont", undefined, "court"));
// "A. DUPONT"

console.log(formaterNom("Alice", "Dupont", undefined, "informel"));
// "Alice"
```

</details>

### Exercice 3 — Surcharges

Cree une fonction `convertir` avec surcharges :
- `convertir(valeur: string)` retourne un `number` (parse le string)
- `convertir(valeur: number)` retourne un `string` (convertit en string)
- `convertir(valeur: boolean)` retourne un `number` (true → 1, false → 0)

<details>
<summary>Solution</summary>

```typescript
// Declarations de surcharge
function convertir(valeur: string): number;
function convertir(valeur: number): string;
function convertir(valeur: boolean): number;

// Implementation
function convertir(valeur: string | number | boolean): number | string {
  if (typeof valeur === "string") {
    const parsed = parseFloat(valeur);
    if (isNaN(parsed)) {
      throw new Error(`Impossible de convertir "${valeur}" en nombre`);
    }
    return parsed;
  }

  if (typeof valeur === "number") {
    return valeur.toString();
  }

  // boolean
  return valeur ? 1 : 0;
}

// Tests
const n: number = convertir("42.5");      // 42.5
const s: string = convertir(42);            // "42"
const b: number = convertir(true);          // 1
const b2: number = convertir(false);        // 0

console.log(n, typeof n);   // 42.5 number
console.log(s, typeof s);   // "42" string
console.log(b, typeof b);   // 1 number
```

</details>

### Exercice 4 — Type predicates

Cree les type predicates suivants et utilise-les :

1. `estTableauDeNombres(valeur: unknown): valeur is number[]`
2. `estObjetAvecNom(valeur: unknown): valeur is { nom: string }`
3. Une fonction `decrire(valeur: unknown): string` qui utilise ces predicates

<details>
<summary>Solution</summary>

```typescript
// 1. Type predicate pour tableau de nombres
function estTableauDeNombres(valeur: unknown): valeur is number[] {
  return (
    Array.isArray(valeur) && valeur.every((item) => typeof item === "number")
  );
}

// 2. Type predicate pour objet avec nom
function estObjetAvecNom(valeur: unknown): valeur is { nom: string } {
  return (
    typeof valeur === "object" &&
    valeur !== null &&
    "nom" in valeur &&
    typeof (valeur as { nom: unknown }).nom === "string"
  );
}

// 3. Fonction decrire
function decrire(valeur: unknown): string {
  if (estTableauDeNombres(valeur)) {
    // valeur est number[]
    const somme = valeur.reduce((acc, n) => acc + n, 0);
    return `Tableau de ${valeur.length} nombres, somme = ${somme}`;
  }

  if (estObjetAvecNom(valeur)) {
    // valeur est { nom: string }
    return `Objet avec nom = "${valeur.nom}"`;
  }

  if (typeof valeur === "string") {
    return `Chaine de ${valeur.length} caracteres`;
  }

  return `Type inconnu : ${typeof valeur}`;
}

// Tests
console.log(decrire([1, 2, 3]));
// "Tableau de 3 nombres, somme = 6"

console.log(decrire({ nom: "Alice", age: 30 }));
// "Objet avec nom = "Alice""

console.log(decrire("Bonjour"));
// "Chaine de 7 caracteres"

console.log(decrire(true));
// "Type inconnu : boolean"
```

</details>

### Exercice 5 — Systeme d'evenements type

Cree un mini systeme d'evenements (EventEmitter simplifie) avec :
- Une methode `on(event, callback)` pour ecouter un evenement
- Une methode `emit(event, data)` pour emettre un evenement
- Typage correct des callbacks

<details>
<summary>Solution</summary>

```typescript
// Type pour les listeners
type Listener<T> = (data: T) => void;

// Classe EventEmitter typee
class EventEmitter {
  private listeners: Map<string, Listener<unknown>[]> = new Map();

  on<T>(evenement: string, callback: Listener<T>): void {
    const existants = this.listeners.get(evenement) ?? [];
    existants.push(callback as Listener<unknown>);
    this.listeners.set(evenement, existants);
  }

  emit<T>(evenement: string, data: T): void {
    const callbacks = this.listeners.get(evenement) ?? [];
    callbacks.forEach((cb) => (cb as Listener<T>)(data));
  }

  off(evenement: string): void {
    this.listeners.delete(evenement);
  }
}

// Utilisation
const emitter = new EventEmitter();

// Ecouter l'evenement "message"
emitter.on<{ texte: string; auteur: string }>("message", (data) => {
  console.log(`[${data.auteur}] ${data.texte}`);
});

// Ecouter l'evenement "connexion"
emitter.on<{ utilisateur: string }>("connexion", (data) => {
  console.log(`${data.utilisateur} s'est connecte`);
});

// Emettre des evenements
emitter.emit("connexion", { utilisateur: "Alice" });
// "Alice s'est connecte"

emitter.emit("message", { texte: "Salut !", auteur: "Alice" });
// "[Alice] Salut !"
```

</details>

---

## Recapitulatif

```
┌──────────────────────────────────────────────────────────────┐
│                   CE QUE TU AS APPRIS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Typer les fonctions : parametres + retour                │
│     function f(param: Type): TypeRetour { ... }              │
│                                                              │
│  2. Parametres optionnels (?) et par defaut (=)              │
│     - ? : le parametre est T | undefined                     │
│     - = : le parametre a une valeur par defaut               │
│                                                              │
│  3. Rest parameters : ...args: Type[]                        │
│                                                              │
│  4. Surcharges : plusieurs signatures pour une fonction      │
│     - Signatures publiques declarees avant l'implementation  │
│     - Plus specifique en premier                             │
│                                                              │
│  5. Callbacks : (param: Type) => ReturnType                  │
│     - void dans les callbacks = retour ignore                │
│                                                              │
│  6. this typing : premier parametre special (efface)         │
│                                                              │
│  7. asserts : narrowing apres assertion (throw si faux)      │
│     is : narrowing conditionnel (retourne boolean)           │
│                                                              │
│  8. Generiques <T> : fonctions parametrees par un type       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Pour aller plus loin

Dans le prochain module, **03 — Objets — Interfaces, Type Aliases & Structural Typing**, nous allons decouvrir :

- Comment definir la **forme** des objets avec des interfaces et des type aliases
- La difference entre `interface` et `type`
- Le concept de **structural typing** (duck typing)
- Les proprietes `readonly`, optionnelles, et les index signatures
- La composition avec les **intersections** (`&`)

> **Conseil** : Entraine-toi a ecrire des fonctions avec des surcharges et des type predicates. Ce sont des outils puissants que tu utiliseras regulierement dans du code TypeScript professionnel.
