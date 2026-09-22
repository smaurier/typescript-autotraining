// generics.ts — STARTER. Le type de base et les données sont fournis, tout le reste est à écrire.
// L'oracle (test/) importe ce fichier via `@lab/generics` et attend :
//   Family, familles, pick, QueryBuilder<T>, withDefault, longueur, identity, parseJson

export interface Family {
  id: string;
  nom: string;
  ville: string;
  membreCount: number;
  createdAt: string;
}

export const familles: Family[] = [
  { id: "f1", nom: "Durand", ville: "Lyon", membreCount: 4, createdAt: "2026-01-01" },
  { id: "f2", nom: "Martin", ville: "Paris", membreCount: 2, createdAt: "2026-02-01" },
  { id: "f3", nom: "Bernard", ville: "Lyon", membreCount: 5, createdAt: "2026-03-01" },
];

// Étape 1 — pick<T, K extends keyof T>(obj, keys): Pick<T, K>

// Étapes 2-3 — class QueryBuilder<T> { where(cle, valeur: NoInfer<T[K]>): this ; filter(fn): this ; run(source): T[] }
//              withDefault<T>(options: readonly T[], defaut: NoInfer<T>): T

// Étape 4 — chasse au generic de trop : réécris a/b/c sous les noms longueur / identity / parseJson
// function a<T>(x: T[]): number { return x.length; }        // generic utile ou pas ?
// function b<T>(x: T): T { return x; }                       // ?
// function c<T>(json: string): T { return JSON.parse(json); } // ?
