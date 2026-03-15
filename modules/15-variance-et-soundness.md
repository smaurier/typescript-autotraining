# 15 — Variance, Covariance & Soundness du Type System

| Metadata     | Valeur                                                                 |
|-------------|------------------------------------------------------------------------|
| **Duree**       | 4 heures                                                              |
| **Difficulte**  | 5/5                                                                    |
| **Prerequis**   | Modules 1-14, generics avances, types conditionnels, mapped types     |
| **Objectifs**   | Comprendre la variance, identifier les trous de soundness, ecrire du code type-safe |

---

> **⚠️ Ce module est un cran au-dessus.** C'est normal de galerer ici. Si tu bloques plus de 20 min, relis la theorie du module precedent. Si apres 45 min c'est toujours flou, passe au module suivant et reviens plus tard — certains concepts prennent des jours a decanter.

## Introduction

Bienvenue dans l'un des modules les plus profonds de ce cours. Ici, nous allons
plonger dans les **fondements theoriques** du systeme de types de TypeScript.
Comprendre la variance, c'est comprendre *pourquoi* certaines assignations de types
sont autorisees et d'autres non. C'est la cle pour ecrire du code veritablement
type-safe.

> **Analogie du zoo** : Imaginez un zoo ou chaque enclos a une etiquette.
> L'enclos "Animal" peut-il accueillir un "Chat" ? Oui, car un Chat *est* un Animal.
> Mais un enclos "Chat" peut-il accueillir n'importe quel Animal ? Non, car un Chien
> n'est pas un Chat. La variance, c'est exactement cette logique appliquee aux types
> generiques.

---

## Sous-typage en TypeScript

### Le principe fondamental

En TypeScript, le sous-typage est **structurel**, pas nominal. Cela signifie que
deux types sont compatibles si leurs *structures* sont compatibles, peu importe
leurs noms.

```typescript
// Sous-typage structurel : la forme compte, pas le nom
interface Animal {
  nom: string;
  age: number;
}

interface Chat {
  nom: string;
  age: number;
  ronronne: boolean;
}

// Chat est un sous-type de Animal car il a TOUTES les proprietes de Animal
// (et meme plus)
const minou: Chat = { nom: "Minou", age: 3, ronronne: true };
const animal: Animal = minou; // OK : Chat est assignable a Animal

// L'inverse ne fonctionne pas
// const chat: Chat = animal; // Erreur : 'ronronne' manquant
```

### La relation "est assignable a"

La relation de sous-typage se lit : `A extends B` signifie que `A` est assignable
a `B`. En d'autres termes, partout ou on attend un `B`, on peut passer un `A`.

```typescript
// Hierarchie de types
type Vehicule = { marque: string; vitesseMax: number };
type Voiture = Vehicule & { nombrePortes: number };
type VoitureSport = Voiture & { turbo: boolean };

// VoitureSport extends Voiture extends Vehicule
// VoitureSport est le type le PLUS SPECIFIQUE (le plus "bas")
// Vehicule est le type le PLUS GENERAL (le plus "haut")

function afficherVehicule(v: Vehicule): void {
  console.log(`${v.marque} - max ${v.vitesseMax} km/h`);
}

const maFerrari: VoitureSport = {
  marque: "Ferrari",
  vitesseMax: 330,
  nombrePortes: 2,
  turbo: true,
};

// On peut passer un VoitureSport la ou on attend un Vehicule
afficherVehicule(maFerrari); // OK
```

---

## Covariance (Positions de sortie)

### Definition

Un type generique `F<T>` est **covariant** en `T` si :
- Quand `A extends B`, alors `F<A> extends F<B>`
- La direction du sous-typage est **preservee**

> **Analogie de l'usine** : Si une usine produit des Chats (sortie), et que Chat
> est un sous-type d'Animal, alors cette usine est aussi une "usine a Animaux".
> La covariance s'applique aux **positions de sortie** (ce qu'on produit/retourne).

```typescript
// Covariance : les types en position de SORTIE (retour)
type Producteur<T> = () => T;

type ProducteurAnimal = Producteur<Animal>;
type ProducteurChat = Producteur<Chat>;

// Un producteur de Chat est-il assignable a un producteur d'Animal ?
// OUI ! Car si on attend un Animal en sortie, recevoir un Chat est OK.
const produitChat: ProducteurChat = () => ({
  nom: "Felix",
  age: 2,
  ronronne: true,
});

const produitAnimal: ProducteurAnimal = produitChat; // OK : covariance
const resultat: Animal = produitAnimal(); // On recoit un Chat, qui est un Animal
```

