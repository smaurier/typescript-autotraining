# 05 — Classes — Heritage, Abstractions & Visibilite

> **Duree estimee** : 4 heures
> **Difficulte** : 2/5
> **Prerequis** : Modules 01 a 04 (types de base, fonctions, interfaces, unions)
> **Objectifs** :
>
> - Maitriser la syntaxe des classes TypeScript
> - Comprendre les modificateurs de visibilite (`public`, `private`, `protected`, `readonly`)
> - Utiliser les *parameter properties* pour simplifier le code
> - Implementer l'heritage avec `extends` et les interfaces avec `implements`
> - Creer des classes abstraites pour definir des contrats
> - Exploiter les membres statiques, les getters/setters et le mot-cle `override`
> - Decouvrir les *class expressions*, les *mixins* et la fusion de declarations

---

## Introduction

Les classes sont l'un des piliers de la programmation orientee objet (POO) en TypeScript. Contrairement a JavaScript pur, TypeScript ajoute un systeme de typage statique complet aux classes : modificateurs de visibilite, classes abstraites, implementation d'interfaces et bien plus encore.

### Analogie : la classe comme un plan d'architecte

Imaginez qu'une **classe** est un **plan d'architecte** pour une maison. Le plan definit :

- Les **pieces** (les proprietes)
- Les **fonctions** de chaque piece (les methodes)
- Les **acces** — certaines pieces sont publiques (le salon), d'autres privees (la chambre)

A partir d'un seul plan, on peut construire **plusieurs maisons** (les instances). Chaque maison suit le meme plan, mais possede ses propres meubles (valeurs).

---

## Syntaxe de base d'une classe

### Declaration et instanciation

```typescript
// Declaration d'une classe simple
class Voiture {
  // Proprietes
  marque: string;
  modele: string;
  annee: number;

  // Constructeur : appele lors de la creation d'une instance
  constructor(marque: string, modele: string, annee: number) {
    this.marque = marque;
    this.modele = modele;
    this.annee = annee;
  }

  // Methode
  description(): string {
    return `${this.marque} ${this.modele} (${this.annee})`;
  }
}

// Instanciation avec le mot-cle `new`
const maVoiture = new Voiture("Renault", "Clio", 2023);
console.log(maVoiture.description()); // "Renault Clio (2023)"
```

### Le constructeur

Le constructeur est une methode speciale appelee automatiquement lorsque l'on cree une nouvelle instance avec `new`. Il sert a initialiser les proprietes de l'objet.

```typescript
class Utilisateur {
  nom: string;
  email: string;
  dateInscription: Date;

  constructor(nom: string, email: string) {
    this.nom = nom;
    this.email = email;
    // On peut calculer des valeurs dans le constructeur
    this.dateInscription = new Date();
  }
}

const user = new Utilisateur("Alice", "alice@example.com");
console.log(user.dateInscription); // Date actuelle
```

> **Remarque** : En TypeScript, toutes les proprietes declarees dans la classe doivent etre initialisees soit dans leur declaration, soit dans le constructeur (sauf si elles sont optionnelles avec `?`).

---

## Modificateurs de visibilite

TypeScript propose trois modificateurs de visibilite pour controler l'acces aux proprietes et methodes d'une classe.

### `public` (par defaut)

Par defaut, toutes les proprietes et methodes sont publiques. Elles sont accessibles depuis n'importe ou.

```typescript
class Animal {
  public nom: string; // `public` est optionnel ici, c'est le defaut

  constructor(nom: string) {
    this.nom = nom;
  }

  public parler(): string {
    return `${this.nom} fait un bruit.`;
  }
}

const chat = new Animal("Minou");
console.log(chat.nom);      // OK : accessible depuis l'exterieur
console.log(chat.parler()); // OK
```

### `private`

Les membres `private` ne sont accessibles que depuis l'interieur de la classe elle-meme. Meme les classes enfants ne peuvent pas y acceder.

```typescript
class CompteBancaire {
  private solde: number;

  constructor(soldeInitial: number) {
    this.solde = soldeInitial;
  }

  // Methode publique pour consulter le solde
  consulterSolde(): number {
    return this.solde;
  }

  // Methode publique pour deposer de l'argent
  deposer(montant: number): void {
    if (montant <= 0) {
      throw new Error("Le montant doit etre positif.");
    }
    this.solde += montant;
    this.journaliser("depot", montant); // Appel interne OK
  }

  // Methode privee : usage interne uniquement
  private journaliser(type: string, montant: number): void {
    console.log(`[LOG] ${type} de ${montant} EUR — solde: ${this.solde} EUR`);
  }
}

const compte = new CompteBancaire(1000);
compte.deposer(500);           // OK
console.log(compte.consulterSolde()); // 1500

// compte.solde;               // ERREUR : Property 'solde' is private
// compte.journaliser(...);    // ERREUR : Property 'journaliser' is private
```

