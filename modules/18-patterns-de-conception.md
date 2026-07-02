---
titre: Patterns de conception typés
cours: 00-typescript
notions: [branded/nominal types, builder typé (fluent + état), discriminated union pour state machines, Result/Either vs exceptions, type-safe event emitter, validation runtime avec zod et z.infer, frontière type statique / donnée runtime, dependency injection légère typée, factory]
outcomes: [modéliser un identifiant métier en branded type au lieu d'un string nu, rendre les erreurs explicites avec un type Result plutôt que des exceptions invisibles, valider une donnée d'API à la frontière avec zod et dériver le type par z.infer]
prerequis: [17-tsconfig-et-compilateur]
next: 19-projet-final
libs: [{ name: typescript, version: "^5" }, { name: zod, version: "^3" }]
tribuzen: types métier robustes de TribuZen — Email/MemberId brandés, inviteMember en Result, MemberSchema zod validé à la frontière API
last-reviewed: 2026-07
---

# Patterns de conception typés

> **Outcomes — tu sauras FAIRE :** modéliser un identifiant métier en branded type, rendre les erreurs explicites avec un type `Result` au lieu d'exceptions, valider une donnée d'API à la frontière avec zod et dériver le type par `z.infer`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu branches TribuZen sur son API. Le endpoint `GET /families/:id/members` renvoie du JSON. Un collègue a écrit ceci :

```ts
// api.ts — AVANT
interface Member {
  id: string;
  familyId: string;
  displayName: string;
  role: string;      // "admin" | "parent" | "enfant" en vrai... mais typé string
  email: string;
}

async function getMembers(familyId: string): Promise<Member[]> {
  const res = await fetch(`/api/families/${familyId}/members`);
  return res.json() as Promise<Member[]>; // ← mensonge : `as` ne vérifie RIEN
}

// Plus loin dans le code, une fonction d'invitation :
function inviteMember(familyId: string, email: string): void {
  // familyId et email sont deux `string` : rien n'empêche de les inverser
  sendInvite(email, familyId); // ← bug silencieux, compile parfaitement
}
```

**Quatre problèmes, tous invisibles au compilateur :**

1. `res.json() as Member[]` est un **mensonge de type** : si l'API renvoie un `role` inconnu ou oublie `email`, TypeScript ne le voit pas — le crash arrive 40 lignes plus loin, sans stack utile.
2. `familyId: string` et `email: string` sont **interchangeables** : `sendInvite(email, familyId)` compile alors que les arguments sont inversés.
3. `inviteMember` renvoie `void` : impossible de savoir si l'invitation a échoué (email déjà membre, quota atteint) autrement qu'en lançant une exception — invisible dans la signature.
4. `role: string` autorise `"pdg"`, `"root"`, n'importe quoi.

Ce module te donne les patterns TS **pragmatiques** pour fermer ces trous : brander les identifiants, valider à la frontière avec zod, rendre l'échec explicite avec `Result`. Pas de sur-ingénierie GoF — juste ce qui paie.

---

## 2. Théorie complète, concise

### 2.1 Branded / nominal types

TypeScript est **structurel** : deux types de même forme sont interchangeables. `string` = `string`, donc `MemberId` et `Email` (tous deux des `string`) se confondent. Le *branding* ajoute une marque fantôme pour créer un type **nominal** (distinct par son nom, pas sa forme).

```ts
// Un helper Brand générique : T + une étiquette invisible au runtime
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type MemberId = Brand<string, 'MemberId'>;
type Email = Brand<string, 'Email'>;

// La marque n'existe qu'au compile-time : au runtime, c'est un string nu.
```

On ne peut plus fabriquer un `MemberId` par accident : il faut passer par un **constructeur** (souvent appelé *smart constructor*) qui valide et « appose la marque ».

