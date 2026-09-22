// Oracle de TYPES du lab 07 (vitest --typecheck).
import { expectTypeOf, test } from "vitest";
import type { Family } from "@lab/generics";
import { familles, pick, QueryBuilder, withDefault, longueur, identity, parseJson } from "@lab/generics";

test("pick : K borné par keyof T, retour Pick<T, K>", () => {
  const carte = pick(familles[0], ["nom", "ville"]);
  expectTypeOf(carte).toEqualTypeOf<{ nom: string; ville: string }>();
  // @ts-expect-error "createdAt" absent du type réduit
  carte.createdAt;
  // @ts-expect-error "zzz" n'est pas une clé de Family
  pick(familles[0], ["zzz"]);
});

test("QueryBuilder : valeur contrainte par la colonne, chaînage typé this", () => {
  const qb = new QueryBuilder<Family>();
  expectTypeOf(qb.where("ville", "Lyon")).toEqualTypeOf<QueryBuilder<Family>>();
  expectTypeOf(qb.filter((f) => f.membreCount > 1)).toEqualTypeOf<QueryBuilder<Family>>();
  expectTypeOf(qb.run(familles)).toEqualTypeOf<Family[]>();
  // @ts-expect-error 'quatre' n'est pas assignable à number (Family["membreCount"])
  qb.where("membreCount", "quatre");
  // @ts-expect-error "pays" n'est pas une clé de Family
  qb.where("pays", "FR");
});

test("NoInfer : l'argument par défaut ne peut pas élargir T", () => {
  const theme = withDefault(["sombre", "clair"] as const, "sombre");
  expectTypeOf(theme).toEqualTypeOf<"sombre" | "clair">();
  // @ts-expect-error 'auto' ∉ "sombre" | "clair" — sans NoInfer, T s'élargirait en string et ceci passerait
  withDefault(["sombre", "clair"] as const, "auto");
});

test("chasse au generic de trop : parseJson renvoie unknown, jamais un T fantôme", () => {
  expectTypeOf(parseJson("{}")).toBeUnknown();
  expectTypeOf(identity("ok")).toEqualTypeOf<string>();
  expectTypeOf(identity(42 as const)).toEqualTypeOf<42>();
  expectTypeOf(longueur([1, "a"])).toBeNumber();
  // Le retrait effectif du generic sur `longueur` (a) se juge à la lecture : le correcteur vérifie
  // qu'aucun paramètre de type ne subsiste sur longueur ni parseJson.
});
