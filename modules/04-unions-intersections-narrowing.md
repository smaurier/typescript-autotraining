# 04 — Union, Intersection & Narrowing

> **Duree estimee** : 4h30
> **Difficulte** : 2/5
> **Prerequis** : Module 03 (interfaces, type aliases, structural typing)
> **Objectifs** :
> - Maitriser les **union types** (`|`) et les **discriminated unions**
> - Comprendre et appliquer le **type narrowing** avec toutes les techniques
> - Creer des **type guards custom** avec les predicates `is`
> - Utiliser les **assertion functions** (`asserts`) pour le narrowing
> - Implementer la verification **exhaustive** avec `never`
> - Comprendre l'analyse du **control flow** par TypeScript

---

## Union Types (|)

### Concept

Un **union type** represente une valeur qui peut etre de **plusieurs types differents** :

```typescript
// Une variable qui peut etre string OU number
let identifiant: string | number;

identifiant = "abc-123";  // OK — c'est un string
identifiant = 42;          // OK — c'est un number
// identifiant = true;     // Erreur — boolean n'est pas dans l'union

// Un parametre de fonction qui accepte plusieurs types
function afficherId(id: string | number): void {
  console.log(`ID : ${id}`);
}

afficherId("abc-123"); // OK
afficherId(42);         // OK
// afficherId(true);    // Erreur
```

### Le piege : que peut-on faire avec une union ?

```typescript
// Avec une union, on ne peut utiliser que les PROPRIETES COMMUNES aux deux types

function traiter(valeur: string | number): void {
  // Proprietes communes a string ET number :
  console.log(valeur.toString());  // OK — toString() existe sur les deux
  console.log(valeur.valueOf());   // OK — valueOf() existe sur les deux

  // Proprietes specifiques a string :
  // valeur.toUpperCase(); // Erreur ! toUpperCase n'existe pas sur number

  // Proprietes specifiques a number :
  // valeur.toFixed(2);    // Erreur ! toFixed n'existe pas sur string

  // Pour acceder aux proprietes specifiques, il faut NARROWER le type
}
```

### Analogie — La boite mystere

Une union type, c'est comme une **boite mystere** dans un jeu televise :

- Tu sais que la boite contient **soit** un livre, **soit** un DVD, **soit** un CD
- Tant que tu n'as pas ouvert la boite (narrowing), tu ne peux faire que des choses communes a ces trois objets (les regarder, les peser)
- Une fois que tu ouvres la boite et que tu vois que c'est un livre, tu peux le **lire** (propriete specifique au livre)

```typescript
type Contenu = Livre | DVD | CD;

interface Livre {
  type: "livre";
  titre: string;
  pages: number;
  lire(): void;
}

interface DVD {
  type: "dvd";
  titre: string;
  dureeMinutes: number;
  regarder(): void;
}

interface CD {
  type: "cd";
  titre: string;
  pistes: number;
  ecouter(): void;
}

function utiliser(contenu: Contenu): void {
  // Propriete commune : titre
  console.log(`Titre : ${contenu.titre}`); // OK

  // On ne peut pas appeler lire(), regarder() ou ecouter() ici
  // Il faut d'abord DETERMINER quel type c'est (narrowing)
}
```

### Unions avec des types complexes

```typescript
// Union de types d'objets
type ReponseAPI =
  | { status: "success"; data: unknown; code: 200 }
  | { status: "error"; message: string; code: 400 | 404 | 500 }
  | { status: "loading" };

// Union de fonctions
type Handler = ((event: MouseEvent) => void) | ((event: KeyboardEvent) => void);

// Union avec null (nullable)
type MaybeString = string | null;
type MaybeNumber = number | undefined;
type Maybe<T> = T | null | undefined;

// Utilisation courante
function trouverUtilisateur(id: number): Utilisateur | null {
  // Retourne l'utilisateur ou null s'il n'existe pas
  const users = [{ id: 1, nom: "Alice" }];
  return users.find((u) => u.id === id) ?? null;
}

interface Utilisateur {
  id: number;
  nom: string;
}
```

---

## Discriminated Unions (unions discriminees)

### Concept

Une **discriminated union** (ou union discriminee, ou tagged union) est une union ou chaque membre possede un **champ commun** qui permet de les distinguer :

```typescript
// Le champ 'type' sert de DISCRIMINANT (ou "tag")
interface Cercle {
  type: "cercle";       // Discriminant — valeur litterale
  rayon: number;
}

interface Rectangle {
  type: "rectangle";    // Discriminant — valeur litterale
  largeur: number;
  hauteur: number;
}

interface Triangle {
  type: "triangle";     // Discriminant — valeur litterale
  base: number;
  hauteur: number;
}

// Union discriminee
type Forme = Cercle | Rectangle | Triangle;

// Grace au discriminant, TypeScript peut NARROW automatiquement
function calculerAire(forme: Forme): number {
  switch (forme.type) {
    case "cercle":
      // TypeScript sait que forme est Cercle ici
      return Math.PI * forme.rayon ** 2;

    case "rectangle":
      // TypeScript sait que forme est Rectangle ici
      return forme.largeur * forme.hauteur;

    case "triangle":
      // TypeScript sait que forme est Triangle ici
      return (forme.base * forme.hauteur) / 2;
  }
}

// Utilisation
const c: Cercle = { type: "cercle", rayon: 5 };
const r: Rectangle = { type: "rectangle", largeur: 10, hauteur: 3 };
const t: Triangle = { type: "triangle", base: 6, hauteur: 4 };

console.log(calculerAire(c)); // 78.54...
console.log(calculerAire(r)); // 30
console.log(calculerAire(t)); // 12
```

