// =============================================================================
// Lab 12 — Mapped Types et Template Literal Types
// =============================================================================
// Objectifs :
//   - DeepReadonly<T>
//   - EventHandlers<T>
//   - Template Literal CSS types
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
// Creez un type recursif qui rend toutes les proprietes readonly,
// y compris les sous-objets imbriques.
//
// DeepReadonly<{ a: { b: { c: number } } }>
// = { readonly a: { readonly b: { readonly c: number } } }
// =============================================================================

// TODO: Implementez DeepReadonly<T>
// - Si T est un type primitif (string, number, boolean, etc.), retournez T
// - Si T est un tableau, retournez un readonly tableau de DeepReadonly<elements>
// - Si T est un objet, rendez chaque propriete readonly et appliquez DeepReadonly recursivement
//
// Indice : utilisez un conditional type pour distinguer les cas
//
// type DeepReadonly<T> = ???
type DeepReadonly<T> = any; // <-- Remplacez

// TODO: Implementez une fonction deepFreeze qui rend un objet profondement immutable
function deepFreeze<T extends Record<string, unknown>>(obj: T): DeepReadonly<T> {
  // TODO: Utilisez Object.freeze recursivement
  return obj as any;
}

// Interface de test pour DeepReadonly
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
// A partir d'un objet dont les cles representent des evenements,
// generez un type avec des handlers nommes on + Cle capitalisee.
//
// Exemple :
// type Events = { click: MouseEvent; change: string };
// EventHandlers<Events> = {
//   onClick: (event: MouseEvent) => void;
//   onChange: (event: string) => void;
// }
// =============================================================================

// TODO: Implementez Capitalize<S> manuellement (ou utilisez la version native)
// TypeScript fournit Capitalize<S> nativement depuis 4.1
// Mais pour l'exercice, vous pouvez l'utiliser directement.

// TODO: Implementez EventHandlers<T>
// - Pour chaque cle K de T, creez une propriete `on${Capitalize<K>}`
// - La valeur est une fonction (event: T[K]) => void
//
// Indice : utilisez `as` dans le mapped type pour renommer les cles
// { [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void }
//
// type EventHandlers<T> = ???
type EventHandlers<T> = any; // <-- Remplacez

// TODO: Implementez Getters<T> — genere des getters pour chaque propriete
// Getters<{ name: string; age: number }>
// = { getName: () => string; getAge: () => number }
//
// type Getters<T> = ???
type Getters<T> = any; // <-- Remplacez

// TODO: Implementez Setters<T> — genere des setters pour chaque propriete
// Setters<{ name: string; age: number }>
// = { setName: (value: string) => void; setAge: (value: number) => void }
//
// type Setters<T> = ???
type Setters<T> = any; // <-- Remplacez

// TODO: Implementez une fonction createEventHandlers qui prend un objet
// de handlers et retourne un objet type EventHandlers
function createEventHandlers<T extends Record<string, unknown>>(
  handlers: { [K in keyof T]: (event: T[K]) => void }
): EventHandlers<T> {
  // TODO: Transformez les cles de "click" en "onClick", etc.
  const result: Record<string, unknown> = {};
  return result as any;
}

// TODO: Implementez createGetters qui cree des getters pour un objet
function createGetters<T extends Record<string, unknown>>(obj: T): Getters<T> {
  // TODO: Pour chaque propriete, creez un getter getNom -> () => obj.nom
  const result: Record<string, unknown> = {};
  return result as any;
}

// =============================================================================
// Exercice 3 : Template Literal CSS Types
// Utilisez les template literal types pour creer un systeme de
// proprietes CSS type-safe.
// =============================================================================

// TODO: Definissez un type CSSUnit pour les unites CSS courantes
// 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw'
type CSSUnit = any; // <-- Remplacez

// TODO: Definissez un type CSSValue qui combine un nombre et une unite
// Exemples : '10px', '1.5em', '100%'
// Indice : `${number}${CSSUnit}`
//
// type CSSValue = ???
type CSSValue = any; // <-- Remplacez

// TODO: Definissez un type CSSColor pour les couleurs hex et nommees
// Hex : `#${string}` (simplifie)
// Nommees : 'red' | 'blue' | 'green' | 'black' | 'white' | 'transparent'
//
// type CSSColor = ???
type CSSColor = any; // <-- Remplacez

// TODO: Definissez un type pour les proprietes de margin/padding
// qui accepte 1, 2, 3, ou 4 valeurs CSSValue separees par des espaces
// Exemples : '10px', '10px 20px', '10px 20px 10px', '10px 20px 10px 20px'
//
// type CSSSpacing = ???
type CSSSpacing = any; // <-- Remplacez

// TODO: Definissez un type pour les proprietes de border
// Format : `${CSSValue} ${'solid' | 'dashed' | 'dotted'} ${CSSColor}`
// Exemple : '1px solid #000000'
//
// type CSSBorder = any; // <-- Remplacez
type CSSBorder = any; // <-- Remplacez

// TODO: Creez une interface CSSProperties type-safe avec les proprietes suivantes :
// - width, height, margin, padding : CSSValue | 'auto'
// - color, backgroundColor : CSSColor
// - border : CSSBorder
// - display : 'block' | 'inline' | 'flex' | 'grid' | 'none'
// - position : 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
// Toutes les proprietes sont optionnelles
//
// interface CSSProperties {
//   ???
// }
interface CSSProperties {
  // TODO: Definissez les proprietes CSS
}

// TODO: Implementez une fonction css qui prend un objet CSSProperties
// et retourne une chaine CSS valide
function css(properties: CSSProperties): string {
  // TODO: Convertissez les proprietes en kebab-case et creez la chaine
  // Exemple : { backgroundColor: 'red', display: 'flex' }
  //        -> 'background-color: red; display: flex;'
  return ''; // <-- Remplacez
}

// TODO: Implementez un type qui convertit camelCase en kebab-case
// CamelToKebab<'backgroundColor'> = 'background-color'
// CamelToKebab<'fontSize'> = 'font-size'
//
// Indice : utilisez infer avec les template literals et Lowercase
// type CamelToKebab<S extends string> = ???
type CamelToKebab<S extends string> = any; // <-- Remplacez

// TODO: Implementez un type qui convertit kebab-case en camelCase
// KebabToCamel<'background-color'> = 'backgroundColor'
// KebabToCamel<'font-size'> = 'fontSize'
//
// type KebabToCamel<S extends string> = ???
type KebabToCamel<S extends string> = any; // <-- Remplacez

// =============================================================================
// Tests — Ne modifiez pas cette section
// =============================================================================

async function main() {
  console.log('\n🧪 Lab 12 — Mapped Types et Template Literal Types\n');

  // --- Exercice 1 : DeepReadonly ---
  await test('Ex1 — DeepReadonly rend les sous-objets readonly', () => {
    type ReadonlyConfig = DeepReadonly<Config>;
    // Verification compile-time : ces types doivent etre corrects
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

    // Tenter de modifier doit echouer silencieusement (ou lancer en strict)
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
