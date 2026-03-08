// =============================================================================
// Lab 15 — Variance
// =============================================================================
// Objectifs :
//   - Comprendre covariance, contravariance, invariance, bivariance
//   - Corriger des erreurs de variance
//   - Utiliser readonly et les annotations in/out
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, summary } = createTestRunner('Lab 15 — Variance');

// =============================================================================
// Hierarchie de types pour les exercices
// =============================================================================

class Animal {
  constructor(public name: string) {}
  breathe(): string {
    return `${this.name} respire`;
  }
}

class Dog extends Animal {
  bark(): string {
    return `${this.name} aboie`;
  }
}

class GuideDog extends Dog {
  guide(): string {
    return `${this.name} guide son maitre`;
  }
}

// =============================================================================
// Exercice 1 : Covariance (position de sortie)
// Les types sont covariants en position de retour.
// Dog etend Animal => Producer<Dog> est assignable a Producer<Animal>
// =============================================================================

// TODO: Definir l'interface Producer<T> avec une methode produce(): T
// Utiliser l'annotation `out` pour marquer la covariance
interface Producer<out T> {
  // TODO: ajouter la methode produce()
  produce(): T; // <-- a completer si necessaire
}

// TODO: Implementer une fonction qui demontre la covariance
// Assigner un Producer<Dog> a une variable de type Producer<Animal>
function demonstrateCovariance(): string {
  // TODO: creer un Producer<Dog> et l'assigner a un Producer<Animal>
  // puis appeler produce() et retourner le nom
  return ''; // <-- remplacez
}

// =============================================================================
// Exercice 2 : Contravariance (position d'entree)
// Les types sont contravariants en position de parametre.
// Dog etend Animal => Consumer<Animal> est assignable a Consumer<Dog>
// =============================================================================

// TODO: Definir l'interface Consumer<T> avec une methode consume(item: T): void
// Utiliser l'annotation `in` pour marquer la contravariance
interface Consumer<in T> {
  // TODO: ajouter la methode consume()
  consume(item: T): void; // <-- a completer si necessaire
}

// TODO: Implementer une fonction qui demontre la contravariance
// Un Consumer<Animal> peut consommer n'importe quel Animal, donc aussi un Dog
function demonstrateContravariance(): string {
  // TODO: creer un Consumer<Animal> et l'assigner a un Consumer<Dog>
  // puis appeler consume() avec un Dog
  return ''; // <-- remplacez
}

// =============================================================================
// Exercice 3 : Tableaux readonly vs mutable
// readonly T[] est covariant en T
// T[] (mutable) est invariant en T
// =============================================================================

// TODO: Implementer readAnimals qui accepte un readonly Animal[]
// et retourne les noms
function readAnimals(animals: readonly Animal[]): string[] {
  // TODO: retourner un tableau des noms
  return []; // <-- remplacez
}

// TODO: Expliquer (en commentaire) pourquoi ceci est sur :
// const dogs: Dog[] = [new Dog('Rex')];
// readAnimals(dogs); // OK car readonly Animal[] est covariant

// TODO: Implementer addAnimal qui ajoute un animal a un tableau mutable
function addAnimal(animals: Animal[], animal: Animal): void {
  // TODO: ajouter l'animal au tableau
  // <-- remplacez
}

// =============================================================================
// Exercice 4 : Generiques et variance — Transformer<In, Out>
// =============================================================================

// TODO: Definir Transformer<In, Out> avec les bonnes annotations de variance
// In est en position d'entree (contravariant), Out en position de sortie (covariant)
interface Transformer<in In, out Out> {
  // TODO: ajouter la methode transform(input: In): Out
  transform(input: In): Out; // <-- a completer si necessaire
}

// TODO: Implementer dogToString qui transforme un Dog en string
function createDogNameTransformer(): Transformer<Dog, string> {
  // TODO: retourner un objet avec une methode transform
  return { transform: (_dog: Dog) => '' }; // <-- remplacez
}

// TODO: Implementer une fonction qui demontre que
// Transformer<Animal, string> est assignable a Transformer<Dog, string>
// (contravariant en In)
function demonstrateTransformerVariance(): string {
  // TODO: creer un Transformer<Animal, string> et l'assigner
  // a Transformer<Dog, string> (contravariance en In)
  return ''; // <-- remplacez
}

// =============================================================================
// Exercice 5 : Corriger des erreurs de variance
// =============================================================================

// TODO: La fonction suivante a un probleme de variance.
// Corriger le type du parametre pour qu'il soit sur.
// Probleme : on lit depuis le tableau, donc il devrait etre readonly
function getFirstAnimalName(animals: readonly Animal[]): string {
  // TODO: retourner le nom du premier animal, ou 'vide' si le tableau est vide
  return ''; // <-- remplacez
}

// TODO: Implementer un type ReadonlyBox<T> covariant
// qui ne permet que la lecture
interface ReadonlyBox<out T> {
  // TODO: ajouter un getter readonly
  readonly value: T;
}

// TODO: Implementer un type MutableBox<T> invariant
// qui permet lecture et ecriture
interface MutableBox<in out T> {
  // TODO: ajouter un getter et un setter
  value: T;
}