```ts
function toEmail(raw: string): Email {
  if (!raw.includes('@')) throw new Error('Email invalide');
  return raw as Email; // le SEUL endroit où le cast est autorisé
}

function toMemberId(raw: string): MemberId {
  return raw as MemberId;
}

const id = toMemberId('m_01');
const mail = toEmail('lou@tribuzen.app');

// inviteMember attend (MemberId, Email) : l'inversion ne compile plus
declare function inviteMember(familyId: MemberId, email: Email): void;
// inviteMember(mail, id); // ❌ Type 'Email' n'est pas assignable à 'MemberId'
```

**Coût :** un cast unique dans le constructeur. **Gain :** impossible de passer un `string` brut ou d'inverser deux identifiants.

### 2.2 La frontière type statique / donnée runtime

C'est **le** concept central du module. Un type TypeScript n'existe pas au runtime : il est effacé à la compilation. Donc tout ce qui **entre dans le programme depuis l'extérieur** (réponse HTTP, `localStorage`, `JSON.parse`, formulaire, variable d'env) est de type `unknown` en vérité — le typer en dur avec `as` est un pari non tenu.

```
  Monde extérieur          |  Frontière        |  Cœur typé de l'app
  (données runtime)        |  (validation)     |  (types statiques sûrs)
  ─────────────────────    |  ─────────────    |  ────────────────────
  fetch().json()  →  unknown  →  [ zod parse ]  →  Member (garanti)
  JSON.parse()                 valide + narrow
```

La règle : **valider une fois, à la frontière**, puis faire confiance au type à l'intérieur. L'outil idiomatique pour ça est **zod**.

### 2.3 Validation runtime avec zod et `z.infer`

Zod définit un **schéma** qui est à la fois un validateur runtime ET une source de type statique. Un seul objet, deux usages — plus de dérive entre le type et le contrôle.

```ts
import { z } from 'zod';

const MemberSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  displayName: z.string().min(1),
  role: z.enum(['admin', 'parent', 'enfant']),
  email: z.string().email().optional(),
});

// z.infer DÉRIVE le type statique DU schéma : une seule source de vérité
type MemberDTO = z.infer<typeof MemberSchema>;
// { id: string; familyId: string; displayName: string;
//   role: 'admin' | 'parent' | 'enfant'; email?: string }
```

Les deux méthodes de validation :

```ts
// .parse() : renvoie la donnée typée, ou LANCE une ZodError
const member = MemberSchema.parse(json); // member: MemberDTO

// .safeParse() : ne lance jamais, renvoie un discriminated union
const result = MemberSchema.safeParse(json);
if (result.success) {
  result.data;  // MemberDTO
} else {
  result.error; // ZodError, avec .issues détaillés
}
```

> **`z.infer` va du schéma vers le type.** Pour l'inverse — garantir qu'un schéma reste aligné sur un type existant (`tribuzen/types`) — on utilise `z.ZodType<Member>` en annotation, ou `satisfies`. Vu en 4.4 et dans l'ancrage.

### 2.4 Result / Either vs exceptions

Une exception est **invisible dans la signature** : `function f(): number` peut lancer, rien ne le dit. Le pattern `Result` remonte l'échec **dans le type de retour**, forçant l'appelant à le traiter.

```ts
// Discriminated union : le champ `ok` discrimine les deux cas
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Constructeurs
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

L'appelant **ne peut pas** accéder à `.value` sans avoir vérifié `ok` — le narrowing l'impose :

```ts
type InviteError =
  | { kind: 'already-member' }
  | { kind: 'quota-reached'; max: number }
  | { kind: 'invalid-email'; raw: string };

function inviteMember(email: string): Result<Email, InviteError> {
  if (!email.includes('@')) return err({ kind: 'invalid-email', raw: email });
  // ... autres règles ...
  return ok(email as Email);
}