### Pourquoi les discriminated unions sont puissantes

```
┌──────────────────────────────────────────────────────────────┐
│  AVANTAGES DES DISCRIMINATED UNIONS                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NARROWING AUTOMATIQUE — TypeScript comprend le switch    │
│                                                              │
│  2. EXHAUSTIVITE — On peut verifier qu'on gere tous les cas  │
│                                                              │
│  3. DOCUMENTATION — Le discriminant rend le code lisible     │
│                                                              │
│  4. EXTENSIBLE — Ajouter un nouveau membre = ajouter un     │
│     type et gerer le nouveau cas dans les switch             │
│                                                              │
│  5. PAS DE CAST — Pas besoin de 'as' ou de verifications    │
│     manuelles                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Exemple reel : gestion d'actions (pattern Redux)

```typescript
// Actions d'un panier e-commerce
type ActionPanier =
  | { type: "AJOUTER_PRODUIT"; produit: Produit; quantite: number }
  | { type: "RETIRER_PRODUIT"; produitId: string }
  | { type: "MODIFIER_QUANTITE"; produitId: string; nouvelleQuantite: number }
  | { type: "VIDER_PANIER" }
  | { type: "APPLIQUER_CODE_PROMO"; code: string };

interface Produit {
  id: string;
  nom: string;
  prix: number;
}

interface EtatPanier {
  produits: Map<string, { produit: Produit; quantite: number }>;
  codePromo?: string;
}

function reducerPanier(etat: EtatPanier, action: ActionPanier): EtatPanier {
  switch (action.type) {
    case "AJOUTER_PRODUIT":
      // action est { type: "AJOUTER_PRODUIT"; produit: Produit; quantite: number }
      const nouveauxProduits = new Map(etat.produits);
      nouveauxProduits.set(action.produit.id, {
        produit: action.produit,
        quantite: action.quantite,
      });
      return { ...etat, produits: nouveauxProduits };

    case "RETIRER_PRODUIT":
      // action est { type: "RETIRER_PRODUIT"; produitId: string }
      const sansProduit = new Map(etat.produits);
      sansProduit.delete(action.produitId);
      return { ...etat, produits: sansProduit };

    case "MODIFIER_QUANTITE":
      // action est { type: "MODIFIER_QUANTITE"; produitId: string; nouvelleQuantite: number }
      const modifie = new Map(etat.produits);
      const item = modifie.get(action.produitId);
      if (item) {
        modifie.set(action.produitId, { ...item, quantite: action.nouvelleQuantite });
      }
      return { ...etat, produits: modifie };

    case "VIDER_PANIER":
      return { ...etat, produits: new Map(), codePromo: undefined };

    case "APPLIQUER_CODE_PROMO":
      return { ...etat, codePromo: action.code };
  }
}
```

### Exemple reel : Resultats d'operations

```typescript
// Pattern Result — tres courant en TypeScript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Fonction qui retourne un Result
function diviser(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: "Division par zero" };
  }
  return { ok: true, value: a / b };
}

// Utilisation avec narrowing automatique
const resultat = diviser(10, 3);

if (resultat.ok) {
  // resultat est { ok: true; value: number }
  console.log(`Resultat : ${resultat.value.toFixed(2)}`);
} else {
  // resultat est { ok: false; error: string }
  console.error(`Erreur : ${resultat.error}`);
}
```

---

## Type Narrowing

### Qu'est-ce que le narrowing ?

Le **narrowing** (ou "retrecissement de type") est le processus par lequel TypeScript **reduit** un type large a un type plus precis grace a des verifications :

```typescript
// Type large : string | number
function traiter(valeur: string | number): string {
  // Ici, valeur est string | number (large)

  if (typeof valeur === "string") {
    // Ici, valeur est string (narrow)
    return valeur.toUpperCase();
  }

  // Ici, valeur est number (par elimination)
  return valeur.toFixed(2);
}
```

### Les differentes techniques de narrowing

TypeScript reconnait plusieurs patterns pour narrower les types.

---

### Narrowing avec typeof

L'operateur `typeof` permet de verifier les types primitifs :

```typescript
function formater(valeur: string | number | boolean | undefined): string {
  if (typeof valeur === "string") {
    // valeur est string
    return `"${valeur}"`;
  }

  if (typeof valeur === "number") {
    // valeur est number
    return valeur.toFixed(2);
  }

  if (typeof valeur === "boolean") {
    // valeur est boolean
    return valeur ? "vrai" : "faux";
  }

  // valeur est undefined (par elimination)
  return "indefini";
}

// typeof retourne : "string", "number", "boolean", "undefined",
// "object", "function", "symbol", "bigint"
// Attention : typeof null === "object" (bug historique de JavaScript !)
```

### Narrowing avec instanceof

`instanceof` verifie si un objet est une instance d'une classe :

```typescript
class Chien {
  nom: string;
  constructor(nom: string) {
    this.nom = nom;
  }
  aboyer(): string {
    return `${this.nom} : Ouaf !`;
  }
}

class Chat {
  nom: string;
  constructor(nom: string) {
    this.nom = nom;
  }
  miauler(): string {
    return `${this.nom} : Miaou !`;
  }
}

function faireDuBruit(animal: Chien | Chat): string {
  if (animal instanceof Chien) {
    // animal est Chien
    return animal.aboyer();
  }

  // animal est Chat (par elimination)
  return animal.miauler();
}

