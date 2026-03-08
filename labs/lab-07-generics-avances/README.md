# Lab 07 — Generics avances

## Objectifs

- Maitriser le pattern Builder avec des types generiques evolues
- Comprendre et implementer les branded types (types nominaux)
- Manipuler les variadic tuples pour des operations type-safe
- Utiliser les contraintes generiques avancees

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **Builder pattern type-safe** — Creer un builder qui garantit au niveau du type que tous les champs obligatoires sont renseignes avant l'appel a `build()`.
2. **Branded types (USD/EUR)** — Implementer des types nominaux pour empecher le melange accidentel de devises.
3. **Variadic tuples** — Implementer des operations de concatenation et manipulation de tuples avec typage precis.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
