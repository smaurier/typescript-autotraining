---
titre: Décorateurs et metadata — les deux systèmes
cours: 00-typescript
notions: [décorateurs standard TS 5.0 / ECMAScript Stage 3, signature (value context), context.kind, context.addInitializer, absence de décorateur de paramètre en standard, décorateurs legacy experimentalDecorators, emitDecoratorMetadata, reflect-metadata, design paramtypes, incompatibilité entre les deux systèmes, pourquoi NestJS reste sur le legacy]
outcomes: [écrire un décorateur standard de classe/méthode/accessor/field avec la signature (value context), choisir entre le système standard et le système legacy selon le projet, lire et attacher des métadonnées avec reflect-metadata dans le mode legacy]
prerequis: [13-types-recursifs-type-programming]
next: 15-variance-et-soundness
libs: [{ name: typescript, version: "^5" }, { name: "reflect-metadata", version: "latest" }]
tribuzen: décorateurs transverses des services TribuZen — @logged standard sur les méthodes de service, et le pont vers l'injection de dépendances NestJS (@Injectable, reflect-metadata)
last-reviewed: 2026-07
---

# Décorateurs et metadata — les deux systèmes

> **Outcomes — tu sauras FAIRE :** écrire un décorateur standard (Stage 3) de classe, méthode, accessor et field avec la signature `(value, context)` ; choisir entre le système standard et le système legacy selon le projet ; attacher et lire des métadonnées avec `reflect-metadata` dans le mode legacy — le socle de NestJS.
> **Difficulté :** :star::star::star:

> **⚠️ Module ACCURACY-CRITIQUE — checkpoint avant NestJS.** Il existe **deux systèmes de décorateurs distincts et incompatibles** en TypeScript. Les confondre est l'erreur n°1 sur ce sujet. Tout ce module a été vérifié via Context7 sur `/microsoft/typescript` (voir §7 pour les points confirmés). Ne mélange jamais les deux signatures.

## 1. Cas concret d'abord

Tu arrives sur le backend TribuZen. Deux fichiers utilisent des décorateurs, et ils ne se ressemblent pas du tout.

```typescript
// Fichier A — un utilitaire maison dans le monorepo (TS 5, config par défaut)
class RappelService {
  @logged                        // ← décorateur SANS parenthèses, pas de reflect-metadata
  envoyer(rappelId: string) {
    return `rappel ${rappelId} envoyé`;
  }
}

// Fichier B — un service NestJS (config experimentalDecorators)
@Injectable()                    // ← décorateur AVEC parenthèses
class RappelNestService {
  constructor(private readonly repo: RappelRepository) {} // ← type injecté par reflect-metadata
}
```

**Les deux compilent. Mais `@logged` du fichier A, copié tel quel dans un projet NestJS, ne marchera pas — et inversement.** Pourquoi ? Parce que ce sont deux moteurs différents :

- Fichier A = **décorateurs standard** (ECMAScript Stage 3, TS 5.0). Signature `(value, context)`.
- Fichier B = **décorateurs legacy** (`experimentalDecorators` + `emitDecoratorMetadata` + `reflect-metadata`). Signature `(target, key, descriptor)`.

Ce module te fait écrire les deux, comprendre pourquoi ils sont incompatibles, et savoir lequel choisir. C'est le pont direct vers le module 09 du cours NestJS (injection de dépendances).

---

## 2. Théorie complète, concise

### 2.1 Deux systèmes, une seule syntaxe `@`

La syntaxe `@decorateur` est partagée, mais **deux implémentations totalement différentes** se cachent derrière, pilotées par le flag `experimentalDecorators` du `tsconfig.json`.

| | **Standard (Stage 3)** | **Legacy (expérimental)** |
|---|---|---|
| Flag tsconfig | *aucun* (défaut TS 5.0+) | `"experimentalDecorators": true` |
| Origine | Proposition TC39 standardisée | Ancienne proposition (2015) |
| Depuis | TS 5.0 (mars 2023) | TS 1.5, toujours supporté |
| Signature | `(value, context)` | `(target, key, descriptor)` |
| Décorateur de **paramètre** | ❌ **interdit** (erreur TS1206) | ✅ supporté |
| `reflect-metadata` intégré | ❌ non | ✅ via `emitDecoratorMetadata` |
| Utilisé par | nouveaux projets, code applicatif | **NestJS, Angular, TypeORM, class-validator** |