const rex = new Chien("Rex");
const felix = new Chat("Felix");

console.log(faireDuBruit(rex));   // "Rex : Ouaf !"
console.log(faireDuBruit(felix)); // "Felix : Miaou !"

// instanceof fonctionne aussi avec les classes natives
function traiterErreur(erreur: Error | string): string {
  if (erreur instanceof TypeError) {
    return `Erreur de type : ${erreur.message}`;
  }
  if (erreur instanceof RangeError) {
    return `Erreur de range : ${erreur.message}`;
  }
  if (erreur instanceof Error) {
    return `Erreur generique : ${erreur.message}`;
  }
  // erreur est string
  return `Message : ${erreur}`;
}
```

### Narrowing avec in

L'operateur `in` verifie si une propriete **existe** dans un objet :

```typescript
interface Voiture {
  marque: string;
  nombrePortes: number;
}

interface Moto {
  marque: string;
  cylindree: number;
}

function decrireVehicule(vehicule: Voiture | Moto): string {
  // 'nombrePortes' n'existe que dans Voiture
  if ("nombrePortes" in vehicule) {
    // vehicule est Voiture
    return `${vehicule.marque} — ${vehicule.nombrePortes} portes`;
  }

  // vehicule est Moto (par elimination)
  return `${vehicule.marque} — ${vehicule.cylindree}cc`;
}

console.log(decrireVehicule({ marque: "Renault", nombrePortes: 5 }));
// "Renault — 5 portes"

console.log(decrireVehicule({ marque: "Yamaha", cylindree: 600 }));
// "Yamaha — 600cc"
```

### Narrowing par truthiness (verite/faussete)

```typescript
// Les valeurs "falsy" en JavaScript :
// false, 0, -0, 0n, "", null, undefined, NaN

function afficher(valeur: string | null | undefined): void {
  if (valeur) {
    // valeur est string (non vide, non null, non undefined)
    console.log(valeur.toUpperCase());
  } else {
    // valeur est string | null | undefined
    // (pourrait etre "" — chaine vide est falsy !)
    console.log("Pas de valeur");
  }
}

// Attention avec les nombres !
function traiterNombre(n: number | null): void {
  if (n) {
    // n est number — MAIS 0 est falsy !
    console.log(n * 2);
  }
  // Si n === 0, on entre dans le else, ce qui est probablement un bug

  // Mieux : comparer explicitement avec null
  if (n !== null) {
    console.log(n * 2); // Fonctionne correctement meme avec 0
  }
}
```

### Narrowing par egalite

```typescript
// Comparaison stricte (===)
function traiter(a: string | number, b: string | boolean): void {
  if (a === b) {
    // Les deux sont forcement string (seul type commun)
    // a est string, b est string
    console.log(a.toUpperCase()); // OK
    console.log(b.toUpperCase()); // OK
  }
}

// Comparaison avec null/undefined
function exempleNull(valeur: string | null | undefined): void {
  // == null capture a la fois null et undefined
  if (valeur == null) {
    // valeur est null | undefined
    return;
  }
  // valeur est string
  console.log(valeur.length);
}

// Comparaison avec une valeur specifique
type Direction = "nord" | "sud" | "est" | "ouest";

function deplacer(direction: Direction): void {
  if (direction === "nord") {
    // direction est "nord"
    console.log("On monte !");
  } else if (direction === "sud") {
    // direction est "sud"
    console.log("On descend !");
  }
  // direction est "est" | "ouest"
}
```

---

## Narrowing dans switch

### Pattern courant avec discriminated unions

Le `switch` est la maniere la plus lisible de narrower des discriminated unions :

```typescript
type Notification =
  | { type: "email"; destinataire: string; sujet: string; corps: string }
  | { type: "sms"; numero: string; message: string }
  | { type: "push"; deviceId: string; titre: string; corps: string }
  | { type: "webhook"; url: string; payload: object };

function envoyerNotification(notif: Notification): void {
  switch (notif.type) {
    case "email":
      // notif est { type: "email"; destinataire: string; sujet: string; corps: string }
      console.log(`Email a ${notif.destinataire}`);
      console.log(`Sujet : ${notif.sujet}`);
      console.log(`Corps : ${notif.corps}`);
      break;

    case "sms":
      // notif est { type: "sms"; numero: string; message: string }
      console.log(`SMS au ${notif.numero}`);
      console.log(`Message : ${notif.message}`);
      break;

    case "push":
      // notif est { type: "push"; deviceId: string; titre: string; corps: string }
      console.log(`Push vers ${notif.deviceId}`);
      console.log(`${notif.titre} : ${notif.corps}`);
      break;

    case "webhook":
      // notif est { type: "webhook"; url: string; payload: object }
      console.log(`Webhook vers ${notif.url}`);
      break;
  }
}
```

---

## Type Guards custom (is)

### Rappel et approfondissement

Un **type guard** est une fonction qui retourne `boolean` et qui informe TypeScript du type d'une valeur :

```typescript
// Type guard basique
function estString(valeur: unknown): valeur is string {
  return typeof valeur === "string";
}

// Type guard pour une interface
interface Utilisateur {
  id: number;
  nom: string;
  email: string;
}

function estUtilisateur(valeur: unknown): valeur is Utilisateur {
  return (
    typeof valeur === "object" &&
    valeur !== null &&
    "id" in valeur &&
    "nom" in valeur &&
    "email" in valeur &&
    typeof (valeur as Utilisateur).id === "number" &&
    typeof (valeur as Utilisateur).nom === "string" &&
    typeof (valeur as Utilisateur).email === "string"
  );
}

