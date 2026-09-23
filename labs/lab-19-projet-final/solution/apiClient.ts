// apiClient.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import type { z } from "zod";
import { err, ok, type ApiError, type Result } from "./types";

export type FetchFn = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export class ApiClient<Schemas extends Record<string, z.ZodType>> {
  constructor(
    private readonly baseUrl: string,
    private readonly schemas: Schemas,
    private readonly fetchFn: FetchFn,
  ) {}

  async get<K extends keyof Schemas & string>(resource: K, id: string): Promise<Result<z.infer<Schemas[K]>, ApiError>> {
    let res: Awaited<ReturnType<FetchFn>>;
    try {
      res = await this.fetchFn(`${this.baseUrl}/${resource}/${id}`);
    } catch (e) {
      return err({ kind: "network", message: e instanceof Error ? e.message : String(e) });
    }

    if (!res.ok) {
      return err({ kind: "http", status: res.status });
    }

    const donneesBrutes: unknown = await res.json();
    // `resource` est contraint à `keyof Schemas & string` : la clé existe TOUJOURS, mais
    // noUncheckedIndexedAccess ne le sait pas pour un accès indexé via un paramètre générique.
    const analyse = this.schemas[resource]!.safeParse(donneesBrutes);

    if (!analyse.success) {
      return err({ kind: "validation", issues: analyse.error.issues.map((i) => i.message) });
    }

    return ok(analyse.data as z.infer<Schemas[K]>);
  }
}
