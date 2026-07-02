# 06 — Generics — Fondamentaux & Contraintes

> **Duree estimee** : 4 heures
> **Difficulte** : 3/5
> **Prérequis** : Modules 01 a 05 (types de base, fonctions, interfaces, unions, classes)
> **Objectifs** :
>
> - Comprendre le concept de generics et leur utilite
> - Créer des fonctions, interfaces et classes génériques
> - Appliquer des contraintes sur les types génériques (`extends`)
> - Utiliser `keyof`, `typeof` et les acces indexes (`T[K]`)
> - Définir des paramètres de type par defaut
> - Maîtriser les patterns multi-paramètres et les factories génériques

---

## Introduction — Pourquoi les generics ?

### Le problème qu'on cherche à résoudre

Imaginons que tu veuilles écrire une fonction qui retourne le premier élément d'un tableau. Sans generics, tu as deux options, et **aucune n'est satisfaisante** :

```typescript
// ❌ Option 1 : on écrit une fonction par type → duplication de code
function premierNombre(tableau: number[]): number | undefined {
  return tableau[0];
}
function premierString(tableau: string[]): string | undefined {
  return tableau[0];
}
// Et si demain on a un tableau de booléens ? Encore une fonction...

// ❌ Option 2 : on utilise `any` → on perd le typage
function premierElement(tableau: any[]): any {
  return tableau[0];
}
const resultat = premierElement([1, 2, 3]);
// `resultat` est de type `any` → TypeScript ne peut plus t'aider
// Tu pourrais faire resultat.toUpperCase() sans erreur... alors que c'est un number !
```

### La solution : les generics

Les **generics** permettent de dire : _"Je ne connais pas encore le type, mais quand tu utiliseras cette fonction, TypeScript le déduira automatiquement."_

```typescript
// ✅ UNE SEULE fonction qui marche avec TOUS les types
function premier<T>(tableau: T[]): T | undefined {
  return tableau[0];
}

const a = premier([1, 2, 3]); // TypeScript sait que a est number | undefined
const b = premier(["hello", "world"]); // TypeScript sait que b est string | undefined
```

**Comment lire `<T>` ?** C'est un "paramètre de type". Comme une fonction prend des paramètres en entrée (des valeurs), un generic prend un **type** en paramètre. Le `T` est juste un nom — tu peux l'appeler comme tu veux : `<MonType>`, `<Element>`, `<Donnee>`, etc.

> 💡 **Astuce** : Par convention, on utilise souvent des lettres courtes (`T`, `U`, `V`), mais des noms explicites comme `<TypeElement>` ou `<TypeDonnee>` rendent le code plus lisible : c'est un choix à faire en équipe.

### Analogie : la boîte étiquetée

Imagine une **boîte** dans laquelle tu ranges un objet. Quand tu poses un livre dedans, une étiquette s'affiche automatiquement : "Cette boîte contient un **livre**". Quand tu poses un jouet, l'étiquette change : "Cette boîte contient un **jouet**".

C'est exactement ce que fait un generic : il **adapte le type** en fonction de ce qu'on lui donne.

```typescript
// La boîte sans étiquette (any) : dangereux
function mettreEnBoite(objet: any): { contenu: any } {
  return { contenu: objet };
}
const boite1 = mettreEnBoite("Bonjour");
// boite1.contenu est `any` → on ne sait plus que c'est un string

// La boîte avec étiquette (generic) : sûr
function mettreEnBoiteTypee<TypeObjet>(objet: TypeObjet): {
  contenu: TypeObjet;
} {
  return { contenu: objet };
}
const boite2 = mettreEnBoiteTypee("Bonjour");
// boite2.contenu est `string` → TypeScript le sait !
const boite3 = mettreEnBoiteTypee(42);
// boite3.contenu est `number`
```

> 🎯 **Ce qu'il faut retenir** : Un generic = un **type en paramètre**. Il est remplacé par le vrai type au moment de l'utilisation.

---

## Fonctions génériques

### Syntaxe de base

On place le paramètre de type entre chevrons `<T>` **juste avant les parenthèses** de la fonction :