// Utilisation
function traiterDonnee(donnee: unknown): void {
  if (estUtilisateur(donnee)) {
    // donnee est Utilisateur
    console.log(`Utilisateur : ${donnee.nom} (${donnee.email})`);
  } else {
    console.log("Donnee inconnue");
  }
}

// Test
traiterDonnee({ id: 1, nom: "Alice", email: "alice@example.com" });
// "Utilisateur : Alice (alice@example.com)"

traiterDonnee({ name: "Bob" });
// "Donnee inconnue"
```

### Type guards pour les tableaux

```typescript
// Verifier qu'un tableau ne contient que des nombres
function estTableauDeNombres(valeur: unknown): valeur is number[] {
  return (
    Array.isArray(valeur) &&
    valeur.every((element) => typeof element === "number")
  );
}

// Verifier qu'un tableau ne contient pas de null/undefined
function estTableauNonNul<T>(
  valeur: (T | null | undefined)[]
): valeur is T[] {
  return valeur.every((element) => element != null);
}

// Utilisation avec .filter()
const mixte: (string | null)[] = ["Alice", null, "Bob", null, "Charlie"];

// Sans type guard — le type reste (string | null)[]
const nonNuls = mixte.filter((v) => v !== null);
// Type: (string | null)[] — TypeScript ne narrow pas avec .filter() seul

// Avec type guard — le type est correctement narrow
function nonNull<T>(valeur: T | null | undefined): valeur is T {
  return valeur != null;
}

const noms = mixte.filter(nonNull);
// Type: string[] — Exactement ce qu'on veut !
```

### Type guard avec discriminated union

```typescript
// Type guards specifiques pour chaque membre de l'union
type Evenement =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; touche: string; code: number }
  | { type: "scroll"; deltaX: number; deltaY: number };

function estClick(evt: Evenement): evt is Extract<Evenement, { type: "click" }> {
  return evt.type === "click";
}

function estKeypress(evt: Evenement): evt is Extract<Evenement, { type: "keypress" }> {
  return evt.type === "keypress";
}

// Utilisation
function gererEvenement(evt: Evenement): void {
  if (estClick(evt)) {
    console.log(`Click a (${evt.x}, ${evt.y})`);
  } else if (estKeypress(evt)) {
    console.log(`Touche : ${evt.touche} (code: ${evt.code})`);
  }
}
```

---

## Assertion functions (asserts)

### Rappel et cas avances

Les assertion functions **lancent une erreur** si la condition est fausse, et **narrow le type** pour le reste du code :

```typescript
// Assertion generique
function assertEstNonNul<T>(
  valeur: T | null | undefined,
  message?: string
): asserts valeur is T {
  if (valeur === null || valeur === undefined) {
    throw new Error(message ?? "La valeur ne doit pas etre null ou undefined");
  }
}

// Utilisation
function traiterCommande(commandeId: string | null): void {
  assertEstNonNul(commandeId, "L'ID de commande est requis");
  // Apres l'assertion, commandeId est string (pas string | null)

  console.log(`Traitement de la commande : ${commandeId.toUpperCase()}`);
}
```

### Assertion avec condition

```typescript
// assert simple avec condition booleenne
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion echouee : ${message}`);
  }
}

// Utilisation dans du code metier
interface Commande {
  id: string;
  montant: number;
  status: "brouillon" | "validee" | "payee" | "expediee";
}

function expédier(commande: Commande): void {
  assert(commande.status === "payee", "La commande doit etre payee avant expedition");
  // Apres l'assertion, TypeScript narrowe le status ? Non, pas avec assert(condition)
  // Pour narrower le type, il faut utiliser asserts ... is ...

  console.log(`Expedition de la commande ${commande.id}`);
}
```

### Comparaison assert vs if/throw

```typescript
// Methode 1 : if + throw (verbose mais clair)
function traiter1(valeur: string | null): void {
  if (valeur === null) {
    throw new Error("Valeur ne peut pas etre null");
  }
  // TypeScript narrow automatiquement — valeur est string
  console.log(valeur.toUpperCase());
}

// Methode 2 : assertion function (reutilisable)
function assertNonNull<T>(v: T | null): asserts v is T {
  if (v === null) throw new Error("Null non autorise");
}

function traiter2(valeur: string | null): void {
  assertNonNull(valeur);
  // Meme narrowing, mais la logique est externalisee
  console.log(valeur.toUpperCase());
}

// Les deux methodes donnent le meme resultat
// assert est mieux quand tu veux reutiliser la verification
```

---

## Exhaustive Checking avec never

### Le concept

La verification exhaustive (exhaustive checking) s'assure que **tous les cas** d'une union sont geres. Si un cas est oublie, TypeScript genere une erreur :

```typescript
type CouleurFeu = "rouge" | "orange" | "vert";

function actionFeu(couleur: CouleurFeu): string {
  switch (couleur) {
    case "rouge":
      return "Arretez-vous";
    case "orange":
      return "Ralentissez";
    case "vert":
      return "Passez";
    default:
      // Si tous les cas sont geres, couleur est de type 'never'
      const _exhaustif: never = couleur;
      return _exhaustif;
  }
}

// Maintenant, si on ajoute un nouveau cas a CouleurFeu :
// type CouleurFeu = "rouge" | "orange" | "vert" | "clignotant";
// L'assignation a 'never' dans le default echoue :
// Type '"clignotant"' is not assignable to type 'never'
// → On est FORCE de gerer le nouveau cas !
```

