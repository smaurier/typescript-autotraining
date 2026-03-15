# Screencast 15 — Variance : covariance, contravariance et soundness

## Informations
- **Duree estimee** : 20-25 min
- **Module** : `modules/15-variance.md`
- **Lab associe** : aucun
- **Prérequis** : Screencast 06 (generics), Screencast 05 (classes)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/15-variance.ts` pret a etre créé
- [ ] Mode strict actif dans `tsconfig.json`
- [ ] `strictFunctionTypes` actif (inclus dans strict)

## Script

### [00:00-04:30] Introduction à la variance

> La variance decrit comment la relation de sous-typage entre des types simples se propage a des types composes (comme les génériques). C'est un sujet théorique, mais comprendre la variance est essentiel pour éviter des bugs subtils et écrire des API robustes.

**Action** : Créer le fichier `src/15-variance.ts`.

```typescript
// Hierarchie de types pour nos exemples
class Animal {
  constructor(public name: string) {}
  eat(): void {
    console.log(`${this.name} mange`);
  }
}

class Dog extends Animal {
  bark(): void {
    console.log(`${this.name} aboie`);
  }
}

class GoldenRetriever extends Dog {
  fetch(): void {
    console.log(`${this.name} rapporte la balle`);
  }
}

// Relation de sous-typage : GoldenRetriever <: Dog <: Animal
// GoldenRetriever est assignable a Dog, Dog est assignable a Animal

const dog: Dog = new GoldenRetriever("Rex"); // OK
const animal: Animal = new Dog("Buddy");      // OK
// const golden: GoldenRetriever = new Dog("Buddy"); // Erreur

// La question : si Dog <: Animal,
// alors Array<Dog> <: Array<Animal> ?
// et (Animal) => void <: (Dog) => void ?
```

**Action** : Montrer l'assignation reussie et l'erreur pour fixer la hiérarchie visuellement.

> La question fondamentale de la variance est : si B est un sous-type de A, comment se comportent les types génériques `G<B>` et `G<A>` ? La réponse depend de la position du paramètre de type.

### [04:30-10:00] Covariance : position de sortie

> Un type est covariant quand la relation de sous-typage est preservee dans le même sens.

**Action** : Ajouter le code suivant.

```typescript
// COVARIANCE : les types en position de SORTIE (retour)

// Array<T> est covariant en T (T est en position de sortie pour les lectures)
const dogs: Dog[] = [new Dog("Rex"), new Dog("Buddy")];
const animals: Animal[] = dogs; // OK — Dog[] est assignable a Animal[]

// C'est intuitif : un tableau de chiens est un tableau d'animaux

// Mais attention : c'est un trou de soundness !
animals.push(new Animal("Chat")); // Compile... mais maintenant dogs contient un Animal !
// dogs[2].bark(); // Erreur a l'EXECUTION ! Animal n'a pas bark()

// Les fonctions qui retournent un type sont covariantes en retour
type Producer<T> = () => T;

const produceDog: Producer<Dog> = () => new Dog("Rex");
const produceAnimal: Producer<Animal> = produceDog; // OK
// Un producteur de Dog est un producteur d'Animal

// Annotation explicite avec le mot-cle "out" (TypeScript 4.7+)
interface ReadonlyBox<out T> {
  readonly value: T;
  get(): T;
}

const dogBox: ReadonlyBox<Dog> = { value: new Dog("Rex"), get() { return this.value; } };
const animalBox: ReadonlyBox<Animal> = dogBox; // OK — covariant
```

**Action** : Montrer le bug runtime avec `animals.push(new Animal("Chat"))`. Souligner que c'est un trou de soundness connu de TypeScript.

> La covariance signifie que si `Dog <: Animal`, alors `Producer<Dog> <: Producer<Animal>`. C'est logique pour les types en position de sortie. Mais pour les tableaux, qui sont à la fois lisibles et modifiables, cela créé un trou de soundness.

### [10:00-16:00] Contravariance : position d'entree

> Un type est contravariant quand la relation de sous-typage est inversee.

**Action** : Ajouter le code suivant.

```typescript
// CONTRAVARIANCE : les types en position d'ENTREE (parametre)

// Les fonctions sont contravariantes en leurs parametres
type Consumer<T> = (item: T) => void;

const feedAnimal: Consumer<Animal> = (animal) => {
  console.log(`Nourrir ${animal.name}`);
  animal.eat();
};

const feedDog: Consumer<Dog> = feedAnimal; // OK !
// Un consommateur d'Animal est un consommateur de Dog

// C'est contre-intuitif mais logique :
// feedAnimal sait nourrir n'importe quel Animal
// donc il sait forcement nourrir un Dog (qui est un Animal)

// L'inverse NE fonctionne PAS :
const trainDog: Consumer<Dog> = (dog) => {
  dog.bark(); // utilise une methode specifique a Dog
};

// const trainAnimal: Consumer<Animal> = trainDog; // Erreur !
// trainDog attend un Dog, on ne peut pas lui passer un Animal quelconque