### Covariance dans les tableaux

Les tableaux en TypeScript sont covariants en lecture :

```typescript
// Les tableaux sont covariants (ce qui est un trou de soundness !)
const chats: Chat[] = [
  { nom: "Minou", age: 3, ronronne: true },
  { nom: "Felix", age: 5, ronronne: false },
];

// On peut assigner Chat[] a Animal[] (covariance)
const animaux: Animal[] = chats; // OK... mais dangereux !

// Pourquoi dangereux ? Parce que les tableaux sont MUTABLES
// animaux.push({ nom: "Rex", age: 4 }); // Compile... mais on vient de mettre
// un Animal (sans 'ronronne') dans un tableau de Chats !
```

### readonly et covariance sure

```typescript
// Avec readonly, la covariance est SURE car on ne peut pas muter
const chatsReadonly: readonly Chat[] = [
  { nom: "Minou", age: 3, ronronne: true },
];

const animauxReadonly: readonly Animal[] = chatsReadonly; // OK et SUR
// animauxReadonly.push(...) // Erreur : readonly
// Pas de risque de corruption !
```

---

## Contravariance (Positions d'entree)

### Definition

Un type generique `F<T>` est **contravariant** en `T` si :
- Quand `A extends B`, alors `F<B> extends F<A>`
- La direction du sous-typage est **inversee**

> **Analogie du veterinaire** : Un veterinaire qui soigne tous les Animaux peut
> certainement soigner un Chat. Mais un specialiste des Chats ne peut pas
> necessairement soigner un Chien. La contravariance s'applique aux **positions
> d'entree** (ce qu'on consomme/accepte en parametre).

```typescript
// Contravariance : les types en position d'ENTREE (parametres)
type Consommateur<T> = (item: T) => void;

type ConsommateurAnimal = Consommateur<Animal>;
type ConsommateurChat = Consommateur<Chat>;

// Un consommateur d'Animal est-il assignable a un consommateur de Chat ?
// OUI ! Car si on va lui donner des Chats, un handler d'Animaux sait les gerer.
const nourritAnimal: ConsommateurAnimal = (a: Animal) => {
  console.log(`Nourrir ${a.nom}`);
};

// Contravariance : la direction est INVERSEE
// Animal extends... non, Chat extends Animal
// Mais Consommateur<Animal> extends Consommateur<Chat> !
const nourritChat: ConsommateurChat = nourritAnimal; // OK avec strictFunctionTypes

// L'inverse serait dangereux :
const brosseChat: ConsommateurChat = (c: Chat) => {
  console.log(`Brosser ${c.nom}, ronronne: ${c.ronronne}`);
};
// const brosseAnimal: ConsommateurAnimal = brosseChat;
// Erreur avec strictFunctionTypes ! Car on pourrait passer un Chien
// qui n'a pas 'ronronne'
```

### strictFunctionTypes

Le flag `strictFunctionTypes` (inclus dans `strict: true`) active la verification
de contravariance pour les parametres de fonctions.

```typescript
// SANS strictFunctionTypes : bivariance (permissif, dangereux)
// Les parametres de fonctions sont a la fois covariants ET contravariants

// AVEC strictFunctionTypes : contravariance stricte (sur)
// Les parametres de fonctions sont contravariants uniquement

// Exemple de bug sans strictFunctionTypes :
interface Chien extends Animal {
  aboie(): void;
}

// Sans strict, ceci compilerait :
// const gererAnimal: (a: Animal) => void = (c: Chien) => c.aboie();
// Puis : gererAnimal({ nom: "Minou", age: 3 }); // Runtime error ! pas de aboie()
```

### Exception : les methodes

```typescript
// ATTENTION : les methodes d'interface restent BIVARIANTES meme avec strict
interface MonTableau<T> {
  // Methode : bivariance (pour compatibilite historique)
  push(item: T): void;

  // Propriete fonction : contravariance stricte
  map: (fn: (item: T) => unknown) => unknown[];
}

// C'est pourquoi les methodes d'Array sont bivariantes
// et permettent des assignations dangereuses
```

---

## Invariance

### Definition

Un type generique `F<T>` est **invariant** en `T` si :
- `F<A>` n'est assignable a `F<B>` QUE si `A` est identique a `B`
- Ni covariance, ni contravariance

> **Analogie de la cle USB** : Un port USB-C n'accepte que des cables USB-C.
> Pas de USB-A, pas de micro-USB. C'est une relation stricte dans les deux sens.

