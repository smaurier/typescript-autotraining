# TypeScript Course — Formation complete (débutant → expert)

![VitePress](https://img.shields.io/badge/-VitePress-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
[![fullstack-autotraining](https://img.shields.io/badge/curriculum-fullstack--autotraining-4C1?style=flat-square)](https://github.com/smaurier/fullstack-autotraining)

Formation complete TypeScript couvrant les types primitifs, generics, conditional types, mapped types, type-level programming, decorateurs, variance, patterns de conception et bien plus.

<!-- labs-gestes:start -->
## Labs — refonte du 22/09/2026 : un lab = un geste métier complet

> Règle qualité 5 du parcours : chaque lab est **un geste métier complet**, sous deux formes — **Zéro** (construire de zéro un artefact réel et entier) ou **Intervention** (modifier de l'existant avec consommateurs, findings avant code, non-régression). Un lab n'entre en file qu'avec un **oracle exécutable** (`src/` starter · `test/` · `solution/` séparée). Les labs historiques de ce cours (un concept par lab, sans oracle) restent dans `labs/` jusqu'à remplacement et **ne sont plus la file**. Cible détaillée : [`docs/gestes-complets.md`](../docs/gestes-complets.md). État : **12/13 avec oracle**.

| # | Lab | Forme | Geste | Oracle |
|---|-----|-------|-------|--------|
| 01 | [`lab-01-premiers-types`](labs/lab-01-premiers-types/README.md) | Zéro | typer Member, unknown + guard, satisfies | ✅ vérifié |
| 02 | [`lab-02-fonctions`](labs/lab-02-fonctions/README.md) | Zéro | signatures, défaut, guard is, asserts | ✅ vérifié |
| 03 | [`lab-03-objets-interfaces`](labs/lab-03-objets-interfaces/README.md) | Zéro | la source de vérité du domaine TribuZen | ✅ vérifié |
| 04 | [`lab-04-narrowing`](labs/lab-04-narrowing/README.md) | Zéro | union discriminée + never exhaustif | ✅ vérifié |
| 05 | [`lab-05-classes`](labs/lab-05-classes/README.md) | Zéro | hiérarchie d'entités, #private, this | ✅ vérifié |
| 06 | [`lab-06-generics-base`](labs/lab-06-generics-base/README.md) | Intervention | refactorer la duplication en ApiResponse<T>, getById, Repository<T> | ✅ vérifié |
| 07 | [`lab-07-generics-avances`](labs/lab-07-generics-avances/README.md) | Zéro | pick, QueryBuilder<T>, NoInfer, chasse au generic de trop | ✅ vérifié |
| 08 | [`lab-08-enums-tuples`](labs/lab-08-enums-tuples/README.md) | Intervention | commit fautif d'un collègue : enum → as const, number[] → tuple | ✅ vérifié |
| 09 | [`lab-09-modules`](labs/lab-09-modules/README.md) | Zéro | découper le domaine en modules, exports, résolution | ✅ vérifié |
| 10 | [`lab-10-utility-types`](labs/lab-10-utility-types/README.md) | Zéro | DTO dérivés du domaine avec Partial/Pick/Omit/ReturnType | ✅ vérifié |
| 11 | [`lab-11-durcir-une-base-any`](labs/lab-11-durcir-une-base-any/README.md) | Intervention | une base héritée en any à durcir sans casser ses appels (fusion 11-13) | ✅ vérifié |
| 12 | [`lab-14-decorateurs`](labs/lab-14-decorateurs/README.md) | Zéro | checkpoint juste avant NestJS — décorateur standard + mini-DI legacy (reflect-metadata) | ✅ vérifié |
| 13 | `lab-19-paquet-domaine` | Zéro | publier @tribuzen/domain consommé par le front et l'API | · à écrire |

<!-- labs-gestes:end -->

## Prérequis

- **Node.js 20+** et **npm**
- **VS Code** avec l'extension TypeScript
- Un terminal (bash, zsh, PowerShell)

## Installation

```bash
npm install
```

## Lancer le site de cours

```bash
npm run docs:dev
```

## Lancer un lab

```bash
npm run lab:01    # Exercice du lab 01
npm run solution:01  # Solution du lab 01
```

## Structure

```
typescript-course/
├── modules/          # 20 modules theoriques (MD)
├── labs/             # 19 labs pratiques (TS)
├── quizzes/          # 20 quizzes interactifs (HTML)
├── visualizations/   # 5 visualisations animees (HTML)
├── screencasts/      # 20 scripts de screencasts (MD)
└── glossaire.md      # ~70 termes TypeScript
```

## Parcours

| Phase | Modules | Niveau |
|-------|---------|--------|
| 1 — Fondamentaux | 00-04 | Débutant |
| 2 — Intermédiaire | 05-09 | Intermédiaire |
| 3 — Avance | 10-14 | Avance |
| 4 — Expert | 15-19 | Expert |
