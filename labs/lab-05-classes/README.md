# Lab 05 — Classes et héritage

> **Outcome :** à la fin, tu sais construire une hiérarchie d'entités typée — classe abstraite `BaseEntity`, sous-classes `Member`/`Family`, contrat `Serializable`, et un champ `#private` réellement confidentiel — vérifiée par le vrai compilateur TypeScript.
> **Vrai outil :** TypeScript (`tsc` en `strict`) + exécution via `tsx`. Aucun harnais de test simulé.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

Tu modélises le domaine de l'admin TribuZen. Pars d'un dossier vide et écris toi-même toute la hiérarchie. Contrainte : `tsc --strict --noImplicitOverride` doit passer **sans erreur ni `any`**, et un secret de session ne doit **jamais** fuiter dans un `JSON.stringify`.

Starter minimal (à créer toi-même, pas de gap-fill) :

```bash
# depuis le dossier du lab
npm init -y
npm i -D typescript tsx
npx tsc --init --strict --noImplicitOverride --target ES2022
```

```
lab-05-classes/
  src/
    serializable.ts   # interface Serializable
    base-entity.ts    # abstract class BaseEntity implements Serializable
    member.ts         # class Member extends BaseEntity
    family.ts         # class Family extends BaseEntity
    main.ts           # scénario de démonstration (console.log)
```

Exécution : `npx tsx src/main.ts`. Type-check strict : `npx tsc --noEmit`.

## Étapes (en friction)

1. **Contrat** — écris `interface Serializable { toJSON(): Record<string, unknown>; }`.
2. **Base abstraite** — écris `abstract class BaseEntity implements Serializable` : `id` et `createdAt` en `public readonly` via **paramètres de propriété**, une méthode concrète `ageMs()`, une méthode `abstract label(): string`, et une `toJSON()` partielle (id + createdAt).
3. **Member** — `extends BaseEntity`. Ajoute `name` (public), `email` (`private` TS), et `#sessionToken` (`#private` JS). Implémente `override label()`, `override toJSON()` (sans le token), une méthode `hasValidSession(token)`, et une **fabrique statique** `static create(name, email, token)`.
4. **Family** — `extends BaseEntity`, agrège `private memberIds: string[]`. `addMember(m: Member): this` (chaînage), `override label()`, `override toJSON()`.
5. **Polymorphisme** — dans `main.ts`, écris `function persist(entities: BaseEntity[])` qui logge `label()` + `JSON.stringify(e)` pour chaque entité.
6. **Preuve de confidentialité** — logge `JSON.stringify(member)`, `(member as any).sessionToken` et `member.hasValidSession(...)`. Vérifie que le token n'apparaît nulle part sauf dans le check.

