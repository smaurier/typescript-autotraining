# Lab 04 — Narrowing

> **Outcome :** à la fin, tu sais modéliser l'état d'une `Invitation` TribuZen en union discriminée, narrower chaque variante avec la technique adaptée, et garantir l'exhaustivité d'un `switch` avec `never`.
> **Vrai outil :** TypeScript 7 (`tsc` en `strict`) + vitest 5 en mode typecheck. L'oracle est un vrai runner : tests de **types** (`test/*.test-d.ts`) et tests **runtime** (`test/*.test.ts`).
> **Feedback :** `npm run lab:04` depuis `00-typescript/labs` — RED tant que `src/` ne satisfait pas l'oracle. Au GREEN, le correcteur-labs tranche (GO/FIX/STOP). Personne ne « valide en session ». La solution de référence vit dans `solution/` : `npm run solution:04` prouve que l'oracle est juste, et tu ne l'ouvres pas avant ton GREEN.

---

## Lire avant (une lecture bornée, pas le module entier)

Module [`04-unions-intersections-narrowing.md`](../../modules/04-unions-intersections-narrowing.md), **une fois**, puis on ferme :
- §2.1 unions · §2.3 narrowing, le principe · §2.4 discriminated unions · §2.5 exhaustiveness avec `never` · §2.6 type guards (rappel)
- §4 pièges #1 (discriminant non littéral), #3 (oublier le `default` avec `never`)

⛔ **Pas §3 Worked examples avant ton GREEN** (exemples 1 et 2 = ce lab).

Ensuite : page blanche. Le module ne se rouvre qu'en dépannage ciblé, sur la section que le test qui échoue désigne.

## Énoncé

> **Depuis le 21/09/2026, le dossier du lab existe déjà** (`src/`, `test/`, `tsconfig.json`). Tu écris dans `src/`, tu ne fais pas de `npm init` : les commandes de création de dossier ci-dessous décrivent l'ancien format et ne sont plus à exécuter. Le contrat exact attendu par l'oracle est dans **§ Vérifier**.

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

## Vérifier

```bash
cd 00-typescript/labs
npm install            # une fois (vitest 5, TypeScript 7, vite)
npm run lab:04         # oracle sur TON code : RED → tu continues, GREEN → correcteur-labs
npm run check:04       # tsc strict seul, si tu veux isoler une erreur de compilation
```

**Contrat attendu par l'oracle**

Fichier : `src/invitation.ts` (le squelette TODO 1-5 est déjà dedans). Exports attendus :
- `type Invitation` = union de **trois** variantes taguées par `status` : `pending { sentAt: Date }`, `accepted { memberId: string; acceptedAt: Date }`, `expired { expiredAt: Date }`
- `assertNever(x: never): never` (fourni)
- `resumer(inv: Invitation): string`
- `type Notification` = union taguée par `kind` : `email { to, subject, body }`, `sms { phone, message }`, `push { deviceId, title, body }` (tous `string`)
- `envoyer(n: Notification): string`
- `estAccepted(inv: Invitation): inv is Extract<Invitation, { status: "accepted" }>`

**Ce que l'oracle vérifie** (le *quoi*, jamais le *comment*)

- **Types** : `Invitation` et `Notification` sont exactement ces unions ; après `inv.status === "accepted"`, `memberId` est `string` ; sur `pending`, lire `memberId` est refusé ; après les trois `case`, `inv` est `never` ; `assertNever` ne prend que `never` ; `filter(estAccepted)` renvoie la variante acceptée.
- **Runtime** : le résumé d'une `pending` contient sa date d'envoi (`toLocaleDateString("fr")`), celui d'une `accepted` contient le `memberId`, celui d'une `expired` sa date ; les trois sont distincts et non vides ; `assertNever` lève en sérialisant le cas ; `envoyer` restitue destinataire+sujet, numéro+message, device+titre ; `estAccepted` filtre correctement.

Une ligne `// @ts-expect-error` de l'oracle qui ne produit **pas** d'erreur compte comme un échec : ton typage est trop permissif à cet endroit. Corrige la signature, pas le test.

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
