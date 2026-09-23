export type Role = "admin" | "parent" | "enfant";

export interface Member {
  id: string;
  name: string;
  role: Role;
  familyId: string;
}
