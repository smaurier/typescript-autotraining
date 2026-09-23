# Lab 11 — Intervention : durcir une base `any` sans casser ses appels

> **Outcome :** à la fin, `EventBus` (module 09-nestjs-adjacent, fusion des anciens labs
> conditional types/infer, mapped types, type programming) est entièrement typée — `on`/
> `emit` refusent à la compilation un payload qui ne correspond pas à l'événement — SANS
> qu'une seule ligne de `src/notifications.ts`, le vrai consommateur, n'ait besoin de changer.
> **Vrai geste :** généricité + indexed access (`AppEvents[K]`) + mapped type interne, sur du
> code qui MARCHE déjà et doit continuer à marcher à l'identique.
> **Feedback :** `npm run lab:11` — RED tant que `src/legacyEventBus.ts` ne satisfait pas
> l'oracle (7 tests, dont 3 passent déjà — le comportement runtime ne change JAMAIS, seule la
> sécurité de type change). `npm run solution:11` prouve l'oracle.

## Lire avant (une lecture bornée)

Module [`09-modules-et-resolution.md`](../../modules/09-modules-et-resolution.md) pour
l'indexed access, module [`06-generics-fondamentaux.md`](../../modules/06-generics-fondamentaux.md)
pour les génériques contraints — relis les sections sur `keyof`/indexed access si besoin,
pas le module entier.

## Énoncé

`EventBus` (dans `src/legacyEventBus.ts`) tourne en `any` partout — `on(event: string,
handler: (payload: any) => void)`, `emit(event: string, payload: any)`. Ça MARCHE (voir
`src/notifications.ts`, donné, un vrai consommateur), mais aucune garantie de type : une
faute de frappe sur un champ de payload compile sans broncher.

Lis les commentaires en tête de `src/legacyEventBus.ts`. Rends `on` et `emit` génériques,
contraints à `EventName = keyof AppEvents`, avec le payload indexé (`AppEvents[K]`).

**Le piège à éviter.** `notifications.ts` ne doit JAMAIS être modifié — c'est la preuve de
non-régression : le vrai usage existant doit continuer à compiler à l'identique, mot pour
mot. Si tu dois y toucher pour que ça compile, ta signature générique est fausse.

## Étapes (en friction)

1. `npm run lab:11` : RED (4/7 — les 3 tests runtime passent déjà, le comportement ne change
   pas).
2. `on<K extends EventName>(event: K, handler: (payload: AppEvents[K]) => void): void`
3. `emit<K extends EventName>(event: K, payload: AppEvents[K]): void`
4. Le stockage interne (`handlers`) devient un mapped type sur `EventName`, pas un
   `Record<string, ...>`.
5. Piège TS connu : la lookup d'un mapped type via un paramètre générique `K` ne distribue
   pas toujours proprement pour un `.push()` — une assertion locale sur cette seule ligne
   interne est acceptable ; l'API publique, elle, reste entièrement sûre.

## Vérifier

```bash
cd 00-typescript/labs
npm run lab:11
npm run check:11
```

**Ce que l'oracle vérifie**

Runtime (non-régression, 3 tests, passent déjà sur l'existant) : `notifications.ts` inchangé
produit le même résultat ; plusieurs handlers sur un même événement sont tous appelés, dans
l'ordre ; un événement sans handler ne lève pas d'erreur. Types (4 tests, RED sur
l'existant) : `emit` refuse un payload qui ne correspond pas à l'événement ; `emit` refuse
un événement inconnu ; `on` refuse un handler dont la forme ne correspond pas ; `on` infère
le bon type de payload (une faute de frappe sur un champ est refusée).

## Variante J+30 (fading)

Ajoute un événement `"family:created": { familyId: string }` à `AppEvents` et vérifie que
`notifications.ts`, TOUJOURS sans y toucher, continue de compiler — la preuve que
l'extensibilité ne casse rien d'existant.

## Application TribuZen

Même geste sur le vrai `tribuzen/lib/eventBus.ts` hérité en `any`, avec ses VRAIS
consommateurs (pas un fichier de démo) laissés intacts. Commit :
`fix(types): EventBus durci (generics + indexed access), zéro régression sur les appelants`.