### Analogie : `private` comme un coffre-fort

Pensez a `private` comme un **coffre-fort** dans une maison. Le proprietaire (la classe) peut y acceder, mais les visiteurs (le code exterieur) et meme les enfants (les sous-classes) ne possedent pas la combinaison.

### `protected`

Les membres `protected` sont accessibles depuis la classe elle-meme **et** depuis les classes qui en heritent, mais pas depuis l'exterieur.

```typescript
class Employe {
  public nom: string;
  protected salaire: number;

  constructor(nom: string, salaire: number) {
    this.nom = nom;
    this.salaire = salaire;
  }

  protected calculerPrime(): number {
    return this.salaire * 0.1;
  }
}

class Manager extends Employe {
  private equipe: string[];

  constructor(nom: string, salaire: number, equipe: string[]) {
    super(nom, salaire);
    this.equipe = equipe;
  }

  afficherDetails(): string {
    // OK : `salaire` et `calculerPrime()` sont accessibles ici
    const prime = this.calculerPrime();
    return `${this.nom} — Salaire: ${this.salaire} EUR — Prime: ${prime} EUR — Equipe: ${this.equipe.length} personnes`;
  }
}

const mgr = new Manager("Bob", 50000, ["Alice", "Charlie"]);
console.log(mgr.afficherDetails());

// mgr.salaire;          // ERREUR : 'salaire' est protected
// mgr.calculerPrime();  // ERREUR : 'calculerPrime' est protected
```

### `readonly`

Le modificateur `readonly` empeche la modification d'une propriete apres son initialisation (dans le constructeur ou lors de la declaration).

```typescript
class Configuration {
  readonly version: string;
  readonly dateCreation: Date;
  nom: string;

  constructor(version: string, nom: string) {
    this.version = version;
    this.nom = nom;
    this.dateCreation = new Date();
  }

  mettreAJourNom(nouveauNom: string): void {
    this.nom = nouveauNom;        // OK : `nom` n'est pas readonly
    // this.version = "2.0";      // ERREUR : Cannot assign to 'version' because it is a read-only property
  }
}

const config = new Configuration("1.0", "MonApp");
config.nom = "MonAppV2";          // OK
// config.version = "2.0";        // ERREUR
```

### Combiner les modificateurs

On peut combiner `readonly` avec les modificateurs de visibilite :

```typescript
class Produit {
  public readonly id: string;
  private readonly dateCreation: Date;
  protected readonly categorie: string;

  constructor(id: string, categorie: string) {
    this.id = id;
    this.categorie = categorie;
    this.dateCreation = new Date();
  }
}
```

### Tableau recapitulatif

| Modificateur  | Classe | Sous-classe | Exterieur |
|---------------|--------|-------------|-----------|
| `public`      | Oui    | Oui         | Oui       |
| `protected`   | Oui    | Oui         | Non       |
| `private`     | Oui    | Non         | Non       |
| `readonly`    | Lecture seule apres initialisation          |

---

## Parameter Properties

TypeScript offre un raccourci tres pratique : les **parameter properties**. En ajoutant un modificateur de visibilite directement dans les parametres du constructeur, TypeScript declare et initialise automatiquement la propriete.

### Avant (syntaxe classique)

```typescript
class Personne {
  public nom: string;
  private age: number;
  readonly email: string;

  constructor(nom: string, age: number, email: string) {
    this.nom = nom;
    this.age = age;
    this.email = email;
  }
}
```

### Apres (parameter properties)

```typescript
class Personne {
  constructor(
    public nom: string,
    private age: number,
    public readonly email: string
  ) {
    // Rien a ecrire ici !
    // TypeScript genere automatiquement this.nom = nom, this.age = age, etc.
  }

  sePresenter(): string {
    return `Je suis ${this.nom}, j'ai ${this.age} ans.`;
  }
}

const alice = new Personne("Alice", 30, "alice@mail.com");
console.log(alice.nom);   // "Alice"
console.log(alice.email); // "alice@mail.com"
// alice.age;              // ERREUR : 'age' est private
```

### Analogie : le raccourci postal

Les parameter properties sont comme une **adresse simplifiee** sur une enveloppe. Au lieu d'ecrire l'adresse complete (declaration + affectation), vous ecrivez tout en une seule ligne et le facteur (TypeScript) comprend automatiquement.

---

## Heritage avec `extends`

L'heritage permet a une classe enfant de recuperer les proprietes et methodes d'une classe parent, puis de les specialiser.

### Heritage simple

```typescript
class Forme {
  constructor(
    public couleur: string,
    protected x: number,
    protected y: number
  ) {}