Contraintes à tenir : aucun `any` (sauf le `as any` de la preuve #6), `tsc --noEmit` vert, `super()` avant tout `this`.

## Corrigé complet commenté

```ts
// ─── src/serializable.ts ─────────────────────────────────────────
// Contrat commun : toute entité sait produire un objet JSON-safe.
export interface Serializable {
  toJSON(): Record<string, unknown>;
}

// ─── src/base-entity.ts ──────────────────────────────────────────
import type { Serializable } from "./serializable";

// abstract : non instanciable, sert de plan aux entités concrètes.
export abstract class BaseEntity implements Serializable {
  // Paramètres de propriété : déclarent + initialisent id/createdAt
  // en readonly (une seule affectation, à la construction).
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
  ) {}

  // Méthode concrète partagée par toutes les sous-classes.
  ageMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  // Méthode abstraite : chaque sous-classe DOIT la fournir.
  abstract label(): string;

  // toJSON partielle : les sous-classes complètent via super.toJSON().
  toJSON(): Record<string, unknown> {
    return { id: this.id, createdAt: this.createdAt.toISOString() };
  }
}

// ─── src/member.ts ───────────────────────────────────────────────
import { BaseEntity } from "./base-entity";

export class Member extends BaseEntity {
  // #private JS : confidentialité RÉELLE (jamais dans JSON, ni via as any).
  #sessionToken: string;

  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    private email: string,      // private TS : encapsulation de confort
    sessionToken: string,
  ) {
    super(id, createdAt);       // OBLIGATOIRE avant tout accès à this
    this.#sessionToken = sessionToken;
  }

  // Fabrique statique : id + date cohérents à chaque création.
  static create(name: string, email: string, token: string): Member {
    return new Member(crypto.randomUUID(), new Date(), name, email, token);
  }

  // override (noImplicitOverride) : attrape les fautes de frappe.
  override label(): string {
    return this.name;
  }

  // Le #sessionToken n'est PAS ajouté → il ne fuite pas.
  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), name: this.name, email: this.email };
  }

  // Seul endroit où l'on peut lire le champ #private.
  hasValidSession(token: string): boolean {
    return this.#sessionToken === token;
  }
}

// ─── src/family.ts ───────────────────────────────────────────────
import { BaseEntity } from "./base-entity";
import type { Member } from "./member";

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

  // Retourne `this` → chaînage typé même si on sous-classe Family plus tard.
  addMember(m: Member): this {
    this.memberIds.push(m.id);
    return this;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), label: this.labelText, memberIds: this.memberIds };
  }
}

// ─── src/main.ts ─────────────────────────────────────────────────
import { BaseEntity } from "./base-entity";
import { Member } from "./member";
import { Family } from "./family";

const alice = Member.create("Alice", "alice@tribuzen.app", "tok-123");
const smiths = new Family(crypto.randomUUID(), new Date(), "Famille Smith")
  .addMember(alice); // chaînage grâce au retour `this`

// Polymorphisme : traite toute entité via son contrat commun.
function persist(entities: BaseEntity[]): void {
  for (const e of entities) {
    // label() = abstrait (résolu par le type concret), toJSON() = contrat.
    console.log(e.label(), JSON.stringify(e));
  }
}

persist([alice, smiths]);

// Preuve de confidentialité : le token ne fuit nulle part.
console.log(JSON.stringify(alice));         // ni "sessionToken" ni "tok-123"
console.log((alice as any).sessionToken);   // undefined — # inaccessible
console.log(alice.hasValidSession("tok-123")); // true

// const e = new BaseEntity("x", new Date()); // ❌ abstraite : refusé par tsc
```

Attendu :
- `npx tsc --noEmit` → aucune erreur.
- `npx tsx src/main.ts` → les `JSON.stringify` n'affichent jamais `tok-123` ; `(alice as any).sessionToken` vaut `undefined` ; `hasValidSession("tok-123")` vaut `true`.

## Variante J+30 (fading)

Refais l'exercice **en 25 min, sans relire le corrigé**, en ajoutant deux contraintes :

1. Introduis un **accesseur** `get isRecent(): boolean` sur `BaseEntity` (vrai si `ageMs() < 60_000`) — propriété calculée en lecture seule, testée dans `main.ts`.
2. Ajoute une 3e entité `Event extends BaseEntity` avec un `#organizerToken` `#private` et son propre `override label()`. Vérifie que `persist([...])` l'accepte sans modifier sa signature (preuve du polymorphisme).

Objectif : réécrire toute la hiérarchie de mémoire, `super()` et `override` corrects du premier coup, `tsc --strict` vert.

## Application TribuZen

Porte ce domaine dans le vrai produit :

- Crée `tribuzen/src/domain/{serializable,base-entity,member,family}.ts` avec ces classes.
- Branche `toJSON()` sur la couche API : la route `GET /members/:id` renvoie `member.toJSON()` — garantit que `#sessionToken` ne part jamais côté client.
- Ajoute un test manuel dans un `scripts/domain-demo.ts` (`npx tsx`) qui reproduit la preuve de confidentialité.
- Commit sur `smaurier/tribuzen` : `feat(domain): BaseEntity abstraite + Member/Family + contrat Serializable (#private token)`.
