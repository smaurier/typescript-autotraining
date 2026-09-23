// Oracle RUNTIME du lab 09. Ne pas modifier.
import { describe, it, expect } from "vitest";
import { ROLES } from "@lab/types";
import { creerFamilleVide, estUnRoleValide, evenementsAVenir, nomsDesMembres } from "@lab/services/familyService";
import type { Event, Member } from "@lab/types";

describe("ROLES — la VALEUR re-exportée par le barrel (pas un type)", () => {
  it("existe réellement au runtime, avec les trois rôles dans l'ordre", () => {
    expect(ROLES).toEqual(["admin", "parent", "enfant"]);
  });
});

describe("estUnRoleValide — utilise ROLES importé depuis le barrel", () => {
  it("accepte les trois rôles connus, rejette le reste", () => {
    expect(estUnRoleValide("admin")).toBe(true);
    expect(estUnRoleValide("parent")).toBe(true);
    expect(estUnRoleValide("enfant")).toBe(true);
    expect(estUnRoleValide("root")).toBe(false);
  });
});

describe("creerFamilleVide", () => {
  it("crée une famille sans membre, avec la date fournie", () => {
    const famille = creerFamilleVide("f1", "Martin", "2026-01-01T00:00:00.000Z");
    expect(famille).toEqual({ id: "f1", name: "Martin", memberIds: [], createdAt: "2026-01-01T00:00:00.000Z" });
  });
});

describe("nomsDesMembres", () => {
  it("extrait les noms, dans l'ordre donné", () => {
    const membres: Member[] = [
      { id: "m1", name: "Alice", role: "admin", familyId: "f1" },
      { id: "m2", name: "Bob", role: "enfant", familyId: "f1" },
    ];
    expect(nomsDesMembres(membres)).toEqual(["Alice", "Bob"]);
  });
});

describe("evenementsAVenir", () => {
  it("filtre le passé et trie par date croissante", () => {
    const evenements: Event[] = [
      { id: "e1", title: "Anniversaire", familyId: "f1", startsAt: "2026-06-01" },
      { id: "e2", title: "Passé", familyId: "f1", startsAt: "2020-01-01" },
      { id: "e3", title: "Piscine", familyId: "f1", startsAt: "2026-03-01" },
    ];
    const resultat = evenementsAVenir(evenements, "2026-01-01");
    expect(resultat.map((e) => e.title)).toEqual(["Piscine", "Anniversaire"]);
  });
});
