// memberDto.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
export interface Member {
  id: string;
  familyId: string;
  name: string;
  role: "admin" | "parent" | "enfant";
  createdAt: string;
}

// Omit : tout Member SAUF id/createdAt (générés serveur).
export type CreateMemberDto = Omit<Member, "id" | "createdAt">;

// Partial SUR CreateMemberDto, pas sur Member : id ne devient jamais optionnel-éditable.
export type MemberUpdate = Partial<CreateMemberDto>;

// Pick : uniquement les deux champs de la vue liste.
export type MemberSummary = Pick<Member, "id" | "name">;

// Indexed access : DÉRIVÉ de Member, jamais retapé à la main.
export type MemberRole = Member["role"];

export type Permission = "read" | "write" | "invite" | "delete";

// Record<MemberRole, ...> : exhaustif par construction, un rôle manquant ne compile pas.
export const PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin: ["read", "write", "invite", "delete"],
  parent: ["read", "write", "invite"],
  enfant: ["read"],
};

export function toSummary(m: Member): MemberSummary {
  return { id: m.id, name: m.name };
}
