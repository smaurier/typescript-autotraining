# 06 — Generics — Fondamentaux & Contraintes

> **Duree estimee** : 4 heures
> **Difficulte** : 3/5
> **Prerequis** : Modules 01 a 05 (types de base, fonctions, interfaces, unions, classes)
> **Objectifs** :
>
> - Comprendre le concept de generics et leur utilite
> - Creer des fonctions, interfaces et classes generiques
> - Appliquer des contraintes sur les types generiques (`extends`)
> - Utiliser `keyof`, `typeof` et les acces indexes (`T[K]`)
> - Definir des parametres de type par defaut
> - Maitriser les patterns multi-parametres et les factories generiques

---

## Introduction

Les **generics** sont l'une des fonctionnalites les plus puissantes de TypeScript. Ils permettent de creer des composants (fonctions, classes, interfaces) qui fonctionnent avec **n'importe quel type** tout en conservant la **securite du typage**.

Sans les generics, on serait force de choisir entre :
- Ecrire du code specifique pour chaque type (duplication)
- Utiliser `any` (perte de typage)

Les generics offrent le meilleur des deux mondes : **flexibilite** et **securite**.

### Analogie : la boite universelle

Imaginez une **boite** qui peut contenir n'importe quel objet. Lorsque vous mettez un livre dedans, la boite "sait" qu'elle contient un livre. Si vous mettez un jouet, elle "sait" qu'elle contient un jouet.

```typescript
// Sans generics : on perd l'information du type
function mettreEnBoite(objet: any): { contenu: any } {
  return { contenu: objet };
}

const boite = mettreEnBoite("Bonjour");
// boite.contenu est de type `any` — on a perdu l'info que c'est un string

// Avec generics : le type est preserve
function mettreEnBoiteTypee<T>(objet: T): { contenu: T } {
  return { contenu: objet };
}

const boiteStr = mettreEnBoiteTypee("Bonjour");
// boiteStr.contenu est de type `string` — TypeScript le sait !

const boiteNum = mettreEnBoiteTypee(42);
// boiteNum.contenu est de type `number`
```

---

## Fonctions generiques

### Syntaxe de base

On declare un parametre de type entre chevrons `<T>` avant les parametres de la fonction. Par convention, on utilise souvent `T` (pour "Type"), mais on peut utiliser n'importe quel nom.

```typescript
// Fonction generique simple
function identite<T>(valeur: T): T {
  return valeur;
}

// TypeScript infere le type automatiquement
const a = identite("hello");   // type: string
const b = identite(42);        // type: number
const c = identite(true);      // type: boolean

// On peut aussi specifier le type explicitement
const d = identite<string>("hello"); // type: string
const e = identite<number[]>([1, 2, 3]); // type: number[]
```

### Fonctions generiques avec tableaux

```typescript
// Retourne le premier element d'un tableau
function premier<T>(tableau: T[]): T | undefined {
  return tableau[0];
}

const premierNombre = premier([10, 20, 30]); // type: number | undefined
const premierMot = premier(["a", "b", "c"]); // type: string | undefined

// Retourne le dernier element
function dernier<T>(tableau: T[]): T | undefined {
  return tableau.length > 0 ? tableau[tableau.length - 1] : undefined;
}

// Inverse un tableau (sans modifier l'original)
function inverser<T>(tableau: T[]): T[] {
  return [...tableau].reverse();
}

const inverse = inverser([1, 2, 3]); // [3, 2, 1] — type: number[]
```

### Fonctions generiques avec plusieurs parametres de type

```typescript
// Fonction avec deux parametres de type
function paire<A, B>(premier: A, second: B): [A, B] {
  return [premier, second];
}

const p1 = paire("nom", 42);       // type: [string, number]
const p2 = paire(true, [1, 2, 3]); // type: [boolean, number[]]

// Fonction de transformation
function transformer<TEntree, TSortie>(
  valeur: TEntree,
  fn: (v: TEntree) => TSortie
): TSortie {
  return fn(valeur);
}

const longueur = transformer("Bonjour", (s) => s.length); // type: number
const majuscule = transformer("hello", (s) => s.toUpperCase()); // type: string
const double = transformer(21, (n) => n * 2); // type: number
```

### Analogie : la fonction generique comme un moule ajustable

Une fonction generique est comme un **moule de patisserie ajustable** : il s'adapte a la taille de ce que vous y mettez, mais conserve la forme (le contrat du type). Que vous fassiez un petit gateau ou un grand, le moule s'adapte.

---

## Interfaces generiques

Les interfaces peuvent egalement etre generiques, ce qui les rend extremement reutilisables.