  deplacer(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  decrire(): string {
    return `Forme ${this.couleur} en (${this.x}, ${this.y})`;
  }
}

class Cercle extends Forme {
  constructor(
    couleur: string,
    x: number,
    y: number,
    public rayon: number
  ) {
    // `super()` appelle le constructeur de la classe parent
    super(couleur, x, y);
  }

  // On peut ajouter de nouvelles methodes
  aire(): number {
    return Math.PI * this.rayon ** 2;
  }

  // On peut redefinir (overrider) des methodes du parent
  decrire(): string {
    return `Cercle ${this.couleur} de rayon ${this.rayon} en (${this.x}, ${this.y})`;
  }
}

class Rectangle extends Forme {
  constructor(
    couleur: string,
    x: number,
    y: number,
    public largeur: number,
    public hauteur: number
  ) {
    super(couleur, x, y);
  }

  aire(): number {
    return this.largeur * this.hauteur;
  }

  decrire(): string {
    return `Rectangle ${this.couleur} ${this.largeur}x${this.hauteur} en (${this.x}, ${this.y})`;
  }
}

// Utilisation
const cercle = new Cercle("rouge", 0, 0, 5);
console.log(cercle.decrire()); // "Cercle rouge de rayon 5 en (0, 0)"
console.log(cercle.aire());    // ~78.54

cercle.deplacer(3, 4);         // Methode heritee de Forme
console.log(cercle.decrire()); // "Cercle rouge de rayon 5 en (3, 4)"
```

### Le mot-cle `super`

`super` sert a deux choses :

1. **`super()`** dans le constructeur : appelle le constructeur du parent. C'est **obligatoire** si la classe enfant a un constructeur.
2. **`super.methode()`** dans une methode : appelle la version de la methode definie dans le parent.

```typescript
class Journal {
  protected messages: string[] = [];

  ajouter(message: string): void {
    this.messages.push(`[${new Date().toISOString()}] ${message}`);
  }

  afficher(): void {
    this.messages.forEach((m) => console.log(m));
  }
}

class JournalAvecNiveau extends Journal {
  ajouter(message: string, niveau: string = "INFO"): void {
    // On appelle la methode parente en ajoutant le niveau
    super.ajouter(`[${niveau}] ${message}`);
  }

  erreur(message: string): void {
    this.ajouter(message, "ERREUR");
  }

  avertissement(message: string): void {
    this.ajouter(message, "ATTENTION");
  }
}

const log = new JournalAvecNiveau();
log.ajouter("Demarrage de l'application");
log.erreur("Connexion a la base echouee");
log.avertissement("Memoire bientot saturee");
log.afficher();
```

### Le mot-cle `override`

Depuis TypeScript 4.3, le mot-cle `override` permet de signaler explicitement qu'une methode redefinit une methode du parent. Cela aide a detecter les erreurs.

```typescript
// Activer dans tsconfig.json : "noImplicitOverride": true

class Animal {
  faireDuBruit(): string {
    return "...";
  }
}

class Chien extends Animal {
  // `override` signale qu'on redefinit intentionnellement
  override faireDuBruit(): string {
    return "Wouf !";
  }

  // Si on fait une faute de frappe :
  // override faireDuBrui(): string { ... }
  // ERREUR : This member cannot have an 'override' modifier because
  // it is not declared in the base class 'Animal'.
}
```

> **Bonne pratique** : activez `"noImplicitOverride": true` dans votre `tsconfig.json`. Cela vous oblige a utiliser `override` a chaque redefinition, ce qui rend le code plus explicite et detecte les erreurs de frappe.

---

## Implementation d'interfaces avec `implements`

Une classe peut **implementer** une ou plusieurs interfaces. Cela signifie qu'elle s'engage a fournir toutes les proprietes et methodes definies par l'interface.

```typescript
// Definition des interfaces
interface Serialisable {
  serialiser(): string;
}

interface Affichable {
  afficher(): void;
}

// La classe implemente les deux interfaces
class Article implements Serialisable, Affichable {
  constructor(
    public titre: string,
    public contenu: string,
    public auteur: string,
    public datePublication: Date = new Date()
  ) {}

  // Implementation de Serialisable
  serialiser(): string {
    return JSON.stringify({
      titre: this.titre,
      contenu: this.contenu,
      auteur: this.auteur,
      date: this.datePublication.toISOString(),
    });
  }

