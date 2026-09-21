// Oracle de TYPES du lab 02 (vitest --typecheck).
import { expectTypeOf, test } from "vitest";
import type { Role, Invitation, Member, ActiveMember, Notifier } from "@lab/members";
import {
  inviteMember,
  isActiveMember,
  notifyActive,
  activeEmails,
  assertDefined,
  firstActive,
} from "@lab/members";

test("Role : union fermée de quatre littéraux", () => {
  expectTypeOf<Role>().toEqualTypeOf<"owner" | "admin" | "member" | "guest">();
});

test("Invitation naît toujours pending (literal, pas string)", () => {
  expectTypeOf<Invitation["status"]>().toEqualTypeOf<"pending">();
  expectTypeOf<Invitation["role"]>().toEqualTypeOf<Role>();
});

test("Member : lastSeenAt optionnel ; ActiveMember le PROUVE présent et status active", () => {
  expectTypeOf<Member["lastSeenAt"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<ActiveMember>().toMatchTypeOf<Member>();
  expectTypeOf<ActiveMember["status"]>().toEqualTypeOf<"active">();
  expectTypeOf<ActiveMember["lastSeenAt"]>().toEqualTypeOf<string>();
});

test("inviteMember : email requis, rôle optionnel, retourne Invitation", () => {
  expectTypeOf(inviteMember).parameters.toEqualTypeOf<[email: string, role?: Role]>();
  expectTypeOf(inviteMember).returns.toEqualTypeOf<Invitation>();
});

test("isActiveMember : type guard Member → ActiveMember", () => {
  expectTypeOf(isActiveMember).parameter(0).toEqualTypeOf<Member>();
  expectTypeOf(isActiveMember).guards.toEqualTypeOf<ActiveMember>();
});

test("Notifier et notifyActive : callback typé, retour void", () => {
  expectTypeOf<Notifier>().toEqualTypeOf<(m: ActiveMember) => void>();
  expectTypeOf(notifyActive).parameters.toEqualTypeOf<[members: Member[], send: Notifier]>();
  expectTypeOf(notifyActive).returns.toBeVoid();
});

test("activeEmails : contextual typing → string[] sans annotation", () => {
  expectTypeOf(activeEmails).returns.toEqualTypeOf<string[]>();
});

test("assertDefined rétrécit tout le code qui suit l'appel", () => {
  const v = Math.random() > 0.5 ? "x" : undefined;
  assertDefined(v, "v");
  expectTypeOf(v).toEqualTypeOf<string>();

  const n = Math.random() > 0.5 ? 42 : null;
  assertDefined(n, "n");
  expectTypeOf(n).toBeNumber();
});

test("firstActive renvoie un ActiveMember, plus de | undefined", () => {
  expectTypeOf(firstActive).returns.toEqualTypeOf<ActiveMember>();
});

test("le compilateur refuse un rôle inconnu et un email non-string", () => {
  // @ts-expect-error rôle inexistant
  inviteMember("b@tribuzen.app", "root");
  // @ts-expect-error email doit être string
  inviteMember(42);
});
