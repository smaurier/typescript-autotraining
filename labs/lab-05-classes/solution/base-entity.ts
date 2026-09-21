// base-entity.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import type { Serializable } from "./serializable";

// abstract : non instanciable, sert de plan aux entités concrètes.
export abstract class BaseEntity implements Serializable {
  // Paramètres de propriété : déclarent + initialisent id/createdAt
  // en readonly (une seule affectation, à la construction).
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
  ) {}

  // Méthode concrète partagée par toutes les sous-classes.
  ageMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  // Méthode abstraite : chaque sous-classe DOIT la fournir.
  abstract label(): string;

  // toJSON partielle : les sous-classes complètent via super.toJSON().
  toJSON(): Record<string, unknown> {
    return { id: this.id, createdAt: this.createdAt.toISOString() };
  }
}
