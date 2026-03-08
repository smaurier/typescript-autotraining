# 01 — Types primitifs, Inference & Strict Mode

> **Duree estimee** : 3h30
> **Difficulte** : 1/5
> **Prerequis** : Module 00 (installation TypeScript, premier fichier .ts, tsconfig.json)
> **Objectifs** :
> - Maitriser tous les **types primitifs** de TypeScript
> - Comprendre le systeme d'**inference de types**
> - Savoir quand annoter et quand laisser TypeScript inferer
> - Eviter le piege de `any` et utiliser `unknown` a la place
> - Comprendre `void`, `never`, et les **literal types**
> - Maitriser `as`, `!` et l'operateur `satisfies`

---

## Les types primitifs de TypeScript

### Vue d'ensemble

TypeScript herite des types primitifs de JavaScript et leur ajoute un systeme de verification statique :

```
┌──────────────────────────────────────────────────────────────┐
│                   TYPES PRIMITIFS                              │
├──────────────┬───────────────────────────────────────────────┤
│ string       │ Chaines de caracteres : "hello", `template`   │
│ number       │ Nombres : 42, 3.14, -7, Infinity, NaN         │
│ boolean      │ Booleens : true, false                         │
│ null         │ Absence intentionnelle de valeur              │
│ undefined    │ Variable declaree mais non initialisee        │
│ bigint       │ Tres grands entiers : 9007199254740991n       │
│ symbol       │ Identifiants uniques : Symbol("description")  │
└──────────────┴───────────────────────────────────────────────┘
```

### string

Le type `string` represente les chaines de caracteres :

```typescript
// Annotations explicites
const prenom: string = "Alice";
const nom: string = 'Dupont';
const message: string = `Bonjour ${prenom} ${nom}`;

// Template literals
const multiLigne: string = `
  Premiere ligne
  Deuxieme ligne
`;

// Methodes courantes — TypeScript connait le type de retour
const majuscules: string = prenom.toUpperCase();    // "ALICE"
const longueur: number = prenom.length;              // 5
const contient: boolean = message.includes("Alice"); // true

// Erreurs detectees par TypeScript
// const erreur: string = 42;
// Type 'number' is not assignable to type 'string'
```

### number

Le type `number` represente tous les nombres (entiers et decimaux) :

```typescript
// Entiers et decimaux
const age: number = 30;
const prix: number = 19.99;
const negatif: number = -42;

// Valeurs speciales de number
const infini: number = Infinity;
const moinsInfini: number = -Infinity;
const pasUnNombre: number = NaN; // "Not a Number" est... un number !

// Notation scientifique, binaire, octale, hexadecimale
const million: number = 1_000_000;     // Separateur visuel (underscore)
const binaire: number = 0b1010;        // 10 en binaire
const octal: number = 0o744;           // Permissions Unix
const hexa: number = 0xFF;             // 255

// Methodes utiles
const arrondi: number = Math.round(3.7);     // 4
const aleatoire: number = Math.random();     // 0 a 1
const entier: number = parseInt("42", 10);   // 42

// Attention au piege classique
console.log(0.1 + 0.2 === 0.3); // false ! (probleme de flottants)
console.log(0.1 + 0.2);         // 0.30000000000000004
```

### boolean

Le type `boolean` ne peut prendre que deux valeurs : `true` ou `false` :

```typescript
const estActif: boolean = true;
const estAdmin: boolean = false;

// Resultat d'une comparaison
const estMajeur: boolean = age >= 18;     // true
const estVide: boolean = nom.length === 0; // false

// Operations logiques
const peutModifier: boolean = estActif && estAdmin;  // false
const peutVoir: boolean = estActif || estAdmin;       // true
const estInactif: boolean = !estActif;                // false

// Erreur courante : ne pas confondre boolean et truthy/falsy
// const erreur: boolean = "hello"; // Type 'string' is not assignable to type 'boolean'
// const ok: boolean = Boolean("hello"); // true — conversion explicite
```

### null et undefined

En TypeScript avec `strictNullChecks` (inclus dans `strict: true`), `null` et `undefined` sont des types distincts :

```typescript
// null — Absence intentionnelle de valeur
let utilisateurConnecte: string | null = null;

// L'utilisateur se connecte
utilisateurConnecte = "Alice";

// L'utilisateur se deconnecte
utilisateurConnecte = null;

// undefined — Variable declaree mais non initialisee
let tache: string | undefined;
console.log(tache); // undefined

tache = "Faire les courses";
console.log(tache); // "Faire les courses"
```