// TODO: Implementer createReadonlyBox
function createReadonlyBox<T>(val: T): ReadonlyBox<T> {
  // TODO: retourner un objet ReadonlyBox
  return { value: val }; // <-- a verifier
}

// TODO: Implementer createMutableBox
function createMutableBox<T>(val: T): MutableBox<T> {
  // TODO: retourner un objet MutableBox
  return { value: val }; // <-- a verifier
}

// =============================================================================
// Exercice 6 : Fonctions et variance des parametres
// =============================================================================

// TODO: Completer le type FnVariance pour chaque cas
// Indiquer si l'assignation est valide ou non

type AnimalHandler = (a: Animal) => void;
type DogHandler = (d: Dog) => void;

// TODO: Implementer une fonction qui verifie la direction de la variance
// pour les fonctions en position de parametre
function demonstrateFunctionVariance(): { direction: string; explanation: string } {
  // TODO: retourner un objet avec :
  //   direction: 'contravariante'
  //   explanation: une explication en francais
  return {
    direction: '', // <-- remplacez
    explanation: '', // <-- remplacez
  };
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 15 — Variance\n');

  // --- Tests Covariance ---
  await test('Producer<Dog> devrait etre assignable a Producer<Animal>', () => {
    const result = demonstrateCovariance();
    assert(result.length > 0, 'Devrait retourner un nom');
  });

  await test('Producer covariant : produce() retourne le bon type', () => {
    const dogProducer: Producer<Dog> = {
      produce() { return new Dog('Rex'); }
    };
    // Covariance : Producer<Dog> -> Producer<Animal>
    const animalProducer: Producer<Animal> = dogProducer;
    const animal = animalProducer.produce();
    assertEqual(animal.name, 'Rex');
    assert(animal instanceof Dog);
  });

  // --- Tests Contravariance ---
  await test('Consumer<Animal> devrait etre assignable a Consumer<Dog>', () => {
    const result = demonstrateContravariance();
    assert(result.length > 0, 'Devrait retourner un resultat');
  });

  await test('Consumer contravariant : consume() accepte le sous-type', () => {
    let consumed = '';
    const animalConsumer: Consumer<Animal> = {
      consume(animal: Animal) { consumed = animal.name; }
    };
    // Contravariance : Consumer<Animal> -> Consumer<Dog>
    const dogConsumer: Consumer<Dog> = animalConsumer;
    dogConsumer.consume(new Dog('Buddy'));
    assertEqual(consumed, 'Buddy');
  });

  // --- Tests readonly arrays ---
  await test('readAnimals devrait accepter un Dog[]', () => {
    const dogs: Dog[] = [new Dog('Rex'), new Dog('Buddy')];
    const names = readAnimals(dogs);
    assertEqual(names.length, 2);
    assertEqual(names[0], 'Rex');
    assertEqual(names[1], 'Buddy');
  });

  await test('addAnimal devrait ajouter un animal au tableau', () => {
    const animals: Animal[] = [new Animal('Chat')];
    addAnimal(animals, new Dog('Rex'));
    assertEqual(animals.length, 2);
    assertEqual(animals[1].name, 'Rex');
  });

  // --- Tests Transformer ---
  await test('Transformer<Dog, string> devrait fonctionner', () => {
    const t = createDogNameTransformer();
    const result = t.transform(new Dog('Rex'));
    assert(typeof result === 'string');
  });

  await test('Transformer contravariant en In', () => {
    const result = demonstrateTransformerVariance();
    assert(result.length > 0);
  });

  // --- Tests corrections de variance ---
  await test('getFirstAnimalName avec un Dog[]', () => {
    const dogs: Dog[] = [new Dog('Rex'), new Dog('Buddy')];
    const name = getFirstAnimalName(dogs);
    assertEqual(name, 'Rex');
  });

  await test('getFirstAnimalName avec un tableau vide', () => {
    const empty: Animal[] = [];
    const name = getFirstAnimalName(empty);
    assertEqual(name, 'vide');
  });

  // --- Tests ReadonlyBox / MutableBox ---
  await test('ReadonlyBox<Dog> devrait etre assignable a ReadonlyBox<Animal>', () => {
    const dogBox: ReadonlyBox<Dog> = createReadonlyBox(new Dog('Rex'));
    const animalBox: ReadonlyBox<Animal> = dogBox; // covariance
    assertEqual(animalBox.value.name, 'Rex');
  });

  await test('MutableBox devrait permettre la lecture et l\'ecriture', () => {
    const box: MutableBox<Animal> = createMutableBox(new Animal('Chat'));
    assertEqual(box.value.name, 'Chat');
    box.value = new Dog('Rex');
    assertEqual(box.value.name, 'Rex');
  });

  // --- Tests variance des fonctions ---
  await test('La variance des fonctions en parametres est contravariante', () => {
    const result = demonstrateFunctionVariance();
    assertEqual(result.direction, 'contravariante');
    assert(result.explanation.length > 0, 'Devrait fournir une explication');
  });

  summary();
}

main();
