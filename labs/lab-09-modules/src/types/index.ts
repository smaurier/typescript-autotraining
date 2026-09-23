// index.ts — PAGE BLANCHE. Le barrel : l'API publique de `types/` (module 09 §2.3).
// `services/familyService.ts` (donné, déjà correct) importe TOUT depuis `./types` — pas
// depuis les fichiers internes. Tant que ce barrel est vide, RIEN ne compile en aval : c'est
// le point de départ voulu.
//
// Le tsconfig de ce lab impose `verbatimModuleSyntax: true` (module 09 §2.5) :
//   - `Family`, `Member`, `Role`, `Event` sont des TYPES PURS (interfaces/alias, aucune
//     valeur au runtime) → re-export avec `export type { ... }`.
//   - `ROLES` (roles.ts) est une VALEUR (un `const` avec de vraies données au runtime) →
//     re-export SANS `type`, un `export { ROLES } from './roles'` normal.
//   - Se tromper dans un sens (oublier `type` sur un type pur) laisse une ligne d'import
//     inutile dans le JS émis (piège #1). Se tromper dans l'autre sens (mettre `type` sur
//     `ROLES`) est une ERREUR DE COMPILATION sous `verbatimModuleSyntax` — TS refuse de
//     type-exporter un identifiant qui n'est pas un type.
//
// Écris les cinq lignes d'export ci-dessous.
export {};
