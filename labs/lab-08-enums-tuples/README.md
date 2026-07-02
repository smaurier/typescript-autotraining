# Lab 08 — Enums, tuples & types spéciaux

> **Outcome :** à la fin, tu sais convertir un `enum` en `as const` + union de littéraux, typer une position en `readonly` labeled tuple, et écrire un helper variadic — dans la vraie source de vérité TribuZen.
> **Vrai outil :** le compilateur TypeScript (`tsc --noEmit`) sur `tribuzen/types/index.ts` et `tribuzen/lib/geo.ts`. Pas de harnais de test simulé.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

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

## Corrigé complet commenté

```ts
// ═══════════════════════════════════════════════════════════════
// tribuzen/types/index.ts
// ═══════════════════════════════════════════════════════════════

// Objet figé : `as const` fige les valeurs en littéraux + readonly.
// On le garde comme VALEUR pour pouvoir itérer au runtime (select, seed).
export const MEMBER_ROLE = {
  Admin: "admin",
  Parent: "parent",
  Enfant: "enfant",
} as const;

// Type union DÉRIVÉ de l'objet — une seule source, pas de duplication.
// keyof typeof MEMBER_ROLE => "Admin" | "Parent" | "Enfant"
// l'accès indexé [...]      => "admin" | "parent" | "enfant"
export type MemberRole = typeof MEMBER_ROLE[keyof typeof MEMBER_ROLE];

// Pourquoi PAS un enum ici :
// - enum génère un objet runtime (coût bundle) ;
// - enum est INTERDIT sous erasableSyntaxOnly (TS 5.8) ;
// - une chaîne "admin" venue de l'API est directement un MemberRole,
//   pas besoin de MemberRole.Admin.

// Valide une chaîne externe (API, formulaire) et la restreint au type.
export function roleFromApi(raw: string): MemberRole | null {
  const valeurs = Object.values(MEMBER_ROLE) as readonly string[];
  return valeurs.includes(raw) ? (raw as MemberRole) : null;
}

// Exhaustivité prouvée par le compilateur : si on ajoute un rôle
// sans traiter son case, `role` n'est plus `never` et TS refuse.
export function labelRole(role: MemberRole): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "parent":
      return "Parent";
    case "enfant":
      return "Enfant";
    default: {
      const _exhaustif: never = role; // garde-fou d'exhaustivité
      return _exhaustif;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// tribuzen/lib/geo.ts
// ═══════════════════════════════════════════════════════════════

// readonly labeled tuple :
// - [lat, lng] : arité fixée à 2, ordre garanti ;
// - labels lat/lng : visibles dans l'IDE et les messages d'erreur ;
// - readonly : une coordonnée enregistrée ne se mute pas.
export type LatLng = readonly [lat: number, lng: number];

export function distanceKm(a: LatLng, b: LatLng): number {
  const [latA, lngA] = a; // destructuring typé (number, number)
  const [latB, lngB] = b;
  const R = 6371; // rayon terrestre (km)
  const dLat = ((latB - latA) * Math.PI) / 180;
  const dLng = ((lngB - lngA) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latA * Math.PI) / 180) *
      Math.cos((latB * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Helper VARIADIC : le rest générique ...etapes: T préserve l'arité.
// Le retour [origine: LatLng, ...T] connaît le nombre EXACT d'étapes,
// contrairement à LatLng[] qui aurait effacé cette information.
export function itineraire<T extends readonly LatLng[]>(
  origine: LatLng,
  ...etapes: T
): [origine: LatLng, ...T] {
  return [origine, ...etapes];
}

// ── Vérification manuelle (à commenter/supprimer après) ──────────
const maison: LatLng = [45.7640, 4.8357]; // Lyon
const trajet = itineraire(maison, [45.75, 4.85], [45.76, 4.84]);
// type de `trajet` : [origine: LatLng, LatLng, LatLng] — arité = 3
console.log(distanceKm(maison, trajet[1]).toFixed(2), "km");
console.log(Object.values(MEMBER_ROLE)); // ["admin","parent","enfant"]
console.log(roleFromApi("admin"), roleFromApi("root")); // "admin"  null
```

Attendu : `npx tsc --noEmit` passe sans erreur, et un `grep -R "enum" tribuzen/` ne retourne plus rien.

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