```typescript
// L'invariance apparait quand T est utilise EN ENTREE ET EN SORTIE
type Conteneur<T> = {
  valeur: T;           // Position de sortie (lecture)
  definir(v: T): void; // Position d'entree (ecriture)
};

type ConteneurAnimal = Conteneur<Animal>;
type ConteneurChat = Conteneur<Chat>;

// Ni l'un ni l'autre n'est assignable a l'autre !
// const a: ConteneurAnimal = {} as ConteneurChat; // Erreur
// const b: ConteneurChat = {} as ConteneurAnimal; // Erreur

// Pourquoi ?
// - 'valeur' est covariant : Chat -> Animal OK
// - 'definir' est contravariant : Animal -> Chat OK
// - Les deux directions se contredisent = INVARIANCE
```

### Rendre un type invariant volontairement

```typescript
// Technique : utiliser T en entree ET en sortie pour forcer l'invariance
type Invariant<T> = {
  _lire: () => T;
  _ecrire: (val: T) => void;
};

// Ou avec les annotations de variance (TypeScript 4.7+)
type StrictConteneur<in out T> = {
  valeur: T;
  definir(v: T): void;
};
// 'in out' = invariant
// 'in' = contravariant
// 'out' = covariant
```

---

## Annotations de variance explicites (TypeScript 4.7+)

### Les mots-cles `in` et `out`

Depuis TypeScript 4.7, on peut annoter explicitement la variance des parametres
de type :

```typescript
// 'out' = covariant (T apparait en position de sortie)
type Lecteur<out T> = {
  lire(): T;
};

// 'in' = contravariant (T apparait en position d'entree)
type Ecrivain<in T> = {
  ecrire(val: T): void;
};

// 'in out' = invariant (T apparait dans les deux positions)
type LecteurEcrivain<in out T> = {
  lire(): T;
  ecrire(val: T): void;
};

// Sans annotation = variance inferee automatiquement par TypeScript
// L'annotation explicite sert a :
// 1. Documenter l'intention
// 2. Detecter les erreurs si la variance reelle ne correspond pas
// 3. Ameliorer les performances de verification de type
```

### Performance et annotation de variance

```typescript
// Dans les grandes bases de code, les annotations de variance
// ameliorent la vitesse du compilateur car il n'a pas besoin
// de calculer la variance structurellement

// Exemple concret avec une hierarchie complexe
type Evenement<out T> = {
  type: string;
  payload: T;
  timestamp: number;
};

type GestionnaireEvenement<in T> = {
  traiter(evt: T): void;
  filtrer(evt: T): boolean;
};

// TypeScript verifie que l'annotation correspond a l'usage reel
// type Incorrect<out T> = {
//   ecrire(val: T): void; // Erreur : T est en position d'entree,
// };                      // mais annote 'out' (covariant)
```

---

## Variance dans les generics

### Types generiques et variance

```typescript
// Promise<T> est covariant en T (T est en position de sortie via then/await)
type PromesseAnimal = Promise<Animal>;
type PromesseChat = Promise<Chat>;

async function exemple(): Promise<void> {
  const promesseChat: PromesseChat = Promise.resolve({
    nom: "Minou",
    age: 3,
    ronronne: true,
  });

  // Covariance : Promise<Chat> est assignable a Promise<Animal>
  const promesseAnimal: PromesseAnimal = promesseChat; // OK
  const animal = await promesseAnimal; // Type: Animal
}

// Map<K, V> est invariant en K et V (lecture ET ecriture)
const mapChats = new Map<string, Chat>();
// const mapAnimaux: Map<string, Animal> = mapChats; // Erreur : invariant
// Car Map a get (sortie) ET set (entree)

// ReadonlyMap<K, V> est covariant en V (lecture seule)
const readonlyMapChats: ReadonlyMap<string, Chat> = mapChats;
const readonlyMapAnimaux: ReadonlyMap<string, Animal> = readonlyMapChats; // OK
```

### Fonctions generiques et variance

```typescript
// La variance affecte les fonctions d'ordre superieur
type Transformateur<A, B> = (input: A) => B;
// A est contravariant (entree), B est covariant (sortie)

type TransformateurAnimalString = Transformateur<Animal, string>;
type TransformateurChatString = Transformateur<Chat, string>;

const decrireAnimal: TransformateurAnimalString = (a) => `${a.nom}, ${a.age} ans`;

// Contravariance sur A : Animal est "plus grand" que Chat,
// donc Transformateur<Animal, string> extends Transformateur<Chat, string>
const decrireChat: TransformateurChatString = decrireAnimal; // OK

// Covariance sur B :
type TransformateurChatAnimal = Transformateur<Chat, Animal>;
type TransformateurChatChat = Transformateur<Chat, Chat>;

const chatVersChat: TransformateurChatChat = (c) => ({
  ...c,
  nom: c.nom.toUpperCase(),
});
const chatVersAnimal: TransformateurChatAnimal = chatVersChat; // OK
```

