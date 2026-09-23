// logged.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
export const logs: string[] = [];

// Générique sur This/Args/Return : le type de retour du décorateur doit être EXACTEMENT
// assignable au type de la méthode remplacée (TS1270 sinon) — `Function` est trop lâche.
export function logged<This, Args extends unknown[], Return>(
  value: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  const nom = String(context.name);

  // Le décorateur REMPLACE la méthode par cette nouvelle fonction — `value` reste
  // accessible par closure, jamais modifiée en place.
  return function (this: This, ...args: Args): Return {
    logs.push(`→ ${nom}(${args.map(String).join(", ")})`);
    const resultat = value.apply(this, args);
    logs.push(`← ${nom} = ${String(resultat)}`);
    return resultat;
  };
}
