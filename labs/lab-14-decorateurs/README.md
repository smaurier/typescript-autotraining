# Lab 14 — Décorateurs : standard vs legacy (le pont NestJS)

> **Outcome :** à la fin, tu sais écrire un décorateur STANDARD `(value, context)` sur une
> méthode, ET reconstruire un mini-conteneur d'injection de dépendances LEGACY avec
> `reflect-metadata` — le mécanisme exact de NestJS. Les deux systèmes sont incompatibles :
> un `tsconfig` par partie.
> **Vrai outil :** `tsc` (compilation réelle, décorateurs downlevel en JS exécutable) + Node.
> **Feedback :** `npm run lab:14a` / `npm run lab:14b` depuis `00-typescript/labs` — RED tant
> que ton code ne satisfait pas l'oracle. `npm run solution:14a` / `:14b` prouvent l'oracle.

## Note d'infrastructure (lue une fois, pas un obstacle à contourner toi-même)

Ce lab n'utilise PAS vitest pour la partie runtime, contrairement aux autres — un vrai
problème a été rencontré en le construisant : le pipeline de transform de vitest 5 / vite 8
(`oxc`, le transformeur par défaut de Vite 8) ne downlevel PAS correctement la syntaxe des
décorateurs à l'exécution sur cet environnement (`SyntaxError: Invalid or unexpected token`),
que ce soit en décorateurs standard ou legacy, et malgré plusieurs configurations essayées
(`esbuild.target`, `oxc.target`, désactivation d'oxc). `tsc`, lui, compile et downlevel les
décorateurs correctement (vérifié : le JS émis contient de vrais helpers `__esDecorate` /
`__decorate`, exécutables tels quels). `run-oracle.mjs` (une partie A, une partie B) compile
donc réellement avec `tsc` puis exécute le VRAI JS émis avec Node — jamais de simulation,
juste un pipeline différent des autres labs.

## Lire avant (une lecture bornée)

Module [`14-decorateurs-metadata.md`](../../modules/14-decorateurs-metadata.md), une fois.

---

## Partie A — décorateur standard (Stage 3)

`partie-a/tsconfig.json` : config par défaut, AUCUN `experimentalDecorators`.

### Énoncé

`partie-a/src/rappelService.ts` (donné, déjà correct) applique `@logged` (sans parenthèses)
sur `RappelService.envoyer`. Lis les commentaires en tête de `partie-a/src/logged.ts` et
implémente `logged(value, context)` :
1. Journalise l'appel (`logs.push`, pas `console.log` — un tableau exporté, lu par
   l'oracle) : `→ nom(args)`.
2. Appelle `value.apply(this, args)`.
3. Journalise le retour : `← nom = résultat`.
4. Retourne le résultat.

**Le piège à éviter.** Ne type pas `value`/le retour en `Function` — TS1270 refuse un
décorateur dont le type de retour n'est pas exactement assignable à la méthode remplacée.
Généralise sur `<This, Args extends unknown[], Return>`.

### Vérifier

```bash
cd 00-typescript/labs
npm run lab:14a
npm run check:14a   # tsc seul, pour isoler une erreur de type
```

---

## Partie B — mini-DI legacy (le mécanisme de NestJS)

`partie-b/tsconfig.json` : `experimentalDecorators` + `emitDecoratorMetadata` actifs —
INCOMPATIBLE avec la partie A, d'où deux `tsconfig` séparés.

### Énoncé

`partie-b/src/rappelModule.ts` (donné, déjà correct) déclare `RappelRepository` et
`RappelService` (qui dépend de `RappelRepository` par constructeur), chacune `@Injectable()`.
Lis les commentaires en tête de `partie-b/src/container.ts` et implémente :
1. `Injectable(): ClassDecorator` — un décorateur de classe dont la seule PRÉSENCE force TS
   à émettre `design:paramtypes` (corps vide suffit).
2. `resolve<T>(cible)` — lit `Reflect.getMetadata("design:paramtypes", cible)`, résout
   récursivement chaque dépendance, instancie `cible` avec les dépendances résolues.

**Le piège à éviter.** `import "reflect-metadata"` doit être en tête de fichier — sans lui,
`Reflect.getMetadata` n'existe pas (déjà en place dans le starter, ne le retire pas).

### Vérifier

```bash
cd 00-typescript/labs
npm run lab:14b
npm run check:14b
```

---

## Ce que l'oracle vérifie

**Partie A** : le retour de `envoyer` est inchangé ; le log d'appel précède l'exécution ; le
log de retour suit, avec le résultat ; deux appels produisent quatre lignes dans l'ordre.
**Partie B** : une classe sans dépendance se résout ; une dépendance de constructeur est
injectée automatiquement ; chaque `resolve()` construit une nouvelle instance (pas un
singleton).

## Application TribuZen

Partie A : un `@logged` réel sur les méthodes sensibles de `tribuzen-api`. Partie B : la
compréhension exacte de comment NestJS résout `@Injectable()` — ce lab EST ce mécanisme, pas
une analogie. Commit :
`feat(types): décorateur logged standard + mini-conteneur DI legacy (reflect-metadata)`.
