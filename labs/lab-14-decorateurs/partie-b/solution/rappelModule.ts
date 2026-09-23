// rappelModule.ts — DONNÉ, déjà correct. Deux classes réelles, chacune `@Injectable()`.
// `RappelService` dépend de `RappelRepository` par CONSTRUCTEUR — c'est exactement ce que
// `resolve()` doit injecter automatiquement, sans que ce fichier n'ait besoin d'y penser.
import { Injectable } from "./container";

@Injectable()
export class RappelRepository {
  trouver(id: string): string {
    return `rappel-${id}`;
  }
}

@Injectable()
export class RappelService {
  constructor(private readonly repo: RappelRepository) {}

  chercher(id: string): string {
    return this.repo.trouver(id);
  }
}
