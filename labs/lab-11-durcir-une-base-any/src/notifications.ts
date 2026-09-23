// notifications.ts — DONNÉ, déjà correct. Un VRAI consommateur de EventBus, tel qu'il tourne
// aujourd'hui. NE PAS MODIFIER : ce fichier doit compiler à l'identique, avant ET après ton
// intervention sur `legacyEventBus.ts` — c'est la preuve de non-régression.
import { EventBus } from "./legacyEventBus";

export function enregistrerNotifications(bus: EventBus): string[] {
  const journal: string[] = [];

  bus.on("member:joined", (payload) => {
    journal.push(`${payload.memberId} a rejoint le ${payload.joinedAt}`);
  });

  bus.on("sortie:created", (payload) => {
    journal.push(`Nouvelle sortie : ${payload.title} (${payload.sortieId})`);
  });

  bus.emit("member:joined", { memberId: "m1", joinedAt: "2026-01-01" });
  bus.emit("sortie:created", { sortieId: "s1", title: "Piscine" });

  return journal;
}
