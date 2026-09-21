// members.ts — STARTER (volontairement non typé : en `strict`, ça ne compile pas)
// C'est ICI que tu écris. Les tests (test/) importent ce fichier via `@lab/members`.
// Exports attendus : Role, Invitation, Member, ActiveMember, Notifier,
// inviteMember, isActiveMember, notifyActive, activeEmails, assertDefined, firstActive.

export function inviteMember(email, role) {
  return { email, role: role ?? "member", token: crypto.randomUUID(), status: "pending" };
}

export function isActiveMember(m) {
  return m.status === "active" && m.lastSeenAt !== undefined;
}

export function notifyActive(members, send) {
  members.filter(isActiveMember).forEach((m) => send(m));
}
