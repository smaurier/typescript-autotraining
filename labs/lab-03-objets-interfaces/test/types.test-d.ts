// Oracle de TYPES du lab 03 (vitest --typecheck). Ces tests compilent, ou pas.
import { expectTypeOf, test } from "vitest";
import type {
  MemberRole,
  InvitationStatus,
  Family,
  MemberBase,
  AdminMember,
  Member,
  Post,
  Invitation,
} from "@lab/types";

// ─── 1-2. Unions fermées ────────────────────────────────────────────────────
test("MemberRole et InvitationStatus sont des unions fermées de littéraux", () => {
  expectTypeOf<MemberRole>().toEqualTypeOf<"admin" | "parent" | "enfant">();
  expectTypeOf<InvitationStatus>().toEqualTypeOf<"pending" | "accepted" | "expired" | "revoked">();
});

// ─── 3. Family ──────────────────────────────────────────────────────────────
test("Family : identité readonly, optionnels, memberIds: string[]", () => {
  expectTypeOf<Family["id"]>().toBeString();
  expectTypeOf<Family["createdAt"]>().toEqualTypeOf<Date>();
  expectTypeOf<Family["name"]>().toBeString();
  expectTypeOf<Family["motto"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Family["coverUrl"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Family["memberIds"]>().toEqualTypeOf<string[]>();

  const famille = {} as Family;
  // @ts-expect-error id est readonly
  famille.id = "f2";
  // @ts-expect-error createdAt est readonly
  famille.createdAt = new Date();
  famille.name = "Les Dupont"; // name est modifiable
});

// ─── 4-6. MemberBase → AdminMember → Member ─────────────────────────────────
test("MemberBase : rôle contraint par MemberRole, email/avatar optionnels, ids readonly", () => {
  expectTypeOf<MemberBase["role"]>().toEqualTypeOf<MemberRole>();
  expectTypeOf<MemberBase["email"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<MemberBase["avatarUrl"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<MemberBase["joinedAt"]>().toEqualTypeOf<Date>();
  expectTypeOf<MemberBase["displayName"]>().toBeString();

  const m = {} as MemberBase;
  // @ts-expect-error familyId est readonly
  m.familyId = "f9";
});

test("AdminMember étend MemberBase, restreint role à \"admin\", ajoute deux booléens", () => {
  expectTypeOf<AdminMember>().toMatchTypeOf<MemberBase>();
  expectTypeOf<AdminMember["role"]>().toEqualTypeOf<"admin">();
  expectTypeOf<AdminMember["canInvite"]>().toBeBoolean();
  expectTypeOf<AdminMember["canRemoveMembers"]>().toBeBoolean();
});

test("Member est l'union MemberBase | AdminMember", () => {
  expectTypeOf<Member>().toEqualTypeOf<MemberBase | AdminMember>();
});

// ─── 7. Post ────────────────────────────────────────────────────────────────
test("Post : identité readonly, editedAt optionnel, reactions à clés dynamiques", () => {
  expectTypeOf<Post["body"]>().toBeString();
  expectTypeOf<Post["editedAt"]>().toEqualTypeOf<Date | undefined>();
  expectTypeOf<Post["reactions"]>().toEqualTypeOf<Record<string, number>>();

  const post = {} as Post;
  // @ts-expect-error authorId est readonly
  post.authorId = "m9";
  post.reactions["❤️"] = 1; // clé dynamique autorisée par Record
});

// ─── 8. Invitation ──────────────────────────────────────────────────────────
test("Invitation : token/ids readonly, status contraint, acceptedByMemberId optionnel", () => {
  expectTypeOf<Invitation["status"]>().toEqualTypeOf<InvitationStatus>();
  expectTypeOf<Invitation["expiresAt"]>().toEqualTypeOf<Date>();
  expectTypeOf<Invitation["acceptedByMemberId"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Invitation["email"]>().toBeString();

  const inv = {} as Invitation;
  // @ts-expect-error token est readonly
  inv.token = "tok_2";
  inv.status = "accepted"; // status est modifiable
});

// ─── Objets VALIDES (doivent compiler tels quels) ───────────────────────────
test("les objets valides du domaine compilent sans annotation superflue", () => {
  const famille: Family = { id: "f1", createdAt: new Date(), name: "Les Dupont", memberIds: ["m1", "m2"] };
  const enfant: MemberBase = { id: "m1", familyId: "f1", displayName: "Léa", role: "enfant", joinedAt: new Date() };
  const chef: AdminMember = {
    id: "m2", familyId: "f1", displayName: "Alice", role: "admin", email: "alice@tribuzen.app",
    joinedAt: new Date(), canInvite: true, canRemoveMembers: true,
  };
  const membres: Member[] = [enfant, chef]; // structural typing : AdminMember est un Member
  const post: Post = { id: "p1", familyId: "f1", authorId: "m2", createdAt: new Date(), body: "Pique-nique 🎉", reactions: { "👍": 2 } };
  const invit: Invitation = {
    id: "i1", token: "tok_abc", familyId: "f1", invitedByMemberId: "m2", email: "bob@example.com",
    status: "pending", expiresAt: new Date(),
  };
  expectTypeOf(famille).toEqualTypeOf<Family>();
  expectTypeOf(membres).toEqualTypeOf<Member[]>();
  expectTypeOf(post).toEqualTypeOf<Post>();
  expectTypeOf(invit).toEqualTypeOf<Invitation>();
});

// ─── Objets PIÈGES (tsc DOIT refuser chacun) ────────────────────────────────
test("les objets pièges sont refusés par le compilateur", () => {
  const enfant = {} as MemberBase;
  const post = {} as Post;

  // (a) rôle hors nomenclature : la typo est attrapée
  // @ts-expect-error "amdin" n'est pas un MemberRole
  const faux: MemberBase = { ...enfant, role: "amdin" };

  // (c) excess property check : `likes` n'existe pas sur Post, même via spread
  // @ts-expect-error propriété inconnue dans un littéral frais
  const post2: Post = { ...post, likes: 3 };

  // (d) AdminMember incomplet
  // @ts-expect-error canRemoveMembers manquant
  const chef2: AdminMember = { id: "m3", familyId: "f1", displayName: "Max", role: "admin", joinedAt: new Date(), canInvite: true };

  void faux; void post2; void chef2;
});
