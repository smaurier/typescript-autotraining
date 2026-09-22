# Lab 08 — Enums, tuples & types spéciaux

> **Outcome :** à la fin, tu sais convertir un `enum` en `as const` + union de littéraux, typer une position en `readonly` labeled tuple, et écrire un helper variadic — dans la vraie source de vérité TribuZen.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:08` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:08` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

## Lire avant (une lecture bornée, pas le module entier)

Module [`08-enums-tuples-types-speciaux.md`](../../modules/08-enums-tuples-types-speciaux.md), **une fois**, puis on ferme :
- §2.2 enums string · §2.4 les pièges des enums · §2.5 `as const` + union de littéraux
- §2.6 tuples · §2.7 variadic tuples · §2.8 `readonly` tuples
- §4 pièges #1 (« enum = plus propre »), #2 (`const enum` sous Vite/esbuild), #5 (perdre l'arité avec un rest non générique)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab, résolu).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 22/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

Un collègue a poussé un commit qui remplace l'union `MemberRole` par un `enum` string, et a ajouté un fichier `geo.ts` où les positions sont typées `number[]` (pas de garantie sur lat/lng). Ta mission : revenir à un typage sain, sans perdre la capacité d'itérer sur les rôles.

Point de départ (état à corriger) :

```ts
// tribuzen/types/index.ts (extrait fautif)
export enum MemberRole {
  Admin = "admin",
  Parent = "parent",
  Enfant = "enfant",
}

// tribuzen/lib/geo.ts (extrait fautif)
export function distanceKm(a: number[], b: number[]): number {
  // a[0], a[1] peuvent être n'importe quoi : rien ne garantit [lat, lng]
  // ...
  return 0;
}
```

Contraintes :
1. Le projet compile sous `tsconfig` avec `"isolatedModules": true` et `"erasableSyntaxOnly": true` → **aucun enum ne doit subsister**.
2. On doit pouvoir alimenter un `<select>` des rôles au runtime (donc garder un objet itérable).
3. Une position est **exactement** deux nombres `[lat, lng]`, immuable.
4. Écrire un helper `itineraire(origine, ...etapes)` dont le **type de retour préserve l'arité**.

## Étapes (en friction)

1. Convertis `MemberRole` en objet `MEMBER_ROLE` figé (`as const`) + type union dérivé via `typeof … [keyof typeof …]`. Ne garde aucun `enum`.
2. Ajoute une fonction `roleFromApi(raw: string): MemberRole | null` qui valide une chaîne externe contre les valeurs de `MEMBER_ROLE`.
3. Dans `geo.ts`, remplace les `number[]` par un type `LatLng = readonly [lat: number, lng: number]`. Fais compiler `distanceKm`.
4. Écris `itineraire` en variadic tuple : `<T extends readonly LatLng[]>(origine: LatLng, ...etapes: T) => [origine: LatLng, ...T]`.
5. Prouve à toi-même l'exhaustivité : écris `labelRole` avec un `switch` et un `const _: never = role` dans le `default`. Ajoute mentalement un 4e rôle et vérifie que TS proteste.
6. Lance `npx tsc --noEmit` : zéro erreur, zéro enum restant.

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:08         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:08       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Deux fichiers dans `src/` (l'état fautif est déjà dedans) : `types.ts` et `geo.ts`. Le `tsconfig` du lab impose `isolatedModules` + `erasableSyntaxOnly` : **tout `enum` restant est une erreur de compilation**, c'est l'oracle de la contrainte 1. Exports attendus :
- `types.ts` : `MEMBER_ROLE` (objet `as const` avec les clés `Admin`/`Parent`/`Enfant` et les valeurs `"admin"`/`"parent"`/`"enfant"`) · `type MemberRole` dérivé de l'objet · `roleFromApi(raw: string): MemberRole | null` · `labelRole(role: MemberRole): string` (exhaustif, `never` dans le `default`)
- `geo.ts` : `type LatLng = readonly [lat: number, lng: number]` · `distanceKm(a: LatLng, b: LatLng): number` (haversine, km) · `itineraire<T extends readonly LatLng[]>(origine: LatLng, ...etapes: T): [origine: LatLng, ...T]`

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `MEMBER_ROLE.Admin` est le literal `"admin"` et l'objet refuse la mutation ; `MemberRole` est l'union des trois valeurs ; une chaîne `"admin"` est directement un `MemberRole` ; `labelRole("root")` refusé ; `LatLng` est exactement `readonly [lat: number, lng: number]`, refuse `p[0] = 0`, trois nombres et un `number[]` ; `itineraire(maison, a, b)` est `[origine: LatLng, LatLng, LatLng]` avec `length: 3`, `itineraire(maison)` est `[origine: LatLng]`, une étape `[1, 2, 3]` est refusée.
- **Runtime** : `Object.values(MEMBER_ROLE)` = `["admin", "parent", "enfant"]` ; `roleFromApi` accepte `"admin"`/`"enfant"`, rejette `"root"` et `"Admin"` ; trois libellés distincts ; Lyon → Paris entre 385 et 400 km, symétrique, 0 sur soi-même ; `itineraire` renvoie `[origine, ...etapes]`.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

## Variante J+30 (fading)

Reprends à froid, **en 20 minutes**, sans relire le corrigé :

1. Repars d'une union brute `type MemberRole = "admin" | "parent" | "enfant"` et fais l'inverse : dérive l'objet `MEMBER_ROLE` itérable **à partir du besoin** d'un `<select>`, en gardant l'union comme source.
2. Ajoute une contrainte : `itineraire` doit refuser un appel sans aucune étape (au moins une étape obligatoire). Indice : `(origine: LatLng, premiere: LatLng, ...reste: T)`.
3. Sans utiliser `Object.values`, écris un type-guard `isMemberRole(x: unknown): x is MemberRole` à la main.

## Application TribuZen

Porte le résultat dans le vrai dépôt :

- `tribuzen/types/index.ts` : convertir `MemberRole` au pattern `as const` + union, avec le commentaire justifiant le refus de l'enum (bundle, `erasableSyntaxOnly`).
- `tribuzen/lib/geo.ts` : créer `LatLng` + `distanceKm` + `itineraire`, utilisés par la future carte des lieux épinglés d'une famille.
- Vérifie que `tsconfig` a bien `"isolatedModules": true` et `"erasableSyntaxOnly": true`, puis `npx tsc --noEmit`.
- Commit sur `smaurier/tribuzen` : `feat(types): MemberRole en as const union + LatLng tuple readonly + helper itineraire variadic`.