### Interface generique simple

```typescript
// Interface pour un resultat d'operation
interface Resultat<T> {
  succes: boolean;
  donnees: T;
  erreur?: string;
}

// Utilisation avec differents types
const resultatUtilisateur: Resultat<{ nom: string; email: string }> = {
  succes: true,
  donnees: { nom: "Alice", email: "alice@mail.com" },
};

const resultatNombres: Resultat<number[]> = {
  succes: true,
  donnees: [1, 2, 3, 4, 5],
};

const resultatErreur: Resultat<null> = {
  succes: false,
  donnees: null,
  erreur: "Ressource introuvable",
};
```

### Interface pour un depot de donnees (Repository pattern)

```typescript
// Interface generique pour un depot de donnees
interface Depot<T> {
  trouverTous(): Promise<T[]>;
  trouverParId(id: string): Promise<T | null>;
  creer(entite: Omit<T, "id">): Promise<T>;
  mettreAJour(id: string, entite: Partial<T>): Promise<T>;
  supprimer(id: string): Promise<boolean>;
}

// Modele Utilisateur
interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  dateInscription: Date;
}

// Modele Produit
interface Produit {
  id: string;
  nom: string;
  prix: number;
  stock: number;
}

// Implementation du depot pour les utilisateurs
class DepotUtilisateurs implements Depot<Utilisateur> {
  private utilisateurs: Utilisateur[] = [];

  async trouverTous(): Promise<Utilisateur[]> {
    return [...this.utilisateurs];
  }

  async trouverParId(id: string): Promise<Utilisateur | null> {
    return this.utilisateurs.find((u) => u.id === id) ?? null;
  }

  async creer(entite: Omit<Utilisateur, "id">): Promise<Utilisateur> {
    const nouvelUtilisateur: Utilisateur = {
      ...entite,
      id: crypto.randomUUID(),
    };
    this.utilisateurs.push(nouvelUtilisateur);
    return nouvelUtilisateur;
  }

  async mettreAJour(id: string, entite: Partial<Utilisateur>): Promise<Utilisateur> {
    const index = this.utilisateurs.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("Utilisateur introuvable");
    this.utilisateurs[index] = { ...this.utilisateurs[index], ...entite };
    return this.utilisateurs[index];
  }

  async supprimer(id: string): Promise<boolean> {
    const taille = this.utilisateurs.length;
    this.utilisateurs = this.utilisateurs.filter((u) => u.id !== id);
    return this.utilisateurs.length < taille;
  }
}
```

### Interface avec methodes generiques

```typescript
// L'interface elle-meme n'est pas generique,
// mais ses methodes le sont
interface Convertisseur {
  convertir<TEntree, TSortie>(valeur: TEntree, fn: (v: TEntree) => TSortie): TSortie;
  essayerConvertir<TEntree, TSortie>(
    valeur: TEntree,
    fn: (v: TEntree) => TSortie
  ): Resultat<TSortie>;
}

class ConvertisseurImpl implements Convertisseur {
  convertir<TEntree, TSortie>(valeur: TEntree, fn: (v: TEntree) => TSortie): TSortie {
    return fn(valeur);
  }

  essayerConvertir<TEntree, TSortie>(
    valeur: TEntree,
    fn: (v: TEntree) => TSortie
  ): Resultat<TSortie> {
    try {
      const resultat = fn(valeur);
      return { succes: true, donnees: resultat };
    } catch (e) {
      return { succes: false, donnees: undefined as any, erreur: String(e) };
    }
  }
}
```

---

## Classes generiques

Les classes generiques permettent de creer des structures de donnees reutilisables et type-safe.

### Pile (Stack) generique

```typescript
class Pile<T> {
  private elements: T[] = [];

  // Empiler un element
  empiler(element: T): void {
    this.elements.push(element);
  }

  // Depiler le dernier element
  depiler(): T | undefined {
    return this.elements.pop();
  }

  // Voir le dernier element sans le retirer
  sommet(): T | undefined {
    return this.elements[this.elements.length - 1];
  }

  // Taille de la pile
  get taille(): number {
    return this.elements.length;
  }

  // La pile est-elle vide ?
  estVide(): boolean {
    return this.elements.length === 0;
  }

  // Vider la pile
  vider(): void {
    this.elements = [];
  }

  // Convertir en tableau (copie)
  versTableau(): T[] {
    return [...this.elements];
  }
}

// Pile de nombres
const pileNombres = new Pile<number>();
pileNombres.empiler(10);
pileNombres.empiler(20);
pileNombres.empiler(30);
console.log(pileNombres.sommet());  // 30
console.log(pileNombres.depiler()); // 30
console.log(pileNombres.taille);    // 2

// Pile de strings
const pileMots = new Pile<string>();
pileMots.empiler("Bonjour");
pileMots.empiler("le");
pileMots.empiler("monde");
```

