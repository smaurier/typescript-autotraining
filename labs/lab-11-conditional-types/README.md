# Lab 11 — Conditional types et infer

> **Outcome :** à la fin, tu sais écrire un conditional type avec `infer`, reconstruire `ReturnType` / `Exclude` à la main, et contrôler la distribution sur une union — le tout vérifié par le compilateur TypeScript.
> **Vrai outil :** TypeScript `^5` (`tsc --noEmit` ou le survol de types dans l'éditeur). Pas de test-runner : en programmation de types, **le compilateur EST le test**.
> **Feedback :** le coach valide en session. Tes assertions de type se vérifient à l'œil (survol) et via un helper `Expect` qui échoue à la compilation si un type est faux.

## Énoncé

Tu construis les types de la couche API et événements de TribuZen. Crée un fichier `conditional.ts` et écris les types demandés. Aucune valeur à exécuter : tout doit être **correct à la compilation**.

Point de départ minimal (recopie-le, ne complète pas des trous — écris les types toi-même) :

```ts
// ── Helper de vérification au niveau types ───────────────────────────────
// Expect<T> ne compile QUE si T vaut exactement true.
// Equal<A, B> renvoie true ssi A et B sont le même type.
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ── Données TribuZen fournies ────────────────────────────────────────────
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

interface Member { id: string; name: string; role: 'admin' | 'member' }
type GetMemberResponse = ApiResponse<Member>;

interface InviteEvent { email: string; invitedBy: string }
interface JoinEvent   { memberId: string; joinedAt: string }
interface LeaveEvent  { memberId: string; reason: string }

type Role = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
```

À produire (dans le même fichier) :

1. **`Unwrap<T>`** — extrait le `data` d'une `ApiResponse<T>` via `infer`. `Unwrap<GetMemberResponse>` doit valoir `Member`.
2. **`MyReturnType<T>`** — reconstruis `ReturnType` avec `infer`.
3. **`MyExclude<T, U>`** — reconstruis `Exclude` en t'appuyant sur la distribution.
4. **`MemberEvent<T>`** — conditional imbriqué : `'invite' → InviteEvent`, `'join' → JoinEvent`, `'leave' → LeaveEvent`, sinon `never`.
5. **`IsNever<T>`** — renvoie `true` ssi `T` est `never` (pense à désactiver la distribution).
6. **`StaffRole`** — à partir de `Role`, garde `owner | admin | moderator` via distribution.

## Étapes (en friction)

1. Écris `Unwrap<T>` avec la forme cible `{ data: infer D }`. Vérifie avec `type _1 = Expect<Equal<Unwrap<GetMemberResponse>, Member>>;`.
2. Écris `MyReturnType<T>` ; teste sur `() => Member`. Que rend-il pour un `T` qui n'est pas une fonction ? Choisis la branche `else` en conséquence.
3. Écris `MyExclude<T, U>` sans emballer dans un tuple (tu VEUX la distribution ici). Vérifie `MyExclude<Role, 'member' | 'guest'>`.
4. Écris `MemberEvent<T>` en chaîne `else if`. Vérifie qu'un nom inconnu donne `never`.
5. Écris `IsNever<T>`. Teste d'abord la version naïve `T extends never ? true : false` sur `IsNever<never>` : observe le bug. Corrige avec `[T] extends [never]`.
6. Dérive `StaffRole` et son complément `BasicRole = MyExclude<Role, StaffRole>`.

## Corrigé complet commenté

```ts
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

interface ApiResponse<T> { data: T; status: number; timestamp: string }
interface Member { id: string; name: string; role: 'admin' | 'member' }
type GetMemberResponse = ApiResponse<Member>;

interface InviteEvent { email: string; invitedBy: string }
interface JoinEvent   { memberId: string; joinedAt: string }
interface LeaveEvent  { memberId: string; reason: string }
type Role = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

// 1) Unwrap : on propose la forme { data: infer D } ; si T colle, D est le payload.
//    infer D n'existe que dans la branche vraie. Sinon never (pas d'enveloppe).
type Unwrap<T> = T extends { data: infer D } ? D : never;

type _1 = Expect<Equal<Unwrap<GetMemberResponse>, Member>>;        // ✅
type _1b = Expect<Equal<Unwrap<{ status: number }>, never>>;       // ✅ pas de data

// 2) MyReturnType : forme cible (...args) => infer R. On capture le retour.
//    La contrainte T extends (...) => any garantit qu'on reçoit bien une fonction.
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

type _2 = Expect<Equal<MyReturnType<() => Member>, Member>>;       // ✅
type _2b = Expect<Equal<MyReturnType<(x: number) => boolean>, boolean>>; // ✅

// 3) MyExclude : paramètre NU (T testé directement) => distribution.
//    Chaque membre de T qui matche U devient never, puis never s'absorbe.
type MyExclude<T, U> = T extends U ? never : T;

type _3 = Expect<Equal<MyExclude<Role, 'member' | 'guest'>, 'owner' | 'admin' | 'moderator'>>; // ✅

// 4) MemberEvent : conditional imbriqué (else if). Nom inconnu -> never.
type MemberEvent<T extends string> =
  T extends 'invite' ? InviteEvent :
  T extends 'join'   ? JoinEvent   :
  T extends 'leave'  ? LeaveEvent  :
  never;

type _4 = Expect<Equal<MemberEvent<'invite'>, InviteEvent>>;       // ✅
type _4b = Expect<Equal<MemberEvent<'ping'>, never>>;              // ✅ verrouillé

// 5) IsNever : la version naïve échoue car la distribution sur l'union vide rend never.
//    On emballe dans un tuple pour tester never EN BLOC.
type IsNever<T> = [T] extends [never] ? true : false;

type _5 = Expect<Equal<IsNever<never>, true>>;                     // ✅
type _5b = Expect<Equal<IsNever<string>, false>>;                  // ✅
// type Naif<T> = T extends never ? true : false;
// type _5bug = Naif<never>; // = never (JAMAIS true) — le bug à voir de ses yeux

// 6) StaffRole via distribution (Extract maison), puis son complément.
type MyExtract<T, U> = T extends U ? T : never;
type StaffRole = MyExtract<Role, 'owner' | 'admin' | 'moderator'>; // 'owner' | 'admin' | 'moderator'
type BasicRole = MyExclude<Role, StaffRole>;                       // 'member' | 'guest'

type _6 = Expect<Equal<StaffRole, 'owner' | 'admin' | 'moderator'>>; // ✅
type _6b = Expect<Equal<BasicRole, 'member' | 'guest'>>;             // ✅
```

Vérification : `npx tsc --noEmit conditional.ts`. **Zéro erreur = tout est juste.** Une seule ligne `Expect<...>` en rouge = le type correspondant est faux.

## Variante J+30 (fading)

Sans relire le corrigé, en **20 minutes** :

1. Écris `UnwrapDeep<T>` qui déballe une `ApiResponse<ApiResponse<X>>` imbriquée jusqu'au `data` final (récursion sur `infer`).
2. Écris `EventNames = keyof-like` : à partir de `MemberEvent`, retrouve l'union `'invite' | 'join' | 'leave'` en partant d'une map d'événements `{ invite: InviteEvent; join: JoinEvent; leave: LeaveEvent }` et de `keyof`.
3. Contrainte ajoutée : `PayloadOf<M, K extends keyof M>` qui rend `M[K]` **sans** utiliser d'indexation directe — force-toi à passer par un conditional `M extends Record<K, infer P> ? P : never`.

Objectif : reproduire `infer` récursif + distribution de mémoire, sans le support du module.

## Application TribuZen

Porte ces types dans `smaurier/tribuzen` :

- `src/lib/api/types.ts` — `ApiResponse<T>`, `Unwrap<T>`, `UnwrapApi<T>`. Branche `Unwrap` sur le client HTTP : la fonction `fetchMember()` renvoie `ApiResponse<Member>`, mais le hook expose `Unwrap<...>` = `Member`.
- `src/lib/events/member.ts` — `MemberEvent<T>` + un `emit<T>(type: T, payload: MemberEvent<T>)` typé, pour le bus d'événements membres (invitation, arrivée, départ).
- `src/lib/auth/roles.ts` — `Role`, `StaffRole`, `BasicRole` (Extract / Exclude), source unique de vérité pour les permissions.

Commit attendu : `feat(types): Unwrap + MemberEvent + Role subsets via conditional types` sur `smaurier/tribuzen`.
