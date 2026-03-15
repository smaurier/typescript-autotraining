# Lab 04 — Narrowing

## Objectifs

- Maîtriser les différentes techniques de narrowing (restriction de type)
- Créer des discriminated unions (unions discriminees) efficaces
- Implementer des type guards personnalises (custom type guards)
- Utiliser le pattern de vérification exhaustive avec `never`
- Appliquer `typeof`, `instanceof`, et `in` pour le narrowing

## Exercices

Le fichier `exercise.ts` contient 6 exercices progressifs :

1. **typeof narrowing** — Utiliser `typeof` pour restreindre les types primitifs.
2. **instanceof narrowing** — Utiliser `instanceof` pour les classes.
3. **Discriminated unions** — Créer des formes geometriques avec un champ discriminant.
4. **Type guards personnalises** — Écrire des fonctions de garde avec `is`.
5. **Reponses API** — Modeliser des réponses API avec des unions discriminees.
6. **Vérification exhaustive** — Utiliser `never` pour garantir que tous les cas sont geres.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demandé
3. Executez le fichier pour vérifier vos réponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