### Analogie — null vs undefined

Imagine un formulaire papier :

- **`undefined`** = Le champ n'existe meme pas sur le formulaire. Personne n'a pense a le mettre.
- **`null`** = Le champ existe, mais la personne l'a volontairement laisse **vide**.

```typescript
// L'objet "formulaire"
interface Formulaire {
  nom: string;
  telephone: string | null;    // Le champ existe, peut etre vide
  // fax n'est meme pas dans l'interface — il est "undefined"
}

const inscription: Formulaire = {
  nom: "Alice",
  telephone: null, // Alice a choisi de ne pas donner son numero
};
```

### Convention en TypeScript

```
┌─────────────────────────────────────────────────────────────┐
│  CONVENTION RECOMMANDEE                                      │
│                                                              │
│  Prefere `undefined` a `null` dans la plupart des cas.       │
│                                                              │
│  - Utilise undefined pour "pas encore defini"                │
│  - Utilise null quand tu veux explicitement signaler         │
│    "cette valeur est intentionnellement absente"             │
│  - Beaucoup de developpeurs TypeScript utilisent             │
│    exclusivement undefined pour simplifier                   │
└─────────────────────────────────────────────────────────────┘
```

### bigint

Le type `bigint` permet de manipuler des entiers plus grands que `Number.MAX_SAFE_INTEGER` (2^53 - 1) :

```typescript
// Les grands nombres posent probleme avec number
const maxSafe: number = Number.MAX_SAFE_INTEGER; // 9007199254740991
console.log(maxSafe + 1 === maxSafe + 2); // true ! Perte de precision

// bigint resout ce probleme
const grandNombre: bigint = 9007199254740991n;  // Suffixe 'n'
const tresTresGrand: bigint = BigInt("99999999999999999999999999999");

// Operations arithmetiques
const somme: bigint = grandNombre + 1n;
const produit: bigint = grandNombre * 2n;

// Attention : on ne peut PAS melanger number et bigint
// const erreur = grandNombre + 1;
// Operator '+' cannot be applied to types 'bigint' and 'number'

// Il faut convertir explicitement
const mixte: bigint = grandNombre + BigInt(1);
```

### symbol

Le type `symbol` cree des identifiants uniques :

```typescript
// Chaque symbol est unique
const id1: symbol = Symbol("id");
const id2: symbol = Symbol("id");
console.log(id1 === id2); // false ! Meme description, mais differents

// Cas d'usage : cles uniques d'objets
const CLE_SECRETE: unique symbol = Symbol("maClé");

interface Coffre {
  [CLE_SECRETE]: string;
  contenu: string;
}

const coffre: Coffre = {
  [CLE_SECRETE]: "code-1234",
  contenu: "tresor",
};

// 'unique symbol' est un sous-type de symbol
// Il ne peut etre assigne qu'a une const
```

> Les `symbol` sont rarement utilises au quotidien. Tu les rencontreras principalement dans des librairies avancees ou avec les iterateurs (`Symbol.iterator`).

---

## L'inference de types

### Qu'est-ce que l'inference ?

TypeScript peut **deviner** (inferer) le type d'une variable a partir de sa valeur initiale. Tu n'as pas toujours besoin d'ecrire le type explicitement :

```typescript
// Annotation explicite (pas toujours necessaire)
const prenom: string = "Alice";

// Inference automatique (TypeScript devine le type)
const prenom2 = "Alice"; // TypeScript infere: string? Non! "Alice" (literal type)

// Pour let, l'inference est differente
let age = 30;         // TypeScript infere: number (pas 30)
let nom = "Alice";    // TypeScript infere: string (pas "Alice")
```

### Analogie — Le detective

L'inference de types, c'est comme un **detective** qui observe les indices :

- Tu ecris `const x = 42` — le detective voit un nombre et conclut : "C'est un `number`"
- Tu ecris `const y = "hello"` — le detective voit des guillemets et conclut : "C'est un `string`"
- Tu n'as pas besoin de lui dire, il **deduit** tout seul !

### let vs const : l'inference change

C'est une subtilite importante. TypeScript infere **differemment** selon que tu utilises `let` ou `const` :

