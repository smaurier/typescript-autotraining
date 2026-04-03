# 18 — Patterns de conception en TypeScript

> **Duree estimee** : 4 heures
> **Difficulte** : 4/5
> **Prérequis** : Modules 1 a 17, generics avances, conditional types, variance
> **Objectifs** :
>
> - Comprendre pourquoi certains patterns changent en TypeScript
> - Adapter les patterns classiques au typage avancé du langage
> - Choisir entre approche orientée objet et approche plus fonctionnelle
> - Concevoir des abstractions réutilisables et type-safe

---

## Introduction — Pourquoi revoir les design patterns en TypeScript ?

### Le problème qu'on cherche à résoudre

Les design patterns classiques ont été pensés pour des langages orientés objet plus rigides. Si on les recopie tels quels en TypeScript, on obtient souvent du code plus lourd que nécessaire.

### La solution : garder l'intention du pattern, pas sa forme historique

En TypeScript, un pattern n'est pas une recette a recopier mot pour mot. C'est une intention de conception qu'on peut implémenter autrement grâce aux unions, generics, conditional types et fonctions d'ordre supérieur.

### Analogie des recettes

Un pattern, c'est comme une recette. Le plat final reste le même, mais les ingrédients disponibles en TypeScript permettent parfois de cuisiner plus simplement, plus précisément, et avec moins de code cérémoniel.

> 🎯 **Ce qu'il faut retenir** : ici, on ne cherche pas a "faire du GoF pour faire du GoF". On cherche a résoudre proprement des problèmes de conception avec les outils modernes de TypeScript.

---

## Pattern Strategy (avec Generics)

### Le problème

Comment permettre de choisir un algorithme parmi plusieurs au runtime, tout en
gardant la sécurité des types ?

### Implementation classique

```typescript
// Strategy classique avec interface
interface StrategieDeFormatage {
  formater(donnees: unknown[]): string;
}

class FormatageJSON implements StrategieDeFormatage {
  formater(donnees: unknown[]): string {
    return JSON.stringify(donnees, null, 2);
  }
}

class FormatageCSV implements StrategieDeFormatage {
  formater(donnees: unknown[]): string {
    if (donnees.length === 0) return "";
    const entetes = Object.keys(donnees[0] as Record<string, unknown>);
    const lignes = donnees.map((d) =>
      entetes.map((e) => String((d as Record<string, unknown>)[e])).join(",")
    );
    return [entetes.join(","), ...lignes].join("\n");
  }
}
```

### Implementation TypeScript avancee avec generics

```typescript
// Strategy type-safe avec generics
interface StrategieDeValidation<T> {
  /** Nom de la strategie pour le debugging */
  readonly nom: string;
  /** Valide les donnees et retourne les erreurs */
  valider(donnees: T): ErreurValidation[];
  /** Transforme les donnees validees */
  transformer?(donnees: T): T;
}

interface ErreurValidation {
  champ: string;
  message: string;
  valeur: unknown;
}

// Strategies concretes fortement typees
interface Utilisateur {
  nom: string;
  email: string;
  age: number;
}

const validationStricte: StrategieDeValidation<Utilisateur> = {
  nom: "stricte",
  valider(u) {
    const erreurs: ErreurValidation[] = [];

    if (u.nom.length < 2) {
      erreurs.push({
        champ: "nom",
        message: "Le nom doit avoir au moins 2 caracteres",
        valeur: u.nom,
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) {
      erreurs.push({
        champ: "email",
        message: "Email invalide",
        valeur: u.email,
      });
    }

    if (u.age < 18 || u.age > 120) {
      erreurs.push({
        champ: "age",
        message: "L'age doit etre entre 18 et 120",
        valeur: u.age,
      });
    }

    return erreurs;
  },
  transformer(u) {
    return { ...u, email: u.email.toLowerCase(), nom: u.nom.trim() };
  },
};

const validationPermissive: StrategieDeValidation<Utilisateur> = {
  nom: "permissive",
  valider(u) {
    const erreurs: ErreurValidation[] = [];
    if (!u.nom) {
      erreurs.push({
        champ: "nom",
        message: "Le nom est requis",
        valeur: u.nom,
      });
    }
    return erreurs;
  },
};

// Le contexte utilise la strategie
class ServiceUtilisateur<T> {
  private strategie: StrategieDeValidation<T>;

  constructor(strategie: StrategieDeValidation<T>) {
    this.strategie = strategie;
  }

  changerStrategie(strategie: StrategieDeValidation<T>): void {
    console.log(`Changement de strategie : ${this.strategie.nom} -> ${strategie.nom}`);
    this.strategie = strategie;
  }

  traiter(donnees: T): { valide: boolean; donnees: T; erreurs: ErreurValidation[] } {
    const erreurs = this.strategie.valider(donnees);
    const donneesFinales = erreurs.length === 0 && this.strategie.transformer
      ? this.strategie.transformer(donnees)
      : donnees;

    return { valide: erreurs.length === 0, donnees: donneesFinales, erreurs };
  }
}

// Utilisation
const service = new ServiceUtilisateur(validationStricte);
const resultat = service.traiter({
  nom: "Alice",
  email: "ALICE@exemple.fr",
  age: 30,
});
// resultat.donnees.email sera "alice@exemple.fr" (transforme)

service.changerStrategie(validationPermissive);
```

---

## Pattern Observer (EventEmitter type-safe)

### Le problème

Créer un système d'événements ou chaque événement à un type de payload spécifique,
avec vérification complete à la compilation.

