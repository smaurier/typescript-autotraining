// legacyEventBus.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
export type AppEvents = {
  "member:joined": { memberId: string; joinedAt: string };
  "member:left": { memberId: string; reason: string };
  "sortie:created": { sortieId: string; title: string };
};

export type EventName = keyof AppEvents;

export class EventBus {
  // Mapped type sur EventName (pas Record<string, ...>) : la clé de stockage est bornée aux
  // événements CONNUS, jamais une chaîne arbitraire.
  private handlers: { [K in EventName]?: Array<(payload: AppEvents[K]) => void> } = {};

  on<K extends EventName>(event: K, handler: (payload: AppEvents[K]) => void): void {
    // TS ne distribue pas la lookup d'un mapped type à travers un paramètre générique K sur
    // un .push() — limitation connue des event emitters fortement typés. L'API PUBLIQUE
    // (les signatures de on/emit) reste entièrement sûre ; seule cette ligne interne a besoin
    // d'une assertion, jamais visible des appelants.
    const liste = (this.handlers[event] ??= []) as Array<(payload: AppEvents[K]) => void>;
    liste.push(handler);
  }

  emit<K extends EventName>(event: K, payload: AppEvents[K]): void {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}
