---
titre: Classes et héritage
cours: 00-typescript
notions: [champs de classe, modificateurs public/private/protected, "#private JS vs private TS", readonly, paramètres de propriété, accesseurs get/set, membres static, héritage extends/super, classes abstraites, implements interface, type this polymorphique]
outcomes: [modéliser une entité avec champs typés et bonne visibilité, choisir entre "#private JS" et private TS en connaissance de cause, construire une hiérarchie abstract/extends propre et un contrat implements]
prerequis: [04-unions-intersections-narrowing]
next: 06-generics-fondamentaux
libs: [{ name: typescript, version: "^5" }]
tribuzen: entités du domaine TribuZen — BaseEntity abstraite, Member et Family qui en héritent, contrat Serializable
last-reviewed: 2026-07
---

# Classes et héritage

> **Outcomes — tu sauras FAIRE :** modéliser une entité TribuZen avec champs typés et visibilité correcte, choisir entre `#private` (JS) et `private` (TS) en connaissance de cause, construire une hiérarchie `abstract`/`extends` propre avec un contrat `implements`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu reprends le modèle de données de l'admin TribuZen. Un collègue a écrit deux entités « à la main », sans classe, en dupliquant partout la même plomberie :

```typescript
// domain/member.ts — AVANT
interface MemberData {
  id: string;
  createdAt: string;
  name: string;
  email: string;
}

function makeMember(name: string, email: string): MemberData {
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), name, email };
}

// domain/family.ts — AVANT (copier-coller de la plomberie id + createdAt)
interface FamilyData {
  id: string;
  createdAt: string;
  label: string;
}

function makeFamily(label: string): FamilyData {
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), label };
}
```

**Trois problèmes immédiats :**

1. `id` et `createdAt` sont recopiés dans chaque entité — rien ne garantit qu'ils restent cohérents (l'un met `createdAt` en `Date`, l'autre en `string`).
2. Rien n'empêche un `member.id = "hack"` plus loin dans le code — ces champs devraient être **en lecture seule** après création.
3. Il n'y a aucun **contrat commun** : impossible d'écrire une fonction `save(entity)` qui accepte n'importe quelle entité sérialisable sans dupliquer les types.

Ce module te donne les classes TypeScript pour régler ça : une base commune (`abstract class BaseEntity`), des champs `readonly`, une visibilité maîtrisée, et un contrat `implements Serializable`.

---

## 2. Théorie complète, concise

### 2.1 Champ, constructeur, méthode

Une classe est un **plan** : elle déclare des champs (l'état), un constructeur (l'initialisation) et des méthodes (le comportement). On crée une **instance** avec `new`.

```typescript
class Member {
  // Champs : doivent être déclarés ET initialisés (déclaration ou constructeur)
  name: string;
  email: string;

  constructor(name: string, email: string) {
    this.name = name;   // `this` = l'instance en cours de création
    this.email = email;
  }

  // Méthode
  greeting(): string {
    return `Bonjour ${this.name}`;
  }
}

const alice = new Member("Alice", "alice@tribuzen.app");
console.log(alice.greeting()); // "Bonjour Alice"
```

> En mode `strict` (`strictPropertyInitialization`), TypeScript **refuse** un champ non optionnel qui n'est jamais initialisé. Soit tu l'initialises, soit tu le marques `?` (optionnel), soit tu utilises l'assertion `name!: string` (à éviter).

### 2.2 Modificateurs de visibilité TS : public / private / protected

TypeScript ajoute trois modificateurs qui contrôlent **qui peut accéder** à un membre. Ce sont des règles **de compilation** — ils n'existent pas à l'exécution (voir 2.4).

| Modificateur | Dans la classe | Sous-classe | Extérieur |
|---|---|---|---|
| `public` (défaut) | oui | oui | oui |
| `protected` | oui | oui | **non** |
| `private` (TS) | oui | **non** | **non** |

```typescript
class Account {
  public label: string;        // accessible partout (public est implicite)
  protected balance: number;   // classe + sous-classes
  private pin: string;         // classe uniquement

  constructor(label: string, balance: number, pin: string) {
    this.label = label;
    this.balance = balance;
    this.pin = pin;
  }

  private check(pin: string): boolean {
    return this.pin === pin;   // OK : accès interne
  }
}

const a = new Account("Courant", 100, "0000");
// a.balance;  // ❌ erreur TS : 'balance' est protected
// a.pin;      // ❌ erreur TS : 'pin' est private
```

