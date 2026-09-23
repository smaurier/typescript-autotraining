// Oracle de TYPES du lab 09 (vitest --typecheck, tsconfig en verbatimModuleSyntax : mélanger
// export type et export d'une valeur dans le barrel est une erreur de compilation si c'est
// fait dans le mauvais sens).
import { expectTypeOf, test } from "vitest";
import type { Event, Family, Member, Role } from "@lab/types";
import { ROLES } from "@lab/types";
import { creerFamilleVide, estUnRoleValide } from "@lab/services/familyService";

test("Family : exactement id/name/memberIds/createdAt, re-exportée type-only", () => {
  const f: Family = { id: "f1", name: "Martin", memberIds: [], createdAt: "2026-01-01" };
  expectTypeOf(f).toEqualTypeOf<Family>();
  // @ts-expect-error champ manquant
  const incomplete: Family = { id: "f1", name: "Martin" };
});

test("Role : union exacte des trois littéraux, dérivée du barrel", () => {
  expectTypeOf<Role>().toEqualTypeOf<"admin" | "parent" | "enfant">();
  // @ts-expect-error "root" n'est pas un Role
  const mauvais: Role = "root";
});

test("Member et Event : formes exactes re-exportées par le barrel", () => {
  const m: Member = { id: "m1", name: "Alice", role: "admin", familyId: "f1" };
  expectTypeOf(m).toEqualTypeOf<Member>();
  const e: Event = { id: "e1", title: "Piscine", familyId: "f1", startsAt: "2026-01-01" };
  expectTypeOf(e).toEqualTypeOf<Event>();
});

test("ROLES : une VALEUR readonly, pas un type — accessible au runtime depuis le barrel", () => {
  expectTypeOf(ROLES).toEqualTypeOf<readonly ["admin", "parent", "enfant"]>();
});

test("estUnRoleValide : type-guard réel — narrows une chaîne en Role", () => {
  const entree: string = "admin";
  if (estUnRoleValide(entree)) {
    expectTypeOf(entree).toEqualTypeOf<Role>();
  }
});

test("creerFamilleVide retourne un Family complet", () => {
  expectTypeOf(creerFamilleVide).returns.toEqualTypeOf<Family>();
});
