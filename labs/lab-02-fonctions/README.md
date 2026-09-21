# Lab 02 — Typer les fonctions

> **Outcome :** à la fin, tu sais typer un service métier de A à Z — signatures, optionnels/défaut, rest, callbacks, un type guard `x is T` et une assertion function `asserts x is T` — avec le compilateur `tsc` comme seul juge.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:02` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:02` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

---

## Lire avant (une lecture bornée, pas le module entier)

Module [`02-fonctions.md`](../../modules/02-fonctions.md), **une fois**, puis on ferme :
- §2.1 paramètres et retour · §2.2 optionnels `?` · §2.3 défaut `=` · §2.5 function types
- §2.8 contextual typing · §2.9 `void` dans les callbacks · §2.10 type guards `x is T` · §2.11 assertion functions
- §4 pièges #1 (`?` vs `= valeur`), #3 (callback `=> void` et async), #4 (type guard qui ment)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 21/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

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

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:02         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:02       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/members.ts`. Exports attendus :
- `type Role` · `interface Invitation` · `interface Member` · `interface ActiveMember extends Member` · `type Notifier`
- `inviteMember(email: string, role?: Role): Invitation`
- `isActiveMember(m: Member): m is ActiveMember`
- `notifyActive(members: Member[], send: Notifier): void` · `activeEmails(members: Member[]): string[]`
- `assertDefined<T>(v: T | null | undefined, name: string): asserts v is T`
- `firstActive(members: Member[]): ActiveMember`

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `Role` = quatre littéraux exacts ; `Invitation.status` est le literal `"pending"` ; `Member.lastSeenAt` optionnel mais `ActiveMember.lastSeenAt: string` et `status: "active"` ; signatures exactes de `inviteMember`, `isActiveMember` (guard), `notifyActive` (`void`), `activeEmails` ; `assertDefined` rétrécit la variable après l'appel ; `inviteMember("x", "root")` et `inviteMember(42)` refusés.
- **Runtime** : invitation pending avec rôle `member` par défaut et token unique ; le guard est vrai seulement si `active` **et** `lastSeenAt` présent ; `send` n'est appelé que pour les actifs ; `assertDefined` lève avec le nom sur `null`/`undefined`, pas sur `0` ni `""` ; `firstActive` renvoie le premier actif ou lève.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

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