```typescript
// === const : infere le type LITERAL (le plus precis possible) ===
const couleur = "rouge";    // Type infere: "rouge" (pas string !)
const nombre = 42;           // Type infere: 42 (pas number !)
const actif = true;          // Type infere: true (pas boolean !)

// === let : infere le type GENERAL (car la valeur peut changer) ===
let couleur2 = "rouge";     // Type infere: string
let nombre2 = 42;            // Type infere: number
let actif2 = true;           // Type infere: boolean

// Pourquoi ? Parce que let peut etre reassigne :
couleur2 = "bleu";   // OK — "bleu" est un string
nombre2 = 100;        // OK — 100 est un number

// Mais const ne peut PAS etre reassigne :
// couleur = "bleu"; // Cannot assign to 'couleur' because it is a constant
```

### Tableau comparatif

```
┌──────────────────────────────────────────────────────────────┐
│  INFERENCE : let vs const                                     │
├────────────────┬──────────────────┬──────────────────────────┤
│ Declaration    │ Type infere      │ Pourquoi                  │
├────────────────┼──────────────────┼──────────────────────────┤
│ const x = 42   │ 42 (literal)     │ Jamais reassigne          │
│ let x = 42     │ number           │ Pourrait devenir 100      │
│ const s = "hi" │ "hi" (literal)   │ Jamais reassigne          │
│ let s = "hi"   │ string           │ Pourrait devenir "bye"    │
│ const b = true │ true (literal)   │ Jamais reassigne          │
│ let b = true   │ boolean          │ Pourrait devenir false    │
└────────────────┴──────────────────┴──────────────────────────┘
```

---

## Literal Types (types litteraux)

### Concept

Un **literal type** est un type qui ne peut prendre qu'une seule valeur precise :

```typescript
// Types litteraux explicites
let direction: "nord" | "sud" | "est" | "ouest";
direction = "nord";  // OK
direction = "sud";   // OK
// direction = "haut"; // Erreur : Type '"haut"' is not assignable

// Types litteraux numeriques
let codeHTTP: 200 | 404 | 500;
codeHTTP = 200;  // OK
codeHTTP = 404;  // OK
// codeHTTP = 302; // Erreur !

// Types litteraux booleens
let vrai: true = true;
// vrai = false; // Erreur : Type 'false' is not assignable to type 'true'
```

### Cas d'usage concret

```typescript
// Configuration avec des valeurs precises
interface ConfigServeur {
  port: number;
  environnement: "development" | "staging" | "production";
  logLevel: "debug" | "info" | "warn" | "error";
  ssl: boolean;
}

const config: ConfigServeur = {
  port: 3000,
  environnement: "development",
  logLevel: "debug",
  ssl: false,
};

// L'editeur propose les valeurs valides par autocompletion !
// config.environnement = "dev"; // Erreur : seules 3 valeurs possibles
config.environnement = "production"; // OK
```

---

## Type annotations vs inference — Quand annoter ?

### La regle d'or

```
┌──────────────────────────────────────────────────────────────┐
│  REGLE D'OR DE L'ANNOTATION                                  │
│                                                              │
│  Laisse TypeScript inferer quand c'est EVIDENT.              │
│  Annote quand c'est AMBIGU ou quand ca sert de DOCUMENTATION.│
│                                                              │
│  INFERER (ne pas annoter) :                                  │
│  - Variables initialisees avec une valeur claire              │
│  - Retour de fonctions simples                               │
│                                                              │
│  ANNOTER (ecrire le type) :                                  │
│  - Parametres de fonctions (TOUJOURS)                        │
│  - Types de retour de fonctions publiques/exportees          │
│  - Variables sans initialisation                             │
│  - Quand l'inference ne donne pas le type desire             │
└──────────────────────────────────────────────────────────────┘
```

### Exemples pratiques

```typescript
// === Laisser inferer (BIEN) ===
const age = 30;                    // Evident : c'est un number
const noms = ["Alice", "Bob"];     // Evident : string[]
const estValide = age > 18;        // Evident : boolean

// === Annoter (BIEN) ===
function calculerTTC(montantHT: number, tva: number): number {
  return montantHT * (1 + tva);
}
// Les parametres DOIVENT etre annotes (TypeScript ne peut pas deviner)

// Variable non initialisee — annotation obligatoire
let resultat: number;
resultat = calculerTTC(100, 0.2);

// Quand l'inference n'est pas assez precise
const reponse: "oui" | "non" = "oui"; // Sans annotation, ce serait juste string

// === Sur-annotation (INUTILE) ===
// Eviter ca — c'est du bruit visuel :
const prenom: string = "Alice";           // string est infere, pas besoin
const nombres: number[] = [1, 2, 3];     // number[] est infere
const actif: boolean = true;              // boolean est infere
```

