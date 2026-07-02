# Lab 16 — Declaration files et augmentation

> **Outcome :** à la fin, tu sais augmenter `Request` d'Express pour poser `req.member`, écrire un `.d.ts` pour une lib JS non typée, et déclarer un module wildcard `*.svg` — le tout vérifié au vrai compilateur.
> **Vrai outil :** `tsc` (TypeScript `^5`) en mode `--noEmit`. Pas de test-runner simulé : le feedback, c'est le compilateur qui l'émet (erreurs / silence).
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

## Énoncé

Tu reprends l'API TribuZen (Express) et son admin (front). Trois trous de typage à combler avec des declaration files, dans un dossier `types/` que le compilateur voit.

Starter minimal :

```
lab-16-declaration-files/
  src/
    domain/member.ts        # type métier Member (fourni)
    middlewares/auth.ts      # req.member = ... → ERREUR à faire disparaître
    controllers/family.ts    # req.member.id → ERREUR à faire disparaître
    services/ics.ts          # import de 'tribu-ics' (JS non typé) → ERREUR
    admin/Sidebar.ts         # import cog from './cog.svg' → ERREUR
  types/                     # ← TU écris les .d.ts ICI (vide au départ)
  tsconfig.json
```

Fichiers fournis :

```ts
// src/domain/member.ts
export interface Member {
  id: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  familyIds: string[];
}
```

```jsonc
// tsconfig.json (fourni) — noter que "types" est déjà dans include
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "module": "commonjs",
    "target": "es2022",
    "esModuleInterop": true
  },
  "include": ["src", "types"]
}
```

Les fichiers `src/**` sont fournis avec leurs erreurs. **Tu ne les modifies pas** : tu ne touches qu'à `types/`.

## Étapes (en friction)

1. Lance `npx tsc --noEmit` et **lis les erreurs** avant d'écrire quoi que ce soit. Note les 4 codes/messages : ce sont ta liste de tâches.
2. Crée `types/express/index.d.ts` : augmente le bon module pour ajouter `member?: Member` à `Request`. Réfléchis à *quel* module rouvrir et à *pourquoi* `member` est optionnel.
3. Crée `types/tribu-ics.d.ts` : déclare le module `tribu-ics` (API : `creerEvenement(opts): string`, `fusionner(evenements: string[]): string`, plus l'interface d'options). Fais échouer volontairement un appel avec une mauvaise forme pour vérifier que ton type mord.
4. Crée `types/assets.d.ts` : déclare `*.svg` (export default `string`).
5. Relance `npx tsc --noEmit` jusqu'au **silence total** (zéro erreur). Puis provoque une régression exprès (`req.member.id` sans narrowing) et observe l'erreur revenir — preuve que le typage est réel.

## Corrigé complet commenté

```ts
// types/express/index.d.ts
// Import de type => ce fichier devient un MODULE (donc pas de fuite globale
// involontaire, et l'augmentation cible bien un module nommé).
import type { Member } from '../../src/domain/member';

// On rouvre express-serve-static-core (PAS 'express') : c'est LUI qui définit
// réellement l'interface Request ; 'express' ne fait que la ré-exporter.
declare module 'express-serve-static-core' {
  interface Request {
    // Optionnel : avant le passage dans authMiddleware, member n'existe pas.
    // Le '?' force le narrowing dans les controllers (soundness, module 15).
    member?: Member;
  }
}
```

```ts
// types/tribu-ics.d.ts
// Pas d'import en tête + declare module => on DÉCLARE un module non typé
// (on crée ses types de zéro), on n'augmente pas une lib existante.
declare module 'tribu-ics' {
  /** Un événement du calendrier famille */
  export interface EvenementICS {
    titre: string;
    debut: Date;                 // Date exigée : un string sera rejeté
    fin: Date;
    fuseau?: string;             // IANA, ex. "Europe/Paris"
    lieu?: string;
    participants?: string[];
  }

  /** Sérialise un événement en bloc VEVENT (string ICS) */
  export function creerEvenement(opts: EvenementICS): string;

  /** Concatène des VEVENT dans un VCALENDAR */
  export function fusionner(evenements: string[]): string;
}
```

```ts
// types/assets.d.ts
// Module wildcard : le * matche tout chemin finissant en .svg.
// Forme "URL string" (bundler type Vite). En SVGR on exporterait un
// FC<SVGProps<SVGSVGElement>> à la place — une seule forme à la fois.
declare module '*.svg' {
  const src: string;
  export default src;
}
```

Résultat attendu côté `src/` (fourni, non modifié — juste pour comprendre ce qui remonte) :

```ts
// src/controllers/family.ts
export function listMyFamilies(req: Request, res: Response) {
  if (!req.member) return res.status(401).json({ error: 'non authentifié' });
  res.json(getFamiliesOf(req.member.id)); // ✅ req.member.id : string, autocomplété
}
```

Vérification finale :

```bash
npx tsc --noEmit   # doit sortir SANS aucune erreur
```

## Variante J+30 (fading)

Refais les trois `.d.ts` **de mémoire, en 20 min**, sans relire le corrigé, avec deux contraintes en plus :
- L'augmentation d'Express doit aussi ajouter une méthode à `Response` : `sendMember(m: Member): void`.
- Le `.d.ts` de `tribu-ics` doit exposer en plus un `export default init(config?): void` (default + exports nommés dans le même `declare module`).

Piège à éviter sans filet : ne pas retomber sur `declare module 'express'`, et ne pas oublier que l'ajout d'un `import` en tête change le statut du fichier.

## Application TribuZen

Porte ces trois fichiers dans les vrais repos :
- `smaurier/tribuzen-api` : `types/express/index.d.ts` (le `req.member` sert au middleware d'auth JWT et à tous les controllers — c'est le pont vers NestJS, qui s'appuie sur Express) et `types/tribu-ics.d.ts` (service export calendrier `.ics`).
- `smaurier/tribuzen-admin` : `types/assets.d.ts` pour les icônes SVG de la barre latérale.

Vérifie que `tsconfig.json` de chaque repo inclut bien `types/` dans `include` (sinon les `.d.ts` sont ignorés en silence), puis commit sous `smaurier/tribuzen-api` et `smaurier/tribuzen-admin`.