```typescript
//                  ↓ le paramètre de type
function identite<T>(valeur: T): T {
  //                   ↑ l'argument est de type T
  //                              ↑ la valeur de retour aussi
  return valeur;
}
```

Quand on appelle la fonction, TypeScript **infère** (devine) le type automatiquement :

```typescript
const a = identite("hello"); // T est inféré comme string
const b = identite(42); // T est inféré comme number
const c = identite(true); // T est inféré comme boolean
```

On peut aussi **spécifier le type explicitement** (utile quand TypeScript ne peut pas le deviner) :

```typescript
const d = identite<string>("hello"); // On force T = string
const e = identite<number[]>([1, 2, 3]); // On force T = number[]
```

### Fonctions génériques avec tableaux

Les generics sont très naturels avec les tableaux, car le type de l'élément peut varier :

```typescript
// Retourne le premier élément d'un tableau
function premier<TypeElement>(tableau: TypeElement[]): TypeElement | undefined {
  return tableau[0];
}

premier([10, 20, 30]); // type retourné : number | undefined
premier(["a", "b", "c"]); // type retourné : string | undefined

// Retourne le dernier élément
function dernier<TypeElement>(tableau: TypeElement[]): TypeElement | undefined {
  return tableau.length > 0 ? tableau[tableau.length - 1] : undefined;
}

// Inverse un tableau (sans modifier l'original grâce au spread [...])
function inverser<TypeElement>(tableau: TypeElement[]): TypeElement[] {
  return [...tableau].reverse();
}

const inverse = inverser([1, 2, 3]); // résultat : [3, 2, 1], type : number[]
```

> 💡 Remarque : `TypeElement | undefined` signifie "soit un élément du bon type, soit rien" (le tableau pourrait être vide).

### Plusieurs paramètres de type

Parfois, on a besoin de **plusieurs types différents**. On les sépare par des virgules :

```typescript
// <TypeA, TypeB> : deux types indépendants
function paire<TypeA, TypeB>(premier: TypeA, second: TypeB): [TypeA, TypeB] {
  return [premier, second];
}

const p1 = paire("nom", 42); // type : [string, number]
const p2 = paire(true, [1, 2, 3]); // type : [boolean, number[]]
```

Un cas d'usage fréquent : une fonction de **transformation** qui prend une valeur d'un type et la transforme en un autre :

```typescript
function transformer<TypeEntree, TypeSortie>(
  valeur: TypeEntree,
  fn: (v: TypeEntree) => TypeSortie,
): TypeSortie {
  return fn(valeur);
}

// string → number (on mesure la longueur)
const longueur = transformer("Bonjour", (s) => s.length); // 7

// string → string (on met en majuscules)
const majuscule = transformer("hello", (s) => s.toUpperCase()); // "HELLO"

// number → number (on double)
const double = transformer(21, (n) => n * 2); // 42
```

> 🎯 **Ce qu'il faut retenir** : Chaque paramètre de type (`<A, B>`) est indépendant. TypeScript infère chacun séparément.

---

## Interfaces génériques

Les interfaces aussi peuvent être génériques. C'est le même principe : on ajoute un paramètre de type `<T>` après le nom.

### Un premier exemple concret

Imagine qu'on veut représenter le résultat d'une opération. Parfois c'est un succès (avec des données), parfois c'est un échec. Le **type des données peut varier** → c'est un bon candidat pour un generic :

```typescript
// L'interface est paramétrée par `TypeDonnee`
interface Resultat<TypeDonnee> {
  succes: boolean;
  donnees: TypeDonnee; // ← le type est "ouvert", on le précise à l'utilisation
  erreur?: string;
}

// Résultat contenant un utilisateur
const r1: Resultat<{ nom: string; email: string }> = {
  succes: true,
  donnees: { nom: "Alice", email: "alice@mail.com" },
};

// Résultat contenant un tableau de nombres
const r2: Resultat<number[]> = {
  succes: true,
  donnees: [1, 2, 3, 4, 5],
};

// Résultat d'erreur (pas de données → null)
const r3: Resultat<null> = {
  succes: false,
  donnees: null,
  erreur: "Ressource introuvable",
};
```