### Pourquoi c'est important

```
┌──────────────────────────────────────────────────────────────┐
│  VERIFICATION EXHAUSTIVE                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Sans verification exhaustive :                              │
│  - On ajoute un nouveau type a l'union                       │
│  - On oublie de le gerer dans un switch                      │
│  - Bug silencieux en production !                            │
│                                                              │
│  Avec verification exhaustive :                              │
│  - On ajoute un nouveau type a l'union                       │
│  - ERREUR DE COMPILATION dans tous les switch qui            │
│    ne gerent pas le nouveau cas                              │
│  - Impossible d'oublier !                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Helper function pour l'exhaustive check

```typescript
// Fonction utilitaire reutilisable
function exhaustiveCheck(value: never): never {
  throw new Error(`Cas non gere : ${JSON.stringify(value)}`);
}

// Utilisation dans toutes les unions
type Animal = { type: "chat"; ronronne: boolean }
            | { type: "chien"; aboie: boolean }
            | { type: "poisson"; nage: boolean };

function decrireAnimal(animal: Animal): string {
  switch (animal.type) {
    case "chat":
      return `Chat qui ${animal.ronronne ? "ronronne" : "ne ronronne pas"}`;
    case "chien":
      return `Chien qui ${animal.aboie ? "aboie" : "n'aboie pas"}`;
    case "poisson":
      return `Poisson qui ${animal.nage ? "nage" : "ne nage pas"}`;
    default:
      return exhaustiveCheck(animal);
  }
}

// Si on ajoute { type: "oiseau"; vole: boolean } a Animal
// sans gerer le cas dans le switch :
// Erreur : Argument of type '{ type: "oiseau"; vole: boolean }' is not
//          assignable to parameter of type 'never'
```

---

## Control Flow Analysis

### Comment TypeScript analyse le flux

TypeScript suit le flux d'execution de ton code et **narrow les types automatiquement** :

```typescript
function analyserDonnee(donnee: string | number | null): void {
  // Ici : string | number | null

  if (donnee === null) {
    console.log("Pas de donnee");
    return; // Early return — sort de la fonction
  }
  // Ici : string | number (null a ete elimine par le return)

  if (typeof donnee === "string") {
    console.log(`Texte de ${donnee.length} caracteres`);
    return;
  }
  // Ici : number (string a ete elimine par le return)

  console.log(`Nombre : ${donnee.toFixed(2)}`);
}
```

### Narrowing avec les affectations

```typescript
// TypeScript suit les reassignations
let valeur: string | number;

valeur = "hello";
// Ici, valeur est string
console.log(valeur.toUpperCase()); // OK

valeur = 42;
// Ici, valeur est number
console.log(valeur.toFixed(2)); // OK

// Mais le type declare reste string | number
// pour la suite du flux
```

### Narrowing avec les fonctions de controle de flux

```typescript
// TypeScript comprend les early returns
function traiter(valeur: string | null): string {
  if (!valeur) {
    return "par defaut";
  }
  // valeur est string ici (null a ete gere au-dessus)
  return valeur.trim();
}

// TypeScript comprend les throw
function assertDefini<T>(valeur: T | undefined, nom: string): T {
  if (valeur === undefined) {
    throw new Error(`${nom} est undefined`);
  }
  // valeur est T ici
  return valeur;
}
```

### Narrowing avec l'affectation conditionnelle

```typescript
// TypeScript comprend les ternaires et les &&
function obtenirLongueur(texte: string | null): number {
  // Methode 1 : if classique
  if (texte !== null) {
    return texte.length;
  }
  return 0;

  // Methode 2 : ternaire
  // return texte !== null ? texte.length : 0;

  // Methode 3 : optional chaining + nullish coalescing
  // return texte?.length ?? 0;
}
```

---

## Optional Chaining + Narrowing

### Combiner ?. avec les verifications de type

```typescript
interface Utilisateur {
  nom: string;
  adresse?: {
    rue?: string;
    ville: string;
    codePostal?: string;
    pays: {
      nom: string;
      code: string;
    };
  };
}

function afficherAdresse(utilisateur: Utilisateur): string {
  // Optional chaining pour acceder aux proprietes imbriquees
  const ville = utilisateur.adresse?.ville;
  const rue = utilisateur.adresse?.rue;
  const pays = utilisateur.adresse?.pays.nom;

  // Chaque valeur est potentiellement undefined
  // ville : string | undefined
  // rue : string | undefined
  // pays : string | undefined

  // Narrowing avec des verifications
  if (!utilisateur.adresse) {
    return "Adresse non renseignee";
  }

  // Apres cette verification, utilisateur.adresse est defini
  let result = utilisateur.adresse.ville;

  if (utilisateur.adresse.rue) {
    result = `${utilisateur.adresse.rue}, ${result}`;
  }

  result += ` — ${utilisateur.adresse.pays.nom}`;

  return result;
}

// Tests
const alice: Utilisateur = { nom: "Alice" };
console.log(afficherAdresse(alice));
// "Adresse non renseignee"

const bob: Utilisateur = {
  nom: "Bob",
  adresse: {
    rue: "42 rue de la Paix",
    ville: "Paris",
    pays: { nom: "France", code: "FR" },
  },
};
console.log(afficherAdresse(bob));
// "42 rue de la Paix, Paris — France"
```

### Le pattern "guard clause"

```typescript
// Guard clauses = verifications au debut qui eliminent les cas invalides
// Le code principal est ensuite non-indente et clair

