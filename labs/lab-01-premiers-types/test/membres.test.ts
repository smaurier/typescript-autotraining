// Oracle RUNTIME du lab 01. Ne pas modifier : si un test te semble faux, c'est un sujet
// pour le correcteur, pas une ligne à commenter.
import { describe, it, expect, vi, afterEach } from "vitest";
import { isRawMember, chargerMembres } from "@lab/membres";

const brut = { id: "m1", name: "Alice", email: "alice@tribuzen.app", age: 34, active: true };

describe("isRawMember — valide la forme BRUTE renvoyée par l'API", () => {
  it("accepte un membre brut complet", () => {
    expect(isRawMember(brut)).toBe(true);
  });

  it("rejette null et les primitifs", () => {
    expect(isRawMember(null)).toBe(false);
    expect(isRawMember(undefined)).toBe(false);
    expect(isRawMember("alice")).toBe(false);
    expect(isRawMember(42)).toBe(false);
  });

  it("rejette un `age` en string (API laxiste)", () => {
    expect(isRawMember({ ...brut, age: "34" })).toBe(false);
  });

  it("rejette un objet sans `active`", () => {
    const { active: _active, ...sansActive } = brut;
    expect(isRawMember(sansActive)).toBe(false);
  });

  it("rejette `isActive` à la place de `active` : ce n'est pas encore un Member", () => {
    const { active: _active, ...reste } = brut;
    expect(isRawMember({ ...reste, isActive: true })).toBe(false);
  });
});

describe("chargerMembres — unknown + narrowing + remap active → isActive", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubFetch = (payload: unknown) => {
    const fetchMock = vi.fn(async () => ({ json: async () => payload }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("ne garde que les formes conformes et remappe active → isActive", async () => {
    stubFetch([
      brut,
      { id: "m2", name: "Bob", email: "bob@tribuzen.app", age: "12", active: false }, // age string → écarté
      "bruit", // pas un objet → écarté
    ]);
    await expect(chargerMembres()).resolves.toEqual([
      { id: "m1", name: "Alice", email: "alice@tribuzen.app", age: 34, isActive: true },
    ]);
  });

  it("rejette une réponse qui n'est pas un tableau", async () => {
    stubFetch({ members: [] });
    await expect(chargerMembres()).rejects.toThrow();
  });

  it("appelle l'URL construite depuis la config", async () => {
    const fetchMock = stubFetch([]);
    await chargerMembres();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/members");
  });
});
