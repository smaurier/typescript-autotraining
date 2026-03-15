# Lab 12 — Mapped Types et Template Literal Types

## Objectifs

- Créer un type `DeepReadonly<T>` qui rend un objet et tous ses sous-objets immuables
- Générer des types `EventHandlers<T>` à partir d'un objet (on + nom de propriété capitalise)
- Utiliser les template literal types pour créer des propriétés CSS type-safe
- Combiner mapped types et template literal types pour des transformations avancees

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **DeepReadonly** — Implementer un type récursif qui rend toutes les propriétés, y compris les sous-objets, en `readonly`.
2. **EventHandlers** — A partir d'un objet, générer automatiquement les noms de handlers d'événements (`onChange`, `onSubmit`, etc.) avec les bons types.
3. **Template Literal CSS** — Créer des types pour des propriétés CSS type-safe en utilisant les template literal types.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demandé
3. Executez le fichier pour vérifier vos réponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
