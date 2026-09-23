// container.ts — PAGE BLANCHE. Le mécanisme EXACT de NestJS, en 30 lignes : décorateurs
// LEGACY (`experimentalDecorators` + `emitDecoratorMetadata`, actifs dans CE tsconfig
// uniquement — incompatible avec partie-a) + `reflect-metadata`. `import "reflect-metadata"`
// est déjà en tête de ce fichier : sans lui, `Reflect.getMetadata` n'existe pas.
//
// export function Injectable(): ClassDecorator
//   - Un décorateur de CLASSE qui ne fait qu'une chose : sa seule PRÉSENCE force TypeScript
//     à émettre la métadonnée `design:paramtypes` (la liste des types de paramètres du
//     constructeur) sur la classe décorée — c'est `emitDecoratorMetadata` qui fait ce travail,
//     mais UNIQUEMENT si la classe porte au moins un décorateur. Le corps peut être vide.
//
// export function resolve<T>(cible: new (...args: any[]) => T): T
//   - Lit `Reflect.getMetadata("design:paramtypes", cible)` — un tableau des CLASSES
//     (constructeurs) attendues par le constructeur de `cible`, dans l'ordre.
//   - Résout RÉCURSIVEMENT chaque dépendance (`resolve` sur chaque type trouvé).
//   - Instancie `cible` avec les dépendances résolues : `new cible(...dependances)`.
//   - Aucune métadonnée trouvée (constructeur sans paramètres) → instancie sans arguments.
import "reflect-metadata";

export function Injectable(): ClassDecorator {
  return () => {
    throw new Error("Injectable n'est pas encore implémenté");
  };
}

export function resolve<T>(_cible: new (...args: any[]) => T): T {
  throw new Error("resolve n'est pas encore implémenté");
}
