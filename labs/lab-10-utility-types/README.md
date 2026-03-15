# Lab 10 — Utility Types

## Objectifs

- Reimplementer les utility types natifs de TypeScript depuis zero
- Comprendre les mapped types en profondeur
- Maîtriser `keyof`, `in`, les index signatures et les modificateurs (`?`, `readonly`)
- Combiner plusieurs utility types pour des transformations complexes

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **Reimplementation de base** — Créer `MyPartial<T>`, `MyRequired<T>`, `MyReadonly<T>` en utilisant les mapped types.
2. **Reimplementation avancee** — Créer `MyPick<T, K>`, `MyOmit<T, K>`, `MyRecord<K, V>` avec des contraintes génériques.
3. **Combinaisons et usage pratique** — Combiner les utility types pour des transformations reelles (formulaires, APIs, etc.).

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demandé
3. Executez le fichier pour vérifier vos réponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
