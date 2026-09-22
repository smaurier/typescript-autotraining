// data.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// ── Contrat minimal partagé par toutes les entités ────────────────
export interface BaseEntity {
  id: string; // la seule chose que getById / Repository exigent
}

export interface Member extends BaseEntity {
  name: string;
  role: "admin" | "mod" | "member";
}
export interface Family extends BaseEntity {
  label: string;
}

// ── Étape 2 : enveloppe API générique (remplace *Response) ─────────
// Un seul type. data varie par T, error est commun.
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Constructeurs typés : T est inféré depuis l'argument de ok()
export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}
// fail n'a pas d'argument de type T à inférer → on le précise à l'appel
export function fail<T>(message: string): ApiResponse<T> {
  return { data: null, error: message };
}

// ── Étape 3 : accès générique contraint (remplace get*ById) ───────
// <T extends BaseEntity> garantit item.id ; le retour reste T précis.
export function getById<T extends BaseEntity>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// ── Étape 4 + 5 : dépôt CRUD générique ────────────────────────────
export class Repository<T extends BaseEntity> {
  private store = new Map<string, T>();

  findAll(): T[] {
    return [...this.store.values()];
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  // Omit<T, "id"> : on ne fournit PAS l'id, il est généré ici
  create(input: Omit<T, "id">): T {
    const entity = { ...input, id: crypto.randomUUID() } as T;
    this.store.set(entity.id, entity);
    return entity;
  }

  // Partial<T> : on ne modifie que certains champs ; id reste stable
  update(id: string, patch: Partial<T>): T | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.store.delete(id);
  }

  // Étape 5 : keyof + accès indexé → lecture d'une propriété type-safe
  // K est une clé valide de T ; le retour T[K] s'adapte à la clé.
  getProp<K extends keyof T>(id: string, key: K): T[K] | undefined {
    return this.store.get(id)?.[key];
  }
}
