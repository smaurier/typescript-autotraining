// Oracle de TYPES du lab 10. `Member` est la source unique — tout le reste doit être DÉRIVÉ
// avec les utility types intégrés (Omit/Partial/Pick/indexed access/Record).
import { expectTypeOf, test } from "vitest";
import { toSummary, type CreateMemberDto, type MemberRole, type MemberSummary, type MemberUpdate, type Permission } from "@lab/memberDto";

test("CreateMemberDto : Member sans id ni createdAt", () => {
  const dto: CreateMemberDto = { familyId: "f1", name: "Alice", role: "admin" };
  expectTypeOf(dto).toEqualTypeOf<CreateMemberDto>();
  // @ts-expect-error id est généré par le serveur, pas dans CreateMemberDto
  const avecId: CreateMemberDto = { id: "m1", familyId: "f1", name: "Alice", role: "admin" };
});

test("MemberUpdate : les mêmes champs éditables que CreateMemberDto, tous optionnels", () => {
  const patchVide: MemberUpdate = {};
  const patchNom: MemberUpdate = { name: "Bob" };
  expectTypeOf(patchVide).toEqualTypeOf<MemberUpdate>();
  expectTypeOf(patchNom).toEqualTypeOf<MemberUpdate>();
  // @ts-expect-error id ne doit jamais devenir un champ optionnel-éditable
  const patchId: MemberUpdate = { id: "m1" };
});

test("MemberSummary : uniquement id + name", () => {
  const resume: MemberSummary = { id: "m1", name: "Alice" };
  expectTypeOf(resume).toEqualTypeOf<MemberSummary>();
  // @ts-expect-error role n'est pas dans le résumé
  const trop: MemberSummary = { id: "m1", name: "Alice", role: "admin" };
});

test("MemberRole : dérivé de Member par indexed access", () => {
  expectTypeOf<MemberRole>().toEqualTypeOf<"admin" | "parent" | "enfant">();
  // @ts-expect-error "root" n'est pas un MemberRole
  const mauvais: MemberRole = "root";
});

test("PERMISSIONS : Record<MemberRole, Permission[]> exhaustif — une clé manquante ne compile pas", () => {
  // @ts-expect-error il manque le rôle "enfant"
  const incomplet: Record<MemberRole, Permission[]> = { admin: ["read"], parent: ["read"] };
});

test("toSummary retourne exactement un MemberSummary", () => {
  expectTypeOf(toSummary).returns.toEqualTypeOf<MemberSummary>();
});
