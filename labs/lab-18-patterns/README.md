# Lab 18 — Patterns de conception typés

> **Outcome :** à la fin, tu sais construire le noyau typé de TribuZen — identifiants brandés, `Result<T, E>`, `inviteMember` sans exception, et validation zod à la frontière d'API avec `z.infer`.
> **Vrai outil :** TypeScript 5 (`tsc --noEmit` en `strict`) + zod 3, dans un vrai projet Node.
> **Feedback :** le coach valide en session — pas de test-runner auto-correcteur. Ton juge, c'est `tsc` (les erreurs de type attendues doivent apparaître) et un `node` d'exécution.

---

## Énoncé

Tu écris le cœur métier de TribuZen avec les patterns du module 18. Cahier des charges **exact** :

1. **Branded ids** — `MemberId` et `Email` en `Brand<string, ...>`, avec smart constructors `toMemberId` / `toEmail` (le seul endroit qui caste).
2. **`Result<T, E>`** — union discriminée `{ ok: true, value } | { ok: false, error }` + `ok()` / `err()`.
3. **`inviteMember`** — signature `(familyId: MemberId, email: Email, currentCount: number) => Result<Invite, InviteError>`. Erreur métier `quota-reached` (max 50) exposée dans le type, **zéro exception**.
4. **`MemberSchema` (zod)** — schéma validant la forme d'un membre d'API ; type dérivé par `z.infer` ; alignement sur les rôles de `tribuzen/types` via `satisfies`.
5. **`parseMembers`** — reçoit un `unknown` (réponse API simulée), le valide à la **frontière** avec `safeParse`, renvoie un `Result<MemberDTO[], FetchError>`. **Aucun `as`** sur la donnée externe.