### 2.3 `readonly`

`readonly` autorise l'affectation **une seule fois** (déclaration ou constructeur), puis fige le champ. C'est une garantie de compilation, pas un gel runtime.

```typescript
class Entity {
  readonly id: string;

  constructor(id: string) {
    this.id = id;        // OK : affectation dans le constructeur
  }

  rename(id: string) {
    // this.id = id;     // ❌ erreur TS : Cannot assign to 'id' (read-only)
  }
}
```

On combine visibilité + `readonly` : `public readonly id`, `private readonly secret`, etc.

### 2.4 `#private` (JS natif) vs `private` (TS) — la distinction clé

Ce sont **deux mécanismes différents** qui portent le même nom courant.

```typescript
class Demo {
  private tsSecret = "ts";    // privé TS
  #jsSecret = "js";           // privé JS natif (champ de classe ECMAScript)

  reveal() {
    return `${this.tsSecret} / ${this.#jsSecret}`;
  }
}
```

| | `private` (TS) | `#private` (JS) |
|---|---|---|
| Nature | annotation TypeScript | syntaxe JavaScript réelle |
| Vérifié à | la **compilation** seulement | la **compilation ET l'exécution** |
| Présent dans le JS émis | non — **effacé** au build | oui — reste dans le `.js` |
| Contournable à l'exécution | oui : `(obj as any).tsSecret` | **non** : erreur `SyntaxError` / `TypeError` |
| Visible via `Object.keys` / JSON | oui | **non** (jamais énumérable) |
| Accès syntaxe | `this.tsSecret` | `this.#jsSecret` (le `#` fait partie du nom) |

```typescript
const d = new Demo();
console.log((d as any).tsSecret); // "ts" — private TS contournable au runtime
// console.log((d as any).#jsSecret); // ❌ SyntaxError : le # n'est accessible que dans la classe
console.log(JSON.stringify(d));   // {"tsSecret":"ts"} — le #jsSecret n'apparaît pas
```

**Règle de choix :** utilise `#private` quand tu veux une confidentialité **réelle** (un secret, un token, un invariant qui ne doit jamais fuiter, même via `as any` ou une sérialisation accidentelle). Utilise `private` (TS) pour le confort d'encapsulation quotidien, quand l'interop avec du code JS non typé ou le coût runtime importent peu.

### 2.5 Paramètres de propriété (constructor shorthand)

Raccourci propre à TypeScript : mettre un modificateur (`public`/`private`/`protected`/`readonly`) **sur un paramètre du constructeur** déclare ET initialise le champ automatiquement.

```typescript
// Sans shorthand (verbeux)
class MemberLong {
  public readonly id: string;
  private email: string;
  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }
}

// Avec paramètres de propriété (équivalent, concis)
class MemberShort {
  constructor(
    public readonly id: string,
    private email: string,
  ) {}   // corps vide : TS génère this.id = id ; this.email = email
}
```

> Un paramètre **sans** modificateur reste un simple argument local, PAS un champ. `constructor(name: string)` sans `public` → `this.name` n'existe pas.

### 2.6 Accesseurs `get` / `set`

Un accesseur expose un champ comme une propriété, mais avec de la logique à la lecture/écriture. Un `get` sans `set` = propriété calculée en lecture seule.

```typescript
class Temperature {
  #celsius: number;

  constructor(celsius: number) {
    this.#celsius = celsius;
  }

  get celsius(): number {
    return this.#celsius;          // lecture : temp.celsius
  }

  set celsius(value: number) {
    if (value < -273.15) throw new RangeError("sous le zéro absolu");
    this.#celsius = value;         // écriture : temp.celsius = 20
  }

  get fahrenheit(): number {       // getter seul → lecture seule
    return this.#celsius * 9 / 5 + 32;
  }
}

const t = new Temperature(20);
t.celsius = 25;              // passe par le setter (validation)
console.log(t.fahrenheit);  // 77 — calculé, pas de setter
// t.fahrenheit = 100;      // ❌ erreur : pas de setter
```

