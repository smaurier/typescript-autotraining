# 19 — Projet final — Bibliotheque utilitaire type-safe

> **Duree estimee** : 6 heures
> **Difficulte** : 5/5
> **Prérequis** : Modules 1 a 18, ensemble des concepts du parcours
> **Objectifs** :
>
> - Réinvestir les concepts du cours dans un vrai projet cohérent
> - Concevoir une petite bibliothèque TypeScript propre, testée et documentée
> - Travailler la structure, le build, les types, les tests et la publication
> - Produire un résultat réutilisable au-delà du module lui-même

---

## Introduction — Pourquoi finir par un projet complet ?

### Le problème qu'on cherche à résoudre

On peut comprendre chaque notion séparément sans réussir a les combiner dans un vrai projet. Or c'est justement là que les questions sérieuses apparaissent : organisation, cohérence des types, qualité du build, tests, ergonomie d'API, documentation.

### La solution : construire une bibliothèque qui oblige a relier tous les modules

Ce projet final sert a reconnecter tout le parcours. Tu ne vas pas seulement écrire du code "qui compile" : tu vas concevoir une bibliothèque qui expose une API, transporte des types propres, se teste, se build et pourrait réellement être publiée.

### Analogie de la boite a outils

Imagine un artisan qui fabrique sa propre boite a outils. Chaque outil doit être utile seul, mais aussi cohérent avec les autres. C'est exactement l'objectif de ce projet.

> 💡 **Ce qu'il faut retenir** : ce module n'est pas une simple suite d'exercices. C'est la mise en pratique globale du parcours.

### Ce que nous allons construire

1. **EventEmitter type-safe** — système d'événements avec types génériques
2. **Result<T, E> monad** — gestion d'erreurs fonctionnelle
3. **Conteneur DI type-safe** — injection de dépendances
4. **pipe/compose** — composition de fonctions
5. **Schema validation** — un mini-Zod
6. **Deep merge type-safe** — fusion profonde d'objets
7. **Path-typed object access** — acces type par chemin de propriétés
8. **Tests** avec Vitest
9. **Documentation** avec TSDoc
10. **Build** avec tsup et publication simulee

---

## Mise en place du projet

### Structure de fichiers

```
ts-toolkit/
  package.json
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  src/
    index.ts              <- Point d'entree, re-exporte tout
    event-emitter.ts      <- EventEmitter type-safe
    result.ts             <- Result<T, E> monad
    container.ts          <- Conteneur DI
    pipe.ts               <- pipe et compose
    schema.ts             <- Mini-Zod
    deep-merge.ts         <- Deep merge
    path-access.ts        <- Acces par chemin
    types.ts              <- Types utilitaires partages
  tests/
    event-emitter.test.ts
    result.test.ts
    container.test.ts
    pipe.test.ts
    schema.test.ts
    deep-merge.test.ts
    path-access.test.ts
  dist/                   <- Genere par tsup
```

### package.json

```json
{
  "name": "@student/ts-toolkit",
  "version": "1.0.0",
  "description": "Bibliotheque utilitaire TypeScript type-safe",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "ci": "npm run typecheck && npm run test && npm run build",
    "prepublishOnly": "npm run ci",
    "pack:dry": "npm pack --dry-run"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "keywords": ["typescript", "utilities", "type-safe"],
  "license": "MIT"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  // tsup utilise esbuild pour le JS et tsc pour les .d.ts
});
```

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types.ts"],
    },
  },
});
```

---

## Module 1 : Types utilitaires partages

```typescript
// src/types.ts

/**
 * Represente une cle de propriete valide pour un objet
 */
export type ClePropriete = string | number | symbol;

/**
 * Un objet avec des cles de type string et des valeurs quelconques
 */
export type ObjetQuelconque = Record<string, unknown>;

/**
 * Rend toutes les proprietes d'un type profondement readonly
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

/**
 * Rend toutes les proprietes d'un type profondement optionnelles
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

/**
 * Rend toutes les proprietes d'un type profondement requises
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepRequired<T[K]>
    : T[K];
};

/**
 * Verifie si un type est 'never'
 */
export type EstNever<T> = [T] extends [never] ? true : false;

/**
 * Verifie si deux types sont identiques
 */
export type SontIdentiques<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
```

---

## Module 2 : Result<T, E> — Gestion d'erreurs fonctionnelle

```typescript
// src/result.ts

/**
 * Represente le resultat d'une operation qui peut echouer.
 * Alternative type-safe aux exceptions.
 *
 * @typeParam T - Type de la valeur en cas de succes
 * @typeParam E - Type de l'erreur en cas d'echec
 *
 * @example
 * ```typescript
 * const r = Result.ok(42);
 * const mapped = Result.map(r, n => n * 2);
 * // mapped = { ok: true, valeur: 84 }
 * ```
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly valeur: T }
  | { readonly ok: false; readonly erreur: E };

/**
 * Namespace contenant toutes les operations sur Result
 */
export namespace Result {
  /**
   * Cree un Result reussi
   * @param valeur - La valeur de succes
   */
  export function ok<T>(valeur: T): Result<T, never> {
    return { ok: true, valeur };
  }

  /**
   * Cree un Result en erreur
   * @param erreur - L'erreur
   */
  export function err<E>(erreur: E): Result<never, E> {
    return { ok: false, erreur };
  }

  /**
   * Transforme la valeur d'un Result reussi
   * Si le Result est en erreur, il est retourne tel quel
   *
   * @example
   * ```typescript
   * const r = Result.ok(5);
   * const double = Result.map(r, n => n * 2);
   * // { ok: true, valeur: 10 }
   * ```
   */
  export function map<T, U, E>(
    resultat: Result<T, E>,
    fn: (val: T) => U
  ): Result<U, E> {
    if (resultat.ok) {
      return ok(fn(resultat.valeur));
    }
    return resultat;
  }

  /**
   * Chaine un Result avec une fonction qui retourne un Result.
   * Equivalent a flatMap/bind dans d'autres langages.
   */
  export function flatMap<T, U, E>(
    resultat: Result<T, E>,
    fn: (val: T) => Result<U, E>
  ): Result<U, E> {
    if (resultat.ok) {
      return fn(resultat.valeur);
    }
    return resultat;
  }

  /**
   * Transforme l'erreur d'un Result echoue
   */
  export function mapErr<T, E, F>(
    resultat: Result<T, E>,
    fn: (erreur: E) => F
  ): Result<T, F> {
    if (!resultat.ok) {
      return err(fn(resultat.erreur));
    }
    return resultat;
  }

  /**
   * Extrait la valeur ou retourne une valeur par defaut
   */
  export function unwrapOr<T, E>(resultat: Result<T, E>, defaut: T): T {
    return resultat.ok ? resultat.valeur : defaut;
  }

