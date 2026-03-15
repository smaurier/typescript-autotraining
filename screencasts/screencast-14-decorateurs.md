# Screencast 14 — Decorateurs Stage 3

## Informations
- **Duree estimee** : 18-20 min
- **Module** : `modules/14-decorateurs.md`
- **Lab associe** : Lab 14
- **Prérequis** : Screencast 05 (classes)

## Setup
- [ ] VS Code ouvert dans `typescript-course/`
- [ ] Terminal intégré ouvert
- [ ] Fichier `src/14-decorateurs.ts` pret a etre créé
- [ ] `tsconfig.json` avec `"target": "ES2022"` minimum
- [ ] Ne PAS activer `experimentalDecorators` (on utilise les Stage 3)

## Script

### [00:00-03:30] Introduction aux decorateurs Stage 3

> Les decorateurs sont un mécanisme pour annoter et modifier les classes et leurs membres. TypeScript 5.0 a introduit le support des decorateurs Stage 3 du standard ECMAScript — ils sont différents des anciens decorateurs experimentaux. Dans ce screencast, nous utilisons exclusivement les decorateurs Stage 3.

**Action** : Créer le fichier `src/14-decorateurs.ts`. Vérifier que `experimentalDecorators` n'est PAS dans `tsconfig.json`.

```typescript
// Un decorateur est une fonction qui recoit la cible et un contexte
// Syntaxe : @decorator

// Decorateur de classe le plus simple : log
function logClass<T extends new (...args: any[]) => any>(
  target: T,
  context: ClassDecoratorContext
) {
  console.log(`Classe decoree : ${context.name}`);
  return target;
}

@logClass
class UserService {
  getUser(id: string) {
    return { id, name: "Alice" };
  }
}

// Le log s'affiche au moment ou la classe est definie
const service = new UserService();
console.log(service.getUser("1"));
```

**Action** : Exécuter avec `npx tsx src/14-decorateurs.ts` et montrer le log à la définition de la classe.

> Le decorateur recoit deux arguments : la valeur decoree (ici le constructeur de la classe) et un objet de contexte qui contient des metadonnees comme le nom, le type (class, method, field, etc.) et un hook `addInitializer`.

### [03:30-08:30] Decorateurs de méthode

> Les decorateurs de méthode sont les plus courants en pratique.

**Action** : Ajouter le code suivant.

```typescript
// Decorateur de methode : logger les appels
function log(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacement(this: any, ...args: any[]) {
    console.log(`-> ${methodName}(${args.map(a => JSON.stringify(a)).join(", ")})`);
    const result = target.call(this, ...args);
    console.log(`<- ${methodName} = ${JSON.stringify(result)}`);
    return result;
  }

  return replacement;
}

// Decorateur de methode : mesurer le temps d'execution
function measure(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacement(this: any, ...args: any[]) {
    const start = performance.now();
    const result = target.call(this, ...args);
    const end = performance.now();
    console.log(`${methodName} : ${(end - start).toFixed(2)} ms`);
    return result;
  }

  return replacement;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }

  @measure
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @log
  @measure
  multiply(a: number, b: number): number {
    return a * b;
  }
}

const calc = new Calculator();
calc.add(3, 4);
// -> add(3, 4)
// <- add = 7

console.log("---");
calc.fibonacci(10);
// fibonacci : X.XX ms

console.log("---");
calc.multiply(5, 6);
// Les deux decorateurs s'appliquent (log puis measure)
```

**Action** : Exécuter et montrer les logs dans le terminal. Montrer l'ordre d'application des decorateurs empiles.

> Quand plusieurs decorateurs sont empiles, ils s'appliquent de bas en haut (le plus proche de la méthode d'abord). Ici, `multiply` passe d'abord par `@measure` puis par `@log`.

### [08:30-13:00] Decorateurs de propriété et d'accesseur

> On peut aussi decorer les propriétés et les accesseurs.

**Action** : Ajouter le code suivant.

```typescript
// Decorateur de champ (field decorator)
function defaultValue<T>(value: T) {
  return function (
    _target: undefined,
    context: ClassFieldDecoratorContext
  ) {
    return function (initialValue: T) {
      return initialValue ?? value;
    };
  };
}

// Decorateur de validation sur un setter (accessor decorator)
function validate(min: number, max: number) {
  return function <T extends { get: () => number; set: (v: number) => void }>(
    target: T,
    context: ClassAccessorDecoratorContext
  ): T {
    return {
      get: target.get,
      set(value: number) {
        if (value < min || value > max) {
          throw new RangeError(
            `${String(context.name)} doit etre entre ${min} et ${max}, recu : ${value}`
          );
        }
        target.set.call(this, value);
      },
    } as T;
  };
}

class Player {
  @defaultValue("Inconnu")
  name: string | undefined;

  @validate(0, 100)
  accessor health = 100;

  @validate(0, 999)
  accessor score = 0;

  takeDamage(amount: number): void {
    this.health -= amount;
    console.log(`${this.name} : sante = ${this.health}`);
  }
}

const player = new Player();
console.log(player.name); // "Inconnu" (defaultValue applique)

player.health = 80;
console.log(player.health); // 80

try {
  player.health = -10; // Erreur : doit etre entre 0 et 100
} catch (e) {
  console.error((e as Error).message);
}
```

