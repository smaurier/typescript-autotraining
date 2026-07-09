import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TypeScript Course',
  description: 'Formation complète TypeScript : types primitifs, generics, conditional types, type-level programming, patterns de conception (débutant → expert)',
  lang: 'fr-FR',
  srcDir: '.',

  ignoreDeadLinks: true,

  // Refonte v1 : le cours vit dans `modules/` + `labs/`. L'ancien `cours/` (v0,
  // archive/source d'audit) est exclu du build.
  srcExclude: ['cours/**'],

  // Docs statiques : neutralise l'interpolation Vue `{{ }}` (délimiteurs improbables)
  // pour que les moustaches en prose et les `${{ }}` (GitHub Actions) ne cassent pas le SSR.
  // NB : override `delimiters` retiré (il cassait le {{ }} du thème par défaut).
  // cf docs/curriculum/DETTE-vitepress-delimiters.md


  themeConfig: {
    nav: [
      { text: 'Modules', link: '/modules/00-prerequis-et-introduction' },
      { text: 'Labs', link: '/labs/lab-01-premiers-types/README' },
      { text: 'Quizzes', link: '/quizzes/' },
      { text: 'Visualisations', link: '/visualizations/' },
      { text: 'Glossaire', link: '/glossaire' }
    ],

    sidebar: {
      '/modules/': [
        {
          text: 'Phase 1 — Fondamentaux',
          items: [
            { text: '00 — Prerequis & Introduction', link: '/modules/00-prerequis-et-introduction' },
            { text: '01 — Types primitifs & Inference', link: '/modules/01-types-primitifs-et-inference' },
            { text: '02 — Fonctions', link: '/modules/02-fonctions' },
            { text: '03 — Objets, Interfaces & Types', link: '/modules/03-objets-interfaces-types' },
            { text: '04 — Unions, Intersections & Narrowing', link: '/modules/04-unions-intersections-narrowing' }
          ]
        },
        {
          text: 'Phase 2 — Intermediaire',
          items: [
            { text: '05 — Classes & Heritage', link: '/modules/05-classes-et-heritage' },
            { text: '06 — Generics Fondamentaux', link: '/modules/06-generics-fondamentaux' },
            { text: '07 — Generics Avances', link: '/modules/07-generics-avances' },
            { text: '08 — Enums, Tuples & Types speciaux', link: '/modules/08-enums-tuples-types-speciaux' },
            { text: '09 — Modules & Resolution', link: '/modules/09-modules-et-resolution' }
          ]
        },
        {
          text: 'Phase 3 — Avance',
          items: [
            { text: '10 — Utility Types', link: '/modules/10-utility-types' },
            { text: '11 — Conditional Types & infer', link: '/modules/11-conditional-types' },
            { text: '12 — Mapped Types & Template Literals', link: '/modules/12-mapped-types-template-literals' },
            { text: '13 — Types recursifs & Type Programming', link: '/modules/13-types-recursifs-type-programming' },
            { text: '14 — Decorateurs & Metadata', link: '/modules/14-decorateurs-metadata' }
          ]
        },
        {
          text: 'Phase 4 — Expert',
          items: [
            { text: '15 — Variance & Soundness', link: '/modules/15-variance-et-soundness' },
            { text: '16 — Declaration Files & Augmentation', link: '/modules/16-declaration-files-augmentation' },
            { text: '17 — tsconfig & Compilateur', link: '/modules/17-tsconfig-et-compilateur' },
            { text: '18 — Patterns de conception', link: '/modules/18-patterns-de-conception' },
            { text: '19 — Projet final', link: '/modules/19-projet-final' }
          ]
        }
      ],
      '/quizzes/': [
        {
          text: 'Quizzes',
          items: [
            { text: 'Tous les quizzes', link: '/quizzes/' },
            { text: 'Quiz 00 — Prerequis', link: '/quizzes/quiz-00-prerequis' },
            { text: 'Quiz 01 — Types primitifs', link: '/quizzes/quiz-01-types-primitifs' },
            { text: 'Quiz 02 — Fonctions', link: '/quizzes/quiz-02-fonctions' },
            { text: 'Quiz 03 — Objets & Interfaces', link: '/quizzes/quiz-03-objets-interfaces' },
            { text: 'Quiz 04 — Narrowing', link: '/quizzes/quiz-04-narrowing' },
            { text: 'Quiz 05 — Classes', link: '/quizzes/quiz-05-classes' },
            { text: 'Quiz 06 — Generics base', link: '/quizzes/quiz-06-generics-base' },
            { text: 'Quiz 07 — Generics avances', link: '/quizzes/quiz-07-generics-avances' },
            { text: 'Quiz 08 — Enums & Tuples', link: '/quizzes/quiz-08-enums-tuples' },
            { text: 'Quiz 09 — Modules', link: '/quizzes/quiz-09-modules' },
            { text: 'Quiz 10 — Utility Types', link: '/quizzes/quiz-10-utility-types' },
            { text: 'Quiz 11 — Conditional Types', link: '/quizzes/quiz-11-conditional-types' },
            { text: 'Quiz 12 — Mapped & Template', link: '/quizzes/quiz-12-mapped-template' },
            { text: 'Quiz 13 — Type Programming', link: '/quizzes/quiz-13-type-programming' },
            { text: 'Quiz 14 — Decorateurs', link: '/quizzes/quiz-14-decorateurs' },
            { text: 'Quiz 15 — Variance', link: '/quizzes/quiz-15-variance' },
            { text: 'Quiz 16 — Declaration Files', link: '/quizzes/quiz-16-declaration-files' },
            { text: 'Quiz 17 — tsconfig', link: '/quizzes/quiz-17-tsconfig' },
            { text: 'Quiz 18 — Patterns', link: '/quizzes/quiz-18-patterns' },
            { text: 'Quiz 19 — Projet final', link: '/quizzes/quiz-19-projet-final' }
          ]
        }
      ],
      '/visualizations/': [
        {
          text: 'Visualisations',
          items: [
            { text: 'Toutes les visualisations', link: '/visualizations/' },
            { text: 'Hierarchie des types', link: '/visualizations/type-hierarchy.html' },
            { text: 'Type Narrowing', link: '/visualizations/type-narrowing.html' },
            { text: 'Generics Flow', link: '/visualizations/generics-flow.html' },
            { text: 'Conditional Types', link: '/visualizations/conditional-types.html' },
            { text: 'Module Resolution', link: '/visualizations/module-resolution.html' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'Sur cette page'
    },

    docFooter: {
      prev: 'Précédent',
      next: 'Suivant'
    }
  }
})
