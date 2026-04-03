# 10 — Utility Types en profondeur

> **Duree estimee** : 4 heures
> **Difficulte** : 3/5
> **Prérequis** : Generics, types de base, interfaces, unions et intersections
> **Objectifs** :
>
> - Maîtriser tous les utility types natifs de TypeScript
> - Comprendre leur implementation interne
> - Savoir quand et pourquoi les utiliser
> - Combiner les utility types pour des transformations complexes

---

## Introduction — Pourquoi les utility types changent vraiment la vie ?

### Le problème qu'on cherche à résoudre

Dans un projet réel, on repart souvent d'un type existant pour fabriquer une variante :

- une version "mise a jour partielle" d'un objet
- une version "complète" après fusion des valeurs par défaut
- une version "sans certaines clés"
- une version "avec seulement deux propriétés"

Si on écrit toutes ces variantes a la main, on duplique vite les types et on crée des écarts entre eux.

### La solution : transformer les types au lieu de les recopier

Les utility types sont des briques déjà prêtes qui permettent de dire :

- "rends tout optionnel"
- "rends tout obligatoire"
- "garde seulement ces propriétés"
- "retire celles-ci"

Autrement dit, au lieu de réécrire un type, on le **transforme**.

### Analogie : la boite a outils

Pense aux utility types comme a une boite a outils : chaque outil a un usage simple, mais c'est leur combinaison qui te fait gagner un temps énorme et t'évite des erreurs de maintenance.

> 🎯 **Ce qu'il faut retenir** : dans ce module, l'important n'est pas d'apprendre une liste par coeur. L'important est de reconnaître le besoin métier auquel chaque utility type répond.

---

## Partial\<T\>

### Le besoin concret

Tu as un type complet, mais pour une mise a jour tu ne veux pas obliger l'appelant a renvoyer tous les champs.

`Partial<T>` répond exactement a ce cas : il rend toutes les propriétés d'un type **optionnelles**.

### Implementation interne

```typescript
// Voici comment TypeScript implemente Partial en interne
type MonPartial<T> = {
  [P in keyof T]?: T[P];
};
```

### Exemple concret

```typescript
// Definissons un type Utilisateur complet
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  age: number;
  actif: boolean;
}

// Sans Partial, on devrait creer un type separe pour les mises a jour
// Avec Partial, c'est automatique :
type MiseAJourUtilisateur = Partial<Utilisateur>;

// Equivalent a :
// type MiseAJourUtilisateur = {
//   id?: number;
//   nom?: string;
//   email?: string;
//   age?: number;
//   actif?: boolean;
// }

// Cas d'usage typique : une fonction de mise a jour
function mettreAJour(
  id: number,
  modifications: Partial<Utilisateur>,
): Utilisateur {
  const utilisateurExistant: Utilisateur = {
    id: 1,
    nom: "Alice",
    email: "alice@example.com",
    age: 30,
    actif: true,
  };

  // On fusionne les modifications avec l'objet existant
  return { ...utilisateurExistant, ...modifications };
}

// On peut ne passer que les champs a modifier
const resultat = mettreAJour(1, { nom: "Alice Dupont", age: 31 });
```

### Analogie

Imagine un formulaire d'inscription ou tout est obligatoire. `Partial` transforme ce formulaire en formulaire de modification : on ne remplit que ce qu'on veut changer.

> 💡 **Comment lire `Partial<Utilisateur>` ?** Comme "une version incomplète mais autorisée de `Utilisateur`".

---

## Required\<T\>

### Le besoin concret

Au départ, certaines propriétés sont optionnelles. Mais après fusion de valeurs par défaut, validation ou normalisation, tu veux garantir que tout est désormais présent.

`Required<T>` est l'inverse de `Partial` : il rend toutes les propriétés **obligatoires**, même celles qui etaient optionnelles.

### Implementation interne

```typescript
// Le "-?" supprime le modificateur optionnel
type MonRequired<T> = {
  [P in keyof T]-?: T[P];
};
```

### Exemple concret