  // Implementation de Affichable
  afficher(): void {
    console.log(`--- ${this.titre} ---`);
    console.log(`Par ${this.auteur} le ${this.datePublication.toLocaleDateString("fr-FR")}`);
    console.log(this.contenu);
  }
}

const article = new Article("TypeScript en 2024", "Contenu...", "Alice");
article.afficher();
console.log(article.serialiser());
```

### Analogie : `implements` comme un contrat de travail

`implements` est comme un **contrat de travail** : l'interface definit les taches a accomplir, et la classe s'engage a les realiser. Si elle ne remplit pas toutes ses obligations, TypeScript signale une erreur.

### Combiner `extends` et `implements`

```typescript
interface Loggable {
  log(message: string): void;
}

class ServiceBase {
  protected nomService: string;

  constructor(nom: string) {
    this.nomService = nom;
  }
}

class ServiceUtilisateurs extends ServiceBase implements Loggable {
  constructor() {
    super("ServiceUtilisateurs");
  }

  log(message: string): void {
    console.log(`[${this.nomService}] ${message}`);
  }

  listerUtilisateurs(): void {
    this.log("Recuperation de la liste des utilisateurs...");
    // ... logique metier
  }
}
```

---

## Classes abstraites

Une classe abstraite est une classe qui **ne peut pas etre instanciee directement**. Elle sert de modele pour d'autres classes. Elle peut contenir des methodes abstraites (sans implementation) et des methodes concretes (avec implementation).

```typescript
abstract class FormeGeometrique {
  constructor(
    public readonly nom: string,
    protected couleur: string
  ) {}

  // Methode abstraite : DOIT etre implementee par les sous-classes
  abstract aire(): number;
  abstract perimetre(): number;

  // Methode concrete : partagee par toutes les sous-classes
  description(): string {
    return `${this.nom} (${this.couleur}) — Aire: ${this.aire().toFixed(2)}, Perimetre: ${this.perimetre().toFixed(2)}`;
  }

  // Methode concrete avec logique commune
  estPlusGrandQue(autre: FormeGeometrique): boolean {
    return this.aire() > autre.aire();
  }
}

class CercleForme extends FormeGeometrique {
  constructor(couleur: string, private rayon: number) {
    super("Cercle", couleur);
  }

  // Implementation obligatoire
  aire(): number {
    return Math.PI * this.rayon ** 2;
  }

  perimetre(): number {
    return 2 * Math.PI * this.rayon;
  }
}

class RectangleForme extends FormeGeometrique {
  constructor(
    couleur: string,
    private largeur: number,
    private hauteur: number
  ) {
    super("Rectangle", couleur);
  }

  aire(): number {
    return this.largeur * this.hauteur;
  }

  perimetre(): number {
    return 2 * (this.largeur + this.hauteur);
  }
}

class TriangleForme extends FormeGeometrique {
  constructor(
    couleur: string,
    private base: number,
    private hauteur: number,
    private coteA: number,
    private coteB: number
  ) {
    super("Triangle", couleur);
  }

  aire(): number {
    return (this.base * this.hauteur) / 2;
  }

  perimetre(): number {
    return this.base + this.coteA + this.coteB;
  }
}

// Utilisation polymorphique
const formes: FormeGeometrique[] = [
  new CercleForme("rouge", 5),
  new RectangleForme("bleu", 4, 6),
  new TriangleForme("vert", 3, 4, 5, 5),
];

// On peut appeler `description()` sur chaque forme
// sans savoir quel type concret elle est
formes.forEach((f) => console.log(f.description()));

// Comparer les aires
console.log(formes[0].estPlusGrandQue(formes[1])); // true (cercle r=5 vs rectangle 4x6)

// const f = new FormeGeometrique("test", "noir"); // ERREUR : Cannot create an instance of an abstract class
```

### Analogie : la classe abstraite comme un formulaire a trous

Une classe abstraite est comme un **formulaire pre-rempli avec des champs vides**. Le formulaire fournit la structure commune (les methodes concretes), mais certains champs (les methodes abstraites) doivent etre remplis par chaque utilisateur (les sous-classes).

---

## Membres statiques

Les membres `static` appartiennent a la **classe elle-meme**, pas aux instances. On y accede avec le nom de la classe, pas avec `this`.

```typescript
class Compteur {
  // Propriete statique partagee entre toutes les instances
  private static nombreInstances: number = 0;

  // Propriete d'instance
  public readonly id: number;

  constructor(public nom: string) {
    Compteur.nombreInstances++;
    this.id = Compteur.nombreInstances;
  }

  // Methode statique
  static combienDInstances(): number {
    return Compteur.nombreInstances;
  }

