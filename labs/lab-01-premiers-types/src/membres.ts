// membres.ts — STARTER (tout est volontairement mal ou pas typé)
// C'est ICI que tu écris. Les tests (test/) importent ce fichier via `@lab/membres`.
// Ils attendent les exports : Member, RawMember, AppConfig, isRawMember, chargerMembres, rawConfig.

export const rawConfig = {
  env: "development",
  apiUrl: "http://localhost:3000",
  port: 3000,
  ssl: false,
};

export async function chargerMembres() {
  const reponse = await fetch(rawConfig.apiUrl + "/members");
  const data: any = await reponse.json();
  return data;
}
