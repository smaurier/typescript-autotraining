# Lab 14 — Décorateurs : standard vs legacy (le pont NestJS)

> **Outcome :** à la fin, tu sais écrire un décorateur standard `(value, context)` sur une méthode de service, ET reconstruire un mini-conteneur d'injection de dépendances legacy avec `reflect-metadata` — le mécanisme exact de NestJS.
> **Vrai outil :** `tsc` (TypeScript 5) + `reflect-metadata` + `ts-node` (ou `node` sur le JS émis). Deux configs tsconfig distinctes, car les deux systèmes sont incompatibles.
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

---

## Énoncé

Tu montes deux mini-projets côte à côte, un par système de décorateurs, sur le domaine TribuZen (rappels).

**Partie A — décorateur STANDARD (Stage 3).** Config par défaut TS 5, aucun flag. Tu écris `@logged` `(value, context)` sur `RappelService.envoyer` : il journalise l'appel et le retour sans modifier le corps.

**Partie B — mini-DI LEGACY.** Config `experimentalDecorators` + `emitDecoratorMetadata` + `reflect-metadata`. Tu écris `@Injectable()` et un `resolve()` qui lit `design:paramtypes` pour instancier et injecter automatiquement les dépendances du constructeur. C'est NestJS en 30 lignes.

### Starter

```
lab-14-decorateurs/
  partie-a/
    tsconfig.json         # standard : PAS de experimentalDecorators
    logged.ts             # à écrire
    rappel.service.ts     # à écrire
  partie-b/
    tsconfig.json         # legacy : experimentalDecorators + emitDecoratorMetadata
    container.ts          # à écrire (@Injectable + resolve)
    main.ts               # import "reflect-metadata" en tête
```

```json
// partie-a/tsconfig.json — mode STANDARD (défaut TS 5)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true
    // AUCUN experimentalDecorators, AUCUN emitDecoratorMetadata
  }
}
```

```json
// partie-b/tsconfig.json — mode LEGACY (comme NestJS)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

```bash
npm install reflect-metadata
npm install -D typescript ts-node
```

---

## Étapes (en friction)

1. **Partie A** — écris `logged(value, context)` dans `logged.ts`. Il doit : récupérer `context.name`, retourner une fonction qui log `→ nom(args)`, appelle `value.apply(this, args)`, log `← nom = résultat`, et retourne le résultat. Applique-le avec `@logged` (sans parenthèses) sur `RappelService.envoyer`.
2. Compile la Partie A avec `tsc -p partie-a` puis exécute. Vérifie que les deux lignes de log encadrent le retour.
3. **Preuve d'incompatibilité** — dans `partie-a`, essaie d'ajouter un décorateur de paramètre : `envoyer(@logged rappelId: string)`. Compile → tu dois obtenir **TS1206**. Retire-le. (Tu viens de prouver l'absence de décorateur de paramètre en standard.)
4. **Partie B** — dans `main.ts`, mets `import "reflect-metadata"` en **toute première ligne**. Écris `@Injectable()` (décorateur de classe qui pose une métadonnée marqueur) et `resolve(cible)` qui lit `Reflect.getMetadata("design:paramtypes", cible)`, résout récursivement chaque dépendance, et fait `new cible(...args)`.
5. Déclare `RappelRepository` et `RappelService` (constructeur `(private repo: RappelRepository)`), les deux `@Injectable()`. Appelle `resolve(RappelService)` et vérifie que `repo` a bien été injecté.
6. **Preuve du rôle de reflect-metadata** — commente la ligne `import "reflect-metadata"`. Compile + exécute → `Reflect.getMetadata is not a function`. Remets-la. Puis désactive `emitDecoratorMetadata` dans le tsconfig et observe que `design:paramtypes` devient `undefined`.

---

## Corrigé complet commenté

### Partie A — décorateur standard

```typescript
// partie-a/logged.ts
// Décorateur STANDARD (Stage 3). Signature imposée par TS 5 : (value, context).
// value = la méthode décorée ; context = métadonnées (kind, name, addInitializer).
export function logged(
  value: (...args: any[]) => any,
  context: ClassMethodDecoratorContext,
) {
  const nom = String(context.name); // nom de la méthode ("envoyer")

  // On RETOURNE une fonction de remplacement : elle enveloppe l'originale.
  return function (this: any, ...args: any[]) {
    console.log(`[LOG] → ${nom}(`, args, `)`);
    const resultat = value.apply(this, args); // appel de la méthode d'origine, bon `this`
    console.log(`[LOG] ← ${nom} =`, resultat);
    return resultat;
  };
}
```

```typescript
// partie-a/rappel.service.ts
import { logged } from "./logged.js";

