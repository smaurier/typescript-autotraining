// Oracle de TYPES du lab 19. Ne pas modifier.
import { expectTypeOf, test } from "vitest";
import { assertNever } from "@lab/types";
import type {
  ApiError,
  CreateMemberDto,
  FamilyId,
  Invitation,
  Member,
  MemberId,
  MemberPatch,
  MemberSummary,
  Result,
} from "@lab/types";
import { ApiClient } from "@lab/apiClient";
import { MemberSchema } from "@lab/types";

test("MemberId est brandé — une chaîne brute ou un autre id ne sont pas interchangeables", () => {
  function accepte(_id: MemberId) {}
  const idFamille = {} as FamilyId;
  const chaineBrute = "" as string;

  // @ts-expect-error un FamilyId n'est pas un MemberId (brands distincts)
  accepte(idFamille);
  // @ts-expect-error une chaîne brute n'est pas un MemberId
  accepte(chaineBrute);
});

test("CreateMemberDto : Member sans id", () => {
  const dto: CreateMemberDto = { name: "Alice", role: "admin" };
  expectTypeOf(dto).toEqualTypeOf<CreateMemberDto>();
  // @ts-expect-error id est généré par le serveur
  const avecId: CreateMemberDto = { id: "x", name: "Alice", role: "admin" };
});

test("MemberSummary : uniquement id + name", () => {
  const resume: MemberSummary = { id: "id" as MemberId, name: "Alice" };
  expectTypeOf(resume).toEqualTypeOf<MemberSummary>();
  // @ts-expect-error role n'est pas dans le résumé
  const trop: MemberSummary = { id: "id" as MemberId, name: "Alice", role: "admin" };
});

test("MemberPatch : id requis, le reste optionnel", () => {
  const patchMinimal: MemberPatch = { id: "id" as MemberId };
  const patchNom: MemberPatch = { id: "id" as MemberId, name: "Bob" };
  expectTypeOf(patchMinimal).toEqualTypeOf<MemberPatch>();
  expectTypeOf(patchNom).toEqualTypeOf<MemberPatch>();
  // @ts-expect-error id est requis, un patch doit savoir QUI il patche
  const sansId: MemberPatch = { name: "Bob" };
});

test("Invitation : exhaustivité forcée par assertNever", () => {
  function libelle(inv: Invitation): string {
    switch (inv.status) {
      case "pending":
        return "en attente";
      case "accepted":
        return "acceptée";
      // "declined" volontairement absent ci-dessous : inv n'est PAS `never` à ce point.
      default:
        // @ts-expect-error un cas ("declined") n'est pas traité : inv n'est pas `never` ici
        return assertNever(inv);
    }
  }
  expectTypeOf(libelle).returns.toBeString();
});

test("Result : discriminé, `value` uniquement si ok, `error` uniquement si non-ok", () => {
  const r = {} as Result<Member, ApiError>;
  if (r.ok) {
    expectTypeOf(r.value).toEqualTypeOf<Member>();
  } else {
    expectTypeOf(r.error).toEqualTypeOf<ApiError>();
  }
});

test("ApiClient.get refuse une ressource inconnue de la carte de schémas", () => {
  const client = new ApiClient("http://api.test", { members: MemberSchema }, async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
  }));

  client.get("members", "m1");
  // @ts-expect-error "dragons" n'existe pas dans la carte de schémas
  client.get("dragons", "d1");
});