function calculerLivraison(
  commande: {
    poids?: number;
    destination?: string;
    express?: boolean;
  } | null
): number {
  // Guard clause 1 : commande nulle
  if (!commande) {
    throw new Error("Commande requise");
  }

  // Guard clause 2 : poids manquant
  if (!commande.poids) {
    throw new Error("Poids requis");
  }

  // Guard clause 3 : destination manquante
  if (!commande.destination) {
    throw new Error("Destination requise");
  }

  // Code principal — tous les types sont narrow
  const base = commande.poids * 2.5;
  const multiplicateur = commande.destination === "international" ? 3 : 1;
  const express = commande.express ? 10 : 0;

  return base * multiplicateur + express;
}
```

---

## Pratique

### Exercice 1 — Discriminated Union

Cree un type `Evenement` pour un calendrier avec ces variantes :
- `Reunion` : titre, participants (string[]), salle, dureeMinutes
- `Rappel` : titre, importance ("haute" | "moyenne" | "basse")
- `Tache` : titre, description, dateEcheance, terminee

Ecris une fonction `resumer(evenement)` qui retourne un resume different selon le type.

<details>
<summary>Solution</summary>

```typescript
interface Reunion {
  type: "reunion";
  titre: string;
  participants: string[];
  salle: string;
  dureeMinutes: number;
}

interface Rappel {
  type: "rappel";
  titre: string;
  importance: "haute" | "moyenne" | "basse";
}

interface Tache {
  type: "tache";
  titre: string;
  description: string;
  dateEcheance: Date;
  terminee: boolean;
}

type Evenement = Reunion | Rappel | Tache;

function resumer(evenement: Evenement): string {
  switch (evenement.type) {
    case "reunion":
      return `Reunion "${evenement.titre}" — ${evenement.participants.length} participants, salle ${evenement.salle}, ${evenement.dureeMinutes} min`;

    case "rappel": {
      const emoji =
        evenement.importance === "haute"
          ? "!!!"
          : evenement.importance === "moyenne"
          ? "!!"
          : "!";
      return `Rappel ${emoji} "${evenement.titre}"`;
    }

    case "tache": {
      const statut = evenement.terminee ? "Terminee" : "En cours";
      const echeance = evenement.dateEcheance.toLocaleDateString("fr-FR");
      return `Tache "${evenement.titre}" — ${statut} (echeance : ${echeance})`;
    }

    default:
      const _exhaustif: never = evenement;
      return _exhaustif;
  }
}

// Tests
const reunion: Reunion = {
  type: "reunion",
  titre: "Sprint Planning",
  participants: ["Alice", "Bob", "Charlie"],
  salle: "Salle A",
  dureeMinutes: 60,
};

const rappel: Rappel = {
  type: "rappel",
  titre: "Deployer en production",
  importance: "haute",
};

const tache: Tache = {
  type: "tache",
  titre: "Ecrire les tests",
  description: "Tests unitaires pour le module auth",
  dateEcheance: new Date("2024-12-31"),
  terminee: false,
};

console.log(resumer(reunion));
// Reunion "Sprint Planning" — 3 participants, salle Salle A, 60 min

console.log(resumer(rappel));
// Rappel !!! "Deployer en production"

console.log(resumer(tache));
// Tache "Ecrire les tests" — En cours (echeance : 31/12/2024)
```

</details>

### Exercice 2 — Type guards complets

Ecris des type guards pour valider des donnees venant d'une API (format unknown) :

1. `estChaine(valeur: unknown): valeur is string`
2. `estNombrePositif(valeur: unknown): valeur is number` — doit etre > 0
3. `estTableauNonVide<T>(valeur: unknown): valeur is [T, ...T[]]` — au moins un element
4. `estEmail(valeur: unknown): valeur is string` — doit contenir @

<details>
<summary>Solution</summary>

```typescript
// 1. Verifier que c'est une chaine
function estChaine(valeur: unknown): valeur is string {
  return typeof valeur === "string";
}

// 2. Verifier que c'est un nombre positif
function estNombrePositif(valeur: unknown): valeur is number {
  return typeof valeur === "number" && !isNaN(valeur) && valeur > 0;
}

// 3. Verifier que c'est un tableau non vide
function estTableauNonVide<T>(valeur: unknown): valeur is [T, ...T[]] {
  return Array.isArray(valeur) && valeur.length > 0;
}

// 4. Verifier que c'est un email (validation basique)
function estEmail(valeur: unknown): valeur is string {
  return (
    typeof valeur === "string" &&
    valeur.includes("@") &&
    valeur.includes(".") &&
    valeur.indexOf("@") > 0 &&
    valeur.indexOf("@") < valeur.lastIndexOf(".")
  );
}

// Tests
console.log(estChaine("hello"));        // true
console.log(estChaine(42));             // false

console.log(estNombrePositif(42));       // true
console.log(estNombrePositif(-5));       // false
console.log(estNombrePositif(NaN));      // false

console.log(estTableauNonVide([1, 2])); // true
console.log(estTableauNonVide([]));     // false

console.log(estEmail("alice@example.com")); // true
console.log(estEmail("pas-un-email"));      // false
console.log(estEmail("@invalid"));          // false

