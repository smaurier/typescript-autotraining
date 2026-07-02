# Lab 02 — Typer les fonctions

> **Outcome :** à la fin, tu sais typer un service métier de A à Z — signatures, optionnels/défaut, rest, callbacks, un type guard `x is T` et une assertion function `asserts x is T` — avec le compilateur `tsc` comme seul juge.
> **Vrai outil :** `typescript` (`tsc --noEmit` en `strict`). Pas de test-runner auto-correcteur, pas de gap-fill.
> **Feedback :** le coach valide en session. Le vrai signal de réussite : `npx tsc --noEmit` passe **sans erreur** ET les lignes marquées `// @ts-expect-error` compilent bien en erreur.

---

## Énoncé

Tu construis la couche `members` de l'admin TribuZen dans un seul fichier `members.ts`. Objectif : partir d'un squelette non typé et le rendre entièrement sûr.

Crée le lab et vérifie ta version au fur et à mesure :

```bash
mkdir tribuzen-members && cd tribuzen-members
npm init -y
npm i -D typescript
npx tsc --init --strict
# écris members.ts (voir Étapes), puis :
npx tsc --noEmit
```

Point de départ (à typer toi-même — ne recopie pas le corrigé) :

```ts
// members.ts — STARTER (volontairement non typé)
export function inviteMember(email, role) {
  return { email, role: role ?? "member", token: crypto.randomUUID(), status: "pending" };
}

export function isActiveMember(m) {
  return m.status === "active" && m.lastSeenAt !== undefined;
}

export function notifyActive(members, send) {
  members.filter(isActiveMember).forEach((m) => send(m));
}
```

En `strict`, ce fichier ne compile pas (paramètres `any` implicites). C'est le point de départ.

## Étapes (en friction)

1. **Modéliser le domaine.** Écris `type Role` (union fermée : `owner`, `admin`, `member`, `guest`), `interface Invitation`, `interface Member` (avec `lastSeenAt?`), et `interface ActiveMember extends Member` qui **prouve** `status: "active"` + `lastSeenAt: string`.
2. **Typer `inviteMember`.** `email: string`, `role` **optionnel avec défaut** `"member"`, retour `Invitation`. Vérifie que `inviteMember("x@y.z", "root")` est refusé.
3. **Écrire le type guard.** `isActiveMember(m: Member): m is ActiveMember`. Le corps doit couvrir **toutes** les garanties d'`ActiveMember` (statut ET `lastSeenAt`).
4. **Typer les callbacks.** Définis `type Notifier = (m: ActiveMember) => void`. Type `notifyActive(members: Member[], send: Notifier): void`. Ajoute `activeEmails(members: Member[]): string[]` qui enchaîne `.filter(isActiveMember).map(...)` sans annoter le paramètre du `map` (contextual typing).
5. **Durcir la frontière.** Ajoute une assertion function `assertDefined<T>(v: T | null | undefined, name: string): asserts v is T` et utilise-la dans une fonction `firstActive(members: Member[]): ActiveMember` qui lève si aucun membre actif.
6. **Prouver le typage.** Ajoute ces lignes de contrôle — elles doivent **toutes** compiler telles quelles (les `@ts-expect-error` échoueraient si le typage était trop laxiste) :

```ts
inviteMember("a@tribuzen.app");             // ok, role par défaut
// @ts-expect-error rôle inexistant
inviteMember("b@tribuzen.app", "root");
// @ts-expect-error email doit être string
inviteMember(42);
```

## Corrigé complet commenté