### File d'attente (Queue) generique

```typescript
class FileAttente<T> {
  private elements: T[] = [];

  // Ajouter en fin de file
  enfiler(element: T): void {
    this.elements.push(element);
  }

  // Retirer du debut de la file
  defiler(): T | undefined {
    return this.elements.shift();
  }

  // Voir le premier element sans le retirer
  premier(): T | undefined {
    return this.elements[0];
  }

  get taille(): number {
    return this.elements.length;
  }

  estVide(): boolean {
    return this.elements.length === 0;
  }

  // Iterer sur les elements
  pourChaque(callback: (element: T, index: number) => void): void {
    this.elements.forEach(callback);
  }
}

// File d'attente de taches
interface Tache {
  id: number;
  description: string;
  priorite: number;
}

const fileTaches = new FileAttente<Tache>();
fileTaches.enfiler({ id: 1, description: "Envoyer rapport", priorite: 2 });
fileTaches.enfiler({ id: 2, description: "Corriger bug", priorite: 1 });
fileTaches.enfiler({ id: 3, description: "Reunion equipe", priorite: 3 });

while (!fileTaches.estVide()) {
  const tache = fileTaches.defiler()!;
  console.log(`Traitement : ${tache.description}`);
}
```

### Dictionnaire generique (Map type-safe)

```typescript
class Dictionnaire<TCle extends string | number, TValeur> {
  private donnees = new Map<TCle, TValeur>();

  definir(cle: TCle, valeur: TValeur): void {
    this.donnees.set(cle, valeur);
  }

  obtenir(cle: TCle): TValeur | undefined {
    return this.donnees.get(cle);
  }

  possede(cle: TCle): boolean {
    return this.donnees.has(cle);
  }

  supprimer(cle: TCle): boolean {
    return this.donnees.delete(cle);
  }

  get taille(): number {
    return this.donnees.size;
  }

  cles(): TCle[] {
    return Array.from(this.donnees.keys());
  }

  valeurs(): TValeur[] {
    return Array.from(this.donnees.values());
  }

  entries(): [TCle, TValeur][] {
    return Array.from(this.donnees.entries());
  }
}

// Dictionnaire string -> Utilisateur
const utilisateurs = new Dictionnaire<string, { nom: string; age: number }>();
utilisateurs.definir("alice", { nom: "Alice", age: 30 });
utilisateurs.definir("bob", { nom: "Bob", age: 25 });

console.log(utilisateurs.obtenir("alice")); // { nom: "Alice", age: 30 }

// Dictionnaire number -> string
const codes = new Dictionnaire<number, string>();
codes.definir(200, "OK");
codes.definir(404, "Not Found");
codes.definir(500, "Internal Server Error");
```

---

## Contraintes generiques avec `extends`

Les contraintes permettent de restreindre les types acceptes par un parametre generique. On utilise `extends` pour specifier que le type doit correspondre a un certain contrat.

### Contrainte simple

```typescript
// T doit avoir une propriete `length` de type number
function longueur<T extends { length: number }>(element: T): number {
  return element.length;
}

longueur("Bonjour");     // OK : string a `length`
longueur([1, 2, 3]);     // OK : number[] a `length`
longueur({ length: 10 }); // OK : l'objet a `length`

// longueur(42);          // ERREUR : number n'a pas `length`
// longueur(true);        // ERREUR : boolean n'a pas `length`
```

### Contrainte avec une interface

```typescript
interface AvecId {
  id: string | number;
}

// T doit avoir un `id`
function trouverParId<T extends AvecId>(elements: T[], id: T["id"]): T | undefined {
  return elements.find((e) => e.id === id);
}

const produits = [
  { id: 1, nom: "Clavier", prix: 49.99 },
  { id: 2, nom: "Souris", prix: 29.99 },
  { id: 3, nom: "Ecran", prix: 299.99 },
];

const produit = trouverParId(produits, 2);
// produit est de type { id: number; nom: string; prix: number } | undefined

console.log(produit?.nom); // "Souris"
```

### Contrainte avec `extends object`

```typescript
// S'assurer que T est un objet (pas un primitif)
function fusionner<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const resultat = fusionner(
  { nom: "Alice" },
  { age: 30, email: "alice@mail.com" }
);
// type: { nom: string } & { age: number; email: string }

console.log(resultat.nom);   // "Alice"
console.log(resultat.age);   // 30
console.log(resultat.email); // "alice@mail.com"

// fusionner("hello", { a: 1 }); // ERREUR : string n'est pas un object
```