  // Methode statique de fabrique (factory)
  static creerAvecPrefixe(prefixe: string, index: number): Compteur {
    return new Compteur(`${prefixe}_${index}`);
  }
}

const a = new Compteur("Alpha");
const b = new Compteur("Beta");
const c = Compteur.creerAvecPrefixe("Gamma", 3);

console.log(Compteur.combienDInstances()); // 3
console.log(a.id); // 1
console.log(b.id); // 2
console.log(c.id); // 3
```

### Exemple concret : classe utilitaire avec methodes statiques

```typescript
class MathUtils {
  // Constante statique
  static readonly PHI: number = 1.618033988749895;

  // Empecher l'instanciation
  private constructor() {}

  static clamp(valeur: number, min: number, max: number): number {
    return Math.min(Math.max(valeur, min), max);
  }

  static lerp(debut: number, fin: number, t: number): number {
    return debut + (fin - debut) * MathUtils.clamp(t, 0, 1);
  }

  static degreVersRadian(degres: number): number {
    return (degres * Math.PI) / 180;
  }

  static radianVersDegre(radians: number): number {
    return (radians * 180) / Math.PI;
  }
}

console.log(MathUtils.PHI);              // 1.618...
console.log(MathUtils.clamp(15, 0, 10)); // 10
console.log(MathUtils.lerp(0, 100, 0.5)); // 50
```

---

## Getters et Setters

Les **accesseurs** (`get` et `set`) permettent de definir des proprietes calculees ou d'ajouter de la logique lors de la lecture/ecriture d'une propriete.

```typescript
class Temperature {
  // Stockage interne en Celsius
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  // Getter : acces comme une propriete (temp.celsius)
  get celsius(): number {
    return this._celsius;
  }

  // Setter : affectation comme une propriete (temp.celsius = 30)
  set celsius(valeur: number) {
    if (valeur < -273.15) {
      throw new Error("Temperature en dessous du zero absolu !");
    }
    this._celsius = valeur;
  }

  // Getter calcule
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }

  set fahrenheit(valeur: number) {
    this.celsius = (valeur - 32) * 5 / 9; // Passe par le setter celsius pour la validation
  }

  get kelvin(): number {
    return this._celsius + 273.15;
  }

  set kelvin(valeur: number) {
    this.celsius = valeur - 273.15;
  }

  toString(): string {
    return `${this._celsius.toFixed(1)}C / ${this.fahrenheit.toFixed(1)}F / ${this.kelvin.toFixed(1)}K`;
  }
}

const temp = new Temperature(100);
console.log(temp.toString());    // "100.0C / 212.0F / 373.1K"

temp.fahrenheit = 32;
console.log(temp.celsius);      // 0

temp.kelvin = 0;
console.log(temp.celsius);      // -273.15

// temp.celsius = -300;          // ERREUR : Temperature en dessous du zero absolu !
```

### Getter en lecture seule (sans setter)

```typescript
class Personne {
  constructor(
    public prenom: string,
    public nom: string,
    private _dateNaissance: Date
  ) {}

  // Propriete calculee en lecture seule
  get nomComplet(): string {
    return `${this.prenom} ${this.nom}`;
  }

  get age(): number {
    const aujourdHui = new Date();
    let age = aujourdHui.getFullYear() - this._dateNaissance.getFullYear();
    const moisDiff = aujourdHui.getMonth() - this._dateNaissance.getMonth();
    if (moisDiff < 0 || (moisDiff === 0 && aujourdHui.getDate() < this._dateNaissance.getDate())) {
      age--;
    }
    return age;
  }
}

const p = new Personne("Jean", "Dupont", new Date(1990, 5, 15));
console.log(p.nomComplet); // "Jean Dupont"
console.log(p.age);        // (depend de la date actuelle)
// p.nomComplet = "autre"; // ERREUR : Cannot set property 'nomComplet' which has only a getter
```

---

## Le type `this`

Dans une classe, le type `this` fait reference au type de l'instance actuelle. C'est particulierement utile pour le **chainage de methodes** (fluent API) et l'heritage.

```typescript
class RequeteBuilder {
  protected conditions: string[] = [];
  protected limite: number = 100;

  ou(condition: string): this {
    this.conditions.push(condition);
    return this; // Retourne `this` pour permettre le chainage
  }

  limiter(n: number): this {
    this.limite = n;
    return this;
  }

  construire(): string {
    const where = this.conditions.length > 0
      ? `WHERE ${this.conditions.join(" AND ")}`
      : "";
    return `SELECT * FROM table ${where} LIMIT ${this.limite}`;
  }
}

class RequeteAvecTri extends RequeteBuilder {
  private tri: string = "";

  trierPar(colonne: string, ordre: "ASC" | "DESC" = "ASC"): this {
    this.tri = `ORDER BY ${colonne} ${ordre}`;
    return this;
  }

  override construire(): string {
    const base = super.construire();
    return this.tri ? `${base} ${this.tri}` : base;
  }
}

