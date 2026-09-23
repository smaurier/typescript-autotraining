// index.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// Types purs (interfaces, alias) : re-export TYPE-ONLY. Sous verbatimModuleSyntax, ce sont
// les seules lignes qui garantissent l'effacement au build (module 09 §2.5, piège #1).
export type { Family } from "./family";
export type { Member, Role } from "./member";
export type { Event } from "./event";

// ROLES est une VALEUR (un `const` avec de vraies données au runtime) : re-export NORMAL,
// jamais `export type` — sous verbatimModuleSyntax, `export type { ROLES }` serait une
// ERREUR DE COMPILATION (ROLES n'est pas un type).
export { ROLES } from "./roles";