### Analogie : la contrainte comme un filtre de securite

Une contrainte generique est comme un **filtre a l'entree d'un batiment** : seules les personnes avec un badge valide (les types qui satisfont la contrainte) peuvent entrer. Cela empeche les types incompatibles de causer des erreurs a l'interieur.

---

## `keyof` et acces indexes

### L'operateur `keyof`

`keyof` produit un type union de toutes les cles d'un type objet.

```typescript
interface Voiture {
  marque: string;
  modele: string;
  annee: number;
  electrique: boolean;
}

// CleVoiture = "marque" | "modele" | "annee" | "electrique"
type CleVoiture = keyof Voiture;

// Fonction pour obtenir la valeur d'une propriete de maniere type-safe
function obtenirPropriete<T, K extends keyof T>(objet: T, cle: K): T[K] {
  return objet[cle];
}

const maVoiture: Voiture = {
  marque: "Tesla",
  modele: "Model 3",
  annee: 2023,
  electrique: true,
};

const marque = obtenirPropriete(maVoiture, "marque");     // type: string
const annee = obtenirPropriete(maVoiture, "annee");       // type: number
const estElec = obtenirPropriete(maVoiture, "electrique"); // type: boolean

// obtenirPropriete(maVoiture, "couleur"); // ERREUR : "couleur" n'est pas une cle de Voiture
```

### Le pattern `<T extends object, K extends keyof T>`

C'est le pattern le plus utilise avec `keyof`. Il garantit que la cle est valide pour l'objet donne.

```typescript
// Definir une propriete de maniere type-safe
function definirPropriete<T extends object, K extends keyof T>(
  objet: T,
  cle: K,
  valeur: T[K]
): void {
  objet[cle] = valeur;
}

const config = {
  theme: "sombre" as string,
  langue: "fr" as string,
  taille: 14 as number,
};

definirPropriete(config, "theme", "clair");   // OK
definirPropriete(config, "taille", 16);       // OK
// definirPropriete(config, "theme", 42);     // ERREUR : 42 n'est pas un string
// definirPropriete(config, "inexistant", 1); // ERREUR : "inexistant" n'est pas une cle
```

### Acces indexes `T[K]`

L'acces indexe `T[K]` permet d'obtenir le type d'une propriete specifique d'un type.

```typescript
interface Formulaire {
  nom: string;
  age: number;
  hobbies: string[];
  adresse: {
    rue: string;
    ville: string;
    codePostal: string;
  };
}

// Types extraits via acces indexe
type TypeNom = Formulaire["nom"];           // string
type TypeAge = Formulaire["age"];           // number
type TypeHobbies = Formulaire["hobbies"];   // string[]
type TypeAdresse = Formulaire["adresse"];   // { rue: string; ville: string; codePostal: string }
type TypeRue = Formulaire["adresse"]["rue"]; // string

// Acces indexe avec union
type TypeNomOuAge = Formulaire["nom" | "age"]; // string | number

// Fonction qui extrait des champs specifiques
function extraire<T, K extends keyof T>(objet: T, ...cles: K[]): Pick<T, K> {
  const resultat = {} as Pick<T, K>;
  for (const cle of cles) {
    resultat[cle] = objet[cle];
  }
  return resultat;
}

const formulaire: Formulaire = {
  nom: "Alice",
  age: 30,
  hobbies: ["lecture", "musique"],
  adresse: { rue: "12 rue de la Paix", ville: "Paris", codePostal: "75001" },
};

const extrait = extraire(formulaire, "nom", "age");
// type: Pick<Formulaire, "nom" | "age"> = { nom: string; age: number }
console.log(extrait); // { nom: "Alice", age: 30 }
```

---

## `typeof` dans les types

L'operateur `typeof` en position de type permet d'obtenir le type d'une variable.

```typescript
const configuration = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: false,
  retries: 3,
};

// On deduit le type a partir de la valeur
type Configuration = typeof configuration;
// Equivalent a :
// type Configuration = {
//   apiUrl: string;
//   timeout: number;
//   debug: boolean;
//   retries: number;
// }

// Combiner typeof avec keyof
type CleConfig = keyof typeof configuration;
// "apiUrl" | "timeout" | "debug" | "retries"

// Utile pour typer des fonctions basees sur des constantes
function obtenirConfig<K extends keyof typeof configuration>(
  cle: K
): (typeof configuration)[K] {
  return configuration[cle];
}

const url = obtenirConfig("apiUrl");    // type: string
const timeout = obtenirConfig("timeout"); // type: number
```

