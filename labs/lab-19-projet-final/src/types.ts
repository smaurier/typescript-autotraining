// types.ts — PAGE BLANCHE. Le dernier lab du cours : le noyau typé de TribuZen, la SOURCE
// UNIQUE de vérité réutilisable par le front et l'API — assemble tout le parcours (zod,
// ids brandés, unions discriminées, DTO dérivés, Result).
//
// export const MemberSchema / FamilySchema / PostSchema — schémas zod
//   - Id brandé : `z.string().uuid().brand<"MemberId">()` (idem Family/Post). C'est l'UNIQUE
//     source de marque — pas de `Brand<>` maison à côté, ce serait un second symbole
//     incompatible avec celui de zod.
//   - `Member` : `id`, `name`, `role: z.enum(["admin","parent","enfant"])`, `email` optionnel.
//   - `Family` : `id`, `name`, `memberIds: string[]`.
//   - `Post` : `id`, `familyId: string`, `content`, `createdAt: z.coerce.date()`.
//
// export type Member / Family / Post — DÉRIVÉS via `z.infer<typeof XxxSchema>`. N'écris
// jamais l'interface à la main : une seule source (le schéma zod), le type suit.
//
// export type MemberId / FamilyId / PostId — DÉRIVÉS des types par indexed access
// (`Member["id"]`), jamais un `Brand<>` maison séparé.
//
// export type Invitation — union discriminée sur `status` :
//   `{ status: "pending"; email: string; sentAt: string }`
//   `{ status: "accepted"; email: string; memberId: MemberId }`
//   `{ status: "declined"; email: string; reason: string }`
//
// export function assertNever(x: never): never
//   - Lève une erreur. Sert de garde-fou d'exhaustivité dans un `switch`.
//
// export type CreateMemberDto = Omit<Member, "id">
// export type MemberSummary = Pick<Member, "id" | "name">
// export type Patch<T extends { id: unknown }> — mapped type maison : `id` reste REQUIS,
//   tous les AUTRES champs deviennent optionnels. `export type MemberPatch = Patch<Member>`.
//
// export type ApiError — union discriminée sur `kind` :
//   `{ kind: "network"; message: string }`
//   `{ kind: "http"; status: number }`
//   `{ kind: "validation"; issues: string[] }`
//
// export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
// export function ok<T>(value: T): Result<T, never>
// export function err<E>(error: E): Result<never, E>
import { z } from "zod";

export const MemberSchema = z.object({});
export type Member = unknown;
export type MemberId = never;

export const FamilySchema = z.object({});
export type Family = unknown;
export type FamilyId = never;

export const PostSchema = z.object({});
export type Post = unknown;
export type PostId = never;

export type Invitation = never;

export function assertNever(_x: never): never {
  throw new Error("assertNever n'est pas encore implémenté");
}

export type CreateMemberDto = never;
export type MemberSummary = never;
export type Patch<T extends { id: unknown }> = never;
export type MemberPatch = never;

export type ApiError = never;

export type Result<T, E> = never;

export function ok<T>(_value: T): Result<T, never> {
  throw new Error("ok n'est pas encore implémenté");
}

export function err<E>(_error: E): Result<never, E> {
  throw new Error("err n'est pas encore implémenté");
}