  /**
   * Extrait la valeur ou lance l'erreur
   * @throws L'erreur contenue dans le Result
   */
  export function unwrap<T, E>(resultat: Result<T, E>): T {
    if (resultat.ok) {
      return resultat.valeur;
    }
    throw resultat.erreur;
  }

  /**
   * Capture une fonction qui peut lancer une exception
   * et la convertit en Result
   */
  export function capturer<T>(fn: () => T): Result<T, Error> {
    try {
      return ok(fn());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Version asynchrone de capturer
   */
  export async function capturerAsync<T>(
    fn: () => Promise<T>
  ): Promise<Result<T, Error>> {
    try {
      return ok(await fn());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Combine plusieurs Results en un seul
   * Si tous sont ok, retourne un tableau de valeurs
   * Si un est err, retourne la premiere erreur
   */
  export function tous<T, E>(
    resultats: readonly Result<T, E>[]
  ): Result<T[], E> {
    const valeurs: T[] = [];
    for (const r of resultats) {
      if (!r.ok) return r;
      valeurs.push(r.valeur);
    }
    return ok(valeurs);
  }

  /**
   * Verifie si un Result est ok (type guard)
   */
  export function estOk<T, E>(
    resultat: Result<T, E>
  ): resultat is { readonly ok: true; readonly valeur: T } {
    return resultat.ok;
  }

  /**
   * Verifie si un Result est err (type guard)
   */
  export function estErr<T, E>(
    resultat: Result<T, E>
  ): resultat is { readonly ok: false; readonly erreur: E } {
    return !resultat.ok;
  }
}
```

---

## Module 3 : EventEmitter type-safe

```typescript
// src/event-emitter.ts

/**
 * Type de base pour une carte d'evenements.
 * Chaque cle est un nom d'evenement, chaque valeur est le type du payload.
 */
export type CarteEvenements = Record<string, unknown>;

/**
 * Type d'un ecouteur d'evenement
 */
type Ecouteur<T> = (payload: T) => void;

/**
 * EventEmitter generique et entierement type-safe.
 *
 * @typeParam E - Carte des evenements (nom -> type payload)
 *
 * @example
 * ```typescript
 * interface MesEvenements {
 *   "click": { x: number; y: number };
 *   "resize": { largeur: number; hauteur: number };
 * }
 *
 * const emetteur = new EventEmitter<MesEvenements>();
 * emetteur.on("click", (e) => console.log(e.x, e.y));
 * emetteur.emit("click", { x: 10, y: 20 });
 * ```
 */
export class EventEmitter<E extends CarteEvenements> {
  /** Map interne des ecouteurs */
  private _ecouteurs = new Map<keyof E, Set<Ecouteur<unknown>>>();

  /** Compteur d'evenements emis (utile pour le debugging) */
  private _compteurEmissions = 0;

  /**
   * Enregistre un ecouteur pour un evenement.
   * @param evenement - Nom de l'evenement
   * @param ecouteur - Fonction appelee quand l'evenement est emis
   * @returns Fonction de desinscription
   */
  on<K extends keyof E & string>(
    evenement: K,
    ecouteur: Ecouteur<E[K]>
  ): () => void {
    if (!this._ecouteurs.has(evenement)) {
      this._ecouteurs.set(evenement, new Set());
    }

    const set = this._ecouteurs.get(evenement)!;
    const typedEcouteur = ecouteur as Ecouteur<unknown>;
    set.add(typedEcouteur);

    // Retourner la fonction de desinscription
    return () => {
      set.delete(typedEcouteur);
      if (set.size === 0) {
        this._ecouteurs.delete(evenement);
      }
    };
  }

  /**
   * Enregistre un ecouteur qui sera appele UNE SEULE FOIS.
   * @param evenement - Nom de l'evenement
   * @param ecouteur - Fonction appelee une seule fois
   * @returns Fonction de desinscription (au cas ou)
   */
  once<K extends keyof E & string>(
    evenement: K,
    ecouteur: Ecouteur<E[K]>
  ): () => void {
    const desinscrire = this.on(evenement, ((payload: E[K]) => {
      desinscrire();
      ecouteur(payload);
    }) as Ecouteur<E[K]>);
    return desinscrire;
  }

  /**
   * Emet un evenement avec un payload type.
   * @param evenement - Nom de l'evenement
   * @param payload - Donnees de l'evenement (type verifie)
   */
  emit<K extends keyof E & string>(evenement: K, payload: E[K]): void {
    this._compteurEmissions++;
    const set = this._ecouteurs.get(evenement);
    if (set) {
      // Copier le set pour eviter les problemes si un ecouteur se desinscrit
      for (const ecouteur of [...set]) {
        try {
          ecouteur(payload);
        } catch (erreur) {
          console.error(
            `[EventEmitter] Erreur dans l'ecouteur de "${evenement}":`,
            erreur
          );
        }
      }
    }
  }

  /**
   * Supprime tous les ecouteurs d'un evenement, ou tous les ecouteurs.
   */
  off<K extends keyof E & string>(evenement?: K): void {
    if (evenement) {
      this._ecouteurs.delete(evenement);
    } else {
      this._ecouteurs.clear();
    }
  }

  /**
   * Retourne le nombre d'ecouteurs pour un evenement.
   */
  listenerCount<K extends keyof E & string>(evenement: K): number {
    return this._ecouteurs.get(evenement)?.size ?? 0;
  }

  /**
   * Retourne le nombre total d'emissions depuis la creation.
   */
  get emitCount(): number {
    return this._compteurEmissions;
  }

  /**
   * Attend la prochaine emission d'un evenement (Promise).
   * Utile pour les tests et le code asynchrone.
   */
  waitFor<K extends keyof E & string>(
    evenement: K,
    timeout?: number
  ): Promise<E[K]> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const desinscrire = this.once(evenement, (payload) => {
        if (timer) clearTimeout(timer);
        resolve(payload);
      });

      if (timeout !== undefined) {
        timer = setTimeout(() => {
          desinscrire();
          reject(new Error(`Timeout : evenement "${String(evenement)}" non recu apres ${timeout}ms`));
        }, timeout);
      }
    });
  }
}
```

---

## Module 4 : Conteneur DI type-safe

```typescript
// src/container.ts

import type { ClePropriete } from "./types.js";

/**
 * Definition d'un service dans le conteneur
 */
type DefinitionService<T> = {
  factory: () => T;
  singleton: boolean;
};

/**
 * Conteneur d'injection de dependances type-safe.
 *
 * @typeParam Services - Map des noms de services vers leurs types
 *
 * @example
 * ```typescript
 * interface MesServices {
 *   logger: Logger;
 *   db: Database;
 * }
 *
 * const container = new Container<MesServices>();
 * container.register("logger", () => new ConsoleLogger());
 * const logger = container.resolve("logger"); // Type: Logger
 * ```
 */
export class Container<Services extends Record<string, unknown>> {
  private definitions = new Map<string, DefinitionService<unknown>>();
  private singletons = new Map<string, unknown>();