---

## Parametres de type par defaut

Comme les parametres de fonction, les parametres de type peuvent avoir des valeurs par defaut.

```typescript
// T a une valeur par defaut de `string`
interface Conteneur<T = string> {
  valeur: T;
  horodatage: Date;
}

// On peut omettre le parametre de type
const c1: Conteneur = { valeur: "Bonjour", horodatage: new Date() };
// Equivalent a Conteneur<string>

// Ou le specifier explicitement
const c2: Conteneur<number> = { valeur: 42, horodatage: new Date() };
const c3: Conteneur<boolean> = { valeur: true, horodatage: new Date() };
```

### Parametres par defaut avec contraintes

```typescript
// T doit etendre `object`, avec `Record<string, unknown>` comme defaut
interface Cache<T extends object = Record<string, unknown>> {
  donnees: Map<string, T>;
  dureeVie: number; // en millisecondes

  obtenir(cle: string): T | undefined;
  definir(cle: string, valeur: T): void;
  supprimer(cle: string): boolean;
}

// Classe generique avec defaut
class ListeTriee<T = number> {
  private elements: T[] = [];

  constructor(private comparateur: (a: T, b: T) => number) {}

  ajouter(element: T): void {
    this.elements.push(element);
    this.elements.sort(this.comparateur);
  }

  obtenir(index: number): T | undefined {
    return this.elements[index];
  }

  versTableau(): T[] {
    return [...this.elements];
  }
}

// Sans specifier T : c'est number par defaut
const nombres = new ListeTriee((a, b) => a - b);
nombres.ajouter(30);
nombres.ajouter(10);
nombres.ajouter(20);
console.log(nombres.versTableau()); // [10, 20, 30]

// Avec T = string
const mots = new ListeTriee<string>((a, b) => a.localeCompare(b));
mots.ajouter("cerise");
mots.ajouter("abricot");
mots.ajouter("banane");
console.log(mots.versTableau()); // ["abricot", "banane", "cerise"]
```

---

## Generics avec unions

Les generics interagissent de maniere interessante avec les types union.

```typescript
// Fonction qui filtre un tableau par un predicat type-safe
function filtrer<T>(
  tableau: T[],
  predicat: (element: T) => boolean
): T[] {
  return tableau.filter(predicat);
}

// Fonctionne avec des unions
type Fruit = "pomme" | "banane" | "cerise" | "datte";
const fruits: Fruit[] = ["pomme", "banane", "cerise", "datte", "pomme"];
const fruitsAvecE = filtrer(fruits, (f) => f.includes("e"));
// type: Fruit[] — le type union est preserve

// Resultat generique avec union
type ResultatAsync<T> =
  | { statut: "chargement" }
  | { statut: "succes"; donnees: T }
  | { statut: "erreur"; erreur: string };

function traiterResultat<T>(resultat: ResultatAsync<T>): string {
  switch (resultat.statut) {
    case "chargement":
      return "Chargement en cours...";
    case "succes":
      return `Succes : ${JSON.stringify(resultat.donnees)}`;
    case "erreur":
      return `Erreur : ${resultat.erreur}`;
  }
}

const r1: ResultatAsync<string[]> = { statut: "succes", donnees: ["a", "b"] };
const r2: ResultatAsync<number> = { statut: "erreur", erreur: "Timeout" };

console.log(traiterResultat(r1)); // "Succes : [\"a\",\"b\"]"
console.log(traiterResultat(r2)); // "Erreur : Timeout"
```

---

## Multiple type parameters

Il est courant d'avoir deux, trois, voire plus de parametres de type.

```typescript
// Deux parametres : cle et valeur
function creerEnregistrement<K extends string, V>(
  cle: K,
  valeur: V
): Record<K, V> {
  return { [cle]: valeur } as Record<K, V>;
}

const enr = creerEnregistrement("nom", "Alice");
// type: Record<"nom", string>
console.log(enr.nom); // "Alice"

// Trois parametres : transformation d'un type vers un autre
function mapper<TEntree, TSortie, TCle extends string>(
  collection: Record<TCle, TEntree>,
  fn: (valeur: TEntree, cle: TCle) => TSortie
): Record<TCle, TSortie> {
  const resultat = {} as Record<TCle, TSortie>;
  for (const cle in collection) {
    resultat[cle] = fn(collection[cle], cle);
  }
  return resultat;
}

const prix = { clavier: 49.99, souris: 29.99, ecran: 299.99 };
const prixTTC = mapper(prix, (p) => +(p * 1.2).toFixed(2));
// type: Record<"clavier" | "souris" | "ecran", number>
console.log(prixTTC); // { clavier: 59.99, souris: 35.99, ecran: 359.99 }

const prixFormates = mapper(prix, (p, cle) => `${cle}: ${p.toFixed(2)} EUR`);
// type: Record<"clavier" | "souris" | "ecran", string>
console.log(prixFormates);
```

