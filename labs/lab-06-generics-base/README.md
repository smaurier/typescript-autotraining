# Lab 06 — Generics (base)

## Objectifs

- Comprendre le concept des génériques en TypeScript
- Créer des classes génériques (`Stack<T>`)
- Écrire des fonctions génériques avec contraintes
- Utiliser `keyof` et les contraintes génériques
- Implementer un cache générique
- Créer une factory générique

## Exercices

Le fichier `exercise.ts` contient 6 exercices progressifs :

1. **Fonction identity générique** — La fonction générique la plus simple.
2. **`Stack<T>`** — Implementer une pile générique avec push, pop, peek.
3. **Cache générique** — Créer un système de cache type-safe.
4. **Contraintes génériques** — Utiliser `extends` pour contraindre les types.
5. **keyof et lookup types** — Acceder aux propriétés de manière type-safe.
6. **Factory générique** — Créer des objets de manière générique.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demandé
3. Executez le fichier pour vérifier vos réponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
