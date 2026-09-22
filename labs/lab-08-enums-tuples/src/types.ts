// types.ts — ÉTAT À CORRIGER (le commit fautif du collègue)
// Le tsconfig de ce lab impose `erasableSyntaxOnly` : cet enum ne compile pas. C'est le point de départ.
// L'oracle (test/) importe ce fichier via `@lab/types` et attend :
//   MEMBER_ROLE (objet figé itérable), MemberRole (type union dérivé), roleFromApi, labelRole

export enum MemberRole {
  Admin = "admin",
  Parent = "parent",
  Enfant = "enfant",
}