```typescript
// Un type avec des proprietes optionnelles
interface ConfigurationApp {
  theme?: "clair" | "sombre";
  langue?: string;
  notifications?: boolean;
  taillePolice?: number;
}

// Required force toutes les proprietes a etre presentes
type ConfigurationComplete = Required<ConfigurationApp>;

// Cette fonction exige une configuration complete
function initialiserApp(config: ConfigurationComplete): void {
  console.log(`Theme: ${config.theme}`);
  console.log(`Langue: ${config.langue}`);
  console.log(`Notifications: ${config.notifications}`);
  console.log(`Taille police: ${config.taillePolice}`);
}

// Erreur : toutes les proprietes sont requises maintenant
// initialiserApp({ theme: "clair" }); // Erreur !

// OK : tout est renseigne
initialiserApp({
  theme: "clair",
  langue: "fr",
  notifications: true,
  taillePolice: 14,
});
```

### Cas d'usage

`Required` est souvent utilise pour valider qu'une configuration est **complete** avant de l'utiliser, par exemple après avoir fusionne des valeurs par defaut avec des valeurs utilisateur.

> 💡 **Comment lire `Required<ConfigurationApp>` ?** Comme "une version entièrement renseignée de `ConfigurationApp`".

```typescript
// Valeurs par defaut
const defauts: ConfigurationApp = {
  theme: "clair",
  langue: "fr",
  notifications: true,
  taillePolice: 14,
};

// L'utilisateur ne fournit que certaines valeurs
const configUtilisateur: ConfigurationApp = {
  theme: "sombre",
};

// On fusionne et on s'assure que tout est present
const configFinale: Required<ConfigurationApp> = {
  ...defauts,
  ...configUtilisateur,
} as Required<ConfigurationApp>;
```

---

## Readonly\<T\>

### Le besoin concret

Tu veux autoriser la lecture d'un objet, mais empêcher sa modification directe.

`Readonly<T>` rend toutes les propriétés d'un type **en lecture seule**. Toute tentative de modification sera une erreur de compilation.

### Implementation interne

```typescript
type MonReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

### Exemple concret

```typescript
interface Produit {
  id: number;
  nom: string;
  prix: number;
  stock: number;
}

// Creons une version immutable du produit
const produit: Readonly<Produit> = {
  id: 1,
  nom: "Clavier mecanique",
  prix: 89.99,
  stock: 50,
};

// Erreur de compilation ! On ne peut pas modifier un Readonly
// produit.prix = 79.99; // Cannot assign to 'prix' because it is a read-only property

// Pour un etat Redux par exemple
interface EtatApplication {
  utilisateurs: Utilisateur[];
  chargement: boolean;
  erreur: string | null;
}

// L'etat est immutable
function reducer(
  etat: Readonly<EtatApplication>,
  action: any,
): EtatApplication {
  // etat.chargement = true; // Erreur !
  // On doit retourner un nouvel objet
  return { ...etat, chargement: true };
}
```

### Attention : Readonly est superficiel

Point important : `Readonly` protège la propriété elle-même, pas forcément tout ce qu'elle contient profondément.

```typescript
interface Commande {
  id: number;
  articles: { nom: string; quantite: number }[];
}

const commande: Readonly<Commande> = {
  id: 1,
  articles: [{ nom: "Stylo", quantite: 3 }],
};

// Erreur : on ne peut pas reassigner articles
// commande.articles = [];

// Mais attention ! On peut modifier le contenu du tableau
commande.articles.push({ nom: "Cahier", quantite: 1 }); // Pas d'erreur !
// Pour une immutabilite profonde, il faut un DeepReadonly (voir plus loin)
```

---

## Record\<K, T\>

### Le besoin concret

Tu veux décrire un objet-dictionnaire sans écrire chaque clé a la main, tout en imposant le type des clés et celui des valeurs.

`Record<K, T>` construit un type objet dont les **clés** sont de type `K` et les **valeurs** de type `T`.

### Implementation interne

```typescript
type MonRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

### Exemples concrets

```typescript
// Dictionnaire simple : cle string, valeur number
type ScoresJoueurs = Record<string, number>;

const scores: ScoresJoueurs = {
  alice: 100,
  bob: 85,
  charlie: 92,
};

// Avec des cles plus precises grace a une union
type Jour = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi";

interface Horaire {
  debut: string;
  fin: string;
}

// Chaque jour de la semaine a un horaire
type PlanningHebdomadaire = Record<Jour, Horaire>;

const planning: PlanningHebdomadaire = {
  lundi: { debut: "09:00", fin: "17:00" },
  mardi: { debut: "09:00", fin: "17:00" },
  mercredi: { debut: "09:00", fin: "12:00" },
  jeudi: { debut: "09:00", fin: "17:00" },
  vendredi: { debut: "09:00", fin: "16:00" },
};

// Record est tres utile pour les mappings de codes d'erreur
type CodeErreur = 400 | 401 | 403 | 404 | 500;

const messagesErreur: Record<CodeErreur, string> = {
  400: "Requete invalide",
  401: "Non authentifie",
  403: "Acces interdit",
  404: "Ressource introuvable",
  500: "Erreur interne du serveur",
};
```

