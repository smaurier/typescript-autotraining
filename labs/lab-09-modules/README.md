# Lab 09 — Modules ES et résolution

> **Outcome :** à la fin, tu sais organiser un dossier `types/` en barrel type-only, activer `verbatimModuleSyntax` et poser un alias `@/` résolu de bout en bout (tsconfig + Vite).
> **Vrai outil :** `tsc` (TypeScript ^5) + Vite. Pas de harnais simulé — tu observes le vrai JavaScript émis pour prouver l'effacement des types.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

Tu pars d'un mini-projet TribuZen où les types métier sont dispersés et importés en `../../`. Objectif : construire l'API publique `@/types` sous forme de barrel type-only, prouver que ces imports disparaissent du build, et configurer l'alias `@/` pour qu'il fonctionne au type-check ET au runtime.

Starter (à créer tel quel) :

```
lab-09/
  package.json          # "type": "module", scripts tsc + vite build
  tsconfig.json         # à compléter (moduleResolution, verbatimModuleSyntax, paths)
  vite.config.ts        # à compléter (resolve.alias)
  src/
    types/
      family.ts         # export interface Family
      member.ts         # export interface Member, export type Role
      event.ts          # export interface Event
      index.ts          # BARREL — à écrire
    services/
      family.service.ts # export function fetchFamily (vraie valeur, survit au build)
    screens/
      FamilyScreen.ts   # consomme @/types + @/services
```

Contenu de départ des types :

```ts
// src/types/family.ts
export interface Family {
  id: string;
  name: string;
  memberIds: string[];
}

// src/types/member.ts
export type Role = 'admin' | 'parent' | 'child';
export interface Member {
  id: string;
  name: string;
  role: Role;
  familyId: string;
}

// src/types/event.ts
export interface Event {
  id: string;
  title: string;
  familyId: string;
}
```

## Étapes (en friction)

1. **Barrel type-only.** Écris `src/types/index.ts` qui ré-exporte `Family`, `Member`, `Role`, `Event` en `export type`. Aucune valeur ne transite par ce barrel.
2. **tsconfig.** Configure `moduleResolution: "bundler"`, `module: "ESNext"`, `verbatimModuleSyntax: true`, `baseUrl: "."`, `paths: { "@/*": ["src/*"] }`, `strict: true`.
3. **Service (vraie valeur).** Écris `src/services/family.service.ts` avec une **fonction** exportée `fetchFamily(id: string): Family` — c'est une valeur, elle doit survivre au build.
4. **Écran consommateur.** Dans `src/screens/FamilyScreen.ts`, importe les types via `import type { Family, Member, Event } from '@/types'` et la fonction via `import { fetchFamily } from '@/services/family.service'`.
5. **Alias runtime.** Configure `resolve.alias` dans `vite.config.ts` pour que `@/` pointe vers `src/`. Sans ça, `vite build` échoue même si `tsc` passe.
6. **Preuve d'effacement.** Lance `npx tsc --noEmit` (doit passer), puis inspecte le JS émis de `FamilyScreen` : la ligne `import type { Family, … }` doit avoir **disparu**, alors que l'import de `fetchFamily` doit **rester**.
7. **Piège volontaire.** Retire le mot-clé `type` d'un `import type` et relance : observe que l'import réapparaît dans le JS (effet de `verbatimModuleSyntax`).

## Corrigé complet commenté

```ts
// ─── src/types/index.ts — barrel 100% type-only ─────────────────
// Aucune valeur ici : tout est `export type`, donc ce fichier
// n'émet AUCUN JavaScript. C'est l'API publique du dossier types/.
export type { Family } from './family';
export type { Member, Role } from './member';
export type { Event } from './event';
```

```ts
// ─── src/services/family.service.ts — VALEUR (survit au build) ──
import type { Family } from '@/types'; // type-only : élidé
import type { Member } from '@/types';

// fetchFamily est une fonction = valeur runtime → présente dans le JS émis
export function fetchFamily(id: string): Family {
  // (mock synchrone pour le lab)
  return { id, name: 'Famille Test', memberIds: [] };
}

// createMember aussi est une valeur exportée
export function createMember(name: string, familyId: string): Member {
  return { id: crypto.randomUUID(), name, role: 'child', familyId };
}
```

```ts
// ─── src/screens/FamilyScreen.ts — consommateur ─────────────────
// import type : ces 3 identifiants ne servent qu'à l'annotation
import type { Family, Member, Event } from '@/types';
// import de valeur : fetchFamily est appelé, donc l'import RESTE au build
import { fetchFamily } from '@/services/family.service';

export function renderFamilyScreen(id: string): {
  family: Family;
  members: Member[];
  events: Event[];
} {
  const family = fetchFamily(id); // appel runtime réel
  const members: Member[] = [];   // Member : pur type, disparaît du JS
  const events: Event[] = [];     // Event : idem
  return { family, members, events };
}
```

```jsonc
// ─── tsconfig.json ──────────────────────────────────────────────
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",   // app buildée → imports sans extension
    "verbatimModuleSyntax": true,    // règle littérale : `type` = effacé, sinon préservé
    "strict": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]               // alias côté TYPE-CHECKER seulement
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

```ts
// ─── vite.config.ts ─────────────────────────────────────────────
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    // OBLIGATOIRE : réplique l'alias @/ pour le build/runtime.
    // paths (tsconfig) ne suffit pas — Vite a sa propre résolution.
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

**Preuve attendue (étape 6).** Le JS émis de `FamilyScreen` ressemble à :

```js
// dist/screens/FamilyScreen.js — l'import type a DISPARU
import { fetchFamily } from '@/services/family.service';
export function renderFamilyScreen(id) {
  const family = fetchFamily(id);
  const members = [];
  const events = [];
  return { family, members, events };
}
```

La ligne `import type { Family, Member, Event }` n'apparaît nulle part : preuve visuelle de l'élision garantie par `import type`.

## Variante J+30 (fading)

Reprends le projet **en 25 min, sans relire le corrigé**, avec une contrainte ajoutée : **cible Node ESM au lieu d'un bundler**. Passe `moduleResolution` à `"nodenext"` et `module` à `"NodeNext"`, puis corrige toutes les erreurs qui apparaissent — notamment ajouter l'extension `.js` sur chaque import relatif (`./family.js`, etc.) et remplacer l'alias par le champ `imports` de `package.json` (`"#/*": ["./src/*"]`) puisque `paths` n'est plus résolu au runtime Node. Objectif : ressentir la seule vraie différence entre `bundler` et `nodenext` — l'extension obligatoire.

## Application TribuZen

Porte le résultat dans `smaurier/tribuzen` :
1. Crée `src/types/{family,member,event}.ts` et le barrel `src/types/index.ts` (100 % `export type`).
2. Active `verbatimModuleSyntax: true` et `moduleResolution: "bundler"` dans le `tsconfig.json` du repo.
3. Ajoute `paths: { "@/*": ["src/*"] }` et réplique `resolve.alias` dans `vite.config.ts`.
4. Remplace tous les `import { … } from '../../types/…'` par `import type { … } from '@/types'`.
5. Vérifie via `npm run build` que le bundle ne contient plus aucune trace des interfaces métier.

Commit : `git commit -m "chore(types): barrel type-only + alias @/ + verbatimModuleSyntax"` sur `smaurier/tribuzen`.