### Inference dans les fonctions

```typescript
// TypeScript infere le type de retour automatiquement
function additionner(a: number, b: number) {
  return a + b; // Retour infere : number
}

// Mais pour les fonctions exportees, mieux vaut etre explicite
export function calculerRemise(
  prix: number,
  pourcentage: number
): number {
  return prix * (1 - pourcentage / 100);
}

// L'inference fonctionne aussi avec les objets
function creerUtilisateur(nom: string, age: number) {
  return { nom, age, actif: true };
  // Retour infere : { nom: string; age: number; actif: boolean }
}

const alice = creerUtilisateur("Alice", 30);
// alice est de type { nom: string; age: number; actif: boolean }
alice.nom;    // string
alice.age;    // number
alice.actif;  // boolean
```

---

## any — Le type a eviter

### Qu'est-ce que any ?

`any` est le type qui **desactive completement** la verification de types. C'est comme enlever la ceinture de securite :

```typescript
// Avec any, TOUT est permis — meme les absurdites
let nimporteQuoi: any = 42;
nimporteQuoi = "hello";
nimporteQuoi = true;
nimporteQuoi = { x: 1 };
nimporteQuoi = [1, 2, 3];

// Aucune verification — TypeScript ferme les yeux
nimporteQuoi.methodeQuiExistePas();     // Pas d'erreur !
nimporteQuoi.propriete.sous.profonde;    // Pas d'erreur !
nimporteQuoi * "hello";                  // Pas d'erreur !
// Tout ca va crasher au runtime, mais TypeScript ne previent pas.
```

### Analogie — Le virus any

`any` se propage comme un **virus** dans ton code :

```typescript
// any se propage a tout ce qu'il touche
function traiter(donnees: any) {
  const resultat = donnees.valeur;  // resultat est 'any' aussi !
  const calcul = resultat * 2;      // calcul est 'any' aussi !
  return calcul;                     // retour est 'any' aussi !
}

// Maintenant, tout code qui appelle 'traiter' est contamine
const x = traiter({ valeur: 42 });  // x est 'any'
const y = x + "hello";              // y est 'any'
// La verification de types est completement perdue dans toute la chaine
```

### Quand any apparait-il ?

```typescript
// 1. Annotations explicites (a eviter !)
const data: any = fetchData();

// 2. Implicitement sans strict mode
// Desactive noImplicitAny et les parametres sans type deviennent 'any'
function calculer(a, b) { return a + b; } // 'a' et 'b' sont 'any'

// 3. Fichiers .js sans declarations de types
// Les imports de fichiers JS sans types sont 'any'

// 4. JSON.parse retourne 'any'
const config = JSON.parse('{"port": 3000}'); // config est 'any' !
```

### Comment eviter any

```typescript
// Au lieu de any, utilise un type precis ou unknown

// MAUVAIS
function parseJSON(texte: string): any {
  return JSON.parse(texte);
}

// BON — Utilise un generique ou unknown
function parseJSON(texte: string): unknown {
  return JSON.parse(texte);
}

// BON — Utilise un type precis
interface Config {
  port: number;
  host: string;
}

function parseConfig(texte: string): Config {
  const parsed: unknown = JSON.parse(texte);
  // Valider ici avant de retourner...
  return parsed as Config; // assertion apres validation
}
```

---

## unknown — L'alternative sure a any

### Concept

`unknown` est le **type-safe counterpart** de `any`. C'est un type qui accepte n'importe quelle valeur, mais qui **t'oblige a verifier** le type avant de l'utiliser :

```typescript
// unknown accepte n'importe quelle valeur (comme any)
let valeur: unknown = 42;
valeur = "hello";
valeur = true;
valeur = { x: 1 };

// MAIS tu ne peux rien faire avec sans verifier d'abord !
// valeur.toUpperCase();    // Erreur ! 'valeur' is of type 'unknown'
// valeur * 2;              // Erreur ! Object is of type 'unknown'
// valeur.propriete;        // Erreur !

// Il FAUT verifier le type avant d'agir (narrowing)
if (typeof valeur === "string") {
  console.log(valeur.toUpperCase()); // OK ! TypeScript sait que c'est un string
}

if (typeof valeur === "number") {
  console.log(valeur * 2); // OK ! TypeScript sait que c'est un number
}
```

### Analogie — Le colis suspect

- **`any`** = Un colis arrive, tu l'ouvres directement sans verifier. Ca pourrait etre un cadeau ou une bombe.
- **`unknown`** = Un colis arrive, tu ne peux pas l'ouvrir tant que tu n'as pas passe le colis au scanner de securite. Tu verifies d'abord, tu ouvres ensuite.

