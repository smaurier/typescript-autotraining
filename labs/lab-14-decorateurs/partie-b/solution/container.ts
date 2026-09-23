// container.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.
import "reflect-metadata";

export function Injectable(): ClassDecorator {
  // Le corps peut être vide — sa seule PRÉSENCE sur la classe force TS (avec
  // emitDecoratorMetadata actif) à émettre design:paramtypes.
  return () => {};
}

export function resolve<T>(cible: new (...args: any[]) => T): T {
  const paramTypes: Array<new (...args: any[]) => unknown> =
    Reflect.getMetadata("design:paramtypes", cible) ?? [];

  const dependances = paramTypes.map((type) => resolve(type));
  return new cible(...dependances);
}