// Annotation explicite avec "in" (TypeScript 4.7+)
interface Comparator<in T> {
  compare(a: T, b: T): number;
}

const animalComparator: Comparator<Animal> = {
  compare: (a, b) => a.name.localeCompare(b.name),
};

const dogComparator: Comparator<Dog> = animalComparator; // OK — contravariant

// Bi-variance : les methodes (pas les fonctions) sont bivariantes par defaut
// C'est un compromis de TypeScript pour la compatibilite
interface EventHandler {
  // Methode — bivariante (plus permissif)
  handleEvent(event: Event): void;
}

// Avec strictFunctionTypes, les proprietes de type fonction sont contravariantes
interface StrictHandler {
  // Propriete de type fonction — contravariante
  handleEvent: (event: Event) => void;
}
```

**Action** : Decommenter `const trainAnimal` pour montrer l'erreur. Expliquer pourquoi l'inversion est logique.

> La contravariance est le concept le plus deroutant. Retenez : si vous consommez (recevez en paramètre) un type, la relation est inversee. Un consommateur plus général peut toujours etre utilise la ou un consommateur spécifique est attendu.

### [16:00-20:30] Invariance et trous de soundness

> L'invariance signifie qu'aucune substitution n'est possible.

**Action** : Ajouter le code suivant.

```typescript
// INVARIANCE : les types en position d'entree ET de sortie

// Annotation explicite avec "in out"
interface MutableBox<in out T> {
  value: T;
  get(): T;      // position de sortie (covariant)
  set(v: T): void; // position d'entree (contravariant)
  // Covariant + contravariant = invariant
}

const dogMutableBox: MutableBox<Dog> = {
  value: new Dog("Rex"),
  get() { return this.value; },
  set(v: Dog) { this.value = v; },
};

// const animalMutableBox: MutableBox<Animal> = dogMutableBox; // Erreur — invariant
// const goldenMutableBox: MutableBox<GoldenRetriever> = dogMutableBox; // Erreur aussi

// Les trous de soundness connus de TypeScript :
// 1. Arrays sont covariants (devraient etre invariants pour la mutation)
const dogs2: Dog[] = [new Dog("A")];
const animals2: Animal[] = dogs2; // OK mais dangereux

// 2. Parametres de type bivariants pour les methodes
// (avec strictFunctionTypes, seulement les proprietes fonctions sont contravariantes)

// 3. any bypass tout le systeme de types
const x: any = "hello";
const n: number = x; // Pas d'erreur

// Comment se proteger :
// - Utiliser readonly quand possible
const safeDogs: readonly Dog[] = [new Dog("A")];
const safeAnimals: readonly Animal[] = safeDogs; // OK et sur
// safeAnimals.push(...); // Erreur — readonly, pas de mutation

// - Utiliser les annotations in/out pour clarifier l'intention
interface SafeProducer<out T> {
  produce(): T;
}

interface SafeConsumer<in T> {
  consume(item: T): void;
}
```

**Action** : Montrer que `MutableBox` est invariant en tentant les assignations.

### [20:30-24:00] Applications pratiques et récapitulatif

> Voyons comment la variance s'applique dans du code réel.

```typescript
// Application : les callbacks de Promise
// Promise<T> est covariant en T (on lit le resultat)
async function fetchDog(): Promise<Dog> {
  return new Dog("API Dog");
}

async function processAnimal(p: Promise<Animal>): Promise<void> {
  const animal = await p;
  animal.eat();
}

processAnimal(fetchDog()); // OK — Promise<Dog> <: Promise<Animal>

// Application : comparateurs et predicats
function sortAnimals(arr: Dog[], comparator: (a: Animal, b: Animal) => number): void {
  arr.sort(comparator);
}

// On peut passer un comparateur d'Animal pour trier des Dogs
sortAnimals(dogs, (a, b) => a.name.localeCompare(b.name));

// Resume de la variance :
//
// | Position      | Variance       | Annotation | Exemple         |
// |---------------|----------------|------------|-----------------|
// | Retour (out)  | Covariant      | out T      | Producer<T>     |
// | Parametre (in)| Contravariant  | in T       | Consumer<T>     |
// | Les deux      | Invariant      | in out T   | MutableBox<T>   |
// | Aucune        | Bivariant      | (defaut)   | Methodes legacy |
```

> En résumé : la variance déterminé quand une substitution de type est sure. Covariant pour les sorties, contravariant pour les entrees, invariant quand c'est les deux. TypeScript fait des compromis de soundness (arrays covariants, méthodes bivariantes) pour des raisons pratiques. Utilisez `readonly`, les annotations `in`/`out`, et `strictFunctionTypes` pour maximiser la sécurité.

## Points d'attention pour l'enregistrement
- La hiérarchie Animal > Dog > GoldenRetriever doit etre claire des le debut
- Le trou de soundness des arrays est un excellent point de discussion
- La contravariance des fonctions est le point le plus difficile — utiliser des analogies
- Le tableau récapitulatif à la fin est essentiel — le montrer en plein ecran
- Ne pas se precipiter : chaque concept merite 2-3 minutes d'explication
