// Oracle RUNTIME du lab 10. Ne pas modifier.
import { describe, it, expect } from "vitest";
import { PERMISSIONS, toSummary, type Member } from "@lab/memberDto";

const alice: Member = {
  id: "m1",
  familyId: "f1",
  name: "Alice",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("toSummary", () => {
  it("projette id + name uniquement", () => {
    expect(toSummary(alice)).toEqual({ id: "m1", name: "Alice" });
  });
});

describe("PERMISSIONS — exhaustif, un tableau par rôle", () => {
  it("expose les trois rôles avec des permissions non vides", () => {
    expect(Object.keys(PERMISSIONS).sort()).toEqual(["admin", "enfant", "parent"]);
    expect(PERMISSIONS.admin.length).toBeGreaterThan(0);
    expect(PERMISSIONS.parent.length).toBeGreaterThan(0);
    expect(PERMISSIONS.enfant.length).toBeGreaterThan(0);
  });

  it("admin a plus de permissions qu'enfant (au minimum read)", () => {
    expect(PERMISSIONS.admin).toContain("read");
    expect(PERMISSIONS.enfant).toContain("read");
    expect(PERMISSIONS.admin.length).toBeGreaterThanOrEqual(PERMISSIONS.enfant.length);
  });
});
