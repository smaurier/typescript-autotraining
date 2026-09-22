// Oracle de TYPES du lab 08 (vitest --typecheck, tsconfig en isolatedModules + erasableSyntaxOnly :
// tout enum restant dans src/ est une erreur de compilation).
import { expectTypeOf, test } from "vitest";
import type { MemberRole } from "@lab/types";
import { MEMBER_ROLE, roleFromApi, labelRole } from "@lab/types";
import type { LatLng } from "@lab/geo";
import { distanceKm, itineraire } from "@lab/geo";

test("MEMBER_ROLE : valeurs littérales readonly ; MemberRole dérivé de l'objet", () => {
  expectTypeOf(MEMBER_ROLE.Admin).toEqualTypeOf<"admin">();
  expectTypeOf(MEMBER_ROLE.Parent).toEqualTypeOf<"parent">();
  expectTypeOf(MEMBER_ROLE.Enfant).toEqualTypeOf<"enfant">();
  expectTypeOf<MemberRole>().toEqualTypeOf<"admin" | "parent" | "enfant">();
  // @ts-expect-error objet figé par `as const`
  MEMBER_ROLE.Admin = "root";
});

test("une chaîne API devient un MemberRole sans passer par une clé d'enum", () => {
  expectTypeOf(roleFromApi).returns.toEqualTypeOf<MemberRole | null>();
  const r: MemberRole = "admin"; // pas de MemberRole.Admin : la valeur EST le type
  expectTypeOf(labelRole(r)).toBeString();
  // @ts-expect-error "root" n'est pas un MemberRole
  labelRole("root");
});

test("LatLng : exactement deux nombres, labellisés, immuables", () => {
  expectTypeOf<LatLng>().toEqualTypeOf<readonly [lat: number, lng: number]>();
  const p: LatLng = [45.764, 4.8357];
  // @ts-expect-error tuple readonly
  p[0] = 0;
  // @ts-expect-error trois nombres ≠ [lat, lng]
  distanceKm([1, 2, 3], p);
  // @ts-expect-error un number[] n'a pas d'arité garantie
  distanceKm([1, 2] as number[], p);
});

test("itineraire : le type de retour connaît le nombre exact d'étapes", () => {
  const maison: LatLng = [45.764, 4.8357];
  const trajet = itineraire(maison, [45.75, 4.85], [45.76, 4.84]);
  // expect-type compare mal les tuples imbriqués readonly : on vérifie l'arité et chaque case.
  expectTypeOf(trajet[0]).toMatchTypeOf<LatLng>();
  expectTypeOf(trajet[2]).toMatchTypeOf<LatLng>();
  // @ts-expect-error il n'y a que trois cases : l'arité est connue du compilateur
  trajet[3];
  expectTypeOf(trajet.length).toEqualTypeOf<3>();
  expectTypeOf(itineraire(maison).length).toEqualTypeOf<1>();
  // @ts-expect-error une étape n'est pas un LatLng
  itineraire(maison, [1, 2, 3]);
});