> 💡 **Pourquoi c'est utile ?** Sans generic, on aurait écrit `donnees: any` et perdu tout le typage. Ici, TypeScript sait exactement ce que contient chaque résultat.

### Cas d'usage courant : le Repository Pattern

Voici un pattern qu'on retrouve beaucoup en développement backend. L'idée : une interface générique qui décrit les opérations CRUD (Créer / Lire / Modifier / Supprimer) pour **n'importe quel type d'entité**.

Avant de lire le code, quelques mots sur les **utilitaires TypeScript** utilisés ici :

- **`Omit<T, "id">`** : prend le type `T` et **enlève** la propriété `"id"`. Utile pour la création (l'ID est généré côté serveur).
- **`Partial<T>`** : rend **tous** les champs de `T` optionnels. Utile pour une mise à jour (on ne modifie pas forcément tout).

```typescript
// On définit le "contrat" une seule fois, de façon générique
interface Depot<TypeEntite> {
  trouverTous(): Promise<TypeEntite[]>;
  trouverParId(id: string): Promise<TypeEntite | null>;
  creer(entite: Omit<TypeEntite, "id">): Promise<TypeEntite>;
  mettreAJour(id: string, entite: Partial<TypeEntite>): Promise<TypeEntite>;
  supprimer(id: string): Promise<boolean>;
}
```

On **utilise** cette interface en précisant le type de l'entité :

```typescript
interface Utilisateur {
  id: string;
  nom: string;
  email: string;
}

// Cette classe implémente Depot<Utilisateur>
// → TypeScript remplace TypeEntite par Utilisateur partout
class DepotUtilisateurs implements Depot<Utilisateur> {
  private utilisateurs: Utilisateur[] = [];

  async trouverTous(): Promise<Utilisateur[]> {
    return [...this.utilisateurs];
  }

  async trouverParId(id: string): Promise<Utilisateur | null> {
    return this.utilisateurs.find((u) => u.id === id) ?? null;
  }

  async creer(entite: Omit<Utilisateur, "id">): Promise<Utilisateur> {
    // Omit<Utilisateur, "id"> = { nom: string; email: string }
    // → on n'a pas besoin de fournir l'id, il est généré ici
    const nouvelUtilisateur: Utilisateur = {
      ...entite,
      id: crypto.randomUUID(),
    };
    this.utilisateurs.push(nouvelUtilisateur);
    return nouvelUtilisateur;
  }

  async mettreAJour(
    id: string,
    entite: Partial<Utilisateur>,
  ): Promise<Utilisateur> {
    // Partial<Utilisateur> = { id?: string; nom?: string; email?: string }
    // → tous les champs sont optionnels
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

> 🎯 **Ce qu'il faut retenir** : L'interface `Depot<T>` est écrite **une seule fois**, puis réutilisée pour `Depot<Utilisateur>`, `Depot<Produit>`, `Depot<Commande>`... C'est tout l'intérêt des generics !

---

## Classes génériques

Les classes génériques permettent de créer des **structures de données réutilisables** et type-safe. Le principe est le même que pour les fonctions : on ajoute `<T>` après le nom de la classe.

### Pile (Stack) générique

Une **pile**, c'est comme une pile d'assiettes : on empile par le dessus, on dépile par le dessus aussi (LIFO — Last In, First Out).

```typescript
class Pile<TypeElement> {
  // Le tableau interne stocke des éléments de type TypeElement
  private elements: TypeElement[] = [];

  // Ajouter un élément au sommet
  empiler(element: TypeElement): void {
    this.elements.push(element);
  }

  // Retirer et retourner l'élément du sommet
  depiler(): TypeElement | undefined {
    return this.elements.pop();
  }

  // Voir le sommet sans le retirer
  sommet(): TypeElement | undefined {
    return this.elements[this.elements.length - 1];
  }

  get taille(): number {
    return this.elements.length;
  }

  estVide(): boolean {
    return this.elements.length === 0;
  }
}

// Pile de nombres : TypeElement = number
const pileNombres = new Pile<number>();
pileNombres.empiler(10);
pileNombres.empiler(20);
pileNombres.empiler(30);
console.log(pileNombres.sommet()); // 30
console.log(pileNombres.depiler()); // 30 (retiré du sommet)
console.log(pileNombres.taille); // 2

// Pile de strings : TypeElement = string
const pileMots = new Pile<string>();
pileMots.empiler("Bonjour");
pileMots.empiler("le");
pileMots.empiler("monde");
// pileMots.empiler(42); // ❌ ERREUR : number n'est pas assignable à string
```

> 💡 On écrit la classe **une seule fois**, et elle fonctionne avec n'importe quel type. `Pile<number>`, `Pile<string>`, `Pile<Utilisateur>`...

### Classe générique avec plusieurs types

On peut avoir plusieurs paramètres de type, exactement comme pour les fonctions :

```typescript
// Un dictionnaire avec un type pour la clé et un type pour la valeur
class Dictionnaire<TypeCle extends string | number, TypeValeur> {
  private donnees = new Map<TypeCle, TypeValeur>();

  definir(cle: TypeCle, valeur: TypeValeur): void {
    this.donnees.set(cle, valeur);
  }

  obtenir(cle: TypeCle): TypeValeur | undefined {
    return this.donnees.get(cle);
  }

  get taille(): number {
    return this.donnees.size;
  }
}

// string → objet utilisateur
const utilisateurs = new Dictionnaire<string, { nom: string; age: number }>();
utilisateurs.definir("alice", { nom: "Alice", age: 30 });
console.log(utilisateurs.obtenir("alice")); // { nom: "Alice", age: 30 }

// number → string (codes HTTP)
const codes = new Dictionnaire<number, string>();
codes.definir(200, "OK");
codes.definir(404, "Not Found");
```

> 🎯 **Ce qu'il faut retenir** : Une classe générique est un **moule**. On choisit le type au moment où on fait `new MaClasse<MonType>()`.

---

## Contraintes génériques avec `extends`

Jusqu'ici, `<T>` accepte **n'importe quel type**. Mais parfois, on a besoin de **restreindre** les types possibles. Par exemple : "je veux un type qui a forcément une propriété `length`". C'est le rôle de `extends`.

### Contrainte simple : exiger une propriété

```typescript
// T doit avoir une propriété `length` de type number
// Autrement dit : seuls les types avec .length sont acceptés
function longueur<T extends { length: number }>(element: T): number {
  return element.length;
}

longueur("Bonjour"); // ✅ OK : string a `.length`
longueur([1, 2, 3]); // ✅ OK : number[] a `.length`
longueur({ length: 10 }); // ✅ OK : l'objet a `.length`

// longueur(42);    // ❌ ERREUR : number n'a pas `.length`
// longueur(true);  // ❌ ERREUR : boolean n'a pas `.length`
```

> 💡 **Comment lire `T extends { length: number }` ?** → "T est un type qui a **au minimum** une propriété `length` de type `number`". Il peut avoir d'autres propriétés, mais `length` est obligatoire.

### Contrainte avec une interface

```typescript
// On définit le contrat minimum : avoir un id
interface AvecId {
  id: string | number;
}

// T doit obligatoirement avoir un `id`
function trouverParId<T extends AvecId>(
  elements: T[],
  id: T["id"],
): T | undefined {
  return elements.find((e) => e.id === id);
}

const produits = [
  { id: 1, nom: "Clavier", prix: 49.99 },
  { id: 2, nom: "Souris", prix: 29.99 },
  { id: 3, nom: "Ecran", prix: 299.99 },
];

const produit = trouverParId(produits, 2);
// TypeScript sait que produit a un id, un nom et un prix
console.log(produit?.nom); // "Souris"
```

### Contrainte avec `extends object`

```typescript
// On n'accepte que des objets (pas des string, number, etc.)
function fusionner<T extends object, U extends object>(
  obj1: T,
  obj2: U,
): T & U {
  return { ...obj1, ...obj2 };
}

const resultat = fusionner({ nom: "Alice" }, { age: 30 });
// type: { nom: string } & { age: number }
console.log(resultat.nom); // "Alice"
console.log(resultat.age); // 30

// fusionner("hello", { a: 1 }); // ❌ ERREUR : string n'est pas un object
```

> 🎯 **Ce qu'il faut retenir** : `extends` dans un generic = "le type doit **au minimum** respecter ce contrat". C'est un filtre pour n'accepter que les types compatibles.

---

## `keyof` et accès indexés

Ces deux outils sont très utilisés avec les generics. Ils permettent de manipuler les **clés** et les **types des propriétés** d'un objet.

### `keyof` — obtenir les clés d'un type

`keyof` transforme un type objet en une **union de ses clés** (sous forme de strings).

```typescript
interface Voiture {
  marque: string;
  modele: string;
  annee: number;
  electrique: boolean;
}

// keyof Voiture = "marque" | "modele" | "annee" | "electrique"
type CleVoiture = keyof Voiture;

// Concrètement : CleVoiture n'accepte QUE ces 4 valeurs
let cle: CleVoiture;
cle = "marque"; // ✅
cle = "annee"; // ✅
// cle = "couleur"; // ❌ "couleur" n'est pas une clé de Voiture
```

### Le combo classique : `<T, K extends keyof T>`

C'est LE pattern le plus courant. Il permet de dire : "K est obligatoirement une **clé valide** de T".

```typescript
// "Donne-moi un objet et une de ses clés, je te retourne la valeur"
function obtenirPropriete<TypeObjet, TypeCle extends keyof TypeObjet>(
  objet: TypeObjet,
  cle: TypeCle,
): TypeObjet[TypeCle] {
  //  ↑ TypeObjet[TypeCle] = le TYPE de la propriété à cette clé
  return objet[cle];
}

const maVoiture: Voiture = {
  marque: "Tesla",
  modele: "Model 3",
  annee: 2023,
  electrique: true,
};

const marque = obtenirPropriete(maVoiture, "marque"); // type: string
const annee = obtenirPropriete(maVoiture, "annee"); // type: number
const estElec = obtenirPropriete(maVoiture, "electrique"); // type: boolean

// obtenirPropriete(maVoiture, "couleur");
// ❌ ERREUR : "couleur" n'existe pas dans Voiture
```

> 💡 **Pourquoi `TypeObjet[TypeCle]` comme type de retour ?** C'est l'**accès indexé** : ça signifie "le type de la propriété `TypeCle` dans `TypeObjet`". Si TypeCle = `"marque"`, alors TypeObjet[TypeCle] = `string`. Si TypeCle = `"annee"`, c'est `number`.

### Accès indexés — extraire le type d'une propriété

On peut utiliser les crochets `["..."]` directement sur un type pour en extraire le type d'une propriété :

```typescript
interface Formulaire {
  nom: string;
  age: number;
  hobbies: string[];
}

type TypeNom = Formulaire["nom"]; // string
type TypeAge = Formulaire["age"]; // number
type TypeHobbies = Formulaire["hobbies"]; // string[]

// Avec une union de clés :
type TypeNomOuAge = Formulaire["nom" | "age"]; // string | number
```

> 🎯 **Ce qu'il faut retenir** : `keyof` donne les clés, `T[K]` donne le type de la valeur à cette clé. Ensemble, ils permettent un accès 100% type-safe aux propriétés d'un objet.

---

## `typeof` dans les types

Attention : `typeof` a **deux sens** en TypeScript :

1. En JavaScript (au runtime) : `typeof "hello"` → `"string"` (une string)
2. En TypeScript (dans les types) : `typeof maVariable` → le **type TypeScript** de cette variable

C'est le 2ème sens qui nous intéresse ici :

```typescript
const configuration = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: false,
};