### 2.7 Membres `static`

Un membre `static` appartient à **la classe**, pas aux instances. On y accède via le nom de la classe. Idéal pour les constantes et les fabriques (factory).

```typescript
class Member {
  static readonly ROLE_DEFAULT = "member";
  static #count = 0;               // static ET #private

  private constructor(public readonly id: string) {
    Member.#count++;
  }

  // Fabrique statique : contrôle la création
  static create(): Member {
    return new Member(crypto.randomUUID());
  }

  static get total(): number {
    return Member.#count;
  }
}

const m = Member.create();
console.log(Member.ROLE_DEFAULT); // "member"
console.log(Member.total);        // 1
```

### 2.8 Héritage : `extends` et `super`

`extends` fait hériter une classe des champs/méthodes d'une autre. `super(...)` appelle le constructeur parent (**obligatoire** avant tout `this` dans le constructeur enfant) ; `super.methode()` appelle la version parente.

```typescript
class Entity {
  constructor(public readonly id: string) {}
  describe(): string {
    return `#${this.id}`;
  }
}

class Member extends Entity {
  constructor(id: string, public name: string) {
    super(id);              // appel du constructeur parent AVANT d'utiliser this
  }

  override describe(): string {
    return `${super.describe()} — ${this.name}`; // réutilise la version parente
  }
}

const m = new Member("abc", "Alice");
console.log(m.describe()); // "#abc — Alice"
```

> Active `noImplicitOverride` dans `tsconfig.json` : `override` devient obligatoire pour toute redéfinition, ce qui attrape les fautes de frappe (une méthode `descrbe()` mal orthographiée ne redéfinit plus rien silencieusement).

### 2.9 Classes abstraites

Une classe `abstract` **ne peut pas être instanciée** (`new` interdit). Elle sert de base commune : elle peut fournir des méthodes concrètes ET déclarer des méthodes `abstract` que les sous-classes **doivent** implémenter.

```typescript
abstract class BaseEntity {
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
  ) {}

  // Méthode concrète partagée
  ageMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  // Méthode abstraite : contrat imposé aux sous-classes
  abstract label(): string;
}

// const e = new BaseEntity("x", new Date()); // ❌ Cannot create an instance of an abstract class
```

### 2.10 `implements` une interface

Une interface est un **contrat**. `implements` engage la classe à fournir tous les membres du contrat — vérifié à la compilation. `implements` ne fournit **aucun** code (contrairement à `extends`) : il vérifie seulement la forme.

```typescript
interface Serializable {
  toJSON(): Record<string, unknown>;
}

class Member implements Serializable {
  constructor(public readonly id: string, private email: string) {}

  toJSON(): Record<string, unknown> {   // requis par le contrat
    return { id: this.id, email: this.email };
  }
}
```

Une classe peut combiner les deux : `class Member extends BaseEntity implements Serializable`. On peut aussi implémenter plusieurs interfaces : `implements Serializable, Comparable`.

### 2.11 Le type `this` polymorphique

Dans une classe, `this` est un **type** qui désigne « le type de l'instance courante ». Retourner `this` rend le chaînage (fluent API) correct même dans les sous-classes.

```typescript
class QueryBuilder {
  protected parts: string[] = [];
  where(cond: string): this {   // retourne le type de l'instance réelle
    this.parts.push(cond);
    return this;
  }
}

class SortableQuery extends QueryBuilder {
  orderBy(col: string): this {
    this.parts.push(`ORDER BY ${col}`);
    return this;
  }
}

// where() renvoie `this` = SortableQuery, donc orderBy reste disponible
new SortableQuery().where("age > 18").orderBy("name");
```

Si `where()` avait été typé `: QueryBuilder` au lieu de `: this`, l'appel `.orderBy(...)` échouerait après `.where(...)` : on aurait « perdu » le type de la sous-classe.

### 2.12 Composition d'abord, héritage avec parcimonie

L'héritage crée un **couplage fort** : toute sous-classe dépend des détails internes du parent. Préfère la **composition** (une classe possède un collaborateur) sauf quand il existe une vraie relation « est un » stable. Ici, `Member` **est une** `BaseEntity` : l'héritage est légitime pour partager `id` + `createdAt`. Mais pour ajouter un comportement optionnel (logging, cache), compose plutôt qu'hériter.

---

## 3. Worked examples

### Exemple 1 — La hiérarchie d'entités TribuZen

On règle le cas concret : une base abstraite, deux entités, un contrat de sérialisation, un `#private` pour un secret.

