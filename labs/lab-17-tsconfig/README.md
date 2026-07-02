# Lab 17 — tsconfig et compilateur

> **Outcome :** à la fin, tu sais écrire un `tsconfig.json` de production strict pour TribuZen, le découper en project references (`shared / api / admin`) avec `composite` + `tsc --build`, activer un sous-flag strict et corriger les erreurs qu'il révèle.
> **Vrai outil :** `tsc` (TypeScript ^5) en ligne de commande + un vrai monorepo de fichiers.
> **Feedback :** le coach valide en session en lançant `tsc --build --verbose` et `tsc --noEmit` — pas de test-runner auto-correcteur.

---

## Énoncé

Tu prépares le socle TypeScript de TribuZen. Le produit démarre en app front, puis se scinde en trois packages. Tu vas construire les tsconfig **à la main** (pas de générateur), puis mesurer l'effet d'un sous-flag strict sur du vrai code.

Structure cible à créer :

```
tribuzen/
  package.json
  tsconfig.base.json          ← options communes strictes
  tsconfig.json               ← orchestrateur (references)
  packages/
    shared/
      tsconfig.json           ← composite, dépend de personne
      src/
        member.ts             ← types + utils métier (fournis plus bas)
    api/
      tsconfig.json           ← composite, dépend de shared
      src/
        index.ts
    admin/
      tsconfig.json           ← composite, dépend de shared (front Vite)
      src/
        main.ts
```

**Code de départ (à copier dans `packages/shared/src/member.ts`) :**

```ts
export interface Member {
  id: string;
  name: string;
  role: "admin" | "mod" | "member";
  familyName?: string;
}

// Deux fonctions VOLONTAIREMENT fragiles : le sous-flag strict va les casser
export function premierAdmin(membres: Member[]): string {
  const admins = membres.filter((m) => m.role === "admin");
  return admins[0].name;
}

export function libelleRole(role: string): string {
  const LABELS: Record<string, string> = { admin: "Admin", mod: "Modo" };
  return LABELS[role].toUpperCase();
}
```

**Contraintes :**
- `tsconfig.base.json` doit contenir `strict: true`, `skipLibCheck`, `declaration`, `declarationMap`, `composite`.
- Chaque package a `composite: true` et est listé dans les `references` de l'orchestrateur.
- `api` et `admin` déclarent `references: [{ "path": "../shared" }]`.
- Le build se fait **uniquement** avec `tsc --build` depuis la racine — jamais `tsc` seul.
- **Pas de gap-fill** : tu écris chaque tsconfig complet.

---

## Étapes (en friction)

1. **Init.** Crée l'arborescence ci-dessus. `npm init -y` à la racine, `npm i -D typescript` (^5). Colle `member.ts`. Mets un `index.ts` et un `main.ts` qui importent `premierAdmin` depuis `../../shared/src/member` (via chemin relatif, puis via project reference).
2. **Écris `tsconfig.base.json`** — options communes strictes (voir contraintes). Pas de `rootDir`/`outDir` ici (spécifiques à chaque package).
3. **Écris les trois `tsconfig.json` de packages** — chacun `extends` la base, ajoute `composite`, `rootDir: ./src`, `outDir: ./dist`. `api` et `admin` ajoutent `references` vers `../shared`. `admin` passe en `moduleResolution: Bundler`.
4. **Écris l'orchestrateur racine** — `files: []` + `references` vers les trois packages.
5. **Build.** Lance `npx tsc --build --verbose` depuis la racine. Observe l'ordre : `shared` d'abord, puis `api` + `admin`. Vérifie que les `dist/*.d.ts` de `shared` sont générés.
6. **Casse volontairement l'ordre.** Retire `composite: true` de `shared`, relance `tsc --build`. Lis l'erreur `TS6306`. Remets-le.
7. **Active le sous-flag strict.** Ajoute `"noUncheckedIndexedAccess": true` dans `tsconfig.base.json`. Relance `tsc --build`. Deux erreurs apparaissent dans `member.ts`. **Corrige-les** sans désactiver le flag.
8. **Vérifie le type-check seul.** Depuis la racine, lance `npx tsc --build --dry` puis `npx tsc --noEmit -p packages/shared` — confirme zéro erreur après correction.

---

## Corrigé complet commenté

```jsonc
// ─── tribuzen/tsconfig.base.json ────────────────────────────────
// Options partagées par TOUS les packages. Pas de rootDir/outDir ici :
// ils sont propres à chaque package.
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],

    // Rigueur : le socle commun
    "strict": true,

    // Project references : declaration OBLIGATOIRE (les consommateurs
    // lisent les .d.ts, pas les .ts). composite active incremental + declaration.
    "composite": true,
    "declaration": true,
    "declarationMap": true,     // "go to definition" saute vers le .ts source
    "sourceMap": true,

    // Perf + compat transpileur mono-fichier
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```jsonc
// ─── tribuzen/tsconfig.json (orchestrateur racine) ──────────────
// Ne compile AUCUN fichier lui-même (files: []). Il ne fait que
// pointer vers les sous-projets pour que 'tsc --build' ordonne le graphe.
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/admin" }
  ]
}
```

```jsonc
// ─── tribuzen/packages/shared/tsconfig.json ─────────────────────
// Socle métier : ne dépend de personne. C'est la racine du graphe.
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

