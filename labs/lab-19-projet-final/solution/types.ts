// types.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import { z } from "zod";

export const MemberSchema = z.object({
  id: z.string().uuid().brand<"MemberId">(),
  name: z.string(),
  role: z.enum(["admin", "parent", "enfant"]),
  email: z.string().email().optional(),
});
export type Member = z.infer<typeof MemberSchema>;
export type MemberId = Member["id"];

export const FamilySchema = z.object({
  id: z.string().uuid().brand<"FamilyId">(),
  name: z.string(),
  memberIds: z.array(z.string()),
});
export type Family = z.infer<typeof FamilySchema>;
export type FamilyId = Family["id"];

export const PostSchema = z.object({
  id: z.string().uuid().brand<"PostId">(),
  familyId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
});
export type Post = z.infer<typeof PostSchema>;
export type PostId = Post["id"];

export type Invitation =
  | { status: "pending"; email: string; sentAt: string }
  | { status: "accepted"; email: string; memberId: MemberId }
  | { status: "declined"; email: string; reason: string };

export function assertNever(x: never): never {
  throw new Error(`cas non géré : ${JSON.stringify(x)}`);
}

export type CreateMemberDto = Omit<Member, "id">;
export type MemberSummary = Pick<Member, "id" | "name">;

// id reste REQUIS, tout le reste devient optionnel — un patch qui doit savoir QUI il patche.
export type Patch<T extends { id: unknown }> = { id: T["id"] } & Partial<Omit<T, "id">>;
export type MemberPatch = Patch<Member>;

export type ApiError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number }
  | { kind: "validation"; issues: string[] };

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