```typescript
// Definir la carte des evenements : chaque cle mappe vers un type de payload
interface CarteEvenements {
  "utilisateur:connecte": { id: string; nom: string; timestamp: Date };
  "utilisateur:deconnecte": { id: string; raison: string };
  "message:envoye": { de: string; a: string; contenu: string };
  "erreur": { code: number; message: string; stack?: string };
}

// EventEmitter generique et type-safe
class EmetteurEvenements<E extends Record<string, unknown>> {
  // Map des ecouteurs, organises par nom d'evenement
  private ecouteurs = new Map<
    keyof E,
    Set<(payload: unknown) => void>
  >();

  /**
   * Ecouter un evenement avec un callback type
   * Le type du payload est infere automatiquement !
   */
  sur<K extends keyof E>(
    evenement: K,
    ecouteur: (payload: E[K]) => void
  ): () => void {
    if (!this.ecouteurs.has(evenement)) {
      this.ecouteurs.set(evenement, new Set());
    }

    const set = this.ecouteurs.get(evenement)!;
    set.add(ecouteur as (payload: unknown) => void);

    // Retourner une fonction de desinscription
    return () => {
      set.delete(ecouteur as (payload: unknown) => void);
    };
  }

  /**
   * Ecouter un evenement UNE SEULE FOIS
   */
  uneFois<K extends keyof E>(
    evenement: K,
    ecouteur: (payload: E[K]) => void
  ): () => void {
    const desinscrire = this.sur(evenement, (payload) => {
      desinscrire();
      ecouteur(payload);
    });
    return desinscrire;
  }

  /**
   * Emettre un evenement — le type du payload est verifie !
   */
  emettre<K extends keyof E>(evenement: K, payload: E[K]): void {
    const set = this.ecouteurs.get(evenement);
    if (set) {
      for (const ecouteur of set) {
        try {
          ecouteur(payload);
        } catch (erreur) {
          console.error(`Erreur dans l'ecouteur de "${String(evenement)}"`, erreur);
        }
      }
    }
  }

  /**
   * Supprimer tous les ecouteurs d'un evenement
   */
  supprimerTout<K extends keyof E>(evenement?: K): void {
    if (evenement) {
      this.ecouteurs.delete(evenement);
    } else {
      this.ecouteurs.clear();
    }
  }

  /**
   * Compter les ecouteurs d'un evenement
   */
  compterEcouteurs<K extends keyof E>(evenement: K): number {
    return this.ecouteurs.get(evenement)?.size ?? 0;
  }
}

// Utilisation — Tout est type-safe !
const bus = new EmetteurEvenements<CarteEvenements>();

// TypeScript infere le type du payload automatiquement
bus.sur("utilisateur:connecte", (payload) => {
  // payload est { id: string; nom: string; timestamp: Date }
  console.log(`${payload.nom} s'est connecte a ${payload.timestamp}`);
});

bus.sur("erreur", (payload) => {
  // payload est { code: number; message: string; stack?: string }
  console.error(`Erreur ${payload.code}: ${payload.message}`);
});

// L'emission est aussi type-safe
bus.emettre("utilisateur:connecte", {
  id: "usr_001",
  nom: "Alice",
  timestamp: new Date(),
});

// Erreurs de type detectees a la compilation :
// bus.emettre("utilisateur:connecte", { id: 123 }); // Erreur : id doit etre string
// bus.emettre("inexistant", {}); // Erreur : evenement inconnu
```

---

## Pattern Builder (type-safe avec chained generics)

### Le problème classique

Comment construire un objet complexe pas a pas, tout en garantissant que toutes
les propriétés requises sont definies ?

```typescript
// Le builder classique ne garantit pas que tout est defini :
// const user = new UserBuilder().setNom("Alice").build();
// Oups ! Email et age sont manquants, mais ca compile...

// Solution : Builder avec types fantomes (phantom types)
// qui track l'etat de construction DANS le systeme de types
```

### Implementation avec phantom types

```typescript
// Definir l'objet final
interface ConfigServeur {
  port: number;
  host: string;
  baseDeDonnees: string;
  motDePasse: string;
  ssl: boolean;
  maxConnexions: number;
}

// Types marqueurs pour les champs obligatoires
type NonDefini = { readonly _marque: "NonDefini" };
type Defini = { readonly _marque: "Defini" };

// Builder avec suivi d'etat dans les generics
class BuilderConfigServeur<
  Port = NonDefini,
  Host = NonDefini,
  BDD = NonDefini,
  MDP = NonDefini
> {
  private config: Partial<ConfigServeur> = {
    ssl: false,
    maxConnexions: 100,
  };

  // Chaque setter retourne un NOUVEAU type avec le champ marque comme Defini
  port(port: number): BuilderConfigServeur<Defini, Host, BDD, MDP> {
    this.config.port = port;
    return this as unknown as BuilderConfigServeur<Defini, Host, BDD, MDP>;
  }

  host(host: string): BuilderConfigServeur<Port, Defini, BDD, MDP> {
    this.config.host = host;
    return this as unknown as BuilderConfigServeur<Port, Defini, BDD, MDP>;
  }

  baseDeDonnees(url: string): BuilderConfigServeur<Port, Host, Defini, MDP> {
    this.config.baseDeDonnees = url;
    return this as unknown as BuilderConfigServeur<Port, Host, Defini, MDP>;
  }

  motDePasse(mdp: string): BuilderConfigServeur<Port, Host, BDD, Defini> {
    this.config.motDePasse = mdp;
    return this as unknown as BuilderConfigServeur<Port, Host, BDD, Defini>;
  }

  // Setters optionnels (ne changent pas les generics)
  ssl(actif: boolean): this {
    this.config.ssl = actif;
    return this;
  }

  maxConnexions(max: number): this {
    this.config.maxConnexions = max;
    return this;
  }

  // build() n'est disponible QUE quand tous les champs sont Defini
  build(
    this: BuilderConfigServeur<Defini, Defini, Defini, Defini>
  ): ConfigServeur {
    return this.config as ConfigServeur;
  }
}

// Utilisation type-safe
const config = new BuilderConfigServeur()
  .port(3000)
  .host("localhost")
  .baseDeDonnees("postgresql://localhost/mydb")
  .motDePasse("secret123")
  .ssl(true)
  .maxConnexions(50)
  .build(); // OK : tous les champs obligatoires sont definis

