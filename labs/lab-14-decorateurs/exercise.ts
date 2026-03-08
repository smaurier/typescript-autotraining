// =============================================================================
// Lab 14 — Decorateurs (Stage 3)
// =============================================================================
// Objectifs :
//   - Comprendre les decorateurs Stage 3
//   - Implementer @Log, @Validate, @Memoize
//   - Simuler un mini-framework d'injection de dependances
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, assertIncludes, summary } = createTestRunner('Lab 14 — Decorateurs');

// =============================================================================
// Exercice 1 : Decorateur @Log
// Journalise les appels de methodes avec leurs arguments et valeurs de retour.
// Utilise la syntaxe Stage 3 (decorateur de methode).
// =============================================================================

// Stockage des logs pour les tests
const logs: string[] = [];

// TODO: Implementer le decorateur Log
// Il doit enregistrer dans le tableau `logs` :
//   - A l'appel : "Appel <nomMethode>(<args>)"
//   - Au retour : "Retour <nomMethode> => <resultat>"
// Signature Stage 3 : (target, context) => replacement | void
function Log<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
  // TODO: retourner une fonction qui enveloppe l'appel original
  // et journalise dans le tableau `logs`
  return target; // <-- remplacez par l'implementation
}

// =============================================================================
// Exercice 2 : Decorateur @Validate
// Verifie que tous les arguments numeriques sont positifs.
// =============================================================================

// TODO: Implementer le decorateur Validate
// Il doit lever une Error("Argument negatif interdit") si un argument
// de type number est < 0
function Validate<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
  // TODO: verifier chaque argument, lancer une erreur si nombre negatif
  return target; // <-- remplacez par l'implementation
}

// =============================================================================
// Exercice 3 : Decorateur @Memoize
// Met en cache les resultats en fonction des arguments.
// =============================================================================

// TODO: Implementer le decorateur Memoize
// Utilise JSON.stringify(args) comme cle de cache
function Memoize<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
  // TODO: creer un Map pour le cache et retourner une fonction
  // qui verifie le cache avant d'appeler la methode originale
  return target; // <-- remplacez par l'implementation
}

// =============================================================================
// Exercice 4 : Mini conteneur d'injection de dependances
// =============================================================================

// Registre de services
const serviceRegistry = new Map<string, unknown>();

// TODO: Implementer la fonction registerService pour enregistrer un service
function registerService(name: string, instance: unknown): void {
  // TODO: enregistrer dans serviceRegistry
}

// TODO: Implementer la fonction getService pour recuperer un service
function getService<T>(name: string): T {
  // TODO: retourner le service ou lever une erreur s'il n'existe pas
  throw new Error('Non implemente'); // <-- remplacez
}

// TODO: Implementer le decorateur Inject (decorateur d'accesseur ou de champ)
// Ce decorateur initialise un champ avec le service correspondant
function Inject(serviceName: string) {
  return function <This, Value>(
    target: undefined,
    context: ClassFieldDecoratorContext<This, Value>
  ): (this: This, value: Value) => Value {
    // TODO: retourner un initialiseur qui recupere le service
    return function (this: This, _value: Value): Value {
      return _value; // <-- remplacez par l'implementation
    };
  };
}

// =============================================================================
// Classes de test
// =============================================================================

class Calculator {
  @Log
  add(a: number, b: number): number {
    return a + b;
  }

  @Log
  multiply(a: number, b: number): number {
    return a * b;
  }

  @Validate
  squareRoot(n: number): number {
    return Math.sqrt(n);
  }

  @Validate
  divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division par zero');
    return a / b;
  }
}

class MathService {
  callCount = 0;

  @Memoize
  fibonacci(n: number): number {
    this.callCount++;
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @Memoize
  factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}

// Service fictif pour l'injection
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  messages: string[] = [];
  log(message: string): void {
    this.messages.push(message);
  }
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 14 — Decorateurs\n');

  // --- Tests @Log ---
  await test('@Log devrait journaliser l\'appel', () => {
    logs.length = 0;
    const calc = new Calculator();
    calc.add(2, 3);
    assertIncludes(logs[0], 'Appel add');
  });

  await test('@Log devrait journaliser le retour', () => {
    logs.length = 0;
    const calc = new Calculator();
    const result = calc.add(2, 3);
    assertEqual(result, 5);
    assertIncludes(logs[1], 'Retour add');
    assertIncludes(logs[1], '5');
  });

  await test('@Log devrait journaliser les arguments', () => {
    logs.length = 0;
    const calc = new Calculator();
    calc.multiply(4, 5);
    assertIncludes(logs[0], '4');
    assertIncludes(logs[0], '5');
  });

  // --- Tests @Validate ---
  await test('@Validate devrait accepter les nombres positifs', () => {
    const calc = new Calculator();
    const result = calc.squareRoot(16);
    assertEqual(result, 4);
  });

  await test('@Validate devrait rejeter les nombres negatifs', () => {
    const calc = new Calculator();
    let threw = false;
    try {
      calc.squareRoot(-4);
    } catch (e) {
      threw = true;
      assert(e instanceof Error);
      assertIncludes(e.message, 'negatif');
    }
    assert(threw, 'Aurait du lever une erreur');
  });

  await test('@Validate devrait rejeter si un des arguments est negatif', () => {
    const calc = new Calculator();
    let threw = false;
    try {
      calc.divide(-10, 2);
    } catch (e) {
      threw = true;
      assert(e instanceof Error);
    }
    assert(threw, 'Aurait du lever une erreur');
  });

  await test('@Validate devrait accepter zero', () => {
    const calc = new Calculator();
    const result = calc.squareRoot(0);
    assertEqual(result, 0);
  });

  // --- Tests @Memoize ---
  await test('@Memoize devrait retourner le meme resultat', () => {
    const math = new MathService();
    const r1 = math.factorial(5);
    const r2 = math.factorial(5);
    assertEqual(r1, 120);
    assertEqual(r2, 120);
  });

  await test('@Memoize devrait utiliser le cache', () => {
    const math = new MathService();
    math.callCount = 0;
    math.fibonacci(0);
    const firstCallCount = math.callCount;
    math.fibonacci(0);
    // Le deuxieme appel ne devrait pas incrementer callCount
    assertEqual(math.callCount, firstCallCount, 'Le cache devrait eviter un second appel');
  });

  await test('@Memoize devrait differencier les arguments', () => {
    const math = new MathService();
    const r1 = math.factorial(3);
    const r2 = math.factorial(4);
    assertEqual(r1, 6);
    assertEqual(r2, 24);
  });

  // --- Tests Injection de dependances ---
  await test('registerService devrait enregistrer un service', () => {
    const logger = new ConsoleLogger();
    registerService('logger', logger);
    const retrieved = getService<ConsoleLogger>('logger');
    assert(retrieved === logger, 'Devrait retourner la meme instance');
  });

  await test('getService devrait lever une erreur pour un service inconnu', () => {
    let threw = false;
    try {
      getService('inexistant');
    } catch {
      threw = true;
    }
    assert(threw, 'Devrait lever une erreur');
  });

  await test('@Inject devrait injecter le service dans le champ', () => {
    const logger = new ConsoleLogger();
    registerService('logger', logger);

    class MyController {
      @Inject('logger')
      logger!: ConsoleLogger;
    }

    const ctrl = new MyController();
    assert(ctrl.logger === logger, 'Le champ devrait contenir le service injecte');
  });

  summary();
}

main();
