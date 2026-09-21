// family.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import { BaseEntity } from "./base-entity";
import type { Member } from "./member";

export class Family extends BaseEntity {
  constructor(
    id: string,
    createdAt: Date,
    public labelText: string,
    private memberIds: string[] = [],
  ) {
    super(id, createdAt);
  }

  override label(): string {
    return this.labelText;
  }

  // Retourne `this` → chaînage typé même si on sous-classe Family plus tard.
  addMember(m: Member): this {
    this.memberIds.push(m.id);
    return this;
  }

  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), label: this.labelText, memberIds: this.memberIds };
  }
}
