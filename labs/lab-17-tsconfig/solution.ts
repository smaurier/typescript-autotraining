// =============================================================================
// Lab 17 — Configuration TypeScript (tsconfig) (SOLUTION)
// =============================================================================
// Objectifs :
//   - Comprendre les options principales de tsconfig.json
//   - Configurer un monorepo avec project references
//   - Maitriser les options de strictness
//   - Comprendre target, module, moduleResolution
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 17 — Configuration tsconfig');

// =============================================================================
// Exercice 1 : Quiz sur les options tsconfig
// =============================================================================

interface TsconfigQuiz {
  question: string;
  answer: string;
}

function quiz_strictNullChecks(): TsconfigQuiz {
  return {
    question: 'Quel est l\'effet de strictNullChecks: true ?',
    answer: 'b', // null et undefined ne sont plus assignables a tous les types
  };
}

function quiz_target(): TsconfigQuiz {
  return {
    question: 'Que controle l\'option "target" ?',
    answer: 'a', // La version d'ECMAScript en sortie du compilateur
  };
}

function quiz_moduleResolution(): TsconfigQuiz {
  return {
    question: 'Quelle est la difference entre "node" et "bundler" pour moduleResolution ?',
    answer: 'a', // node utilise l'algorithme Node.js, bundler permet les imports sans extension
  };
}

function quiz_declaration(): TsconfigQuiz {
  return {
    question: 'Que fait l\'option "declaration: true" ?',
    answer: 'a', // Genere des fichiers .d.ts avec les types publics
  };
}

function quiz_strict(): TsconfigQuiz {
  return {
    question: 'Que fait "strict: true" ?',
    answer: 'b', // Active toutes les options de verification stricte
  };
}

// =============================================================================
// Exercice 2 : Options de strictness
// =============================================================================

interface StrictnessOption {
  name: string;
  description: string;
  example: string;
}

function getStrictnessOptions(): StrictnessOption[] {
  return [
    {
      name: 'noImplicitAny',
      description: 'Interdit les parametres et variables dont le type est implicitement "any". Oblige a typer explicitement.',
      example: 'function greet(name) { } // Erreur : parametre "name" a un type "any" implicite',
    },
    {
      name: 'strictNullChecks',
      description: 'null et undefined ont leurs propres types et ne sont pas assignables aux autres types sans union explicite.',
      example: 'const x: string = null; // Erreur : null n\'est pas assignable a string',
    },
    {
      name: 'strictFunctionTypes',
      description: 'Active la verification contravariante des parametres de fonctions, empechant les assignations non sures.',
      example: 'type Fn = (x: Animal) => void; const f: Fn = (x: Dog) => x.bark(); // Erreur en mode strict',
    },
    {
      name: 'noImplicitReturns',
      description: 'Signale une erreur si une fonction avec un type de retour non-void ne retourne pas explicitement une valeur dans toutes les branches.',
      example: 'function f(x: number): string { if (x > 0) return "ok"; } // Erreur : pas de retour dans le else',
    },
    {
      name: 'noUncheckedIndexedAccess',
      description: 'L\'acces par index a un tableau ou objet indexe ajoute "undefined" au type de retour, forcant une verification.',
      example: 'const arr: string[] = []; const x: string = arr[0]; // Erreur : le type est string | undefined',
    },
  ];
}

// =============================================================================
// Exercice 3 : Project References
// =============================================================================

interface ProjectRef {
  path: string;
}

interface TsconfigJson {
  compilerOptions: Record<string, unknown>;
  references?: ProjectRef[];
  include?: string[];
  exclude?: string[];
}

function createRootTsconfig(): TsconfigJson {
  return {
    compilerOptions: {
      composite: true,
    },
    references: [
      { path: './packages/shared' },
      { path: './packages/api' },
      { path: './packages/web' },
    ],
    include: [],
  };
}