// typeof configuration extrait le type à partir de la VALEUR
type Configuration = typeof configuration;
// Équivalent à écrire manuellement :
// type Configuration = {
//   apiUrl: string;
//   timeout: number;
//   debug: boolean;
// }

// Combo utile : keyof typeof → les clés d'un objet concret
type CleConfig = keyof typeof configuration;
// = "apiUrl" | "timeout" | "debug"
```

> 💡 **Quand utiliser `typeof` ?** Quand tu as déjà un objet ou une constante et que tu veux en **déduire le type** au lieu de l'écrire à la main. Très pratique pour les configurations, les constantes, etc.

---

## Paramètres de type par défaut

Comme les paramètres de fonction peuvent avoir des valeurs par défaut (`function f(x = 10)`), les paramètres de type aussi :

```typescript
// Si on ne précise pas T, ce sera string par défaut
interface Conteneur<T = string> {
  valeur: T;
  horodatage: Date;
}

// Sans préciser T → c'est string
const c1: Conteneur = { valeur: "Bonjour", horodatage: new Date() };

// En précisant T → on choisit le type
const c2: Conteneur<number> = { valeur: 42, horodatage: new Date() };
const c3: Conteneur<boolean> = { valeur: true, horodatage: new Date() };
```

> 💡 C'est utile quand un type est utilisé dans la majorité des cas avec le même paramètre. Le défaut évite de le répéter partout.

### Combiner défaut et contrainte

On peut combiner `extends` (contrainte) et `= MonType` (défaut) :

```typescript
// T doit être un objet, et par défaut c'est Record<string, unknown>
interface Cache<T extends object = Record<string, unknown>> {
  donnees: Map<string, T>;
  dureeVie: number;
}