### Analogie

`Record` c'est comme un **tableau de correspondances** : à chaque clé dans la colonne de gauche correspond exactement une valeur dans la colonne de droite. Comme un dictionnaire français-anglais ou chaque mot français a sa traduction.

---

## Pick\<T, K\>

### Le besoin concret

Tu pars d'un gros type, mais tu n'as besoin que de quelques propriétés bien précises.

`Pick<T, K>` créé un type en ne selectionnant que **certaines propriétés** d'un type existant.

### Implementation interne

```typescript
type MonPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### Exemple concret

```typescript
interface Article {
  id: number;
  titre: string;
  contenu: string;
  auteur: string;
  dateCreation: Date;
  dateModification: Date;
  publie: boolean;
  tags: string[];
}

// Pour une liste, on n'a besoin que d'un apercu
type ApercuArticle = Pick<Article, "id" | "titre" | "auteur" | "dateCreation">;

// Equivalent a :
// type ApercuArticle = {
//   id: number;
//   titre: string;
//   auteur: string;
//   dateCreation: Date;
// }

function afficherListe(articles: ApercuArticle[]): void {
  articles.forEach((article) => {
    console.log(`[${article.id}] ${article.titre} par ${article.auteur}`);
  });
}

// Utile aussi pour les API : envoyer uniquement les champs necessaires
type CreerArticleDTO = Pick<Article, "titre" | "contenu" | "auteur" | "tags">;

function creerArticle(donnees: CreerArticleDTO): Article {
  return {
    ...donnees,
    id: Math.random(),
    dateCreation: new Date(),
    dateModification: new Date(),
    publie: false,
  };
}
```

---

## Omit\<T, K\>

### Le besoin concret

Cette fois, tu veux presque tout garder, sauf quelques propriétés gênantes comme un `id`, un mot de passe ou des champs internes.

`Omit<T, K>` est l'inverse de `Pick` : il créé un type en **excluant** certaines propriétés.

### Implementation interne

```typescript
type MonOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### Exemple concret

```typescript
interface UtilisateurBDD {
  id: number;
  nom: string;
  email: string;
  motDePasse: string; // Hash du mot de passe
  dateInscription: Date;
  dernierLogin: Date;
}

// On ne veut jamais exposer le mot de passe dans les reponses API
type UtilisateurPublic = Omit<UtilisateurBDD, "motDePasse">;

// Pour la creation, on n'a ni id ni dates (generes automatiquement)
type NouvelUtilisateur = Omit<
  UtilisateurBDD,
  "id" | "dateInscription" | "dernierLogin"
>;

function inscrire(donnees: NouvelUtilisateur): UtilisateurPublic {
  const nouvelUtilisateur: UtilisateurBDD = {
    ...donnees,
    id: Date.now(),
    dateInscription: new Date(),
    dernierLogin: new Date(),
  };

  // On retire le mot de passe avant de retourner
  const { motDePasse, ...resultat } = nouvelUtilisateur;
  return resultat;
}
```

### Pick vs Omit : quand utiliser lequel ?

La bonne question a se poser est simple : est-ce que la liste la plus courte est celle des propriétés a garder ou celle des propriétés a retirer ?

```typescript
// Regle simple :
// - Pick quand on veut QUELQUES proprietes d'un type avec BEAUCOUP de proprietes
// - Omit quand on veut PRESQUE TOUTES les proprietes sauf quelques-unes

// 20 proprietes, on en veut 3 -> Pick
type Resume = Pick<GrosType, "a" | "b" | "c">;

// 20 proprietes, on en veut 17 -> Omit
type Presque = Omit<GrosType, "x" | "y" | "z">;
```

---

## Exclude\<T, U\>

### Le besoin concret

Tu travailles sur une union et tu veux en retirer certains cas.

`Exclude<T, U>` supprime d'un type union les membres qui sont assignables a `U`. Il travaille sur des **unions de types**, pas sur des propriétés d'objets.

### Implementation interne

```typescript
// La magie des conditional types distributifs
type MonExclude<T, U> = T extends U ? never : T;
```

