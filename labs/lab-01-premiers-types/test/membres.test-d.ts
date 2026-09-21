// Oracle de TYPES du lab 01 (vitest --typecheck). Ces tests ne s'exécutent pas : ils
// compilent, ou pas. Une ligne `@ts-expect-error` qui ne produit PAS d'erreur = échec.
import { expectTypeOf, test } from "vitest";
import type { Member, RawMember, AppConfig } from "@lab/membres";
import { isRawMember, chargerMembres, rawConfig } from "@lab/membres";

test("Member : les cinq champs, avec les bons primitifs", () => {
  expectTypeOf<Member>().toEqualTypeOf<{
    id: string;
    name: string;
    email: string;
    age: number;
    isActive: boolean;
  }>();
});

test("RawMember : la forme réseau expose `active`, pas `isActive`", () => {
  expectTypeOf<RawMember>().toHaveProperty("active").toEqualTypeOf<boolean>();
  expectTypeOf<RawMember>().not.toHaveProperty("isActive");
});

test("isRawMember : prend `unknown` (jamais `any`) et garde RawMember", () => {
  expectTypeOf(isRawMember).parameter(0).toBeUnknown();
  expectTypeOf(isRawMember).guards.toEqualTypeOf<RawMember>();
});

test("chargerMembres : Promise<Member[]>", () => {
  expectTypeOf(chargerMembres).returns.resolves.toEqualTypeOf<Member[]>();
});

test("AppConfig.env est l'union fermée des trois environnements", () => {
  expectTypeOf<AppConfig["env"]>().toEqualTypeOf<"development" | "staging" | "production">();
});

test("satisfies valide la forme SANS écraser l'inférence : env reste le literal", () => {
  expectTypeOf(rawConfig.env).toEqualTypeOf<"development">();
  expectTypeOf(rawConfig).toMatchTypeOf<AppConfig>();
});

test("une faute de frappe sur un champ de Member est refusée par le compilateur", async () => {
  const membres = await chargerMembres();
  // @ts-expect-error `naem` n'existe pas sur Member
  membres[0].naem;
});