const r = inviteMember('lou@tribuzen.app');
if (r.ok) {
  r.value;         // Email — accessible seulement dans cette branche
} else {
  // r.error est un InviteError : switch exhaustif possible
  switch (r.error.kind) {
    case 'already-member': break;
    case 'quota-reached': break;
    case 'invalid-email': break;
  }
}
```

**Quand utiliser quoi :** `Result` pour les erreurs **attendues et métier** (validation, règle refusée) que l'appelant doit gérer. Les exceptions restent légitimes pour les **bugs / cas irrécupérables** (invariant cassé, `out of memory`). Ne pas tout emballer dans `Result` — c'est le piège de sur-ingénierie.

### 2.5 Discriminated union pour state machines

Une union discriminée modélise un état **où seules certaines données existent dans certains états**. Impossible de représenter un état invalide.

```ts
// État d'une invitation : chaque variante porte SES données propres
type InvitationState =
  | { status: 'pending'; expiresAt: Date }
  | { status: 'accepted'; acceptedByMemberId: MemberId; acceptedAt: Date }
  | { status: 'expired' }
  | { status: 'revoked'; reason: string };

// acceptedByMemberId n'existe QUE dans l'état 'accepted' : pas de champ
// optionnel qui traîne partout, pas de « accepté mais sans membre ».
function label(s: InvitationState): string {
  switch (s.status) {
    case 'pending':  return `Expire le ${s.expiresAt.toLocaleDateString('fr')}`;
    case 'accepted': return `Accepté par ${s.acceptedByMemberId}`;
    case 'expired':  return 'Expirée';
    case 'revoked':  return `Révoquée : ${s.reason}`;
    default: {
      const _exhaustive: never = s; // garde-fou : nouvel état non géré = erreur
      return _exhaustive;
    }
  }
}
```

Le `never` en `default` est un **exhaustiveness check** : ajouter une variante sans traiter son `case` provoque une erreur de compilation ici. C'est le narrowing exhaustif du module 04, appliqué à une machine à états.

### 2.6 Builder typé (fluent + suivi d'état)

Un builder construit un objet **pas à pas**. La version typée encode dans les generics **quels champs sont déjà renseignés**, pour que `.build()` ne soit disponible que quand tout l'obligatoire est là.

```ts
type Set_ = 'set';
type Unset = 'unset';

interface InviteDraft {
  familyId: MemberId;
  email: Email;
  role: 'parent' | 'enfant';
}

class InviteBuilder<F = Unset, E = Unset> {
  private draft: Partial<InviteDraft> = {};

  family(id: MemberId): InviteBuilder<Set_, E> {
    this.draft.familyId = id;
    return this as unknown as InviteBuilder<Set_, E>;
  }

  to(email: Email): InviteBuilder<F, Set_> {
    this.draft.email = email;
    return this as unknown as InviteBuilder<F, Set_>;
  }

  // Setter optionnel : ne change pas l'état des generics
  as(role: InviteDraft['role']): this {
    this.draft.role = role;
    return this;
  }

  // build() n'existe QUE quand F et E valent 'set'
  build(this: InviteBuilder<Set_, Set_>): InviteDraft {
    return { role: 'parent', ...this.draft } as InviteDraft;
  }
}

const invite = new InviteBuilder()
  .family(toMemberId('fam_01'))
  .to(toEmail('lou@tribuzen.app'))
  .build();          // ✅ OK

// new InviteBuilder().family(id).build(); // ❌ build n'existe pas : email manquant
```

> Pragmatique : un builder ne se justifie que pour un objet à **beaucoup de champs optionnels** ou une construction en plusieurs temps. Pour trois champs, un objet littéral suffit. Ne pas en abuser.

### 2.7 Type-safe event emitter

Un émetteur d'événements où **chaque événement a son type de payload**, vérifié à la compilation. La clé : une *event map* + une contrainte `keyof`.

```ts
// Carte des événements : nom → forme du payload
interface TribuEvents {
  'member:joined': { memberId: MemberId; familyId: MemberId };
  'invite:sent':   { email: Email };
  'invite:accepted': { memberId: MemberId };
}

class Emitter<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<(p: never) => void>>();

  on<K extends keyof Events>(event: K, fn: (payload: Events[K]) => void): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(fn as (p: never) => void);
    this.handlers.set(event, set);
    return () => set.delete(fn as (p: never) => void); // désinscription
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((fn) => (fn as (p: Events[K]) => void)(payload));
  }
}

