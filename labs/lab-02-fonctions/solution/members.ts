// members.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// 1. Domaine ───────────────────────────────────────────────────────
export type Role = "owner" | "admin" | "member" | "guest";

export interface Invitation {
  email: string;
  role: Role;
  token: string;
  status: "pending"; // literal : une invitation naît toujours pending
}

export interface Member {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "active" | "suspended";
  lastSeenAt?: string; // optionnel : absent tant que jamais connecté
}

// Sous-type prouvé : ces deux champs sont GARANTIS non optionnels
export interface ActiveMember extends Member {
  status: "active";
  lastSeenAt: string;
}

// 2. inviteMember : optionnel AVEC défaut → role est Role dans le corps
export function inviteMember(email: string, role: Role = "member"): Invitation {
  return {
    email,
    role,
    token: crypto.randomUUID(),
    status: "pending", // inféré comme le literal "pending"
  };
}

// 3. Type guard : le corps couvre TOUTES les garanties d'ActiveMember
//    (sinon on obtiendrait un ActiveMember mensonger → crash runtime)
export function isActiveMember(m: Member): m is ActiveMember {
  return m.status === "active" && m.lastSeenAt !== undefined;
}

// 4. Callbacks typés ───────────────────────────────────────────────
// Notifier renvoie void : le corps peut renvoyer une valeur, elle est ignorée
export type Notifier = (m: ActiveMember) => void;

export function notifyActive(members: Member[], send: Notifier): void {
  // filter(isActiveMember) rétrécit Member[] → ActiveMember[]
  members.filter(isActiveMember).forEach((m) => send(m));
}

export function activeEmails(members: Member[]): string[] {
  // contextual typing : le param du map est inféré ActiveMember, aucune annotation
  return members.filter(isActiveMember).map((m) => m.email);
}

// 5. Assertion function : rétrécit tout le code qui suit l'appel
export function assertDefined<T>(v: T | null | undefined, name: string): asserts v is T {
  if (v === null || v === undefined) {
    throw new Error(`${name} est requis mais absent`);
  }
}

export function firstActive(members: Member[]): ActiveMember {
  const found = members.find(isActiveMember); // ActiveMember | undefined
  assertDefined(found, "membre actif"); // après : found est ActiveMember
  return found; // plus de | undefined
}
