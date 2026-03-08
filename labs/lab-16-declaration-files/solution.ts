// =============================================================================
// Lab 16 — Fichiers de declaration (SOLUTION)
// =============================================================================
// Objectifs :
//   - Ecrire des declarations ambiantes pour une lib JS
//   - Pratiquer l'augmentation de modules
//   - Comprendre la fusion de declarations
//   - Declarer des types pour des variables globales
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 16 — Fichiers de declaration');

// =============================================================================
// Exercice 1 : Declarations ambiantes — MiniDB
// =============================================================================

interface Document {
  id: string;
  [key: string]: unknown;
}

interface QueryResult<T> {
  data: T[];
  count: number;
}

interface MiniDB {
  insert<T extends Document>(collection: string, doc: T): T;
  find<T extends Document>(collection: string, query: Partial<T>): QueryResult<T>;
  findById<T extends Document>(collection: string, id: string): T | null;
  delete(collection: string, id: string): boolean;
}

function createMiniDB(): MiniDB {
  const collections = new Map<string, Map<string, Document>>();

  function getCollection(name: string): Map<string, Document> {
    if (!collections.has(name)) {
      collections.set(name, new Map());
    }
    return collections.get(name)!;
  }

  return {
    insert<T extends Document>(collection: string, doc: T): T {
      const col = getCollection(collection);
      col.set(doc.id, doc);
      return doc;
    },

    find<T extends Document>(collection: string, query: Partial<T>): QueryResult<T> {
      const col = getCollection(collection);
      const results: T[] = [];
      for (const doc of col.values()) {
        let matches = true;
        for (const [key, value] of Object.entries(query)) {
          if (doc[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          results.push(doc as T);
        }
      }
      return { data: results, count: results.length };
    },

    findById<T extends Document>(collection: string, id: string): T | null {
      const col = getCollection(collection);
      return (col.get(id) as T) ?? null;
    },

    delete(collection: string, id: string): boolean {
      const col = getCollection(collection);
      return col.delete(id);
    },
  };
}

// =============================================================================
// Exercice 2 : Augmentation de module — Request
// =============================================================================

interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
}

interface Response {
  statusCode: number;
  send(body: string): void;
  json(data: unknown): void;
}

// Augmentation de Request par fusion de declarations
interface Request {
  user?: { id: string; name: string; role: string };
  session?: { token: string; expiresAt: Date };
}

// =============================================================================
// Exercice 3 : Fusion de declarations — Config
// =============================================================================

// Premiere declaration
interface Config {
  appName: string;
  version: string;
}

// Deuxieme declaration — fusionnee avec la premiere
interface Config {
  debug: boolean;
  port: number;
}

// Namespace fusionne avec l'interface
namespace Config {
  export function validate(config: Config): boolean {
    return config.appName.length > 0 && config.port > 0;
  }
}

// =============================================================================
// Exercice 4 : Variables globales
// =============================================================================

interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: string[];
}

const __APP_CONFIG__: AppConfig = {
  apiUrl: 'https://api.example.com',
  environment: 'production',
  features: ['auth', 'dashboard', 'reports'],
};

function getConfig(): AppConfig {
  return __APP_CONFIG__;
}

function isFeatureEnabled(feature: string): boolean {
  return __APP_CONFIG__.features.includes(feature);
}

// =============================================================================
// Exercice 5 : Type Guards avec declarations
// =============================================================================

interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code: number;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

function isSuccess<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.status === 'success';
}