  /**
   * Enregistre un service avec une factory.
   * Par defaut, le service est un singleton (une seule instance).
   *
   * @param nom - Nom du service
   * @param factory - Fonction qui cree le service
   * @param options - Options (singleton par defaut)
   */
  register<K extends keyof Services & string>(
    nom: K,
    factory: () => Services[K],
    options: { singleton?: boolean } = {}
  ): this {
    this.definitions.set(nom, {
      factory: factory as () => unknown,
      singleton: options.singleton ?? true,
    });
    // Invalider le singleton si on re-enregistre
    this.singletons.delete(nom);
    return this;
  }

  /**
   * Resout un service par son nom.
   * Lance une erreur si le service n'est pas enregistre.
   *
   * @param nom - Nom du service a resoudre
   * @returns L'instance du service
   * @throws Error si le service n'est pas enregistre
   */
  resolve<K extends keyof Services & string>(nom: K): Services[K] {
    // Verifier le cache singleton
    if (this.singletons.has(nom)) {
      return this.singletons.get(nom) as Services[K];
    }

    const definition = this.definitions.get(nom);
    if (!definition) {
      throw new Error(
        `[Container] Service "${nom}" non enregistre. ` +
        `Services disponibles : ${[...this.definitions.keys()].join(", ")}`
      );
    }

    const instance = definition.factory() as Services[K];

    if (definition.singleton) {
      this.singletons.set(nom, instance);
    }

    return instance;
  }

  /**
   * Verifie si un service est enregistre.
   */
  has<K extends keyof Services & string>(nom: K): boolean {
    return this.definitions.has(nom);
  }

  /**
   * Supprime un service du conteneur.
   */
  unregister<K extends keyof Services & string>(nom: K): void {
    this.definitions.delete(nom);
    this.singletons.delete(nom);
  }

  /**
   * Reinitialise completement le conteneur.
   */
  clear(): void {
    this.definitions.clear();
    this.singletons.clear();
  }

  /**
   * Cree un conteneur enfant qui herite des services du parent.
   * Les enregistrements dans l'enfant ne modifient pas le parent.
   */
  createChild(): Container<Services> {
    const enfant = new Container<Services>();
    for (const [nom, def] of this.definitions) {
      enfant.definitions.set(nom, { ...def });
    }
    return enfant;
  }
}
```

---

## Module 5 : pipe & compose

```typescript
// src/pipe.ts

/**
 * Chaine des fonctions de gauche a droite, en passant le resultat
 * de chaque fonction a la suivante.
 *
 * @example
 * ```typescript
 * const résultat = pipe(
 *   "  bonjour  ",
 *   s => s.trim(),
 *   s => s.toUpperCase(),
 *   s => s + " !"
 * );
 * // "BONJOUR !"
 * ```
 */
export function pipe<A>(valeur: A): A;
export function pipe<A, B>(valeur: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C
): C;
export function pipe<A, B, C, D>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): D;
export function pipe<A, B, C, D, E>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E
): E;
export function pipe<A, B, C, D, E, F>(
  valeur: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F
): F;
export function pipe(
  valeur: unknown,
  ...fns: Array<(arg: unknown) => unknown>
): unknown {
  return fns.reduce((acc, fn) => fn(acc), valeur);
}

/**
 * Cree une fonction qui compose des fonctions de gauche a droite.
 * Contrairement a pipe, flow retourne une FONCTION, pas un resultat.
 *
 * @example
 * ```typescript
 * const formater = flow(
 *   (s: string) => s.trim(),
 *   (s) => s.toUpperCase()
 * );
 * formater("  bonjour  "); // "BONJOUR"
 * ```
 */
export function flow<A, B>(fn1: (a: A) => B): (a: A) => B;
export function flow<A, B, C>(
  fn1: (a: A) => B,
  fn2: (b: B) => C
): (a: A) => C;
export function flow<A, B, C, D>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): (a: A) => D;
export function flow<A, B, C, D, E>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E
): (a: A) => E;
export function flow(
  ...fns: Array<(arg: unknown) => unknown>
): (arg: unknown) => unknown {
  return (valeur: unknown) => fns.reduce((acc, fn) => fn(acc), valeur);
}

/**
 * Compose des fonctions de droite a gauche (ordre mathematique).
 *
 * @example
 * ```typescript
 * const formater = compose(
 *   (s: string) => s + "!",   // Executee en dernier
 *   (s: string) => s.toUpperCase(), // Executee en second
 *   (s: string) => s.trim()  // Executee en premier
 * );
 * formater("  bonjour  "); // "BONJOUR!"
 * ```
 */
