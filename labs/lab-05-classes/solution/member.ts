// member.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import { BaseEntity } from "./base-entity";

export class Member extends BaseEntity {
  // #private JS : confidentialité RÉELLE (jamais dans JSON, ni via cast).
  #sessionToken: string;

  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    private email: string, // private TS : encapsulation de confort
    sessionToken: string,
  ) {
    super(id, createdAt); // OBLIGATOIRE avant tout accès à this
    this.#sessionToken = sessionToken;
  }

  // Fabrique statique : id + date cohérents à chaque création.
  static create(name: string, email: string, token: string): Member {
    return new Member(crypto.randomUUID(), new Date(), name, email, token);
  }

  // override (noImplicitOverride) : attrape les fautes de frappe.
  override label(): string {
    return this.name;
  }

  // Le #sessionToken n'est PAS ajouté → il ne fuite pas.
  override toJSON(): Record<string, unknown> {
    return { ...super.toJSON(), name: this.name, email: this.email };
  }

  // Seul endroit où l'on peut lire le champ #private.
  hasValidSession(token: string): boolean {
    return this.#sessionToken === token;
  }
}
