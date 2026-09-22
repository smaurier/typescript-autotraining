// Oracle RUNTIME du lab 07. Ne pas modifier.
import { describe, it, expect } from "vitest";
import { familles, pick, QueryBuilder, withDefault, longueur, identity, parseJson } from "@lab/generics";

describe("pick maison", () => {
  it("ne garde que les clés demandées", () => {
    expect(pick(familles[0], ["nom", "ville"])).toEqual({ nom: "Durand", ville: "Lyon" });
  });
  it("ne mute pas la source", () => {
    const src = { ...familles[1] };
    pick(src, ["id"]);
    expect(src).toEqual(familles[1]);
  });
});

describe("QueryBuilder<T>", () => {
  it("where + filter + run : chaîne fluide, prédicats en ET", () => {
    const out = new QueryBuilder<typeof familles[number]>()
      .where("ville", "Lyon")
      .filter((f) => f.membreCount >= 4)
      .run(familles);
    expect(out.map((f) => f.nom)).toEqual(["Durand", "Bernard"]);
  });
  it("sans prédicat, run renvoie tout ; where sans correspondance renvoie vide", () => {
    expect(new QueryBuilder<typeof familles[number]>().run(familles)).toEqual(familles);
    expect(new QueryBuilder<typeof familles[number]>().where("ville", "Nantes").run(familles)).toEqual([]);
  });
});

describe("withDefault", () => {
  it("renvoie le défaut s'il est dans les options, sinon la première", () => {
    expect(withDefault(["sombre", "clair"] as const, "sombre")).toBe("sombre");
    expect(withDefault(["sombre", "clair"] as const, "clair")).toBe("clair");
    expect(withDefault([1, 2, 3], 0)).toBe(1);
  });
});

describe("chasse au generic de trop (comportement)", () => {
  it("longueur, identity, parseJson font ce qu'on attend", () => {
    expect(longueur([1, "a", null])).toBe(3);
    expect(identity("ok")).toBe("ok");
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
  });
});