---

## Type Widening (Elargissement de type)

### Widening automatique

TypeScript "elargit" automatiquement certains types literaux en types plus generaux :

```typescript
// Widening des types literaux
let message = "bonjour"; // Type: string (elargi)
const salut = "bonjour"; // Type: "bonjour" (litteral, pas elargi)

let compteur = 42; // Type: number (elargi)
const reponse = 42; // Type: 42 (litteral)

let estVrai = true; // Type: boolean (elargi)
const definitif = true; // Type: true (litteral)

// Widening dans les objets
const config = {
  port: 3000,      // Type: number (elargi meme dans un const !)
  host: "localhost", // Type: string (elargi)
};
// Type de config : { port: number; host: string }

// Pour empecher le widening : 'as const'
const configStrict = {
  port: 3000,
  host: "localhost",
} as const;
// Type : { readonly port: 3000; readonly host: "localhost" }
```

### Widening de `null` et `undefined`

```typescript
// null et undefined ont un comportement special de widening
let valeur = null; // Type: any (widening de null)
// Avec strictNullChecks, les choses sont differentes

function trouverUtilisateur(id: number) {
  if (id === 0) return null;
  return { id, nom: "Alice" };
}
// Type de retour : { id: number; nom: string } | null
// Pas de widening ici car le type est infere du contexte
```

### Controle du widening

```typescript
// Technique 1 : satisfies pour garder le type litteral
const routes = {
  accueil: "/",
  profil: "/profil",
  parametres: "/parametres",
} satisfies Record<string, string>;
// Type : { accueil: "/"; profil: "/profil"; parametres: "/parametres" }
// (types literaux preserves !)

// Technique 2 : annotation de type explicite
const direction: "nord" | "sud" | "est" | "ouest" = "nord";

// Technique 3 : as const
const CODES_HTTP = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

type CodeHTTP = (typeof CODES_HTTP)[keyof typeof CODES_HTTP]; // 200 | 404 | 500
```

---

## Type Narrowing avance

### Narrowing et flux de controle

```typescript
// TypeScript suit le flux de controle pour affiner les types
function traiter(valeur: string | number | null | undefined): string {
  // Ici : string | number | null | undefined

  if (valeur === null || valeur === undefined) {
    return "vide";
  }
  // Ici : string | number (null et undefined elimines)

  if (typeof valeur === "string") {
    return valeur.toUpperCase();
  }
  // Ici : number (string elimine)

  return valeur.toFixed(2);
}
```

### Narrowing avec discriminated unions

```typescript
// Le narrowing brille avec les unions discriminees
type Forme =
  | { type: "cercle"; rayon: number }
  | { type: "rectangle"; largeur: number; hauteur: number }
  | { type: "triangle"; base: number; hauteur: number };

function aire(forme: Forme): number {
  switch (forme.type) {
    case "cercle":
      // Ici TypeScript sait que forme est { type: "cercle"; rayon: number }
      return Math.PI * forme.rayon ** 2;

    case "rectangle":
      // Ici : { type: "rectangle"; largeur: number; hauteur: number }
      return forme.largeur * forme.hauteur;

    case "triangle":
      // Ici : { type: "triangle"; base: number; hauteur: number }
      return (forme.base * forme.hauteur) / 2;

    default:
      // Exhaustiveness check : si on ajoute un nouveau type de Forme
      // sans ajouter de case, cette ligne provoque une erreur
      const _exhaustif: never = forme;
      return _exhaustif;
  }
}
```

### Type predicates (predicats de type)

```typescript
// Les predicats de type permettent un narrowing personnalise
interface Poisson {
  nage(): void;
  ecailles: boolean;
}

interface Oiseau {
  vole(): void;
  plumes: boolean;
}

// Predicat de type : le retour 'animal is Poisson' informe TypeScript
function estPoisson(animal: Poisson | Oiseau): animal is Poisson {
  return "ecailles" in animal;
}

function decrire(animal: Poisson | Oiseau): string {
  if (estPoisson(animal)) {
    // Ici TypeScript sait que animal est Poisson
    animal.nage();
    return "C'est un poisson !";
  }
  // Ici TypeScript sait que animal est Oiseau
  animal.vole();
  return "C'est un oiseau !";
}
```

