// serializable.ts — SOLUTION DE RÉFÉRENCE. Ne l'ouvre pas avant ton GREEN.
// Contrat commun : toute entité sait produire un objet JSON-safe.
export interface Serializable {
  toJSON(): Record<string, unknown>;
}