### Comparaison any vs unknown

```
┌──────────────────────────────────────────────────────────────┐
│              any vs unknown                                    │
├──────────────────────────────┬───────────────────────────────┤
│           any                │          unknown               │
├──────────────────────────────┼───────────────────────────────┤
│ Accepte toute valeur         │ Accepte toute valeur           │
│ Permet TOUTE operation       │ Interdit TOUTE operation       │
│ Pas de verification          │ Oblige a verifier avant       │
│ Se propage comme un virus    │ Force le narrowing             │
│ DANGEREUX                    │ SUR                            │
│ A EVITER                     │ A PREFERER                     │
└──────────────────────────────┴───────────────────────────────┘
```

### Cas d'usage concret

```typescript
// Gestion d'erreurs — catch renvoie unknown en mode strict
try {
  // du code qui peut echouer
  throw new Error("quelque chose s'est mal passe");
} catch (erreur: unknown) {
  // erreur est 'unknown' — on ne peut pas directement acceder a .message
  // erreur.message; // Erreur !

  // On doit verifier d'abord
  if (erreur instanceof Error) {
    console.error(erreur.message); // OK maintenant
  } else if (typeof erreur === "string") {
    console.error(erreur);
  } else {
    console.error("Erreur inconnue", erreur);
  }
}
```

---

## void et never

### void — Absence de valeur de retour

`void` est utilise pour les fonctions qui ne retournent **rien** :

```typescript
// void signifie "cette fonction ne retourne rien d'utile"
function logMessage(message: string): void {
  console.log(message);
  // Pas de 'return' ou 'return;' sans valeur
}

// Utilisation
logMessage("Hello"); // OK
// const resultat = logMessage("Hello"); // resultat est 'void' — inutile

// void vs undefined
function retourneVoid(): void {
  // pas de return
}

function retourneUndefined(): undefined {
  return undefined; // Doit retourner explicitement undefined
}

// En pratique, utilise void pour les fonctions sans retour
```

### never — L'impossible

`never` est le type qui represente les valeurs qui **n'existent jamais**. C'est le type d'une fonction qui ne retourne **jamais** :

```typescript
// Fonction qui lance toujours une erreur — ne retourne jamais
function lancerErreur(message: string): never {
  throw new Error(message);
}

// Boucle infinie — ne retourne jamais
function boucleInfinie(): never {
  while (true) {
    // ne sort jamais de la boucle
  }
}

// never est utile pour la verification exhaustive (on verra en module 04)
type Couleur = "rouge" | "vert" | "bleu";

function afficherCouleur(couleur: Couleur): string {
  switch (couleur) {
    case "rouge":
      return "#FF0000";
    case "vert":
      return "#00FF00";
    case "bleu":
      return "#0000FF";
    default:
      // Si on arrive ici, c'est qu'on a oublie un cas
      const _exhaustif: never = couleur;
      return _exhaustif;
  }
}
```

### Analogie — void vs never

- **`void`** = Tu envoies une lettre et tu n'attends pas de reponse. La poste fait son travail (la fonction s'execute), mais tu ne recois rien en retour.
- **`never`** = Tu envoies une lettre dans un trou noir. La lettre ne reviendra **jamais**, et rien d'autre ne sortira non plus. La fonction ne termine pas.

---

## Type assertions (as)

### Concept

Une **type assertion** dit a TypeScript : "Fais-moi confiance, je sais quel type c'est." C'est un **override** du systeme de types :

```typescript
// Cas classique : le DOM
// document.getElementById retourne HTMLElement | null
const input = document.getElementById("mon-input");
// input est de type HTMLElement | null

// Tu SAIS que c'est un input, tu fais une assertion :
const inputTyped = document.getElementById("mon-input") as HTMLInputElement;
inputTyped.value = "Hello"; // OK — HTMLInputElement a une propriete 'value'

// Sans assertion, TypeScript ne sait pas que c'est un input :
// input.value = "Hello"; // Erreur : 'value' does not exist on type 'HTMLElement'
```

### Syntaxe

```typescript
// Syntaxe 1 : avec 'as' (recommandee)
const longueur = (donnee as string).length;

// Syntaxe 2 : avec angle brackets (eviter dans JSX/TSX)
const longueur2 = (<string>donnee).length;

// Recommandation : toujours utiliser 'as'
```

### Regles de securite

