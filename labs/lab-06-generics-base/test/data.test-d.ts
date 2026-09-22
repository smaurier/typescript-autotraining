// Oracle de TYPES du lab 06 (vitest --typecheck).
import { expectTypeOf, test } from "vitest";
import type { BaseEntity, Member, Family, ApiResponse } from "@lab/data";
import { ok, fail, getById, Repository } from "@lab/data";

test("BaseEntity : le contrat minimal, et Member/Family l'étendent", () => {
  expectTypeOf<BaseEntity>().toEqualTypeOf<{ id: string }>();
  expectTypeOf<Member>().toMatchTypeOf<BaseEntity>();
  expectTypeOf<Family>().toMatchTypeOf<BaseEntity>();
});

test("ApiResponse<T> : un seul type, data varie, error est commun", () => {
  expectTypeOf<ApiResponse<Member>>().toEqualTypeOf<{ data: Member | null; error: string | null }>();
  expectTypeOf<ApiResponse<Family>>().toEqualTypeOf<{ data: Family | null; error: string | null }>();
});

test("ok infère T depuis l'argument ; fail le reçoit explicitement", () => {
  const m = {} as Member;
  expectTypeOf(ok(m)).toEqualTypeOf<ApiResponse<Member>>();
  expectTypeOf(fail<Family>("x")).toEqualTypeOf<ApiResponse<Family>>();
});

test("getById : contraint à BaseEntity, retour T précis | undefined", () => {
  expectTypeOf(getById([] as Member[], "m1")).toEqualTypeOf<Member | undefined>();
  expectTypeOf(getById([] as Family[], "f1")).toEqualTypeOf<Family | undefined>();
  // @ts-expect-error un objet sans `id` ne satisfait pas la contrainte
  getById([{ name: "x" }], "x");
});

test("Repository<T> : create sans id, update partiel, getProp indexé par clé", () => {
  const repo = new Repository<Member>();
  expectTypeOf(repo.create).parameter(0).toEqualTypeOf<Omit<Member, "id">>();
  expectTypeOf(repo.create).returns.toEqualTypeOf<Member>();
  expectTypeOf(repo.update).parameter(1).toEqualTypeOf<Partial<Member>>();
  expectTypeOf(repo.update).returns.toEqualTypeOf<Member | undefined>();
  expectTypeOf(repo.findAll).returns.toEqualTypeOf<Member[]>();
  expectTypeOf(repo.findById).returns.toEqualTypeOf<Member | undefined>();
  expectTypeOf(repo.remove).returns.toBeBoolean();
  expectTypeOf(repo.getProp("m1", "role")).toEqualTypeOf<Member["role"] | undefined>();
  expectTypeOf(repo.getProp("m1", "name")).toEqualTypeOf<string | undefined>();

  // @ts-expect-error create refuse un id fourni à la main
  repo.create({ id: "m9", name: "x", role: "mod" });
  // @ts-expect-error "email" n'est pas une clé de Member
  repo.getProp("m1", "email");
  // @ts-expect-error une entité sans id ne peut pas être stockée
  new Repository<{ name: string }>();
});