```jsonc
// ─── tribuzen/packages/api/tsconfig.json ────────────────────────
// Backend Node : dépend de shared. La reference dit à tsc --build
// de compiler shared AVANT, et de consommer ses .d.ts.
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

```jsonc
// ─── tribuzen/packages/admin/tsconfig.json ──────────────────────
// Front Vite : résolution Bundler, JSX. Dépend aussi de shared.
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

```ts
// ─── packages/shared/src/member.ts — APRÈS activation du flag ────
// noUncheckedIndexedAccess a typé admins[0] en 'Member | undefined'
// et LABELS[role] en 'string | undefined'. Deux corrections :
export interface Member {
  id: string;
  name: string;
  role: "admin" | "mod" | "member";
  familyName?: string;
}

// 1) admins[0] peut ne pas exister -> type de retour élargi + optional chaining
export function premierAdmin(membres: Member[]): string | undefined {
  const admins = membres.filter((m) => m.role === "admin");
  return admins[0]?.name;
}

// 2) LABELS[role] peut être undefined -> fallback explicite avant .toUpperCase()
export function libelleRole(role: string): string {
  const LABELS: Record<string, string> = { admin: "Admin", mod: "Modo" };
  return (LABELS[role] ?? "Membre").toUpperCase();
}
```

```bash
# ─── Build depuis la racine ─────────────────────────────────────
npx tsc --build --verbose
# Sortie attendue (ordre topologique) :
#   Project 'packages/shared/tsconfig.json' is out of date, building...
#   Project 'packages/api/tsconfig.json' is out of date, building...
#   Project 'packages/admin/tsconfig.json' is out of date, building...
# -> shared d'abord, puis api et admin (qui consomment shared/dist/*.d.ts)

npx tsc --build --clean   # supprime les dist/ et .tsbuildinfo
```

**Pourquoi ce corrigé est correct :**
- `composite: true` dans la base couvre les trois packages : chacun est référençable et émet ses `.d.ts`.
- L'orchestrateur avec `files: []` ne compile rien : il n'existe que pour ordonner le graphe. `tsc --build` le lit, `tsc` seul l'ignorerait.
- `api`/`admin` consomment `shared/dist/*.d.ts` (types émis), pas `shared/src` — d'où l'obligation de `declaration: true`.
- Après le flag, on **élargit le type de retour** plutôt que de forcer avec `!` : on rend l'absence visible aux appelants, ce qui est le but du flag.
- `admin` diverge en `moduleResolution: Bundler` + `lib DOM` car c'est un front Vite ; `shared`/`api` restent en `NodeNext`.

---

## Variante J+30 (fading)

**Même monorepo, reproduire de mémoire en 25 minutes, avec une contrainte ajoutée :**

1. Ajoute un 4e package `packages/cli` (Node, dépend de `shared` ET `api`) — deux `references`.
2. Active en plus `exactOptionalPropertyTypes: true` dans la base. Trouve et corrige l'erreur qu'il révèle sur `Member.familyName` (ex. un objet construit avec `familyName: undefined` explicite).
3. Ajoute un script `package.json` racine `"typecheck": "tsc --build"` et un `"clean": "tsc --build --clean"`.
4. **Sans rouvrir ce corrigé** ni le module 17.

**Critère de réussite :** `npx tsc --build --verbose` compile les 4 packages dans le bon ordre, zéro erreur, et retirer `composite` d'un package produit bien `TS6306`.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce socle vit à la racine du monorepo :

```
tribuzen/
  tsconfig.base.json
  tsconfig.json
  packages/
    shared/tsconfig.json + src/
    api/tsconfig.json    + src/
    admin/tsconfig.json  + src/
```

**Différences par rapport au lab :**
- `admin` sera une vraie app Vite : `tsconfig.json` ajoutera `noEmit: true` (Vite build le JS) et l'alias `paths: { "@/*": ["src/*"] }`, répliqué dans `vite.config.ts` (`resolve.alias`).
- `api` sera un backend NestJS : le `tsconfig.json` NestJS ajoutera `experimentalDecorators` + `emitDecoratorMetadata`.
- La CI lancera `tsc --build` (type-check global) séparément des builds Vite/Nest.

**Commit cible :**
```
chore(tsconfig): socle monorepo strict — references shared/api/admin
feat(shared): noUncheckedIndexedAccess — accès indexés sûrs (premierAdmin, libelleRole)
```