// Erreur de compilation si un champ manque :
// const configIncomplete = new BuilderConfigServeur()
//   .port(3000)
//   .host("localhost")
//   .build(); // ERREUR : 'build' n'existe pas sur BuilderConfigServeur<Defini, Defini, NonDefini, NonDefini>
```

---

## Pattern Result<T, E> (Railway Oriented Programming)

### Le problème

Les exceptions en JavaScript sont "invisibles" dans les types. Une fonction peut
lancer une erreur, mais le type de retour ne le dit pas. Le pattern Result rend
les erreurs EXPLICITES dans le système de types.

> **Analogie du chemin de fer** : Imaginez deux rails paralleles — le rail "succes"
> et le rail "erreur". Une fois que le train passe sur le rail erreur, il y reste.
> Chaque operation vérifié d'abord si on est sur le bon rail avant de s'exécuter.

```typescript
// Definition du type Result
type Result<T, E = Error> =
  | { ok: true; valeur: T }
  | { ok: false; erreur: E };

// Fonctions de construction
function succes<T>(valeur: T): Result<T, never> {
  return { ok: true, valeur };
}

function erreur<E>(err: E): Result<never, E> {
  return { ok: false, erreur: err };
}

// Erreurs typees pour notre domaine
type ErreurValidation = {
  type: "validation";
  champ: string;
  message: string;
};

type ErreurBDD = {
  type: "base_de_donnees";
  code: string;
  message: string;
};

type ErreurReseau = {
  type: "reseau";
  statut: number;
  message: string;
};

type ErreurApplication = ErreurValidation | ErreurBDD | ErreurReseau;
```

### Chainer les operations (map, flatMap)

```typescript
// Fonctions utilitaires pour Result
namespace Result {
  /** Transformer la valeur si succes */
  export function map<T, U, E>(
    resultat: Result<T, E>,
    fn: (val: T) => U
  ): Result<U, E> {
    if (resultat.ok) {
      return succes(fn(resultat.valeur));
    }
    return resultat;
  }

  /** Chainer avec une fonction qui retourne un Result */
  export function flatMap<T, U, E>(
    resultat: Result<T, E>,
    fn: (val: T) => Result<U, E>
  ): Result<U, E> {
    if (resultat.ok) {
      return fn(resultat.valeur);
    }
    return resultat;
  }

  /** Transformer l'erreur */
  export function mapErreur<T, E, F>(
    resultat: Result<T, E>,
    fn: (err: E) => F
  ): Result<T, F> {
    if (!resultat.ok) {
      return erreur(fn(resultat.erreur));
    }
    return resultat;
  }

  /** Extraire la valeur ou fournir un defaut */
  export function ouDefaut<T, E>(resultat: Result<T, E>, defaut: T): T {
    return resultat.ok ? resultat.valeur : defaut;
  }

  /** Extraire la valeur ou lancer une exception */
  export function ouLancer<T, E>(resultat: Result<T, E>): T {
    if (resultat.ok) return resultat.valeur;
    throw resultat.erreur;
  }

