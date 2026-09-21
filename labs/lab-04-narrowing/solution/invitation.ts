// invitation.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// ─── TODO 1 — Union discriminée ─────────────────────────────────
// Le tag `status` est un type LITTÉRAL distinct par variante.
// Chaque variante porte EXACTEMENT les champs qui la concernent :
// memberId n'existe que sur "accepted", expiredAt que sur "expired".
export type Invitation =
  | { status: "pending"; sentAt: Date }
  | { status: "accepted"; memberId: string; acceptedAt: Date }
  | { status: "expired"; expiredAt: Date };

// ─── TODO 2 — Util d'exhaustivité ───────────────────────────────
// Reçoit `never` : n'est atteignable QUE si tous les cas sont gérés.
// Si une variante n'est pas traitée, l'appelant passe autre chose que
// never → erreur de compilation. C'est le filet de sécurité.
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// ─── TODO 3 — Résumé exhaustif ──────────────────────────────────
export function resumer(inv: Invitation): string {
  switch (inv.status) {
    case "pending":
      // inv narrowé en { status: "pending"; sentAt: Date }
      return `En attente depuis le ${inv.sentAt.toLocaleDateString("fr")}`;
    case "accepted":
      // inv narrowé → memberId GARANTI, pas de `?`, pas de crash
      return `Acceptée par ${inv.memberId}`;
    case "expired":
      return `Expirée le ${inv.expiredAt.toLocaleDateString("fr")}`;
    default:
      // Ici inv est `never`. Retire un case ci-dessus → cette ligne
      // ne compile plus. C'est la preuve de l'exhaustivité.
      return assertNever(inv);
  }
}

// ─── TODO 4 — Notification (union sur `kind`) ───────────────────
export type Notification =
  | { kind: "email"; to: string; subject: string; body: string }
  | { kind: "sms"; phone: string; message: string }
  | { kind: "push"; deviceId: string; title: string; body: string };

export function envoyer(n: Notification): string {
  switch (n.kind) {
    case "email":
      return `Email à ${n.to} — « ${n.subject} »`;
    case "sms":
      return `SMS au ${n.phone} — ${n.message}`;
    case "push":
      return `Push vers ${n.deviceId} — ${n.title}`;
    default:
      return assertNever(n);
  }
}

// ─── TODO 5 — Type guard avec predicate `is` ────────────────────
// Extract<Invitation, { status: "accepted" }> = la variante acceptée.
// Le predicate permet à .filter() de narrower le type du tableau.
export function estAccepted(inv: Invitation): inv is Extract<Invitation, { status: "accepted" }> {
  return inv.status === "accepted";
}