> **Règle de survie :** avant d'écrire un décorateur, regarde le `tsconfig.json`. `experimentalDecorators: true` → legacy. Absent → standard. Cette ligne détermine quelle signature tu dois écrire.

### 2.2 Décorateurs standard — signature `(value, context)`

Un décorateur standard est **une fonction** qui reçoit deux arguments :

1. `value` — la chose décorée (constructeur, méthode, valeur de l'accessor…).
2. `context` — un objet de métadonnées décrivant *quoi* est décoré.

```typescript
// tsconfig : PAS de experimentalDecorators. C'est le mode par défaut en TS 5.
function logged(value: Function, context: ClassMethodDecoratorContext) {
  const nom = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(`[LOG] ${nom}(`, args, `)`);
    return value.apply(this, args);
  };
}
```

Le `context` a une propriété clé, **`context.kind`**, qui vaut `"class" | "method" | "getter" | "setter" | "field" | "accessor"`. Un même décorateur peut brancher selon la cible :

```typescript
function logged(target: any, context: DecoratorContext): any {
  switch (context.kind) {
    case "class":  { /* target = le constructeur */ return target; }
    case "method":
    case "getter":
    case "setter": {
      const nom = context.name.toString();
      return function (this: any, ...args: any[]) {
        return (target as Function).apply(this, args); // wrap
      };
    }
    case "accessor": { /* return { get, set, init } */ }
    case "field":    { /* return (initial) => nouvelleValeur */ }
  }
}
```

**Ce que retourne un décorateur standard dépend de `kind` :**

| `context.kind` | `value` reçu | Retour attendu |
|---|---|---|
| `class` | le constructeur | rien, ou une classe de remplacement |
| `method` | la fonction méthode | rien, ou une fonction de remplacement |
| `getter` / `setter` | la fonction accessor | rien, ou une fonction de remplacement |
| `accessor` | `{ get, set }` | rien, ou `{ get?, set?, init? }` |
| `field` | `undefined` | rien, ou `(valeurInitiale) => nouvelleValeur` |

### 2.3 `context.addInitializer` et `context.name`

Le `context` porte aussi :

- **`context.name`** — le nom de l'élément décoré (`string` ou `symbol`).
- **`context.addInitializer(fn)`** — enregistre une fonction exécutée à l'initialisation (après définition pour les membres statiques, avant les initialiseurs d'instance sinon). C'est le remplacement standard pour « faire quelque chose au moment où la classe/l'instance se construit ».

```typescript
function bound(value: Function, context: ClassMethodDecoratorContext) {
  // Auto-bind d'une méthode sur l'instance, sans toucher au corps.
  context.addInitializer(function (this: any) {
    this[context.name] = value.bind(this);
  });
}
```

### 2.4 Le field decorator retourne un initialiseur

