# Lab 14 — Decorateurs

## Objectifs

- Comprendre la syntaxe Stage 3 des decorateurs
- Implementer un decorateur `@Log` pour tracer les appels de methodes
- Creer un decorateur `@Validate` pour valider les parametres
- Simuler un mini-framework d'injection de dependances avec decorateurs

## Exercices

1. **@Log** — Decorateur qui journalise les appels et retours de methodes
2. **@Validate** — Decorateur qui valide les arguments selon des regles
3. **@Memoize** — Decorateur qui met en cache les resultats
4. **Mini conteneur DI** — Conteneur d'injection de dependances simple avec decorateurs

## Instructions

1. Ouvrez `exercise.ts`
2. Recherchez les commentaires `// TODO` et completez chaque decorateur demande
3. Executez le fichier pour verifier vos reponses : `npx tsx exercise.ts`
4. Comparez avec `solution.ts` si besoin

## Criteres de reussite

Tous les tests du fichier doivent passer (affichage vert dans la console).

## Lancer les tests

```bash
npx tsx exercise.ts
npx tsx solution.ts
```
