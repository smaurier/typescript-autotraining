// legacyEventBus.ts — L'EXISTANT, EN PRODUCTION (fusion des anciens labs 11-13 : conditional
// types/infer, mapped types, indexed access). `AppEvents` (donné, ne pas modifier) est la
// carte des événements TribuZen. `EventBus`, elle, tourne encore en `any` partout : ça
// MARCHE (voir `src/notifications.ts`, donné, déjà consommateur), mais AUCUNE garantie de
// type — une faute de frappe sur un champ de payload compile sans broncher.
//
// AVANT de corriger : ouvre `src/notifications.ts`. Ton intervention ne doit RIEN y changer
// — le fichier reste identique, mot pour mot, avant et après ton `EventBus` durci. C'est la
// preuve de non-régression : le VRAI usage existant continue de compiler tel quel, il gagne
// juste une vraie vérification de type au lieu d'un `any` qui laisse tout passer.
//
// Contrat à respecter (signature PUBLIQUE inchangée : `on(event, handler)`, `emit(event,
// payload)` — seuls les TYPES changent, jamais le comportement runtime) :
//
//   on<K extends EventName>(event: K, handler: (payload: AppEvents[K]) => void): void
//     - `handler` doit être contraint au type du payload de CET événement précis (indexed
//       access `AppEvents[K]`), pas `any`.
//
//   emit<K extends EventName>(event: K, payload: AppEvents[K]): void
//     - `payload` doit être exactement la forme attendue pour `event` — un payload qui ne
//       correspond pas à un AUTRE événement doit être refusé À LA COMPILATION.
//
//   Le stockage interne des handlers doit rester un mapped type sur `EventName` (pas un
//   `Record<string, ...>` générique qui accepterait n'importe quelle clé).
//
// LE PIÈGE (vérifié en construisant l'oracle) : TS ne distribue PAS la lookup d'un mapped
// type à travers un paramètre générique `K` pour un `.push()` — limitation connue des event
// emitters fortement typés. Une assertion `as Array<(payload: AppEvents[K]) => void>` sur
// cette ligne interne précise est nécessaire ; l'API PUBLIQUE (les signatures de `on`/`emit`)
// reste entièrement sûre, l'assertion ne fuit jamais vers les appelants.
export type AppEvents = {
  "member:joined": { memberId: string; joinedAt: string };
  "member:left": { memberId: string; reason: string };
  "sortie:created": { sortieId: string; title: string };
};

export type EventName = keyof AppEvents;

export class EventBus {
  private handlers: Record<string, ((payload: any) => void)[]> = {};

  on(event: string, handler: (payload: any) => void): void {
    (this.handlers[event] ??= []).push(handler);
  }

  emit(event: string, payload: any): void {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}
