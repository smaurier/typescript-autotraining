// Oracle RUNTIME du lab 05. Ne pas modifier.
import { describe, it, expect } from "vitest";
import { Member } from "@lab/member";
import { Family } from "@lab/family";
import type { BaseEntity } from "@lab/base-entity";

const alice = () => Member.create("Alice", "alice@tribuzen.app", "tok-123");

describe("Member — fabrique, label, confidentialité du #sessionToken", () => {
  it("create : id string non vide, createdAt Date, label() = name", () => {
    const m = alice();
    expect(typeof m.id).toBe("string");
    expect(m.id.length).toBeGreaterThan(0);
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.label()).toBe("Alice");
    expect(m.name).toBe("Alice");
  });

  it("deux create() donnent deux ids différents", () => {
    expect(alice().id).not.toBe(alice().id);
  });

  it("toJSON : id, createdAt ISO, name, email — et rien qui ressemble au token", () => {
    const m = alice();
    expect(m.toJSON()).toEqual({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      name: "Alice",
      email: "alice@tribuzen.app",
    });
    expect(JSON.stringify(m)).not.toContain("tok-123");
    expect(JSON.stringify(m)).not.toMatch(/token/i);
  });

  it("#private : le token est inaccessible même en cassant le typage", () => {
    const m = alice() as unknown as Record<string, unknown>;
    expect(m.sessionToken).toBeUndefined();
    expect(m["#sessionToken"]).toBeUndefined();
    expect(Object.keys(m)).not.toContain("sessionToken");
  });

  it("hasValidSession : seul endroit qui lit le token", () => {
    const m = alice();
    expect(m.hasValidSession("tok-123")).toBe(true);
    expect(m.hasValidSession("tok-999")).toBe(false);
  });

  it("ageMs : durée depuis createdAt, jamais négative", () => {
    const m = alice();
    expect(m.ageMs()).toBeGreaterThanOrEqual(0);
    expect(m.ageMs()).toBeLessThan(60_000);
  });
});

describe("Family — agrégat, chaînage, sérialisation", () => {
  it("new Family(id, createdAt, label) : label() renvoie le libellé", () => {
    const f = new Family("f1", new Date("2026-01-01T00:00:00Z"), "Famille Smith");
    expect(f.label()).toBe("Famille Smith");
    expect(f.id).toBe("f1");
  });

  it("addMember retourne LA MÊME instance (chaînage)", () => {
    const f = new Family("f1", new Date(), "Famille Smith");
    const a = alice();
    expect(f.addMember(a)).toBe(f);
    expect(f.addMember(alice()).addMember(alice())).toBe(f);
  });

  it("toJSON : id, createdAt ISO, label, memberIds des membres ajoutés", () => {
    const a = alice();
    const b = Member.create("Bob", "bob@tribuzen.app", "tok-b");
    const f = new Family("f1", new Date("2026-01-01T00:00:00Z"), "Famille Smith").addMember(a).addMember(b);
    expect(f.toJSON()).toEqual({
      id: "f1",
      createdAt: "2026-01-01T00:00:00.000Z",
      label: "Famille Smith",
      memberIds: [a.id, b.id],
    });
  });
});

describe("Polymorphisme — traiter toute entité via le contrat commun", () => {
  it("un tableau de BaseEntity accepte Member et Family, label() est résolu par le type concret", () => {
    const a = alice();
    const f = new Family("f1", new Date(), "Famille Smith").addMember(a);
    const entities: BaseEntity[] = [a, f];
    expect(entities.map((e) => e.label())).toEqual(["Alice", "Famille Smith"]);
    for (const e of entities) {
      const json = e.toJSON();
      expect(typeof json.id).toBe("string");
      expect(typeof json.createdAt).toBe("string");
    }
  });
});