// Classe avec un type par défaut
class ListeTriee<T = number> {
  private elements: T[] = [];

  constructor(private comparateur: (a: T, b: T) => number) {}

  ajouter(element: T): void {
    this.elements.push(element);
    this.elements.sort(this.comparateur);
  }

  versTableau(): T[] {
    return [...this.elements];
  }
}

// Sans préciser T → c'est number par défaut
const nombres = new ListeTriee((a, b) => a - b);
nombres.ajouter(30);
nombres.ajouter(10);
console.log(nombres.versTableau()); // [10, 20, 30]

// Avec T = string
const mots = new ListeTriee<string>((a, b) => a.localeCompare(b));
mots.ajouter("cerise");
mots.ajouter("abricot");
mots.ajouter("banane");
console.log(mots.versTableau()); // ["abricot", "banane", "cerise"]
```

> 🎯 **Comment lire `<T extends object = Record<string, unknown>>` ?** → "T doit être un objet (contrainte), et si personne ne précise T, ce sera `Record<string, unknown>` (défaut)".

---

## Generics avec unions

Les generics fonctionnent naturellement avec les types union :

```typescript
// Un type "résultat asynchrone" — très courant dans les apps front-end
type ResultatAsync<TypeDonnee> =
  | { statut: "chargement" } // pas encore de données
  | { statut: "succes"; donnees: TypeDonnee } // données reçues
  | { statut: "erreur"; erreur: string }; // une erreur