export class RappelService {
  @logged // SANS parenthèses : logged EST le décorateur, pas une factory
  envoyer(rappelId: string): string {
    return `rappel ${rappelId} envoyé`;
  }
}

const s = new RappelService();
s.envoyer("r-42");
// [LOG] → envoyer( [ 'r-42' ] )
// [LOG] ← envoyer = rappel r-42 envoyé
```

> Étape 3 — `envoyer(@logged rappelId: string)` provoque **TS1206 « Decorators are not valid here »**. Preuve : le système standard n'a aucun décorateur de paramètre.

### Partie B — mini-conteneur DI legacy

```typescript
// partie-b/main.ts
import "reflect-metadata"; // TOUJOURS en première ligne : patche l'objet global Reflect

// --- Décorateur legacy : marque une classe comme injectable ---
const INJECTABLE = Symbol("injectable");
function Injectable(): ClassDecorator {
  // Décorateur de classe legacy : reçoit (target) = le constructeur.
  return (target: Function) => {
    Reflect.defineMetadata(INJECTABLE, true, target);
  };
}

// --- Dépendance ---
@Injectable()
class RappelRepository {
  findAll(): string[] {
    return ["r-1", "r-2"];
  }
}

// --- Service avec dépendance injectée par le constructeur ---
@Injectable()
class RappelService {
  // Grâce à emitDecoratorMetadata, TS émet :
  //   design:paramtypes = [RappelRepository]
  constructor(private readonly repo: RappelRepository) {}

  lister(): string[] {
    return this.repo.findAll();
  }
}

// --- Le conteneur : lit design:paramtypes et résout récursivement ---
function resolve<T>(cible: new (...args: any[]) => T): T {
  if (!Reflect.getMetadata(INJECTABLE, cible)) {
    throw new Error(`${cible.name} n'est pas @Injectable()`);
  }
  // Liste des types du constructeur, émise par emitDecoratorMetadata :
  const deps: Array<new (...a: any[]) => any> =
    Reflect.getMetadata("design:paramtypes", cible) ?? [];

  const args = deps.map((dep) => resolve(dep)); // chaque dépendance est résolue à son tour
  return new cible(...args);
}

// --- Exécution ---
const service = resolve(RappelService); // instancie RappelRepository, puis l'injecte
console.log(service.lister()); // ["r-1", "r-2"]
```

> Étape 6 — sans `import "reflect-metadata"` : `TypeError: Reflect.getMetadata is not a function`. Avec `emitDecoratorMetadata: false` : `design:paramtypes` devient `undefined`, `deps = []`, et `repo` n'est pas injecté (`undefined`) → crash à `this.repo.findAll()`. Ces deux échecs prouvent que le legacy repose sur **la lib + le flag** ensemble.

**Le pont NestJS :** ce `resolve` de 8 lignes est la version miniature du conteneur NestJS. `@Injectable()` + `design:paramtypes` + résolution récursive = exactement ce que fait NestJS (avec en plus scopes, modules, tokens). Tu retrouveras ça au module 09 du cours NestJS — mais tu sais déjà lire sous le capot.

---

## Variante J+30 (fading)

Sans relire le corrigé, en **25 minutes** :

1. Réécris `@logged` standard de mémoire, puis **ajoute** un second décorateur standard `@measure` qui log le temps d'exécution (`performance.now()`). Empile `@measure @logged` sur `envoyer` et **prédis l'ordre** d'exécution avant de lancer.
2. Dans la Partie B, ajoute une **troisième** classe `NotificationService` dont le constructeur dépend de `RappelService` (qui dépend lui-même de `RappelRepository`). Vérifie que `resolve(NotificationService)` construit toute la chaîne récursivement, sans que tu écrives un seul `new`.
3. Contrainte : **interdiction d'importer `reflect-metadata` plus d'une fois** et de le mettre ailleurs qu'en première ligne de `main.ts`.

---

## Application TribuZen

Porte les deux dans `smaurier/tribuzen` :

- **Standard** — crée `tribuzen-api/src/common/decorators/logged.decorator.ts` avec le `@logged` `(value, context)`. Applique-le sur une méthode non-critique d'un service en dev pour tracer les appels. (Le monorepo côté outils/scripts est en config standard.)
- **Legacy** — le backend NestJS *est* déjà en legacy. Ouvre `rappel.service.ts`, repère le `@Injectable()` et le constructeur `(private repo: RappelRepository)`, et vérifie dans `main.ts` que `import "reflect-metadata"` (ou l'équivalent via `@nestjs/core`) est bien en tête. Fais le lien mental : le `resolve` du lab, c'est le `NestFactory.create()` en vrai.

Commit sur `smaurier/tribuzen` : `feat(decorators): @logged standard + note DI reflect-metadata (pont module 14)`.