const bus = new Emitter<TribuEvents>();
bus.on('invite:sent', (p) => console.log(p.email)); // p.email: Email inféré
bus.emit('invite:sent', { email: toEmail('lou@tribuzen.app') });
// bus.emit('invite:sent', { memberId: id }); // ❌ payload de mauvaise forme
// bus.emit('unknown', {});                    // ❌ événement inconnu
```

### 2.8 Dependency injection légère typée (+ factory)

Pas besoin d'un framework DI. Une **fonction factory** qui reçoit ses dépendances en argument suffit, et le typage garantit qu'on fournit les bonnes.

```ts
// Contrats (interfaces) — pas d'implémentation concrète ici
interface Clock { now(): Date; }
interface Mailer { send(to: Email, body: string): Promise<void>; }

interface Deps {
  clock: Clock;
  mailer: Mailer;
}

// Factory : construit le service en INJECTANT ses dépendances.
// Retourne un objet de méthodes — testable en passant des fakes.
function createInviteService(deps: Deps) {
  return {
    async invite(email: Email): Promise<Result<Date, InviteError>> {
      if (!email.includes('@')) return err({ kind: 'invalid-email', raw: email });
      await deps.mailer.send(email, 'Rejoins ta tribu !');
      return ok(deps.clock.now());
    },
  };
}

// En prod : vraies implémentations. En test : fakes déterministes.
const service = createInviteService({
  clock: { now: () => new Date() },
  mailer: { send: async () => {} },
});
```

Le pattern **factory** (fonction qui fabrique un objet configuré) et la **DI** (passer les dépendances plutôt que les créer dedans) se combinent : le service ne connaît que les **interfaces** `Clock`/`Mailer`, jamais les classes concrètes. On peut tout remplacer par des fakes en test — sans mock magique.

---

## 3. Worked examples

### Exemple 1 — Fermer les trous du cas concret (branding + Result)

Reprise de `getMembers` / `inviteMember`, corrigés.

```ts
// ─── domain/ids.ts ───────────────────────────────────────────────
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type MemberId = Brand<string, 'MemberId'>;
export type Email = Brand<string, 'Email'>;

export function toMemberId(raw: string): MemberId {
  if (!raw) throw new Error('MemberId vide');
  return raw as MemberId;
}
export function toEmail(raw: string): Email {
  // validation basique — la vraie forme sera vérifiée par zod à la frontière
  if (!raw.includes('@')) throw new Error(`Email invalide : ${raw}`);
  return raw.toLowerCase() as Email;
}

// ─── domain/result.ts ────────────────────────────────────────────
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ─── features/invite.ts ──────────────────────────────────────────
export type InviteError =
  | { kind: 'already-member'; email: Email }
  | { kind: 'quota-reached'; max: number };

// Signature honnête : l'échec métier est DANS le type de retour.
// familyId et email ne sont plus interchangeables (types nominaux distincts).
export function inviteMember(
  familyId: MemberId,
  email: Email,
  currentCount: number,
): Result<{ familyId: MemberId; email: Email }, InviteError> {
  if (currentCount >= 50) return err({ kind: 'quota-reached', max: 50 });
  return ok({ familyId, email });
}

// ─── Appel ────────────────────────────────────────────────────────
const r = inviteMember(toMemberId('fam_01'), toEmail('lou@tribuzen.app'), 12);
if (r.ok) {
  console.log('Invitation prête pour', r.value.email);
} else if (r.error.kind === 'quota-reached') {
  console.warn(`Quota atteint (max ${r.error.max})`);
}
// inviteMember(toEmail('x@y.fr'), toMemberId('fam'), 0); // ❌ arguments inversés
```

**Ce qu'on a gagné :** l'inversion `familyId`/`email` ne compile plus ; l'échec « quota » est visible dans la signature et doit être traité ; plus aucune exception cachée pour le cas métier.

### Exemple 2 — Valider une réponse d'API à la frontière avec zod

Le `res.json() as Member[]` mensonger, remplacé par une vraie validation.

```ts
import { z } from 'zod';
import { ok, err, type Result } from '../domain/result';

