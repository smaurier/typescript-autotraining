// Une VALEUR, pas un type — le barrel doit la re-exporter SANS `export type`
// (piège #1 du module : sous verbatimModuleSyntax, mélanger types et valeurs dans un
// barrel 100% `export type` est une erreur de compilation, pas un détail cosmétique).
export const ROLES = ["admin", "parent", "enfant"] as const;