### Exemple concret

```typescript
// Supprimer des types d'une union
type Primitif = string | number | boolean | null | undefined;
type PrimitifNonNul = Exclude<Primitif, null | undefined>;
// Resultat : string | number | boolean

// Filtrer des evenements
type Evenement =
  | "click"
  | "scroll"
  | "keydown"
  | "keyup"
  | "mousemove"
  | "mouseenter";
type EvenementClavier = Exclude<
  Evenement,
  "click" | "scroll" | "mousemove" | "mouseenter"
>;
// Resultat : "keydown" | "keyup"

// Combiner avec keyof pour filtrer des cles
interface Formulaire {
  nom: string;
  email: string;
  age: number;
  actif: boolean;
  compteur: number;
}

// Obtenir uniquement les cles dont la valeur est de type string
type ClesTextuelles = {
  [K in keyof Formulaire]: Formulaire[K] extends string ? K : never;
}[keyof Formulaire];
// Resultat : "nom" | "email"
```

### Comment fonctionne la distribution ?

`Exclude` est un excellent exemple pour comprendre la distributivité : TypeScript teste chaque membre de l'union séparément, puis recompose l'union finale.

```typescript
// Exclude distribue le conditional type sur chaque membre de l'union
// Exclude<"a" | "b" | "c", "a"> se decompose en :
// ("a" extends "a" ? never : "a") | ("b" extends "a" ? never : "b") | ("c" extends "a" ? never : "c")
// = never | "b" | "c"
// = "b" | "c"
```

---

## Extract\<T, U\>

### Description

`Extract<T, U>` est l'inverse de `Exclude` : il ne garde que les membres d'une union qui sont assignables a `U`.

### Implementation interne

```typescript
type MonExtract<T, U> = T extends U ? T : never;
```

### Exemple concret

```typescript
// Extraire les types numeriques
type Melange = string | number | boolean | (() => void) | number[];
type Numerique = Extract<Melange, number>;
// Resultat : number

// Extraire les fonctions
type Fonctions = Extract<Melange, Function>;
// Resultat : () => void

// Trouver les cles communes entre deux interfaces
interface Chat {
  nom: string;
  race: string;
  ronronne: boolean;
}

interface Chien {
  nom: string;
  race: string;
  aboie: boolean;
}

type ClesCommunes = Extract<keyof Chat, keyof Chien>;
// Resultat : "nom" | "race"
```

---

## NonNullable\<T\>

### Description

`NonNullable<T>` supprime `null` et `undefined` d'un type.

### Implementation interne

```typescript
type MonNonNullable<T> = T & {};
// Ou de maniere plus explicite :
// type MonNonNullable<T> = Exclude<T, null | undefined>;
```

### Exemple concret

```typescript
// Souvent utilise avec des valeurs potentiellement nulles
type ValeurOptionnelle = string | null | undefined;
type ValeurCertaine = NonNullable<ValeurOptionnelle>;
// Resultat : string

// Utile apres une verification de nullite
function traiter(valeur: string | null | undefined): void {
  if (valeur != null) {
    // Ici TypeScript sait que valeur est string
    const certaine: NonNullable<typeof valeur> = valeur;
    console.log(certaine.toUpperCase());
  }
}

// Avec des proprietes d'interface
interface Reponse {
  donnees: string[] | null;
  erreur: string | undefined;
  meta: { page: number } | null | undefined;
}

type DonneesCertaines = NonNullable<Reponse["donnees"]>;
// Resultat : string[]
```

---

## Parameters\<T\>

### Description

`Parameters<T>` extrait les types des **paramètres** d'une fonction sous forme de tuple.

### Implementation interne

```typescript
type MonParameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

### Exemple concret

```typescript
// Extraire les parametres d'une fonction
function creerUtilisateur(nom: string, age: number, actif: boolean): void {
  // ...
}

type ParamsCreer = Parameters<typeof creerUtilisateur>;
// Resultat : [nom: string, age: number, actif: boolean]

// Utile pour creer des wrappers
function avecLog<T extends (...args: any) => any>(
  fn: T,
  nom: string,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    console.log(`Appel de ${nom} avec`, args);
    const resultat = fn(...args);
    console.log(`Resultat de ${nom}:`, resultat);
    return resultat;
  };
}

// Le wrapper conserve la signature originale
const creerAvecLog = avecLog(creerUtilisateur, "creerUtilisateur");
creerAvecLog("Alice", 30, true); // Autocompletion des parametres !