  /** Capturer une exception et la convertir en Result */
  export function capturer<T>(fn: () => T): Result<T, Error> {
    try {
      return succes(fn());
    } catch (e) {
      return erreur(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Version asynchrone de capturer */
  export async function capturerAsync<T>(
    fn: () => Promise<T>
  ): Promise<Result<T, Error>> {
    try {
      return succes(await fn());
    } catch (e) {
      return erreur(e instanceof Error ? e : new Error(String(e)));
    }
  }
}

// Utilisation : pipeline type-safe sans exceptions

function validerEmail(email: string): Result<string, ErreurValidation> {
  if (!email.includes("@")) {
    return erreur({
      type: "validation",
      champ: "email",
      message: "Email invalide",
    });
  }
  return succes(email.toLowerCase());
}

function validerAge(age: number): Result<number, ErreurValidation> {
  if (age < 0 || age > 150) {
    return erreur({
      type: "validation",
      champ: "age",
      message: "Age hors limites",
    });
  }
  return succes(age);
}

interface UtilisateurValide {
  email: string;
  age: number;
}

function creerUtilisateur(
  email: string,
  age: number
): Result<UtilisateurValide, ErreurValidation> {
  const emailResult = validerEmail(email);
  if (!emailResult.ok) return emailResult;

  const ageResult = validerAge(age);
  if (!ageResult.ok) return ageResult;

  return succes({ email: emailResult.valeur, age: ageResult.valeur });
}

// Utilisation
const resultat = creerUtilisateur("alice@exemple.fr", 30);
if (resultat.ok) {
  console.log(`Utilisateur cree : ${resultat.valeur.email}`);
} else {
  console.log(`Erreur dans ${resultat.erreur.champ}: ${resultat.erreur.message}`);
}
```

---

## Pattern Option/Maybe

```typescript
// Le type Option represente une valeur qui peut etre absente
// C'est l'alternative type-safe a null/undefined

type Option<T> = { some: true; valeur: T } | { some: false };

// Constructeurs
function some<T>(valeur: T): Option<T> {
  return { some: true, valeur };
}

function none<T = never>(): Option<T> {
  return { some: false };
}

// Utilitaires
namespace Option {
  export function depuis<T>(valeur: T | null | undefined): Option<T> {
    return valeur != null ? some(valeur) : none();
  }

  export function map<T, U>(opt: Option<T>, fn: (val: T) => U): Option<U> {
    return opt.some ? some(fn(opt.valeur)) : none();
  }

  export function flatMap<T, U>(
    opt: Option<T>,
    fn: (val: T) => Option<U>
  ): Option<U> {
    return opt.some ? fn(opt.valeur) : none();
  }

  export function ouDefaut<T>(opt: Option<T>, defaut: T): T {
    return opt.some ? opt.valeur : defaut;
  }

  export function filtrer<T>(
    opt: Option<T>,
    predicat: (val: T) => boolean
  ): Option<T> {
    return opt.some && predicat(opt.valeur) ? opt : none();
  }

  export function estSome<T>(opt: Option<T>): opt is { some: true; valeur: T } {
    return opt.some;
  }
}

// Exemple d'utilisation
function trouverUtilisateur(id: string): Option<Utilisateur> {
  const users: Record<string, Utilisateur> = {
    "1": { nom: "Alice", email: "alice@ex.fr", age: 30 },
  };
  return Option.depuis(users[id]);
}

const resultat = trouverUtilisateur("1");
const nom = Option.map(resultat, (u) => u.nom);
const nomOuDefaut = Option.ouDefaut(nom, "Inconnu");
console.log(nomOuDefaut); // "Alice"
```

---

## Branded Types avances

### USD, EUR comme types distincts

```typescript
// Types de marque generiques
declare const __marque: unique symbol;
type Marque<T, B extends string> = T & { [__marque]: B };

// Monnaies
type EUR = Marque<number, "EUR">;
type USD = Marque<number, "USD">;
type GBP = Marque<number, "GBP">;

// Constructeurs avec validation
function eur(montant: number): EUR {
  if (!Number.isFinite(montant)) throw new Error("Montant invalide");
  return Math.round(montant * 100) / 100 as unknown as EUR;
}

function usd(montant: number): USD {
  if (!Number.isFinite(montant)) throw new Error("Montant invalide");
  return Math.round(montant * 100) / 100 as unknown as USD;
}

// Operations type-safe
function additionnerEUR(a: EUR, b: EUR): EUR {
  return eur((a as unknown as number) + (b as unknown as number));
}

function convertirEURversUSD(montant: EUR, taux: number): USD {
  return usd((montant as unknown as number) * taux);
}

// Utilisation
const prixArticle = eur(29.99);
const fraisLivraison = eur(4.99);
const total = additionnerEUR(prixArticle, fraisLivraison);
const totalUSD = convertirEURversUSD(total, 1.08);

// Impossible de melanger les devises :
// additionnerEUR(prixArticle, usd(10)); // ERREUR de type !
```

---

## Phantom Types (Types fantomes)

```typescript
// Les phantom types sont des parametres de type qui n'apparaissent pas
// dans la structure de donnees, mais servent de "marqueur" au compile time

// Exemple : un formulaire avec des etats de validation
type NonValide = { readonly _etat: "non_valide" };
type Valide = { readonly _etat: "valide" };
type Soumis = { readonly _etat: "soumis" };

interface Formulaire<Etat> {
  donnees: Record<string, string>;
  // Le champ _etat n'existe pas au runtime !
  // Il sert uniquement a tracker l'etat dans le systeme de types
}

function creerFormulaire(): Formulaire<NonValide> {
  return { donnees: {} };
}

function remplir(
  form: Formulaire<NonValide>,
  champ: string,
  valeur: string
): Formulaire<NonValide> {
  return { donnees: { ...form.donnees, [champ]: valeur } };
}

function valider(
  form: Formulaire<NonValide>
): Result<Formulaire<Valide>, string> {
  // Logique de validation...
  if (Object.keys(form.donnees).length === 0) {
    return erreur("Le formulaire est vide");
  }
  return succes(form as unknown as Formulaire<Valide>);
}

function soumettre(
  form: Formulaire<Valide> // SEULS les formulaires valides peuvent etre soumis
): Formulaire<Soumis> {
  console.log("Soumission des donnees:", form.donnees);
  return form as unknown as Formulaire<Soumis>;
}

// Utilisation — Le compilateur empeche les operations invalides
let form = creerFormulaire();
form = remplir(form, "nom", "Alice");
form = remplir(form, "email", "alice@exemple.fr");

const validationResult = valider(form);
if (validationResult.ok) {
  const soumis = soumettre(validationResult.valeur); // OK
  // soumettre(form); // ERREUR : form est NonValide, pas Valide !
}
```

---

## Type-State Pattern

```typescript
// Le type-state pattern encode l'etat d'un objet dans son type
// pour que les transitions invalides soient detectees a la compilation

// Exemple : machine a cafe avec etats
type Eteint = "eteint";
type Pret = "pret";
type EnPreparation = "en_preparation";
type Termine = "termine";

class MachineACafe<Etat extends string = Eteint> {
  private etat: Etat;

  private constructor(etat: Etat) {
    this.etat = etat;
  }

  static creer(): MachineACafe<Eteint> {
    return new MachineACafe("eteint" as Eteint);
  }

  // Seule une machine eteinte peut etre allumee
  allumer(this: MachineACafe<Eteint>): MachineACafe<Pret> {
    console.log("Machine allumee !");
    return new MachineACafe("pret" as Pret) as unknown as MachineACafe<Pret>;
  }

  // Seule une machine prete peut lancer une preparation
  preparerCafe(this: MachineACafe<Pret>): MachineACafe<EnPreparation> {
    console.log("Preparation en cours...");
    return new MachineACafe("en_preparation" as EnPreparation) as unknown as MachineACafe<EnPreparation>;
  }

  // Seule une machine en preparation peut terminer
  terminer(this: MachineACafe<EnPreparation>): MachineACafe<Termine> {
    console.log("Cafe pret !");
    return new MachineACafe("termine" as Termine) as unknown as MachineACafe<Termine>;
  }

  // Une machine terminee peut etre remise a pret
  reinitialiser(this: MachineACafe<Termine>): MachineACafe<Pret> {
    console.log("Machine reintialisee");
    return new MachineACafe("pret" as Pret) as unknown as MachineACafe<Pret>;
  }

  // L'extinction est possible depuis n'importe quel etat sauf eteint
  eteindre(this: MachineACafe<Pret> | MachineACafe<Termine>): MachineACafe<Eteint> {
    console.log("Machine eteinte");
    return new MachineACafe("eteint" as Eteint) as unknown as MachineACafe<Eteint>;
  }
}

// Utilisation — les transitions invalides sont des ERREURS de compilation
const machine = MachineACafe.creer()  // Eteint
  .allumer()                           // -> Pret
  .preparerCafe()                      // -> EnPreparation
  .terminer()                          // -> Termine
  .reinitialiser()                     // -> Pret
  .eteindre();                         // -> Eteint

// machine.preparerCafe(); // ERREUR : une machine eteinte ne peut pas preparer de cafe
// MachineACafe.creer().preparerCafe(); // ERREUR : pas prete
```

---

## Dependency Injection (Injection de dépendances)

```typescript
// Injection de dependances type-safe sans framework

// 1. Definir les interfaces des services
interface ServiceBDD {
  requete<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: ServiceBDD) => Promise<T>): Promise<T>;
}

interface ServiceEmail {
  envoyer(destinataire: string, sujet: string, corps: string): Promise<boolean>;
}

interface ServiceJournal {
  info(message: string, meta?: Record<string, unknown>): void;
  erreur(message: string, err?: Error): void;
}

// 2. Definir le conteneur de dependances avec un type mapping
interface Dependances {
  bdd: ServiceBDD;
  email: ServiceEmail;
  journal: ServiceJournal;
}

// 3. Conteneur DI simple et type-safe
class Conteneur {
  private factories = new Map<string, () => unknown>();
  private instances = new Map<string, unknown>();