Un décorateur de **field** ne reçoit pas la valeur (elle n'existe pas encore). Il peut retourner une fonction qui **transforme la valeur initiale** :

```typescript
function double(_value: undefined, context: ClassFieldDecoratorContext) {
  return function (valeurInitiale: number) {
    return valeurInitiale * 2; // la valeur affectée au field passe par ici
  };
}

class Compteur {
  @double score = 10; // score vaut 20 à la construction
}
```

Pour **intercepter lecture ET écriture**, on n'utilise pas un field mais un **`accessor`** (nouveau mot-clé) :

```typescript
function positif<T>(
  target: ClassAccessorDecoratorTarget<T, number>,
  context: ClassAccessorDecoratorContext<T, number>,
): ClassAccessorDecoratorResult<T, number> {
  return {
    get() { return target.get.call(this); },
    set(v: number) {
      if (v < 0) throw new RangeError(`${String(context.name)} doit être positif`);
      target.set.call(this, v);
    },
  };
}

class Produit {
  @positif accessor prix = 0; // le mot-clé `accessor` est obligatoire ici
}
```

### 2.5 PAS de décorateur de paramètre en standard

**Le système standard n'a aucun décorateur de paramètre.** Écrire `method(@dec x: any)` en mode standard produit l'erreur **TS1206 « Decorators are not valid here »**.

```typescript
// ❌ Standard : erreur de compilation TS1206
class C {
  method(@dec x: number) {}         // interdit
  constructor(@dec x: number) {}    // interdit
}
```

C'est **la raison technique majeure pour laquelle NestJS reste sur le legacy** : NestJS injecte les dépendances via les paramètres du constructeur (`constructor(private repo: Repo)`) et via `@Param()`, `@Body()`, `@Query()` sur les paramètres de méthode. Sans décorateur de paramètre, tout le modèle NestJS s'effondre. Voir §2.7.

### 2.6 Le système legacy — `reflect-metadata`

Le mode legacy s'active avec deux flags :

```json
// tsconfig.json — mode NestJS / Angular / TypeORM
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

> **Vérifié Context7 :** `emitDecoratorMetadata` **requiert** `experimentalDecorators`. L'activer seul déclenche l'erreur **TS5052**. Les deux flags vont ensemble.

En legacy, la signature est `(target, propertyKey, descriptor)` et on dispose des **décorateurs de paramètre** `(target, propertyKey, parameterIndex)`. Surtout, `emitDecoratorMetadata` fait émettre par TypeScript des **métadonnées de type** lisibles à l'exécution via la lib `reflect-metadata` :

```typescript
import "reflect-metadata"; // à importer UNE fois, au tout premier point d'entrée

@Injectable()
class RappelService {
  constructor(private repo: RappelRepository, private log: Logger) {}
}

// Grâce à emitDecoratorMetadata, TypeScript a émis :
//   Reflect.defineMetadata("design:paramtypes",
//     [RappelRepository, Logger], RappelService);

// Le conteneur DI lit ça pour savoir quoi instancier :
const deps = Reflect.getMetadata("design:paramtypes", RappelService);
// [class RappelRepository, class Logger]  → le conteneur les résout et les injecte
```

Les clés `design:*` émises automatiquement : `design:type` (type d'une propriété), `design:paramtypes` (types des paramètres), `design:returntype` (type de retour). **Elles n'existent QUE en mode legacy avec `emitDecoratorMetadata`.** Le système standard n'émet rien de tel.

### 2.7 Pourquoi NestJS reste legacy (et l'incompatibilité)

Trois raisons cumulées :

1. **Décorateurs de paramètre** — indispensables (`@Param`, `@Body`, injection constructeur). Absents en standard.
2. **`design:paramtypes`** — le conteneur DI lit les types du constructeur à l'exécution. Le standard n'émet aucune métadonnée de type.
3. **Écosystème** — TypeORM, class-validator, class-transformer sont tous en legacy. Migrer NestJS casserait tout l'écosystème.

**Les deux systèmes sont mutuellement exclusifs par fichier de compilation.** Le flag `experimentalDecorators` bascule *tout* le projet dans un mode ou l'autre. Un décorateur écrit pour l'un ne fonctionne pas dans l'autre : les signatures diffèrent (`(value, context)` vs `(target, key, descriptor)`), et une méthode legacy attend `descriptor.value` là où le standard reçoit directement la fonction.

> **En pratique 2026 :** `Symbol.metadata` et `context.metadata` **existent déjà** dans le standard (Stage 3, implémentés en TS 5.2, 2023) — un décorateur standard peut donc attacher des métadonnées via `context.metadata[clé] = …`, lisibles ensuite sur `Classe[Symbol.metadata]`. Ce qui reste **en discussion** à TC39, c'est le **décorateur de paramètre** standard : tant qu'il n'existe pas, NestJS ne peut pas migrer. Écris NestJS en legacy, ton code applicatif neuf en standard, et ne mélange jamais les deux signatures.

---

## 3. Worked examples

### Exemple 1 — `@logged` standard sur une méthode de service (TribuZen)

Objectif : journaliser tous les appels d'une méthode de `RappelService`, sans toucher au corps. Config par défaut TS 5, aucun flag.

```typescript
// src/decorators/logged.ts — décorateur STANDARD (Stage 3)
// Signature imposée : (value, context). value = la méthode, context = métadonnées.
function logged(
  value: (...args: any[]) => any,
  context: ClassMethodDecoratorContext,
) {
  const nom = String(context.name); // context.name = nom de la méthode décorée

  // On RETOURNE une fonction de remplacement (le wrap).
  return function (this: any, ...args: any[]) {
    console.log(`[LOG] → ${nom}(`, args, `)`);
    const resultat = value.apply(this, args); // appelle la méthode d'origine
    console.log(`[LOG] ← ${nom} =`, resultat);
    return resultat;
  };
}

// src/services/rappel.service.ts
class RappelService {
  @logged
  envoyer(rappelId: string): string {
    return `rappel ${rappelId} envoyé`;
  }
}

const s = new RappelService();
s.envoyer("r-42");
// [LOG] → envoyer( [ 'r-42' ] )
// [LOG] ← envoyer = rappel r-42 envoyé
```

**Points à retenir :** pas de parenthèses (`@logged`, pas `@logged()`), signature `(value, context)`, on retourne le wrap. Aucune dépendance à `reflect-metadata`.

### Exemple 2 — la version legacy `@Injectable`-like avec `reflect-metadata`

Objectif : reproduire en miniature ce que fait NestJS — un conteneur DI qui lit les types du constructeur. Config : `experimentalDecorators` + `emitDecoratorMetadata`.

```typescript
// tsconfig.json → "experimentalDecorators": true, "emitDecoratorMetadata": true
import "reflect-metadata"; // OBLIGATOIRE, une seule fois au point d'entrée

// --- Le décorateur (legacy) : marque la classe comme injectable ---
const INJECTABLE = Symbol("injectable");
function Injectable(): ClassDecorator {
  // Signature legacy d'un décorateur de classe : (target) => void
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE, true, target);
  };
}