```typescript
// domain/serializable.ts
export interface Serializable {
  // Contrat : toute entité sait produire un objet JSON-safe
  toJSON(): Record<string, unknown>;
}

// domain/base-entity.ts
export abstract class BaseEntity implements Serializable {
  // Paramètres de propriété : déclare + initialise id et createdAt en readonly
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
  ) {}

  // Concret : partagé par toutes les entités
  ageMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  // Abstrait : chaque entité fournit son étiquette lisible
  abstract label(): string;

  // Concret mais partiel : les sous-classes complètent via super.toJSON()
  toJSON(): Record<string, unknown> {
    return { id: this.id, createdAt: this.createdAt.toISOString() };
  }
}

// domain/member.ts
export class Member extends BaseEntity {
  // #private JS : le token de session ne DOIT jamais fuiter (ni JSON, ni as any)
  #sessionToken: string;

  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    private email: string,   // private TS : encapsulation simple
    sessionToken: string,
  ) {
    super(id, createdAt);    // obligatoire avant tout this
    this.#sessionToken = sessionToken;
  }

  // Fabrique statique : id + date cohérents à chaque création
  static create(name: string, email: string, token: string): Member {
    return new Member(crypto.randomUUID(), new Date(), name, email, token);
  }

  override label(): string {
    return this.name;
  }

  // Le token #private n'est PAS ajouté à la sérialisation
  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), name: this.name, email: this.email };
  }

  hasValidSession(token: string): boolean {
    return this.#sessionToken === token; // accès # uniquement ici
  }
}

// domain/family.ts
export class Family extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    public labelText: string,
    private memberIds: string[] = [],
  ) {
    super(id, createdAt);
  }

  override label(): string {
    return this.labelText;
  }

  addMember(m: Member): this {   // retourne this → chaînage typé
    this.memberIds.push(m.id);
    return this;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), label: this.labelText, memberIds: this.memberIds };
  }
}
```

Utilisation polymorphique — le point fort de la hiérarchie :

```typescript
const alice = Member.create("Alice", "alice@tribuzen.app", "tok-123");
const smiths = new Family(crypto.randomUUID(), new Date(), "Famille Smith").addMember(alice);

// Traiter n'importe quelle entité par son contrat commun
function persist(entities: BaseEntity[]): void {
  for (const e of entities) {
    console.log(e.label(), JSON.stringify(e)); // label() abstrait, toJSON() du contrat
  }
}

persist([alice, smiths]);

// Le secret ne fuite jamais :
console.log(JSON.stringify(alice));       // pas de sessionToken dans la sortie
console.log((alice as any).sessionToken); // undefined — # inaccessible
console.log(alice.hasValidSession("tok-123")); // true
```

**Ce que la hiérarchie apporte :** `id`/`createdAt` définis **une seule fois** et en `readonly` ; `persist()` accepte toute `BaseEntity` sans dupliquer les types ; le token est réellement privé grâce à `#`.

### Exemple 2 — Fluent builder et `this` polymorphique (fading)

Même leçon que 2.11, appliquée à un builder de requête TribuZen, avec une sous-classe qui étend le fluent API.

```typescript
class MemberQuery {
  protected filters: string[] = [];

  where(condition: string): this {
    this.filters.push(condition);
    return this;
  }

  build(): string {
    return `SELECT * FROM members WHERE ${this.filters.join(" AND ") || "1=1"}`;
  }
}

class PagedMemberQuery extends MemberQuery {
  #limit = 20;

  limit(n: number): this {
    this.#limit = n;
    return this;
  }

  override build(): string {
    return `${super.build()} LIMIT ${this.#limit}`;
  }
}

// where() renvoie `this` = PagedMemberQuery → limit() reste chaînable
const sql = new PagedMemberQuery()
  .where("role = 'admin'")
  .limit(5)          // impossible si where() retournait MemberQuery
  .build();

console.log(sql); // SELECT * FROM members WHERE role = 'admin' LIMIT 5
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `private` (TS) protège à l'exécution