```typescript
// TypeScript ne permet PAS les assertions completement impossibles
const nombre: number = 42;
// const texte = nombre as string;
// Erreur : Conversion of type 'number' to type 'string' may be a mistake

// Pour forcer (double assertion — a eviter si possible)
const texte = nombre as unknown as string; // Compile mais DANGEREUX

// Assertion vers un type plus precis — OK et courant
const element = document.querySelector(".bouton") as HTMLButtonElement;

// Assertion vers un type plus general — OK aussi
const valeur: string = "hello";
const general = valeur as string | number; // Elargir le type
```

### Quand utiliser les assertions ?

```
┌──────────────────────────────────────────────────────────────┐
│  QUAND UTILISER 'as'                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  BON usage :                                                 │
│  - DOM : document.getElementById() as HTMLInputElement       │
│  - API externe non typee : response.json() as MaReponse     │
│  - Migration JS → TS : temporairement forcer les types      │
│                                                              │
│  MAUVAIS usage :                                             │
│  - Pour faire taire une erreur sans comprendre              │
│  - Pour eviter de corriger un vrai probleme de type         │
│  - En remplacement d'un type guard (module 04)              │
│                                                              │
│  REGLE : Si tu utilises beaucoup de 'as', c'est un signe   │
│  que tes types ne sont pas bien definis.                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Non-null assertion (!)

### Concept

L'operateur `!` (non-null assertion) dit a TypeScript : "Cette valeur n'est **jamais** `null` ni `undefined`, je te le garantis."

```typescript
// Sans assertion : TypeScript se plaint
const element = document.getElementById("titre");
// element est de type HTMLElement | null

// element.textContent = "Bonjour";
// Erreur : 'element' is possibly 'null'

// Avec non-null assertion
const element2 = document.getElementById("titre")!;
// element2 est de type HTMLElement (null a ete retire)
element2.textContent = "Bonjour"; // OK

// Equivalent a :
const element3 = document.getElementById("titre") as HTMLElement;
```

### Attention : c'est une promesse, pas une verification

```typescript
// Le ! ne verifie RIEN au runtime
// Si l'element n'existe pas, ca crashera quand meme !

// DANGEREUX
const bouton = document.getElementById("bouton-inexistant")!;
bouton.click(); // TypeError au runtime : Cannot read properties of null

// MIEUX : Verifier explicitement
const bouton2 = document.getElementById("bouton-inexistant");
if (bouton2) {
  bouton2.click(); // Safe — TypeScript et le runtime sont d'accord
}
```

### Quand utiliser !

```typescript
// 1. Quand tu es CERTAIN que la valeur existe
// (par exemple, un element HTML que tu as toi-meme mis dans le DOM)
const app = document.getElementById("app")!;

// 2. Dans des tests ou tu controles l'environnement
const utilisateur = getUtilisateurTest()!;

// 3. Jamais dans du code metier critique — prefere une verification
```

---

## L'operateur satisfies

### Concept (TypeScript 4.9+)

L'operateur `satisfies` verifie qu'une valeur est **compatible** avec un type, **sans changer** le type infere :

```typescript
// Le probleme SANS satisfies
type Couleur = "rouge" | "vert" | "bleu" | [number, number, number];

// Avec annotation de type — on perd la precision
const palette: Record<string, Couleur> = {
  primaire: "rouge",
  secondaire: [0, 128, 0],
};
// palette.primaire est de type Couleur (union)
// On ne peut pas appeler .toUpperCase() directement
// palette.primaire.toUpperCase(); // Erreur ! Couleur n'est pas forcement string

// Avec satisfies — on garde la precision
const palette2 = {
  primaire: "rouge",
  secondaire: [0, 128, 0],
} satisfies Record<string, Couleur>;

// palette2.primaire est de type "rouge" (literal !)
palette2.primaire.toUpperCase(); // OK ! TypeScript sait que c'est un string

// palette2.secondaire est de type [number, number, number]
palette2.secondaire[0]; // OK ! TypeScript sait que c'est un tuple
```

### Analogie — satisfies vs annotation

- **Annotation (`: Type`)** = "Ce colis SERA un cadeau." Le livreur ne te dit pas ce qu'il y a dedans. Tu sais juste que c'est un cadeau.
- **satisfies** = "Verifie que ce colis est un cadeau, mais dis-moi aussi exactement ce qu'il y a dedans." Tu sais que c'est un cadeau ET tu connais le contenu precis.

### Cas d'usage pratiques

```typescript
// 1. Configuration avec des cles connues
type RoutesConfig = Record<string, { path: string; auth: boolean }>;

