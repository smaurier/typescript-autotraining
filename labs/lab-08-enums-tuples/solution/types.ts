// types.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// Objet figé : `as const` fige les valeurs en littéraux + readonly.
// On le garde comme VALEUR pour pouvoir itérer au runtime (select, seed).
export const MEMBER_ROLE = {
  Admin: "admin",
  Parent: "parent",
  Enfant: "enfant",
} as const;

// Type union DÉRIVÉ de l'objet — une seule source, pas de duplication.
// keyof typeof MEMBER_ROLE => "Admin" | "Parent" | "Enfant"
// l'accès indexé [...]      => "admin" | "parent" | "enfant"
export type MemberRole = (typeof MEMBER_ROLE)[keyof typeof MEMBER_ROLE];

// Pourquoi PAS un enum ici :
// - enum génère un objet runtime (coût bundle) ;
// - enum est INTERDIT sous erasableSyntaxOnly (TS 5.8+) ;
// - une chaîne "admin" venue de l'API est directement un MemberRole,
//   pas besoin de MemberRole.Admin.

// Valide une chaîne externe (API, formulaire) et la restreint au type.
export function roleFromApi(raw: string): MemberRole | null {
  const valeurs = Object.values(MEMBER_ROLE) as readonly string[];
  return valeurs.includes(raw) ? (raw as MemberRole) : null;
}

// Exhaustivité prouvée par le compilateur : si on ajoute un rôle
// sans traiter son case, `role` n'est plus `never` et TS refuse.
export function labelRole(role: MemberRole): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "parent":
      return "Parent";
    case "enfant":
      return "Enfant";
    default: {
      const _exhaustif: never = role; // garde-fou d'exhaustivité
      return _exhaustif;
    }
  }
}
