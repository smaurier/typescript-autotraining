// Oracle RUNTIME du lab 08. Ne pas modifier.
import { describe, it, expect } from "vitest";
import { MEMBER_ROLE, roleFromApi, labelRole } from "@lab/types";
import type { LatLng } from "@lab/geo";
import { distanceKm, itineraire } from "@lab/geo";

describe("MEMBER_ROLE — objet figé itérable, sans enum", () => {
  it("expose exactement les trois valeurs, dans l'ordre, pour alimenter un <select>", () => {
    expect(Object.values(MEMBER_ROLE)).toEqual(["admin", "parent", "enfant"]);
  });
});

describe("roleFromApi — valide une chaîne externe", () => {
  it("accepte les valeurs connues, rejette le reste", () => {
    expect(roleFromApi("admin")).toBe("admin");
    expect(roleFromApi("enfant")).toBe("enfant");
    expect(roleFromApi("root")).toBeNull();
    expect(roleFromApi("Admin")).toBeNull(); // sensible à la casse : la valeur, pas la clé
  });
});

describe("labelRole — exhaustif", () => {
  it("un libellé non vide et distinct par rôle", () => {
    const labels = Object.values(MEMBER_ROLE).map(labelRole);
    expect(labels.every((l) => typeof l === "string" && l.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(3);
  });
});

describe("distanceKm — sur des LatLng", () => {
  const lyon: LatLng = [45.764, 4.8357];
  const paris: LatLng = [48.8566, 2.3522];
  it("Lyon → Paris ≈ 392 km (haversine), symétrique, nulle sur soi-même", () => {
    expect(distanceKm(lyon, paris)).toBeGreaterThan(385);
    expect(distanceKm(lyon, paris)).toBeLessThan(400);
    expect(distanceKm(lyon, paris)).toBeCloseTo(distanceKm(paris, lyon), 6);
    expect(distanceKm(lyon, lyon)).toBe(0);
  });
});

describe("itineraire — variadic, préserve l'arité", () => {
  it("renvoie [origine, ...etapes] dans l'ordre", () => {
    const maison: LatLng = [45.764, 4.8357];
    const trajet = itineraire(maison, [45.75, 4.85], [45.76, 4.84]);
    expect(trajet).toEqual([maison, [45.75, 4.85], [45.76, 4.84]]);
    expect(trajet).toHaveLength(3);
    expect(itineraire(maison)).toEqual([maison]);
  });
});
