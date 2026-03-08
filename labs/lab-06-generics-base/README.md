# Lab 06 — Generics (base)

## Objectifs

- Comprendre le concept des generiques en TypeScript
- Creer des classes generiques (`Stack<T>`)
- Ecrire des fonctions generiques avec contraintes
- Utiliser `keyof` et les contraintes generiques
- Implementer un cache generique
- Creer une factory generique

## Exercices

Le fichier `exercise.ts` contient 6 exercices progressifs :

1. **Fonction identity generique** — La fonction generique la plus simple.
2. **`Stack<T>`** — Implementer une pile generique avec push, pop, peek.
3. **Cache generique** — Creer un systeme de cache type-safe.
4. **Contraintes generiques** — Utiliser `extends` pour contraindre les types.
5. **keyof et lookup types** — Acceder aux proprietes de maniere type-safe.
6. **Factory generique** — Creer des objets de maniere generique.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
