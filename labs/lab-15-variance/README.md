# Lab 15 — Variance et soundness

> **Outcome :** à la fin, tu sais auditer une assignation de types par la position de `T`, neutraliser le trou de covariance des tableaux avec `readonly`, et annoter la variance d'un générique avec `in`/`out` sous `tsc`.
> **Vrai outil :** le compilateur TypeScript (`tsc --strict`) — pas de harnais simulé, c'est l'erreur du compilateur qui fait foi.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur). Le critère de réussite est *ce que `tsc` accepte ou refuse*, pas un `expect`.

## Énoncé

On reprend le bus d'événements de l'admin TribuZen. Le domaine :

```ts
// src/domain.ts
export interface Member {
  id: string;
  name: string;
}

export interface AdminMember extends Member {
  permissions: string[];
}
```

Le starter compile mais contient **un bug de soundness bien réel** et **deux annotations manquantes**. Travaille dans un fichier `.ts` avec `tsc --strict` (donc `strictFunctionTypes` actif).

```ts
// src/bus.ts — STARTER (à corriger)
import type { Member, AdminMember } from "./domain";

// 1) Type de handler — variance à annoter
export type Handler<T> = (payload: T) => void;

// 2) Bus admin
export const adminHandlers: Handler<AdminMember>[] = [];
export function onAdminEvent(h: Handler<AdminMember>): void {
  adminHandlers.push(h);
}

// 3) Bug de covariance des tableaux — repère-le, il compile pourtant
export function corruptMembers(admins: AdminMember[]): void {
  const view: Member[] = admins;
  view.push({ id: "x", name: "intrus" }); // insère un Member nu dans admins
}
```

Prérequis pour tester : `npm i -D typescript` puis `npx tsc --strict --noEmit src/*.ts`.

## Étapes (en friction)

1. **Audit sans exécuter.** Pour chacune de ces trois lignes, écris à la main (commentaire) : covariant / contravariant + « sûr » ou « unsound », **avant** de lancer `tsc`.
   ```ts
   const a: Handler<AdminMember> = (m: Member) => console.log(m.name);   // ?
   const b: Handler<Member> = (a: AdminMember) => a.permissions.pop();   // ?
   const c: Member[] = [] as AdminMember[];                              // ?
   ```
   Lance `tsc`. Laquelle est refusée ? Correspond-elle à ton audit ?
2. **Neutralise le bug `corruptMembers`.** Change la signature/annotation pour que `view.push(...)` **ne compile plus**, sans changer l'appelant qui ne fait que *lire* `admins`.
3. **Annote `Handler<T>`.** Ajoute l'annotation de variance correcte (`in` / `out` / `in out`) et vérifie que `tsc` l'accepte. Puis introduis volontairement une erreur (mets `T` dans la mauvaise position) et lis le code d'erreur.
4. **Généralise le bus.** Écris `EventHandler<in T>` et `MemberEvent<out T>` et prouve, par une assignation qui compile et une qui échoue, que la contravariance protège l'abonnement.

## Corrigé complet commenté