// Utilisation avec narrowing
function validerInscription(donnees: unknown): void {
  if (
    typeof donnees === "object" &&
    donnees !== null &&
    "email" in donnees &&
    "age" in donnees
  ) {
    const { email, age } = donnees as { email: unknown; age: unknown };

    if (!estEmail(email)) {
      console.error("Email invalide");
      return;
    }
    // email est string ici

    if (!estNombrePositif(age)) {
      console.error("Age invalide");
      return;
    }
    // age est number ici

    console.log(`Inscription de ${email}, age ${age}`);
  }
}

validerInscription({ email: "alice@example.com", age: 30 });
// "Inscription de alice@example.com, age 30"
```

</details>

### Exercice 3 — Narrowing exhaustif

Cree un type `Paiement` avec les variantes : `CarteBancaire`, `Virement`, `PayPal`, `Especes`.
Ecris une fonction `traiterPaiement` avec verification exhaustive.

<details>
<summary>Solution</summary>

```typescript
interface PaiementCarteBancaire {
  methode: "carte";
  numero: string;          // Les 4 derniers chiffres
  montant: number;
  devise: string;
}

interface PaiementVirement {
  methode: "virement";
  iban: string;
  montant: number;
  devise: string;
  reference: string;
}

interface PaiementPayPal {
  methode: "paypal";
  email: string;
  montant: number;
  devise: string;
}

interface PaiementEspeces {
  methode: "especes";
  montant: number;
  devise: string;
}

type Paiement =
  | PaiementCarteBancaire
  | PaiementVirement
  | PaiementPayPal
  | PaiementEspeces;

// Helper pour la verification exhaustive
function exhaustiveCheck(value: never): never {
  throw new Error(`Methode de paiement non geree : ${JSON.stringify(value)}`);
}

function traiterPaiement(paiement: Paiement): string {
  const montantFormate = `${paiement.montant.toFixed(2)} ${paiement.devise}`;

  switch (paiement.methode) {
    case "carte":
      return `Paiement par carte ****${paiement.numero} — ${montantFormate}`;

    case "virement":
      return `Virement IBAN ${paiement.iban} — ${montantFormate} (ref: ${paiement.reference})`;

    case "paypal":
      return `Paiement PayPal via ${paiement.email} — ${montantFormate}`;

    case "especes":
      return `Paiement en especes — ${montantFormate}`;

    default:
      return exhaustiveCheck(paiement);
  }
}

// Tests
console.log(
  traiterPaiement({
    methode: "carte",
    numero: "4242",
    montant: 59.99,
    devise: "EUR",
  })
);
// "Paiement par carte ****4242 — 59.99 EUR"

console.log(
  traiterPaiement({
    methode: "paypal",
    email: "alice@example.com",
    montant: 29.99,
    devise: "EUR",
  })
);
// "Paiement PayPal via alice@example.com — 29.99 EUR"

console.log(
  traiterPaiement({
    methode: "especes",
    montant: 15.0,
    devise: "EUR",
  })
);
// "Paiement en especes — 15.00 EUR"
```

</details>

### Exercice 4 — Control flow avance

Ecris une fonction `parseConfig` qui prend un objet `unknown` et retourne un objet `Config` type, en utilisant des guard clauses et du narrowing :

```typescript
interface Config {
  host: string;
  port: number;
  ssl: boolean;
  database: {
    url: string;
    maxConnections: number;
  };
}
```

<details>
<summary>Solution</summary>

```typescript
interface Config {
  host: string;
  port: number;
  ssl: boolean;
  database: {
    url: string;
    maxConnections: number;
  };
}

class ConfigError extends Error {
  constructor(champ: string, attendu: string, recu: unknown) {
    super(`Champ '${champ}' invalide : attendu ${attendu}, recu ${typeof recu} (${JSON.stringify(recu)})`);
    this.name = "ConfigError";
  }
}

function parseConfig(donnees: unknown): Config {
  // Guard : doit etre un objet
  if (typeof donnees !== "object" || donnees === null) {
    throw new ConfigError("racine", "object", donnees);
  }

  const obj = donnees as Record<string, unknown>;

  // Guard : host
  if (typeof obj.host !== "string") {
    throw new ConfigError("host", "string", obj.host);
  }

  // Guard : port
  if (typeof obj.port !== "number" || obj.port < 0 || obj.port > 65535) {
    throw new ConfigError("port", "number (0-65535)", obj.port);
  }

  // Guard : ssl
  if (typeof obj.ssl !== "boolean") {
    throw new ConfigError("ssl", "boolean", obj.ssl);
  }

  // Guard : database
  if (typeof obj.database !== "object" || obj.database === null) {
    throw new ConfigError("database", "object", obj.database);
  }

  const db = obj.database as Record<string, unknown>;

  if (typeof db.url !== "string") {
    throw new ConfigError("database.url", "string", db.url);
  }

  if (typeof db.maxConnections !== "number" || db.maxConnections < 1) {
    throw new ConfigError("database.maxConnections", "number (>= 1)", db.maxConnections);
  }

  // Toutes les verifications passees — on peut construire l'objet type
  return {
    host: obj.host,
    port: obj.port,
    ssl: obj.ssl,
    database: {
      url: db.url,
      maxConnections: db.maxConnections,
    },
  };
}

// Tests
try {
  const config = parseConfig({
    host: "localhost",
    port: 3000,
    ssl: true,
    database: {
      url: "postgres://localhost/mydb",
      maxConnections: 10,
    },
  });

  console.log("Config valide :", config);
  // Config est maintenant de type Config — entierement type
} catch (erreur) {
  if (erreur instanceof ConfigError) {
    console.error(erreur.message);
  }
}

