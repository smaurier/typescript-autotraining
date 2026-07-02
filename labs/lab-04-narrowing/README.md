# Lab 04 — Narrowing

> **Outcome :** à la fin, tu sais modéliser l'état d'une `Invitation` TribuZen en union discriminée, narrower chaque variante avec la technique adaptée, et garantir l'exhaustivité d'un `switch` avec `never`.
> **Vrai outil :** compilateur TypeScript (`tsc --noEmit`) + exécution `npx tsx invitation.ts`. Aucun harnais de test simulé.
> **Feedback :** le coach valide en session — la vérité, c'est ce que dit le compilateur (`tsc`), pas un runner auto-correcteur.

---

## Énoncé

Le back-office TribuZen gère les invitations à rejoindre une tribu. Une invitation est **dans exactement un état** parmi :

- **`pending`** — envoyée, en attente de réponse. Champ : `sentAt: Date`.
- **`accepted`** — acceptée par un membre. Champs : `memberId: string`, `acceptedAt: Date`.
- **`expired`** — délai dépassé. Champ : `expiredAt: Date`.

Tu vas modéliser cet état en **union discriminée** (tag = `status`), puis écrire les traitements en narrowant proprement — **pas de gap-fill**, tu écris chaque type et chaque fonction depuis le starter.

### Starter minimal

Crée un dossier de lab et initialise TypeScript (le vrai outil) :

```bash
mkdir lab-04-narrowing && cd lab-04-narrowing
npm init -y
npm install -D typescript tsx
npx tsc --init --strict
```

Crée `invitation.ts` avec ce squelette (à compléter) :

```typescript
// TODO 1 — modéliser Invitation en union discriminée (tag: status)
export type Invitation = unknown; // à remplacer

// TODO 2 — util d'exhaustivité
export function assertNever(x: never): never {
  throw new Error(`Cas non géré : ${JSON.stringify(x)}`);
}

// TODO 3 — résumé exhaustif d'une invitation
export function resumer(inv: Invitation): string {
  // switch sur inv.status, narrowing par variante, default: assertNever(inv)
  return "";
}

// TODO 4 — type Notification (union sur kind) + envoi exhaustif
// TODO 5 — type guard estAccepted(inv) avec predicate `is`
```

Lance la vérification de types en continu :

```bash
npx tsc --noEmit --watch
```

Le lab est réussi quand `tsc` ne signale **aucune** erreur ET que retirer un `case` du `switch` fait **échouer** la compilation (preuve que l'exhaustivité marche).

---

## Étapes (en friction)

1. **Modélise `Invitation`** — union discriminée à 3 variantes, chacune avec `status` littéral + ses champs propres. Vérifie que `const bad: Invitation = { status: "accepted" }` refuse de compiler (memberId manquant).
2. **Écris `resumer`** — `switch (inv.status)`, un `case` par statut, chaque `case` lit UNIQUEMENT les champs de sa variante. Termine par `default: return assertNever(inv)`.
3. **Prouve l'exhaustivité** — commente le `case "expired"` : `tsc` doit signaler que `inv` n'est pas assignable à `never`. Décommente ensuite.
4. **Ajoute `Notification`** — union sur `kind` (`"email"` / `"sms"` / `"push"`) avec des champs distincts, et `envoyer` en `switch` exhaustif.
5. **Écris un type guard** — `estAccepted(inv): inv is Extract<Invitation, { status: "accepted" }>`, puis filtre un tableau d'invitations pour ne garder que les acceptées et lire leurs `memberId`.
6. **Exécute** — `npx tsx invitation.ts` avec quelques données de démo et vérifie les sorties.

---

## Corrigé complet commenté

```typescript
// ═══════════════════════════════════════════════════════════════
//  invitation.ts — corrigé lab 04
// ═══════════════════════════════════════════════════════════════

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
export function estAccepted(
  inv: Invitation,
): inv is Extract<Invitation, { status: "accepted" }> {
  return inv.status === "accepted";
}

// ─── Démonstration ──────────────────────────────────────────────
const invitations: Invitation[] = [
  { status: "pending", sentAt: new Date("2026-07-01") },
  { status: "accepted", memberId: "usr-42", acceptedAt: new Date() },
  { status: "expired", expiredAt: new Date("2026-06-20") },
];

for (const inv of invitations) {
  console.log(resumer(inv));
}

// Grâce au predicate, `acceptees` est typé { status: "accepted"; ... }[]
const acceptees = invitations.filter(estAccepted);
console.log(acceptees.map((i) => i.memberId)); // ["usr-42"] — memberId lisible sans cast

console.log(
  envoyer({ kind: "push", deviceId: "dev-1", title: "Nouveau membre", body: "..." }),
);
```

**Pourquoi ce corrigé est correct :**
- Le tag `status` littéral relie chaque statut à ses champs — impossible de lire `memberId` sur une invitation `pending`.
- `default: return assertNever(inv)` garantit qu'ajouter un statut (ex. `"revoked"`) sans le gérer casse la compilation dans `resumer` **et** partout ailleurs.
- Le predicate `is` d'`estAccepted` fait que `.filter()` renvoie un tableau de la variante acceptée, donc `.map((i) => i.memberId)` compile sans `as` ni `!`.
- `Notification` applique exactement le même pattern sur un autre tag (`kind`) : le pattern est réutilisable, pas propre à un cas.

---

## Variante J+30 (fading)

**Même objectif, contrainte ajoutée — reproduire de mémoire, sans rouvrir ce corrigé ni le module, en 25 minutes :**

1. Ajoute une **quatrième** variante à `Invitation` : `{ status: "revoked"; revokedBy: string; revokedAt: Date }`.
2. Fais compiler à nouveau **sans toucher au `default`** : le compilateur doit te forcer à ajouter le `case "revoked"` dans `resumer` (et dans toute autre fonction qui `switch` sur `status`).
3. Ajoute une fonction `peutRelancer(inv: Invitation): boolean` qui renvoie `true` seulement pour `pending` et `expired` — en narrowing, sans réécrire un `switch` complet (utilise `in`, l'égalité, ou le type guard).

**Critère de réussite :** `tsc --noEmit` passe au vert seulement une fois `"revoked"` géré partout ; retirer n'importe quel `case` refait échouer la compilation.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces types et traitements vivent ici :

```
tribuzen/src/
  types/
    invitation.ts        # export type Invitation (union discriminée sur status)
    notification.ts      # export type Notification (union sur kind)
  utils/
    assert.ts            # assertNever(x: never): never — util partagé
  features/
    invitation/
      resumerInvitation.ts
      peutRelancer.ts
    notification/
      envoyer.ts
```

**Différences par rapport au lab :**
- `assertNever` est extrait dans `src/utils/assert.ts` et importé partout (pas redéfini par fichier).
- `Invitation` gagnera d'autres statuts au fil du produit (`revoked`, `resent`) — chaque ajout est protégé par l'exhaustiveness `never`, qui liste au compilateur tous les `switch` à mettre à jour.
- Les données réelles viennent de l'API (`unknown`) : un type guard `estInvitation(x: unknown): x is Invitation` (pattern du module 02) valide la charge avant de la traiter.

**Commit cible :**
```
feat(invitation): état en union discriminée + résumé exhaustif (never)
feat(notification): type Notification en variantes + service d'envoi exhaustif
```
