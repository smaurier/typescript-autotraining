// types.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// 1. Ensembles FERMÉS de valeurs → type union. Une interface ne peut pas
//    décrire une union, donc `type` est obligatoire ici.
export type MemberRole = "admin" | "parent" | "enfant";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

// 2. Family — objet du domaine → interface.
//    id/createdAt readonly : l'identité d'une famille ne change jamais.
export interface Family {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  motto?: string; // optionnel : string | undefined
  coverUrl?: string;
  memberIds: string[];
}

// 3. MemberBase — forme commune à tous les membres, base d'extension.
export interface MemberBase {
  readonly id: string;
  readonly familyId: string;
  displayName: string;
  role: MemberRole; // pas `string` : contraint aux 3 littéraux
  email?: string; // un enfant peut ne pas avoir d'email
  avatarUrl?: string;
  joinedAt: Date;
}

// 4. AdminMember — extends AJOUTE des propriétés sans réécrire les héritées,
//    et RESTREINT `role` de MemberRole vers le littéral "admin" (sous-type légal).
export interface AdminMember extends MemberBase {
  role: "admin";
  canInvite: boolean;
  canRemoveMembers: boolean;
}

// 5. Member — union des formes concrètes. Le module 04 s'en servira pour
//    narrower par `role` (discriminant).
export type Member = MemberBase | AdminMember;

// 6. Post — identité en readonly, editedAt optionnel, réactions à clés dynamiques.
export interface Post {
  readonly id: string;
  readonly familyId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  body: string;
  editedAt?: Date; // absent = jamais édité
  reactions: Record<string, number>; // clés emoji dynamiques → compteur
}

// 7. Invitation — token/ids figés, status contraint par l'union.
export interface Invitation {
  readonly id: string;
  readonly token: string;
  readonly familyId: string;
  readonly invitedByMemberId: string;
  email: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedByMemberId?: string; // rempli seulement à l'acceptation
}