```ts
// members.ts — CORRIGÉ

// 1. Domaine ───────────────────────────────────────────────────────
export type Role = "owner" | "admin" | "member" | "guest";

export interface Invitation {
  email: string;
  role: Role;
  token: string;
  status: "pending"; // literal : une invitation naît toujours pending
}

export interface Member {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "active" | "suspended";
  lastSeenAt?: string; // optionnel : absent tant que jamais connecté
}

// Sous-type prouvé : ces deux champs sont GARANTIS non optionnels
export interface ActiveMember extends Member {
  status: "active";
  lastSeenAt: string;
}

// 2. inviteMember : optionnel AVEC défaut → role est Role dans le corps
export function inviteMember(email: string, role: Role = "member"): Invitation {
  return {
    email,
    role,
    token: crypto.randomUUID(),
    status: "pending", // inféré comme le literal "pending"
  };
}

// 3. Type guard : le corps couvre TOUTES les garanties d'ActiveMember
//    (sinon on obtiendrait un ActiveMember mensonger → crash runtime)
export function isActiveMember(m: Member): m is ActiveMember {
  return m.status === "active" && m.lastSeenAt !== undefined;
}

// 4. Callbacks typés ───────────────────────────────────────────────
// Notifier renvoie void : le corps peut renvoyer une valeur, elle est ignorée
type Notifier = (m: ActiveMember) => void;

export function notifyActive(members: Member[], send: Notifier): void {
  // filter(isActiveMember) rétrécit Member[] → ActiveMember[]
  members.filter(isActiveMember).forEach((m) => send(m));
  //                                          ^ m: ActiveMember, lastSeenAt: string
}

export function activeEmails(members: Member[]): string[] {
  // contextual typing : le param du map est inféré ActiveMember, aucune annotation
  return members.filter(isActiveMember).map((m) => m.email);
}

// 5. Assertion function : rétrécit tout le code qui suit l'appel
export function assertDefined<T>(
  v: T | null | undefined,
  name: string
): asserts v is T {
  if (v === null || v === undefined) {
    throw new Error(`${name} est requis mais absent`);
  }
}

export function firstActive(members: Member[]): ActiveMember {
  const found = members.find(isActiveMember); // ActiveMember | undefined
  assertDefined(found, "membre actif");        // après : found est ActiveMember
  return found;                                 // ✅ plus de | undefined
}

// 6. Contrôles de typage ───────────────────────────────────────────
inviteMember("a@tribuzen.app");             // role par défaut = "member"
// @ts-expect-error rôle inexistant
inviteMember("b@tribuzen.app", "root");
// @ts-expect-error email doit être string
inviteMember(42);
```

Vérification finale : `npx tsc --noEmit` doit afficher **zéro erreur**. Si une ligne `@ts-expect-error` provoque « Unused '@ts-expect-error' directive », c'est que ton typage est trop permissif à cet endroit — corrige la signature, pas le contrôle.

## Variante J+30 (fading)

Refais le fichier **de mémoire, en 25 min, sans relire le corrigé**, avec deux contraintes ajoutées :

1. Ajoute une **surcharge** à une fonction `resolveMember` :
   - `resolveMember(id: string): Member` (recherche par id)
   - `resolveMember(emails: string[]): Member[]` (recherche par lot d'emails)
   - une seule implémentation, signature d'implémentation invisible.
2. Type `notifyActive` pour accepter un `send` **synchrone ou asynchrone** : `type Notifier = (m: ActiveMember) => void | Promise<void>`, et `await`-le proprement (rends `notifyActive` `async` et retourne `Promise<void>`). Justifie pourquoi `=> void` seul aurait masqué les rejets (Piège #3 du module).

## Application TribuZen

Porte ce fichier dans le vrai repo :

```
tribuzen/src/
  domain/members/
    invite.ts    # Role, Invitation, inviteMember
    guards.ts    # Member, ActiveMember, isActiveMember
  features/notifications/
    notify.ts    # Notifier, notifyActive, activeEmails
  lib/
    assert.ts    # assertDefined
```

Branche `inviteMember` sur l'écran « Inviter dans la famille » (le `Role` fermé empêche l'UI d'envoyer un rôle inconnu), et `isActiveMember` sur la sélection des destinataires de notifications. Commit sur `smaurier/tribuzen` :

```bash
git checkout -b feat/members-typed
git add src/domain/members src/features/notifications src/lib/assert.ts
git commit -m "feat(members): couche invitations + type guard isActiveMember typés"
```