export function compose<A, B>(fn1: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => C;
export function compose<A, B, C, D>(
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => D;
export function compose<A, B, C, D, E>(
  fn4: (d: D) => E,
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => E;
export function compose(
  ...fns: Array<(arg: unknown) => unknown>
): (arg: unknown) => unknown {
  return (valeur: unknown) => fns.reduceRight((acc, fn) => fn(acc), valeur);
}
```

---

## Module 6 : Schema validation (mini-Zod)

```typescript
// src/schema.ts

import { Result } from "./result.js";

/**
 * Erreur de validation d'un schema
 */
export interface ErreurSchema {
  /** Chemin de la propriete en erreur */
  chemin: string[];
  /** Message d'erreur lisible */
  message: string;
  /** Valeur recue */
  valeurRecue: unknown;
}

/**
 * Interface de base pour tous les schemas
 */
interface SchemaBase<T> {
  /** Parse et valide une valeur inconnue */
  parse(donnees: unknown): Result<T, ErreurSchema[]>;
  /** Verifie si une valeur est valide (sans lancer d'erreur) */
  estValide(donnees: unknown): donnees is T;
}

// --- Schema String ---

class SchemaString implements SchemaBase<string> {
  private contraintes: Array<{
    nom: string;
    test: (val: string) => boolean;
    message: string;
  }> = [];

  parse(donnees: unknown): Result<string, ErreurSchema[]> {
    if (typeof donnees !== "string") {
      return Result.err([{
        chemin: [],
        message: `Attendu string, recu ${typeof donnees}`,
        valeurRecue: donnees,
      }]);
    }

    const erreurs: ErreurSchema[] = [];
    for (const c of this.contraintes) {
      if (!c.test(donnees)) {
        erreurs.push({
          chemin: [],
          message: c.message,
          valeurRecue: donnees,
        });
      }
    }

    return erreurs.length > 0 ? Result.err(erreurs) : Result.ok(donnees);
  }

  estValide(donnees: unknown): donnees is string {
    return this.parse(donnees).ok;
  }

  /** Longueur minimale */
  min(n: number): this {
    this.contraintes.push({
      nom: "min",
      test: (s) => s.length >= n,
      message: `Minimum ${n} caracteres`,
    });
    return this;
  }

  /** Longueur maximale */
  max(n: number): this {
    this.contraintes.push({
      nom: "max",
      test: (s) => s.length <= n,
      message: `Maximum ${n} caracteres`,
    });
    return this;
  }

  /** Doit correspondre a un pattern regex */
  regex(pattern: RegExp, message?: string): this {
    this.contraintes.push({
      nom: "regex",
      test: (s) => pattern.test(s),
      message: message ?? `Ne correspond pas au pattern ${pattern}`,
    });
    return this;
  }

  /** Doit etre un email valide */
  email(): this {
    return this.regex(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Email invalide"
    );
  }
}

// --- Schema Number ---

class SchemaNumber implements SchemaBase<number> {
  private contraintes: Array<{
    nom: string;
    test: (val: number) => boolean;
    message: string;
  }> = [];

  parse(donnees: unknown): Result<number, ErreurSchema[]> {
    if (typeof donnees !== "number" || Number.isNaN(donnees)) {
      return Result.err([{
        chemin: [],
        message: `Attendu number, recu ${typeof donnees}`,
        valeurRecue: donnees,
      }]);
    }

    const erreurs: ErreurSchema[] = [];
    for (const c of this.contraintes) {
      if (!c.test(donnees)) {
        erreurs.push({
          chemin: [],
          message: c.message,
          valeurRecue: donnees,
        });
      }
    }

    return erreurs.length > 0 ? Result.err(erreurs) : Result.ok(donnees);
  }

  estValide(donnees: unknown): donnees is number {
    return this.parse(donnees).ok;
  }

  min(n: number): this {
    this.contraintes.push({
      nom: "min",
      test: (v) => v >= n,
      message: `Doit etre >= ${n}`,
    });
    return this;
  }

  max(n: number): this {
    this.contraintes.push({
      nom: "max",
      test: (v) => v <= n,
      message: `Doit etre <= ${n}`,
    });
    return this;
  }

  /** Doit etre un entier */
  int(): this {
    this.contraintes.push({
      nom: "int",
      test: (v) => Number.isInteger(v),
      message: "Doit etre un entier",
    });
    return this;
  }

  /** Doit etre positif (> 0) */
  positif(): this {
    this.contraintes.push({
      nom: "positif",
      test: (v) => v > 0,
      message: "Doit etre positif",
    });
    return this;
  }
}

// --- Schema Boolean ---

class SchemaBoolean implements SchemaBase<boolean> {
  parse(donnees: unknown): Result<boolean, ErreurSchema[]> {
    if (typeof donnees !== "boolean") {
      return Result.err([{
        chemin: [],
        message: `Attendu boolean, recu ${typeof donnees}`,
        valeurRecue: donnees,
      }]);
    }
    return Result.ok(donnees);
  }

  estValide(donnees: unknown): donnees is boolean {
    return typeof donnees === "boolean";
  }
}

// --- Schema Object ---

type SchemaMap = Record<string, SchemaBase<unknown>>;

/** Infere le type TypeScript a partir d'un schema objet */
type InfererSchema<S extends SchemaMap> = {
  [K in keyof S]: S[K] extends SchemaBase<infer T> ? T : never;
};

class SchemaObject<S extends SchemaMap>
  implements SchemaBase<InfererSchema<S>>
{
  constructor(private forme: S) {}

  parse(donnees: unknown): Result<InfererSchema<S>, ErreurSchema[]> {
    if (typeof donnees !== "object" || donnees === null || Array.isArray(donnees)) {
      return Result.err([{
        chemin: [],
        message: `Attendu object, recu ${typeof donnees}`,
        valeurRecue: donnees,
      }]);
    }

    const obj = donnees as Record<string, unknown>;
    const erreurs: ErreurSchema[] = [];
    const resultat: Record<string, unknown> = {};

    for (const [cle, schema] of Object.entries(this.forme)) {
      const parseResult = schema.parse(obj[cle]);
      if (parseResult.ok) {
        resultat[cle] = parseResult.valeur;
      } else {
        // Ajouter le chemin de la cle a chaque erreur
        for (const err of parseResult.erreur) {
          erreurs.push({
            ...err,
            chemin: [cle, ...err.chemin],
          });
        }
      }
    }

    return erreurs.length > 0
      ? Result.err(erreurs)
      : Result.ok(resultat as InfererSchema<S>);
  }

  estValide(donnees: unknown): donnees is InfererSchema<S> {
    return this.parse(donnees).ok;
  }
}

// --- Schema Array ---

class SchemaArray<T> implements SchemaBase<T[]> {
  constructor(private elementSchema: SchemaBase<T>) {}

  parse(donnees: unknown): Result<T[], ErreurSchema[]> {
    if (!Array.isArray(donnees)) {
      return Result.err([{
        chemin: [],
        message: `Attendu array, recu ${typeof donnees}`,
        valeurRecue: donnees,
      }]);
    }

    const erreurs: ErreurSchema[] = [];
    const resultats: T[] = [];

    for (let i = 0; i < donnees.length; i++) {
      const parseResult = this.elementSchema.parse(donnees[i]);
      if (parseResult.ok) {
        resultats.push(parseResult.valeur);
      } else {
        for (const err of parseResult.erreur) {
          erreurs.push({
            ...err,
            chemin: [String(i), ...err.chemin],
          });
        }
      }
    }

    return erreurs.length > 0
      ? Result.err(erreurs)
      : Result.ok(resultats);
  }

  estValide(donnees: unknown): donnees is T[] {
    return this.parse(donnees).ok;
  }
}

// --- API publique (comme Zod) ---

/**
 * Namespace contenant les constructeurs de schemas.
 * Inspire de Zod, mais simplifie.
 *
 * @example
 * ```typescript
 * const schemaUtilisateur = s.object({
 *   nom: s.string().min(2),
 *   email: s.string().email(),
 *   age: s.number().int().min(0),
 * });
 *
 * const résultat = schemaUtilisateur.parse({ nom: "Alice", email: "a@b.c", age: 30 });
 * ```
 */
export const s = {
  /** Cree un schema pour les chaines de caracteres */
  string: () => new SchemaString(),

  /** Cree un schema pour les nombres */
  number: () => new SchemaNumber(),

  /** Cree un schema pour les booleens */
  boolean: () => new SchemaBoolean(),

  /** Cree un schema pour un objet avec une forme definie */
  object: <S extends SchemaMap>(forme: S) => new SchemaObject(forme),

  /** Cree un schema pour un tableau d'elements */
  array: <T>(elementSchema: SchemaBase<T>) => new SchemaArray(elementSchema),
};

/** Type utilitaire pour extraire le type d'un schema */
export type Inferer<S> = S extends SchemaBase<infer T> ? T : never;
```

---

## Module 7 : Deep merge type-safe

```typescript
// src/deep-merge.ts

/**
 * Type qui represente la fusion profonde de deux objets.
 * Les proprietes de B ecrasent celles de A, sauf si les deux
 * sont des objets, auquel cas la fusion est recursive.
 */
export type DeepMerge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? A[K] extends object
        ? B[K] extends object
          ? A[K] extends Function
            ? B[K]          // Les fonctions ne sont pas fusionnees
            : DeepMerge<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

/**
 * Verifie si une valeur est un objet simple (pas null, pas un tableau,
 * pas une Date, pas une RegExp, etc.)
 */
function estObjetSimple(valeur: unknown): valeur is Record<string, unknown> {
  return (
    typeof valeur === "object" &&
    valeur !== null &&
    !Array.isArray(valeur) &&
    !(valeur instanceof Date) &&
    !(valeur instanceof RegExp) &&
    !(valeur instanceof Map) &&
    !(valeur instanceof Set)
  );
}

/**
 * Fusionne profondement deux objets.
 * Les proprietes de `source` ecrasent celles de `cible`,
 * sauf quand les deux sont des objets, auquel cas la fusion
 * est recursive.
 *
 * @param cible - Objet de base
 * @param source - Objet dont les proprietes sont fusionnees par dessus
 * @returns Un nouvel objet (pas de mutation)
 *
 * @example
 * ```typescript
 * const a = { x: 1, nested: { a: 1, b: 2 } };
 * const b = { x: 2, nested: { b: 3, c: 4 } };
 * deepMerge(a, b);
 * // { x: 2, nested: { a: 1, b: 3, c: 4 } }
 * ```
 */
export function deepMerge<
  A extends Record<string, unknown>,
  B extends Record<string, unknown>
>(cible: A, source: B): DeepMerge<A, B> {
  const resultat: Record<string, unknown> = { ...cible };

  for (const cle of Object.keys(source)) {
    const valeurSource = source[cle];
    const valeurCible = resultat[cle];

    if (estObjetSimple(valeurSource) && estObjetSimple(valeurCible)) {
      // Fusion recursive pour les sous-objets
      resultat[cle] = deepMerge(
        valeurCible as Record<string, unknown>,
        valeurSource as Record<string, unknown>
      );
    } else {
      // Ecrasement pour les valeurs primitives, tableaux, etc.
      resultat[cle] = valeurSource;
    }
  }

  return resultat as DeepMerge<A, B>;
}

/**
 * Fusionne profondement plusieurs objets successivement.
 *
 * @param objets - Liste d'objets a fusionner (le dernier a priorite)
 * @returns Objet fusionne
 */
export function deepMergeAll<T extends Record<string, unknown>>(
  ...objets: T[]
): T {
  if (objets.length === 0) return {} as T;
  return objets.reduce(
    (acc, obj) => deepMerge(acc, obj) as T,
    {} as T
  );
}
```

---

## Module 8 : Path-typed object access

```typescript
// src/path-access.ts

/**
 * Genere toutes les cles de chemin possibles pour un objet.
 * Par exemple, pour { a: { b: { c: number } } },
 * les chemins sont "a" | "a.b" | "a.b.c"
 */
export type Chemins<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]:
        | `${Prefix}${K}`
        | Chemins<T[K], `${Prefix}${K}.`>;
    }[keyof T & string]
  : never;

/**
 * Obtient le type d'une propriete a partir d'un chemin.
 * Par exemple, TypeDepuisChemin<{ a: { b: number } }, "a.b"> = number
 */
export type TypeDepuisChemin<
  T,
  Chemin extends string
> = Chemin extends `${infer K}.${infer Reste}`
  ? K extends keyof T
    ? TypeDepuisChemin<T[K], Reste>
    : never
  : Chemin extends keyof T
    ? T[Chemin]
    : never;

/**
 * Obtient une valeur profondement imbriquee dans un objet
 * en utilisant un chemin type (ex: "a.b.c").
 *
 * @param obj - L'objet source
 * @param chemin - Le chemin de la propriete (ex: "config.serveur.port")
 * @returns La valeur au chemin specifie, avec le bon type
 *
 * @example
 * ```typescript
 * const config = { serveur: { port: 3000, host: "localhost" } };
 * const port = get(config, "serveur.port"); // Type: number, valeur: 3000
 * ```
 */
export function get<T extends Record<string, unknown>, C extends Chemins<T>>(
  obj: T,
  chemin: C
): TypeDepuisChemin<T, C> {
  const segments = (chemin as string).split(".");
  let courant: unknown = obj;

  for (const segment of segments) {
    if (courant === null || courant === undefined) {
      return undefined as TypeDepuisChemin<T, C>;
    }
    courant = (courant as Record<string, unknown>)[segment];
  }

  return courant as TypeDepuisChemin<T, C>;
}

/**
 * Definit une valeur profondement imbriquee dans un objet
 * en utilisant un chemin type. Retourne un NOUVEAU objet (immutable).
 *
 * @param obj - L'objet source (non modifie)
 * @param chemin - Le chemin de la propriete
 * @param valeur - La nouvelle valeur (type verifie)
 * @returns Un nouvel objet avec la valeur modifiee
 */
export function set<
  T extends Record<string, unknown>,
  C extends Chemins<T>
>(
  obj: T,
  chemin: C,
  valeur: TypeDepuisChemin<T, C>
): T {
  const segments = (chemin as string).split(".");
  const resultat = { ...obj } as Record<string, unknown>;

  if (segments.length === 1) {
    resultat[segments[0]!] = valeur;
    return resultat as T;
  }

  // Reconstruire l'objet de maniere immutable
  let courant = resultat;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    courant[segment] = { ...(courant[segment] as Record<string, unknown>) };
    courant = courant[segment] as Record<string, unknown>;
  }

  courant[segments[segments.length - 1]!] = valeur;
  return resultat as T;
}
```

---

## Module 9 : Point d'entree

```typescript
// src/index.ts