// --- Les dépendances ---
@Injectable() // ← indispensable : resolve() jette si INJECTABLE absent (résolution récursive)
class RappelRepository {
  findAll() { return ["r-1", "r-2"]; }
}

@Injectable()
class RappelService {
  // emitDecoratorMetadata émet design:paramtypes = [RappelRepository]
  constructor(private readonly repo: RappelRepository) {}
  lister() { return this.repo.findAll(); }
}

// --- Le conteneur DI minimal : lit design:paramtypes et résout récursivement ---
function resolve<T>(cible: new (...a: any[]) => T): T {
  if (!Reflect.getMetadata(INJECTABLE, cible)) {
    throw new Error(`${cible.name} n'est pas @Injectable()`);
  }
  // La métadonnée émise par TypeScript grâce à emitDecoratorMetadata :
  const deps: any[] = Reflect.getMetadata("design:paramtypes", cible) ?? [];
  const args = deps.map((dep) => resolve(dep)); // résolution récursive
  return new cible(...args);
}

const service = resolve(RappelService); // instancie RappelRepository puis l'injecte
console.log(service.lister()); // ["r-1", "r-2"]
```

**Le pont NestJS :** ce `resolve` est exactement l'idée du conteneur NestJS. `@Injectable()` marque la classe, `design:paramtypes` donne la liste des dépendances, le conteneur les instancie et les injecte. Dans le vrai NestJS c'est industrialisé (scopes, modules, providers), mais le mécanisme sous-jacent — `reflect-metadata` + `design:paramtypes` — est celui-ci. → cours NestJS, module 09.

**Fading — compare les deux signatures côte à côte :**

```typescript
// STANDARD (Stage 3)          →  (value, context)
function loggedStd(value: Function, ctx: ClassMethodDecoratorContext) { /* return wrap */ }

// LEGACY (experimental)       →  (target, key, descriptor)
function loggedLegacy(target: any, key: string, desc: PropertyDescriptor) {
  const original = desc.value;                 // en legacy, la méthode est dans desc.value
  desc.value = function (...args: any[]) { return original.apply(this, args); };
}
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Confondre les deux signatures

```typescript
// ❌ Signature legacy écrite dans un projet standard (défaut TS 5)
function logged(target: any, key: string, descriptor: PropertyDescriptor) {
  descriptor.value = descriptor.value; // descriptor est undefined en standard → crash / types faux
}

// ✅ En standard, c'est (value, context)
function logged(value: Function, context: ClassMethodDecoratorContext) { /* ... */ }
```

**Discrimination :** legacy = 3 args `(target, key, descriptor)`, la méthode est dans `descriptor.value`. Standard = 2 args `(value, context)`, la méthode EST `value`. Le flag `experimentalDecorators` décide lequel s'applique.

