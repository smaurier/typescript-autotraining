// Oracle RUNTIME du lab 06. Ne pas modifier.
import { describe, it, expect } from "vitest";
import type { Member, Family } from "@lab/data";
import { ok, fail, getById, Repository } from "@lab/data";

const membres: Member[] = [
  { id: "m1", name: "Cléo", role: "mod" },
  { id: "m2", name: "Bob", role: "member" },
];
const familles: Family[] = [{ id: "f1", label: "Les Dupont" }];

describe("ApiResponse — ok / fail", () => {
  it("ok enveloppe la donnée sans erreur", () => {
    expect(ok(membres[0])).toEqual({ data: membres[0], error: null });
  });
  it("fail porte le message et aucune donnée", () => {
    expect(fail<Member>("Membre introuvable")).toEqual({ data: null, error: "Membre introuvable" });
  });
});

describe("getById — une seule fonction pour toutes les entités", () => {
  it("retrouve un membre et une famille avec la même fonction", () => {
    expect(getById(membres, "m2")).toBe(membres[1]);
    expect(getById(familles, "f1")).toBe(familles[0]);
  });
  it("renvoie undefined si l'id est inconnu", () => {
    expect(getById(membres, "zzz")).toBeUndefined();
  });
});

describe("Repository<T> — CRUD générique en mémoire", () => {
  it("create génère un id string unique et stocke l'entité", () => {
    const repo = new Repository<Member>();
    const a = repo.create({ name: "Cléo", role: "mod" });
    const b = repo.create({ name: "Bob", role: "member" });
    expect(typeof a.id).toBe("string");
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ name: "Cléo", role: "mod" });
    expect(repo.findAll()).toEqual([a, b]);
    expect(repo.findById(a.id)).toEqual(a);
  });

  it("update fusionne le patch et conserve l'id ; inconnu → undefined", () => {
    const repo = new Repository<Member>();
    const a = repo.create({ name: "Cléo", role: "mod" });
    expect(repo.update(a.id, { role: "admin" })).toEqual({ id: a.id, name: "Cléo", role: "admin" });
    expect(repo.findById(a.id)?.role).toBe("admin");
    expect(repo.update("zzz", { role: "admin" })).toBeUndefined();
  });

  it("remove renvoie true puis false, et l'entité disparaît", () => {
    const repo = new Repository<Family>();
    const f = repo.create({ label: "Les Dupont" });
    expect(repo.remove(f.id)).toBe(true);
    expect(repo.remove(f.id)).toBe(false);
    expect(repo.findAll()).toEqual([]);
  });

  it("getProp lit une propriété par sa clé ; inconnu → undefined", () => {
    const repo = new Repository<Member>();
    const a = repo.create({ name: "Cléo", role: "mod" });
    expect(repo.getProp(a.id, "role")).toBe("mod");
    expect(repo.getProp(a.id, "name")).toBe("Cléo");
    expect(repo.getProp("zzz", "role")).toBeUndefined();
  });
});