// Grace au type `this`, le chainage fonctionne meme avec la sous-classe
const requete = new RequeteAvecTri()
  .ou("age > 18")
  .ou("actif = true")
  .limiter(50)
  .trierPar("nom", "ASC") // Cette methode est disponible grace au type `this`
  .construire();

console.log(requete);
// "SELECT * FROM table WHERE age > 18 AND actif = true LIMIT 50 ORDER BY nom ASC"
```

---

## Class Expressions

Tout comme les fonctions, les classes peuvent etre definies comme des expressions.

```typescript
// Classe anonyme assignee a une variable
const MonLogger = class {
  private messages: string[] = [];

  ajouter(msg: string): void {
    this.messages.push(`[${new Date().toISOString()}] ${msg}`);
  }

  afficher(): void {
    this.messages.forEach((m) => console.log(m));
  }
};

const logger = new MonLogger();
logger.ajouter("Demarrage");

// Classe nommee dans une expression (le nom est local a la classe)
const Fabrique = class MonObjet {
  constructor(public valeur: number) {}

  static creer(v: number): InstanceType<typeof MonObjet> {
    return new MonObjet(v);
  }
};

const obj = new Fabrique(42);
// const obj2 = new MonObjet(42); // ERREUR : MonObjet n'est pas defini dans ce scope
```

### Utilisation avec des fonctions generiques

```typescript
// Une fonction qui retourne une classe
function creerClasseAvecLog<T extends new (...args: any[]) => any>(ClasseBase: T) {
  return class extends ClasseBase {
    log(message: string): void {
      console.log(`[${this.constructor.name}] ${message}`);
    }
  };
}

class ServiceBase {
  constructor(public nom: string) {}
}

const ServiceAvecLog = creerClasseAvecLog(ServiceBase);
const svc = new ServiceAvecLog("MonService");
svc.log("Operation terminee"); // "[ServiceBase] Operation terminee"
```

---

## Le pattern Mixin

Les mixins permettent de composer des comportements a partir de plusieurs sources, contournant la limitation de l'heritage simple (une seule classe parent).

```typescript
// Type utilitaire pour representer un constructeur
type Constructeur<T = {}> = new (...args: any[]) => T;

// Mixin 1 : ajoute la capacite de se deplacer
function Deplacable<TBase extends Constructeur>(Base: TBase) {
  return class extends Base {
    posX: number = 0;
    posY: number = 0;

    deplacer(dx: number, dy: number): void {
      this.posX += dx;
      this.posY += dy;
    }

    position(): string {
      return `(${this.posX}, ${this.posY})`;
    }
  };
}

// Mixin 2 : ajoute la capacite d'etre nomme
function Nommable<TBase extends Constructeur>(Base: TBase) {
  return class extends Base {
    private _nom: string = "Sans nom";

    get nom(): string {
      return this._nom;
    }

    renommer(nom: string): void {
      this._nom = nom;
    }
  };
}

// Mixin 3 : ajoute la capacite d'avoir des points de vie
function AvecVie<TBase extends Constructeur>(Base: TBase) {
  return class extends Base {
    pv: number = 100;
    pvMax: number = 100;

    subirDegats(montant: number): void {
      this.pv = Math.max(0, this.pv - montant);
    }

    soigner(montant: number): void {
      this.pv = Math.min(this.pvMax, this.pv + montant);
    }

    estVivant(): boolean {
      return this.pv > 0;
    }
  };
}

// Composition des mixins
class EntiteBase {
  constructor(public id: number) {}
}

// On applique les mixins en les chainant
const Personnage = AvecVie(Nommable(Deplacable(EntiteBase)));

const heros = new Personnage(1);
heros.renommer("Arthas");
heros.deplacer(5, 3);
heros.subirDegats(30);

console.log(`${heros.nom} est en ${heros.position()} avec ${heros.pv} PV`);
// "Arthas est en (5, 3) avec 70 PV"
```

---

## Fusion de declarations (Declaration Merging)

En TypeScript, on peut fusionner une interface et une classe du meme nom. Cela permet d'ajouter des proprietes a une classe depuis l'exterieur.

```typescript
class Evenement {
  constructor(public type: string) {}

  emettre(): void {
    console.log(`Evenement emis : ${this.type}`);
  }
}

// L'interface du meme nom fusionne avec la classe
interface Evenement {
  timestamp: Date;
  source?: string;
}

// Maintenant TypeScript attend `timestamp` sur les instances de Evenement
const evt: Evenement = new Evenement("click");
evt.timestamp = new Date();
evt.source = "bouton-valider";
evt.emettre();

