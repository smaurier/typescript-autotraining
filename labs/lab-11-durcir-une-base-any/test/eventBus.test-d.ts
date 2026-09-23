// Oracle de TYPES du lab 11. L'EXISTANT (any partout) compile aussi ce fichier SANS jamais
// signaler d'erreur — ces `@ts-expect-error` ne passent QUE sur la version durcie : c'est
// précisément la preuve que le `any` masquait ces fautes.
import { test } from "vitest";
import { EventBus } from "@lab/legacyEventBus";

test("emit refuse un payload qui ne correspond pas à l'événement", () => {
  const bus = new EventBus();
  // @ts-expect-error "member:joined" attend { memberId, joinedAt }, pas { sortieId, title }
  bus.emit("member:joined", { sortieId: "s1", title: "Piscine" });
});

test("emit refuse un événement inconnu", () => {
  const bus = new EventBus();
  // @ts-expect-error "family:created" n'existe pas dans AppEvents
  bus.emit("family:created", { familyId: "f1" });
});

test("on refuse un handler dont le payload ne correspond pas à l'événement", () => {
  const bus = new EventBus();
  // @ts-expect-error le payload de "sortie:created" n'a pas `reason`
  bus.on("sortie:created", (payload: { reason: string }) => {});
});

test("on infère correctement le type du payload depuis le nom de l'événement", () => {
  const bus = new EventBus();
  bus.on("member:joined", (payload) => {
    // Si `payload` était encore `any`, cette faute de frappe compilerait sans broncher.
    // @ts-expect-error `memberId`, pas `memberld`
    const _typo = payload.memberld;
  });
});
