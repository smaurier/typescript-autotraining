# Lab 11 — Conditional Types

## Objectifs

- Implementer des types conditionnels personnalises avec `infer`
- Creer des types utilitaires avances : Flatten, UnpackPromise, IsEqual
- Comprendre la distribution des types conditionnels sur les unions
- Ecrire des assertions de type au niveau compilation (type-level tests)
- Maitriser IsNever et les cas limites des conditional types

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **Types conditionnels de base** — Implementer `IsString<T>`, `IsArray<T>`, `Flatten<T>` et `UnpackPromise<T>` en utilisant `extends` et `infer`.
2. **Egalite et types avances** — Implementer `IsEqual<A, B>`, `IsNever<T>`, et comprendre la distribution des conditional types.
3. **Types conditionnels pratiques** — Implementer `ReturnTypeOf<T>`, `ParametersOf<T>`, `PromisifyAll<T>` pour des cas d'usage reels.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