// 1. Le schéma : validateur runtime + source de type
const MemberSchema = z.object({
  id: z.string().min(1),
  familyId: z.string().min(1),
  displayName: z.string().min(1),
  role: z.enum(['admin', 'parent', 'enfant']),
  email: z.string().email().optional(),
});

// 2. Le type est DÉRIVÉ du schéma : jamais de dérive type/validation
type MemberDTO = z.infer<typeof MemberSchema>;

const MembersSchema = z.array(MemberSchema);

// 3. Erreur de frontière typée
type FetchError =
  | { kind: 'network'; status: number }
  | { kind: 'invalid-shape'; issues: z.ZodIssue[] };

// 4. La fonction valide à la frontière et renvoie un Result — pas de `as`
async function getMembers(familyId: string): Promise<Result<MemberDTO[], FetchError>> {
  const res = await fetch(`/api/families/${familyId}/members`);
  if (!res.ok) return err({ kind: 'network', status: res.status });

  const json: unknown = await res.json();          // ← honnêtement `unknown`
  const parsed = MembersSchema.safeParse(json);    // ← validation runtime
  if (!parsed.success) {
    return err({ kind: 'invalid-shape', issues: parsed.error.issues });
  }
  return ok(parsed.data);                           // ← MemberDTO[] GARANTI
}

// Appel
const result = await getMembers('fam_01');
if (result.ok) {
  // result.value est un MemberDTO[] réellement conforme, pas un pari
  for (const m of result.value) console.log(m.displayName, m.role);
} else if (result.error.kind === 'invalid-shape') {
  console.error('API hors contrat :', result.error.issues);
}
```

**Points clés du pattern frontière :**
- `await res.json()` est typé `unknown` — on refuse le `as` optimiste.
- `safeParse` fait le pont : après le `if (parsed.success)`, `parsed.data` est `MemberDTO[]` prouvé.
- `z.infer<typeof MemberSchema>` garde le type **synchronisé** avec la validation : changer le schéma change le type automatiquement.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire qu'un cast `as` valide la donnée

```ts
// ❌ `as` est une AFFIRMATION, pas une vérification. Zéro contrôle runtime.
const member = (await res.json()) as Member;
// Si l'API renvoie { role: "pdg" }, member.role vaut "pdg" et TS ne dit rien.

// ✅ zod vérifie réellement à l'exécution
const parsed = MemberSchema.safeParse(await res.json());
if (!parsed.success) throw new Error('Donnée hors contrat');
const member = parsed.data; // conforme, prouvé
```

**Règle :** `as` ne coûte rien au runtime *parce qu'il ne fait rien* au runtime. Toute donnée externe passe par un validateur.

### PIÈGE #2 — Brander en castant partout au lieu d'un constructeur unique

```ts
// ❌ Le cast `as Email` éparpillé annule le bénéfice du branding
const a: Email = 'x' as Email;          // string invalide « brandé » de force
sendInvite('pas-un-email' as Email);    // marque apposée sur une ordure

// ✅ UN constructeur qui valide — le seul endroit autorisé à caster
function toEmail(raw: string): Email {
  if (!raw.includes('@')) throw new Error('Email invalide');
  return raw as Email;
}
```

**Règle :** le branding ne vaut que si le cast est **confiné dans le smart constructor**. Un `as Email` ailleurs = la marque ment.

### PIÈGE #3 — Tout emballer dans `Result` (sur-ingénierie)

```ts
// ❌ Result pour un bug de programmation : bruit inutile
function getUserName(u: Member): Result<string, 'no-name'> { /* ... */ }
// displayName est toujours là (garanti par le type) — pas d'échec possible.

// ✅ Result seulement pour les échecs ATTENDUS et métier
function inviteMember(/* ... */): Result<Invite, InviteError> { /* ... */ }
// ✅ Exception pour l'invariant cassé / le bug
function assertMember(u: unknown): asserts u is Member {
  if (!u) throw new Error('invariant : membre requis');
}
```

**Règle :** `Result` = erreur métier que l'appelant DOIT décider comment gérer. Exception = bug / cas irrécupérable. Ne pas transformer chaque `throw` en `Result`.

### PIÈGE #4 — Dupliquer le type et le schéma zod

```ts
// ❌ Deux sources de vérité qui vont dériver
interface Member { id: string; role: 'admin' | 'parent'; }        // (a)
const MemberSchema = z.object({ id: z.string(), role: z.string() }); // (b) désync !