function createSharedTsconfig(): TsconfigJson {
  return {
    compilerOptions: {
      composite: true,
      declaration: true,
      target: 'ES2022',
      module: 'ES2022',
      strict: true,
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
  };
}

function createApiTsconfig(): TsconfigJson {
  return {
    compilerOptions: {
      composite: true,
      declaration: true,
      target: 'ES2022',
      module: 'Node16',
      moduleResolution: 'Node16',
      strict: true,
      outDir: './dist',
      rootDir: './src',
    },
    references: [
      { path: '../shared' },
    ],
    include: ['src/**/*'],
  };
}

// =============================================================================
// Exercice 4 : Comprendre les paths et baseUrl
// =============================================================================

interface PathMapping {
  alias: string;
  resolvedPath: string;
}

function resolveImport(importPath: string): string {
  const pathMappings: Record<string, string> = {
    '@shared/*': '../shared/src/*',
    '@utils/*': './src/utils/*',
    '@config': './src/config/index',
  };

  for (const [pattern, resolved] of Object.entries(pathMappings)) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (importPath.startsWith(prefix)) {
        const rest = importPath.slice(prefix.length);
        return resolved.slice(0, -1) + rest;
      }
    } else if (importPath === pattern) {
      return resolved;
    }
  }
  return importPath;
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 17 — Configuration tsconfig\n');

  // --- Tests Quiz ---
  await test('strictNullChecks: bonne reponse', () => {
    assertEqual(quiz_strictNullChecks().answer, 'b');
  });

  await test('target: bonne reponse', () => {
    assertEqual(quiz_target().answer, 'a');
  });

  await test('moduleResolution: bonne reponse', () => {
    assertEqual(quiz_moduleResolution().answer, 'a');
  });

  await test('declaration: bonne reponse', () => {
    assertEqual(quiz_declaration().answer, 'a');
  });

  await test('strict: bonne reponse', () => {
    assertEqual(quiz_strict().answer, 'b');
  });

  // --- Tests Strictness ---
  await test('getStrictnessOptions devrait retourner 5 options', () => {
    const options = getStrictnessOptions();
    assertEqual(options.length, 5);
  });

  await test('Chaque option devrait avoir une description non vide', () => {
    const options = getStrictnessOptions();
    for (const opt of options) {
      assert(opt.description.length > 0, `${opt.name} devrait avoir une description`);
      assert(opt.example.length > 0, `${opt.name} devrait avoir un exemple`);
    }
  });

  // --- Tests Project References ---
  await test('Root tsconfig devrait referencier 3 packages', () => {
    const config = createRootTsconfig();
    assert(config.references !== undefined, 'Devrait avoir des references');
    assertEqual(config.references!.length, 3);
  });

  await test('Root tsconfig devrait avoir composite: true', () => {
    const config = createRootTsconfig();
    assertEqual(config.compilerOptions['composite'], true);
  });

  await test('Shared tsconfig devrait avoir declaration: true', () => {
    const config = createSharedTsconfig();
    assertEqual(config.compilerOptions['declaration'], true);
    assertEqual(config.compilerOptions['composite'], true);
  });

  await test('Shared tsconfig devrait cibler ES2022', () => {
    const config = createSharedTsconfig();
    assertEqual(config.compilerOptions['target'], 'ES2022');
  });

  await test('Api tsconfig devrait referencier shared', () => {
    const config = createApiTsconfig();
    assert(config.references !== undefined, 'Devrait avoir des references');
    const paths = config.references!.map((r: ProjectRef) => r.path);
    assert(paths.some((p: string) => p.includes('shared')), 'Devrait referencier shared');
  });

  await test('Api tsconfig devrait avoir module: Node16', () => {
    const config = createApiTsconfig();
    assertEqual(config.compilerOptions['module'], 'Node16');
  });

  // --- Tests Path Resolution ---
  await test('resolveImport devrait resoudre @shared/types', () => {
    const resolved = resolveImport('@shared/types');
    assertEqual(resolved, '../shared/src/types');
  });

  await test('resolveImport devrait resoudre @utils/helpers', () => {
    const resolved = resolveImport('@utils/helpers');
    assertEqual(resolved, './src/utils/helpers');
  });

  await test('resolveImport devrait resoudre @config', () => {
    const resolved = resolveImport('@config');
    assertEqual(resolved, './src/config/index');
  });

  summary();
}

main();
