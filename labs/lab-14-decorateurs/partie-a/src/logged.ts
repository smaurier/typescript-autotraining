// logged.ts — PAGE BLANCHE. Le décorateur STANDARD (Stage 3, TS 5 par défaut — AUCUN flag
// dans ce tsconfig, contrairement à partie-b). Signature IMPOSÉE par le standard : la
// fonction reçoit `(value, context)`, pas d'accès à `target`/`key`/`descriptor` comme
// l'ancien decorators legacy.
//
// export function logged<This, Args extends unknown[], Return>(value, context): fonction de même signature
//   - Générique sur This/Args/Return : le type de retour DOIT être exactement assignable à
//     la méthode remplacée (TS1270 sinon) — ne type pas `value`/le retour en `Function`, trop
//     lâche pour que TS l'accepte.
//   - `context.name` (le nom de la méthode décorée) sert à journaliser.
//   - Retourne une NOUVELLE fonction (le décorateur REMPLACE la méthode, il ne la modifie
//     pas en place) qui, à chaque appel :
//     1. Journalise l'appel via `logs.push(...)` — PAS `console.log` : `logs` est un tableau
//        exporté, lu par l'oracle, pour une preuve déterministe (pas un spy sur la console).
//        Format : `→ <nom>(<args séparés par ", ">)`.
//     2. Appelle `value.apply(this, args)` — la méthode ORIGINALE, inchangée.
//     3. Journalise le retour : `← <nom> = <résultat>`.
//     4. Retourne le résultat (le décorateur est transparent pour l'appelant).
export const logs: string[] = [];

export function logged<This, Args extends unknown[], Return>(
  _value: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  throw new Error("logged n'est pas encore implémenté");
}
