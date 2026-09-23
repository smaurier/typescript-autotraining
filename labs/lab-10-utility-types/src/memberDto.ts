// memberDto.ts — PAGE BLANCHE. `Member` (module 10) est la SOURCE UNIQUE du domaine — ne la
// modifie pas, ne la recopie pas. Tout le reste se DÉRIVE avec les utility types intégrés.
//
// export type CreateMemberDto = ...
//   - `Member` SANS `id` ni `createdAt` (générés par le serveur). Utility type : `Omit`.
//
// export type MemberUpdate = ...
//   - Les mêmes champs éditables que `CreateMemberDto`, tous optionnels (un patch partiel).
//     Compose `Partial` SUR `CreateMemberDto`, pas sur `Member` — `id` ne doit jamais devenir
//     un champ "optionnel-éditable".
//
// export type MemberSummary = ...
//   - Uniquement `id` + `name` (vue liste). Utility type : `Pick`.
//
// export type MemberRole = ...
//   - L'union des rôles, DÉRIVÉE de `Member` par indexed access (`Member["role"]`) — ne tape
//     jamais l'union `"admin" | "parent" | "enfant"` à la main : si `Member.role` change un
//     jour, `MemberRole` doit suivre automatiquement, sans y retoucher.
//
// export type Permission = "read" | "write" | "invite" | "delete";
// export const PERMISSIONS: Record<MemberRole, Permission[]>
//   - Une liste de permissions par rôle, EXHAUSTIVE — `Record<MemberRole, Permission[]>`
//     refuse à la compilation un objet auquel il manque un rôle.
//
// export function toSummary(m: Member): MemberSummary
//   - Projette un `Member` complet vers son résumé.
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string;
}

export type CreateMemberDto = never;

export type MemberUpdate = never;

export type MemberSummary = never;

export type MemberRole = never;

export type Permission = "read" | "write" | "invite" | "delete";

export const PERMISSIONS = {} as Record<MemberRole, Permission[]>;

export function toSummary(_m: Member): MemberSummary {
  throw new Error("toSummary n'est pas encore implémenté");
}