// La fonction traite les 3 cas
function traiterResultat<T>(resultat: ResultatAsync<T>): string {
  switch (resultat.statut) {
    case "chargement":
      return "Chargement en cours...";
    case "succes":
      return `Succès : ${JSON.stringify(resultat.donnees)}`;
    case "erreur":
      return `Erreur : ${resultat.erreur}`;
  }
}

// ResultatAsync<string[]> → les données sont un tableau de strings
const r1: ResultatAsync<string[]> = { statut: "succes", donnees: ["a", "b"] };
console.log(traiterResultat(r1)); // "Succès : ["a","b"]"

// ResultatAsync<number> → les données sont un number
const r2: ResultatAsync<number> = { statut: "erreur", erreur: "Timeout" };
console.log(traiterResultat(r2)); // "Erreur : Timeout"
```

> 🎯 **Ce qu'il faut retenir** : Le generic `<TypeDonnee>` ne s'applique qu'au cas `"succes"`. Les autres variantes de l'union (`"chargement"`, `"erreur"`) restent identiques quel que soit le type.

---

## Factories génériques

Une factory générique permet de **créer des instances** de manière dynamique tout en conservant le typage.

```typescript
// `new () => T` signifie "une classe (constructeur) qui produit une instance de type T"
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
console.log(chien.aboyer()); // "Wouf !"

const chat = creerInstance(Chat); // type: Chat
console.log(chat.miauler()); // "Miaou !"
```

> 💡 **Comment lire `new () => T` ?** C'est le type d'un **constructeur**. Ça signifie : "quelque chose qu'on peut appeler avec `new` et qui retourne un `T`".

### Factory avec paramètres du constructeur

Si le constructeur a des paramètres, on adapte le type :

```typescript
// `new (...args: any[])` → un constructeur qui accepte n'importe quels arguments
function creerAvecParams<T>(
  Classe: new (...args: any[]) => T,
  ...args: any[]
): T {
  return new Classe(...args);
}