const routes = {
  accueil: { path: "/", auth: false },
  profil: { path: "/profil", auth: true },
  admin: { path: "/admin", auth: true },
} satisfies RoutesConfig;

// routes.accueil est connu comme { path: "/"; auth: false }
// L'autocompletion connait les cles : accueil, profil, admin
routes.accueil.path; // type: "/"

// Avec annotation, les cles seraient 'string' et on perdrait l'autocompletion


// 2. Verification de conformite sans perte d'information
interface Animal {
  nom: string;
  pattes: number;
}

const monChat = {
  nom: "Moustache",
  pattes: 4,
  ronronne: true,       // Propriete supplementaire permise
} satisfies Animal;

// monChat.ronronne existe et est de type boolean
console.log(monChat.ronronne); // OK !

// Avec annotation de type, 'ronronne' serait rejetee (excess property check)
```

### satisfies vs as vs annotation

```
┌────────────────────────────────────────────────────────────────┐
│  COMPARAISON : annotation, as, satisfies                        │
├──────────────┬─────────────────────────────────────────────────┤
│ : Type       │ Force le type. Perd la precision de l'inference. │
│              │ Verifie a la compilation.                        │
├──────────────┼─────────────────────────────────────────────────┤
│ as Type      │ Force le type. Pas de verification profonde.     │
│              │ Peut masquer des erreurs.                        │
├──────────────┼─────────────────────────────────────────────────┤
│ satisfies    │ Verifie le type SANS changer l'inference.        │
│   Type       │ Le meilleur des deux mondes.                    │
└──────────────┴─────────────────────────────────────────────────┘
```

---

## Pratique

### Exercice 1 — Types primitifs

Declare les variables suivantes avec les bons types :

1. Un prenom (chaine de caracteres)
2. Un age (nombre)
3. Un statut "actif" ou "inactif" (utilise un literal type)
4. Un compteur qui peut etre null
5. Un identifiant unique (symbol)

<details>
<summary>Solution</summary>

```typescript
// 1. Prenom — string
const prenom: string = "Marie";

// 2. Age — number
const age: number = 28;

// 3. Statut — literal type
let statut: "actif" | "inactif" = "actif";

// 4. Compteur nullable
let compteur: number | null = null;
compteur = 42;

// 5. Identifiant unique — symbol
const identifiant: unique symbol = Symbol("utilisateur-id");
```

</details>

### Exercice 2 — Inference

Pour chaque ligne, indique le type infere par TypeScript :

```typescript
const a = 42;
let b = 42;
const c = "bonjour";
let d = "bonjour";
const e = true;
let f = true;
const g = [1, 2, 3];
let h = [1, "deux", true];
const i = { nom: "Alice", age: 30 };
const j = null;
```

<details>
<summary>Solution</summary>

```typescript
const a = 42;           // Type: 42 (literal number)
let b = 42;             // Type: number
const c = "bonjour";    // Type: "bonjour" (literal string)
let d = "bonjour";      // Type: string
const e = true;          // Type: true (literal boolean)
let f = true;            // Type: boolean
const g = [1, 2, 3];    // Type: number[]
let h = [1, "deux", true]; // Type: (string | number | boolean)[]
const i = { nom: "Alice", age: 30 }; // Type: { nom: string; age: number }
const j = null;          // Type: null
```

</details>

### Exercice 3 — any vs unknown

Reecris le code suivant en remplacant `any` par des types plus precis :

```typescript
function traiterReponse(reponse: any): any {
  if (reponse.status === 200) {
    return reponse.data;
  }
  return null;
}

function logErreur(erreur: any): void {
  console.error(erreur.message);
}
```

<details>
<summary>Solution</summary>

```typescript
// Types precis pour la reponse
interface ReponseAPI {
  status: number;
  data: unknown;
  message?: string;
}

function traiterReponse(reponse: ReponseAPI): unknown {
  if (reponse.status === 200) {
    return reponse.data;
  }
  return null;
}

// Gestion d'erreur avec unknown
function logErreur(erreur: unknown): void {
  if (erreur instanceof Error) {
    console.error(erreur.message);
  } else if (typeof erreur === "string") {
    console.error(erreur);
  } else {
    console.error("Erreur inconnue :", erreur);
  }
}
```

</details>

### Exercice 4 — satisfies

Utilise l'operateur `satisfies` pour creer un objet de configuration de theme qui :
- Respecte un type `ThemeConfig`
- Conserve la precision de l'inference (literal types des couleurs)

```typescript
type CouleurCSS = string | [number, number, number];