---

## Factories generiques

Les factories generiques permettent de creer des instances de maniere dynamique tout en conservant le typage.

```typescript
// Factory simple avec un constructeur
function creerInstance<T>(Classe: new () => T): T {
  return new Classe();
}

class Chien {
  aboyer(): string {
    return "Wouf !";
  }
}

class Chat {
  miauler(): string {
    return "Miaou !";
  }
}

const chien = creerInstance(Chien); // type: Chien
console.log(chien.aboyer());       // "Wouf !"

const chat = creerInstance(Chat);   // type: Chat
console.log(chat.miauler());       // "Miaou !"
```

### Factory avec parametres du constructeur

```typescript
// Factory qui accepte des parametres pour le constructeur
function creerAvecParams<T>(
  Classe: new (...args: any[]) => T,
  ...args: any[]
): T {
  return new Classe(...args);
}

class Utilisateur {
  constructor(public nom: string, public age: number) {}
  saluer(): string {
    return `Bonjour, je suis ${this.nom} (${this.age} ans)`;
  }
}

const user = creerAvecParams(Utilisateur, "Alice", 30);
console.log(user.saluer()); // "Bonjour, je suis Alice (30 ans)"
```

### Factory pattern complet avec registre

```typescript
// Registre de factories
class FabriqueRegistre {
  private static fabriques = new Map<string, new (...args: any[]) => any>();

  // Enregistrer une classe dans le registre
  static enregistrer<T>(nom: string, Classe: new (...args: any[]) => T): void {
    this.fabriques.set(nom, Classe);
  }

  // Creer une instance a partir du registre
  static creer<T>(nom: string, ...args: any[]): T {
    const Classe = this.fabriques.get(nom);
    if (!Classe) {
      throw new Error(`Classe "${nom}" non enregistree dans la fabrique.`);
    }
    return new Classe(...args) as T;
  }
}

// Enregistrement
class NotificationEmail {
  constructor(public destinataire: string, public sujet: string) {}
  envoyer(): void {
    console.log(`Email envoye a ${this.destinataire} : ${this.sujet}`);
  }
}

class NotificationSMS {
  constructor(public numero: string, public message: string) {}
  envoyer(): void {
    console.log(`SMS envoye a ${this.numero} : ${this.message}`);
  }
}

FabriqueRegistre.enregistrer("email", NotificationEmail);
FabriqueRegistre.enregistrer("sms", NotificationSMS);

// Utilisation
const email = FabriqueRegistre.creer<NotificationEmail>("email", "alice@mail.com", "Bonjour");
email.envoyer(); // "Email envoye a alice@mail.com : Bonjour"

const sms = FabriqueRegistre.creer<NotificationSMS>("sms", "0612345678", "Salut !");
sms.envoyer(); // "SMS envoye a 0612345678 : Salut !"
```

---

## Pratique

### Exercice 1 : Fonction generique `grouper`

Ecrivez une fonction generique `grouper` qui prend un tableau d'objets et le nom d'une propriete, puis regroupe les elements par la valeur de cette propriete.

```typescript
// Signature attendue :
// function grouper<T, K extends keyof T>(tableau: T[], cle: K): Map<T[K], T[]>

// Exemple d'utilisation :
const personnes = [
  { nom: "Alice", ville: "Paris", age: 30 },
  { nom: "Bob", ville: "Lyon", age: 25 },
  { nom: "Charlie", ville: "Paris", age: 35 },
  { nom: "David", ville: "Lyon", age: 28 },
];

const parVille = grouper(personnes, "ville");
// Map { "Paris" => [{Alice...}, {Charlie...}], "Lyon" => [{Bob...}, {David...}] }
```

<details>
<summary>Solution</summary>

