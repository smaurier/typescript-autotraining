// Oracle RUNTIME du lab 04. Ne pas modifier.
import { describe, it, expect } from "vitest";
import type { Invitation, Notification } from "@lab/invitation";
import { assertNever, resumer, envoyer, estAccepted } from "@lab/invitation";

type Pending = Extract<Invitation, { status: "pending" }>;
type Accepted = Extract<Invitation, { status: "accepted" }>;
type Expired = Extract<Invitation, { status: "expired" }>;

const pending: Pending = { status: "pending", sentAt: new Date("2026-07-01T12:00:00Z") };
const accepted: Accepted = { status: "accepted", memberId: "usr-42", acceptedAt: new Date("2026-07-03T12:00:00Z") };
const expired: Expired = { status: "expired", expiredAt: new Date("2026-06-20T12:00:00Z") };

describe("resumer — un résumé par variante, sans jamais lire un champ absent", () => {
  it("pending : mentionne la date d'envoi", () => {
    expect(resumer(pending)).toContain(pending.sentAt.toLocaleDateString("fr"));
  });
  it("accepted : mentionne le memberId", () => {
    expect(resumer(accepted)).toContain("usr-42");
  });
  it("expired : mentionne la date d'expiration", () => {
    expect(resumer(expired)).toContain(expired.expiredAt.toLocaleDateString("fr"));
  });
  it("les trois résumés sont distincts et non vides", () => {
    const r = [resumer(pending), resumer(accepted), resumer(expired)];
    expect(r.every((s) => s.length > 0)).toBe(true);
    expect(new Set(r).size).toBe(3);
  });
});

describe("assertNever — le filet de sécurité", () => {
  it("lève une erreur qui sérialise le cas non géré", () => {
    expect(() => assertNever({ status: "revoked" } as never)).toThrow(/revoked/);
  });
});

describe("envoyer — même pattern, autre tag (kind)", () => {
  it("email : destinataire et sujet", () => {
    const n: Notification = { kind: "email", to: "alice@tribuzen.app", subject: "Bienvenue", body: "…" };
    const out = envoyer(n);
    expect(out).toContain("alice@tribuzen.app");
    expect(out).toContain("Bienvenue");
  });
  it("sms : numéro et message", () => {
    const out = envoyer({ kind: "sms", phone: "+33600000000", message: "Code 1234" });
    expect(out).toContain("+33600000000");
    expect(out).toContain("Code 1234");
  });
  it("push : device et titre", () => {
    const out = envoyer({ kind: "push", deviceId: "dev-1", title: "Nouveau membre", body: "…" });
    expect(out).toContain("dev-1");
    expect(out).toContain("Nouveau membre");
  });
});

describe("estAccepted — type guard avec predicate `is`", () => {
  it("filtre les acceptées et rend memberId lisible sans cast", () => {
    const toutes: Invitation[] = [pending, accepted, expired];
    const acceptees = toutes.filter(estAccepted);
    expect(acceptees).toEqual([accepted]);
    expect(acceptees.map((i) => i.memberId)).toEqual(["usr-42"]);
  });
});