type ThemeConfig = {
  primaire: CouleurCSS;
  secondaire: CouleurCSS;
  fond: CouleurCSS;
  texte: CouleurCSS;
};
```

<details>
<summary>Solution</summary>

```typescript
type CouleurCSS = string | [number, number, number];

type ThemeConfig = {
  primaire: CouleurCSS;
  secondaire: CouleurCSS;
  fond: CouleurCSS;
  texte: CouleurCSS;
};

// Avec satisfies — on verifie la conformite ET on garde les types precis
const theme = {
  primaire: "#3498db",
  secondaire: [46, 204, 113] as [number, number, number],
  fond: "#ffffff",
  texte: "#333333",
} satisfies ThemeConfig;

// theme.primaire est de type "#3498db" (literal), pas CouleurCSS
// On peut appeler des methodes de string directement :
theme.primaire.startsWith("#"); // OK !

// theme.secondaire est [number, number, number]
// On peut acceder aux index :
const rouge = theme.secondaire[0]; // number

// Sans satisfies, avec annotation de type :
const theme2: ThemeConfig = {
  primaire: "#3498db",
  secondaire: [46, 204, 113],
  fond: "#ffffff",
  texte: "#333333",
};
// theme2.primaire est de type CouleurCSS (union) — moins precis
// theme2.primaire.startsWith("#"); // Erreur ! CouleurCSS n'est pas forcement string
```

</details>

### Exercice 5 — Types et verification

Cree une fonction `formaterValeur` qui :
- Prend un parametre de type `unknown`
- Retourne une `string`
- Gere les cas : `number` (arrondi a 2 decimales), `string` (mise en majuscules), `boolean` ("oui"/"non"), `null`/`undefined` ("N/A"), et tout autre type ("Type non supporte")

<details>
<summary>Solution</summary>

```typescript
function formaterValeur(valeur: unknown): string {
  if (typeof valeur === "number") {
    return valeur.toFixed(2);
  }

  if (typeof valeur === "string") {
    return valeur.toUpperCase();
  }

  if (typeof valeur === "boolean") {
    return valeur ? "oui" : "non";
  }

  if (valeur === null || valeur === undefined) {
    return "N/A";
  }

  return "Type non supporte";
}

// Tests
console.log(formaterValeur(3.14159));    // "3.14"
console.log(formaterValeur("bonjour"));  // "BONJOUR"
console.log(formaterValeur(true));       // "oui"
console.log(formaterValeur(false));      // "non"
console.log(formaterValeur(null));       // "N/A"
console.log(formaterValeur(undefined));  // "N/A"
console.log(formaterValeur({ x: 1 }));  // "Type non supporte"
```

</details>

---

## Recapitulatif

```
┌──────────────────────────────────────────────────────────────┐
│                   CE QUE TU AS APPRIS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Les 7 types primitifs :                                  │
│     string, number, boolean, null, undefined, bigint, symbol │
│                                                              │
│  2. L'inference de types :                                   │
│     - const → literal type (plus precis)                     │
│     - let → type general (string, number, etc.)              │
│                                                              │
│  3. Quand annoter vs laisser inferer :                       │
│     - Toujours annoter les parametres de fonctions           │
│     - Laisser inferer quand c'est evident                    │
│                                                              │
│  4. any = DANGEREUX (se propage, desactive les verifications)│
│     unknown = SUR (oblige a verifier avant d'utiliser)       │
│                                                              │
│  5. void = pas de retour, never = ne retourne jamais         │
│                                                              │
│  6. as = assertion de type (avec precaution)                 │
│     ! = non-null assertion (encore plus de precaution)       │
│                                                              │
│  7. satisfies = verifie le type sans perdre l'inference      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Pour aller plus loin

Dans le prochain module, **02 — Fonctions — Signatures, Surcharges & Callbacks**, nous allons decouvrir :

- Comment typer des fonctions complexes (parametres optionnels, rest, etc.)
- Les surcharges de fonctions (overloads)
- Le typage des callbacks
- Les type predicates (`is`) et assertion functions (`asserts`)
- Un premier apercu des generiques dans les fonctions

> **Conseil** : Avant de passer au module suivant, assure-toi de bien comprendre la difference entre `any` et `unknown`, et l'inference `let` vs `const`. Ce sont des concepts fondamentaux qui reviendront dans tous les modules suivants.
