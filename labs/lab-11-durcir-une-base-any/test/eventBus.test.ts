// Oracle RUNTIME du lab 11. Ne pas modifier. Le comportement runtime ne change PAS entre
// l'existant et la solution — seule la sécurité de type change. Ce fichier prouve la
// non-régression fonctionnelle.
import { describe, it, expect } from "vitest";
import { EventBus } from "@lab/legacyEventBus";
import { enregistrerNotifications } from "@lab/notifications";

describe("EventBus — comportement runtime inchangé (non-régression)", () => {
  it("enregistrerNotifications (donné, inchangé) fonctionne à l'identique", () => {
    const bus = new EventBus();
    const journal = enregistrerNotifications(bus);
    expect(journal).toEqual(["m1 a rejoint le 2026-01-01", "Nouvelle sortie : Piscine (s1)"]);
  });

  it("plusieurs handlers sur le même événement sont tous appelés, dans l'ordre", () => {
    const bus = new EventBus();
    const appels: string[] = [];
    bus.on("member:left", (p) => appels.push(`1: ${p.memberId}`));
    bus.on("member:left", (p) => appels.push(`2: ${p.memberId}`));
    bus.emit("member:left", { memberId: "m2", reason: "départ" });
    expect(appels).toEqual(["1: m2", "2: m2"]);
  });

  it("un événement sans handler enregistré ne lève pas d'erreur", () => {
    const bus = new EventBus();
    expect(() => bus.emit("sortie:created", { sortieId: "s2", title: "Rando" })).not.toThrow();
  });
});
