# Guide de l'apprenant -- TypeScript

> **Ce guide est ta boussole.** Il t'aide a savoir ou tu en es, par ou passer,
> et quoi faire quand tu bloques. Lis-le avant de commencer, et reviens-y regulierement.
>
> **Temps estime** : ~120-160h (3-5 mois a 8-10h/semaine)
>
> **Philosophie** : TypeScript ne s'apprend pas en lisant de la documentation.
> Il s'apprend en ecrivant du code qui ne compile pas, en comprenant POURQUOI,
> et en corrigeant. Chaque erreur du compilateur est une lecon gratuite.

---

## Avant de commencer -- Auto-diagnostic

Reponds honnetement. Ce n'est pas un examen -- c'est un GPS.

### JavaScript -- le socle

Coche ce que tu sais faire SANS chercher sur Google :
- [ ] Declarer une variable avec `const`, `let` et expliquer pourquoi pas `var`
- [ ] Ecrire une fonction flechee avec des parametres par defaut
- [ ] Utiliser `map`, `filter`, `reduce` sur un tableau
- [ ] Destructurer un objet et un tableau
- [ ] Ecrire une Promise et utiliser `async`/`await`
- [ ] Expliquer ce qu'est le prototype d'un objet

**6/6** -> Tu es pret. Attaque directement le module 00.
**4-5/6** -> Revise les points manquants sur javascript.info (~2-3h), puis lance-toi.
**< 4/6** -> Fais d'abord un refresher JavaScript serieux. TypeScript sans JS solide, c'est construire sur du sable.

### TypeScript -- ou en es-tu deja ?

