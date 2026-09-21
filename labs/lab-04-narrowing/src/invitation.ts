// invitation.ts — STARTER (squelette à compléter, pas de gap-fill : chaque type et
// chaque fonction s'écrivent depuis ce point de départ)
// Exports attendus par l'oracle via `@lab/invitation` :
//   Invitation, assertNever, resumer, Notification, envoyer, estAccepted

// TODO 1 — modéliser Invitation en union discriminée (tag : status)
export type Invitation = unknown; // à remplacer

// TODO 2 — util d'exhaustivité (fourni : c'est le filet de sécurité, pas l'exercice)
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// TODO 3 — résumé exhaustif d'une invitation
export function resumer(inv: Invitation): string {
  // switch sur inv.status, narrowing par variante, default: assertNever(inv)
  return "";
}

// TODO 4 — type Notification (tag : kind — email | sms | push) + fonction envoyer(n): string

// TODO 5 — type guard estAccepted(inv): inv is <la variante acceptée> (Extract)
