// apiClient.ts — PAGE BLANCHE. Le SDK générique consommant `types.ts` : paramétré par une
// carte `{ ressource → schéma zod }`, il valide CHAQUE réponse À LA FRONTIÈRE et ne lève
// JAMAIS d'exception — toute erreur (réseau, HTTP, validation) devient une variante
// d'`ApiError` dans un `Result`.
//
// export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>
//   - Le contrat minimal qu'un vrai `fetch` satisfait déjà — injecté par constructeur,
//     jamais un `fetch` global en dur : testable sans réseau.
//
// export class ApiClient<Schemas extends Record<string, z.ZodType>>
//   constructor(baseUrl: string, schemas: Schemas, fetchFn: FetchFn)
//
//   get<K extends keyof Schemas & string>(resource: K, id: string): Promise<Result<z.infer<Schemas[K]>, ApiError>>
//     1. Appelle `fetchFn(...)`. Une exception (réseau) → `err({ kind: "network", message })`,
//        JAMAIS de `throw` qui remonte à l'appelant.
//     2. `!res.ok` → `err({ kind: "http", status: res.status })`.
//     3. `res.json()` (typé `unknown`) → `schemas[resource].safeParse(...)`.
//     4. Échec de validation → `err({ kind: "validation", issues: [...] })` (un message par
//        souci trouvé — `parsed.error.issues.map(i => i.message)`).
//     5. Succès → `ok(parsed.data)`.
//
// PIÈGE ANNEXE : `noUncheckedIndexedAccess` (actif dans ce tsconfig) rend
// `this.schemas[resource]` possiblement `undefined` pour TS, même si `resource: K extends
// keyof Schemas & string` garantit que la clé existe — une assertion `!` locale est légitime
// ici (la garantie vient du type générique, pas d'une supposition).
//
// LE PIÈGE (le sujet réel du lab) : `resource` doit être contraint à `keyof Schemas & string`
// — appeler `api.get("dragons", ...)` sur une ressource qui n'existe pas dans `schemas` doit
// être refusé À LA COMPILATION, jamais découvert au runtime par un `undefined` silencieux.
import type { z } from "zod";
import type { ApiError, Result } from "./types";

export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export class ApiClient<Schemas extends Record<string, z.ZodType>> {
  constructor(
    private readonly baseUrl: string,
    private readonly schemas: Schemas,
    private readonly fetchFn: FetchFn,
  ) {}

  async get<K extends keyof Schemas & string>(_resource: K, _id: string): Promise<Result<z.infer<Schemas[K]>, ApiError>> {
    throw new Error("ApiClient.get n'est pas encore implémenté");
  }
}
