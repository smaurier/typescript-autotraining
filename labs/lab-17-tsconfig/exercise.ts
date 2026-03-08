// =============================================================================
// Lab 17 — Configuration TypeScript (tsconfig)
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
// Pour chaque question, retourner la bonne reponse.
// =============================================================================

interface TsconfigQuiz {
  question: string;
  answer: string;
}

// TODO: Completer chaque reponse

function quiz_strictNullChecks(): TsconfigQuiz {
  return {
    question: 'Quel est l\'effet de strictNullChecks: true ?',
    // TODO: choisir parmi :
    //   a) "Empeche l'utilisation de null et undefined comme valeurs"
    //   b) "null et undefined ne sont plus assignables a tous les types"
    //   c) "Remplace null par undefined partout"
    answer: '', // <-- remplacez par 'a', 'b', ou 'c'
  };
}

function quiz_target(): TsconfigQuiz {
  return {
    question: 'Que controle l\'option "target" ?',
    // TODO: choisir parmi :
    //   a) "La version d'ECMAScript en sortie du compilateur"
    //   b) "Le navigateur cible"
    //   c) "La version de Node.js cible"
    answer: '', // <-- remplacez par 'a', 'b', ou 'c'
  };
}

function quiz_moduleResolution(): TsconfigQuiz {
  return {
    question: 'Quelle est la difference entre "node" et "bundler" pour moduleResolution ?',
    // TODO: choisir parmi :
    //   a) "node utilise l'algorithme de resolution Node.js, bundler permet les imports sans extension"
    //   b) "Aucune difference, ce sont des alias"
    //   c) "bundler est plus rapide que node"
    answer: '', // <-- remplacez par 'a', 'b', ou 'c'
  };
}

function quiz_declaration(): TsconfigQuiz {
  return {
    question: 'Que fait l\'option "declaration: true" ?',
    // TODO: choisir parmi :
    //   a) "Genere des fichiers .d.ts avec les types publics"
    //   b) "Active le mode de declaration de variables"
    //   c) "Declare automatiquement les types manquants"
    answer: '', // <-- remplacez par 'a', 'b', ou 'c'
  };
}

function quiz_strict(): TsconfigQuiz {
  return {
    question: 'Que fait "strict: true" ?',
    // TODO: choisir parmi :
    //   a) "Active uniquement strictNullChecks"
    //   b) "Active toutes les options de verification stricte (strictNullChecks, noImplicitAny, etc.)"
    //   c) "Empeche l'utilisation de any"
    answer: '', // <-- remplacez par 'a', 'b', ou 'c'
  };
}

// =============================================================================
// Exercice 2 : Options de strictness
// Identifier l'effet de chaque option de strictness
// =============================================================================

interface StrictnessOption {
  name: string;
  description: string;
  example: string;
}

// TODO: Completer la description et l'exemple pour chaque option
function getStrictnessOptions(): StrictnessOption[] {
  return [
    {
      name: 'noImplicitAny',
      // TODO: decrire l'effet
      description: '', // <-- remplacez
      // TODO: donner un exemple de code qui echouerait
      example: '', // <-- remplacez
    },
    {
      name: 'strictNullChecks',
      description: '', // <-- remplacez
      example: '', // <-- remplacez
    },
    {
      name: 'strictFunctionTypes',
      description: '', // <-- remplacez
      example: '', // <-- remplacez
    },
    {
      name: 'noImplicitReturns',
      description: '', // <-- remplacez
      example: '', // <-- remplacez
    },
    {
      name: 'noUncheckedIndexedAccess',
      description: '', // <-- remplacez
      example: '', // <-- remplacez
    },
  ];
}

// =============================================================================
// Exercice 3 : Project References
// Comprendre la configuration d'un monorepo
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

// TODO: Creer la config tsconfig.json racine d'un monorepo avec 3 packages :
//   - packages/shared (librairie utilitaire)
//   - packages/api (backend)
//   - packages/web (frontend)
// La config racine doit :
//   - Avoir composite: true
//   - Referencier les 3 packages
//   - Ne pas inclure de fichiers directement
function createRootTsconfig(): TsconfigJson {
  // TODO: retourner la configuration racine
  return {
    compilerOptions: {},
  }; // <-- remplacez
}

// TODO: Creer la config pour packages/shared
// Elle doit :
//   - Avoir composite: true et declaration: true
//   - Cibler ES2022
//   - Utiliser strict: true
//   - Inclure src/**/*
//   - Avoir outDir: ./dist
function createSharedTsconfig(): TsconfigJson {
  // TODO: retourner la configuration
  return {
    compilerOptions: {},
  }; // <-- remplacez
}

// TODO: Creer la config pour packages/api
// Elle doit :
//   - Avoir composite: true et declaration: true
//   - Referencier ../shared
//   - Cibler ES2022 avec module: Node16
//   - Avoir strict: true
function createApiTsconfig(): TsconfigJson {
  // TODO: retourner la configuration
  return {
    compilerOptions: {},
  }; // <-- remplacez
}

// =============================================================================
// Exercice 4 : Comprendre les paths et baseUrl
// =============================================================================

interface PathMapping {
  alias: string;
  resolvedPath: string;
}

// TODO: Etant donne la config paths suivante :
// "paths": {
//   "@shared/*": ["../shared/src/*"],
//   "@utils/*": ["./src/utils/*"],
//   "@config": ["./src/config/index"]
// }
// Resoudre les imports suivants :

function resolveImport(importPath: string): string {
  // TODO: retourner le chemin resolu pour chaque import
  // Exemples d'imports : "@shared/types", "@utils/helpers", "@config"
  const pathMappings: Record<string, string> = {
    // TODO: remplir les correspondances
  };

  // Resoudre en utilisant les mappings
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