```typescript
class Vault {
  private secret = "abc";
}
const v = new Vault();
console.log((v as any).secret);      // "abc" — accessible ! private TS effacé au build
console.log(JSON.stringify(v));      // {"secret":"abc"} — sérialisé !

// ✅ Confidentialité réelle : #private
class SafeVault {
  #secret = "abc";
}
console.log(JSON.stringify(new SafeVault())); // {} — le # ne fuit jamais
```

**Règle :** `private` TS = discipline d'équipe à la compilation. `#private` = confidentialité runtime réelle. Pour un token/secret, toujours `#`.

### PIÈGE #2 — Oublier `super()` (ou l'appeler après `this`)

```typescript
class Member extends BaseEntity {
  constructor(id: string, public name: string) {
    // this.name = name;  // ❌ erreur : 'super' must be called before accessing 'this'
    super(id, new Date());
    this.name = name;     // ✅ après super()
  }
}
```

**Règle :** dans un constructeur de sous-classe, `super(...)` vient **avant** toute lecture/écriture de `this`.

### PIÈGE #3 — Paramètre de constructeur sans modificateur ≠ champ

```typescript
class Family {
  constructor(label: string) {}   // pas de public/private → simple argument local
  show() {
    // return this.label;         // ❌ 'label' n'existe pas sur Family
    return "?";
  }
}

// ✅ Ajouter un modificateur en fait un champ
class Family2 {
  constructor(public label: string) {}
  show() { return this.label; }   // OK
}
```

### PIÈGE #4 — Confondre `extends` (code hérité) et `implements` (contrat seul)

```typescript
interface Serializable { toJSON(): Record<string, unknown>; }

// ❌ Croire qu'implements fournit une implémentation
class Broken implements Serializable {}
// erreur : Class 'Broken' incorrectly implements 'Serializable'.
//          Property 'toJSON' is missing.

// ✅ implements = obligation de fournir soi-même le code
class Ok implements Serializable {
  toJSON() { return {}; }
}
```

**Règle :** `extends` **donne** du code (une seule classe parente). `implements` **exige** du code (autant d'interfaces qu'on veut, aucune implémentation fournie).

### PIÈGE #5 — Instancier une classe abstraite

```typescript
abstract class BaseEntity { abstract label(): string; }
// new BaseEntity(); // ❌ Cannot create an instance of an abstract class
```

**Règle :** `abstract` = plan non instanciable. On instancie une sous-classe concrète qui implémente toutes les méthodes `abstract`.

### PIÈGE #6 — Retourner le type de base au lieu de `this`

```typescript
class Base {
  self(): Base { return this; }   // ❌ perd le type concret
}
class Sub extends Base {
  extra() { return 1; }
}
// new Sub().self().extra(); // ❌ 'extra' n'existe pas sur Base

// ✅ retour `this`
class Base2 { self(): this { return this; } }
class Sub2 extends Base2 { extra() { return 1; } }
new Sub2().self().extra(); // OK
```

---

## 5. Ancrage TribuZen

Le modèle de domaine TribuZen repose sur cette hiérarchie de classes, réutilisée par l'API et l'admin.

**`BaseEntity`** (`src/domain/base-entity.ts`) — classe **abstraite** qui centralise `id` et `createdAt` en `public readonly`, la méthode concrète `ageMs()`, la méthode `abstract label()` et une implémentation partielle de `toJSON()`. Toutes les entités métier en héritent : plus aucune duplication de la plomberie id/date.

**`Member`** (`src/domain/member.ts`) — `extends BaseEntity`. Porte `name` (public), `email` (`private` TS, encapsulation) et `#sessionToken` (`#private` JS : le secret de session ne doit jamais apparaître dans un `JSON.stringify` renvoyé à un client, ni être lu via `as any`). Fabrique statique `Member.create()`.

**`Family`** (`src/domain/family.ts`) — `extends BaseEntity`, agrège des `memberIds`. `addMember()` retourne `this` pour le chaînage.

**`Serializable`** (`src/domain/serializable.ts`) — interface `implements`ée par `BaseEntity`. La couche de persistance (`persist(entities: BaseEntity[])`) et l'API REST s'appuient dessus : toute entité sait produire un objet JSON-safe, sans exposer ses champs privés.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/src/domain/
  serializable.ts   // interface Serializable
  base-entity.ts    // abstract class BaseEntity implements Serializable
  member.ts         // class Member extends BaseEntity  (#sessionToken)
  family.ts         // class Family extends BaseEntity