```ts
// src/bus.ts — CORRIGÉ
import type { Member, AdminMember } from "./domain";

// ── Étape 1 : audit ────────────────────────────────────────────────
// a) param élargi (Member) pour Handler<AdminMember> attendu
//    Handler est contravariant → Handler<Member> <: Handler<AdminMember> → SÛR, accepté.
const a: Handler<AdminMember> = (m: Member) => console.log(m.name);        // ✅

// b) param rétréci (AdminMember) pour Handler<Member> attendu
//    Direction interdite par la contravariance + lit .permissions → UNSOUND.
// const b: Handler<Member> = (x: AdminMember) => x.permissions.pop();     // ❌ TS refuse (strictFunctionTypes)

// c) AdminMember[] vers Member[] : covariance des tableaux → accepté, mais unsound.
const c: Member[] = [] as AdminMember[];                                   // ✅ compile (piège connu)

// ── Étape 3 : Handler contravariant ────────────────────────────────
// T n'est qu'en position d'ENTRÉE (paramètre) → contravariant → `in`.
export type Handler<in T> = (payload: T) => void;
// Si on écrivait `out T` ici : erreur TS2636 (T utilisé en position contravariante).

export const adminHandlers: Handler<AdminMember>[] = [];
export function onAdminEvent(h: Handler<AdminMember>): void {
  adminHandlers.push(h);
}

// Contravariance en action : un handler générique Member s'abonne au bus admin (sûr).
const auditHandler: Handler<Member> = (m) => console.log("audit", m.name);
onAdminEvent(auditHandler);                                                // ✅

// ── Étape 2 : bug neutralisé via readonly ──────────────────────────
// On reçoit le tableau en LECTURE SEULE : la covariance redevient sûre,
// et `.push` n'existe tout simplement plus sur readonly T[].
export function readMembers(admins: readonly AdminMember[]): void {
  const view: readonly Member[] = admins; // ✅ covariance SÛRE
  // view.push({ id: "x", name: "intrus" }); // ❌ Property 'push' does not exist on readonly
  view.forEach((m) => console.log(m.name)); // lecture pure, OK
}

// ── Étape 4 : bus générique annoté ─────────────────────────────────
// MemberEvent expose payload en lecture → sortie → covariant → `out`.
export interface MemberEvent<out T extends Member> {
  readonly type: string;
  readonly payload: T;
}

// EventHandler consomme l'événement → entrée → contravariant → `in`.
export type EventHandler<in T extends Member> = (event: MemberEvent<T>) => void;

export class EventBus<T extends Member> {
  private handlers: EventHandler<T>[] = [];
  subscribe(h: EventHandler<T>): void {
    this.handlers.push(h);
  }
  emit(event: MemberEvent<T>): void {
    for (const h of this.handlers) h(event);
  }
}

const adminBus = new EventBus<AdminMember>();

// ✅ handler générique Member accepté sur un bus admin (contravariance)
const genericAudit: EventHandler<Member> = (e) => console.log(e.payload.name);
adminBus.subscribe(genericAudit);

// ❌ handler exigeant AdminMember sur un bus de Member : refusé
// const memberBus = new EventBus<Member>();
// memberBus.subscribe((e: MemberEvent<AdminMember>) => e.payload.permissions.pop());
//   -> EventHandler<AdminMember> n'est pas assignable à EventHandler<Member>.
```

Points de contrôle du corrigé :
- `b` refusé et `c` accepté = la démonstration vivante que TS bloque la contravariance dangereuse mais tolère la covariance des tableaux.
- Remplacer `Handler<in T>` par `Handler<out T>` doit produire **TS2636** — c'est le garde-fou des annotations.
- `readonly` fait disparaître `push` de l'API : c'est *structurel*, pas une convention.

## Variante J+30 (fading)

Sans relire le corrigé, en **15 minutes** : on te donne un type `Repo<T> = { save(x: T): void; findById(id: string): T | null }`.
1. Détermine sa variance en `T` par audit de positions (une phrase).
2. Ajoute la bonne annotation `in` / `out` / `in out`.
3. Prouve ta réponse en écrivant **une** assignation entre `Repo<AdminMember>` et `Repo<Member>` qui doit échouer, et explique pourquoi aucune ne peut réussir.

(Attendu : `save` met `T` en entrée, `findById` le sort → **invariant** → `in out` ; aucune assignation entre `Repo<Member>` et `Repo<AdminMember>` ne compile.)

## Application TribuZen

Porte le corrigé dans `smaurier/tribuzen` :
- Crée `src/core/events.ts` avec `MemberEvent<out T>` et `EventHandler<in T>`, et `src/core/event-bus.ts` avec `EventBus<T>`.
- Change la signature de `Family.members` exposée aux composants d'affichage en `readonly Member[]` (repère les `.push` qui cassent — ce sont des mutations qui ne devaient pas être là).
- Abonne le module d'audit avec un `EventHandler<Member>` générique sur le bus admin ; vérifie en CI que `npx tsc --noEmit` échoue si quelqu'un tente d'abonner un handler exigeant `.permissions` sur un bus de membres.
- Commit : `feat(core): bus d'événements typé par variance (in/out) + listes membres readonly` sur `smaurier/tribuzen`.