// Test avec donnees invalides
try {
  parseConfig({
    host: "localhost",
    port: "3000", // Erreur : string au lieu de number
    ssl: true,
    database: {
      url: "postgres://localhost/mydb",
      maxConnections: 10,
    },
  });
} catch (erreur) {
  if (erreur instanceof ConfigError) {
    console.error(erreur.message);
    // "Champ 'port' invalide : attendu number (0-65535), recu string ("3000")"
  }
}
```

</details>

### Exercice 5 — Machine a etats

Implemente une machine a etats pour une commande e-commerce avec les etats :
`brouillon` → `validee` → `payee` → `expediee` → `livree`

Chaque transition doit etre typee — impossible de passer directement de `brouillon` a `livree`.

<details>
<summary>Solution</summary>

```typescript
// Chaque etat a des proprietes specifiques
interface CommandeBrouillon {
  etat: "brouillon";
  produits: string[];
}

interface CommandeValidee {
  etat: "validee";
  produits: string[];
  montantTotal: number;
}

interface CommandePayee {
  etat: "payee";
  produits: string[];
  montantTotal: number;
  paiementId: string;
}

interface CommandeExpediee {
  etat: "expediee";
  produits: string[];
  montantTotal: number;
  paiementId: string;
  trackingNumber: string;
}

interface CommandeLivree {
  etat: "livree";
  produits: string[];
  montantTotal: number;
  paiementId: string;
  trackingNumber: string;
  dateLivraison: Date;
}

type Commande =
  | CommandeBrouillon
  | CommandeValidee
  | CommandePayee
  | CommandeExpediee
  | CommandeLivree;

// Chaque transition est une fonction avec des types d'entree/sortie precis
function valider(commande: CommandeBrouillon): CommandeValidee {
  const montantTotal = commande.produits.length * 19.99; // Simplifie
  return {
    etat: "validee",
    produits: commande.produits,
    montantTotal,
  };
}

function payer(commande: CommandeValidee, paiementId: string): CommandePayee {
  return {
    ...commande,
    etat: "payee",
    paiementId,
  };
}

function expedier(commande: CommandePayee, trackingNumber: string): CommandeExpediee {
  return {
    ...commande,
    etat: "expediee",
    trackingNumber,
  };
}

function livrer(commande: CommandeExpediee): CommandeLivree {
  return {
    ...commande,
    etat: "livree",
    dateLivraison: new Date(),
  };
}

// Utilisation — seules les transitions valides compilent
let commande: Commande = {
  etat: "brouillon",
  produits: ["TypeScript Book", "Clavier"],
};

// commande est CommandeBrouillon — on peut la valider
if (commande.etat === "brouillon") {
  commande = valider(commande);
}

// commande est CommandeValidee — on peut la payer
if (commande.etat === "validee") {
  commande = payer(commande, "PAY-001");
}

// commande est CommandePayee — on peut l'expedier
if (commande.etat === "payee") {
  commande = expedier(commande, "TRACK-123");
}

// commande est CommandeExpediee — on peut la livrer
if (commande.etat === "expediee") {
  commande = livrer(commande);
}

console.log(commande);
// { etat: "livree", produits: [...], montantTotal: 39.98,
//   paiementId: "PAY-001", trackingNumber: "TRACK-123",
//   dateLivraison: Date }

// Impossible de faire des transitions invalides :
// payer({ etat: "brouillon", produits: [] }, "PAY-001");
// Erreur ! CommandeBrouillon n'est pas CommandeValidee
```

</details>

---

## Recapitulatif

```
┌──────────────────────────────────────────────────────────────┐
│                   CE QUE TU AS APPRIS                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Union types (|) :                                        │
│     - Une valeur peut etre de plusieurs types                │
│     - Seules les proprietes communes sont accessibles        │
│                                                              │
│  2. Discriminated unions :                                   │
│     - Un champ "tag" commun permet le narrowing automatique  │
│     - Pattern essentiel pour les actions, etats, evenements  │
│                                                              │
│  3. Techniques de narrowing :                                │
│     - typeof : types primitifs                               │
│     - instanceof : classes et heritage                       │
│     - in : presence d'une propriete                          │
│     - Truthiness : valeurs truthy/falsy                      │
│     - Egalite (===) : comparaison directe                    │
│     - switch : narrowing multi-cas                           │
│                                                              │
│  4. Type guards (is) : narrowing reutilisable                │
│                                                              │
│  5. Assertion functions (asserts) : throw si invalide        │
│                                                              │
│  6. Exhaustive checking (never) :                            │
│     - Garantit que tous les cas sont geres                   │
│     - Erreur de compilation si un cas est oublie             │
│                                                              │
│  7. Control flow analysis :                                  │
│     - TypeScript suit les if, return, throw                  │
│     - Le type est narrow automatiquement                     │
│                                                              │
│  8. Optional chaining + narrowing :                          │
│     - ?. combine avec les guard clauses                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Pour aller plus loin

Dans les prochains modules, nous allons approfondir :

- Les **generiques** — parametrer les types pour creer du code reutilisable
- Les **utility types** — `Partial`, `Required`, `Pick`, `Omit`, `Record`, etc.
- Les **mapped types** et **conditional types** — transformer les types
- Les **classes** avec TypeScript — heritage, modificateurs d'acces, abstractions

> **Conseil** : Les discriminated unions et le narrowing sont au coeur de TypeScript. Entraine-toi a modeliser des problemes reels (etats d'une commande, types de notifications, reponses d'API) avec des unions discriminees. C'est un pattern que tu utiliseras tous les jours.