function isError<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.status === 'error';
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (isSuccess(response)) {
    return response.data;
  }
  throw new Error(response.message);
}

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🔬 Lab 16 — Fichiers de declaration\n');

  // --- Tests MiniDB ---
  await test('MiniDB: insert devrait stocker et retourner le document', () => {
    const db = createMiniDB();
    const doc = db.insert('users', { id: '1', name: 'Alice', age: 30 });
    assertEqual(doc.id, '1');
    assertEqual(doc.name as string, 'Alice');
  });

  await test('MiniDB: findById devrait retrouver un document', () => {
    const db = createMiniDB();
    db.insert('users', { id: '1', name: 'Alice' });
    const found = db.findById('users', '1');
    assert(found !== null, 'Document devrait exister');
    assertEqual(found!.id, '1');
  });

  await test('MiniDB: findById devrait retourner null si non trouve', () => {
    const db = createMiniDB();
    const found = db.findById('users', '999');
    assertEqual(found, null);
  });

  await test('MiniDB: find devrait retourner les documents correspondants', () => {
    const db = createMiniDB();
    db.insert('users', { id: '1', name: 'Alice', role: 'admin' });
    db.insert('users', { id: '2', name: 'Bob', role: 'user' });
    db.insert('users', { id: '3', name: 'Charlie', role: 'admin' });
    const result = db.find('users', { role: 'admin' });
    assertEqual(result.count, 2);
    assertEqual(result.data.length, 2);
  });

  await test('MiniDB: delete devrait supprimer un document', () => {
    const db = createMiniDB();
    db.insert('users', { id: '1', name: 'Alice' });
    const deleted = db.delete('users', '1');
    assert(deleted, 'Devrait retourner true');
    const found = db.findById('users', '1');
    assertEqual(found, null);
  });

  await test('MiniDB: delete devrait retourner false si non trouve', () => {
    const db = createMiniDB();
    const deleted = db.delete('users', '999');
    assert(!deleted, 'Devrait retourner false');
  });

  // --- Tests Augmentation Request ---
  await test('Request augmentee devrait accepter user et session', () => {
    const req: Request = {
      url: '/api/data',
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      user: { id: '1', name: 'Alice', role: 'admin' },
      session: { token: 'abc123', expiresAt: new Date() },
    };
    assertEqual(req.user!.name, 'Alice');
    assertEqual(req.session!.token, 'abc123');
  });

  // --- Tests Config (declaration merging) ---
  await test('Config devrait avoir toutes les proprietes fusionnees', () => {
    const config: Config = {
      appName: 'MonApp',
      version: '1.0.0',
      debug: true,
      port: 3000,
    };
    assertEqual(config.appName, 'MonApp');
    assertEqual(config.port, 3000);
    assertEqual(config.debug, true);
  });

  await test('Config.validate devrait valider une config correcte', () => {
    const config: Config = {
      appName: 'MonApp',
      version: '1.0.0',
      debug: false,
      port: 8080,
    };
    assert(Config.validate(config), 'Config valide');
  });

  await test('Config.validate devrait rejeter un appName vide', () => {
    const config: Config = {
      appName: '',
      version: '1.0.0',
      debug: false,
      port: 8080,
    };
    assert(!Config.validate(config), 'AppName vide devrait etre invalide');
  });

  // --- Tests AppConfig ---
  await test('getConfig devrait retourner la config', () => {
    const config = getConfig();
    assertEqual(config.apiUrl, 'https://api.example.com');
    assertEqual(config.environment, 'production');
  });

  await test('isFeatureEnabled devrait retourner true pour un feature actif', () => {
    assert(isFeatureEnabled('auth'));
    assert(isFeatureEnabled('dashboard'));
  });

  await test('isFeatureEnabled devrait retourner false pour un feature inactif', () => {
    assert(!isFeatureEnabled('beta-feature'));
  });

  // --- Tests ApiResponse ---
  await test('isSuccess devrait identifier une reponse reussie', () => {
    const response: ApiResponse<string> = { status: 'success', data: 'hello' };
    assert(isSuccess(response));
    assert(!isError(response));
  });

  await test('isError devrait identifier une reponse en erreur', () => {
    const response: ApiResponse<string> = { status: 'error', message: 'Not found', code: 404 };
    assert(isError(response));
    assert(!isSuccess(response));
  });

  await test('unwrap devrait extraire les donnees d\'un succes', () => {
    const response: ApiResponse<number> = { status: 'success', data: 42 };
    assertEqual(unwrap(response), 42);
  });

  await test('unwrap devrait lever une erreur pour une erreur', () => {
    const response: ApiResponse<number> = { status: 'error', message: 'Erreur serveur', code: 500 };
    let threw = false;
    try {
      unwrap(response);
    } catch (e) {
      threw = true;
      assert(e instanceof Error);
    }
    assert(threw, 'Devrait lever une erreur');
  });

  summary();
}

main();