console.log(evt.timestamp);
```

> **Attention** : la fusion de declarations est une fonctionnalite avancee. L'interface ne force pas la classe a implementer les proprietes fusionnees au moment de la compilation du constructeur. Utilisez-la avec precaution.

---

## Pratique

### Exercice 1 : Systeme de gestion de bibliotheque

Creez un systeme de gestion de bibliotheque avec les classes suivantes :

1. Une classe abstraite `Media` avec les proprietes `titre`, `annee`, un `id` readonly, et des methodes abstraites `description()` et `type()`.
2. Une classe `Livre` qui etend `Media` et ajoute `auteur` et `nbPages`.
3. Une classe `DVD` qui etend `Media` et ajoute `realisateur` et `dureeMinutes`.
4. Une classe `Bibliotheque` qui gere une collection de `Media` avec les methodes `ajouter()`, `rechercher(titre)`, `listerParType()`.

<details>
<summary>Solution</summary>

```typescript
abstract class Media {
  private static compteur: number = 0;
  public readonly id: number;

  constructor(
    public titre: string,
    public annee: number
  ) {
    Media.compteur++;
    this.id = Media.compteur;
  }

  abstract description(): string;
  abstract type(): string;

  toString(): string {
    return `[${this.type()}] #${this.id} — ${this.description()}`;
  }
}

class Livre extends Media {
  constructor(
    titre: string,
    annee: number,
    public auteur: string,
    public nbPages: number
  ) {
    super(titre, annee);
  }

  override description(): string {
    return `"${this.titre}" par ${this.auteur} (${this.annee}) — ${this.nbPages} pages`;
  }

  override type(): string {
    return "Livre";
  }
}

class DVD extends Media {
  constructor(
    titre: string,
    annee: number,
    public realisateur: string,
    public dureeMinutes: number
  ) {
    super(titre, annee);
  }

  override description(): string {
    return `"${this.titre}" realise par ${this.realisateur} (${this.annee}) — ${this.dureeMinutes} min`;
  }

  override type(): string {
    return "DVD";
  }
}

class Bibliotheque {
  private collection: Media[] = [];

  ajouter(...medias: Media[]): void {
    this.collection.push(...medias);
  }

  rechercher(titre: string): Media[] {
    const rechercheLower = titre.toLowerCase();
    return this.collection.filter((m) =>
      m.titre.toLowerCase().includes(rechercheLower)
    );
  }

  listerParType(): Record<string, Media[]> {
    const parType: Record<string, Media[]> = {};
    for (const media of this.collection) {
      const t = media.type();
      if (!parType[t]) {
        parType[t] = [];
      }
      parType[t].push(media);
    }
    return parType;
  }

  afficherTout(): void {
    this.collection.forEach((m) => console.log(m.toString()));
  }
}

// Test
const biblio = new Bibliotheque();
biblio.ajouter(
  new Livre("Le Petit Prince", 1943, "Saint-Exupery", 96),
  new Livre("Les Miserables", 1862, "Victor Hugo", 1900),
  new DVD("Inception", 2010, "Christopher Nolan", 148),
  new DVD("Le Fabuleux Destin d'Amelie Poulain", 2001, "Jean-Pierre Jeunet", 122)
);

biblio.afficherTout();
console.log("---");
console.log("Recherche 'le' :", biblio.rechercher("le").map((m) => m.titre));
console.log("Par type :", biblio.listerParType());
```

</details>

### Exercice 2 : Builder pattern avec chainage

Creez une classe `EmailBuilder` qui permet de construire un email avec un pattern builder. Chaque methode doit retourner `this` pour permettre le chainage.

<details>
<summary>Solution</summary>

```typescript
interface Email {
  de: string;
  a: string[];
  cc: string[];
  sujet: string;
  corps: string;
  estHtml: boolean;
  priorite: "basse" | "normale" | "haute";
}

class EmailBuilder {
  private email: Partial<Email> = {
    a: [],
    cc: [],
    estHtml: false,
    priorite: "normale",
  };

  de(expediteur: string): this {
    this.email.de = expediteur;
    return this;
  }

  a(...destinataires: string[]): this {
    this.email.a!.push(...destinataires);
    return this;
  }

  cc(...copie: string[]): this {
    this.email.cc!.push(...copie);
    return this;
  }

  sujet(sujet: string): this {
    this.email.sujet = sujet;
    return this;
  }

  corps(corps: string): this {
    this.email.corps = corps;
    return this;
  }

  html(estHtml: boolean = true): this {
    this.email.estHtml = estHtml;
    return this;
  }

  priorite(p: "basse" | "normale" | "haute"): this {
    this.email.priorite = p;
    return this;
  }

