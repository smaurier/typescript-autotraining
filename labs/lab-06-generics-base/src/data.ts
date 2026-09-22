// data.ts — POINT DE DÉPART (à refactorer, pas un gap-fill)
// C'est ICI que tu écris. L'oracle (test/) importe ce fichier via `@lab/data` et attend :
//   BaseEntity, Member, Family, ApiResponse<T>, ok, fail, getById, Repository<T>
// Tout ce qui est dupliqué ci-dessous doit disparaître au profit de briques génériques.

export interface Member {
  id: string;
  name: string;
  role: "admin" | "mod" | "member";
}

export interface Family {
  id: string;
  label: string;
}

// Duplication à supprimer : deux types identiques sauf `data`
export interface MemberResponse {
  data: Member | null;
  error: string | null;
}
export interface FamilyResponse {
  data: Family | null;
  error: string | null;
}

// Duplication à supprimer : deux helpers identiques sauf le type
export function getMemberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}
export function getFamilyById(families: Family[], id: string): Family | undefined {
  return families.find((f) => f.id === id);
}