### Assertion functions

```typescript
// Les fonctions d'assertion affinent le type apres leur appel
function assertEstNonNull<T>(
  valeur: T,
  message?: string
): asserts valeur is NonNullable<T> {
  if (valeur === null || valeur === undefined) {
    throw new Error(message ?? "Valeur nulle inattendue");
  }
}

function traiterUtilisateur(nom: string | null): void {
  // nom est string | null
  assertEstNonNull(nom, "Le nom est requis");
  // Apres l'assertion, nom est string
  console.log(nom.toUpperCase()); // OK, pas de erreur
}

// Assertion avec condition
function assertEstChaine(val: unknown): asserts val is string {
  if (typeof val !== "string") {
    throw new TypeError(`Attendu string, recu ${typeof val}`);
  }
}
```

---

## Excess Property Checking (Verification des proprietes excedentaires)

### Le mecanisme interne

```typescript
// TypeScript a une verification SPECIALE pour les objets litteraux
interface Config {
  port: number;
  host: string;
}

// CAS 1 : Objet litteral -> verification stricte
// const config: Config = {
//   port: 3000,
//   host: "localhost",
//   debug: true, // Erreur ! Propriete excedentaire
// };

// CAS 2 : Variable intermediaire -> pas de verification excedentaire
const objetComplet = { port: 3000, host: "localhost", debug: true };
const config2: Config = objetComplet; // OK ! Pas d'erreur

// Pourquoi cette difference ?
// Les proprietes excedentaires sur un litteral sont probablement une ERREUR
// (faute de frappe, propriete obsolete). Mais une variable existante
// peut legitimement avoir des proprietes supplementaires (sous-typage).
```

### Contournement et bonnes pratiques

```typescript
// Methode 1 : satisfies (recommande en TypeScript 4.9+)
const maConfig = {
  port: 3000,
  host: "localhost",
  debug: true, // Erreur avec satisfies si pas dans le type
} satisfies Config;

// Methode 2 : Index signature pour proprietes dynamiques
interface ConfigFlexible {
  port: number;
  host: string;
  [cle: string]: unknown; // Accepte les proprietes supplementaires
}

const configFlex: ConfigFlexible = {
  port: 3000,
  host: "localhost",
  debug: true, // OK grace a l'index signature
};

// Methode 3 : Type d'aide pour desactiver la verification
type SansVerifExcedentaire<T> = T & Record<string, unknown>;
```

---

## Structural vs Nominal Typing

### Le probleme du typage structurel

```typescript
// En TypeScript, les types sont structurels
type EUR = number;
type USD = number;

// EUR et USD sont IDENTIQUES pour TypeScript !
let prixEuros: EUR = 100;
let prixDollars: USD = 120;
prixEuros = prixDollars; // Aucune erreur... mais c'est un bug logique !

// On peut melanger des euros et des dollars sans aucune erreur de type
function additionner(a: EUR, b: EUR): EUR {
  return a + b;
}
additionner(prixEuros, prixDollars); // Compile... catastrophe financiere !
```

### Branded Types : simuler le typage nominal

```typescript
// Les branded types ajoutent une "marque" invisible au type
type Marque<T, Nom extends string> = T & { readonly __marque: Nom };

type EUR = Marque<number, "EUR">;
type USD = Marque<number, "USD">;
type IdentifiantUtilisateur = Marque<string, "IdentifiantUtilisateur">;
type IdentifiantProduit = Marque<string, "IdentifiantProduit">;

// Fonctions de creation (constructeurs de marque)
function eur(montant: number): EUR {
  return montant as EUR;
}

function usd(montant: number): USD {
  return montant as USD;
}

function idUtilisateur(id: string): IdentifiantUtilisateur {
  return id as IdentifiantUtilisateur;
}

// Maintenant les types sont DISTINCTS
const prix1 = eur(100);
const prix2 = usd(120);

// prix1 = prix2; // Erreur ! Les marques different

function totalEUR(a: EUR, b: EUR): EUR {
  return eur((a as number) + (b as number));
}

totalEUR(prix1, prix1); // OK
// totalEUR(prix1, prix2); // Erreur ! USD n'est pas EUR

// Les identifiants aussi sont proteges
function trouverUtilisateur(id: IdentifiantUtilisateur): void { /* ... */ }
function trouverProduit(id: IdentifiantProduit): void { /* ... */ }

const userId = idUtilisateur("usr_123");
// trouverProduit(userId); // Erreur ! On ne peut pas confondre les ID
```

