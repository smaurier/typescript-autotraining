# Lab 01 — Premiers types

> **Outcome :** à la fin, tu sais typer un `Member` TribuZen avec les bons primitifs, remplacer `any` par `unknown` + narrowing sur des données d'API, et valider une config avec `satisfies`.
> **Vrai outil :** le compilateur TypeScript (`tsc --noEmit`) en mode `strict`. Pas de harnais simulé.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

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

## Corrigé complet commenté

```typescript
// membres.ts — CORRIGÉ

// ── 1. Le contrat de données ────────────────────────────────
interface Member {
  id: string;        // identifiant : string, jamais un number
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

// ── 4. Type de la config (literal union pour env) ───────────
type Environnement = "development" | "staging" | "production";

interface AppConfig {
  env: Environnement;
  apiUrl: string;
  port: number;
  ssl: boolean;
}

// satisfies : valide la forme SANS écraser l'inférence.
// rawConfig.env reste le literal "development" (pas Environnement).
const rawConfig = {
  env: "development",
  apiUrl: "http://localhost:3000",
  port: 3000,
  ssl: false,
} satisfies AppConfig;

// Preuve que le literal est conservé : .toUpperCase() n'existe
// que sur string — donc TS sait que env EST un string précis.
rawConfig.env.toUpperCase(); // OK, compile

// ── 2. Type guard : valide la forme BRUTE renvoyée par l'API ──
// L'API expose `active` (pas `isActive`) : le guard décrit donc la
// forme RÉSEAU, pas encore le Member interne. Le remap vient à l'étape 3.
type RawMember = {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
};

function isRawMember(x: unknown): x is RawMember {
  if (typeof x !== "object" || x === null) return false; // écarte null et primitifs
  const o = x as Record<string, unknown>;                 // vue indexable pour lire les champs
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.age === "number" &&      // rejette age: "30" (string) venant d'une API laxiste
    typeof o.active === "boolean"     // l'API expose `active`, pas `isActive`
  );
}

// ── 3. Chargement typé : unknown + narrowing ────────────────
async function chargerMembres(): Promise<Member[]> {
  const reponse = await fetch(rawConfig.apiUrl + "/members");
  const data: unknown = await reponse.json(); // unknown, PAS any → force la vérification

  if (!Array.isArray(data)) {
    throw new Error("Réponse API invalide : tableau attendu");
  }

  return data
    .filter(isRawMember)            // ne garde que la forme brute conforme → RawMember[]
    .map((m) => ({                  // m : RawMember (typé) → aucun `as` nécessaire
      id: m.id,
      name: m.name,
      email: m.email,
      age: m.age,
      isActive: m.active,           // remap explicite active (API) → isActive (interne)
    }));
}

// ── 5. Preuve que le typage attrape les fautes ──────────────
// const membres = await chargerMembres();
// const x = membres[0].naem;
//                      ~~~~ Erreur : Property 'naem' does not exist on type 'Member'
```

> Note sur l'étape 3 : le guard valide la forme **brute** (`RawMember`, avec `active`), donc après `filter(isRawMember)` le tableau est `RawMember[]`. Le `.map` construit alors le `Member` interne en renommant `active` → `isActive`. **Aucun `as` n'est nécessaire** : `m` est déjà typé `RawMember` et l'objet produit correspond exactement à `Member`. Au passage, ça évite le piège inverse : un guard `x is Member` qui ne vérifie que `active` serait **mensonger** (il annoncerait un `isActive` jamais contrôlé), et `(m as { active: boolean }).active` sur un `Member` échouerait même à compiler (`TS2352`, les formes ne se recouvrent pas).

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
