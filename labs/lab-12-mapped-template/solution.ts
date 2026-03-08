// =============================================================================
// Lab 12 — Mapped Types et Template Literal Types (SOLUTION)
// =============================================================================
// Ce fichier contient les solutions completes de tous les exercices.
// =============================================================================

import { createTestRunner } from '../test-utils.ts';
const { test, assert, assertEqual, assertDeepEqual, summary } = createTestRunner('Lab 12 — Mapped Types et Template Literal Types');

// =============================================================================
// Helper : Assertion de type compile-time
// =============================================================================

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// =============================================================================
// Exercice 1 : DeepReadonly<T>
// =============================================================================

type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function deepFreeze<T extends Record<string, unknown>>(obj: T): DeepReadonly<T> {
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as Record<string, unknown>);
    }
  }
  return obj as DeepReadonly<T>;
}

interface Config {
  serveur: {
    host: string;
    port: number;
    ssl: {
      active: boolean;
      certificat: string;
    };
  };
  base_de_donnees: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  tags: string[];
}

// =============================================================================
// Exercice 2 : EventHandlers<T>
// =============================================================================

type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

function createEventHandlers<T extends Record<string, unknown>>(
  handlers: { [K in keyof T]: (event: T[K]) => void }
): EventHandlers<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(handlers) as (string & keyof T)[]) {
    const capitalizedKey = `on${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    result[capitalizedKey] = handlers[key];
  }
  return result as EventHandlers<T>;
}

function createGetters<T extends Record<string, unknown>>(obj: T): Getters<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const capitalizedKey = `get${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    result[capitalizedKey] = () => obj[key];
  }
  return result as Getters<T>;
}

// =============================================================================
// Exercice 3 : Template Literal CSS Types
// =============================================================================

type CSSUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw';

type CSSValue = `${number}${CSSUnit}`;

type CSSColor =
  | `#${string}`
  | 'red'
  | 'blue'
  | 'green'
  | 'black'
  | 'white'
  | 'transparent';

type CSSSpacing =
  | CSSValue
  | `${CSSValue} ${CSSValue}`
  | `${CSSValue} ${CSSValue} ${CSSValue}`
  | `${CSSValue} ${CSSValue} ${CSSValue} ${CSSValue}`;

type CSSBorder = `${CSSValue} ${'solid' | 'dashed' | 'dotted'} ${CSSColor}`;

interface CSSProperties {
  width?: CSSValue | 'auto';
  height?: CSSValue | 'auto';
  margin?: CSSValue | 'auto';
  padding?: CSSValue | 'auto';
  color?: CSSColor;
  backgroundColor?: CSSColor;
  border?: CSSBorder;
  display?: 'block' | 'inline' | 'flex' | 'grid' | 'none';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
}

// Convertit camelCase en kebab-case a l'execution
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function css(properties: CSSProperties): string {
  return Object.entries(properties)
    .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
    .join(' ');
}

// CamelCase -> kebab-case au niveau type
type CamelToKebab<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${CamelToKebab<Tail>}`
      : `-${Lowercase<Head>}${CamelToKebab<Tail>}`
    : `${Head}${CamelToKebab<Tail>}`
  : S;

// kebab-case -> camelCase au niveau type
type KebabToCamel<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<KebabToCamel<Tail>>}`
  : S;

