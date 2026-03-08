// =============================================================================
// Lab 15 — Variance (SOLUTION)
// =============================================================================
// Objectifs :
//   - Comprendre covariance, contravariance, invariance, bivariance
//   - Corriger des erreurs de variance
//   - Utiliser readonly et les annotations in/out
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, summary } = createTestRunner('Lab 15 — Variance');

// =============================================================================
// Hierarchie de types
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
// Exercice 1 : Covariance
// =============================================================================

interface Producer<out T> {
  produce(): T;
}

function demonstrateCovariance(): string {
  const dogProducer: Producer<Dog> = {
    produce() { return new Dog('Rex'); }
  };
  // Covariance : Producer<Dog> est assignable a Producer<Animal>
  const animalProducer: Producer<Animal> = dogProducer;
  return animalProducer.produce().name;
}

// =============================================================================
// Exercice 2 : Contravariance
// =============================================================================

interface Consumer<in T> {
  consume(item: T): void;
}

function demonstrateContravariance(): string {
  let result = '';
  const animalConsumer: Consumer<Animal> = {
    consume(animal: Animal) {
      result = `Consomme: ${animal.name}`;
    }
  };
  // Contravariance : Consumer<Animal> est assignable a Consumer<Dog>
  const dogConsumer: Consumer<Dog> = animalConsumer;
  dogConsumer.consume(new Dog('Buddy'));
  return result;
}

// =============================================================================
// Exercice 3 : Tableaux readonly vs mutable
// =============================================================================

function readAnimals(animals: readonly Animal[]): string[] {
  return animals.map(a => a.name);
}

// Explication : readonly Animal[] est covariant en Animal.
// Puisque Dog etend Animal, Dog[] (qui etend readonly Dog[])
// est assignable a readonly Animal[]. C'est sur car on ne peut
// pas ecrire dans un tableau readonly, donc pas de risque d'y
// inserer un Animal qui n'est pas un Dog.

function addAnimal(animals: Animal[], animal: Animal): void {
  animals.push(animal);
}

// =============================================================================
// Exercice 4 : Transformer<In, Out>
// =============================================================================

interface Transformer<in In, out Out> {
  transform(input: In): Out;
}

function createDogNameTransformer(): Transformer<Dog, string> {
  return {
    transform(dog: Dog): string {
      return `Chien: ${dog.name} - ${dog.bark()}`;
    }
  };
}

function demonstrateTransformerVariance(): string {
  // Transformer<Animal, string> peut transformer n'importe quel Animal
  const animalTransformer: Transformer<Animal, string> = {
    transform(animal: Animal): string {
      return `Animal: ${animal.name}`;
    }
  };
  // Contravariance en In : Transformer<Animal, string> -> Transformer<Dog, string>
  const dogTransformer: Transformer<Dog, string> = animalTransformer;
  return dogTransformer.transform(new Dog('Rex'));
}

// =============================================================================
// Exercice 5 : Corrections de variance
// =============================================================================

function getFirstAnimalName(animals: readonly Animal[]): string {
  if (animals.length === 0) return 'vide';
  return animals[0].name;
}

interface ReadonlyBox<out T> {
  readonly value: T;
}

interface MutableBox<in out T> {
  value: T;
}

function createReadonlyBox<T>(val: T): ReadonlyBox<T> {
  return { value: val };
}

function createMutableBox<T>(val: T): MutableBox<T> {
  return { value: val };
}

// =============================================================================
// Exercice 6 : Fonctions et variance des parametres
// =============================================================================

type AnimalHandler = (a: Animal) => void;
type DogHandler = (d: Dog) => void;

function demonstrateFunctionVariance(): { direction: string; explanation: string } {
  return {
    direction: 'contravariante',
    explanation:
      'Les fonctions sont contravariantes en leurs parametres : ' +
      'AnimalHandler ((a: Animal) => void) est assignable a DogHandler ((d: Dog) => void) ' +
      'car une fonction qui sait traiter tout Animal sait aussi traiter un Dog. ' +
      'L\'inverse n\'est pas vrai : une fonction qui attend un Dog pourrait appeler bark(), ' +
      'ce qui n\'existe pas sur Animal.',
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
    const animalBox: ReadonlyBox<Animal> = dogBox;
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