/**
 * @student/ts-toolkit
 *
 * Bibliotheque utilitaire TypeScript type-safe.
 * Fournit des patterns et outils couramment utilises
 * avec une securite de type maximale.
 *
 * @packageDocumentation
 */

// Result monad
export { Result } from "./result.js";
export type { Result as ResultType } from "./result.js";

// EventEmitter type-safe
export { EventEmitter } from "./event-emitter.js";
export type { CarteEvenements } from "./event-emitter.js";

// Conteneur DI
export { Container } from "./container.js";

// Composition de fonctions
export { pipe, flow, compose } from "./pipe.js";

// Validation de schemas
export { s } from "./schema.js";
export type { ErreurSchema, Inferer } from "./schema.js";

// Deep merge
export { deepMerge, deepMergeAll } from "./deep-merge.js";
export type { DeepMerge } from "./deep-merge.js";

// Path access
export { get, set } from "./path-access.js";
export type { Chemins, TypeDepuisChemin } from "./path-access.js";

// Types utilitaires
export type {
  DeepReadonly,
  DeepPartial,
  DeepRequired,
  EstNever,
  SontIdentiques,
} from "./types.js";
```

---

## Tests avec Vitest

### Tests du Result

```typescript
// tests/result.test.ts

import { describe, it, expect } from "vitest";
import { Result } from "../src/result.js";