### PIÈGE #2 — Croire que `reflect-metadata` marche en standard

```typescript
// ❌ Mode standard, sans experimentalDecorators
@Injectable()
class Service { constructor(private repo: Repo) {} }
Reflect.getMetadata("design:paramtypes", Service); // undefined !
```

`design:paramtypes` n'est émis QUE par `emitDecoratorMetadata`, qui **exige** `experimentalDecorators` (sinon erreur TS5052). En standard, aucune métadonnée de type n'existe. **C'est pour ça que NestJS ne peut pas passer en standard sans réécrire son conteneur.**

### PIÈGE #3 — Oublier `import "reflect-metadata"`

```typescript
// ❌ emitDecoratorMetadata activé mais lib jamais importée
@Injectable() class Service {}
Reflect.getMetadata("design:paramtypes", Service); // TypeError: Reflect.getMetadata is not a function
```

`reflect-metadata` **patche l'objet global `Reflect`**. Il faut l'importer **une seule fois, en tout premier** dans le point d'entrée (`main.ts`). NestJS le fait pour toi via `@nestjs/core`.

### PIÈGE #4 — Vouloir un décorateur de paramètre en standard

```typescript
// ❌ Standard : erreur TS1206 "Decorators are not valid here"
class Controller {
  handle(@Body() dto: Dto) {}       // interdit en standard
}
```

Il n'y a **pas** de décorateur de paramètre standard. Si tu vois `@Param()`, `@Body()`, `@Inject()` sur des paramètres, tu es forcément dans un projet legacy (`experimentalDecorators: true`).

### PIÈGE #5 — Field vs accessor pour intercepter une écriture

```typescript
// ❌ Un décorateur de FIELD ne peut pas intercepter les écritures futures
function positif(_v: undefined, ctx: ClassFieldDecoratorContext) {
  return (init: number) => init; // ne voit QUE la valeur initiale, pas les set suivants
}
class P { @positif prix = 0; }
// p.prix = -5 → aucune validation

// ✅ Utiliser `accessor` pour intercepter get ET set
class P2 { @positifAccessor accessor prix = 0; } // set validé à chaque écriture
```

Field decorator = transforme la valeur **initiale** uniquement. Pour valider chaque écriture, il faut le mot-clé `accessor` et retourner `{ get, set }`.

---

## 5. Ancrage TribuZen

Le backend TribuZen tourne sur **NestJS** — donc en **mode legacy** (`experimentalDecorators` + `emitDecoratorMetadata`, `reflect-metadata` importé par le framework). Les décorateurs y sont partout :

- **`@Injectable()`** sur chaque service (`RappelService`, `TribuService`, `NotificationService`) — le conteneur lit `design:paramtypes` pour injecter les dépendances du constructeur. C'est l'Exemple 2, en vrai.
- **`@Controller('rappels')`, `@Get()`, `@Post()`, `@Param('id')`, `@Body()`** — routage HTTP + injection de paramètres (décorateurs de paramètre, donc legacy obligatoire).
- **`@Entity()`, `@Column()`, `@OneToMany()`** (TypeORM) sur les entités `Tribu`, `Membre`, `Rappel` — mapping ORM par métadonnées.
- **`@IsEmail()`, `@MinLength()`** (class-validator) sur les DTO d'inscription — validation par métadonnées.

À côté, le **code applicatif transverse maison** (helpers hors framework, scripts) utilise des **décorateurs standard** : un `@logged` (Exemple 1) sur les méthodes de service qu'on veut tracer en dev, un `@measure` pour le temps d'exécution. Pas de `reflect-metadata`, juste `(value, context)`.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen-api/src/
  rappels/
    rappel.service.ts        # @Injectable() — legacy, DI par design:paramtypes
    rappel.controller.ts     # @Controller @Get @Post @Param @Body — legacy
    dto/creer-rappel.dto.ts  # @IsString @MinLength — class-validator, legacy
  common/decorators/
    logged.decorator.ts      # @logged — STANDARD (value, context), usage dev
  main.ts                    # import "reflect-metadata" en première ligne