### Branded Types avec validation

```typescript
// Combiner branding et validation pour des types encore plus surs
type Email = Marque<string, "Email">;
type AgePositif = Marque<number, "AgePositif">;

function email(valeur: string): Email {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(valeur)) {
    throw new Error(`Email invalide : ${valeur}`);
  }
  return valeur as Email;
}

function agePositif(valeur: number): AgePositif {
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > 150) {
    throw new Error(`Age invalide : ${valeur}`);
  }
  return valeur as AgePositif;
}

interface Utilisateur {
  nom: string;
  email: Email;        // Garanti valide !
  age: AgePositif;     // Garanti positif et entier !
}

// Pour creer un Utilisateur, on DOIT passer par les fonctions de validation
const alice: Utilisateur = {
  nom: "Alice",
  email: email("alice@exemple.fr"),
  age: agePositif(30),
};
```

---

## Les trous de soundness en TypeScript

TypeScript n'est **pas** un systeme de types *sound*. Cela signifie qu'il existe
des situations ou le compilateur dit "OK" alors que le code peut planter au
runtime. C'est un choix delibere pour equilibrer securite et productivite.

### Trou 1 : Covariance des tableaux mutables

```typescript
// Deja vu, mais c'est le trou le plus courant
const chats: Chat[] = [{ nom: "Minou", age: 3, ronronne: true }];
const animaux: Animal[] = chats; // OK (covariance)

animaux.push({ nom: "Rex", age: 5 }); // OK pour TypeScript...
// mais maintenant chats[1] n'a pas 'ronronne' !
console.log(chats[1].ronronne); // undefined au runtime, mais type dit 'boolean'
```

### Trou 2 : Assertions de type (as)

```typescript
// 'as' permet de mentir au compilateur
const valeur: unknown = "pas un nombre";
const nombre = valeur as number; // OK pour TypeScript
console.log(nombre.toFixed(2)); // Crash au runtime !

// Double assertion pour contourner les verifications
const chat = { nom: "Minou" } as unknown as Chat;
// TypeScript accepte, mais ronronne sera undefined
```

### Trou 3 : Index signatures

```typescript
// Les index signatures pretendent que TOUTE cle retourne le type
const dico: Record<string, number> = { a: 1, b: 2 };
const valeurC: number = dico["c"]; // Type: number, mais c'est undefined !

// Solution partielle : noUncheckedIndexedAccess
// Avec ce flag, dico["c"] est de type number | undefined
```

### Trou 4 : any

```typescript
// 'any' desactive completement le type checking
function dangereux(): any {
  return "pas un tableau";
}

const tableau: number[] = dangereux(); // Pas d'erreur
tableau.map((n) => n * 2); // Crash : "pas un tableau".map is not a function
```

### Trou 5 : Bivariance des methodes

```typescript
// Comme vu precedemment, les methodes restent bivariantes
interface Gestionnaire {
  traiter(evt: Animal): void; // Methode = bivariance
}

const gestionnaireChat: Gestionnaire = {
  traiter(evt: Chat) {
    // TypeScript accepte (bivariance), mais evt pourrait ne pas etre Chat
    console.log(evt.ronronne); // Potentiel undefined
  },
};
```

---

## Flags de strictness individuels

```typescript
// tsconfig.json — chaque flag strict explique

{
  "compilerOptions": {
    // Active TOUS les flags strict (recommande)
    "strict": true,

    // Equivalent a activer individuellement :

    // Verifie que 'this' a un type explicite dans les fonctions
    "noImplicitThis": true,

    // Interdit les parametres et variables implicitement 'any'
    "noImplicitAny": true,

    // null et undefined sont des types distincts
    "strictNullChecks": true,

    // Contravariance stricte pour les parametres de fonctions
    "strictFunctionTypes": true,

    // Verifie l'initialisation des proprietes de classe
    "strictPropertyInitialization": true,

    // Verifie les appels bind/call/apply
    "strictBindCallApply": true,

    // Les catch clauses sont 'unknown' par defaut (pas 'any')
    "useUnknownInCatchVariables": true,

    // Force 'override' explicite dans les classes derivees
    "noImplicitOverride": true,

    // --- Flags supplementaires hors strict ---

    // Les acces par index retournent T | undefined
    "noUncheckedIndexedAccess": true,

    // Detecte le code mort
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Force return dans toutes les branches
    "noImplicitReturns": true,

    // Force les case a avoir break ou return
    "noFallthroughCasesInSwitch": true,

    // Force les types d'import consistants
    "forceConsistentCasingInFileNames": true,

    // Mode exact pour les champs optionnels
    "exactOptionalPropertyTypes": true
  }
}
```