- [ ] Tu sais ce qu'est un type `string | number` (union)
- [ ] Tu sais ecrire une `interface` et un `type`
- [ ] Tu sais ce qu'est un generic (`Array<T>`)
- [ ] Tu as deja utilise `as` pour un cast (meme si c'etait un hack)
- [ ] Tu sais configurer un `tsconfig.json` basique

**5/5** -> Tu peux probablement commencer a la Phase 2 (module 05). Mais fais le quiz de la Phase 1 d'abord pour verifier.
**3-4/5** -> Commence par la Phase 1, mais tu iras vite.
**0-2/5** -> Parfait, tu es exactement le public vise. Commence au module 00, sans stress.

### Le test decisif

Ecris mentalement (ou sur papier) une fonction `getProperty` qui prend un objet et une cle, et retourne la valeur correspondante, avec les types corrects.

- Si tu as ecrit `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]` -- tu connais deja les generics. Saute a la Phase 3.
- Si tu as ecrit quelque chose avec `any` -- c'est normal, c'est exactement ce qu'on va corriger.
- Si tu n'as rien ecrit -- pas de panique, c'est le but de la formation.

---

## Les 4 phases de ta progression

### Phase 1 -- Fondamentaux (modules 00-04) ~30-40h

> **Objectif** : Parler le langage de TypeScript. Comprendre les types primitifs,
> les fonctions typees, les objets, les interfaces, et le narrowing.
>
> **Analogie** : C'est comme apprendre l'alphabet et la grammaire.
> Pas glamour, mais sans ca tu ne peux rien ecrire.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 00 | Prerequis et introduction | 1h30 | Le "pourquoi TypeScript" -- lis-le, ca motive |
| 01 | Types primitifs et inference | 2h | L'inference est ton alliee, pas ton ennemie |
| 02 | Fonctions | 2h30 | Surcharges, callbacks, generics de base |
| 03 | Objets, interfaces, types | 3h | **Cours cle** -- `interface` vs `type`, tu vas enfin comprendre |
| 04 | Unions, intersections, narrowing | 3h | **Cours cle** -- le narrowing change tout |

**Exercices Phase 1** : Fais TOUS les exercices de ces modules. Ne saute rien.
Le narrowing (module 04) est la competence numero 1 d'un dev TypeScript.

**Checkpoint Phase 1** :
- [ ] Tu sais expliquer la difference entre `interface` et `type` avec un exemple concret
- [ ] Tu sais utiliser un type guard (`typeof`, `in`, discriminated union) sans hesiter
- [ ] Tu sais ecrire une fonction avec des overloads
- [ ] Tu comprends pourquoi `as` est dangereux et quand l'eviter
- [ ] Tu peux lire une erreur TypeScript sans paniquer

> **Test** : Un collegue ecrit `const x: any = fetchUser()`. Que lui dis-tu ?
> Si tu reponds "utilise `unknown` et fais du narrowing", c'est bon.

---

### Phase 2 -- Intermediaire (modules 05-09) ~30-40h

> **Objectif** : Maitriser les classes, les generics, les enums, les modules.
> Tu passes de "je sais typer" a "je sais concevoir des types".
>
> **Analogie** : Tu connais l'alphabet, maintenant tu ecris des phrases completes.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 05 | Classes et heritage | 3h | `abstract`, `implements`, visibilite |
| 06 | Generics fondamentaux | 3h | **Cours cle** -- les generics debloquent tout |
| 07 | Generics avances | 4h | Contraintes, inference, patterns reels |
| 08 | Enums, tuples, types speciaux | 2h30 | `const enum`, `as const`, `satisfies` |
| 09 | Modules et resolution | 2h30 | Comment TS trouve tes fichiers |

**Conseil** : Les generics (06-07) sont le mur numero 1 de cette formation.
Si tu bloques, c'est NORMAL. Relis le module 06 avant de passer au 07.
Ecris les exemples a la main, ne te contente pas de lire.

**Checkpoint Phase 2** :
- [ ] Tu sais ecrire un generic contraint (`<T extends SomeType>`)
- [ ] Tu sais quand utiliser une classe vs une interface
- [ ] Tu comprends `as const` et `satisfies` et tu sais quand les utiliser
- [ ] Tu sais configurer les paths dans `tsconfig.json`
- [ ] Tu peux ecrire une fonction generique qui infere le type de retour

> **Test** : Ecris un type `Result<T, E>` qui represente soit un succes soit une erreur.
> Si tu ecris `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`, tu es pret pour la Phase 3.

---

### Phase 3 -- Avance (modules 10-14) ~30-40h

> **Objectif** : Maitriser le systeme de types avance. Utility types, conditional types,
> mapped types, types recursifs. Tu ne subis plus les types, tu les conçois.
>
> **Analogie** : Tu passes d'utilisateur de la langue a ecrivain. Tu inventes des mots.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 10 | Utility types | 3h | `Pick`, `Omit`, `Partial`, `Record` et les autres |
| 11 | Conditional types | 3h30 | `infer`, distribution -- ca pique mais c'est puissant |
| 12 | Mapped types et template literals | 4h | **Cours cle** -- tu crees tes propres utility types |
| 13 | Types recursifs et type programming | 4h | Le niveau "type gymnast" |
| 14 | Decorateurs et metadata | 3h | Pour NestJS et les frameworks decorateur-based |

**Attention** : Les modules 11-13 sont les plus denses. Ne fais pas plus de 2h
de type programming d'affilee -- ton cerveau a besoin de digerer.

**Checkpoint Phase 3** :
- [ ] Tu sais ecrire un mapped type custom
- [ ] Tu comprends `infer` dans un conditional type
- [ ] Tu sais creer un utility type comme `DeepPartial<T>`
- [ ] Tu comprends les template literal types et tu sais quand les utiliser
- [ ] Tu sais ce qu'est un decorateur et comment il fonctionne

> **Test** : Ecris un type `Paths<T>` qui extrait toutes les cles imbriquees d'un objet
> sous forme de string (`"user.address.city"`). Si tu y arrives (meme en tatonnant), tu es pret pour la Phase 4.

---

### Phase 4 -- Expert (modules 15-19) ~30-40h

> **Objectif** : La maitrise complete. Variance, declaration files, tsconfig avance,
> patterns de conception en TypeScript, et un projet final pour tout consolider.
>
> **Analogie** : Tu ne parles plus seulement la langue -- tu comprends pourquoi
> elle est construite comme ca, et tu peux l'etendre.

| Module | Sujet | Temps | Note |
|---|---|---|---|
| 15 | Variance et soundness | 3h | Covariance, contravariance -- le "pourquoi" des erreurs bizarres |
| 16 | Declaration files et augmentation | 3h | `.d.ts`, module augmentation, ambient declarations |
| 17 | tsconfig et compilateur | 3h | **Cours cle** -- maitriser la config, c'est maitriser le projet |
| 18 | Patterns de conception | 4h | Builder, Strategy, State, Observer -- en TypeScript idiomatique |
| 19 | Projet final | 8h+ | Tout assembler dans un vrai projet |

**Checkpoint Phase 4** :
- [ ] Tu sais expliquer la covariance et la contravariance avec un exemple
- [ ] Tu sais ecrire un fichier `.d.ts` pour une lib non-typee
- [ ] Tu sais configurer un `tsconfig.json` pour un monorepo
- [ ] Tu sais implementer au moins 3 design patterns en TypeScript idiomatique
- [ ] Tu as termine le projet final et il compile en `strict: true`

> **Test** : Un collegue te montre une erreur TypeScript de 15 lignes.
> Si tu sais la lire de bas en haut, identifier le conflit de types,
> et proposer une solution en moins de 5 minutes -- tu es un dev TypeScript senior.

---

## Quand tu bloques

Le compilateur TypeScript est bavard. C'est une force, pas un defaut.
Voici comment debloquer selon la situation :

### "L'erreur fait 10 lignes et je ne comprends rien"
1. Lis la DERNIERE ligne de l'erreur, pas la premiere. C'est la que se trouve le vrai probleme.
2. Cherche les mots-cles : `is not assignable to`, `missing property`, `Type X has no index signature`.
3. Hover sur la variable dans ton IDE -- le type infere est souvent la reponse.

### "Mon type est `any` et je ne sais pas pourquoi"
1. Verifie que `strict: true` est dans ton `tsconfig.json`
2. Cherche un `as any` cache dans la chaine d'appels
3. Verifie que la lib que tu utilises a des types (`@types/xxx` installe ?)

### "Je ne comprends pas les generics"
1. Remplace mentalement le generic par un type concret. `Array<T>` avec `T = string` -> `Array<string>`. Ca aide.
2. Ecris d'abord la version non-generique, puis generalise.
3. Dessine sur papier : "T entre ici, il passe par la, il sort ici".

### "Le conditional type fait n'importe quoi"
1. Verifie si tu as un probleme de distribution (les unions se distribuent dans les conditional types)
2. Entoure ton type de crochets `[T] extends [U]` pour eviter la distribution
3. Utilise le TypeScript Playground -- le hover montre le type resolve

### "Je n'arrive pas a faire l'exercice"
1. Relis le cours correspondant -- la solution est dedans a 90%
2. Ecris d'abord la version avec `any`, puis remplace les `any` un par un
3. Regarde les 3 premiers indices de la correction, pas la solution complete

### "Ca compile mais je ne suis pas sur que c'est correct"
1. Essaie de passer une valeur invalide -- le compilateur devrait crier
2. Si ca passe sans erreur, tes types sont trop larges
3. Ajoute un test : `type _Test = Expect<Equal<MonType, TypeAttendu>>`

---

## Auto-evaluation par phase

Apres chaque phase, pose-toi ces questions. Si tu ne sais pas repondre,
reviens en arriere -- c'est un signe, pas un echec.

**Apres Phase 1** : "Quelle est la difference entre `unknown` et `any` ?"
-> Si tu reponds que `unknown` force le narrowing avant utilisation, c'est bon.

**Apres Phase 2** : "Pourquoi `Array<string>` et pas `string[]` dans certains cas ?"
-> Si tu parles de lisibilite et de coherence avec les generics complexes, c'est bon.

**Apres Phase 3** : "Comment creer un type qui rend toutes les proprietes optionnelles, recurssivement ?"
-> Si tu ecris un `DeepPartial` avec un mapped type conditionnel recursif, c'est bon.

**Apres Phase 4** : "Un collegue veut desactiver `strict` parce que 'ca gene'. Que lui dis-tu ?"
-> Si tu argumentes avec la securite du typage, les bugs evites en production, et tu proposes
   une migration progressive (`// @ts-expect-error`), c'est bon.

---

## Rythme recommande

| Rythme | Par semaine | Duree totale |
|---|---|---|
| **Decouverte** (a cote du boulot) | 4-6h | 5-6 mois |
| **Regulier** (motivation) | 8-10h | 3-4 mois |
| **Intensif** (objectif pro) | 12-15h | 2-3 mois |

### Conseils concrets

- **1 module = 1 a 2 sessions.** Ne fais jamais plus de 2 modules par semaine.
- **Alterne theorie et pratique.** Lis un cours, fais l'exercice, lis le cours suivant.
- **Les generics (06-07) meritent une semaine entiere.** Ne les survole pas.
- **Le projet final (19) vaut 2 semaines.** C'est la que tout se cristallise.
- **Mieux vaut 45 min chaque jour que 5h le samedi.** Les types s'ancrent par repetition.

### Quand faire une pause

- Si tu ne retiens plus rien -> arrete, dors, reviens demain
- Si tu trouves un exercice stupide -> c'est souvent un signe de fatigue, pas un probleme de l'exercice
- Si le compilateur te rend fou -> ferme l'IDE, dessine le type sur papier, reviens dans 1h

---

## Ressources complementaires

### Quand tu veux approfondir
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) -- la reference officielle
- [TypeScript Playground](https://www.typescriptlang.org/play) -- teste tes types en live
- [Type Challenges](https://github.com/type-challenges/type-challenges) -- des katas de types (apres la Phase 3)
- *Effective TypeScript* (Dan Vanderkam) -- 62 regles concretes, excellent apres la Phase 2

### Quand tu cherches une reponse rapide
- Hover dans ton IDE -- c'est la source d'info numero 1
- `Ctrl+Click` sur un type pour voir sa definition
- Le TypeScript Playground avec `// @ts-expect-error` pour tester des hypotheses

---

## Et apres ?

Tu as fini les 20 modules ? Tu es desormais un dev TypeScript solide.

Voici les prochaines etapes :
1. **Applique dans un vrai projet** -- refactore une codebase existante en `strict: true`
2. **Explore les Type Challenges** -- niveau Medium et Hard pour muscler tes types
3. **Passe a NestJS (cours 05)** -- TypeScript prend tout son sens dans un framework backend
4. **Contribue a DefinitelyTyped** -- ecrire des types pour les autres, c'est le niveau final
