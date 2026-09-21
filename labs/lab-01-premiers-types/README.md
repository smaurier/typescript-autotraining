# Lab 01 — Premiers types

> **Outcome :** à la fin, tu sais typer un `Member` TribuZen avec les bons primitifs, remplacer `any` par `unknown` + narrowing sur des données d'API, et valider une config avec `satisfies`.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:01` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:01` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`01-types-primitifs-et-inference.md`](../../modules/01-types-primitifs-et-inference.md), **une fois**, puis on ferme :
- §2.1 les sept primitifs · §2.2-2.4 inférence, `let`/`const`, quand annoter
- §2.5 literal types · §2.6 `any` · §2.7 `unknown` · §2.9 `as`, `!` et `satisfies`
- §4 pièges #1 (`any` « pour avancer »), #2 (`as` ne vérifie rien), #3 (annotation vs `satisfies`), #5 (`NaN` est un `number`)

⛔ **Pas §3 Worked examples avant ton GREEN** : l'exemple 1 est ce lab, résolu. L'ouvrir avant, c'est du gap-fill.

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 21/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

Tu construis la couche de typage de l'admin TribuZen. Crée un dossier de travail et un seul fichier `membres.ts`.

Starter minimal (à recopier, tout est volontairement mal ou pas typé) :

```typescript
// membres.ts — STARTER
const rawConfig = {
  env: "development",
  apiUrl: "http://localhost:3000",
  port: 3000,
  ssl: false,
};

async function chargerMembres() {
  const reponse = await fetch(rawConfig.apiUrl + "/members");
  const data: any = await reponse.json();
  return data;
}
```

Assure-toi que le `tsconfig.json` a `"strict": true`. Vérifie avec :

```bash
npx tsc --noEmit membres.ts
```

## Étapes (en friction)

1. Définis une interface `Member` : `id`, `name`, `email` en `string` ; `age` en `number` ; `isActive` en `boolean`. Écris-la de mémoire, sans regarder le corrigé.
2. Écris un type guard `isRawMember(x: unknown): x is RawMember` qui valide la **forme brute renvoyée par l'API** (elle expose `active`, booléen — pas encore `isActive`). Le remap `active → isActive` se fera **après** le filtrage, lors de la construction du `Member`. (Un guard qui prétendrait `x is Member` tout en validant `active` serait mensonger — cf. module 02, piège #4.)
3. Retype `chargerMembres` : `data` doit être `unknown` (jamais `any`), le retour doit être `Promise<Member[]>`. Rejette une réponse qui n'est pas un tableau.
4. Type la config avec `satisfies AppConfig` (définis `AppConfig` avec `env: "development" | "staging" | "production"`). Vérifie ensuite que `rawConfig.env` reste le literal `"development"` (essaie `rawConfig.env.toUpperCase()` — ça doit compiler).
5. Prouve que le typage marche : ajoute une ligne `const x = membres[0].naem;` et vérifie que `tsc` la refuse. Puis supprime-la.

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:01         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:01       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/membres.ts`. Exports attendus (noms exacts) :
- `interface Member` · `type RawMember` · `interface AppConfig`
- `rawConfig` (la config, validée par `satisfies AppConfig`)
- `isRawMember(x: unknown): x is RawMember`
- `chargerMembres(): Promise<Member[]>`

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : les cinq champs de `Member` avec les bons primitifs ; `RawMember` expose `active` et pas `isActive` ; `isRawMember` prend `unknown` (jamais `any`) ; `chargerMembres` renvoie `Promise<Member[]>` ; `AppConfig["env"]` est l'union fermée ; `rawConfig.env` reste le literal `"development"` ; `membres[0].naem` est refusé.
- **Runtime** : le guard accepte un membre brut complet, rejette `null`, les primitifs, un `age` en string, un objet sans `active`, un objet avec `isActive` à la place d'`active` ; `chargerMembres` ne garde que les formes conformes, remappe `active → isActive`, rejette une réponse non-tableau, appelle `http://localhost:3000/members` (`fetch` est stubbé par le test).

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

## Variante J+30 (fading)

Referme ce corrigé. En **15 minutes**, sans relire le module :
- retype le même `membres.ts` de mémoire ;
- contrainte ajoutée : `isRawMember` doit **aussi** rejeter un `age` négatif ou `NaN` (rappelle-toi que `NaN` est un `number` — `typeof` ne suffit pas, ajoute `Number.isFinite(o.age) && o.age >= 0`) ;
- interdiction d'utiliser `any` une seule fois dans le fichier.

## Application TribuZen

Porte ce lab dans le vrai produit :
- `Member` → `tribuzen/src/types/member.ts` (le rôle utilise la nomenclature canonique de `@/types` : `role: "admin" | "parent" | "enfant"`). *(Ce `Member` de démo — `age`/`isActive` — reste distinct du `Member` central complet posé au module 03.)*
- `isRawMember` + `chargerMembres` → `tribuzen/src/api/members.ts` : c'est la frontière entre le réseau non typé et le state typé de l'app.
- `rawConfig satisfies AppConfig` → `tribuzen/src/config.ts`.

Commit sur `smaurier/tribuzen` :

```bash
git add src/types/member.ts src/api/members.ts src/config.ts
git commit -m "feat(types): typage Member + narrowing forme brute API + config satisfies"
```