```typescript
function grouper<T, K extends keyof T>(tableau: T[], cle: K): Map<T[K], T[]> {
  const groupes = new Map<T[K], T[]>();

  for (const element of tableau) {
    const valeurCle = element[cle];
    const groupe = groupes.get(valeurCle);

    if (groupe) {
      groupe.push(element);
    } else {
      groupes.set(valeurCle, [element]);
    }
  }

  return groupes;
}

// Test
const personnes = [
  { nom: "Alice", ville: "Paris", age: 30 },
  { nom: "Bob", ville: "Lyon", age: 25 },
  { nom: "Charlie", ville: "Paris", age: 35 },
  { nom: "David", ville: "Lyon", age: 28 },
  { nom: "Eve", ville: "Paris", age: 22 },
];

const parVille = grouper(personnes, "ville");
console.log("Par ville :");
parVille.forEach((membres, ville) => {
  console.log(`  ${ville}: ${membres.map((m) => m.nom).join(", ")}`);
});
// Par ville :
//   Paris: Alice, Charlie, Eve
//   Lyon: Bob, David

const parAge = grouper(personnes, "age");
console.log("\nPar age :");
parAge.forEach((membres, age) => {
  console.log(`  ${age}: ${membres.map((m) => m.nom).join(", ")}`);
});
```

</details>

### Exercice 2 : Classe generique `Cache<T>`

Creez une classe generique `Cache<T>` avec une duree de vie (TTL) pour les entrees.

- `definir(cle: string, valeur: T): void` — stocke une valeur avec un horodatage
- `obtenir(cle: string): T | undefined` — retourne la valeur si elle n'a pas expire
- `supprimer(cle: string): boolean` — supprime une entree
- `nettoyer(): number` — supprime les entrees expirees et retourne le nombre supprime

<details>
<summary>Solution</summary>

```typescript
interface EntreeCache<T> {
  valeur: T;
  expiration: number; // timestamp en ms
}

class Cache<T> {
  private stockage = new Map<string, EntreeCache<T>>();

  // dureeVie en millisecondes
  constructor(private dureeVie: number = 60_000) {}

  definir(cle: string, valeur: T): void {
    this.stockage.set(cle, {
      valeur,
      expiration: Date.now() + this.dureeVie,
    });
  }

  obtenir(cle: string): T | undefined {
    const entree = this.stockage.get(cle);
    if (!entree) return undefined;

    // Verifier si l'entree a expire
    if (Date.now() > entree.expiration) {
      this.stockage.delete(cle);
      return undefined;
    }

    return entree.valeur;
  }

  supprimer(cle: string): boolean {
    return this.stockage.delete(cle);
  }

  nettoyer(): number {
    const maintenant = Date.now();
    let nbSupprimes = 0;

    for (const [cle, entree] of this.stockage) {
      if (maintenant > entree.expiration) {
        this.stockage.delete(cle);
        nbSupprimes++;
      }
    }

    return nbSupprimes;
  }

  get taille(): number {
    return this.stockage.size;
  }

  possede(cle: string): boolean {
    return this.obtenir(cle) !== undefined;
  }

  cles(): string[] {
    // Ne retourner que les cles non expirees
    const maintenant = Date.now();
    const clesValides: string[] = [];
    for (const [cle, entree] of this.stockage) {
      if (maintenant <= entree.expiration) {
        clesValides.push(cle);
      }
    }
    return clesValides;
  }
}

// Test
const cacheUtilisateurs = new Cache<{ nom: string; email: string }>(5000); // 5s TTL

cacheUtilisateurs.definir("alice", { nom: "Alice", email: "alice@mail.com" });
cacheUtilisateurs.definir("bob", { nom: "Bob", email: "bob@mail.com" });

console.log(cacheUtilisateurs.obtenir("alice")); // { nom: "Alice", email: "alice@mail.com" }
console.log(cacheUtilisateurs.taille); // 2

// Apres 5 secondes, les entrees auront expire...
```

</details>

### Exercice 3 : Fonction generique `pluck`

Ecrivez une fonction `pluck` qui extrait les valeurs d'une propriete specifique d'un tableau d'objets.

```typescript
// Signature attendue :
// function pluck<T, K extends keyof T>(tableau: T[], cle: K): T[K][]

// Exemple :
// pluck([{ nom: "Alice", age: 30 }, { nom: "Bob", age: 25 }], "nom")
// => ["Alice", "Bob"]
```

<details>
<summary>Solution</summary>

```typescript
function pluck<T, K extends keyof T>(tableau: T[], cle: K): T[K][] {
  return tableau.map((element) => element[cle]);
}

// Tests
const employes = [
  { nom: "Alice", departement: "IT", salaire: 50000 },
  { nom: "Bob", departement: "RH", salaire: 45000 },
  { nom: "Charlie", departement: "IT", salaire: 55000 },
  { nom: "Diana", departement: "Finance", salaire: 60000 },
];

const noms = pluck(employes, "nom");
// type: string[] — valeur: ["Alice", "Bob", "Charlie", "Diana"]

const salaires = pluck(employes, "salaire");
// type: number[] — valeur: [50000, 45000, 55000, 60000]

const departements = pluck(employes, "departement");
// type: string[] — valeur: ["IT", "RH", "IT", "Finance"]

console.log("Noms :", noms);
console.log("Salaires :", salaires);
console.log("Departements (uniques) :", [...new Set(departements)]);
```