class Utilisateur {
  constructor(
    public nom: string,
    public age: number,
  ) {}
  saluer(): string {
    return `Bonjour, je suis ${this.nom} (${this.age} ans)`;
  }
}

const user = creerAvecParams(Utilisateur, "Alice", 30);
console.log(user.saluer()); // "Bonjour, je suis Alice (30 ans)"
```

### Factory avec registre

Un pattern plus avancé : un **registre** qui associe des noms à des classes, pour créer des instances dynamiquement.

```typescript
class FabriqueRegistre {
  private static fabriques = new Map<string, new (...args: any[]) => any>();

  // Enregistrer une classe
  static enregistrer<T>(nom: string, Classe: new (...args: any[]) => T): void {
    this.fabriques.set(nom, Classe);
  }

  // Créer une instance à partir du nom
  static creer<T>(nom: string, ...args: any[]): T {
    const Classe = this.fabriques.get(nom);
    if (!Classe) {
      throw new Error(`Classe "${nom}" non enregistrée.`);
    }
    return new Classe(...args) as T;
  }
}

// On enregistre des classes
class NotificationEmail {
  constructor(
    public destinataire: string,
    public sujet: string,
  ) {}
  envoyer(): void {
    console.log(`Email à ${this.destinataire} : ${this.sujet}`);
  }
}

class NotificationSMS {
  constructor(
    public numero: string,
    public message: string,
  ) {}
  envoyer(): void {
    console.log(`SMS à ${this.numero} : ${this.message}`);
  }
}

FabriqueRegistre.enregistrer("email", NotificationEmail);
FabriqueRegistre.enregistrer("sms", NotificationSMS);

// On crée des instances par leur nom
const email = FabriqueRegistre.creer<NotificationEmail>(
  "email",
  "alice@mail.com",
  "Bonjour",
);
email.envoyer(); // "Email à alice@mail.com : Bonjour"

const sms = FabriqueRegistre.creer<NotificationSMS>(
  "sms",
  "0612345678",
  "Salut !",
);
sms.envoyer(); // "SMS à 0612345678 : Salut !"
```

> 🎯 **Quand utiliser un registre ?** Quand tu veux découpler la création d'objets de leur utilisation (plugins, notifications, stratégies…). Le code qui crée ne connaît pas à l'avance toutes les classes possibles.

---

## Pratique

### Exercice 1 : Fonction générique `grouper`

Écrivez une fonction générique `grouper` qui prend un tableau d'objets et le nom d'une propriété, puis regroupe les éléments par la valeur de cette propriété.

```typescript
// Signature attendue :
// function grouper<T, K extends keyof T>(tableau: T[], cle: K): Map<T[K], T[]>

// Exemple d'utilisation :
const personnes = [
  { nom: "Alice", ville: "Paris", age: 30 },
  { nom: "Bob", ville: "Lyon", age: 25 },
  { nom: "Charlie", ville: "Paris", age: 35 },
];

const parVille = grouper(personnes, "ville");
// Map { "Paris" => [Alice, Charlie], "Lyon" => [Bob] }
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
```

</details>

### Exercice 2 : Classe générique `Cache<T>`

Créez une classe générique `Cache<T>` avec une durée de vie (TTL) pour les entrées.

- `definir(cle: string, valeur: T): void` — stocke une valeur avec un horodatage
- `obtenir(cle: string): T | undefined` — retourne la valeur si elle n'a pas expiré
- `supprimer(cle: string): boolean` — supprime une entrée
- `nettoyer(): number` — supprime les entrées expirées et retourne le nombre supprimé

<details>
<summary>Solution</summary>

```typescript
interface EntreeCache<T> {
  valeur: T;
  expiration: number; // timestamp en ms
}

class Cache<T> {
  private stockage = new Map<string, EntreeCache<T>>();

  constructor(private dureeVie: number = 60_000) {} // durée de vie en ms