  enregistrer<K extends keyof Dependances>(
    nom: K,
    factory: () => Dependances[K]
  ): void {
    this.factories.set(nom as string, factory);
  }

  resoudre<K extends keyof Dependances>(nom: K): Dependances[K] {
    // Singleton : reutiliser l'instance existante
    if (this.instances.has(nom as string)) {
      return this.instances.get(nom as string) as Dependances[K];
    }

    const factory = this.factories.get(nom as string);
    if (!factory) {
      throw new Error(`Dependance "${String(nom)}" non enregistree`);
    }

    const instance = factory() as Dependances[K];
    this.instances.set(nom as string, instance);
    return instance;
  }
}

// 4. Configuration du conteneur
const conteneur = new Conteneur();

conteneur.enregistrer("journal", () => ({
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
  erreur: (msg, err) => console.error(`[ERROR] ${msg}`, err),
}));

conteneur.enregistrer("bdd", () => ({
  async requete(sql, params) {
    const journal = conteneur.resoudre("journal");
    journal.info("Requete SQL", { sql, params });
    return [];
  },
  async transaction(fn) {
    return fn(conteneur.resoudre("bdd"));
  },
}));

conteneur.enregistrer("email", () => ({
  async envoyer(dest, sujet, corps) {
    const journal = conteneur.resoudre("journal");
    journal.info(`Email envoye a ${dest}: ${sujet}`);
    return true;
  },
}));

// 5. Utilisation dans un service
class ServiceInscription {
  constructor(
    private bdd: ServiceBDD,
    private email: ServiceEmail,
    private journal: ServiceJournal
  ) {}