**Contraintes :**
- `tsconfig` en `"strict": true`. Le code doit compiler `tsc --noEmit` **sans erreur**, SAUF les lignes marquées `// @ts-expect-error` (inversions d'arguments, événement inconnu) qui, elles, DOIVENT déclencher une erreur.
- Le cast `as` n'apparaît **que** dans les smart constructors. Nulle part ailleurs sur une donnée externe.
- Pas de gap-fill : tu écris chaque fichier complet depuis le starter.

### Starter minimal

```bash
mkdir tribuzen-core && cd tribuzen-core
npm init -y
npm i -D typescript @types/node
npm i zod
npx tsc --init --strict --target es2022 --module nodenext --moduleResolution nodenext
```

Arborescence à créer :

```
src/
  domain/
    ids.ts        ← Brand, MemberId, Email, toMemberId, toEmail
    result.ts     ← Result<T,E>, ok, err
  features/
    invite.ts     ← InviteError, Invite, inviteMember
  schemas/
    member.ts     ← MemberSchema (zod), MemberDTO, parseMembers, FetchError
  main.ts         ← scénario d'exécution (node) + lignes @ts-expect-error
```

Vérifie au fur et à mesure avec `npx tsc --noEmit`, puis exécute avec `npx tsx src/main.ts` (ou compile puis `node`).

---

## Étapes (en friction)

1. **`domain/ids.ts`** — déclare `const brand: unique symbol`, `type Brand<T, B extends string> = T & { readonly [brand]: B }`. Dérive `MemberId` et `Email`. Écris `toMemberId` (rejette la chaîne vide) et `toEmail` (rejette sans `@`, met en minuscules). Ce sont les **seuls** casts du projet.
2. **`domain/result.ts`** — écris le type `Result<T, E>` et les constructeurs `ok` / `err`.
3. **`features/invite.ts`** — définis `InviteError` (au moins `quota-reached` avec `max`), le type `Invite`, et `inviteMember`. Retourne `err(...)` si `currentCount >= 50`, sinon `ok(...)`. Aucun `throw` pour le cas métier.
4. **`schemas/member.ts`** — écris `MemberSchema` avec zod (`id`, `familyId`, `displayName`, `role` en `z.enum`, `email` optionnel). Dérive `MemberDTO` par `z.infer`. Écris `parseMembers(input: unknown): Result<MemberDTO[], FetchError>` en utilisant `safeParse`.
5. **`main.ts`** — appelle `inviteMember` (cas OK + cas quota), branche un `if (r.ok)`. Appelle `parseMembers` sur un JSON valide ET sur un JSON invalide (rôle `"root"`), affiche les deux résultats. Ajoute 2 lignes `// @ts-expect-error` : arguments `inviteMember` inversés, et un membre au rôle invalide passé directement au type `MemberDTO`.
6. **Vérifie** : `npx tsc --noEmit` doit passer (les `@ts-expect-error` sont « consommés ») ; `npx tsx src/main.ts` doit logger l'invitation OK, l'erreur quota, le parse OK, et l'échec de shape.

---

## Corrigé complet commenté

```ts
// ─── src/domain/ids.ts ───────────────────────────────────────────
// Marque fantôme : unique symbol jamais construit au runtime.
declare const brand: unique symbol;
// Brand<T,B> = T + une propriété virtuelle qui distingue le type au compile-time.
export type Brand<T, B extends string> = T & { readonly [brand]: B };

// Deux string structurellement identiques, nominalement DISTINCTS.
export type MemberId = Brand<string, 'MemberId'>;
export type Email = Brand<string, 'Email'>;

// Smart constructor : SEUL endroit autorisé à caster vers MemberId.
export function toMemberId(raw: string): MemberId {
  if (raw.length === 0) throw new Error('MemberId vide');
  return raw as MemberId;
}

// Smart constructor Email : valide la présence d'un @, normalise en minuscules.
export function toEmail(raw: string): Email {
  if (!raw.includes('@')) throw new Error(`Email invalide : ${raw}`);
  return raw.toLowerCase() as Email;
}

// ─── src/domain/result.ts ────────────────────────────────────────
// Union discriminée par `ok` : impossible de lire `value` sans avoir narrow.
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// never en second paramètre : ok() ne porte jamais d'erreur, err() jamais de valeur.
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ─── src/features/invite.ts ──────────────────────────────────────
import type { MemberId, Email } from '../domain/ids.js';
import { ok, err, type Result } from '../domain/result.js';

// Erreurs MÉTIER attendues — pas des bugs. Union discriminée par `kind`.
export type InviteError =
  | { kind: 'already-member'; email: Email }
  | { kind: 'quota-reached'; max: number };

export interface Invite {
  familyId: MemberId;
  email: Email;
}

// Signature honnête : familyId et email sont nominalement distincts (pas
// interchangeables), et l'échec métier est DANS le type de retour.
export function inviteMember(
  familyId: MemberId,
  email: Email,
  currentCount: number,
): Result<Invite, InviteError> {
  if (currentCount >= 50) {
    return err({ kind: 'quota-reached', max: 50 }); // échec explicite, sans throw
  }
  return ok({ familyId, email });
}

// ─── src/schemas/member.ts ───────────────────────────────────────
import { z } from 'zod';
import { ok, err, type Result } from '../domain/result.js';

// Rôles alignés sur tribuzen/types (MemberRole = 'admin' | 'parent' | 'enfant').
// `satisfies` garantirait la conformité si on importait le type ; ici on le fige.
const ROLES = ['admin', 'parent', 'enfant'] as const;

// Le schéma : validateur RUNTIME + source du type statique.
export const MemberSchema = z.object({
  id: z.string().min(1),
  familyId: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(ROLES),
  email: z.string().email().optional(),
});

// z.infer : le type est DÉRIVÉ du schéma — une seule source de vérité.
export type MemberDTO = z.infer<typeof MemberSchema>;

const MembersSchema = z.array(MemberSchema);

// Erreur de frontière, typée.
export type FetchError =
  | { kind: 'invalid-shape'; issues: z.ZodIssue[] };

// La FRONTIÈRE : l'entrée est honnêtement `unknown`. safeParse valide au runtime
// et NARROW le type. Aucun `as` sur la donnée externe.
export function parseMembers(input: unknown): Result<MemberDTO[], FetchError> {
  const parsed = MembersSchema.safeParse(input);
  if (!parsed.success) {
    return err({ kind: 'invalid-shape', issues: parsed.error.issues });
  }
  return ok(parsed.data); // parsed.data : MemberDTO[] réellement conforme
}

// ─── src/main.ts ─────────────────────────────────────────────────
import { toMemberId, toEmail } from './domain/ids.js';
import { inviteMember } from './features/invite.js';
import { parseMembers, type MemberDTO } from './schemas/member.js';

// 1) Invitation OK
const r1 = inviteMember(toMemberId('fam_01'), toEmail('lou@tribuzen.app'), 12);
if (r1.ok) console.log('Invitation prête pour', r1.value.email);

// 2) Invitation refusée (quota) — géré par narrowing, pas par try/catch
const r2 = inviteMember(toMemberId('fam_01'), toEmail('max@tribuzen.app'), 50);
if (!r2.ok && r2.error.kind === 'quota-reached') {
  console.warn(`Quota atteint (max ${r2.error.max})`);
}

// 3) Frontière : donnée d'API VALIDE (simulée par un unknown)
const goodJson: unknown = [
  { id: 'm1', familyId: 'fam_01', displayName: 'Lou', role: 'parent' },
];
const p1 = parseMembers(goodJson);
console.log(p1.ok ? `Parsé : ${p1.value.length} membre(s)` : 'Échec');

// 4) Frontière : donnée INVALIDE (role hors contrat) → détectée au runtime
const badJson: unknown = [
  { id: 'm2', familyId: 'fam_01', displayName: 'X', role: 'root' },
];
const p2 = parseMembers(badJson);
if (!p2.ok) console.error('API hors contrat :', p2.error.issues[0]?.message);

// ─── Erreurs de type ATTENDUES (doivent faire échouer tsc si retirées) ───
// @ts-expect-error — arguments inversés : Email n'est pas assignable à MemberId
inviteMember(toEmail('x@y.fr'), toMemberId('fam_01'), 0);

// @ts-expect-error — 'root' n'est pas un role valide du MemberDTO
const bad: MemberDTO = { id: 'm', familyId: 'f', displayName: 'X', role: 'root' };
console.log(bad);
```

**Pourquoi ce corrigé est correct :**
- Le cast `as` n'apparaît **que** dans `toMemberId` / `toEmail` : le branding tient, la marque ne ment jamais.
- `inviteMember` n'a **aucun `throw`** pour le cas métier — le quota est un `err(...)` visible dans la signature, forcément traité par l'appelant.
- `parseMembers` reçoit `unknown` et ne le typiste **jamais** par `as` : `safeParse` fait le pont runtime→type. Après `parsed.success`, `parsed.data` est prouvé conforme.
- Les deux `@ts-expect-error` documentent le contrat : si un jour l'inversion d'arguments ou un rôle invalide compilait, `tsc` échouerait sur le `@ts-expect-error` inutilisé — le garde-fou est actif.

> **Note import `.js`** : avec `module: nodenext`, les imports relatifs portent l'extension `.js` (résolue vers le `.ts` à la compilation). Si tu utilises `tsx`/`ts-node` en mode classique, tu peux retirer les `.js`.

---

## Variante J+30 (fading)

**Même noyau, contraintes ajoutées — reproduire de mémoire en 25 minutes, sans rouvrir ce corrigé ni le module :**

1. Ajoute un branded type `FamilyId` distinct de `MemberId`, et adapte `inviteMember` pour que `familyId` soit un `FamilyId` (pas un `MemberId`). Vérifie qu'inverser `MemberId`/`FamilyId` ne compile plus.
2. Ajoute une variante d'erreur `{ kind: 'invalid-email'; raw: string }` à `InviteError`, et fais valider l'email par `inviteMember` en retournant cette erreur (au lieu de lever une exception dans `toEmail`).
3. Aligne réellement `MemberSchema.role` sur le type `MemberRole` importé de `tribuzen/types` avec `... satisfies z.ZodType<MemberRole>` — et prouve que retirer `'enfant'` du `z.enum` casse la compilation.
4. Ajoute un `Emitter<TribuEvents>` minimal (`on` / `emit`) et émets `'invite:accepted'`. Ajoute un `// @ts-expect-error` sur `emit('unknown', {})`.

**Critère de réussite :** `tsc --noEmit` passe ; les inversions d'ids et l'événement inconnu sont bien refusés ; `inviteMember` ne lève plus aucune exception pour un email invalide (il renvoie un `Result`).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce noyau vit ici :

```
tribuzen/src/
  domain/
    ids.ts        ← MemberId, FamilyId, Email + smart constructors
    result.ts     ← Result<T,E>, ok, err
  features/
    invite/
      invite.ts   ← inviteMember(): Result<Invite, InviteError>
  schemas/
    member.ts     ← MemberSchema (zod) + MemberDTO = z.infer<...>
  api/
    members.ts    ← getMembers() : fetch + safeParse à la frontière
```

**Différences par rapport au lab :**
- `parseMembers` devient `getMembers(familyId)` : un vrai `fetch` en amont, puis `safeParse` sur `await res.json()` (typé `unknown`). L'erreur `network` (status HTTP) rejoint `invalid-shape` dans `FetchError`.
- `MemberSchema` importe `MemberRole` de `tribuzen/types` et le fige avec `satisfies z.ZodType<MemberRole>` — le schéma et les types partagés ne peuvent plus diverger.
- Les branded ids remplacent les `string` de `tribuzen/types` (`Family.id`, `MemberBase.id`, `Invitation.token`), constructeurs branchés à la couche de désérialisation.
- Règle d'équipe : toute donnée externe (fetch, `localStorage`, params d'URL) passe par un schéma zod ; `as` interdit en revue sur une donnée runtime.

**Commit cible :**
```
feat(domain): branded ids (MemberId, FamilyId, Email) + smart constructors
feat(domain): Result<T,E> — inviteMember expose ses erreurs métier sans throw
feat(api): valider les membres à la frontière avec MemberSchema (zod + z.infer)
```