// Acceder a un parametre specifique
type PremierParam = Parameters<typeof creerUtilisateur>[0]; // string
type DeuxiemeParam = Parameters<typeof creerUtilisateur>[1]; // number
```

---

## ConstructorParameters\<T\>

### Description

`ConstructorParameters<T>` extrait les types des paramètres du **constructeur** d'une classe.

### Implementation interne

```typescript
type MonConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;
```

### Exemple concret

```typescript
class Vehicule {
  constructor(
    public marque: string,
    public modele: string,
    public annee: number,
    public couleur?: string,
  ) {}
}

type ParamsVehicule = ConstructorParameters<typeof Vehicule>;
// Resultat : [marque: string, modele: string, annee: number, couleur?: string]

// Utile pour des factories
function creerVehicule(
  ...args: ConstructorParameters<typeof Vehicule>
): Vehicule {
  return new Vehicule(...args);
}

const voiture = creerVehicule("Renault", "Clio", 2023, "rouge");

// Avec des classes abstraites
abstract class FormeGeometrique {
  constructor(
    public nom: string,
    public cotes: number,
  ) {}
  abstract aire(): number;
}

type ParamsForme = ConstructorParameters<typeof FormeGeometrique>;
// Resultat : [nom: string, cotes: number]
```

---

## ReturnType\<T\>

### Description

`ReturnType<T>` extrait le **type de retour** d'une fonction.

### Implementation interne

```typescript
type MonReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

### Exemple concret

```typescript
// Extraire le type de retour
function obtenirProfil() {
  return {
    nom: "Alice",
    age: 30,
    preferences: {
      theme: "sombre" as const,
      langue: "fr" as const,
    },
  };
}

type Profil = ReturnType<typeof obtenirProfil>;
// Resultat : { nom: string; age: number; preferences: { theme: "sombre"; langue: "fr" } }

// Tres utile avec des fonctions de bibliotheques tierces
// dont on ne controle pas les types
import type { createStore } from "some-library";

// On peut extraire le type retourne sans le connaitre explicitement
type Store = ReturnType<typeof createStore>;

// Avec des fonctions asynchrones, on obtient une Promise
async function chargerDonnees(): Promise<{ items: string[]; total: number }> {
  return { items: ["a", "b"], total: 2 };
}

type ResultatChargement = ReturnType<typeof chargerDonnees>;
// Resultat : Promise<{ items: string[]; total: number }>

// Pour obtenir le type interieur de la Promise, combiner avec Awaited
type DonneesChargees = Awaited<ReturnType<typeof chargerDonnees>>;
// Resultat : { items: string[]; total: number }
```

---

## InstanceType\<T\>

### Description

