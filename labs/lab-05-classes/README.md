# Lab 05 — Classes et héritage

> **Outcome :** à la fin, tu sais construire une hiérarchie d'entités typée — classe abstraite `BaseEntity`, sous-classes `Member`/`Family`, contrat `Serializable`, et un champ `#private` réellement confidentiel — vérifiée par le vrai compilateur TypeScript.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:05` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:05` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`05-classes-et-heritage.md`](../../modules/05-classes-et-heritage.md), **une fois**, puis on ferme :
- §2.2 visibilité TS · §2.3 `readonly` · §2.4 `#private` vs `private` · §2.5 paramètres de propriété · §2.7 `static`
- §2.8 `extends` et `super` · §2.9 classes abstraites · §2.10 `implements` · §2.11 le type `this`
- §4 pièges #1 (`private` ne protège pas à l'exécution), #2 (`super()` oublié ou tardif), #5 (instancier une abstraite), #6 (retourner la base au lieu de `this`)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemple 1 = ce lab).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 21/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

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

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:05         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:05       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Quatre fichiers dans `src/` (créés vides, à toi de les remplir) : `serializable.ts`, `base-entity.ts`, `member.ts`, `family.ts`. `tsconfig` en `strict` + `noImplicitOverride`. Exports attendus :
- `interface Serializable { toJSON(): Record<string, unknown> }`
- `abstract class BaseEntity implements Serializable` : `readonly id: string`, `readonly createdAt: Date` (paramètres de propriété), `ageMs(): number`, `abstract label(): string`, `toJSON()` partielle
- `class Member extends BaseEntity` : `public name`, `private email`, `#sessionToken` ; `static create(name: string, email: string, token: string): Member` ; `override label()` ; `override toJSON()` sans le token ; `hasValidSession(token: string): boolean`
- `class Family extends BaseEntity` : `new Family(id: string, createdAt: Date, label: string)` ; `addMember(m: Member): this` ; `override label()` ; `override toJSON()` avec `label` et `memberIds`

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `Serializable` a exactement ce contrat ; `new BaseEntity(...)` est refusé (abstraite) ; `Member` et `Family` sont des `BaseEntity` et des `Serializable` ; `id`/`createdAt` refusent l'affectation ; `member.email` et `member.sessionToken` sont refusés ; `addMember` renvoie `this` (une sous-classe `VipFamily` récupère `VipFamily`, pas `Family`).
- **Runtime** : `Member.create` donne un id string unique, une `Date`, `label() === name` ; `toJSON()` = `{ id, createdAt ISO, name, email }` exactement ; `JSON.stringify(member)` ne contient ni le token ni le mot « token » ; `(member as any).sessionToken` est `undefined` ; `hasValidSession` vrai/faux ; `ageMs() >= 0` ; `addMember` renvoie la même instance et chaîne ; `Family.toJSON()` = `{ id, createdAt ISO, label, memberIds }` ; un `BaseEntity[]` mêlant les deux classes résout `label()` par le type concret.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

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