// ✅ Une seule source : dériver le type DU schéma
const MemberSchema = z.object({ id: z.string(), role: z.enum(['admin', 'parent']) });
type Member = z.infer<typeof MemberSchema>;
```

**Et l'inverse** — si `tribuzen/types` est la source de vérité, forcer le schéma à s'y conformer avec `satisfies` :

```ts
import type { MemberRole } from '../tribuzen/types';
const RoleSchema = z.enum(['admin', 'parent', 'enfant']) satisfies z.ZodType<MemberRole>;
// Si MemberRole gagne une valeur, RoleSchema ne compile plus → alerte immédiate.
```

### PIÈGE #5 — Champ optionnel là où il faut une union discriminée

```ts
// ❌ « accepté mais sans membre » est représentable — état invalide possible
interface Invitation {
  status: 'pending' | 'accepted' | 'expired';
  acceptedByMemberId?: MemberId; // optionnel : peut manquer même si accepted
}

// ✅ Union discriminée : la donnée n'existe que dans l'état qui la porte
type Invitation =
  | { status: 'pending'; expiresAt: Date }
  | { status: 'accepted'; acceptedByMemberId: MemberId }
  | { status: 'expired' };
```

**Règle :** « make illegal states unrepresentable ». Si un champ n'a de sens que dans un état, mets-le dans la variante, pas en optionnel global.

---

## 5. Ancrage TribuZen

Ces patterns durcissent le cœur métier de TribuZen. Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/src/
  domain/
    ids.ts          # Brand<>, MemberId, Email, FamilyId + smart constructors
    result.ts       # Result<T,E>, ok(), err()
  schemas/
    member.ts       # MemberSchema (zod) + type MemberDTO = z.infer<...>
  features/
    invite/
      invite.ts     # inviteMember(): Result<Invite, InviteError>
  api/
    members.ts      # getMembers() : safeParse à la frontière, pas de `as`
```

**Branded types** — `MemberId`, `FamilyId`, `Email` remplacent les `string` nus de `tribuzen/types`. Impossible de passer un `familyId` là où on attend un `memberId`. Les smart constructors (`toEmail`, `toMemberId`) sont le seul point de cast.

**`Result<T, E>` pour `inviteMember`** — l'invitation a des échecs métier attendus (déjà membre, quota, email invalide). Sa signature les expose : `Result<Invite, InviteError>`. L'admin UI branche un `switch` exhaustif sur `error.kind` pour afficher le bon message.

**`MemberSchema` zod + `z.infer`** — la réponse de `GET /families/:id/members` est validée à la frontière (`api/members.ts`). Le type `MemberDTO` est `z.infer<typeof MemberSchema>`, aligné sur `tribuzen/types` via `satisfies z.ZodType<Member>`. Une API qui dérive du contrat est détectée immédiatement, pas 40 lignes plus loin.