`InstanceType<T>` extrait le **type d'instance** d'une classe (le type qu'on obtient avec `new`).

### Implementation interne

```typescript
type MonInstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;
```

### Exemple concret

```typescript
class ServiceAuthentification {
  private jeton: string | null = null;

  connecter(email: string, mdp: string): boolean {
    // logique de connexion
    this.jeton = "abc123";
    return true;
  }

  deconnecter(): void {
    this.jeton = null;
  }

  estConnecte(): boolean {
    return this.jeton !== null;
  }
}

// Utile quand on travaille avec typeof d'une classe
type ServiceAuth = InstanceType<typeof ServiceAuthentification>;
// Equivalent a : ServiceAuthentification (le type de l'instance)

// Tres utile dans les factories generiques
function creerInstance<T extends new (...args: any) => any>(
  Classe: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new Classe(...args) as InstanceType<T>;
}

const service = creerInstance(ServiceAuthentification);
// TypeScript sait que service est de type ServiceAuthentification
service.connecter("alice@example.com", "motdepasse");
```

---

## ThisParameterType\<T\> et OmitThisParameter\<T\>

### Description

`ThisParameterType<T>` extrait le type du paramètre `this` d'une fonction.
`OmitThisParameter<T>` supprime le paramètre `this` d'une fonction.

### Implementation interne

```typescript
type MonThisParameterType<T> = T extends (this: infer U, ...args: never) => any
  ? U
  : unknown;

type MonOmitThisParameter<T> =
  unknown extends ThisParameterType<T>
    ? T
    : T extends (...args: infer A) => infer R
      ? (...args: A) => R
      : T;
```

### Exemple concret

```typescript
// Fonction avec un parametre this explicite
function obtenirNom(this: { nom: string; prenom: string }): string {
  return `${this.prenom} ${this.nom}`;
}

type TypeThis = ThisParameterType<typeof obtenirNom>;
// Resultat : { nom: string; prenom: string }

type SansThis = OmitThisParameter<typeof obtenirNom>;
// Resultat : () => string

// Utilisation avec bind
const personne = { nom: "Dupont", prenom: "Jean" };
const getNom: OmitThisParameter<typeof obtenirNom> = obtenirNom.bind(personne);
console.log(getNom()); // "Jean Dupont"
```

---

## Awaited\<T\>

### Description

`Awaited<T>` decompresse recursivement les types `Promise` pour obtenir le type de la valeur resolue.

### Implementation interne simplifiee

```typescript
type MonAwaited<T> = T extends null | undefined
  ? T
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any }
    ? F extends (value: infer V, ...args: infer _) => any
      ? MonAwaited<V>
      : never
    : T;
```

### Exemple concret

```typescript
// Simple Promise
type A = Awaited<Promise<string>>;
// Resultat : string

// Promise imbriquee
type B = Awaited<Promise<Promise<number>>>;
// Resultat : number

// Union de Promises
type C = Awaited<Promise<string> | Promise<number>>;
// Resultat : string | number

// Tres utile avec Promise.all
async function chargerTout() {
  const [utilisateurs, produits, commandes] = await Promise.all([
    fetch("/api/utilisateurs").then((r) => r.json() as Promise<Utilisateur[]>),
    fetch("/api/produits").then((r) => r.json() as Promise<Produit[]>),
    fetch("/api/commandes").then((r) => r.json() as Promise<Commande[]>),
  ]);

  return { utilisateurs, produits, commandes };
}

type ResultatChargement = Awaited<ReturnType<typeof chargerTout>>;
// { utilisateurs: Utilisateur[]; produits: Produit[]; commandes: Commande[] }
```

---

## NoInfer\<T\>

### Description

`NoInfer<T>` empeche TypeScript d'inferer un type à partir d'une position donnee. C'est un utility type ajoute dans TypeScript 5.4.

### Exemple concret

```typescript
// Sans NoInfer : TypeScript infere le type a partir de TOUS les usages
function creerSignal<T>(valeurInitiale: T, valeurParDefaut: T): T {
  return valeurInitiale ?? valeurParDefaut;
}

// TypeScript infere T = "rouge" | "bleu" a cause des deux arguments
const signal = creerSignal("rouge", "bleu");

// Avec NoInfer : on force l'inference uniquement depuis valeurInitiale
function creerSignalV2<T>(valeurInitiale: T, valeurParDefaut: NoInfer<T>): T {
  return valeurInitiale ?? valeurParDefaut;
}

// Maintenant T est infere uniquement depuis le premier argument
const couleurs = ["rouge", "vert", "bleu"] as const;
type Couleur = (typeof couleurs)[number];

function choisirCouleur(couleur: Couleur, defaut: NoInfer<Couleur>): Couleur {
  return couleur ?? defaut;
}

// L'inference de T ne prend pas en compte le deuxieme argument
// Cela empeche des erreurs subtiles d'elargissement de type
```

---

## Combinaisons puissantes

La vraie puissance des utility types se revele quand on les **combine**.

### Exemple 1 : Type pour des mises a jour partielles sans l'id

```typescript
interface Entite {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  dateCreation: Date;
}

// Mise a jour : tout sauf l'id, et tout est optionnel
type MiseAJourEntite = Partial<Omit<Entite, "id" | "dateCreation">>;

// Equivalent a :
// {
//   nom?: string;
//   description?: string;
//   actif?: boolean;
// }
```

### Exemple 2 : Proprietes en lecture seule sauf certaines

```typescript
// Rendre tout readonly sauf certains champs
type ReadonlySauf<T, K extends keyof T> = Readonly<Omit<T, K>> & Pick<T, K>;

interface Document {
  id: number;
  titre: string;
  contenu: string;
  version: number;
}

type DocumentEditable = ReadonlySauf<Document, "contenu" | "version">;
// id et titre sont readonly, contenu et version sont modifiables
```

### Exemple 3 : Rendre obligatoires uniquement certains champs

```typescript
type RequiredSeulement<T, K extends keyof T> = Omit<Partial<T>, K> &
  Required<Pick<T, K>>;

interface Formulaire {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
}

// Seuls nom et email sont obligatoires
type FormulaireMinimal = RequiredSeulement<Formulaire, "nom" | "email">;
```

### Exemple 4 : Extraire les clés par type de valeur

```typescript
type ClesDeType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

interface Modele {
  id: number;
  nom: string;
  email: string;
  age: number;
  actif: boolean;
}

type ClesNumeriques = ClesDeType<Modele, number>;
// Resultat : "id" | "age"

type ClesTextuelles = ClesDeType<Modele, string>;
// Resultat : "nom" | "email"

// Combiner pour creer un sous-type avec seulement les champs string
type ChampsTextuels = Pick<Modele, ClesDeType<Modele, string>>;
// Resultat : { nom: string; email: string }
```

---

## Pratique : Exercices

### Exercice 1 : Créer un type pour une réponse API

Creez un type générique `ReponseAPI<T>` qui a :

- `donnees` de type `T` (optionnel)
- `erreur` de type `string` (optionnel)
- `statut` de type `number` (obligatoire)
- `timestamp` de type `Date` (obligatoire, readonly)

Puis creez `ReponseReussie<T>` ou `donnees` est obligatoire et `erreur` est exclue.
Et `ReponseEchouee` ou `erreur` est obligatoire et `donnees` est exclue.

<details>
<summary>Solution</summary>

```typescript
interface ReponseAPI<T> {
  donnees?: T;
  erreur?: string;
  statut: number;
  readonly timestamp: Date;
}

// Reponse reussie : donnees obligatoire, pas d'erreur
type ReponseReussie<T> = Required<Pick<ReponseAPI<T>, "donnees">> &
  Omit<ReponseAPI<T>, "donnees" | "erreur">;

// Reponse echouee : erreur obligatoire, pas de donnees
type ReponseEchouee = Required<Pick<ReponseAPI<never>, "erreur">> &
  Omit<ReponseAPI<never>, "donnees" | "erreur">;

// Utilisation
const succes: ReponseReussie<{ nom: string }> = {
  donnees: { nom: "Alice" },
  statut: 200,
  timestamp: new Date(),
};

const echec: ReponseEchouee = {
  erreur: "Ressource introuvable",
  statut: 404,
  timestamp: new Date(),
};
```

</details>

### Exercice 2 : Reimplementer Readonly, Partial et Required

Reimplementez ces trois utility types **sans utiliser les versions natives**.

<details>
<summary>Solution</summary>

```typescript
// Reimplementation de Readonly
type MonReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Reimplementation de Partial
type MonPartial<T> = {
  [K in keyof T]?: T[K];
};

// Reimplementation de Required
// Le -? supprime le modificateur optionnel
type MonRequired<T> = {
  [K in keyof T]-?: T[K];
};

// Verification
interface Test {
  a: string;
  b?: number;
  c: boolean;
}

type TestReadonly = MonReadonly<Test>;
// { readonly a: string; readonly b?: number; readonly c: boolean }

type TestPartial = MonPartial<Test>;
// { a?: string; b?: number; c?: boolean }

type TestRequired = MonRequired<Test>;
// { a: string; b: number; c: boolean }
```

</details>

### Exercice 3 : Créer un type Mutable (inverse de Readonly)

Creez un type `Mutable<T>` qui supprime le modificateur `readonly` de toutes les propriétés.

<details>
<summary>Solution</summary>

```typescript
// Le -readonly supprime le modificateur readonly
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// Verification
interface ConfigGele {
  readonly nom: string;
  readonly version: number;
  readonly debug: boolean;
}

type ConfigModifiable = Mutable<ConfigGele>;
// { nom: string; version: number; debug: boolean }

const config: ConfigModifiable = {
  nom: "MonApp",
  version: 1,
  debug: true,
};

config.nom = "MonAppV2"; // OK, plus de readonly !
```

</details>

### Exercice 4 : DeepPartial et DeepReadonly

Creez des versions recursives de `Partial` et `Readonly` qui s'appliquent a tous les niveaux d'imbrication.

<details>
<summary>Solution</summary>

```typescript
// DeepPartial : rend tout optionnel en profondeur
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

// DeepReadonly : rend tout readonly en profondeur
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// Test
interface Configuration {
  serveur: {
    hote: string;
    port: number;
    ssl: {
      actif: boolean;
      certificat: string;
    };
  };
  base: {
    connexion: string;
    pool: {
      min: number;
      max: number;
    };
  };
}

type ConfigPartielle = DeepPartial<Configuration>;
// Toutes les proprietes a tous les niveaux sont optionnelles

const configPartielle: ConfigPartielle = {
  serveur: {
    port: 3000,
    // hote et ssl sont optionnels
  },
  // base est optionnel
};

type ConfigGelee = DeepReadonly<Configuration>;
// Toutes les proprietes a tous les niveaux sont readonly

const configGelee: ConfigGelee = {
  serveur: {
    hote: "localhost",
    port: 3000,
    ssl: { actif: true, certificat: "cert.pem" },
  },
  base: {
    connexion: "postgresql://...",
    pool: { min: 2, max: 10 },
  },
};

// configGelee.serveur.ssl.actif = false; // Erreur ! Readonly en profondeur
```

</details>

### Exercice 5 : Créer un type FonctionVersObjet

A partir d'un type fonction, creez un type objet avec les propriétés `parametres`, `retour` et `estAsync`.

<details>
<summary>Solution</summary>

```typescript
type FonctionVersObjet<T extends (...args: any) => any> = {
  parametres: Parameters<T>;
  retour: ReturnType<T>;
  estAsync: ReturnType<T> extends Promise<any> ? true : false;
};

// Test
function saluer(nom: string, formel: boolean): string {
  return formel ? `Bonjour ${nom}` : `Salut ${nom}`;
}

type InfoSaluer = FonctionVersObjet<typeof saluer>;
// {
//   parametres: [nom: string, formel: boolean];
//   retour: string;
//   estAsync: false;
// }

async function charger(url: string): Promise<{ data: any }> {
  const res = await fetch(url);
  return res.json();
}

type InfoCharger = FonctionVersObjet<typeof charger>;
// {
//   parametres: [url: string];
//   retour: Promise<{ data: any }>;
//   estAsync: true;
// }
```

</details>

---

## Résumé

| Utility Type            | Role                                            |
| ----------------------- | ----------------------------------------------- |
| `Partial<T>`            | Rend toutes les propriétés optionnelles         |
| `Required<T>`           | Rend toutes les propriétés obligatoires         |
| `Readonly<T>`           | Rend toutes les propriétés en lecture seule     |
| `Record<K, T>`          | Cree un objet avec clés K et valeurs T          |
| `Pick<T, K>`            | Selectionne certaines propriétés                |
| `Omit<T, K>`            | Exclut certaines propriétés                     |
| `Exclude<T, U>`         | Supprime des membres d'une union                |
| `Extract<T, U>`         | Garde certains membres d'une union              |
| `NonNullable<T>`        | Supprime null et undefined                      |
| `Parameters<T>`         | Extrait les types des paramètres d'une fonction |
| `ConstructorParameters` | Extrait les types des params d'un constructeur  |
| `ReturnType<T>`         | Extrait le type de retour d'une fonction        |
| `InstanceType<T>`       | Extrait le type d'instance d'une classe         |
| `ThisParameterType<T>`  | Extrait le type du paramètre this               |
| `OmitThisParameter<T>`  | Supprime le paramètre this                      |
| `Awaited<T>`            | Decompresse les Promises                        |
| `NoInfer<T>`            | Empeche l'inference depuis une position         |

### Points clés à retenir

1. **Les utility types evitent la duplication** : ne redefinissez jamais un sous-ensemble d'un type manuellement
2. **Combinez-les** pour des transformations complexes
3. **Comprenez leur implementation** pour créer vos propres utility types
4. **Pick vs Omit** : choisissez selon le nombre de champs a inclure/exclure
5. **Exclude/Extract** travaillent sur des unions, **Pick/Omit** sur des objets

---

## Pour aller plus loin

Dans le prochain module, **[11 — Conditional Types & infer](./11-conditional-types.md)**, nous plongerons dans le mécanisme qui rend la plupart de ces utility types possibles : les **conditional types**. Vous decouvrirez le mot-clé `infer` et apprendrez a créer des transformations de types encore plus puissantes.

---

<!-- parcours-recommande -->

::: tip Parcours recommandé

1. **Screencast** : [screencast 10 utility types](../screencasts/screencast-10-utility-types.md)
2. **Lab** : [lab-10-utility-types](../labs/lab-10-utility-types/README)
3. **Quiz** : [quiz 10 utility types](../quizzes/quiz-10-utility-types.html)
   :::
