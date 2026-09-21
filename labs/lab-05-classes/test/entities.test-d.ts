// Oracle de TYPES du lab 05 (vitest --typecheck, tsconfig en noImplicitOverride).
import { expectTypeOf, test } from "vitest";
import type { Serializable } from "@lab/serializable";
import { BaseEntity } from "@lab/base-entity";
import { Member } from "@lab/member";
import { Family } from "@lab/family";

test("Serializable : un seul contrat, toJSON() → Record<string, unknown>", () => {
  expectTypeOf<Serializable>().toEqualTypeOf<{ toJSON(): Record<string, unknown> }>();
});

test("BaseEntity est abstraite : non instanciable", () => {
  // @ts-expect-error classe abstraite
  new BaseEntity("x", new Date());
});

test("Member et Family sont des BaseEntity et honorent Serializable", () => {
  expectTypeOf<Member>().toMatchTypeOf<BaseEntity>();
  expectTypeOf<Family>().toMatchTypeOf<BaseEntity>();
  expectTypeOf<Member>().toMatchTypeOf<Serializable>();
  expectTypeOf<Family>().toMatchTypeOf<Serializable>();
});

test("identité readonly, email private, token invisible au type", () => {
  const m = {} as Member;
  // @ts-expect-error id est readonly
  m.id = "autre";
  // @ts-expect-error createdAt est readonly
  m.createdAt = new Date();
  // @ts-expect-error email est private
  m.email;
  // @ts-expect-error #sessionToken n'existe pas hors de la classe
  m.sessionToken;
  m.name = "Alice"; // name est public et modifiable
});

test("signatures : create, label, hasValidSession, ageMs", () => {
  expectTypeOf(Member.create).parameters.toEqualTypeOf<[name: string, email: string, token: string]>();
  expectTypeOf(Member.create).returns.toEqualTypeOf<Member>();
  const m = {} as Member;
  expectTypeOf(m.label).returns.toBeString();
  expectTypeOf(m.hasValidSession).returns.toBeBoolean();
  expectTypeOf(m.ageMs).returns.toBeNumber();
  expectTypeOf(m.toJSON).returns.toEqualTypeOf<Record<string, unknown>>();
});

test("addMember retourne `this` : le chaînage survit à une sous-classe", () => {
  const f = {} as Family;
  expectTypeOf(f.addMember).parameter(0).toEqualTypeOf<Member>();
  expectTypeOf(f.addMember).returns.toEqualTypeOf<Family>();

  class VipFamily extends Family {
    vip = true;
  }
  const v = {} as VipFamily;
  // Si addMember renvoyait `Family` au lieu de `this`, ceci échouerait.
  expectTypeOf(v.addMember).returns.toEqualTypeOf<VipFamily>();
});