describe("Result", () => {
  describe("ok / err", () => {
    it("cree un resultat de succes", () => {
      const r = Result.ok(42);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.valeur).toBe(42);
      }
    });

    it("cree un resultat d'erreur", () => {
      const r = Result.err("echec");
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.erreur).toBe("echec");
      }
    });
  });

  describe("map", () => {
    it("transforme la valeur d'un succes", () => {
      const r = Result.map(Result.ok(5), (n) => n * 2);
      expect(r).toEqual({ ok: true, valeur: 10 });
    });

    it("ne transforme pas une erreur", () => {
      const r = Result.map(Result.err("oops"), (n: number) => n * 2);
      expect(r).toEqual({ ok: false, erreur: "oops" });
    });
  });

  describe("flatMap", () => {
    it("chaine les Results de succes", () => {
      const diviser = (a: number, b: number): Result<number, string> =>
        b === 0 ? Result.err("division par zero") : Result.ok(a / b);

      const r = Result.flatMap(Result.ok(10), (n) => diviser(n, 2));
      expect(r).toEqual({ ok: true, valeur: 5 });
    });

    it("propage la premiere erreur", () => {
      const r = Result.flatMap(Result.ok(10), (n) =>
        Result.err("erreur calculee")
      );
      expect(r).toEqual({ ok: false, erreur: "erreur calculee" });
    });
  });

  describe("unwrapOr", () => {
    it("retourne la valeur si succes", () => {
      expect(Result.unwrapOr(Result.ok(42), 0)).toBe(42);
    });

    it("retourne le defaut si erreur", () => {
      expect(Result.unwrapOr(Result.err("oops"), 0)).toBe(0);
    });
  });

  describe("capturer", () => {
    it("capture une valeur normale", () => {
      const r = Result.capturer(() => JSON.parse('{"a":1}'));
      expect(r.ok).toBe(true);
    });

    it("capture une exception", () => {
      const r = Result.capturer(() => JSON.parse("{invalid}"));
      expect(r.ok).toBe(false);
    });
  });

  describe("tous", () => {
    it("combine des succes en un tableau", () => {
      const resultats = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const r = Result.tous(resultats);
      expect(r).toEqual({ ok: true, valeur: [1, 2, 3] });
    });

    it("retourne la premiere erreur", () => {
      const resultats = [
        Result.ok(1),
        Result.err("erreur"),
        Result.ok(3),
      ];
      const r = Result.tous(resultats);
      expect(r).toEqual({ ok: false, erreur: "erreur" });
    });
  });
});
```

### Tests de l'EventEmitter

```typescript
// tests/event-emitter.test.ts

import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "../src/event-emitter.js";

interface EvenementsTest {
  "message": { texte: string };
  "compteur": { valeur: number };
  "vide": undefined;
}