```

> **Le pont explicite :** l'Exemple 2 de ce module *est* le cœur de l'injection de dépendances NestJS. Quand tu arriveras au module 09 du cours NestJS, tu retrouveras `@Injectable()` + `reflect-metadata` + `design:paramtypes` — tu sauras déjà ce qui se passe sous le capot.

---

## 6. Points clés

1. Deux systèmes derrière la syntaxe `@` : **standard** (Stage 3, TS 5.0, défaut) et **legacy** (`experimentalDecorators`). Le flag tsconfig décide lequel.
2. Décorateur **standard** : signature `(value, context)`, `context.kind` ∈ {class, method, getter, setter, field, accessor}, `context.name`, `context.addInitializer`.
3. Ce qu'on **retourne** dépend de `kind` : wrap pour method/getter/setter, `{get,set}` pour accessor, `(init) => valeur` pour field, classe pour class.
4. Le standard n'a **AUCUN décorateur de paramètre** — erreur TS1206.
5. Décorateur **legacy** : signature `(target, key, descriptor)`, la méthode est dans `descriptor.value`, décorateurs de paramètre autorisés.
6. **`emitDecoratorMetadata` exige `experimentalDecorators`** (sinon TS5052) et émet `design:type` / `design:paramtypes` / `design:returntype`, lisibles via `reflect-metadata`.
7. **NestJS reste legacy** : il lui faut les décorateurs de paramètre (injection) et `design:paramtypes` (types du constructeur). Le standard n'offre ni l'un ni l'autre.
8. `import "reflect-metadata"` une seule fois au point d'entrée — la lib patche l'objet global `Reflect`.
9. Les deux systèmes sont **mutuellement exclusifs** par compilation ; un décorateur écrit pour l'un ne marche pas dans l'autre.

---

## 7. Seeds Anki

```
Quels sont les deux systèmes de décorateurs en TypeScript et qu'est-ce qui les distingue au niveau tsconfig ?|Standard (Stage 3, TS 5.0, aucun flag — mode par défaut) et legacy (experimental, "experimentalDecorators": true). Le flag experimentalDecorators bascule tout le projet dans l'un ou l'autre.
Quelle est la signature d'un décorateur standard (Stage 3) ?|(value, context) — value = la chose décorée (constructeur, méthode…), context = métadonnées avec context.kind, context.name et context.addInitializer.
Quelles valeurs peut prendre context.kind pour un décorateur standard ?|"class", "method", "getter", "setter", "field" ou "accessor".
Peut-on écrire un décorateur de paramètre en mode standard (Stage 3) ?|Non. Le système standard n'a aucun décorateur de paramètre : @dec sur un paramètre déclenche l'erreur TS1206. Seul le mode legacy les supporte.
Que faut-il pour que design:paramtypes soit disponible à l'exécution, et via quelle lib le lit-on ?|Il faut "emitDecoratorMetadata": true (qui exige "experimentalDecorators": true, sinon TS5052) et importer "reflect-metadata". On lit alors Reflect.getMetadata("design:paramtypes", Classe).
Pourquoi NestJS reste-t-il sur les décorateurs legacy ?|Parce qu'il a besoin (1) des décorateurs de paramètre (injection constructeur, @Param/@Body) absents en standard, et (2) de design:paramtypes émis par emitDecoratorMetadata pour connaître les types du constructeur à l'exécution — le standard n'émet aucune métadonnée de type.
Quelle est la différence de signature entre un décorateur de méthode standard et legacy ?|Standard : (value, context) où value EST la méthode. Legacy : (target, key, descriptor) où la méthode est dans descriptor.value. Ils sont incompatibles.
Comment un décorateur de field standard transforme-t-il une valeur, et comment intercepter les écritures futures ?|Un field decorator retourne (valeurInitiale) => nouvelleValeur — il ne voit que la valeur initiale. Pour intercepter get ET set à chaque écriture, il faut le mot-clé accessor et retourner { get, set }.
À quoi sert context.addInitializer dans un décorateur standard ?|À enregistrer une fonction exécutée à l'initialisation (après définition pour les membres statiques, avant les initialiseurs d'instance sinon) — ex. auto-bind d'une méthode sur l'instance.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-14-decorateurs/README.md`. Écrire un `@logged` standard `(value, context)` sur un service, puis reconstruire un mini-conteneur DI legacy avec `reflect-metadata` et `design:paramtypes` — le cœur de NestJS.
