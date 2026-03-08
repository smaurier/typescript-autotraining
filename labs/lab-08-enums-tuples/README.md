# Lab 08 — Enums et Tuples

## Objectifs

- Implementer une machine a etats (state machine) avec des enums TypeScript
- Maitriser le parsing et la destructuration de tuples
- Comprendre et appliquer le pattern d'exhaustivite avec `never`
- Utiliser les labeled tuples pour un code plus lisible

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **State machine avec enums** — Modeliser les etats et transitions d'une commande en ligne avec des enums, et implementer une fonction de transition qui valide les changements d'etat.
2. **Parsing et manipulation de tuples** — Travailler avec des tuples types pour le parsing de donnees structurees (coordonnees, couleurs RGB, etc.).
3. **Exhaustivite avec never** — Implementer des switch exhaustifs qui garantissent a la compilation que tous les cas sont geres.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