  async inscrire(nom: string, emailAddr: string): Promise<Result<string, string>> {
    this.journal.info(`Inscription de ${nom}`);

    try {
      await this.bdd.requete("INSERT INTO users (nom, email) VALUES ($1, $2)", [
        nom, emailAddr,
      ]);
      await this.email.envoyer(emailAddr, "Bienvenue !", `Bonjour ${nom} !`);
      return succes(`Utilisateur ${nom} inscrit`);
    } catch (e) {
      this.journal.erreur("Erreur d'inscription", e as Error);
      return erreur("Echec de l'inscription");
    }
  }
}

// Instanciation avec injection
const serviceInscription = new ServiceInscription(
  conteneur.resoudre("bdd"),
  conteneur.resoudre("email"),
  conteneur.resoudre("journal")
);
```

---

## Patterns fonctionnels : pipe & compose type-safe

```typescript
// pipe : chaine des fonctions de gauche a droite
// compose : chaine des fonctions de droite a gauche

// Implementation type-safe de pipe (jusqu'a 6 fonctions)
function pipe<A>(valeur: A): A;
function pipe<A, B>(valeur: A, fn1: (a: A) => B): B;
function pipe<A, B, C>(valeur: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
function pipe<A, B, C, D>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): D;
function pipe<A, B, C, D, E>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E
): E;
function pipe(valeur: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown {
  return fns.reduce((acc, fn) => fn(acc), valeur);
}

// Utilisation — Chaque etape est type-safe
const resultatPipe = pipe(
  "  Alice Dupont  ",
  (s: string) => s.trim(),          // string -> string
  (s) => s.split(" "),              // string -> string[]
  (parts) => parts.map((p) =>      // string[] -> string[]
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ),
  (parts) => parts.join(" ")       // string[] -> string
);
// resultatPipe est de type string = "Alice Dupont"

// compose : meme chose mais de droite a gauche
function compose<A, B>(fn1: (a: A) => B): (a: A) => B;
function compose<A, B, C>(
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => C;
function compose<A, B, C, D>(
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => D;
function compose(...fns: Array<(arg: unknown) => unknown>) {
  return (valeur: unknown) =>
    fns.reduceRight((acc, fn) => fn(acc), valeur);
}

// Utilisation de compose
const formaterNom = compose(
  (parts: string[]) => parts.join(" "),
  (parts: string[]) => parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
  (s: string) => s.trim().split(" ")
);

console.log(formaterNom("  alice dupont  ")); // "Alice Dupont"
```

---

## Error Handling Patterns

```typescript
// Pattern : erreurs exhaustives avec le systeme de types

// 1. Definir tous les types d'erreur possibles
type ErreurHTTP =
  | { type: "non_trouve"; ressource: string }
  | { type: "non_autorise"; raison: string }
  | { type: "validation"; champs: string[] }
  | { type: "serveur"; message: string; stack?: string };

// 2. Fonction qui retourne un Result type
function traiterErreur(erreur: ErreurHTTP): {
  statut: number;
  corps: { message: string };
} {
  switch (erreur.type) {
    case "non_trouve":
      return {
        statut: 404,
        corps: { message: `${erreur.ressource} non trouve(e)` },
      };
    case "non_autorise":
      return {
        statut: 401,
        corps: { message: `Non autorise : ${erreur.raison}` },
      };
    case "validation":
      return {
        statut: 400,
        corps: {
          message: `Champs invalides : ${erreur.champs.join(", ")}`,
        },
      };
    case "serveur":
      return {
        statut: 500,
        corps: { message: "Erreur interne du serveur" },
      };
    default:
      // Exhaustiveness check : si on ajoute un nouveau type d'erreur
      // sans ajouter de case, TypeScript signale une erreur ici
      const _exhaustif: never = erreur;
      return _exhaustif;
  }
}
```

---

## Pratique

### Exercice 1 : Implementer un EventEmitter type-safe

Creez un EventEmitter qui supporte les wildcards (ecouter `"user:*"` pour
capter `"user:login"`, `"user:logout"`, etc.) :

<details>
<summary>Solution</summary>

```typescript
// EventEmitter avec wildcards
interface EvenementsPourWildcard {
  "user:login": { userId: string };
  "user:logout": { userId: string; raison: string };
  "user:update": { userId: string; champs: string[] };
  "post:create": { postId: string; titre: string };
  "post:delete": { postId: string };
}

// Extraire les evenements qui matchent un pattern wildcard
type MatchWildcard<Map, Pattern extends string> =
  Pattern extends `${infer Prefix}:*`
    ? { [K in keyof Map as K extends `${Prefix}:${string}` ? K : never]: Map[K] }
    : { [K in keyof Map as K extends Pattern ? K : never]: Map[K] };

// Les payloads possibles pour un pattern
type PayloadsWildcard<Map, Pattern extends string> =
  MatchWildcard<Map, Pattern>[keyof MatchWildcard<Map, Pattern>];

class EmetteurAvecWildcard<E extends Record<string, unknown>> {
  private ecouteurs = new Map<string, Set<(payload: unknown) => void>>();

  sur<K extends keyof E & string>(
    evenement: K,
    ecouteur: (payload: E[K]) => void
  ): () => void {
    if (!this.ecouteurs.has(evenement)) {
      this.ecouteurs.set(evenement, new Set());
    }
    this.ecouteurs.get(evenement)!.add(ecouteur as (p: unknown) => void);
    return () => this.ecouteurs.get(evenement)?.delete(ecouteur as (p: unknown) => void);
  }

  surWildcard<P extends `${string}:*`>(
    pattern: P,
    ecouteur: (payload: PayloadsWildcard<E, P>) => void
  ): () => void {
    const prefix = pattern.slice(0, -1); // Enlever le *
    if (!this.ecouteurs.has(pattern)) {
      this.ecouteurs.set(pattern, new Set());
    }
    this.ecouteurs.get(pattern)!.add(ecouteur as (p: unknown) => void);
    return () => this.ecouteurs.get(pattern)?.delete(ecouteur as (p: unknown) => void);
  }

  emettre<K extends keyof E & string>(evenement: K, payload: E[K]): void {
    // Ecouteurs exacts
    this.ecouteurs.get(evenement)?.forEach((fn) => fn(payload));
    // Ecouteurs wildcard
    for (const [pattern, ecouteurs] of this.ecouteurs) {
      if (pattern.endsWith(":*")) {
        const prefix = pattern.slice(0, -1);
        if (evenement.startsWith(prefix)) {
          ecouteurs.forEach((fn) => fn(payload));
        }
      }
    }
  }
}

// Utilisation
const bus = new EmetteurAvecWildcard<EvenementsPourWildcard>();

// Ecouter tous les evenements user:*
bus.surWildcard("user:*", (payload) => {
  // payload est { userId: string } | { userId: string; raison: string } | ...
  console.log("Evenement utilisateur :", payload);
});

bus.emettre("user:login", { userId: "123" }); // Declenche le wildcard
bus.emettre("post:create", { postId: "456", titre: "Mon post" }); // Ne declenche pas
```

</details>

### Exercice 2 : Créer un Builder générique

Creez un builder générique qui fonctionne avec N'IMPORTE QUEL type :

<details>
<summary>Solution</summary>

```typescript
// Builder generique pour n'importe quel type
type BuilderType<T, Definis extends keyof T = never> = {
  [K in keyof T as K extends Definis ? never : K]-?: (
    valeur: T[K]
  ) => BuilderType<T, Definis | K>;
} & (Definis extends keyof T
  ? [Exclude<keyof T, Definis>] extends [never]
    ? { build(): T }
    : {}
  : {});

function creerBuilder<T>(): BuilderType<T> {
  const donnees: Partial<T> = {};

  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      if (prop === "build") {
        return () => ({ ...donnees }) as T;
      }
      return (valeur: unknown) => {
        (donnees as Record<string, unknown>)[prop] = valeur;
        return new Proxy({}, handler);
      };
    },
  };

  return new Proxy({}, handler) as BuilderType<T>;
}

// Utilisation
interface Produit {
  nom: string;
  prix: number;
  categorie: string;
}

const produit = creerBuilder<Produit>()
  .nom("Clavier")
  .prix(49.99)
  .categorie("Informatique")
  .build();

console.log(produit); // { nom: "Clavier", prix: 49.99, categorie: "Informatique" }
```

</details>

### Exercice 3 : Pipeline d'erreurs avec Result

Creez un pipeline complet de traitement d'un formulaire d'inscription :

<details>
<summary>Solution</summary>

```typescript
// Pipeline complet avec Result

interface FormulaireInscription {
  nom: string;
  email: string;
  motDePasse: string;
  age: string; // Vient du formulaire comme string
}

interface UtilisateurCree {
  id: string;
  nom: string;
  email: string;
  ageVerifie: number;
}

type ErreurInscription =
  | { etape: "validation"; champ: string; message: string }
  | { etape: "doublon"; email: string }
  | { etape: "technique"; message: string };

// Chaque etape retourne un Result
function validerNom(
  nom: string
): Result<string, ErreurInscription> {
  if (nom.length < 2) {
    return erreur({ etape: "validation", champ: "nom", message: "Trop court" });
  }
  return succes(nom.trim());
}

function validerEmailInscription(
  email: string
): Result<string, ErreurInscription> {
  if (!email.includes("@")) {
    return erreur({ etape: "validation", champ: "email", message: "Email invalide" });
  }
  return succes(email.toLowerCase());
}

function validerMotDePasse(
  mdp: string
): Result<string, ErreurInscription> {
  if (mdp.length < 8) {
    return erreur({
      etape: "validation",
      champ: "motDePasse",
      message: "Minimum 8 caracteres",
    });
  }
  return succes(mdp);
}

function parserAge(
  ageStr: string
): Result<number, ErreurInscription> {
  const age = parseInt(ageStr, 10);
  if (isNaN(age) || age < 13 || age > 150) {
    return erreur({
      etape: "validation",
      champ: "age",
      message: "Age invalide (13-150)",
    });
  }
  return succes(age);
}

// Pipeline complet
function inscrire(
  formulaire: FormulaireInscription
): Result<UtilisateurCree, ErreurInscription> {
  const nomR = validerNom(formulaire.nom);
  if (!nomR.ok) return nomR;

  const emailR = validerEmailInscription(formulaire.email);
  if (!emailR.ok) return emailR;

  const mdpR = validerMotDePasse(formulaire.motDePasse);
  if (!mdpR.ok) return mdpR;

  const ageR = parserAge(formulaire.age);
  if (!ageR.ok) return ageR;

  return succes({
    id: crypto.randomUUID(),
    nom: nomR.valeur,
    email: emailR.valeur,
    ageVerifie: ageR.valeur,
  });
}

// Utilisation
const resultatInscription = inscrire({
  nom: "Alice Dupont",
  email: "alice@exemple.fr",
  motDePasse: "MonMotDePasse123",
  age: "30",
});

if (resultatInscription.ok) {
  console.log("Inscrit:", resultatInscription.valeur);
} else {
  console.error("Erreur:", resultatInscription.erreur);
}
```

</details>

---

## Pattern Disposable — `using` et gestion des ressources (ES2025)

### Le problème

En JavaScript, la gestion des ressources (fichiers, connexions BDD, verrous, répertoires
temporaires) est manuelle et fragile. Si une exception survient entre l'ouverture et la
fermeture d'une ressource, on a une **fuite de ressource** :

```typescript
// PROBLEME : si readData() lance une exception, la connexion n'est jamais fermée
const conn = await openDatabaseConnection();
const data = await readData(conn);
await conn.close(); // ← jamais atteint si readData() échoue !
```

Le pattern `try/finally` fonctionne mais est verbeux et source d'erreurs :

```typescript
const conn = await openDatabaseConnection();
try {
  const data = await readData(conn);
  return data;
} finally {
  await conn.close(); // OK mais verbeux, et on oublie facilement
}
```

> **Analogie du robinet** : Ouvrir une ressource sans la fermer, c'est comme ouvrir
> un robinet et quitter la pièce. Le `using` est un robinet automatique qui se ferme
> dès que tu sors de la pièce — impossible d'oublier.

### Les symboles `Symbol.dispose` et `Symbol.asyncDispose`

ES2025 introduit deux nouveaux symboles globaux qui servent de "contrat" pour
indiquer qu'un objet sait se nettoyer :

```typescript
// Symbol.dispose : nettoyage synchrone
// Symbol.asyncDispose : nettoyage asynchrone (retourne une Promise)

// Un objet Disposable implementer Symbol.dispose
const verrou = {
  acquis: true,
  [Symbol.dispose]() {
    this.acquis = false;
    console.log("Verrou libere automatiquement");
  },
};

// Un objet AsyncDisposable implemente Symbol.asyncDispose
const connexion = {
  ouverte: true,
  async [Symbol.asyncDispose]() {
    await envoyerRequeteFermeture();
    this.ouverte = false;
    console.log("Connexion fermee proprement");
  },
};
```

### Les interfaces `Disposable` et `AsyncDisposable`

TypeScript fournit des interfaces pour typer ces objets :

```typescript
// Deja defini dans lib.esnext.disposable.d.ts
interface Disposable {
  [Symbol.dispose](): void;
}

interface AsyncDisposable {
  [Symbol.asyncDispose](): PromiseLike<void>;
}
```

### Les declarations `using` et `await using`

Le mot-cle `using` déclare une variable dont la ressource sera **automatiquement
disposee** a la sortie du bloc (scope) :

```typescript
// using : pour les ressources synchrones (Disposable)
function traiterFichier(chemin: string): void {
  using fichier = ouvrirFichier(chemin);
  // ... travailler avec le fichier ...
  // A la sortie du bloc, fichier[Symbol.dispose]() est appele automatiquement
  // Meme si une exception est lancee !
}

// await using : pour les ressources asynchrones (AsyncDisposable)
async function traiterDonnees(): Promise<void> {
  await using conn = await ouvrirConnexionBDD();
  await using transaction = await conn.beginTransaction();

  await transaction.execute("INSERT INTO logs VALUES (...)");
  await transaction.commit();
  // A la sortie : transaction puis conn sont fermees dans l'ORDRE INVERSE
}
```

### `DisposableStack` et `AsyncDisposableStack`

Quand tu gères plusieurs ressources dynamiquement (nombre variable, boucles),
les stacks permettent de les regrouper :

```typescript
// DisposableStack : regroupe plusieurs ressources synchrones
function creerEnvironnementTest(): Disposable {
  const stack = new DisposableStack();

  // Chaque ressource ajoutee sera disposee dans l'ordre inverse
  const serveur = stack.use(creerServeurMock());
  const bdd = stack.use(creerBDDMemoire());
  const cache = stack.use(creerCacheLocal());

  // On peut aussi ajouter un callback de nettoyage
  stack.defer(() => {
    console.log("Nettoyage des fichiers temporaires");
    supprimerDossierTemp();
  });

  // Retourner la stack elle-meme (elle est Disposable)
  return stack;
}

// Utilisation
{
  using env = creerEnvironnementTest();
  // ... executer les tests ...
  // A la sortie : cache, bdd, serveur sont nettoyes dans cet ordre
}

// AsyncDisposableStack : meme chose pour les ressources async
async function creerPipeline(): Promise<AsyncDisposable> {
  const stack = new AsyncDisposableStack();

  const producer = stack.use(await creerProducteurKafka());
  const consumer = stack.use(await creerConsommateurKafka());

  stack.defer(async () => {
    await nettoyerTopicsTemporaires();
  });

  return stack;
}
```

### Exemples pratiques

#### File handles (Node.js)

```typescript
import { open } from "node:fs/promises";

// Le FileHandle de Node.js implemente deja AsyncDisposable !
async function lireFichier(chemin: string): Promise<string> {
  await using handle = await open(chemin, "r");
  const contenu = await handle.readFile({ encoding: "utf-8" });
  return contenu;
  // handle.close() est appele automatiquement
}
```

#### Connexions BDD

```typescript
class ConnexionPostgres implements AsyncDisposable {
  private client: PoolClient;

  private constructor(client: PoolClient) {
    this.client = client;
  }

  static async ouvrir(pool: Pool): Promise<ConnexionPostgres> {
    const client = await pool.connect();
    return new ConnexionPostgres(client);
  }

  async requete<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.client.release();
    console.log("Connexion rendue au pool");
  }
}