### exactOptionalPropertyTypes

```typescript
// Un flag souvent meconnu mais tres utile
// AVEC exactOptionalPropertyTypes :

interface Options {
  couleur?: string;
}

// Sans le flag, ces deux sont equivalents :
const o1: Options = { couleur: undefined }; // OK sans le flag
const o2: Options = {};                     // OK

// AVEC le flag, il y a une difference :
// const o3: Options = { couleur: undefined }; // ERREUR !
// Car 'couleur?: string' signifie "peut etre absent"
// Mais pas "peut etre undefined"
// Pour autoriser undefined : couleur?: string | undefined
```

---

## Pratique

### Exercice 1 : Identifier la variance

Determinez si chaque type generique est covariant, contravariant ou invariant en `T` :

```typescript
// Quel est la variance de T dans chacun de ces types ?
type A<T> = () => T;
type B<T> = (arg: T) => void;
type C<T> = (arg: T) => T;
type D<T> = { readonly valeur: T };
type E<T> = { valeur: T; definir: (v: T) => void };
type F<T> = Promise<T>;
type G<T> = (cb: (item: T) => void) => void;
```

<details>
<summary>Solution</summary>

```typescript
// A<T> = () => T
// T est en position de SORTIE uniquement -> COVARIANT

// B<T> = (arg: T) => void
// T est en position d'ENTREE uniquement -> CONTRAVARIANT

// C<T> = (arg: T) => T
// T est en position d'ENTREE ET de SORTIE -> INVARIANT

// D<T> = { readonly valeur: T }
// T est en position de SORTIE uniquement (readonly) -> COVARIANT

// E<T> = { valeur: T; definir: (v: T) => void }
// valeur : T en sortie (covariant)
// definir : T en entree (contravariant)
// -> INVARIANT (les deux positions se contredisent)

// F<T> = Promise<T>
// T est en position de SORTIE (then, await) -> COVARIANT

// G<T> = (cb: (item: T) => void) => void
// T apparait dans un callback qui est lui-meme un parametre
// Parametre d'un parametre = double inversion = COVARIANT
// (contravariant * contravariant = covariant)
```

</details>

### Exercice 2 : Creer des branded types

Creez un systeme de types branded pour gerer des temperatures en Celsius et Fahrenheit
sans risque de confusion :

```typescript
// A faire :
// 1. Creer les types Celsius et Fahrenheit (branded)
// 2. Creer les fonctions constructeurs celsius() et fahrenheit()
// 3. Creer les fonctions de conversion celsiusVers Fahrenheit() et fahrenheitVersCelsius()
// 4. S'assurer qu'on ne peut pas additionner Celsius + Fahrenheit directement
```

<details>
<summary>Solution</summary>

```typescript
// Systeme de branded types pour les temperatures

type Marque<T, Nom extends string> = T & { readonly __marque: Nom };

type Celsius = Marque<number, "Celsius">;
type Fahrenheit = Marque<number, "Fahrenheit">;

// Constructeurs
function celsius(valeur: number): Celsius {
  return valeur as Celsius;
}

function fahrenheit(valeur: number): Fahrenheit {
  return valeur as Fahrenheit;
}

// Conversions type-safe
function celsiusVersFahrenheit(c: Celsius): Fahrenheit {
  return fahrenheit((c as number) * 9 / 5 + 32);
}

function fahrenheitVersCelsius(f: Fahrenheit): Celsius {
  return celsius(((f as number) - 32) * 5 / 9);
}

// Operations type-safe
function additionnerCelsius(a: Celsius, b: Celsius): Celsius {
  return celsius((a as number) + (b as number));
}

function additionnerFahrenheit(a: Fahrenheit, b: Fahrenheit): Fahrenheit {
  return fahrenheit((a as number) + (b as number));
}

// Utilisation
const tempParis = celsius(22);
const tempNewYork = fahrenheit(72);

// additionnerCelsius(tempParis, tempNewYork); // ERREUR !
const tempParisF = celsiusVersFahrenheit(tempParis);
const total = additionnerFahrenheit(tempParisF, tempNewYork); // OK
console.log(`Total : ${total} F`);
```

</details>

### Exercice 3 : Corriger les trous de soundness

Le code suivant compile mais a des bugs au runtime. Corrigez-le :