</details>

### Exercice 4 : Depot generique en memoire

Implementez un depot generique `DepotEnMemoire<T>` qui implemente l'interface `Depot<T>` definie plus haut dans ce module. Ajoutez une methode `filtrer(predicat)`.

<details>
<summary>Solution</summary>

```typescript
interface Identifiable {
  id: string;
}

interface DepotGenerique<T extends Identifiable> {
  trouverTous(): T[];
  trouverParId(id: string): T | undefined;
  creer(entite: Omit<T, "id">): T;
  mettreAJour(id: string, modifications: Partial<Omit<T, "id">>): T | undefined;
  supprimer(id: string): boolean;
  filtrer(predicat: (entite: T) => boolean): T[];
  compter(): number;
}

class DepotEnMemoire<T extends Identifiable> implements DepotGenerique<T> {
  private donnees = new Map<string, T>();
  private compteur = 0;

  private genererID(): string {
    this.compteur++;
    return `id_${this.compteur}_${Date.now()}`;
  }

  trouverTous(): T[] {
    return Array.from(this.donnees.values());
  }

  trouverParId(id: string): T | undefined {
    return this.donnees.get(id);
  }

  creer(entite: Omit<T, "id">): T {
    const id = this.genererID();
    const nouvelleEntite = { ...entite, id } as T;
    this.donnees.set(id, nouvelleEntite);
    return nouvelleEntite;
  }

  mettreAJour(id: string, modifications: Partial<Omit<T, "id">>): T | undefined {
    const existant = this.donnees.get(id);
    if (!existant) return undefined;

    const misAJour = { ...existant, ...modifications };
    this.donnees.set(id, misAJour);
    return misAJour;
  }

  supprimer(id: string): boolean {
    return this.donnees.delete(id);
  }

  filtrer(predicat: (entite: T) => boolean): T[] {
    return this.trouverTous().filter(predicat);
  }

  compter(): number {
    return this.donnees.size;
  }
}

// Test
interface Article extends Identifiable {
  titre: string;
  contenu: string;
  publie: boolean;
  tags: string[];
}

const depotArticles = new DepotEnMemoire<Article>();

const a1 = depotArticles.creer({
  titre: "Introduction a TypeScript",
  contenu: "TypeScript est...",
  publie: true,
  tags: ["typescript", "debutant"],
});

const a2 = depotArticles.creer({
  titre: "Generics avances",
  contenu: "Les generics permettent...",
  publie: false,
  tags: ["typescript", "avance"],
});

console.log("Tous :", depotArticles.trouverTous().length); // 2
console.log("Publies :", depotArticles.filtrer((a) => a.publie).length); // 1

depotArticles.mettreAJour(a2.id, { publie: true });
console.log("Publies apres MAJ :", depotArticles.filtrer((a) => a.publie).length); // 2
```

</details>

---

## Recapitulatif

| Concept                     | Syntaxe                                         | Description                                          |
|-----------------------------|--------------------------------------------------|------------------------------------------------------|
| Fonction generique          | `function f<T>(arg: T): T`                       | Fonction parametree par un type                       |
| Interface generique         | `interface I<T> { valeur: T }`                    | Interface parametree par un type                      |
| Classe generique            | `class C<T> { ... }`                              | Classe parametree par un type                         |
| Contrainte                  | `<T extends SomeType>`                            | Restreint les types acceptes                          |
| `keyof`                     | `keyof T`                                         | Union des cles d'un type                              |
| Acces indexe                | `T[K]`                                            | Type de la propriete K dans T                         |
| `typeof`                    | `typeof variable`                                 | Deduit le type a partir d'une valeur                  |
| Type par defaut             | `<T = string>`                                    | Valeur par defaut pour un parametre de type           |
| Multi-parametres            | `<T, U, V>`                                       | Plusieurs parametres de type                          |
| Factory generique           | `new (...args) => T`                              | Creer des instances dynamiquement                     |

---

## Pour aller plus loin

Dans le **Module 07**, nous approfondirons les generics avec des **patterns avances** : types conditionnels dans les generics, types variadiques, inference avancee avec `infer`, builder pattern type-safe, branded types et bien plus.

[Continuer vers le Module 07 : Generics — Patterns avances & Variadics →](./07-generics-avances.md)