// Utilisation — impossible d'oublier de liberer la connexion
async function obtenirUtilisateurs(pool: Pool): Promise<Utilisateur[]> {
  await using conn = await ConnexionPostgres.ouvrir(pool);
  return conn.requete<Utilisateur>("SELECT * FROM utilisateurs");
}
```

#### Répertoires temporaires

```typescript
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

class RepertoireTemp implements AsyncDisposable {
  private constructor(public readonly chemin: string) {}

  static async creer(prefix: string = "app-"): Promise<RepertoireTemp> {
    const chemin = await mkdtemp(join(tmpdir(), prefix));
    return new RepertoireTemp(chemin);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await rm(this.chemin, { recursive: true, force: true });
    console.log(`Repertoire temporaire supprime : ${this.chemin}`);
  }
}

// Utilisation
async function traiterUpload(fichier: Buffer): Promise<string> {
  await using tmpDir = await RepertoireTemp.creer("upload-");
  const cheminFichier = join(tmpDir.chemin, "data.bin");
  await writeFile(cheminFichier, fichier);
  const resultat = await analyserFichier(cheminFichier);
  return resultat;
  // Le repertoire temporaire est supprime automatiquement
}
```

### Quand utiliser `using` ?

| Situation | Utiliser `using` ? | Pourquoi |
|-----------|-------------------|----------|
| Connexion BDD | Oui (`await using`) | Liberer la connexion au pool |
| File handle | Oui (`await using`) | Fermer le descripteur de fichier |
| Verrou / Mutex | Oui (`using`) | Liberer le verrou automatiquement |
| Répertoire temporaire | Oui (`await using`) | Supprimer les fichiers temp |
| Transaction BDD | Oui (`await using`) | Rollback automatique si non commit |
| Timer / Intervalle | Oui (`using`) | clearTimeout / clearInterval |
| Variable simple | Non | Pas de ressource a liberer |
| Objet en memoire | Non | Le GC s'en occupe |

> **Pré-requis tsconfig** : pour utiliser `using`, il faut au minimum
> `"target": "es2022"` et `"lib": ["es2022", "esnext.disposable"]` dans
> votre `tsconfig.json`.

---

## Récapitulatif

| Pattern                | Description                                           | Avantage TypeScript                    |
|------------------------|-------------------------------------------------------|----------------------------------------|
| **Strategy**           | Algorithme interchangeable                            | Generics pour typer les stratégies      |
| **Observer**           | Pub/Sub avec événements types                         | EventMap garantit les types de payload  |
| **Builder**            | Construction pas a pas                                | Phantom types pour les champs requis    |
| **Result<T, E>**       | Erreurs explicites dans les types                     | Pattern matching avec narrowing         |
| **Option/Maybe**       | Alternative type-safe a null                          | Monadic chaining avec map/flatMap       |
| **Branded Types**      | Types nominaux (EUR != USD)                           | Marques invisibles au runtime           |
| **Phantom Types**      | Etats encodes dans les generics                       | Transitions validees à la compilation   |
| **Type-State**         | Machine a états dans les types                        | Méthodes conditionelles par état        |
| **DI Container**       | Injection de dépendances type-safe                    | Registry type avec keyof                |
| **pipe/compose**       | Chainer des fonctions                                 | Types inferes a travers la chaine       |
| **Disposable/using**   | Gestion automatique des ressources (ES2025)           | Interfaces Disposable/AsyncDisposable   |

---

## Pour aller plus loin

Dans le prochain module, **Module 19 — Projet final — Bibliotheque utilitaire
type-safe**, nous allons mettre en pratique TOUS ces patterns dans un projet
concret : une bibliotheque utilitaire complete avec EventEmitter, Result, DI
Container, pipe/compose, et bien plus encore.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 18 patterns](../screencasts/screencast-18-patterns.md)
2. **Lab** : [lab-18-patterns](../labs/lab-18-patterns/README)
3. **Quiz** : [quiz 18 patterns](../quizzes/quiz-18-patterns.html)
:::