**Frontière** — règle d'équipe TribuZen : toute donnée entrant dans l'app (fetch, `localStorage`, params d'URL) passe par un schéma zod. À l'intérieur, on fait confiance aux types. Le `as` sur une donnée externe est interdit en revue.

**Commit cible :**
```
feat(domain): branded ids (MemberId, Email) + smart constructors
feat(domain): Result<T,E> — inviteMember expose ses erreurs métier
feat(api): valider les membres à la frontière avec MemberSchema (zod)
```

---

## 6. Points clés

1. TypeScript est **structurel** : le branding (`Brand<string,'Email'>`) crée des types **nominaux** distincts, empêchant de confondre deux `string` métier.
2. Un branded type ne vaut que si le cast est **confiné dans un smart constructor** qui valide.
3. Les types sont effacés au runtime : toute **donnée externe est `unknown`** et doit être validée à la **frontière**, pas affirmée avec `as`.
4. **zod** unifie validation runtime et type statique ; `z.infer<typeof Schema>` dérive le type DU schéma — une seule source de vérité.
5. `.parse()` lance, `.safeParse()` renvoie un discriminated union `{ success }` — préférer `safeParse` à la frontière.
6. `Result<T, E>` rend l'échec **explicite dans la signature** ; réservé aux erreurs métier attendues, pas aux bugs (qui restent des exceptions).
7. Une **union discriminée** rend les états invalides irreprésentables ; le `never` en `default` force l'exhaustivité.
8. Un **builder typé** n'expose `.build()` que quand les champs obligatoires sont renseignés — utile seulement si l'objet est complexe.
9. Un **event emitter** typé via *event map* + `keyof` vérifie nom et payload à la compilation.
10. La **DI légère** = passer les dépendances (interfaces) à une **factory** ; pas besoin de framework, et tout est remplaçable par des fakes en test.

---

## 7. Seeds Anki

```
Pourquoi deux types string comme MemberId et Email se confondent-ils en TypeScript, et comment les distinguer ?|TypeScript est structurel : même forme = même type. On les distingue par branding — Brand<string,'MemberId'> ajoute une marque fantôme (unique symbol) invisible au runtime, créant un type nominal distinct.
Qu'est-ce qu'un smart constructor et pourquoi est-il indispensable au branding ?|C'est la seule fonction autorisée à caster vers le type brandé (ex : toEmail(raw): Email). Il valide la donnée avant d'apposer la marque. Sans lui, un `as Email` éparpillé permettrait de brander n'importe quel string invalide.
Qu'est-ce que la « frontière » entre type statique et donnée runtime ?|La limite où une donnée externe (fetch, JSON.parse, localStorage) entre dans l'app. Elle est réellement `unknown` : les types étant effacés au runtime, il faut la VALIDER une fois là (zod), puis faire confiance au type à l'intérieur.
Que fait z.infer<typeof Schema> et quel problème résout-il ?|Il dérive le type statique À PARTIR d'un schéma zod. Problème résolu : une seule source de vérité pour la validation runtime ET le type — plus de dérive entre un type écrit à la main et le validateur.
Différence entre .parse() et .safeParse() en zod ?|.parse() renvoie la donnée typée ou LANCE une ZodError. .safeParse() ne lance jamais : il renvoie { success: true, data } ou { success: false, error }. À la frontière on préfère safeParse pour gérer l'échec sans try/catch.
Pourquoi un type Result<T,E> plutôt que des exceptions pour une erreur métier ?|Une exception est invisible dans la signature ; Result met l'échec dans le type de retour, forçant l'appelant à le traiter. Le narrowing empêche d'accéder à .value sans vérifier ok. Réservé aux échecs attendus, pas aux bugs.
Comment une union discriminée rend-elle un état invalide irreprésentable ?|Chaque variante porte seulement les champs valides pour cet état (ex : acceptedByMemberId n'existe que dans { status:'accepted' }). Pas de champ optionnel global qui traîne. Un never en default force à gérer toute nouvelle variante.
Comment un builder typé empêche-t-il un .build() incomplet ?|Il encode l'état de chaque champ obligatoire dans un paramètre générique (Unset/Set). Chaque setter retourne un type avec le champ marqué Set. build() est typé `this: Builder<Set,Set>` : il n'existe que quand tout l'obligatoire est renseigné.
En quoi consiste la DI légère typée avec une factory ?|Une fonction factory reçoit ses dépendances (interfaces, ex Clock/Mailer) en argument et retourne le service. Le service ne connaît que les interfaces, jamais les classes concrètes — en test on injecte des fakes déterministes, sans framework ni mock magique.
```

---

## Pont vers le lab

> Lab associé : `00-typescript/labs/lab-18-patterns/README.md`. Construire le noyau typé de TribuZen — branded ids, `Result`, `inviteMember`, et validation zod à la frontière — avec corrigé complet, variante J+30 et portage TribuZen.
