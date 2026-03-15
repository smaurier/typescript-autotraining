# Lab 15 -- Variance

## Objectifs

- Comprendre la covariance et la contravariance en TypeScript
- Identifier quand un type est covariant, contravariant, invariant ou bivariant
- Corriger des erreurs de variance dans du code générique
- Comprendre le role de `readonly` dans la variance des tableaux
- Utiliser les annotations `in` et `out` pour les paramètres de type

## Exercices

1. **Covariance** -- Assignation de fonctions retournant des sous-types
2. **Contravariance** -- Assignation de fonctions acceptant des super-types
3. **Tableaux readonly vs mutable** -- Comprendre la variance des tableaux
4. **Generiques et variance** -- Utiliser `in`/`out` pour annoter la variance
5. **Corriger des erreurs** -- Identifier et corriger des problèmes de variance

## Lancer les tests

```bash
npx ts-node lab-15-variance/exercise.ts
npx ts-node lab-15-variance/solution.ts
```