```

---

## 6. Points clés

1. Une classe déclare des champs typés (initialisés en `strict`), un constructeur et des méthodes ; on instancie avec `new`.
2. `public`/`protected`/`private` (TS) contrôlent l'accès **à la compilation** — ils sont effacés du JS émis.
3. `#private` (JS) est un vrai champ privé ECMAScript : confidentialité **runtime**, jamais sérialisé, incontournable via `as any`.
4. `readonly` fige un champ après initialisation (garantie de compilation).
5. Les paramètres de propriété (`constructor(public readonly id: string)`) déclarent et initialisent un champ en une ligne ; sans modificateur, c'est un simple argument.
6. `get`/`set` exposent des propriétés calculées ou validées ; `get` seul = lecture seule.
7. `static` attache un membre à la classe (constantes, fabriques), pas aux instances.
8. `extends` + `super()` héritent du code ; `super()` avant tout `this` ; `override` (+ `noImplicitOverride`) sécurise les redéfinitions.
9. `abstract` = base non instanciable qui impose des méthodes aux sous-classes.
10. `implements` vérifie qu'une classe respecte le contrat d'une ou plusieurs interfaces sans fournir de code.
11. Retourner `this` (type polymorphique) préserve le type concret dans un fluent API hérité.
12. Composer par défaut ; hériter seulement pour une vraie relation « est un » stable comme `Member` **est une** `BaseEntity`.

---

## 7. Seeds Anki

```
Quelle est la différence fondamentale entre `private` (TS) et `#private` (JS) ?|`private` TS est vérifié à la compilation puis effacé du JS émis : contournable via (obj as any).x et sérialisé par JSON.stringify. `#private` JS est un vrai champ privé runtime : jamais énumérable, absent du JSON, inaccessible hors de la classe même par as any.
Quand choisir `#private` plutôt que `private` TS ?|Quand on veut une confidentialité réelle à l'exécution : un secret, un token, un invariant qui ne doit jamais fuiter via as any ni sérialisation. `private` TS suffit pour l'encapsulation de confort.
Que fait un modificateur (public/private/readonly) sur un paramètre de constructeur ?|Paramètre de propriété : il déclare ET initialise automatiquement le champ correspondant. Sans modificateur, le paramètre reste un simple argument local et n'est pas un champ de l'instance.
Quelle contrainte pèse sur super() dans un constructeur de sous-classe ?|super(...) doit être appelé avant toute lecture ou écriture de this. Sinon : erreur "super must be called before accessing this".
Quelle est la différence entre extends et implements ?|extends fait hériter du code d'une seule classe parente. implements n'apporte aucun code : il vérifie à la compilation que la classe fournit tous les membres d'une (ou plusieurs) interfaces.
Pourquoi une classe abstraite ne peut-elle pas être instanciée ?|Elle sert de plan commun et peut déclarer des méthodes abstract sans implémentation. new sur une classe abstraite est une erreur ; on instancie une sous-classe concrète qui implémente toutes les méthodes abstraites.
À quoi sert de retourner le type this dans une méthode ?|À préserver le type concret de l'instance dans un fluent API : une sous-classe qui hérite d'une méthode retournant this garde ses propres méthodes chaînables. Retourner le type de base les perdrait.
Que garantit readonly et à quel niveau ?|Il autorise une seule affectation (déclaration ou constructeur) puis interdit toute réaffectation. C'est une garantie de compilation, pas un gel de l'objet à l'exécution.
Pourquoi activer noImplicitOverride dans tsconfig ?|Il rend override obligatoire pour toute redéfinition de méthode parente, ce qui détecte les fautes de frappe : une méthode mal orthographiée ne redéfinit plus rien silencieusement.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-05-classes/README.md`. Construire de zéro la hiérarchie d'entités TribuZen (`Serializable`, `BaseEntity` abstraite, `Member` avec `#sessionToken`, `Family`), avec le vrai compilateur `tsc`/`tsx` — corrigé complet, variante J+30 et portage TribuZen.