describe("EventEmitter", () => {
  it("emet et recoit un evenement", () => {
    const emetteur = new EventEmitter<EvenementsTest>();
    const callback = vi.fn();

    emetteur.on("message", callback);
    emetteur.emit("message", { texte: "bonjour" });

    expect(callback).toHaveBeenCalledWith({ texte: "bonjour" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("gere plusieurs ecouteurs", () => {
    const emetteur = new EventEmitter<EvenementsTest>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    emetteur.on("compteur", cb1);
    emetteur.on("compteur", cb2);
    emetteur.emit("compteur", { valeur: 42 });

    expect(cb1).toHaveBeenCalledWith({ valeur: 42 });
    expect(cb2).toHaveBeenCalledWith({ valeur: 42 });
  });

  it("permet de se desinscrire", () => {
    const emetteur = new EventEmitter<EvenementsTest>();
    const callback = vi.fn();

    const desinscrire = emetteur.on("message", callback);
    desinscrire();
    emetteur.emit("message", { texte: "ignore" });

    expect(callback).not.toHaveBeenCalled();
  });

  it("once n'appelle le callback qu'une fois", () => {
    const emetteur = new EventEmitter<EvenementsTest>();
    const callback = vi.fn();

    emetteur.once("message", callback);
    emetteur.emit("message", { texte: "premier" });
    emetteur.emit("message", { texte: "second" });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ texte: "premier" });
  });

  it("off supprime les ecouteurs", () => {
    const emetteur = new EventEmitter<EvenementsTest>();
    const callback = vi.fn();

    emetteur.on("message", callback);
    emetteur.off("message");
    emetteur.emit("message", { texte: "ignore" });

    expect(callback).not.toHaveBeenCalled();
  });

  it("compte les ecouteurs", () => {
    const emetteur = new EventEmitter<EvenementsTest>();

    expect(emetteur.listenerCount("message")).toBe(0);

    const d1 = emetteur.on("message", () => {});
    const d2 = emetteur.on("message", () => {});

    expect(emetteur.listenerCount("message")).toBe(2);

    d1();
    expect(emetteur.listenerCount("message")).toBe(1);
  });

  it("waitFor resout la promesse au prochain emit", async () => {
    const emetteur = new EventEmitter<EvenementsTest>();

    // Emettre apres un petit delai
    setTimeout(() => emetteur.emit("message", { texte: "async" }), 10);

    const payload = await emetteur.waitFor("message", 1000);
    expect(payload).toEqual({ texte: "async" });
  });
});
```

### Tests du Schema

```typescript
// tests/schema.test.ts

import { describe, it, expect } from "vitest";
import { s } from "../src/schema.js";

describe("Schema", () => {
  describe("string", () => {
    it("valide une chaine", () => {
      const schema = s.string();
      expect(schema.parse("bonjour").ok).toBe(true);
    });

    it("rejette un non-string", () => {
      const schema = s.string();
      expect(schema.parse(42).ok).toBe(false);
    });

    it("valide min/max", () => {
      const schema = s.string().min(3).max(10);
      expect(schema.parse("ab").ok).toBe(false);
      expect(schema.parse("abc").ok).toBe(true);
      expect(schema.parse("abcdefghijk").ok).toBe(false);
    });

    it("valide un email", () => {
      const schema = s.string().email();
      expect(schema.parse("test@test.fr").ok).toBe(true);
      expect(schema.parse("invalide").ok).toBe(false);
    });
  });

  describe("number", () => {
    it("valide un nombre", () => {
      const schema = s.number();
      expect(schema.parse(42).ok).toBe(true);
      expect(schema.parse("42").ok).toBe(false);
      expect(schema.parse(NaN).ok).toBe(false);
    });

    it("valide les contraintes", () => {
      const schema = s.number().int().min(0).max(100);
      expect(schema.parse(50).ok).toBe(true);
      expect(schema.parse(-1).ok).toBe(false);
      expect(schema.parse(3.14).ok).toBe(false);
    });
  });

  describe("object", () => {
    it("valide un objet complet", () => {
      const schema = s.object({
        nom: s.string().min(1),
        age: s.number().int().min(0),
        actif: s.boolean(),
      });

      const resultat = schema.parse({
        nom: "Alice",
        age: 30,
        actif: true,
      });

      expect(resultat.ok).toBe(true);
      if (resultat.ok) {
        expect(resultat.valeur.nom).toBe("Alice");
        expect(resultat.valeur.age).toBe(30);
      }
    });

    it("retourne des erreurs detaillees", () => {
      const schema = s.object({
        nom: s.string(),
        age: s.number(),
      });

      const resultat = schema.parse({ nom: 123, age: "trente" });
      expect(resultat.ok).toBe(false);
      if (!resultat.ok) {
        expect(resultat.erreur.length).toBe(2);
        expect(resultat.erreur[0]?.chemin).toEqual(["nom"]);
        expect(resultat.erreur[1]?.chemin).toEqual(["age"]);
      }
    });
  });

  describe("array", () => {
    it("valide un tableau", () => {
      const schema = s.array(s.number());
      expect(schema.parse([1, 2, 3]).ok).toBe(true);
      expect(schema.parse([1, "a", 3]).ok).toBe(false);
      expect(schema.parse("pas un tableau").ok).toBe(false);
    });
  });
});
```

---

## Documentation TSDoc

```typescript
// Exemple de documentation TSDoc complete dans les sources

/**
 * Fusionne profondement deux objets de maniere immutable.
 *
 * Les proprietes de `source` ecrasent celles de `cible`, sauf
 * quand les deux valeurs sont des objets simples, auquel cas
 * la fusion est recursive.
 *
 * @typeParam A - Type de l'objet cible
 * @typeParam B - Type de l'objet source
 *
 * @param cible - Objet de base (non modifie)
 * @param source - Objet source dont les proprietes sont fusionnees
 * @returns Un nouvel objet contenant la fusion profonde de A et B
 *
 * @remarks
 * Cette fonction ne mute jamais ses arguments.
 * Les tableaux sont REMPLACES, pas fusionnes element par element.
 * Les instances de Date, RegExp, Map, Set sont traitees comme des
 * valeurs atomiques (remplacement, pas fusion).
 *
 * @example
 * Fusion simple :
 * ```typescript
 * const config = deepMerge(
 *   { port: 3000, db: { host: "localhost" } },
 *   { db: { port: 5432 } }
 * );
 * // { port: 3000, db: { host: "localhost", port: 5432 } }
 * ```
 *
 * @example
 * Les tableaux sont remplaces :
 * ```typescript
 * deepMerge({ tags: ["a", "b"] }, { tags: ["c"] });
 * // { tags: ["c"] }  (pas ["a", "b", "c"])
 * ```
 *
 * @see {@link deepMergeAll} pour fusionner plus de deux objets
 */
```

---

## Build et publication

### Compilation avec tsup

```bash
# Compiler le projet
npx tsup

# Sortie :
# dist/
#   index.js      <- ESM
#   index.cjs     <- CommonJS
#   index.d.ts    <- Declarations TypeScript
#   index.d.cts   <- Declarations pour CJS

# Verifier la taille du bundle
du -sh dist/
```

### Vérification pre-publication

```bash
# Verifier les types
npx tsc --noEmit

# Lancer les tests
npx vitest run

# Simuler la publication (sans publier)
npm pack --dry-run

# Cela affiche la liste des fichiers qui seraient inclus
# Verifier que seul dist/ et package.json sont presents
```

### Simulation npm pack

```bash
# Creer le tarball sans publier
npm pack

# Le fichier student-ts-toolkit-1.0.0.tgz est cree
# On peut l'installer localement dans un autre projet :
# npm install ../ts-toolkit/student-ts-toolkit-1.0.0.tgz
```

---

## Pratique

### Exercice 1 : Etendre le Schema

Ajoutez les schemas suivants a notre mini-Zod :
- `s.optional()` — rend un schema optionnel (accepte undefined)
- `s.nullable()` — rend un schema nullable (accepte null)
- `s.union()` — union de deux schemas

<details>
<summary>Solution</summary>

```typescript
// Schema Optional
class SchemaOptional<T> implements SchemaBase<T | undefined> {
  constructor(private inner: SchemaBase<T>) {}

  parse(donnees: unknown): Result<T | undefined, ErreurSchema[]> {
    if (donnees === undefined) {
      return Result.ok(undefined);
    }
    return this.inner.parse(donnees);
  }

  estValide(donnees: unknown): donnees is T | undefined {
    return donnees === undefined || this.inner.estValide(donnees);
  }
}

// Schema Nullable
class SchemaNullable<T> implements SchemaBase<T | null> {
  constructor(private inner: SchemaBase<T>) {}

  parse(donnees: unknown): Result<T | null, ErreurSchema[]> {
    if (donnees === null) {
      return Result.ok(null);
    }
    return this.inner.parse(donnees);
  }

  estValide(donnees: unknown): donnees is T | null {
    return donnees === null || this.inner.estValide(donnees);
  }
}

// Schema Union
class SchemaUnion<A, B> implements SchemaBase<A | B> {
  constructor(
    private schemaA: SchemaBase<A>,
    private schemaB: SchemaBase<B>
  ) {}

  parse(donnees: unknown): Result<A | B, ErreurSchema[]> {
    const resultatA = this.schemaA.parse(donnees);
    if (resultatA.ok) return resultatA;

    const resultatB = this.schemaB.parse(donnees);
    if (resultatB.ok) return resultatB;

    return Result.err([{
      chemin: [],
      message: "Aucun schema de l'union ne correspond",
      valeurRecue: donnees,
    }]);
  }

  estValide(donnees: unknown): donnees is A | B {
    return this.schemaA.estValide(donnees) || this.schemaB.estValide(donnees);
  }
}

// Ajouter a l'API s
const sExtended = {
  ...s,
  optional: <T>(schema: SchemaBase<T>) => new SchemaOptional(schema),
  nullable: <T>(schema: SchemaBase<T>) => new SchemaNullable(schema),
  union: <A, B>(a: SchemaBase<A>, b: SchemaBase<B>) => new SchemaUnion(a, b),
};

// Utilisation
const schema = sExtended.object({
  nom: s.string(),
  surnom: sExtended.optional(s.string()),
  avatar: sExtended.nullable(s.string()),
  id: sExtended.union(s.string(), s.number()),
});
```

</details>

### Exercice 2 : Ajouter un middleware au Container

Ajoutez un système de middleware au conteneur DI pour intercepter les appels :

<details>
<summary>Solution</summary>

```typescript
// Middleware pour le conteneur

type Middleware<T> = (service: T, nom: string) => T;

class ContainerAvecMiddleware<
  Services extends Record<string, unknown>
> extends Container<Services> {
  private middlewares = new Map<string, Array<Middleware<unknown>>>();

  /**
   * Ajoute un middleware qui wrappe un service lors de sa resolution
   */
  useMiddleware<K extends keyof Services & string>(
    nom: K,
    middleware: Middleware<Services[K]>
  ): this {
    if (!this.middlewares.has(nom)) {
      this.middlewares.set(nom, []);
    }
    this.middlewares.get(nom)!.push(middleware as Middleware<unknown>);
    return this;
  }

  override resolve<K extends keyof Services & string>(nom: K): Services[K] {
    let service = super.resolve(nom);

    // Appliquer les middlewares dans l'ordre
    const middlewares = this.middlewares.get(nom) ?? [];
    for (const mw of middlewares) {
      service = mw(service, nom) as Services[K];
    }

    return service;
  }
}

// Exemple : middleware de logging
interface MesServices {
  calculatrice: {
    additionner(a: number, b: number): number;
    soustraire(a: number, b: number): number;
  };
}

const conteneur = new ContainerAvecMiddleware<MesServices>();

conteneur.register("calculatrice", () => ({
  additionner: (a, b) => a + b,
  soustraire: (a, b) => a - b,
}));

// Middleware qui log tous les appels
conteneur.useMiddleware("calculatrice", (service, nom) => {
  return new Proxy(service, {
    get(target, prop) {
      const original = Reflect.get(target, prop);
      if (typeof original === "function") {
        return (...args: unknown[]) => {
          console.log(`[${nom}] ${String(prop)} appele avec`, args);
          const resultat = original.apply(target, args);
          console.log(`[${nom}] ${String(prop)} retourne`, resultat);
          return resultat;
        };
      }
      return original;
    },
  });
});

const calc = conteneur.resolve("calculatrice");
calc.additionner(2, 3); // Log: [calculatrice] additionner appele avec [2, 3]
                          // Log: [calculatrice] additionner retourne 5
```

</details>

### Exercice 3 : Créer un test d'intégration complet

Ecrivez un test qui utilise TOUS les modules ensemble :

<details>
<summary>Solution</summary>

```typescript
// tests/integration.test.ts

import { describe, it, expect } from "vitest";
import { Result } from "../src/result.js";
import { EventEmitter } from "../src/event-emitter.js";
import { Container } from "../src/container.js";
import { pipe } from "../src/pipe.js";
import { s } from "../src/schema.js";
import { deepMerge } from "../src/deep-merge.js";
import { get, set } from "../src/path-access.js";

describe("Integration complete", () => {
  it("pipeline complet : validation, transformation, evenements", () => {
    // 1. Definir le schema de validation
    const schemaUtilisateur = s.object({
      nom: s.string().min(2),
      email: s.string().email(),
      age: s.number().int().min(13),
    });

    // 2. Configurer l'EventEmitter
    interface Evenements {
      "utilisateur:cree": { id: string; nom: string; email: string };
      "erreur:validation": { erreurs: unknown[] };
    }
    const bus = new EventEmitter<Evenements>();

    const evenementsRecus: unknown[] = [];
    bus.on("utilisateur:cree", (e) => evenementsRecus.push(e));
    bus.on("erreur:validation", (e) => evenementsRecus.push(e));

    // 3. Configurer le conteneur DI
    interface Services {
      bus: EventEmitter<Evenements>;
    }
    const conteneur = new Container<Services>();
    conteneur.register("bus", () => bus);

    // 4. Pipeline de traitement
    const donneesEntree = { nom: "  Alice Dupont  ", email: "ALICE@EXEMPLE.FR", age: 30 };

    // Transformer les donnees avec pipe
    const donneesNettoyees = pipe(
      donneesEntree,
      (d) => ({ ...d, nom: d.nom.trim() }),
      (d) => ({ ...d, email: d.email.toLowerCase() })
    );

    // Valider avec le schema
    const resultatValidation = schemaUtilisateur.parse(donneesNettoyees);

    if (resultatValidation.ok) {
      // Deep merge avec un ID genere
      const utilisateur = deepMerge(
        resultatValidation.valeur,
        { id: "usr_001" } as Record<string, unknown>
      );

      // Emettre l'evenement
      const monBus = conteneur.resolve("bus");
      monBus.emit("utilisateur:cree", {
        id: get(utilisateur as Record<string, unknown>, "id" as never) as string,
        nom: resultatValidation.valeur.nom,
        email: resultatValidation.valeur.email,
      });
    }

    // 5. Verifier le resultat
    expect(resultatValidation.ok).toBe(true);
    expect(evenementsRecus).toHaveLength(1);
    expect(evenementsRecus[0]).toEqual({
      id: "usr_001",
      nom: "Alice Dupont",
      email: "alice@exemple.fr",
    });
  });
});
```

</details>

---

## Récapitulatif du projet

| Module            | Fichier              | Lignes | Concepts utilises                       |
|-------------------|----------------------|--------|------------------------------------------|
| Types utilitaires | `types.ts`           | ~50    | Mapped types, conditionals, recursive    |
| Result<T, E>      | `result.ts`          | ~120   | Union discriminee, generics, namespace   |
| EventEmitter      | `event-emitter.ts`   | ~100   | Generics constraints, Map, Promises      |
| Container DI      | `container.ts`       | ~80    | Keyof, mapped types, generics            |
| pipe/compose      | `pipe.ts`            | ~80    | Overloads, type inference chain          |
| Schema            | `schema.ts`          | ~200   | Classes, generics, inference, branded    |
| Deep merge        | `deep-merge.ts`      | ~60    | Recursive types, type guards             |
| Path access       | `path-access.ts`     | ~70    | Template literals, recursive types       |
| **Total**         |                      | ~760   | **Tous les concepts du cours**           |

---

## Pour aller plus loin

Felicitations, vous avez termine le cours TypeScript avance ! Voici des pistes
pour continuer a progresser :

1. **Contribuer a DefinitelyTyped** — Ecrivez des types pour une bibliotheque JS
   que vous utilisez et qui n'a pas de types

2. **Lire le code source de Zod** — Comprendre comment une vraie bibliotheque
   de validation type-safe est construite

3. **Etudier le compilateur TypeScript** — Le code source de `tsc` est lui-même
   écrit en TypeScript et est une mine d'or d'apprentissage

4. **Créer un framework type-safe** — Appliquez les patterns appris pour créer
   un petit framework web ou un ORM type-safe

5. **Suivre le TypeScript Blog** — Les annonces de nouvelles versions expliquent
   les nouvelles fonctionnalites du système de types

Bonne continuation dans votre parcours TypeScript !

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 19 projet final](../screencasts/screencast-19-projet-final.md)
2. **Lab** : [lab-19-projet-final](../labs/lab-19-projet-final/README)
3. **Quiz** : [quiz 19 projet final](../quizzes/quiz-19-projet-final.html)
:::

---

<!-- navigation-inter-cours -->

::: info Cours suivant
Bravo, tu as termine le cours **TypeScript** ! 
Le prochain cours du curriculum est **JS Runtime**.

[Commencer JS Runtime →](../../02-js-runtime/modules/00-prerequis-et-vue-ensemble.md)
:::
