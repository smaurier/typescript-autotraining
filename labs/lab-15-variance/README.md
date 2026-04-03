# Lab 15 — Variance

## Objectifs

- Comprendre la covariance et la contravariance en TypeScript
- Identifier quand un type est covariant, contravariant, invariant ou bivariant
- Corriger des erreurs de variance dans du code generique
- Comprendre le role de `readonly` dans la variance des tableaux
- Utiliser les annotations `in` et `out` pour les parametres de type

## Exercices

1. **Covariance** — Assignation de fonctions retournant des sous-types
2. **Contravariance** — Assignation de fonctions acceptant des super-types
3. **Tableaux readonly vs mutable** — Comprendre la variance des tableaux
4. **Generiques et variance** — Utiliser `in`/`out` pour annoter la variance
5. **Corriger des erreurs** — Identifier et corriger des problemes de variance

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez chaque exercice
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).

## Lancer les tests

```bash
npx tsx exercise.ts
npx tsx solution.ts
```