```typescript
// Code a corriger (compile mais crashe au runtime)
interface Personne {
  nom: string;
  adresse: {
    ville: string;
    codePostal: string;
  };
}

const personnes: Personne[] = [];
const items: { nom: string }[] = personnes;
items.push({ nom: "Bob" }); // Pas d'adresse !

const premierePersonne = personnes[0];
console.log(premierePersonne.adresse.ville); // Crash !

const donnees: Record<string, number> = {};
const valeur: number = donnees["inexistant"];
console.log(valeur.toFixed(2)); // Crash !
```

<details>
<summary>Solution</summary>

```typescript
// Corrections :

interface Personne {
  nom: string;
  adresse: {
    ville: string;
    codePostal: string;
  };
}

// 1. Utiliser readonly pour empecher la covariance mutable
const personnes: Personne[] = [];
const items: readonly { nom: string }[] = personnes; // readonly !
// items.push({ nom: "Bob" }); // ERREUR : readonly

// 2. Verifier que le tableau n'est pas vide
const premierePersonne = personnes[0]; // Avec noUncheckedIndexedAccess: Personne | undefined
if (premierePersonne) {
  console.log(premierePersonne.adresse.ville); // OK
} else {
  console.log("Aucune personne dans le tableau");
}

// 3. Verifier l'existence de la cle dans le Record
const donnees: Record<string, number> = {};
const valeur: number | undefined = donnees["inexistant"]; // Avec noUncheckedIndexedAccess
if (valeur !== undefined) {
  console.log(valeur.toFixed(2)); // OK, garanti non-undefined
} else {
  console.log("Cle inexistante");
}

// Aussi : activer ces flags dans tsconfig.json
// "noUncheckedIndexedAccess": true
// "exactOptionalPropertyTypes": true
```

</details>

### Exercice 4 : Annoter la variance

Ajoutez les annotations de variance correctes (`in`, `out`, `in out`) :

```typescript
// Ajoutez les annotations de variance
type Resultat<T> = {
  donnee: T;
  erreur: null;
} | {
  donnee: null;
  erreur: Error;
};

type Comparateur<T> = (a: T, b: T) => number;

type Depot<T> = {
  sauvegarder(entite: T): void;
  trouverParId(id: string): T | null;
  listerTout(): T[];
  mettreAJour(id: string, entite: T): void;
};
```

<details>
<summary>Solution</summary>

```typescript
// Resultat<T> : T est en position de SORTIE (dans donnee)
// -> COVARIANT
type Resultat<out T> = {
  donnee: T;
  erreur: null;
} | {
  donnee: null;
  erreur: Error;
};

// Comparateur<T> : T est en position d'ENTREE (parametres a et b)
// -> CONTRAVARIANT
type Comparateur<in T> = (a: T, b: T) => number;

// Depot<T> : T est en ENTREE (sauvegarder, mettreAJour)
//            ET en SORTIE (trouverParId, listerTout)
// -> INVARIANT
type Depot<in out T> = {
  sauvegarder(entite: T): void;
  trouverParId(id: string): T | null;
  listerTout(): T[];
  mettreAJour(id: string, entite: T): void;
};
```

</details>

---

## Recapitulatif

| Concept                  | Description                                                  |
|--------------------------|--------------------------------------------------------------|
| **Covariance** (`out`)   | Meme direction : `A <: B => F<A> <: F<B>` (sortie)         |
| **Contravariance** (`in`)| Direction inversee : `A <: B => F<B> <: F<A>` (entree)     |
| **Invariance** (`in out`)| Aucune relation : `F<A>` et `F<B>` incompatibles           |
| **Bivariance**           | Les deux directions (methodes d'interface, historique)        |
| **Widening**             | Elargissement automatique des types literaux                 |
| **Narrowing**            | Affinement des types via le flux de controle                 |
| **Excess check**         | Verification speciale sur les objets litteraux               |
| **Branded types**        | Simulent le typage nominal via une marque invisible          |
| **Soundness holes**      | Compromis deliberes de TypeScript (any, covariance, etc.)    |

---

## Pour aller plus loin

Dans le prochain module, **Module 16 — Declaration Files & Module Augmentation**,
nous verrons comment creer et manipuler les fichiers `.d.ts` pour typer des
bibliotheques JavaScript existantes et etendre les types de modules tiers.

La maitrise de la variance vous sera indispensable pour comprendre pourquoi
certaines declarations de types fonctionnent et d'autres non, notamment quand vous
travaillerez avec `declare module` et le merging de declarations.
