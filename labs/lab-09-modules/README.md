# Lab 09 — Modules

## Objectifs

- Comprendre l'organisation d'un mini-projet TypeScript multi-fichiers
- Maîtriser les barrel files (index.ts) et les re-exports
- Utiliser les path aliases pour des imports plus lisibles
- Distinguer les différents styles d'export (named, default, namespace)
- Simuler une architecture modulaire dans un fichier unique

## Exercices

Le fichier `exercise.ts` contient 3 exercices progressifs :

1. **Organisation modulaire avec namespaces** — Simuler une architecture multi-fichiers en utilisant des namespaces pour separer les responsabilites (models, services, utils).
2. **Barrel pattern et re-exports** — Comprendre et implementer le pattern barrel pour exposer une API publique propre.
3. **Encapsulation et visibilite** — Controler ce qui est exporte et ce qui reste prive au module.

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez le code demandé
3. Executez le fichier pour vérifier vos réponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Note

Ce lab simule les concepts de modules dans un fichier unique pour des raisons pratiques. Dans un vrai projet, chaque namespace correspondrait à un fichier ou dossier separe.

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).