  definir(cle: string, valeur: T): void {
    this.stockage.set(cle, {
      valeur,
      expiration: Date.now() + this.dureeVie,
    });
  }

  obtenir(cle: string): T | undefined {
    const entree = this.stockage.get(cle);
    if (!entree) return undefined;

    if (Date.now() > entree.expiration) {
      this.stockage.delete(cle); // expiré → on le supprime
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
}
```

</details>

### Exercice 3 : Fonction générique `pluck`

Écrivez une fonction `pluck` qui extrait les valeurs d'une propriété spécifique d'un tableau d'objets.

```typescript
// Signature attendue :
// function pluck<T, K extends keyof T>(tableau: T[], cle: K): T[K][]

// Exemple :
// pluck([{ nom: "Alice", age: 30 }, { nom: "Bob", age: 25 }], "nom")
// → ["Alice", "Bob"]
```

<details>
<summary>Solution</summary>

```typescript
function pluck<T, K extends keyof T>(tableau: T[], cle: K): T[K][] {
  return tableau.map((element) => element[cle]);
}
```

</details>

### Exercice 4 : Dépôt générique en mémoire

Implémentez un `DepotEnMemoire<T>` qui stocke des entités avec un `id`, et expose : `trouverTous()`, `trouverParId()`, `creer()`, `mettreAJour()`, `supprimer()`, `filtrer()`.

```typescript
// Contrainte : T doit avoir un id
interface Identifiable {
  id: string;
}

// Signature attendue :
// class DepotEnMemoire<T extends Identifiable> { ... }
```

<details>
<summary>Solution</summary>

```typescript
interface Identifiable {
  id: string;
}

class DepotEnMemoire<T extends Identifiable> {
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

  mettreAJour(
    id: string,
    modifications: Partial<Omit<T, "id">>,
  ): T | undefined {
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
}

const depot = new DepotEnMemoire<Article>();
const a1 = depot.creer({ titre: "Intro TS", contenu: "...", publie: true });
const a2 = depot.creer({ titre: "Generics", contenu: "...", publie: false });

console.log(depot.compter()); // 2
console.log(depot.filtrer((a) => a.publie).length); // 1

depot.mettreAJour(a2.id, { publie: true });
console.log(depot.filtrer((a) => a.publie).length); // 2
```

</details>

---

## Récapitulatif

| Concept             | Syntaxe                        | Ce que ça fait                                  |
| ------------------- | ------------------------------ | ----------------------------------------------- |
| Fonction générique  | `function f<T>(arg: T): T`     | Le type est un paramètre, inféré à l'appel      |
| Interface générique | `interface I<T> { valeur: T }` | Interface réutilisable avec n'importe quel type |
| Classe générique    | `class C<T> { ... }`           | Classe réutilisable (Pile, Cache, etc.)         |
| Contrainte          | `<T extends MonType>`          | Restreint les types acceptés                    |
| `keyof`             | `keyof T`                      | Union de toutes les clés d'un type              |
| Accès indexé        | `T[K]`                         | Type de la propriété K dans T                   |
| `typeof`            | `typeof maVariable`            | Déduit le type à partir d'une valeur            |
| Par défaut          | `<T = string>`                 | Type par défaut si non précisé                  |
| Multi-paramètres    | `<T, U, V>`                    | Plusieurs types indépendants                    |
| Factory             | `new () => T`                  | Créer des instances dynamiquement               |

---

## Pour aller plus loin

Dans le **Module 07**, nous approfondirons les generics avec des **patterns avancés** : types conditionnels, types variadiques, inférence avancée avec `infer`, builder pattern type-safe, branded types et bien plus.

[Continuer vers le Module 07 : Generics — Patterns avancés & Variadics →](./07-generics-avances.md)

---

<!-- parcours-recommande -->

::: tip Parcours recommandé

1. **Screencast** : [screencast 06 generics base](../screencasts/screencast-06-generics-base.md)
2. **Lab** : [lab-06-generics-base](../labs/lab-06-generics-base/README)
3. **Visualisation** : [Generics Flow](../visualizations/generics-flow.html)
4. **Quiz** : [quiz 06 generics base](../quizzes/quiz-06-generics-base.html)
   :::