**Action** : Montrer que `player.name` à la valeur par defaut, et que l'assignation invalide de `health` lance une erreur.

> Le mot-clé `accessor` est nouveau en TypeScript 5.0. Il créé automatiquement un getter et un setter, ce qui permet au decorateur de les intercepter. C'est beaucoup plus propre que les anciens decorateurs experimentaux.

### [13:00-17:00] Decorateurs avec paramètres et composition

> La plupart des decorateurs utiles acceptent des paramètres. C'est un pattern de "factory de decorateurs".

**Action** : Ajouter le code suivant.

```typescript
// Decorateur factory : retry
function retry(maxAttempts: number, delay: number = 0) {
  return function (
    target: Function,
    context: ClassMethodDecoratorContext
  ) {
    const methodName = String(context.name);

    async function replacement(this: any, ...args: any[]) {
      let lastError: Error | undefined;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await target.call(this, ...args);
        } catch (e) {
          lastError = e as Error;
          console.warn(`${methodName} : tentative ${attempt}/${maxAttempts} echouee`);
          if (attempt < maxAttempts && delay > 0) {
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw lastError;
    }

    return replacement;
  };
}

// Decorateur factory : memoize
function memoize(
  target: Function,
  context: ClassMethodDecoratorContext
) {
  const cache = new Map<string, any>();

  function replacement(this: any, ...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`[cache hit] ${String(context.name)}(${key})`);
      return cache.get(key);
    }
    const result = target.call(this, ...args);
    cache.set(key, result);
    return result;
  }

  return replacement;
}

class ApiClient {
  @retry(3, 1000)
  async fetchData(url: string): Promise<string> {
    console.log(`Fetching ${url}...`);
    // Simulation d'un appel qui peut echouer
    if (Math.random() < 0.5) {
      throw new Error("Erreur reseau");
    }
    return `Donnees de ${url}`;
  }

  @memoize
  computeExpensive(n: number): number {
    console.log(`Calcul pour ${n}...`);
    let result = 0;
    for (let i = 0; i < n * 1000000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }
}

const client = new ApiClient();

// Test memoize
console.log(client.computeExpensive(5));  // Calcul...
console.log(client.computeExpensive(5));  // [cache hit]
console.log(client.computeExpensive(10)); // Calcul... (cle differente)
```

**Action** : Exécuter et montrer le cache hit au deuxieme appel de `computeExpensive`.

### [17:00-19:30] Récapitulatif et bonnes pratiques

> Resumons les différents types de decorateurs.

```typescript
// Types de decorateurs Stage 3 :
//
// 1. Decorateur de classe
//    function dec(target, context: ClassDecoratorContext)
//
// 2. Decorateur de methode
//    function dec(target, context: ClassMethodDecoratorContext)
//
// 3. Decorateur de getter/setter
//    function dec(target, context: ClassGetterDecoratorContext)
//    function dec(target, context: ClassSetterDecoratorContext)
//
// 4. Decorateur de champ
//    function dec(target, context: ClassFieldDecoratorContext)
//
// 5. Decorateur d'accessor (nouveau)
//    function dec(target, context: ClassAccessorDecoratorContext)
//
// Bonnes pratiques :
// - Preferez les decorateurs Stage 3 aux experimentaux
// - Un decorateur = une seule responsabilite
// - Documentez les effets de bord (logging, caching)
// - Testez les decorateurs independamment des classes
```

> En résumé : les decorateurs Stage 3 sont une fonctionnalite stable et standardisee. Ils permettent d'ajouter des comportements transverses (logging, caching, validation, retry) de manière declarative. L'objet `context` fournit des metadonnees riches et le mot-clé `accessor` simplifie les decorateurs de propriété.

## Points d'attention pour l'enregistrement
- Vérifier que `experimentalDecorators` n'est PAS actif — les deux systèmes sont incompatibles
- Bien expliquer la différence entre decorateurs Stage 3 et les anciens experimentaux
- L'ordre d'application (bas vers haut) est important — bien le demontrer visuellement
- Le mot-clé `accessor` est spécifique a TypeScript 5.0+ — le mentionner
- Exécuter chaque exemple pour montrer le comportement a l'exécution
