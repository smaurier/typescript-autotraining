// Oracle RUNTIME du lab 02. Ne pas modifier.
import { describe, it, expect, vi } from "vitest";
import type { Member } from "@lab/members";
import {
  inviteMember,
  isActiveMember,
  notifyActive,
  activeEmails,
  assertDefined,
  firstActive,
} from "@lab/members";

const alice: Member = { id: "m1", email: "alice@tribuzen.app", role: "admin", status: "active", lastSeenAt: "2026-09-01T10:00:00Z" };
const bob: Member = { id: "m2", email: "bob@tribuzen.app", role: "member", status: "pending" };
const chloe: Member = { id: "m3", email: "chloe@tribuzen.app", role: "member", status: "active" }; // active mais jamais vue
const dan: Member = { id: "m4", email: "dan@tribuzen.app", role: "guest", status: "suspended", lastSeenAt: "2026-08-01T00:00:00Z" };

describe("inviteMember — optionnel avec défaut", () => {
  it("crée une invitation pending, rôle member par défaut, token unique", () => {
    const a = inviteMember("a@tribuzen.app");
    const b = inviteMember("b@tribuzen.app");
    expect(a).toMatchObject({ email: "a@tribuzen.app", role: "member", status: "pending" });
    expect(typeof a.token).toBe("string");
    expect(a.token).not.toBe(b.token);
  });

  it("respecte le rôle passé explicitement", () => {
    expect(inviteMember("c@tribuzen.app", "admin").role).toBe("admin");
  });
});

describe("isActiveMember — le corps couvre TOUTES les garanties d'ActiveMember", () => {
  it("vrai seulement si status active ET lastSeenAt présent", () => {
    expect(isActiveMember(alice)).toBe(true);
    expect(isActiveMember(chloe)).toBe(false); // active sans lastSeenAt → pas un ActiveMember
    expect(isActiveMember(bob)).toBe(false);
    expect(isActiveMember(dan)).toBe(false); // lastSeenAt présent mais suspendu
  });
});

describe("notifyActive / activeEmails — callbacks typés", () => {
  it("n'appelle send que pour les membres actifs, avec le membre", () => {
    const send = vi.fn();
    notifyActive([alice, bob, chloe, dan], send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(alice);
  });

  it("activeEmails renvoie les emails des seuls actifs", () => {
    expect(activeEmails([alice, bob, chloe, dan])).toEqual(["alice@tribuzen.app"]);
    expect(activeEmails([bob])).toEqual([]);
  });
});

describe("assertDefined / firstActive — assertion function", () => {
  it("assertDefined lève une erreur nommée sur null/undefined, rien sinon", () => {
    expect(() => assertDefined(null, "membre actif")).toThrow(/membre actif/);
    expect(() => assertDefined(undefined, "token")).toThrow(/token/);
    expect(() => assertDefined(0, "zéro")).not.toThrow(); // 0 est défini
    expect(() => assertDefined("", "vide")).not.toThrow(); // "" est défini
  });

  it("firstActive renvoie le premier actif, ou lève", () => {
    expect(firstActive([bob, alice, chloe])).toBe(alice);
    expect(() => firstActive([bob, chloe])).toThrow();
  });
});
