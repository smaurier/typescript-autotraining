// rappelService.ts — DONNÉ, déjà correct. Applique `@logged` (sans parenthèses — un
// décorateur standard s'applique directement) sur `envoyer`. Ne modifie pas ce fichier.
import { logged } from "./logged";

export class RappelService {
  @logged
  envoyer(rappelId: string): string {
    return `rappel ${rappelId} envoyé`;
  }
}
