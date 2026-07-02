// tribuzen/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// SOURCE UNIQUE DE VÉRITÉ des formes métier de TribuZen.
// Tout le code (front, API mock, tests) importe ses types d'ICI — jamais de
// redéfinition locale. Un seul endroit à changer quand une forme évolue.
//
// Conventions posées dans ce module :
// - `id` est `readonly` partout : une entité ne change jamais d'identité.
// - propriétés optionnelles (`?`) pour ce que l'utilisateur peut ne pas remplir.
// - extension via `interface extends` pour les hiérarchies (MemberBase → AdminMember).
// - `type` (alias/unions) pour les valeurs fermées (rôles, statuts).
// ─────────────────────────────────────────────────────────────────────────────

/** Rôle d'un membre dans une famille. Union fermée → interface impossible, on utilise `type`. */
export type MemberRole = "admin" | "parent" | "enfant";

/** Statut du cycle de vie d'une invitation — discriminant de l'union `Invitation`. */
export type InvitationStatus = "pending" | "accepted" | "expired";

// ─── Famille ────────────────────────────────────────────────────────────────

/**
 * Une famille = l'espace privé partagé (le « cercle »).
 * `id` et `createdAt` sont figés après création → readonly.
 */
export interface Family {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  /** Optionnel : la famille peut ne pas avoir défini de devise/description. */
  motto?: string;
  /** URL d'illustration de couverture — optionnelle. */
  coverUrl?: string;
  memberIds: string[];
}

// ─── Membres ─────────────────────────────────────────────────────────────────

/**
 * Forme commune à TOUS les membres. Sert de base d'extension.
 * On ne l'utilise jamais seule comme "type de membre concret" : on l'étend.
 */
export interface MemberBase {
  readonly id: string;
  readonly familyId: string;
  displayName: string;
  role: MemberRole;
  /** Optionnel : un enfant peut ne pas avoir d'email. */
  email?: string;
  avatarUrl?: string;
  joinedAt: Date;
}

/**
 * Membre admin = MemberBase + capacités de gestion.
 * `extends` ajoute des propriétés SANS réécrire celles de MemberBase.
 */
export interface AdminMember extends MemberBase {
  role: "admin"; // on restreint le champ hérité à la valeur littérale "admin"
  canInvite: boolean;
  canRemoveMembers: boolean;
}

/**
 * Union des formes concrètes de membre manipulées dans l'app.
 * (module 04 exploitera cette union pour le narrowing par `role`.)
 */
export type Member = MemberBase | AdminMember;

// ─── Contenu : posts ─────────────────────────────────────────────────────────

/**
 * Un post dans le fil de la famille.
 * `editedAt` optionnel : présent seulement si le post a été modifié.
 */
export interface Post {
  readonly id: string;
  readonly familyId: string;
  readonly authorId: string;
  readonly createdAt: Date;
  body: string;
  editedAt?: Date;
  /** Réactions : clé = emoji, valeur = nombre. Index signature = clés dynamiques. */
  reactions: Record<string, number>;
}

// ─── Invitations ─────────────────────────────────────────────────────────────

/**
 * Invitation à rejoindre une famille — UNION DISCRIMINÉE sur `status`
 * (design du module 04). Chaque variante ne porte QUE les champs de son état :
 * impossible de lire `memberId` sur une invitation encore `pending`, ou
 * `acceptedAt` sur une invitation `expired`. Le discriminant `status` est un
 * littéral (jamais `string`) → TS narrow chaque cas dans un `switch`.
 */
export type Invitation =
  | { status: "pending"; email: string; sentAt: Date }
  | { status: "accepted"; email: string; memberId: string; acceptedAt: Date }
  | { status: "expired"; email: string; expiredAt: Date };
