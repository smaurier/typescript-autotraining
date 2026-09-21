// membres.ts — SOLUTION DE RÉFÉRENCE (commentée)
// Sert à prouver l'oracle (`npm run solution:01` = GREEN). Ne l'ouvre pas avant ton GREEN.

// ── 1. Le contrat de données interne ────────────────────────
export interface Member {
  id: string; // identifiant : string, jamais un number
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

// ── 4. Type de la config (literal union pour env) ───────────
type Environnement = "development" | "staging" | "production";

export interface AppConfig {
  env: Environnement;
  apiUrl: string;
  port: number;
  ssl: boolean;
}

// satisfies : valide la forme SANS écraser l'inférence.
// rawConfig.env reste le literal "development" (pas Environnement, pas string).
export const rawConfig = {
  env: "development",
  apiUrl: "http://localhost:3000",
  port: 3000,
  ssl: false,
} satisfies AppConfig;

// ── 2. Type guard : valide la forme BRUTE renvoyée par l'API ──
// L'API expose `active` (pas `isActive`) : le guard décrit donc la
// forme RÉSEAU, pas encore le Member interne. Le remap vient à l'étape 3.
export type RawMember = {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
};

export function isRawMember(x: unknown): x is RawMember {
  if (typeof x !== "object" || x === null) return false; // écarte null et primitifs
  const o = x as Record<string, unknown>; // vue indexable pour lire les champs
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.email === "string" &&
    typeof o.age === "number" && // rejette age: "30" (string) venant d'une API laxiste
    typeof o.active === "boolean" // l'API expose `active`, pas `isActive`
  );
}

// ── 3. Chargement typé : unknown + narrowing ────────────────
export async function chargerMembres(): Promise<Member[]> {
  const reponse = await fetch(rawConfig.apiUrl + "/members");
  const data: unknown = await reponse.json(); // unknown, PAS any → force la vérification

  if (!Array.isArray(data)) {
    throw new Error("Réponse API invalide : tableau attendu");
  }

  return data
    .filter(isRawMember) // ne garde que la forme brute conforme → RawMember[]
    .map((m) => ({
      // m : RawMember (typé) → aucun `as` nécessaire
      id: m.id,
      name: m.name,
      email: m.email,
      age: m.age,
      isActive: m.active, // remap explicite active (API) → isActive (interne)
    }));
}

// Pourquoi pas un guard `x is Member` qui vérifierait `active` ? Il serait mensonger :
// il annoncerait un `isActive` jamais contrôlé. Le guard décrit ce qu'il vérifie, rien d'autre.