// =============================================================================
// Tests
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 12 — Mapped Types et Template Literal Types\n');

  // --- Exercice 1 : DeepReadonly ---
  await test('Ex1 — DeepReadonly rend les sous-objets readonly', () => {
    type ReadonlyConfig = DeepReadonly<Config>;
    type T1 = Expect<Equal<ReadonlyConfig['serveur']['host'], string>>;
    type T2 = Expect<Equal<ReadonlyConfig['serveur']['ssl']['active'], boolean>>;
    assert(true, 'DeepReadonly compile correctement');
  });

  await test('Ex1 — deepFreeze empeche les modifications', () => {
    const config = {
      serveur: {
        host: 'localhost',
        port: 3000,
      },
    };
    const frozen = deepFreeze(config as Record<string, unknown>);
    assertEqual((frozen as any).serveur.host, 'localhost');

    try {
      (frozen as any).serveur.host = 'changed';
    } catch {
      // Expected en mode strict
    }
    assertEqual((frozen as any).serveur.host, 'localhost');
  });

  await test('Ex1 — deepFreeze gele les tableaux aussi', () => {
    const data = { items: [1, 2, 3] };
    const frozen = deepFreeze(data as Record<string, unknown>);
    try {
      (frozen as any).items.push(4);
    } catch {
      // Expected
    }
    assertEqual((frozen as any).items.length, 3);
  });

  // --- Exercice 2 : EventHandlers ---
  await test('Ex2 — EventHandlers genere les bons noms', () => {
    type Events = { click: MouseEvent; change: string; submit: FormData };
    type Handlers = EventHandlers<Events>;
    type T1 = Expect<Equal<keyof Handlers, 'onClick' | 'onChange' | 'onSubmit'>>;
    assert(true, 'EventHandlers genere les bons noms de cles');
  });

  await test('Ex2 — createEventHandlers transforme les cles', () => {
    const handlers = createEventHandlers<{ click: string; submit: number }>({
      click: (event) => {},
      submit: (event) => {},
    });
    assert('onClick' in handlers, 'onClick doit etre present');
    assert('onSubmit' in handlers, 'onSubmit doit etre present');
  });

  await test('Ex2 — Getters genere les bons noms', () => {
    type Props = { name: string; age: number };
    type G = Getters<Props>;
    type T1 = Expect<Equal<keyof G, 'getName' | 'getAge'>>;
    type T2 = Expect<Equal<G['getName'], () => string>>;
    type T3 = Expect<Equal<G['getAge'], () => number>>;
    assert(true, 'Getters compile correctement');
  });

  await test('Ex2 — createGetters fonctionne a l\'execution', () => {
    const obj = { name: 'Alice', age: 30 };
    const getters = createGetters(obj as Record<string, unknown>);
    assertEqual((getters as any).getName(), 'Alice');
    assertEqual((getters as any).getAge(), 30);
  });

  await test('Ex2 — Setters genere les bons noms', () => {
    type Props = { name: string; age: number };
    type S = Setters<Props>;
    type T1 = Expect<Equal<keyof S, 'setName' | 'setAge'>>;
    type T2 = Expect<Equal<S['setName'], (value: string) => void>>;
    type T3 = Expect<Equal<S['setAge'], (value: number) => void>>;
    assert(true, 'Setters compile correctement');
  });

  // --- Exercice 3 : Template Literal CSS ---
  await test('Ex3 — CSSValue accepte les bonnes valeurs', () => {
    const v1: CSSValue = '10px';
    const v2: CSSValue = '1.5em';
    const v3: CSSValue = '100%';
    const v4: CSSValue = '50vh';
    assert(true, 'CSSValue accepte les bonnes valeurs');
  });

  await test('Ex3 — CSSColor accepte hex et nommees', () => {
    const c1: CSSColor = '#FF0000';
    const c2: CSSColor = 'red';
    const c3: CSSColor = 'transparent';
    assert(true, 'CSSColor accepte les bonnes valeurs');
  });

  await test('Ex3 — CSSBorder est correctement type', () => {
    const b1: CSSBorder = '1px solid #000000';
    const b2: CSSBorder = '2px dashed red';
    assert(true, 'CSSBorder accepte les bonnes valeurs');
  });

  await test('Ex3 — css() genere une chaine CSS', () => {
    const result = css({
      display: 'flex',
      position: 'relative',
    });
    assert(result.includes('display: flex'), 'Doit contenir display: flex');
    assert(result.includes('position: relative'), 'Doit contenir position: relative');
  });

  await test('Ex3 — css() convertit en kebab-case', () => {
    const result = css({
      backgroundColor: 'red',
    });
    assert(result.includes('background-color'), 'backgroundColor doit devenir background-color');
  });

  await test('Ex3 — CamelToKebab convertit correctement', () => {
    type T1 = Expect<Equal<CamelToKebab<'backgroundColor'>, 'background-color'>>;
    type T2 = Expect<Equal<CamelToKebab<'fontSize'>, 'font-size'>>;
    type T3 = Expect<Equal<CamelToKebab<'display'>, 'display'>>;
    type T4 = Expect<Equal<CamelToKebab<'borderTopLeftRadius'>, 'border-top-left-radius'>>;
    assert(true, 'CamelToKebab compile correctement');
  });

  await test('Ex3 — KebabToCamel convertit correctement', () => {
    type T1 = Expect<Equal<KebabToCamel<'background-color'>, 'backgroundColor'>>;
    type T2 = Expect<Equal<KebabToCamel<'font-size'>, 'fontSize'>>;
    type T3 = Expect<Equal<KebabToCamel<'display'>, 'display'>>;
    assert(true, 'KebabToCamel compile correctement');
  });

  summary();
}

main();
