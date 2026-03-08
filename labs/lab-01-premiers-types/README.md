# Lab 01 — Premiers types

## Objectifs

- Comprendre le systeme de types de base de TypeScript : `string`, `number`, `boolean`
- Annoter correctement des variables et des parametres de fonctions
- Corriger des erreurs de typage courantes
- Distinguer l'inference automatique de l'annotation explicite
- Comprendre la difference entre `let` et `const` pour l'inference
- Manipuler les types litteraux (literal types)
- Utiliser `unknown` a la place de `any` pour un code plus sur

## Exercices

Le fichier `exercise.ts` contient 8 exercices progressifs :

1. **Annotations de base** — Annoter des variables avec les types primitifs (`string`, `number`, `boolean`).
2. **Correction d'erreurs** — Trouver et corriger des erreurs de typage dans du code existant.
3. **Inference vs annotation** — Determiner quand TypeScript peut inferer le type et quand une annotation est necessaire.
4. **let vs const** — Comprendre pourquoi `const` produit un type litteral et `let` un type elargi.
5. **Types litteraux** — Creer des variables avec des types litteraux precis.
6. **unknown vs any** — Remplacer `any` par `unknown` et ecrire le narrowing necessaire.
7. **Fonctions de base** — Annoter les parametres et le retour de fonctions simples.
8. **Union de types simples** — Utiliser des unions pour accepter plusieurs types.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
