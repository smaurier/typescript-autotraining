// generics.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

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

// ─── Étape 1 : pick maison ───────────────────────────────────────
// T = objet source ; K = clés voulues, bornées par keyof T (sinon on pourrait
// demander une clé qui n'existe pas). Retour Pick<T, K> = objet réduit à K.
export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>; // objet vide qu'on remplit ; assertion vers le type final
  for (const k of keys) {
    out[k] = obj[k]; // obj[k]: T[K], out[k] attend T[K] -> OK
  }
  return out;
}

// ─── Étapes 2 & 3 : QueryBuilder + NoInfer ───────────────────────
export class QueryBuilder<T> {
  private predicats: Array<(x: T) => boolean> = [];

  // K borné par keyof T ; valeur = NoInfer<T[K]> : la valeur ne peut plus servir
  // de source d'inférence, T[K] est décidé par la clé seule. Comparaison type-safe.
  where<K extends keyof T>(cle: K, valeur: NoInfer<T[K]>): this {
    this.predicats.push((x) => x[cle] === valeur);
    return this; // `this` typé -> chaînage fluide
  }

  filter(fn: (x: T) => boolean): this {
    this.predicats.push(fn);
    return this;
  }

  run(source: readonly T[]): T[] {
    return source.filter((x) => this.predicats.every((p) => p(x)));
  }
}

// Démonstration NoInfer sur une valeur par défaut.
// `options: readonly T[]` + `as const` sur l'appel : sans le `as const`, les
// littéraux d'un tableau nu s'élargissent en `string`, T = string, et 'auto' passerait.
export function withDefault<T>(options: readonly T[], defaut: NoInfer<T>): T {
  return options.includes(defaut) ? defaut : options[0];
}

// ─── Étape 4 : chasse au generic de trop ─────────────────────────
// a) generic INUTILE : T n'apparaît qu'une fois, le retour ne dépend pas de T.
export function longueur(x: unknown[]): number {
  return x.length;
}

// b) generic UTILE : T lie l'entrée et le retour (identity). On le garde.
export function identity<T>(x: T): T {
  return x;
}

// c) generic FANTÔME : T n'est déduit d'aucun argument, c'est un any déguisé.
//    Version honnête : renvoyer unknown et laisser l'appelant valider.
export function parseJson(json: string): unknown {
  return JSON.parse(json);
}