  construire(): Email {
    if (!this.email.de) throw new Error("Expediteur manquant");
    if (!this.email.a || this.email.a.length === 0) throw new Error("Destinataire manquant");
    if (!this.email.sujet) throw new Error("Sujet manquant");
    if (!this.email.corps) throw new Error("Corps manquant");

    return this.email as Email;
  }
}

// Utilisation
const email = new EmailBuilder()
  .de("alice@example.com")
  .a("bob@example.com", "charlie@example.com")
  .cc("manager@example.com")
  .sujet("Reunion demain")
  .corps("<h1>Bonjour</h1><p>Rappel pour la reunion de demain.</p>")
  .html()
  .priorite("haute")
  .construire();

console.log(email);
```

</details>

### Exercice 3 : Mixins — systeme de competences

Creez un systeme de personnages de jeu en utilisant des mixins pour composer les capacites (combattant, magicien, voleur).

<details>
<summary>Solution</summary>

```typescript
type Ctor<T = {}> = new (...args: any[]) => T;

// Classe de base
class PersonnageBase {
  constructor(public nom: string, public niveau: number = 1) {}
}

// Mixin : Combattant
function Combattant<T extends Ctor>(Base: T) {
  return class extends Base {
    force: number = 10;

    attaquer(cible: string): string {
      const degats = this.force * 2;
      return `${(this as any).nom} attaque ${cible} pour ${degats} degats !`;
    }

    bloquer(): string {
      return `${(this as any).nom} leve son bouclier !`;
    }
  };
}

// Mixin : Magicien
function Magicien<T extends Ctor>(Base: T) {
  return class extends Base {
    mana: number = 100;

    lancerSort(sort: string, cible: string): string {
      if (this.mana < 20) return "Pas assez de mana !";
      this.mana -= 20;
      return `${(this as any).nom} lance ${sort} sur ${cible} ! (Mana restant: ${this.mana})`;
    }

    mediter(): string {
      this.mana = Math.min(100, this.mana + 30);
      return `${(this as any).nom} medite. Mana: ${this.mana}`;
    }
  };
}

// Mixin : Voleur
function Voleur<T extends Ctor>(Base: T) {
  return class extends Base {
    agilite: number = 15;

    voler(cible: string): string {
      const succes = Math.random() < this.agilite / 20;
      return succes
        ? `${(this as any).nom} vole un objet a ${cible} !`
        : `${(this as any).nom} se fait reperer par ${cible} !`;
    }

    seDissimuler(): string {
      return `${(this as any).nom} disparait dans l'ombre.`;
    }
  };
}

// Composition : Paladin = Combattant + Magicien
const Paladin = Magicien(Combattant(PersonnageBase));

// Composition : Assassin = Combattant + Voleur
const Assassin = Voleur(Combattant(PersonnageBase));

// Test
const paladin = new Paladin("Uther", 5);
console.log(paladin.attaquer("Gobelin"));
console.log(paladin.lancerSort("Lumiere sacree", "Squelette"));
console.log(paladin.bloquer());

const assassin = new Assassin("Garona", 8);
console.log(assassin.attaquer("Garde"));
console.log(assassin.seDissimuler());
console.log(assassin.voler("Marchand"));
```

</details>

---

## Recapitulatif

| Concept              | Description                                                        |
|----------------------|--------------------------------------------------------------------|
| `class`              | Plan pour creer des objets avec proprietes et methodes             |
| `constructor`        | Methode speciale pour initialiser les instances                    |
| `public`             | Accessible partout (defaut)                                        |
| `private`            | Accessible uniquement dans la classe                               |
| `protected`          | Accessible dans la classe et ses sous-classes                      |
| `readonly`           | Non modifiable apres initialisation                                |
| Parameter properties | Raccourci pour declarer et initialiser dans le constructeur        |
| `extends`            | Heritage — la sous-classe herite du parent                         |
| `implements`         | La classe s'engage a respecter le contrat d'une interface          |
| `abstract`           | Classe non instanciable servant de modele                          |
| `static`             | Membre appartenant a la classe, pas aux instances                  |
| `get` / `set`        | Accesseurs pour proprietes calculees ou validees                   |
| `override`           | Signale explicitement la redefinition d'une methode parente        |
| `this` type          | Type dynamique de l'instance actuelle (utile pour le chainage)     |
| Mixins               | Composition de comportements via des fonctions qui etendent une classe |

---

## Pour aller plus loin

Dans le **Module 06**, nous aborderons les **Generics** — une fonctionnalite essentielle de TypeScript qui permet de creer des fonctions, classes et interfaces reutilisables tout en conservant la securite du typage. Vous verrez comment les generics transforment votre code en le rendant a la fois flexible et type-safe.

[Continuer vers le Module 06 : Generics — Fondamentaux & Contraintes →](./06-generics-fondamentaux.md)
