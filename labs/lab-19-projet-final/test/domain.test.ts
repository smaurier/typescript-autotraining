// Oracle RUNTIME du lab 19. Ne pas modifier.
import { describe, it, expect, vi } from "vitest";
import { assertNever, err, ok, MemberSchema } from "@lab/types";
import { ApiClient, type FetchFn } from "@lab/apiClient";

const MEMBER_VALIDE = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Alice",
  role: "admin",
};

describe("MemberSchema — validation zod", () => {
  it("accepte un membre valide", () => {
    expect(MemberSchema.safeParse(MEMBER_VALIDE).success).toBe(true);
  });

  it("rejette un rôle inconnu", () => {
    expect(MemberSchema.safeParse({ ...MEMBER_VALIDE, role: "roi" }).success).toBe(false);
  });

  it("rejette un id qui n'est pas un UUID", () => {
    expect(MemberSchema.safeParse({ ...MEMBER_VALIDE, id: "pas-un-uuid" }).success).toBe(false);
  });
});

describe("assertNever", () => {
  it("lève toujours une erreur", () => {
    // Ce fichier .test.ts n'est PAS type-checké (voir test/domain.test-d.ts pour la preuve
    // au niveau des types) — `as never` ici est juste pour appeler la fonction au runtime.
    expect(() => assertNever("valeur-impossible" as never)).toThrow();
  });
});

describe("ok / err — Result discriminé", () => {
  it("ok() construit { ok: true, value }", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err() construit { ok: false, error }", () => {
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });
});

describe("ApiClient.get — jamais de throw, toujours un Result", () => {
  const schemas = { members: MemberSchema };

  it("panne réseau (fetchFn qui rejette) → err({ kind: 'network' })", async () => {
    const fetchFn: FetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const client = new ApiClient("http://api.test", schemas, fetchFn);

    const resultat = await client.get("members", "m1");

    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.error).toEqual({ kind: "network", message: "ECONNREFUSED" });
    }
  });

  it("réponse HTTP en échec → err({ kind: 'http', status })", async () => {
    const fetchFn: FetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const client = new ApiClient("http://api.test", schemas, fetchFn);

    const resultat = await client.get("members", "m1");

    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.error).toEqual({ kind: "http", status: 404 });
    }
  });

  it("réponse qui ne correspond pas au schéma → err({ kind: 'validation' })", async () => {
    const fetchFn: FetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "pas-un-uuid" }) });
    const client = new ApiClient("http://api.test", schemas, fetchFn);

    const resultat = await client.get("members", "m1");

    expect(resultat.ok).toBe(false);
    if (!resultat.ok) {
      expect(resultat.error.kind).toBe("validation");
      expect((resultat.error as { issues: string[] }).issues.length).toBeGreaterThan(0);
    }
  });

  it("réponse valide → ok(donnée validée)", async () => {
    const fetchFn: FetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => MEMBER_VALIDE });
    const client = new ApiClient("http://api.test", schemas, fetchFn);

    const resultat = await client.get("members", "m1");

    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect(resultat.value.name).toBe("Alice");
    }
  });
});
