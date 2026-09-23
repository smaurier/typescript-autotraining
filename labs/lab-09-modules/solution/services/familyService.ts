// familyService.ts — DONNÉ, déjà correct. Consomme UNIQUEMENT le barrel `../types`, jamais
// les fichiers internes (family.ts/member.ts/event.ts/roles.ts) directement — c'est tout le
// point d'un barrel (module 09 §2.3) : les fichiers internes peuvent bouger sans casser ce
// fichier. Mélange volontaire d'imports de TYPES (`Family`, `Member`, `Role`, `Event`) et
// d'une VALEUR (`ROLES`) depuis le MÊME barrel — si ton `index.ts` est mal écrit, ce fichier
// ne compile pas du tout.
import type { Event, Family, Member, Role } from "../types";
import { ROLES } from "../types";

export function creerFamilleVide(id: string, name: string, maintenant: string): Family {
  return { id, name, memberIds: [], createdAt: maintenant };
}

export function estUnRoleValide(valeur: string): valeur is Role {
  return (ROLES as readonly string[]).includes(valeur);
}

export function nomsDesMembres(membres: readonly Member[]): string[] {
  return membres.map((m) => m.name);
}

export function evenementsAVenir(evenements: readonly Event[], maintenant: string): Event[] {
  return evenements.filter((e) => e.startsAt >= maintenant).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
