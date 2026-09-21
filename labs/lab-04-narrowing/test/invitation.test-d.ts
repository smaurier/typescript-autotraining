// Oracle de TYPES du lab 04 (vitest --typecheck).
import { expectTypeOf, test } from "vitest";
import type { Invitation, Notification } from "@lab/invitation";
import { assertNever, resumer, envoyer, estAccepted } from "@lab/invitation";

test("Invitation : union discriminée sur `status`, chaque variante porte SES champs", () => {
  expectTypeOf<Invitation>().toEqualTypeOf<
    | { status: "pending"; sentAt: Date }
    | { status: "accepted"; memberId: string; acceptedAt: Date }
    | { status: "expired"; expiredAt: Date }
  >();
});

test("le narrowing sur le tag donne accès aux bons champs, et refuse les autres", () => {
  const inv = {} as Invitation;
  if (inv.status === "accepted") {
    expectTypeOf(inv.memberId).toBeString();
    expectTypeOf(inv.acceptedAt).toEqualTypeOf<Date>();
  }
  if (inv.status === "pending") {
    expectTypeOf(inv.sentAt).toEqualTypeOf<Date>();
    // @ts-expect-error memberId n'existe pas sur une invitation pending
    inv.memberId;
  }
});

test("exhaustivité : après les trois cas, il ne reste rien (never)", () => {
  const inv = {} as Invitation;
  switch (inv.status) {
    case "pending":
    case "accepted":
    case "expired":
      break;
    default:
      expectTypeOf(inv).toBeNever();
  }
});

// assertNever(x: never): never est FOURNI dans le starter ; son typage est couvert par le test
// d'exhaustivité ci-dessus (default → never) et par le fait que la solution compile en l'appelant.
// expect-type ne sait pas asserter directement sur never (ExpectNever non appelable), on ne force pas.

test("resumer et envoyer retournent string", () => {
  expectTypeOf(resumer).parameter(0).toEqualTypeOf<Invitation>();
  expectTypeOf(resumer).returns.toBeString();
  expectTypeOf(envoyer).parameter(0).toEqualTypeOf<Notification>();
  expectTypeOf(envoyer).returns.toBeString();
});

test("Notification : union discriminée sur `kind`", () => {
  expectTypeOf<Notification>().toEqualTypeOf<
    | { kind: "email"; to: string; subject: string; body: string }
    | { kind: "sms"; phone: string; message: string }
    | { kind: "push"; deviceId: string; title: string; body: string }
  >();
});

test("estAccepted : predicate `is` → filter() rétrécit le tableau", () => {
  type Accepted = Extract<Invitation, { status: "accepted" }>;
  expectTypeOf(estAccepted).guards.toEqualTypeOf<Accepted>();
  const acceptees = ([] as Invitation[]).filter(estAccepted);
  expectTypeOf(acceptees).toEqualTypeOf<Accepted[]>();
  expectTypeOf(acceptees[0].memberId).toBeString();
});
