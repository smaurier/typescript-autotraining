# Lab 12 — Mapped Types et Template Literal Types

## Objectifs

- Creer un type `DeepReadonly<T>` qui rend un objet et tous ses sous-objets immuables
- Generer des types `EventHandlers<T>` a partir d'un objet (on + nom de propriete capitalise)
- Utiliser les template literal types pour creer des proprietes CSS type-safe
- Combiner mapped types et template literal types pour des transformations avancees

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **DeepReadonly** — Implementer un type recursif qui rend toutes les proprietes, y compris les sous-objets, en `readonly`.
2. **EventHandlers** — A partir d'un objet, generer automatiquement les noms de handlers d'evenements (`onChange`, `onSubmit`, etc.) avec les bons types.
3. **Template Literal CSS** — Creer des types pour des proprietes CSS type-safe en utilisant les template literal types.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
